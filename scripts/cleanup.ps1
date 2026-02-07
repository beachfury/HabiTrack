# HabiTrack Cleanup Script
# This script removes old files and prepares for fresh start

Write-Host "=== HabiTrack Cleanup ===" -ForegroundColor Cyan

# 1. Delete old migration files
Write-Host "`n[1/5] Removing old migration files..." -ForegroundColor Yellow
$migrationsPath = "P:\HabiTrack\providers\storage-mariadb\migrations"
if (Test-Path $migrationsPath) {
    Get-ChildItem -Path $migrationsPath -Filter "*.sql" | ForEach-Object {
        Write-Host "  Removing: $($_.Name)" -ForegroundColor Gray
        Remove-Item $_.FullName -Force
    }
}

# 2. Delete old monolithic route files
Write-Host "`n[2/5] Removing old route files..." -ForegroundColor Yellow
$oldRoutes = @(
    "P:\HabiTrack\apps\api\src\routes.auth.ts",
    "P:\HabiTrack\apps\api\src\routes.auth.creds.ts",
    "P:\HabiTrack\apps\api\src\routes.auth.pin.ts",
    "P:\HabiTrack\apps\api\src\routes.auth.reset.ts",
    "P:\HabiTrack\apps\api\src\routes.calendar.ts",
    "P:\HabiTrack\apps\api\src\routes.chores.ts",
    "P:\HabiTrack\apps\api\src\routes.family.ts",
    "P:\HabiTrack\apps\api\src\routes.messages.ts",
    "P:\HabiTrack\apps\api\src\routes.settings.ts",
    "P:\HabiTrack\apps\api\src\routes.shopping.ts",
    "P:\HabiTrack\apps\api\src\routes.me.ts"
)
foreach ($file in $oldRoutes) {
    if (Test-Path $file) {
        Write-Host "  Removing: $(Split-Path $file -Leaf)" -ForegroundColor Gray
        Remove-Item $file -Force
    }
}

# 3. Delete zip files in src
Write-Host "`n[3/5] Removing zip files from src..." -ForegroundColor Yellow
$zipFiles = @(
    "P:\HabiTrack\apps\api\src\api-refactor-phase5.zip",
    "P:\HabiTrack\apps\api\src\api-refactor-phase6.zip",
    "P:\HabiTrack\apps\api\src\api-refactor-phase7-auth.zip",
    "P:\HabiTrack\apps\api\src\api-refactor-phase8-router.zip"
)
foreach ($file in $zipFiles) {
    if (Test-Path $file) {
        Write-Host "  Removing: $(Split-Path $file -Leaf)" -ForegroundColor Gray
        Remove-Item $file -Force
    }
}

# 4. Delete ops/migrate folder
Write-Host "`n[4/5] Removing ops/migrate..." -ForegroundColor Yellow
$opsMigrate = "P:\HabiTrack\ops\migrate"
if (Test-Path $opsMigrate) {
    Remove-Item $opsMigrate -Recurse -Force
    Write-Host "  Removed ops/migrate folder" -ForegroundColor Gray
}

# 5. Delete docker/db/init SQL files
Write-Host "`n[5/5] Removing docker/db/init SQL files..." -ForegroundColor Yellow
$dockerInit = "P:\HabiTrack\docker\db\init"
if (Test-Path $dockerInit) {
    Get-ChildItem -Path $dockerInit -Filter "*.sql" | ForEach-Object {
        Write-Host "  Removing: $($_.Name)" -ForegroundColor Gray
        Remove-Item $_.FullName -Force
    }
}

Write-Host "`n=== Cleanup Complete! ===" -ForegroundColor Green
Write-Host @"

Next steps:
1. Copy 001_complete_schema.sql to:
   - P:\HabiTrack\providers\storage-mariadb\migrations\001_complete_schema.sql
   - P:\HabiTrack\docker\db\init\001_complete_schema.sql

2. Reset your database:
   docker-compose down -v
   docker-compose up -d

3. The database will be created fresh with all tables.

"@ -ForegroundColor Cyan
