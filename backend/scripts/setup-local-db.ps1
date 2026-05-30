# LearnIQ — Local PostgreSQL setup (Windows)
# Usage: .\setup-local-db.ps1
# You will be prompted for your postgres superuser password (set during PostgreSQL install)

$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$sqlFile = Join-Path $PSScriptRoot "setup-local-db.sql"

if (-not (Test-Path $psql)) {
    Write-Host "psql not found at $psql" -ForegroundColor Red
    Write-Host "Install PostgreSQL or edit this script with your psql path."
    exit 1
}

Write-Host "Creating LearnIQ database user and database..." -ForegroundColor Cyan
Write-Host "Enter the password for PostgreSQL user 'postgres' when prompted." -ForegroundColor Yellow
Write-Host ""

& $psql -U postgres -h localhost -p 5432 -f $sqlFile

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Success! Your backend .env should use:" -ForegroundColor Green
    Write-Host 'DATABASE_URL="postgresql://learniq:learniq_secret@localhost:5432/learniq"'
    Write-Host ""
    Write-Host "Next commands:" -ForegroundColor Cyan
    Write-Host "  cd ..\"
    Write-Host "  npx prisma db push"
    Write-Host "  npm run db:seed"
} else {
    Write-Host "Setup failed. See SETUP-POSTGRES.md for manual steps." -ForegroundColor Red
}
