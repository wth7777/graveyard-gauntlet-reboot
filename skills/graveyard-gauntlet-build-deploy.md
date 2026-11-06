# Graveyard Gauntlet Vite + Phaser Build & Deploy

## Class-Level Skill: Build, Fix, and Deploy Graveyard Gauntlet Reboot

### Always-On Rules (Standing Preferences)

1. **Base path must match GitHub Pages config** — `vite.config.js` `base:` and `index.html` script `src=` must both use `/graveyard-gauntlet-reboot/` (or whatever the repo slug is). Mismatch causes 404 on live site.

2. **BootScene.js baseURL must match dist base path** — `this.load.baseURL = '/graveyard-gauntlet-reboot/'` must be set in `preload()` before any `this.load.image()` calls. Without this, all asset paths resolve relative to `/` instead of the repo path.

3. **Source files must exist before build** — Vite requires `src/main.js` and scene files in `src/scenes/` at minimum. The reboot project was originally built with only assets; source must be copied from the original project or created de novo.

4. **Character spritesheet must be in public/assets/images/character/** — The `cousin_spritesheet.png` (16-frame, 768×2048 RGBA) and its `.json`/`.xml` metadata must be copied to the public directory before `npm run build`. The build will not include them otherwise.

5. **Never hardcode generated hash filenames** — Do not put `game-BrB3G-Oa.js` or similar in index.html manually. Let Vite generate it, then deploy the dist/ contents. The hash changes on every build; only the `dist/` tree matters for deployment.

6. **Touch controls need `passive: false`** — HTML touch button listeners must use `{ passive: false }` in `addEventListener('touchstart', ...)` or `preventDefault()` must be called manually, otherwise Phaser input events may not fire correctly on mobile.

7. **Loading overlay handling** — `index.html` must contain `window.__hideLoading()` and `window.__showError()` functions. The loading overlay must be hidden after assets load; otherwise the live site shows a permanent black screen.

8. **Deploy via git subtree, not npx gh-pages** — `npx gh-pages -d dist` may report success (exit 0) but not fast-forward origin/gh-pages. Use `git subtree push --prefix dist origin main:gh-pages` to ensure the branch updates correctly.

### Pitfalls (Generalizable Rules + Why)

| Pitfall | Why |
|---------|-----|
| `vite build` fails with "Rollup failed to resolve import" | Index.html references a stale/hardcoded bundle hash from a previous build. Remove the script tag, rebuild, then add the new generated hash back to the root index.html. |
| Live GitHub Pages shows black screen / 404 JS bundle | `BootScene.js` `this.load.baseURL` points to wrong base path (e.g., `/graveyard-gauntlet/` instead of `/graveyard-gauntlet-reboot/`). Asset paths resolve incorrectly. |
| Player invisible at zoom 2.0 | `startFollow()` in MainScene overrides `scrollY` with `sprite.y - displayHeight/2 = 330`, placing player off-screen. Fix: remove `startFollow()`, use manual `Phaser.Math.Linear()` follow in `update()` with `followOffset` parameter, and set initial `scrollY` in `create()`. |
| Permanent loading screen on live site | `index.html` lacks `window.__hideLoading()` / `window.__showError()`, or the functions don't properly set `el.style.display = 'none'`. |
| `npm install` fails in reboot project | Reboot project has no `package.json`. Copy from original project first: `cp /path/original/package.json /path/reboot/`. |
| GitHub Pages "errored" status after deploy | Main branch has stale content from initial commit. Reset main to match gh-pages: `git checkout gh-pages; branch -m main; git reset --hard; git push -f origin main:gh-pages`. |
| Touch controls don't respond on mobile | HTML touch listeners missing `{ passive: false }` or `preventDefault()` call. Phaser cannot register touch events. |

### Procedure (Steps in Order, with Commands)

**Step 1: Ensure source files exist in reboot project**
```bash
# Copy from original project
mkdir -p /home/clawman/graveyard-gauntlet-reboot/src/scenes
cp /home/clawman/graveyard-gauntlet/src/main.js /home/clawman/graveyard-gauntlet-reboot/src/main.js
cp /home/clawman/graveyard-gauntlet/src/scenes/BootScene.js /home/clawman/graveyard-gauntlet-reboot/src/scenes/BootScene.js
cp /home/clawman/graveyard-gauntlet/src/scenes/MainScene.js /home/clawman/graveyard-gauntlet-reboot/src/scenes/MainScene.js
cp /home/clawman/graveyard-gauntlet/src/scenes/UIScene.js /home/clawman/graveyard-gauntlet-reboot/src/scenes/UIScene.js
```

**Step 2: Fix BootScene.js base URL**
```bash
# Open the file and change the baseURL
patch(/home/clawman/graveyard-gauntlet-reboot/src/scenes/BootScene.js,
  old_string: "this.load.baseURL = '/graveyard-gauntlet/'",
  new_string: "this.load.baseURL = '/graveyard-gauntlet-reboot/'")
```

**Step 3: Copy character assets to public directory**
```bash
mkdir -p /home/clawman/graveyard-gauntlet-reboot/public/assets/images/character
cp /home/clawman/graveyard-gauntlet-reboot/assets/images/character/cousin_spritesheet*.* /home/clawman/graveyard-gauntlet-reboot/public/assets/images/character/
```

**Step 4: Copy package.json and install dependencies**
```bash
cp /home/clawman/graveyard-gauntlet/package.json /home/clawman/graveyard-gauntlet-reboot/package.json
cp /home/clawman/graveyard-gauntlet/package-lock.json /home/clawman/graveyard-gauntlet-reboot/package-lock.json
npm install
```

**Step 5: Fix index.html script tag (remove hardcoded hash)**
```bash
# Remove any hardcoded game-BrB3G-Oa.js script tag from index.html
# (Vite will inject the correct one during build)
```

**Step 6: Run the build**
```bash
cd /home/clawman/graveyard-gauntlet-reboot
npm run build
# Output should end with: "✓ built in Xms"
# If fails with "Rollup failed to resolve import", remove the script tag from index.html first, then rebuild
```

**Step 7: Copy generated dist/index.html to root**
```bash
# The dist/index.html now has the correct generated script reference
# Copy it back to the project root for GitHub Pages
cp /home/clawman/graveyard-gauntlet-reboot/dist/index.html /home/clawman/graveyard-gauntlet-reboot/index.html
```

**Step 8: Copy dist assets to root public (if not already there)**
```bash
# The built assets are in dist/assets/; ensure they're accessible from the web root
# Typically just deploying dist/ contents is sufficient for GitHub Pages
```

**Step 9: Deploy to GitHub Pages**
```bash
git subtree push --prefix dist origin main:gh-pages
# Verify: gh pages https://wth7777.github.io/graveyard-gauntlet-reboot/ shows HTTP 200
```

### Verification Checklist (After Build + Deploy)

- [ ] `dist/assets/game--*.js` exists (1+ MB) — the generated bundle
- [ ] `dist/assets/images/character/cousin_spritesheet.png` exists (900+ KB)
- [ ] `dist/assets/images/character/cousin_spritesheet.json` exists
- [ ] Live site: HTTP 200 on HTML and JS bundle
- [ ] Loading overlay disappears after game boots
- [ ] Cousin character visible at close-up zoom (2.0)
- [ ] Camera follows player in all 4 directions (left, right, up, down)
- [ ] All 6 animations (Idle, Walk, Punch, Kick, Jump, Hurt) play correctly
- [ ] JS bundle returns HTTP 200 at `https://wth7777.github.io/graveyard-gauntlet-reboot/assets/game--FTj15Ze.js`

### Supporting Files (references/, templates/, scripts/)

- `references/vite-deployment-troubleshooting.md` — Decision table of common build failures and fixes
- `templates/vite-config-reboot.toml` — Known-good vite.config.js template for this repo
- `scripts/verify-build.js` — Runs `npm run build` and checks that dist/ contains expected assets

### Recent Lessons (from this session)

- **Pitfall: Hardcoded bundle hash in index.html** — The build failed because index.html referenced `game-BrB3G-Oa.js` from a previous deployment. Removing the tag and letting Vite regenerate it resolved the issue.
- **Pitfall: startFollow overriding scrollY** — Camera zoom 2.0 with `startFollow()` positions player off-screen. Manual follow in `update()` with `followOffset.g=116` fixes vertical positioning.
- **Pitfall: Wrong base path across config layers** — `vite.config.js base:`, `BootScene.js this.load.baseURL`, and `index.html script src=` must all agree. Mismatch causes 404 on live site.