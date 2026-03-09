const express = require("express");
const router = express.Router();
const db = require("../config/db");
const axios = require("axios");
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const { authenticateToken } = require("../middleware/auth");
require("dotenv").config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8001";

function getBlockchainContract() {
    try {
        const deploymentPath = path.join(__dirname, "../../blockchain/deployment.json");
        const abiPath = path.join(__dirname, "../../blockchain/abi.json");

        if (!fs.existsSync(deploymentPath) || !fs.existsSync(abiPath)) {
            return null;
        }

        const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
        const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));

        const provider = new ethers.JsonRpcProvider(
            process.env.BLOCKCHAIN_RPC || "http://127.0.0.1:8545"
        );

        // Use a throwaway signer for local dev
        const wallet = process.env.PRIVATE_KEY
            ? new ethers.Wallet(process.env.PRIVATE_KEY, provider)
            : new ethers.Wallet(
                "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // Hardhat default account
                provider
            );

        return new ethers.Contract(deployment.address, abi, wallet);
    } catch (e) {
        console.warn("Blockchain contract not available:", e.message);
        return null;
    }
}

// POST /api/blockchain/log/:projectId - Summarize + log to blockchain
router.post("/log/:projectId", authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;

        // Get project info
        const [projects] = await db.execute(
            "SELECT * FROM projects WHERE id = ?",
            [projectId]
        );
        if (projects.length === 0) return res.status(404).json({ error: "Project not found" });

        // Get messages
        const [messages] = await db.execute(
            `SELECT m.message, m.sender_domain, u.name as user_name, u.domain
       FROM messages m JOIN users u ON m.user_id = u.id
       WHERE m.project_id = ? AND m.message_type = 'user' ORDER BY m.created_at ASC`,
            [projectId]
        );

        // Get members
        const [members] = await db.execute(
            `SELECT u.name, u.domain FROM project_members pm JOIN users u ON pm.user_id = u.id WHERE pm.project_id = ?`,
            [projectId]
        );

        // Generate summary via AI service
        let summaryText = "";
        let summaryHash = "";

        try {
            const aiResponse = await axios.post(`${AI_SERVICE_URL}/summarize`, {
                conversation: messages.map((m) => ({
                    user_name: m.user_name,
                    sender_domain: m.sender_domain || m.domain,
                    message: m.message,
                })),
                participants: members,
                topic: projects[0].title,
            });
            summaryText = aiResponse.data.summary;
            summaryHash = aiResponse.data.hash;
        } catch (aiErr) {
            const crypto = require("crypto");
            summaryText = `Collaboration session for: ${projects[0].title}. ${messages.length} messages exchanged by ${members.length} participants.`;
            summaryHash = crypto.createHash("sha256").update(summaryText).digest("hex");
        }

        // Attempt blockchain logging
        let txHash = null;
        const contract = getBlockchainContract();
        if (contract) {
            try {
                const memberAddresses = members.map(() =>
                    ethers.Wallet.createRandom().address
                );
                const tx = await contract.logContribution(
                    String(projectId),
                    summaryHash,
                    "", // IPFS hash - empty for MVP
                    memberAddresses
                );
                await tx.wait();
                txHash = tx.hash;
                console.log("Blockchain tx:", txHash);
            } catch (bcErr) {
                console.warn("Blockchain logging failed:", bcErr.message);
            }
        }

        // Save to database
        const [result] = await db.execute(
            "INSERT INTO contributions (project_id, summary_text, summary_hash, blockchain_tx, blockchain_network, contributors) VALUES (?, ?, ?, ?, ?, ?)",
            [
                projectId,
                summaryText,
                summaryHash,
                txHash || `simulated_${summaryHash.slice(0, 16)}`,
                txHash ? "localhost" : "simulated",
                JSON.stringify(members.map((m) => m.name)),
            ]
        );

        // Mark project as completed
        await db.execute(
            "UPDATE projects SET status = 'completed' WHERE id = ?",
            [projectId]
        );

        const [contributions] = await db.execute(
            "SELECT * FROM contributions WHERE id = ?",
            [result.insertId]
        );

        res.json({
            success: true,
            contribution: contributions[0],
            summary: summaryText,
            hash: summaryHash,
            tx: txHash,
        });
    } catch (error) {
        console.error("Blockchain log error:", error);
        res.status(500).json({ error: "Failed to log to blockchain", detail: error.message });
    }
});

// GET /api/blockchain/:projectId - Get contribution proof
router.get("/:projectId", authenticateToken, async (req, res) => {
    try {
        const [contributions] = await db.execute(
            "SELECT * FROM contributions WHERE project_id = ? ORDER BY created_at DESC LIMIT 1",
            [req.params.projectId]
        );
        if (contributions.length === 0) {
            return res.status(404).json({ error: "No blockchain record found for this project" });
        }
        res.json(contributions[0]);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch blockchain record" });
    }
});

module.exports = router;
