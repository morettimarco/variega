# Il Collettivo Variegà — Sito web

Sito statico del collettivo comico Variegà. 4 pagine, deployabile su GitHub Pages.

## Struttura

```
site/
├── index.html         # Landing page
├── collettivo.html    # Chi siamo / manifesto
├── membri.html        # I 5 membri (card flip)
├── date.html          # Date & contatti
├── styles.css         # Stili base
├── components.css     # Stili componenti
├── script.js          # Nav active, easter egg, card flip
└── assets/            # Logo + immagini quotes
```

## Deploy su GitHub Pages

### Opzione A — Project page (consigliata)

1. Crea un repo su GitHub, ad es. `variega`.
2. Carica **il contenuto della cartella `site/`** alla root del repo (NON la cartella stessa, ma i file dentro).
   - Più semplice da terminale:
     ```bash
     cd site
     git init
     git add .
     git commit -m "Sito Variegà"
     git branch -M main
     git remote add origin https://github.com/TUO-USERNAME/variega.git
     git push -u origin main
     ```
3. Vai su `Settings → Pages`.
4. In **Source** scegli `Deploy from a branch`, branch `main`, folder `/ (root)`. Salva.
5. Dopo 1-2 minuti il sito è online su `https://TUO-USERNAME.github.io/variega/`.

### Opzione B — `/docs`

Se preferisci tenere il codice in un repo più grande, sposta i file in una cartella `docs/` e in `Settings → Pages` scegli folder `/docs`.

## Modifiche frequenti

- **Aggiungere una data**: apri `date.html`, duplica un blocco `<div class="show">…</div>` e cambia data/città.
- **Aggiornare bio di un membro**: apri `membri.html`, trova la card del membro (sono numerate 01→05) e modifica `member-card__quote` e `member-card__bio`.
- **Cambiare colori di un membro**: nella stessa card, modifica le custom property `--c` (sfondo) e `--accent` (testo titolo) sull'`<article>`.
- **Aggiungere foto live**: salvale in `assets/` e sostituisci i placeholder `gallery__cell` in `date.html` con `<img src="assets/nome.jpg" />`.
- **Cambiare contatti / Instagram**: cerca `collettivo_variega` con find-and-replace in tutti i file.

## Easter egg

- Pulsante arancione `?!` in basso a destra → frase nonsense random.
- Da tastiera: digita `drip` per attivare un messaggio speciale.

## Note tecniche

- **Niente build step**: file statici puri, HTML + CSS + un piccolo JS.
- **Font**: Google Fonts (Bowlby One, Bungee, Special Elite, Courier Prime). Caricati via CDN.
- **Texture grain**: SVG inline, niente immagini esterne necessarie oltre agli asset.
- **Responsive**: breakpoint a 800px.

## TODO suggeriti

- [ ] Aggiungere foto live reali nella gallery
- [ ] Aggiungere link biglietti reali alle date quando disponibili
- [ ] Eventuale email di booking dedicata (oltre a IG DM)
- [ ] Open Graph image per anteprime sui social
