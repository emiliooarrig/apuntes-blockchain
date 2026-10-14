# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

ChainNotes: a static site (plain HTML + CSS + vanilla JS, no build step, no dependencies, no package manager) of Blockchain study notes, served by GitHub Pages from the repo root. All content, comments, identifiers in prose and commit messages are in **Spanish**; keep it that way. Parallel LaTeX versions of the notes live in `latex/`.

## Commands

There is no build, lint or test tooling.

- View the site: open `index.html` directly (must keep working under `file://`), or `python -m http.server 8000`.
- LaTeX (`latex/`): `funciones-hash.tex` and `esquemas-de-compromiso.tex` use pdfLaTeX — `pdflatex <file>.tex` twice (for the TOC) or `latexmk -pdf <file>.tex`. `problemas.tex` is different: it uses `fontspec`/`polyglossia` and must be compiled with **XeLaTeX** (two passes). Its header references `data/*.csv` and `scripts/gen_data.py`, which are not in the repo. Compiled PDFs are committed; aux files are gitignored.

## Architecture

- `index.html` — landing page; the "Temario" section has one `<article class="topic">` card per note (each with its own `--accent`) linking into `temas/`. Adding a new note means adding a card here.
- `temas/*.html` — one self-contained page per topic. Every page duplicates the same shell: inline SVG icon sprite (`<symbol id="i-…">`, used via `<use href="#i-…">`), header with `#themeToggle`/`#burger`/`#progressBar`, footer. Pages reference shared assets with `../`. `firma-digital.html` and `encadenamiento.html` are still placeholder shells; `timestamping.html` has content but no lab script.
- `assets/css/styles.css` — design system (Claymorphism tokens, palette vars `--violet/--mint/--coral/--amber/--sky` in `:root`, light/dark via `[data-theme]`) plus landing sections. Used by every page.
- `assets/css/apuntes.css` — styles for note pages: topic header, TOC, body, formalism cards, and the `.lab` component (`.lab__head`, `.lab__title`, `.lab__tag`, `.lab__intro`, `.lab__note`, result panels, bars). Later sections are grouped per note (02 compromisos, then PoW). Pages link it with a cache-busting query (`apuntes.css?v=N`); bump `N` on pages that depend on new rules.
- `assets/js/main.js` — global behavior loaded on every page: theme (persisted in `localStorage` key `chainnotes-theme`, defaults to `prefers-color-scheme`), sticky header + scroll progress, scroll spy, reveal-on-scroll, counters, 3D tilt. Everything honors `prefers-reduced-motion`.
- `assets/js/<tema>.js` — interactive labs for one page (`hash.js`, `compromisos.js`, `prueba-de-trabajo.js`), loaded with `defer` after `main.js`. Each is an IIFE with `'use strict'`, ES5-style `var`, and a `$ = id => getElementById(id)` helper; labs bind to element IDs in the matching HTML, so renaming an ID requires editing both files. Sections are separated by `/* ===== */` banner comments; `prueba-de-trabajo.js` separates a DOM-free `CORE` block from the lab wiring.

## Key constraints

- **No WebCrypto.** `crypto.subtle` is unavailable on `file://`, and the notes must open with a double-click. SHA-256 is therefore hand-implemented in each lab script (`prueba-de-trabajo.js` also exposes the compression function for midstate mining). Don't replace it with `crypto.subtle` or add network `fetch`es.
- `compromisos.js` does Pedersen commitments with `BigInt` over deliberately small safe-prime groups (p = 2q+1, quadratic-residue subgroup) so the labs can break binding live — the insecurity is intentional.
- No frameworks or CDN scripts; the only external resource is Google Fonts (Outfit, Space Grotesk).

## Content sources

`docs/LINKS.md` lists the source pages (math.com.mx) the notes are based on; entries marked `(HECHO)` are already written up. `problemas.tex` defines a `\webhint{…}` macro (prints nothing in the PDF) carrying `key=value` metadata about sections, figures, widgets and tables for converting the LaTeX into a web page — read its header comment before doing such a conversion.
