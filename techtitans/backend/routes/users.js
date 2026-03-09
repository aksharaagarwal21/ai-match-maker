const express = require("express");
const router = express.Router();
const db = require("../config/db");
const axios = require("axios");
const { authenticateToken } = require("../middleware/auth");
require("dotenv").config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8001";

// GET /api/users/me - Get current user
router.get("/me", authenticateToken, async (req, res) => {
    try {
        const [users] = await db.execute(
            "SELECT id, name, email, domain, organization, skills, problem_statement, avatar_url, created_at FROM users WHERE id = ?",
            [req.user.id]
        );
        if (users.length === 0) return res.status(404).json({ error: "User not found" });
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch user" });
    }
});

// PUT /api/users/me - Update current user profile
router.put("/me", authenticateToken, async (req, res) => {
    try {
        const { name, domain, organization, skills, problem_statement } = req.body;
        await db.execute(
            "UPDATE users SET name=?, domain=?, organization=?, skills=?, problem_statement=? WHERE id=?",
            [name, domain, organization, skills, problem_statement, req.user.id]
        );

        const [users] = await db.execute(
            "SELECT id, name, email, domain, organization, skills, problem_statement, avatar_url, created_at FROM users WHERE id = ?",
            [req.user.id]
        );

        // Upsert to Pinecone in background
        axios.post(`${AI_SERVICE_URL}/upsert-user`, { user: users[0] }).catch(() => { });

        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ error: "Failed to update profile" });
    }
});

// GET /api/users - Get all users (for admin/matching)
router.get("/", authenticateToken, async (req, res) => {
    try {
        const [users] = await db.execute(
            "SELECT id, name, email, domain, organization, skills, problem_statement, created_at FROM users"
        );
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// GET /api/users/:id - Get user by ID
router.get("/:id", authenticateToken, async (req, res) => {
    try {
        const [users] = await db.execute(
            "SELECT id, name, email, domain, organization, skills, problem_statement, created_at FROM users WHERE id = ?",
            [req.params.id]
        );
        if (users.length === 0) return res.status(404).json({ error: "User not found" });
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch user" });
    }
});

// POST /api/users/match - Find matching experts
router.post("/match", authenticateToken, async (req, res) => {
    try {
        const { problem_statement, top_k } = req.body;

        // Get current user
        const [currentUsers] = await db.execute(
            "SELECT id, name, domain, skills, organization, problem_statement FROM users WHERE id = ?",
            [req.user.id]
        );
        if (currentUsers.length === 0) return res.status(404).json({ error: "User not found" });
        const currentUser = currentUsers[0];

        // Override problem_statement if provided
        if (problem_statement) currentUser.problem_statement = problem_statement;

        // Get all other users
        const [allUsers] = await db.execute(
            "SELECT id, name, domain, skills, organization, problem_statement FROM users WHERE id != ?",
            [req.user.id]
        );

        // Call AI service for matching
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/match`, {
            target_user: currentUser,
            all_users: allUsers,
            top_k: top_k || 5,
        });

        // Enrich with full user data
        const matchedIds = aiResponse.data.matches.map((m) => m.user_id).filter(Boolean);
        let enrichedMatches = aiResponse.data.matches;

        if (matchedIds.length > 0) {
            const [fullUsers] = await db.execute(
                `SELECT id, name, email, domain, organization, skills, problem_statement FROM users WHERE id IN (${matchedIds.map(() => "?").join(",")})`,
                matchedIds
            );
            const userMap = Object.fromEntries(fullUsers.map((u) => [u.id, u]));
            enrichedMatches = aiResponse.data.matches.map((m) => ({
                ...m,
                ...(userMap[m.user_id] || {}),
            }));
        }

        res.json({ matches: enrichedMatches });
    } catch (error) {
        console.error("Match error:", error.message);
        res.status(500).json({ error: "Matching failed", detail: error.message });
    }
});

module.exports = router;
