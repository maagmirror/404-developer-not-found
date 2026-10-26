# Error 404 — CapDev not found · Terminal interactiva

A fullscreen-ready, offline horror-terminal experience built with React, TypeScript, and Vite. Visitor recognition uses local TypeScript data only; the app makes no runtime API calls.

## Commands

```bash
npm install
npm run dev
npm test
npm run build
```

Open the local URL printed by Vite. After dependencies are installed, the experience itself is fully local and does not require a network connection.

## Controls

- Type a name. A unique prefix of at least three normalized characters reveals a known visitor automatically.
- Press `Enter` to submit an unknown or still-ambiguous name.
- Press `R` or `Escape` after recognition to reset for the next visitor.
- Press `F` when the name field is not focused, or use the footer control, to toggle fullscreen.
- The visible restart button appears a few seconds after a result.

## Office photos

The CAPTCHA and "Elige quién sobrevive" variants use placeholders until real material is added: put images in `public/office/` and set `photo` (and names) in `src/data/office.ts`. See `public/office/LEEME.txt`.

## Visitor data

Edit `src/data/visitors.ts`. Each visitor has a primary `name` (always the revealed identity), optional `aliases`, and reserved metadata/special-behavior fields for later work. Recognition ignores case, accents, and unnecessary whitespace.
