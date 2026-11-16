Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Starting ServiceOps Enterprise ITSM (Backend + Frontend)" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

Write-Host "`n[1/2] Launching Backend NestJS API on http://localhost:4000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; npm run start:dev"

Write-Host "[2/2] Launching Frontend Next.js UI on http://localhost:3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Write-Host "`nBoth services are booting up in dedicated windows." -ForegroundColor Green
Write-Host "  - Backend API: http://localhost:4000" -ForegroundColor White
Write-Host "  - Frontend UI: http://localhost:3000`n" -ForegroundColor White
