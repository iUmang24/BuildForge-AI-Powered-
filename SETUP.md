# BuildForge - Local Setup

## Prerequisites
- Node.js
- pnpm (npm install -g pnpm)
- MySQL Server 8.0.x

## 1. Database
1. Install MySQL 8.0.x, remember the root password
2. Create the database:
   mysql -u root -p
   CREATE DATABASE IF NOT EXISTS test_buildforge;
   EXIT;
3. Load the dump files (not in git, get them separately):
   cd backend\database\dump
   Get-ChildItem *.sql | ForEach-Object { mysql -u root -p test_buildforge -e "source $($_.FullName)" }

## 2. Backend
cd backend
copy .env.example .env
# edit .env: set DB_PASSWORD to your real MySQL root password
npm install
node src\server.js
# Should print: Backend running on port 5000 / Connected to MySQL Database.

## 3. Frontend
cd frontend\buildforge_fe
# In lib\config.ts, make sure this line is ACTIVE (uncommented):
#   export const API_BASE_URL = "http://localhost:5000";
# and the two Vercel URLs below it are commented out
pnpm install
pnpm dev
# Opens at http://localhost:3000

## Notes
- Razorpay and email are stubbed with dummy .env values - payment/email buttons will not work, everything else does.
- Admin login: sharmashikharm@gmail.com (password not included in dump - reset via MySQL if needed)
