# PowerShell script to restart Next.js dev server
# This script kills Node processes and clears the .next cache

Write-Host "Stopping Node processes..." -ForegroundColor Yellow

# Find and kill Node processes that might be running the dev server
Get-Process node -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*builder-ki*"
} | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 2

Write-Host "Clearing .next cache..." -ForegroundColor Yellow

# Try to remove .next folder
if (Test-Path ".next") {
    try {
        Remove-Item -Recurse -Force .next -ErrorAction Stop
        Write-Host ".next folder removed successfully" -ForegroundColor Green
    } catch {
        Write-Host "Could not remove .next folder. Please close VS Code and try again." -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Done! Now run: npm run dev" -ForegroundColor Green
