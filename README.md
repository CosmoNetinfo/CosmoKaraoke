# CosmoKaraoke

Programma karaoke per **Windows e Mac**, pensato per essere facile da leggere: caratteri per la dislessia, testo ingrandibile e colori ad alto contrasto. Uso personale.

## Installare il programma

1. Apri la pagina **Releases** di questo repository e scarica l'ultima versione:
   - **Windows:** il file `.exe`
   - **Mac:** il file `.dmg` (trascina CosmoKaraoke nella cartella Applicazioni)
2. Alla prima apertura il computer può mostrare un avviso, perché il programma non ha ancora la firma a pagamento di Microsoft/Apple:
   - **Windows:** clicca *Ulteriori informazioni* e poi *Esegui comunque*.
   - **Mac:** clicca con il tasto destro su CosmoKaraoke, scegli *Apri* e conferma. Se non basta, apri il Terminale e scrivi:
     `xattr -dr com.apple.quarantine /Applications/CosmoKaraoke.app`
3. Dopo la prima installazione **non serve più scaricare niente**: quando esce una versione nuova, in alto compare un avviso con il pulsante *Aggiorna e riavvia*. Il programma non si riavvia mai da solo.

## Come si usa

1. **Impostazioni → Aggiungi cartella**: scegli la cartella con i tuoi brani. Vengono letti:
   - MP3/WMA con il file `.cdg` dallo stesso nome (CD+G)
   - video (MP4, MKV, AVI, FLV…)
   - audio semplice (senza testo)
   - MIDI/KAR: compaiono in elenco, ma la riproduzione non c'è ancora
2. **Impostazioni → Schermo testi**: scegli la TV o il secondo monitor, poi in alto premi **Apri schermo testi**.
3. **Libreria**: cerca un brano e usa **Riproduci subito**, **Aggiungi alla scaletta** o **Aggiungi alla riserva**.
4. **Cantanti**: aggiungi i nomi e assegna ogni brano a chi canta. Il nome compare sulla TV.
5. **Mixer**: tonalità, velocità, equalizzatore, voce spenta, microfono con eco, jingle e applausi (tasti 1–9).
6. **Mix** (accanto a *Prossimo*): dissolvenza del brano in corso e partenza del successivo.

Tasti rapidi: **Spazio** pausa/riprendi · **M** mix · **1–9** jingle.

### Aspetto: pulsante «Aa»

In alto a destra: dimensione del testo (100–200%), tre combinazioni di colori (*Scuro*, *Crema*, *Alto contrasto giallo su nero*), quattro caratteri (*Atkinson Hyperlegible*, *Lexend*, *OpenDyslexic*, quello del computer) e spaziatura di lettere e righe. In **Impostazioni → Schermo testi** si ingrandiscono anche le scritte sulla TV.

### YouTube (facoltativo)

Serve il programma gratuito **yt-dlp**:
- Windows: `winget install yt-dlp`
- Mac: `brew install yt-dlp`

È una funzione **per uso personale**: scaricare i video può violare i termini di YouTube e il diritto d'autore.

## Pubblicare una nuova versione (per chi sviluppa)

1. Fai le modifiche.
2. Cambia il numero di versione: `npm run bump patch` (oppure `minor`, `major`, o un numero preciso come `npm run bump 0.3.5`).
3. Commit e push su `main`.
4. GitHub Actions compila Windows e Mac e pubblica gli installer. Le app già installate si aggiornano da sole quando l'utente preme il pulsante.

Se il numero di versione non cambia, GitHub **non** pubblica niente.

### Chiavi di firma (una volta sola)

Gli aggiornamenti sono firmati. Nel repository, in *Settings → Secrets and variables → Actions → New repository secret*, servono due segreti:

- `TAURI_SIGNING_PRIVATE_KEY` — il contenuto del file della chiave privata
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` — la sua password

La chiave **pubblica** è già dentro `src-tauri/tauri.conf.json`. La chiave privata non va mai caricata nel repository. Se la perdi, le app già installate non potranno più aggiornarsi da sole e andranno reinstallate a mano.

## Sviluppo

```
npm install
npm run tauri dev      # avvia l'app in modalità sviluppo
npm run build          # controlla e compila solo la parte grafica
```

Servono Node.js 22, Rust e, su Linux, le librerie di Tauri (vedi la guida ufficiale).

Struttura: interfaccia in `src/` (React + TypeScript + Tailwind), parte nativa in `src-tauri/src/lib.rs` (Rust), compilazione in `.github/workflows/release.yml`. Il piano completo delle funzioni è in `BRIEF-CosmoKaraoke.md`.

## Licenze

Codice del progetto: uso personale. Componenti di terzi: Tauri (MIT/Apache-2.0), React (MIT), SoundTouchJS (MPL-2.0), lucide (ISC), caratteri Atkinson Hyperlegible, Lexend e OpenDyslexic (SIL Open Font License 1.1).
