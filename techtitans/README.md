# TechTitans — AI Matchmaking Platform for Cross-Industry Innovation

> **Foundathon 2026 · Track 4: AI Matchmaking for Cross-Industry Innovation**

A full-stack platform that **matches experts from different disciplines**, **translates technical jargon in real time**, **facilitates brainstorming with AI**, and **logs collaboration proof to the blockchain**.

---

## 🏗️ Architecture

```
techtitans/
├── frontend/       Next.js 14 (UI)                      → Port 3000
├── backend/        Node.js + Express + Socket.io (API)  → Port 5000
├── ai-service/     Python + FastAPI + LangChain (AI)    → Port 8001
├── blockchain/     Hardhat + Solidity (Smart Contracts)
└── database/       MySQL schema
```

---

## ⚙️ Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18+ | `node -v` |
| Python | 3.9+ | `python --version` |
| MySQL | 8.0+ | Must be running |
| Git | Any | — |

---

## 🚀 Quick Setup (Step by Step)

### Step 1 — MySQL Database

```bash
# Open MySQL CLI (adjust credentials as needed)
mysql -u root -p

# Inside MySQL:
SOURCE c:/Foundathon/techtitans/database/schema.sql;
EXIT;
```

---

### Step 2 — Backend (Node.js)

```bash
cd c:\Foundathon\techtitans\backend

# Copy and fill environment variables
copy .env.example .env
# Edit .env — set DB_PASSWORD and JWT_SECRET

# Install dependencies
npm install

# Start the server
npm run dev
```

The backend runs at **http://localhost:5000**

---

### Step 3 — AI Service (Python)

```bash
cd c:\Foundathon\techtitans\ai-service

# Copy and fill environment variables
copy .env.example .env
# Edit .env — set GEMINI_API_KEY (get free key at https://aistudio.google.com)

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Start the AI service
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

The AI service runs at **http://localhost:8001**

> **Note:** First startup downloads the `all-MiniLM-L6-v2` sentence transformer model (~90MB). This is a one-time download.

---

### Step 4 — Blockchain (Local Hardhat Node)

```bash
cd c:\Foundathon\techtitans\blockchain

# Install dependencies
npm install

# Terminal A — Start local blockchain node
npx hardhat node

# Terminal B — Deploy smart contract
npx hardhat run scripts/deploy.js --network localhost
```

After deploy, `deployment.json` and `abi.json` are auto-generated in the `blockchain/` folder.

> **Optional:** To deploy to Polygon Mumbai testnet instead:
> - Get testnet MATIC from https://faucet.polygon.technology
> - Set `PRIVATE_KEY` in `blockchain/.env`
> - Run: `npx hardhat run scripts/deploy.js --network mumbai`

---

### Step 5 — Frontend (Next.js)

```bash
cd c:\Foundathon\techtitans\frontend

# Install dependencies (already done if you followed setup)
npm install

# Start the dev server
npm run dev
```

The app runs at **http://localhost:3000** 🎉

---

## 🔑 Environment Variables Summary

### `backend/.env`
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password        # ← Change this
DB_NAME=techtitans
JWT_SECRET=your_super_secret_key       # ← Change this
AI_SERVICE_URL=http://localhost:8001
BLOCKCHAIN_RPC=http://127.0.0.1:8545
FRONTEND_URL=http://localhost:3000
```

### `ai-service/.env`
```env
GEMINI_API_KEY=your_gemini_api_key    # ← Required (free at aistudio.google.com)
PINECONE_API_KEY=                     # ← Optional (falls back to local similarity)
PINECONE_ENV=us-east-1
PINECONE_INDEX=techtitans-experts
```

---

## 🎯 Demo Flow (For Judges)

1. Open **http://localhost:3000** → see the animated landing page
2. **Register** as User A (`domain: AI Engineering`, `skills: CNN, Deep Learning`, problem about medical imaging)
3. **Register** as User B in another tab (`domain: Medical Research`, `skills: Clinical Trials, MRI`)
4. Both go to **Match** → paste overlapping problem statements → click **Find Expert Matches**
5. User A clicks **Dashboard → New Room** → creates "AI-Enhanced Cancer Detection"
6. User B goes to **Match → Open Rooms** → joins the room
7. User A sends: `"We should apply a convolutional neural network for image segmentation"`
8. User B sees the **translated version**: `"We should use an AI model that automatically identifies and outlines regions in medical images"`
9. Wait **30 seconds** of silence → AI Facilitator suggests a question
10. Or click **💡 Suggest** to trigger manually
11. Click **🔐 End & Log to Blockchain** → SHA-256 hash stored
12. Click **View Proof** → See the blockchain IP record

---

## 🔌 API Endpoints

### Backend (Port 5000)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/users/me` | Get profile |
| PUT | `/api/users/me` | Update profile |
| POST | `/api/users/match` | Find expert matches |
| POST | `/api/projects` | Create collaboration room |
| GET | `/api/projects` | List all rooms |
| POST | `/api/projects/:id/join` | Join a room |
| GET | `/api/messages/:projectId` | Get chat history |
| POST | `/api/blockchain/log/:id` | Summarize + log to chain |
| GET | `/api/blockchain/:id` | Get blockchain proof |

### AI Service (Port 8001)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/translate` | Translate jargon |
| POST | `/match` | Find similar experts |
| POST | `/facilitate` | Get brainstorm prompt |
| POST | `/summarize` | Generate session summary |
| GET | `/health` | Health check |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Custom CSS |
| Backend | Node.js, Express, Socket.io |
| AI | Python, FastAPI, LangChain, Google Gemini Pro |
| Embeddings | Sentence Transformers (all-MiniLM-L6-v2) |
| Vector DB | Pinecone (optional) / Local cosine similarity |
| Blockchain | Solidity, Hardhat, ethers.js, Polygon |
| Database | MySQL 8 |
| Real-time | WebSockets (Socket.io) |

---

## 🔧 Troubleshooting

**Python model download fails:**
```bash
pip install sentence-transformers --upgrade
```

**MySQL connection refused:**
- Make sure MySQL is running: `net start MySQL80` (Windows)
- Check credentials in `backend/.env`

**Blockchain: No deployment.json:**
- Run `npx hardhat node` first, then deploy in a separate terminal
- Blockchain logging gracefully falls back to "simulated" mode for demo

**Port conflicts:**
- Backend: change `PORT` in `backend/.env`
- AI: change port in `uvicorn` command and `backend/.env` → `AI_SERVICE_URL`
- Frontend: `npm run dev -- -p 3001`

---

Built with ❤️ by **TechTitans** · Foundathon 2026
