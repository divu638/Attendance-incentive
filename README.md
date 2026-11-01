# Attendance-Linked Incentive Program

A blockchain DApp that records student attendance on-chain and automatically pays a one-time ETH reward to
students who reach the required attendance percentage. Matches the project report (Admin / Teacher / Student roles).

| Layer | Folder | Tech |
|---|---|---|
| Smart contract | `contracts/AttendanceIncentive.sol` | Solidity ^0.8.20, Hardhat |
| Contract tests | `test/` | Hardhat + Chai (report test cases 1-7 plus extras) |
| Backend + DB | `backend/` | Node.js, Express, Supabase (PostgreSQL), ethers.js, JWT |
| Frontend | `frontend/` | React (Vite), ethers.js, MetaMask |

## Prerequisites
Node.js LTS, Supabase account (or project), MetaMask browser extension.

## Supabase Setup
1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard and run the SQL script found in [`supabase_schema.sql`](supabase_schema.sql).
3. In your Supabase dashboard, go to **Project Settings -> API** and copy:
   - **Project URL**
   - **anon / public key** (or **service_role key**)
4. In `backend/.env`, set:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-supabase-key
   ```
*(Note: If `SUPABASE_URL` is omitted, the backend will automatically use a local in-memory store so you can start right away).*

## Run it locally (5 terminals steps)
```bash
# 1. install
npm install
npm --prefix backend install
npm --prefix frontend install

# 2. test the smart contract
npx hardhat test

# 3. start a local blockchain (keep running)
npx hardhat node

# 4. deploy (new terminal) - also funds the reward pool and writes backend/contract.json + frontend/src/contract.json
npm run deploy:local

# 5. backend (new terminal)
cp backend/.env.example backend/.env      # set JWT_SECRET
npm run backend

# 6. frontend (new terminal)
npm run frontend                          # http://localhost:5173
```

### MetaMask setup for the local chain
1. Add network: RPC `http://127.0.0.1:8545`, Chain ID `31337`, currency ETH.
2. Import test accounts from the private keys printed by `npx hardhat node`:
   - Account #0 = **Admin** (the deployer)
   - Account #1 = Teacher, Account #2 and #3 = Students (any accounts work)
3. Sign in as Admin -> add Account #1 as teacher -> sign in as Teacher -> register students, create a session,
   mark attendance -> sign in as a Student -> claim the reward once the percentage is reached.

## Deploy to Sepolia (test network)
Copy `.env.example` to `.env`, fill in your RPC URL and a **test** wallet key, then `npm run deploy:sepolia`.
Set `RPC_URL` in `backend/.env` to the same Sepolia RPC. Never use a wallet that holds real funds.

## How it maps to the report
- **Module 1 - Smart contract:** `addTeacher`, `registerStudent`, `createSession`, `markAttendance` (+ `markAttendanceBatch`),
  `attendancePercent`, `claimReward`, `fund`; events `StudentRegistered`, `SessionCreated`, `AttendanceMarked`, `RewardClaimed`.
- **Module 2 - Backend:** `/api/auth/nonce`, `/api/auth/verify`, `/api/students`, `/api/sessions`,
  `/api/attendance/:sessionId`, `/api/students/:address/summary`, `/api/rewards`.
- **Module 3 - Database:** Supabase tables `users`, `sessions`, `attendance`, `rewards`; every row carries its `txHash`.
  `backend/listener.js` mirrors contract events into Supabase (and backfills on start).
- **Module 4 - Frontend:** separate Admin, Teacher and Student dashboards with live transaction status messages.
- **Module 5 - Auth:** MetaMask signature login (no passwords); the role is read from the contract, then a JWT is issued.

## Security notes
- Role checks via Solidity modifiers (`onlyAdmin`, `onlyTeacher`).
- `claimReward` follows checks-effects-interactions: it sets `rewardClaimed` before sending ETH.
- Duplicate marking, unregistered students, double claims and low pool balance all revert with clear messages.
- Backend nonce is single-use and expires in 5 minutes; students can only read their own data.

## Test cases (for report section 9.3)
Run `npx hardhat test`. Tests 1-7 map to the report's test cases 1-7; test case 8 (invalid signature -> 401) is
handled by `routes/auth.js`, verify it with Postman by posting a wrong signature to `/api/auth/verify`.
