---
name: clone-county
description: >
  Clones henry-county-directory into a new county directory on the Desktop.
  Automatically sets the correct county name, domain (.Directory or .today),
  state, and branding in site.ts. Supports all counties in the network:
  Fulton, Hancock, Henry, Medina, Paulding, Portage, Putnam, Steuben, 
  Vanwert, Williams, Wood, Allen, Dekalb, Lagrange — and any new county.
---

# Clone County Directory

## Overview

This skill creates a fully-branded, ready-to-run clone of `henry-county-directory`
for any county in the network. It syncs all structural/functional code and generates
county-specific branding files (`site.ts`, `manifest.ts`, `robots.ts`, `sitemap.ts`,
`.env.example`).

## County Network Reference

From the master list, all known counties and their domains:

| County    | .Directory Domain              | .today Domain             | Folder Name                   |
|-----------|-------------------------------|---------------------------|-------------------------------|
| Fulton    | FultonCounty.Directory        | FultonCounty.today        | fulton-county-directory       |
| Hancock   | HancockCounty.Directory       | HancockCounty.today       | hancock-county-directory      |
| Henry     | HenryCounty.Directory         | HenryCounty.today         | henry-county-directory        |
| Medina    | MedinaCounty.Directory        | MedinaCounty.today        | medina-county-directory       |
| Paulding  | PauldingCounty.Directory      | PauldingCounty.today      | paulding-county-directory     |
| Portage   | PortageCounty.Directory       | PortageCounty.today       | portage-county-directory      |
| Putnam    | PutnamCounty.Directory        | PutnamCounty.today        | putnam-county-directory       |
| Steuben   | SteubenCounty.Directory       | SteubenCounty.today       | steuben-county-directory      |
| Vanwert   | VanwertCounty.Directory       | VanwertCounty.today       | vanwert-county-directory      |
| Williams  | WilliamsCounty.Directory      | WilliamsCounty.today      | williams-county-directory     |
| Wood      | WoodCounty.Directory          | WoodCounty.today          | wood-county-directory         |
| Allen     | AllenCounty.Directory         | AllenCounty.today         | allen-county-directory        |
| Dekalb    | DekalbCounty.Directory        | DekalbCounty.today        | dekalb-county-directory       |
| Lagrange  | LagrangeCounty.Directory      | LagrangeCounty.today      | lagrange-county-directory     |
| Williamson| WilliamsonCounty.Directory    | WilliamsonCounty.today    | william-county-directory      |

## Usage

### Quick Clone (Agent-Triggered)

When the user says something like:
- "Clone for Fulton County"
- "Create a Medina County directory"
- "Set up Wood County with .today domain"

Run the clone script:

```powershell
cd "C:\Users\ZaZeZi\OneDrive\Desktop\henry-county-directory"
.\.agents\skills\clone-county\scripts\clone.ps1 -County "Fulton" -Domain "directory"
```

Domain options:
- `directory` → uses `FultonCounty.Directory` (default)
- `today`      → uses `FultonCounty.today`

### What the Script Does

1. Creates `C:\Users\ZaZeZi\OneDrive\Desktop\[County]County.[Domain]\`
2. Syncs all structural code from henry-county-directory (same exclusions as sync-to-williamson)
3. Generates `src/config/site.ts` with:
   - Site name: "[County] County Directory"
   - URL: "https://[County]County.Directory" or "https://[County]County.today"
   - Domain: "[County]County.Directory"
   - Contact: "support@[County]County.Directory"
   - Region name: "[County] County"
4. Generates `manifest.ts`, `robots.ts`, `sitemap.ts` (structural, pull from siteConfig)
5. Generates `.env.example` pre-filled with county-specific placeholders
6. Copies `src/instrumentation.ts`, `src/proxy.ts`
7. Creates empty `public/` directory for county images
8. Runs `npm install` automatically

### After Cloning — Checklist

After the script runs, the user must:

- [ ] Copy `.env.example` to `.env.local` and fill in real keys (Supabase, Stripe, Sentry, etc.)
- [ ] Add county logo: `src/app/icon.png` and `src/app/icon.svg`
- [ ] Add OG image: `src/app/opengraph-image.png`
- [ ] Add city/town images to `public/` (update `destinations` array in `site.ts`)
- [ ] Update `destinations` in `site.ts` with real cities for that county
- [ ] Deploy to Vercel and link the correct domain

## What is NOT Cloned (Same Rules as sync-to-williamson)

| Excluded | Reason |
|---|---|
| `src/config/site.ts` | Replaced with county-specific version |
| `src/app/icon.*`, `opengraph-image.png` | County logos — add manually |
| `public/` | County images — add manually |
| `.env`, `.env.local` | Secrets — fill in manually |
| `.git/` | Fresh git history per project |
| `node_modules/`, `.next/` | Rebuilt locally |
| `README.md`, `AGENTS.md`, `CLAUDE.md` | Per-project docs |

## Agent Instructions

When the user asks to create/clone a new county:

1. **Ask** which county name and which domain (`.directory` or `.today`) if not specified
2. **Run** `.\.agents\skills\clone-county\scripts\clone.ps1 -County "[Name]" -Domain "[directory|today]"`
3. **Wait** for npm install to complete
4. **Report** the output folder path, what was created, and the checklist above
5. **Do NOT** copy `.env` from Henry County — it contains Henry County secrets

## Paths

| Item | Path |
|---|---|
| Source (Henry County) | `C:\Users\ZaZeZi\OneDrive\Desktop\henry-county-directory` |
| Clone Script | `.agents\skills\clone-county\scripts\clone.ps1` |
| Output | `C:\Users\ZaZeZi\OneDrive\Desktop\[County]County.[Domain]\` |
