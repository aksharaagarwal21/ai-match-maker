const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

// POST /api/projects - Create a new project/room
router.post("/", authenticateToken, async (req, res) => {
    try {
        const { title, description, problem_statement } = req.body;
        if (!title) return res.status(400).json({ error: "Title is required" });

        const [result] = await db.execute(
            "INSERT INTO projects (title, description, problem_statement, created_by) VALUES (?, ?, ?, ?)",
            [title, description || null, problem_statement || null, req.user.id]
        );

        const projectId = result.insertId;

        // Add creator as member
        await db.execute(
            "INSERT INTO project_members (project_id, user_id) VALUES (?, ?)",
            [projectId, req.user.id]
        );

        const [projects] = await db.execute(
            `SELECT p.*, u.name as creator_name, u.domain as creator_domain 
       FROM projects p JOIN users u ON p.created_by = u.id WHERE p.id = ?`,
            [projectId]
        );

        res.status(201).json(projects[0]);
    } catch (error) {
        console.error("Create project error:", error);
        res.status(500).json({ error: "Failed to create project" });
    }
});

// GET /api/projects - List all active projects
router.get("/", authenticateToken, async (req, res) => {
    try {
        const [projects] = await db.execute(
            `SELECT p.*, u.name as creator_name, u.domain as creator_domain,
       (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count,
       (SELECT COUNT(*) FROM messages m WHERE m.project_id = p.id) as message_count
       FROM projects p JOIN users u ON p.created_by = u.id
       WHERE p.status != 'archived' ORDER BY p.created_at DESC`
        );
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch projects" });
    }
});

// GET /api/projects/my - Get current user's projects
router.get("/my", authenticateToken, async (req, res) => {
    try {
        const [projects] = await db.execute(
            `SELECT p.*, u.name as creator_name, u.domain as creator_domain,
       (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count
       FROM projects p JOIN users u ON p.created_by = u.id
       JOIN project_members pm2 ON pm2.project_id = p.id AND pm2.user_id = ?
       ORDER BY p.created_at DESC`,
            [req.user.id]
        );
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch your projects" });
    }
});

// GET /api/projects/:id - Get project details
router.get("/:id", authenticateToken, async (req, res) => {
    try {
        const [projects] = await db.execute(
            `SELECT p.*, u.name as creator_name, u.domain as creator_domain
       FROM projects p JOIN users u ON p.created_by = u.id WHERE p.id = ?`,
            [req.params.id]
        );
        if (projects.length === 0) return res.status(404).json({ error: "Project not found" });

        // Get members
        const [members] = await db.execute(
            `SELECT u.id, u.name, u.domain, u.organization, u.skills, pm.joined_at
       FROM project_members pm JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = ?`,
            [req.params.id]
        );

        res.json({ ...projects[0], members });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch project" });
    }
});

// POST /api/projects/:id/join - Join a project
router.post("/:id/join", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [projects] = await db.execute("SELECT id FROM projects WHERE id = ?", [id]);
        if (projects.length === 0) return res.status(404).json({ error: "Project not found" });

        try {
            await db.execute(
                "INSERT INTO project_members (project_id, user_id) VALUES (?, ?)",
                [id, req.user.id]
            );
        } catch (e) {
            if (e.code !== "ER_DUP_ENTRY") throw e;
        }

        res.json({ success: true, message: "Joined project successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to join project" });
    }
});

// PATCH /api/projects/:id/status - Update project status
router.patch("/:id/status", authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        if (!["active", "completed", "archived"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }
        await db.execute(
            "UPDATE projects SET status = ? WHERE id = ? AND created_by = ?",
            [status, req.params.id, req.user.id]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to update status" });
    }
});

module.exports = router;
