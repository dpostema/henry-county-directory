<#
.SYNOPSIS
    Clones henry-county-directory into a new branded county directory.

.PARAMETER County
    The county name (e.g., "Fulton", "Medina", "Wood"). Case-insensitive.

.PARAMETER Domain
    Domain style: "directory" (default) → FultonCounty.Directory
                  "today"              → FultonCounty.today

.PARAMETER SkipInstall
    If set, skips running npm install after cloning.

.EXAMPLE
    .\.agents\skills\clone-county\scripts\clone.ps1 -County "Fulton"
    .\.agents\skills\clone-county\scripts\clone.ps1 -County "Wood" -Domain "today"
    .\.agents\skills\clone-county\scripts\clone.ps1 -County "Allen" -SkipInstall
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$County,

    [ValidateSet("directory","today")]
    [string]$Domain = "directory",

    [switch]$SkipInstall = $false
)

# ── Normalize county name (Title Case) ──────────────────────────────────────
$countyTitle  = (Get-Culture).TextInfo.ToTitleCase($County.ToLower())  # e.g. "Fulton"
$countyLower  = $County.ToLower()                                       # e.g. "fulton"

# ── Derive all naming values ─────────────────────────────────────────────────
$siteName     = "$countyTitle County Directory"
$domainBase   = "${countyTitle}County"

if ($Domain -eq "today") {
    $domainFull = "$($domainBase).today"
    $siteUrl    = "https://$domainFull"
} else {
    $domainFull = "$($domainBase).Directory"
    $siteUrl    = "https://$domainFull"
}

$folderName   = $domainFull
$contactEmail = "support@$domainFull"

$SOURCE = "C:\Users\ZaZeZi\OneDrive\Desktop\henry-county-directory"
$TARGET = "C:\Users\ZaZeZi\OneDrive\Desktop\$folderName"

# ── Excluded files (branding/content/secrets) ────────────────────────────────
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

$EXCLUDED_DIRS = @(
    "public",
    ".git",
    ".next",
    ".vercel",
    "node_modules",
    "test-results",
    ".agents"
)

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

$copied  = 0
$skipped = 0
$errors  = 0

function Is-ExcludedFile($relativePath) {
    foreach ($ex in $EXCLUDED_RELATIVE) {
        if ($relativePath -eq $ex) { return $true }
    }
    return $false
}

function Is-InExcludedDir($relativePath) {
    foreach ($dir in $EXCLUDED_DIRS) {
        if ($relativePath -like "$dir\*" -or $relativePath -eq $dir) { return $true }
    }
    return $false
}

function Sync-File($sourceFile, $targetFile, $label) {
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
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Cloning: $siteName" -ForegroundColor Cyan
Write-Host "  Domain:  $siteUrl" -ForegroundColor Cyan
Write-Host "  Output:  $TARGET" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $SOURCE)) {
    Write-Host "[FATAL] Source not found: $SOURCE" -ForegroundColor Red; exit 1
}
if (Test-Path $TARGET) {
    Write-Host "[WARN] Target directory already exists. Files will be overwritten." -ForegroundColor Yellow
}
New-Item -ItemType Directory -Path $TARGET -Force | Out-Null
New-Item -ItemType Directory -Path "$TARGET\public" -Force | Out-Null
New-Item -ItemType Directory -Path "$TARGET\src\config" -Force | Out-Null
New-Item -ItemType Directory -Path "$TARGET\src\app" -Force | Out-Null

# ── 1. Root-level structural files ───────────────────────────────────────────
Write-Host "-- Root-level files --" -ForegroundColor White
foreach ($file in $SYNC_FILES) {
    $srcFile = Join-Path $SOURCE $file
    $dstFile = Join-Path $TARGET $file
    if (Test-Path $srcFile) {
        if (Is-ExcludedFile $file) {
            Write-Host "  [SKIP]    $file" -ForegroundColor DarkYellow; $skipped++
        } else {
            Sync-File $srcFile $dstFile $file
        }
    }
}

# ── 2. src/ root files ───────────────────────────────────────────────────────
foreach ($f in @("src\instrumentation.ts","src\proxy.ts")) {
    $srcFile = Join-Path $SOURCE $f
    if (Test-Path $srcFile) { Sync-File $srcFile (Join-Path $TARGET $f) $f }
}

