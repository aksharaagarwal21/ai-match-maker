require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const morgan = require("morgan");
const axios = require("axios");
const db = require("./config/db");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const projectRoutes = require("./routes/projects");
const messageRoutes = require("./routes/messages");
const blockchainRoutes = require("./routes/blockchain");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8001";

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

// ─── REST Routes ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ status: "ok", service: "TechTitans Backend" }));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/blockchain", blockchainRoutes);

// ─── Room state tracking ───────────────────────────────────────────────────────
const roomParticipants = new Map(); // roomId -> Map<socketId, userInfo>
const roomTimers = new Map();       // roomId -> lastActivityTimestamp
const facilitatorTimers = new Map(); // roomId -> setTimeout handle

function getRoomParticipants(roomId) {
    return Array.from((roomParticipants.get(roomId) || new Map()).values());
}

async function saveMessage(projectId, userId, message, translatedMessage, domain, type = "user") {
    try {
        const [result] = await db.execute(
            "INSERT INTO messages (project_id, user_id, message, translated_message, sender_domain, message_type) VALUES (?, ?, ?, ?, ?, ?)",
            [projectId, userId, message, translatedMessage || null, domain || null, type]
        );
        return result.insertId;
    } catch (e) {
        console.error("Save message error:", e.message);
        return null;
    }
}

async function triggerFacilitator(roomId) {
    try {
        const participants = getRoomParticipants(roomId);
        if (participants.length < 1) return;

        // Get recent messages for context
        const [messages] = await db.execute(
            `SELECT m.message, m.sender_domain, u.name as user_name 
       FROM messages m JOIN users u ON m.user_id = u.id
       WHERE m.project_id = ? AND m.message_type = 'user' 
       ORDER BY m.created_at DESC LIMIT 15`,
            [roomId]
        );

        const [project] = await db.execute("SELECT title FROM projects WHERE id = ?", [roomId]);
        const topic = project[0]?.title || "Cross-domain collaboration";

        const aiResponse = await axios.post(`${AI_SERVICE_URL}/facilitate`, {
            conversation: messages.reverse(),
            participants: participants.map((p) => ({ name: p.name, domain: p.domain })),
            topic,
        });

        const suggestion = aiResponse.data.suggestion;

        // Save facilitator message to DB
        await db.execute(
            "INSERT INTO messages (project_id, user_id, message, message_type) VALUES (?, ?, ?, 'ai_facilitator')",
            [roomId, participants[0]?.userId || 1, suggestion]
        );

        // Broadcast to room
        io.to(String(roomId)).emit("facilitator_suggestion", {
            suggestion,
            timestamp: new Date().toISOString(),
        });
    } catch (e) {
        console.warn("Facilitator error:", e.message);
        // Fallback suggestion
        io.to(String(roomId)).emit("facilitator_suggestion", {
            suggestion: "What specific outcome are you hoping to achieve together in this session?",
            timestamp: new Date().toISOString(),
        });
    }
}

function resetFacilitatorTimer(roomId) {
    // Clear existing timer
    if (facilitatorTimers.has(roomId)) {
        clearTimeout(facilitatorTimers.get(roomId));
    }
    // Set 30-second inactivity timer
    const timer = setTimeout(() => {
        const participants = getRoomParticipants(roomId);
        if (participants.length > 0) {
            triggerFacilitator(roomId);
        }
        facilitatorTimers.delete(roomId);
    }, 30000);

    facilitatorTimers.set(roomId, timer);
}

// ─── Socket.io ────────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join a collaboration room
    socket.on("join_room", async ({ roomId, userId, userName, userDomain }) => {
        const roomIdStr = String(roomId);
        socket.join(roomIdStr);

        if (!roomParticipants.has(roomIdStr)) {
            roomParticipants.set(roomIdStr, new Map());
        }

        const userInfo = { socketId: socket.id, userId, name: userName, domain: userDomain };
        roomParticipants.get(roomIdStr).set(socket.id, userInfo);

        const participants = getRoomParticipants(roomIdStr);

        // Notify room that user joined
        io.to(roomIdStr).emit("user_joined", {
            userId,
            userName,
            userDomain,
            participants,
            timestamp: new Date().toISOString(),
        });

        // Send current participants to the joining user
        socket.emit("room_state", { participants });

        console.log(`User ${userName} joined room ${roomIdStr}`);
        resetFacilitatorTimer(roomIdStr);
    });

    // Handle new chat message
    socket.on("send_message", async ({ roomId, userId, userName, userDomain, message }) => {
        const roomIdStr = String(roomId);
        const participants = getRoomParticipants(roomIdStr);

        // Find other participants' domains for translation
        const otherParticipants = participants.filter((p) => p.userId !== userId);
        const receiverDomain =
            otherParticipants.length > 0 ? otherParticipants[0].domain : "General";

        let translatedMessage = null;

        // Translate if domains differ
        if (userDomain && receiverDomain && userDomain !== receiverDomain) {
            try {
                const aiResponse = await axios.post(`${AI_SERVICE_URL}/translate`, {
                    message,
                    sender_domain: userDomain,
                    receiver_domain: receiverDomain,
                });
                translatedMessage = aiResponse.data.translated;
                if (translatedMessage === message) translatedMessage = null;
            } catch (e) {
                console.warn("Translation failed:", e.message);
            }
        }

        // Save to DB
        const messageId = await saveMessage(roomId, userId, message, translatedMessage, userDomain);

        // Broadcast to room
        const messageData = {
            id: messageId,
            roomId,
            userId,
            userName,
            userDomain,
            message,
            translatedMessage,
            timestamp: new Date().toISOString(),
        };

        io.to(roomIdStr).emit("receive_message", messageData);

        // Reset inactivity timer
        resetFacilitatorTimer(roomIdStr);
    });

    // User typing indicator
    socket.on("typing", ({ roomId, userName }) => {
        socket.to(String(roomId)).emit("user_typing", { userName });
    });

    // Stop typing
    socket.on("stop_typing", ({ roomId, userName }) => {
        socket.to(String(roomId)).emit("user_stopped_typing", { userName });
    });

    // Manual facilitator trigger
    socket.on("request_facilitate", ({ roomId }) => {
        triggerFacilitator(String(roomId));
    });

    // Handle disconnect
    socket.on("disconnect", () => {
        for (const [roomId, participants] of roomParticipants.entries()) {
            if (participants.has(socket.id)) {
                const user = participants.get(socket.id);
                participants.delete(socket.id);

                io.to(roomId).emit("user_left", {
                    userId: user.userId,
                    userName: user.name,
                    participants: Array.from(participants.values()),
                    timestamp: new Date().toISOString(),
                });

                if (participants.size === 0) {
                    roomParticipants.delete(roomId);
                    if (facilitatorTimers.has(roomId)) {
                        clearTimeout(facilitatorTimers.get(roomId));
                        facilitatorTimers.delete(roomId);
                    }
                }
            }
        }
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

// ─── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`✅ TechTitans Backend running on http://localhost:${PORT}`);
    console.log(`   AI Service: ${AI_SERVICE_URL}`);
});
