const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
require("dotenv").config();

// POST /api/auth/register
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, domain, organization, skills, problem_statement } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email, and password are required" });
        }

        // Check if user already exists
        const [existing] = await db.execute("SELECT id FROM users WHERE email = ?", [email]);
        if (existing.length > 0) {
            return res.status(409).json({ error: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const [result] = await db.execute(
            "INSERT INTO users (name, email, password, domain, organization, skills, problem_statement) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [name, email, hashedPassword, domain || null, organization || null, skills || null, problem_statement || null]
        );

        const userId = result.insertId;
        const token = jwt.sign(
            { id: userId, email, name },
            process.env.JWT_SECRET || "fallback_secret",
            { expiresIn: "7d" }
        );

        const [users] = await db.execute(
            "SELECT id, name, email, domain, organization, skills, problem_statement, created_at FROM users WHERE id = ?",
            [userId]
        );

        res.status(201).json({ token, user: users[0] });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ error: "Registration failed" });
    }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const user = users[0];
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            process.env.JWT_SECRET || "fallback_secret",
            { expiresIn: "7d" }
        );

        const { password: _, ...userWithoutPassword } = user;
        res.json({ token, user: userWithoutPassword });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Login failed" });
    }
});

module.exports = router;