# ── 3. Structural src/* directories ─────────────────────────────────────────
Write-Host ""
Write-Host "-- Source directories --" -ForegroundColor White
foreach ($dir in $SYNC_DIRS) {
    $sourceDir = Join-Path $SOURCE $dir
    if (-not (Test-Path $sourceDir)) { continue }
    Write-Host ""
    Write-Host "  Scanning: $dir" -ForegroundColor DarkCyan

    Get-ChildItem -Path $sourceDir -Recurse -File | ForEach-Object {
        $relativePath = $_.FullName.Substring($SOURCE.Length + 1)
        $targetFile   = Join-Path $TARGET $relativePath

        if (Is-InExcludedDir $relativePath) {
            Write-Host "  [SKIP]    $relativePath (excluded dir)" -ForegroundColor DarkYellow
            $skipped++; return
        }
        if (Is-ExcludedFile $relativePath) {
            Write-Host "  [SKIP]    $relativePath (branding/content)" -ForegroundColor DarkYellow
            $skipped++; return
        }
        Sync-File $_.FullName $targetFile $relativePath
    }
}

# ── 4. Generate county-specific site.ts ──────────────────────────────────────
Write-Host ""
Write-Host "-- Generating branding files --" -ForegroundColor White

$siteTs = @"
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "$siteName",
  url: process.env.NEXT_PUBLIC_SITE_URL || "$siteUrl",
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Find great places to stay, eat, shop, or visit from local experts.",
  domain: process.env.NEXT_PUBLIC_SITE_DOMAIN || "$domainFull",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "$contactEmail",

  // Cookie Consent
  cookieConsentKey: process.env.NEXT_PUBLIC_COOKIE_CONSENT_KEY || "app_cookie_consent",
  cookieConsentMessage: process.env.NEXT_PUBLIC_COOKIE_CONSENT_MESSAGE || `"We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking \"Accept All\", you consent to our use of cookies."`,
  cookieConsentAccept: "Accept All",
  cookieConsentDecline: "Decline",

  // Regional Defaults
  region: {
    name: "$countyTitle County",
    state: "",
    timeZone: "America/Chicago"
  },

  // Homepage Hero
  hero: {
    title: "Discover the Best Spots",
    subtitle: "Find the best places by clicking below",
    searchPlaceholder: "What are you looking for?"
  },

  // How it works section
  howItWorks: [
    {
      num: "1",
      title: "Choose What To Do",
      desc: "Looking for a cozy hotel to stay, a restaurant to eat, a museum to visit or a mall to do some shopping?"
    },
    {
      num: "2",
      title: "Find What You Want",
      desc: "Search and filter hundreds of listings, read reviews, explore photos and find the perfect spot."
    },
    {
      num: "3",
      title: "Explore Amazing Places",
      desc: "Go and have a good time or even make a booking directly from the listing page. All of those, thanks to our directory."
    }
  ],

  // Default Categories
  categories: [
    { name: "Medical",      slug: "medicals",     iconName: "HeartPulse"   },
    { name: "Automotive",   slug: "automotive",   iconName: "Car"          },
    { name: "Food",         slug: "foods",         iconName: "Utensils"     },
    { name: "Services",     slug: "services",     iconName: "Wrench"       },
    { name: "Professional", slug: "professional", iconName: "Briefcase"    },
    { name: "Beauty & Spa", slug: "beauty-spa",   iconName: "Sparkles"     },
    { name: "Shopping",     slug: "shopping",     iconName: "ShoppingBag"  },
    { name: "Fitness",      slug: "fitness",      iconName: "Dumbbell"     }
  ],

  // Featured Destinations — update with real cities for $countyTitle County
  destinations: [
    { name: "City 1", slug: "city-1", count: 0, image: "/city-1.png" },
    { name: "City 2", slug: "city-2", count: 0, image: "/city-2.png" },
    { name: "City 3", slug: "city-3", count: 0, image: "/city-3.png" }
  ],

  // Footer
  footer: {
    about: "Discover and support amazing local businesses, restaurants, hotels, services, and events in our community.",
    addressLines: [
      "Global Headquarters:",
      "90 Fifth Avenue, 3rd Floor",
      "New York, NY 10011"
    ],
    socialLinks: {
      facebook: "https://facebook.com",
      twitter: "https://twitter.com",
      instagram: "https://instagram.com"
    }
  },

  // Articles
  articles: [
    {
      tag: "Tips, Travel",
      title: "Top 10 Restaurants You Must Try",
      date: "Aug 28th, 2026",
      author: "Admin",
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&auto=format&fit=crop&q=60"
    },
    {
      tag: "Culture",
      title: "Best Local Events Happening This Fall Season",
      date: "Aug 20th, 2026",
      author: "Team",
      image: "https://upload.wikimedia.org/wikipedia/commons/3/32/Googleplex_HQ_%28cropped%29.jpg"
    },
    {
      tag: "Location",
      title: "Hidden Gems: Coffee Shops In Downtown",
      date: "Aug 15th, 2026",
      author: "Staff Writer",
      image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=60"
    }
  ]
};
"@
$siteTs | Set-Content -Path "$TARGET\src\config\site.ts" -Encoding UTF8
Write-Host "  [CREATED] src/config/site.ts" -ForegroundColor Green

