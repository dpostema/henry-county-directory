---
name: sync-to-williamson
description: >
  Syncs all non-branding, non-content code changes from henry-county-directory to 
  william-county-directory on the Desktop. Run this skill whenever you make 
  structural, functional, or UI/UX changes that should be mirrored to Williamson County.
---

# Sync to Williamson County Directory

## Overview

This project uses a **shared codebase template** model. Henry County is the **source of truth** for all structural, functional, and design changes. William County (`william-county-directory`) is a **downstream clone** that must stay in sync with structural changes, but keep its own branding, content, and environment.

## When to Use This Skill

Run a sync after **any** of the following types of changes in `henry-county-directory`:

- New or modified React components (`src/components/`)
- Route/page logic changes (`src/app/**/*.tsx`, `src/app/**/*.ts`) — **except** `page.tsx` files that contain county-specific copy
- Authentication or API logic (`src/app/(auth)/`, `src/app/api/`)
- Admin panel changes (`src/app/(admin)/`)
- Service files (`src/services/`)
- Utility/library files (`src/lib/`, `src/utils/`)
- Configuration files (`next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs`, `components.json`)
- Global CSS (`src/app/globals.css`)
- Package dependency changes (`package.json`)
- Supabase migrations (`supabase/`)
- Sentry config (`sentry.*.config.ts`)
- Scripts (`scripts/`)
- E2E tests (`e2e/`)

## What NOT to Sync (Branding & Content)

The following files/directories are **county-specific** and must **NEVER** be overwritten during a sync:

| File / Directory | Reason |
|---|---|
| `src/config/site.ts` | County name, URLs, description, categories, destinations, footer |
| `src/app/icon.png`, `src/app/icon.svg` | County logo/favicon |
| `src/app/opengraph-image.png` | County OG image |
| `src/app/robots.ts` | County-specific sitemap/robot rules |
| `src/app/sitemap.ts` | County-specific sitemap URLs |
| `src/app/manifest.ts` | Pulls from siteConfig — review before syncing |
| `public/` | All county-specific images (city photos, logos) |
| `.env`, `.env.local`, `.env.production` | Supabase keys, Stripe keys, Sentry DSN, all secrets |
| `.vercel/` | Project-specific Vercel deployment config |
| `.git/` | Independent git history |
| `node_modules/` | Never copy — run npm install instead |
| `.next/`, `test-results/` | Build artifacts |
| `README.md` | County-specific readme |
| `AGENTS.md`, `CLAUDE.md` | AI agent instructions (may differ per project) |
| `eslint-errors.json` | Auto-generated |
| `vercel-deploy-log.txt` | Deployment logs |
| `package-lock.json` | Regenerate with npm install |

## Sync Procedure

### Step 1 - Review What Changed

Before syncing, always identify which files actually changed in henry-county-directory using git:

```powershell
cd "C:\Users\ZaZeZi\OneDrive\Desktop\henry-county-directory"
git diff --name-only HEAD~1 HEAD
```

Or for unstaged changes:
```powershell
git status --short
```

### Step 2 - Run the Sync Script

A PowerShell sync script is located at:
```
.agents/skills/sync-to-williamson/scripts/sync.ps1
```

Run it from the Henry County root:
```powershell
cd "C:\Users\ZaZeZi\OneDrive\Desktop\henry-county-directory"
.\.agents\skills\sync-to-williamson\scripts\sync.ps1
```

The script will:
1. Copy all whitelisted structural files/directories to william-county-directory
2. Skip all branding/content exclusions listed above
3. Print a summary of what was copied and what was skipped

### Step 3 - Install Dependencies (if package.json changed)

If package.json was among the changed files, run:
```powershell
cd "C:\Users\ZaZeZi\OneDrive\Desktop\william-county-directory"
npm install
```

### Step 4 - Verify the Sync

Open the Williamson County project and confirm:

1. The changed files exist in william-county-directory
2. src/config/site.ts still says Williamson County (not Henry County)
3. public/ images are untouched
4. .env is untouched
5. The dev server starts: npm run dev

### Step 5 - Manual Spot Check for page.tsx Files

Some page.tsx files may contain both structural logic AND county-specific copy. For these files, do NOT blindly overwrite - instead:

1. Open the changed page.tsx in Henry County
2. Open the corresponding file in Williamson County (if it exists)
3. Manually apply the structural change while preserving Williamson-specific text

## Agent Instructions

When the user makes a code change in henry-county-directory and asks you to apply it to Williamson County, follow this exact workflow:

1. **Identify** what files changed (ask user or use git diff)
2. **Classify** each changed file:
   - STRUCTURAL -> safe to copy
   - MIXED (contains county-specific copy) -> manually port the change
   - BRANDING/CONTENT -> skip entirely
3. **Apply** changes to C:\Users\ZaZeZi\OneDrive\Desktop\william-county-directory
4. **Preserve** all Williamson-specific values in src/config/site.ts
5. **Report** what was synced and what was intentionally skipped

## Directory Paths

| Project | Path |
|---|---|
| Henry County (source) | C:\Users\ZaZeZi\OneDrive\Desktop\henry-county-directory |
| Williamson County (target) | C:\Users\ZaZeZi\OneDrive\Desktop\william-county-directory |
