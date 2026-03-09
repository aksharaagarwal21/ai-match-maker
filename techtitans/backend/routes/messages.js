const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

// GET /api/messages/:projectId - Get message history
router.get("/:projectId", authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;
        const limit = parseInt(req.query.limit) || 100;

        const [messages] = await db.execute(
            `SELECT m.*, u.name as user_name, u.domain as sender_domain
       FROM messages m JOIN users u ON m.user_id = u.id
       WHERE m.project_id = ? ORDER BY m.created_at ASC LIMIT ?`,
            [projectId, limit]
        );
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});

// POST /api/messages - Save a message (used internally by socket handler)
router.post("/", authenticateToken, async (req, res) => {
    try {
        const { project_id, message, translated_message, message_type } = req.body;

        const [result] = await db.execute(
            "INSERT INTO messages (project_id, user_id, message, translated_message, sender_domain, message_type) VALUES (?, ?, ?, ?, ?, ?)",
            [
                project_id,
                req.user.id,
                message,
                translated_message || null,
                req.body.sender_domain || null,
                message_type || "user",
            ]
        );

        const [messages] = await db.execute(
            `SELECT m.*, u.name as user_name, u.domain as sender_domain
       FROM messages m JOIN users u ON m.user_id = u.id WHERE m.id = ?`,
            [result.insertId]
        );

        res.status(201).json(messages[0]);
    } catch (error) {
        res.status(500).json({ error: "Failed to save message" });
    }
});

module.exports = router;