# ── 5. manifest.ts ───────────────────────────────────────────────────────────
@"
import { MetadataRoute } from 'next'
import { siteConfig } from "@/config/site"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#E8505B',
    icons: [
      { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
"@ | Set-Content -Path "$TARGET\src\app\manifest.ts" -Encoding UTF8
Write-Host "  [CREATED] src/app/manifest.ts" -ForegroundColor Green

# ── 6. robots.ts + sitemap.ts (copy — logic is siteConfig-driven) ────────────
Copy-Item "$SOURCE\src\app\robots.ts"  "$TARGET\src\app\robots.ts"  -Force
Copy-Item "$SOURCE\src\app\sitemap.ts" "$TARGET\src\app\sitemap.ts" -Force
Write-Host "  [CREATED] src/app/robots.ts" -ForegroundColor Green
Write-Host "  [CREATED] src/app/sitemap.ts" -ForegroundColor Green

# ── 7. .env.example ──────────────────────────────────────────────────────────
@"
# ── $siteName – Environment Variables ──────────────────
# Copy to .env.local and fill in real values. Never commit secrets.

NEXT_PUBLIC_SITE_NAME="$siteName"
NEXT_PUBLIC_SITE_URL="$siteUrl"
NEXT_PUBLIC_SITE_DESCRIPTION="Find great places to stay, eat, shop, or visit from local experts."
NEXT_PUBLIC_SITE_DOMAIN="$domainFull"
NEXT_PUBLIC_CONTACT_EMAIL="$contactEmail"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_ID_FEATURED=
STRIPE_PRICE_ID_PREMIUM=

# Resend (Email)
RESEND_API_KEY=

# Sentry
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# GoHighLevel (optional)
GHL_API_KEY=
GHL_LOCATION_ID=

# AI (optional)
OPENAI_API_KEY=
"@ | Set-Content -Path "$TARGET\.env.example" -Encoding UTF8
Write-Host "  [CREATED] .env.example" -ForegroundColor Green

# ── 8. npm install ───────────────────────────────────────────────────────────
if (-not $SkipInstall) {
    Write-Host ""
    Write-Host "-- Running npm install --" -ForegroundColor White
    Push-Location $TARGET
    npm install
    Pop-Location
}

# ── Summary ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  $siteName — Clone Complete!" -ForegroundColor Green
Write-Host "  Copied:  $copied file(s)" -ForegroundColor Green
Write-Host "  Skipped: $skipped file(s)" -ForegroundColor DarkYellow
if ($errors -gt 0) { Write-Host "  Errors:  $errors file(s)" -ForegroundColor Red }
Write-Host ""
Write-Host "  Folder:  $TARGET" -ForegroundColor Cyan
Write-Host "  Domain:  $siteUrl" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "CHECKLIST — Complete these manually:" -ForegroundColor Yellow
Write-Host "  [ ] Copy .env.example to .env.local and fill in keys" -ForegroundColor White
Write-Host "  [ ] Add src/app/icon.png and icon.svg (county logo)" -ForegroundColor White
Write-Host "  [ ] Add src/app/opengraph-image.png" -ForegroundColor White
Write-Host "  [ ] Add city images to public/" -ForegroundColor White
Write-Host "  [ ] Update destinations[] in src/config/site.ts" -ForegroundColor White
Write-Host "  [ ] Set region.state in src/config/site.ts" -ForegroundColor White
Write-Host "  [ ] Deploy to Vercel and connect domain: $siteUrl" -ForegroundColor White
Write-Host ""
