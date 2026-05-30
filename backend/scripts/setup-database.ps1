# LearnIQ PostgreSQL setup for Windows
# Run from PowerShell AS your normal user (postgres password will be prompted if needed)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$BackendRoot = Join-Path $ProjectRoot "backend"

Write-Host "=== LearnIQ Database Setup ===" -ForegroundColor Cyan

# 1) Try Docker Postgres (matches .env out of the box)
$docker = Get-Command docker -ErrorAction SilentlyContinue
if ($docker) {
    Write-Host "`nStarting PostgreSQL via Docker..." -ForegroundColor Yellow
    Set-Location $ProjectRoot
    docker compose up postgres -d 2>&1 | Out-Host
    Start-Sleep -Seconds 5
    Set-Location $BackendRoot
    Write-Host "Running prisma db push..." -ForegroundColor Yellow
    npx prisma db push
    if ($LASTEXITCODE -eq 0) {
        npm run db:seed
        Write-Host "`nDone! Use student@learniq.com / password123" -ForegroundColor Green
        exit 0
    }
    Write-Host "Docker DB push failed, trying local PostgreSQL..." -ForegroundColor Yellow
}

# 2) Local PostgreSQL — run SQL as superuser (default: postgres)
$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
    Write-Host @"

PostgreSQL CLI (psql) not found in PATH.

Option A — Docker Desktop:
  1. Install Docker Desktop
  2. cd `"$ProjectRoot`"
  3. docker compose up postgres -d
  4. cd backend && npx prisma db push && npm run db:seed

Option B — pgAdmin (local PostgreSQL):
  1. Open pgAdmin → connect to your server (user: postgres)
  2. Open Query Tool
  3. Run the file: backend\scripts\setup-postgres.sql
  4. cd backend && npx prisma db push && npm run db:seed

Option C — If your postgres user uses a different password, edit backend\.env:
  DATABASE_URL="postgresql://neondb_owner:npg_7lRWO6zocHPr@ep-polished-cell-aos3f4sn-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

"@ -ForegroundColor Red
    exit 1
}

$sqlFile = Join-Path $PSScriptRoot "setup-postgres.sql"
Write-Host "`nCreating user 'learniq' and database (enter postgres superuser password if prompted)..." -ForegroundColor Yellow
& psql -U postgres -f $sqlFile
if ($LASTEXITCODE -ne 0) {
    Write-Host "SQL setup failed. Run setup-postgres.sql manually in pgAdmin." -ForegroundColor Red
    exit 1
}

Set-Location $BackendRoot
npx prisma db push
npm run db:seed
Write-Host "`nDatabase ready! Login: student@learniq.com / password123" -ForegroundColor Green
