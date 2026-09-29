# TechTitans · AI Matchmaking for Cross-Industry Innovation

A platform built for Foundathon 2026 (Track 4) that matches experts from different fields, translates technical jargon between them, helps them brainstorm with AI and records proof of collaboration on a blockchain.

## Features

- **Matchmaking:** finds complementary collaborators using sentence-transformer embeddings (all-MiniLM-L6-v2) and cosine similarity
- **Jargon translator:** detects domain jargon and explains it for people from other fields
- **AI facilitator and summaries:** brainstorming prompts and project summaries with Google Gemini through LangChain
- **Real-time messaging** with Socket.IO
- **Collaboration log:** a Solidity smart contract that stores and verifies contribution hashes

## Structure

| Folder | Contents |
|---|---|
| `techtitans/backend` | Node.js and Express API with MySQL, JWT auth and Socket.IO |
| `techtitans/ai-service` | Python FastAPI service with the matchmaker, translator and facilitator agents |
| `techtitans/blockchain` | Hardhat project with the `CollaborationLog` contract |
| `techtitans/database` | MySQL schema |

> The Next.js frontend was developed in a separate repository and is only referenced here, so it is not included.

## Tech stack

Node.js · Express · MySQL · Socket.IO · Python · FastAPI · LangChain · Gemini · Sentence Transformers · Solidity · Hardhat

## Run locally

See [techtitans/README.md](techtitans/README.md) for step-by-step setup of the database, backend, AI service and blockchain.
