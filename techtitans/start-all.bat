@echo off
echo ========================================
echo    TechTitans - Starting All Services
echo ========================================
echo.

echo [1/5] Starting Backend (Node.js - Port 5000)...
start "TechTitans Backend" cmd /k "cd /d c:\Foundathon\techtitans\backend && node server.js"
timeout /t 3 /nobreak >nul

echo [2/5] Starting AI Service (Python - Port 8001)...
start "TechTitans AI Service" cmd /k "cd /d c:\Foundathon\techtitans\ai-service && venv\Scripts\uvicorn main:app --host 0.0.0.0 --port 8001 --reload"
timeout /t 3 /nobreak >nul

echo [3/5] Starting Hardhat Blockchain Node (Port 8545)...
start "TechTitans Blockchain Node" cmd /k "cd /d c:\Foundathon\techtitans\blockchain && npx hardhat node"
timeout /t 5 /nobreak >nul

echo [4/5] Deploying Smart Contract...
start "TechTitans Deploy Contract" cmd /k "cd /d c:\Foundathon\techtitans\blockchain && npx hardhat run scripts/deploy.js --network localhost && echo Contract Deployed! && pause"
timeout /t 8 /nobreak >nul

echo [5/5] Starting Frontend (Next.js - Port 3000)...
start "TechTitans Frontend" cmd /k "cd /d c:\Foundathon\techtitans\frontend && npm run dev"
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo  All services starting!
echo  Open: http://localhost:3000
echo ========================================
echo.
start "" "http://localhost:3000"
pause
