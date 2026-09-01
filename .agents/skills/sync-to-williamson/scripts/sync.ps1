<#
.SYNOPSIS
    Syncs structural/functional changes from henry-county-directory to william-county-directory.
    Branding, content, secrets, and environment-specific files are intentionally excluded.

.DESCRIPTION
    This script mirrors the shared codebase template from Henry County to Williamson County.
    It copies all structural files while preserving Williamson County's own branding, 
    content, environment variables, and git history.

.USAGE
    Run from henry-county-directory root:
        .\.agents\skills\sync-to-williamson\scripts\sync.ps1
    
    Dry-run mode (shows what would be copied without actually copying):
        .\.agents\skills\sync-to-williamson\scripts\sync.ps1 -DryRun
#>

param(
    [switch]$DryRun = $false
)

$SOURCE = "C:\Users\ZaZeZi\OneDrive\Desktop\henry-county-directory"
$TARGET = "C:\Users\ZaZeZi\OneDrive\Desktop\william-county-directory"

# ── Branding / Content / Environment – NEVER overwrite these in the target ──
$EXCLUDED_RELATIVE = @(
    "src\config\site.ts",
    "src\app\icon.png",
    "src\app\icon.svg",
    "src\app\opengraph-image.png",
    "src\app\robots.ts",
    "src\app\sitemap.ts",
    "src\app\manifest.ts",
    ".env",
    ".env.local",
    ".env.production",
    ".env.development",
    "README.md",
    "AGENTS.md",
    "CLAUDE.md",
    "eslint-errors.json",
    "vercel-deploy-log.txt",
    "package-lock.json"
)

# ── Directories that are ENTIRELY excluded (never recurse into these) ──
$EXCLUDED_DIRS = @(
    "public",
    ".git",
    ".next",
    ".vercel",
    "node_modules",
    "test-results",
    ".agents"      # skill definitions are per-project
)

# ── Structural directories to sync ──
$SYNC_DIRS = @(
    "src\app",
    "src\components",
    "src\lib",
    "src\services",
    "src\utils",
    "supabase",
    "scripts",
    "e2e"
)

# ── Root-level structural files to sync ──
$SYNC_FILES = @(
    "next.config.ts",
    "tailwind.config.ts",
    "tsconfig.json",
    "postcss.config.mjs",
    "eslint.config.mjs",
    "components.json",
    "playwright.config.ts",
    "sentry.client.config.ts",
    "sentry.server.config.ts",
    "sentry.edge.config.ts",
    "next-env.d.ts",
    "package.json"
)

# Counters
$copied = 0
$skipped = 0
$errors = 0

function Is-ExcludedFile($relativePath) {
    foreach ($ex in $EXCLUDED_RELATIVE) {
        if ($relativePath -eq $ex -or $relativePath -like "*\$ex") {
            return $true
        }
    }
    return $false
}

function Is-InExcludedDir($relativePath) {
    foreach ($dir in $EXCLUDED_DIRS) {
        if ($relativePath -like "$dir\*" -or $relativePath -eq $dir) {
            return $true
        }
    }
    return $false
}

function Sync-File($sourceFile, $targetFile, $label) {
    if ($DryRun) {
        Write-Host "  [DRY-RUN] Would copy: $label" -ForegroundColor Cyan
        $script:copied++
        return
    }
    try {
        $targetDir = Split-Path $targetFile -Parent
        if (-not (Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        }
        Copy-Item -Path $sourceFile -Destination $targetFile -Force
        Write-Host "  [COPIED]  $label" -ForegroundColor Green
        $script:copied++
    } catch {
        Write-Host "  [ERROR]   $label - $_" -ForegroundColor Red
        $script:errors++
    }
}

# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "  Henry County → Williamson County Sync" -ForegroundColor Yellow
if ($DryRun) { Write-Host "  MODE: DRY-RUN (no files will be written)" -ForegroundColor Cyan }
Write-Host "  Source: $SOURCE" -ForegroundColor Gray
Write-Host "  Target: $TARGET" -ForegroundColor Gray
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path $SOURCE)) {
    Write-Host "[FATAL] Source directory not found: $SOURCE" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $TARGET)) {
    Write-Host "[INFO] Target directory does not exist. Creating: $TARGET" -ForegroundColor Yellow
    if (-not $DryRun) { New-Item -ItemType Directory -Path $TARGET -Force | Out-Null }
}

# ── 1. Sync root-level structural files ──
Write-Host "── Root-level files ──────────────────────────────────────" -ForegroundColor White
foreach ($file in $SYNC_FILES) {
    $sourceFile = Join-Path $SOURCE $file
    $targetFile = Join-Path $TARGET $file
    if (Test-Path $sourceFile) {
        if (Is-ExcludedFile $file) {
            Write-Host "  [SKIP]    $file (excluded - branding/content)" -ForegroundColor DarkYellow
            $skipped++
        } else {
            Sync-File $sourceFile $targetFile $file
        }
    }
}

# ── 2. Sync structural src/* directories (excluding branding files within) ──
Write-Host ""
Write-Host "── Source directories ────────────────────────────────────" -ForegroundColor White
foreach ($dir in $SYNC_DIRS) {
    $sourceDir = Join-Path $SOURCE $dir
    if (-not (Test-Path $sourceDir)) { continue }

    Write-Host ""
    Write-Host "  Scanning: $dir" -ForegroundColor DarkCyan

    Get-ChildItem -Path $sourceDir -Recurse -File | ForEach-Object {
        $relativePath = $_.FullName.Substring($SOURCE.Length + 1)
        $targetFile = Join-Path $TARGET $relativePath

        # Skip if it's inside an excluded directory
        if (Is-InExcludedDir $relativePath) {
            Write-Host "  [SKIP]    $relativePath (excluded dir)" -ForegroundColor DarkYellow
            $skipped++
            return
        }

        # Skip if it's an excluded file
        if (Is-ExcludedFile $relativePath) {
            Write-Host "  [SKIP]    $relativePath (excluded - branding/content)" -ForegroundColor DarkYellow
            $skipped++
            return
        }

        Sync-File $_.FullName $targetFile $relativePath
    }
}

# ── Summary ──
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "  Sync Complete!" -ForegroundColor Green
Write-Host "  Copied:  $copied file(s)" -ForegroundColor Green
Write-Host "  Skipped: $skipped file(s)" -ForegroundColor DarkYellow
if ($errors -gt 0) {
    Write-Host "  Errors:  $errors file(s)" -ForegroundColor Red
}
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "  1. Verify src/config/site.ts in Williamson County is unchanged" -ForegroundColor White
Write-Host "  2. Verify public/ images are untouched" -ForegroundColor White
Write-Host "  3. If package.json changed: cd william-county-directory && npm install" -ForegroundColor White
Write-Host "  4. Start dev server: npm run dev" -ForegroundColor White
Write-Host ""
