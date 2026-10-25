# BRIEF — CosmoKaraoke (per Antigravity)

App desktop karaoke per **Windows e macOS**, uso personale, con le stesse funzioni di Karaoke 5 (karaoke5.it) ad eccezione di quelle indicate in "Esclusioni". Tutta l'interfaccia è **in italiano**.

## STATO DEL PROGETTO (aggiornato al 25 ottobre 2026, versione 0.1.13)

Le fasi 0, 2, 3, 4 e 5 sono già state realizzate da Claude e caricate su `main`; la fase 1 è in parte fatta. Leggi il codice esistente prima di scrivere altro e mantieni lo stile (niente punto e virgola, apici singoli, 2 spazi).

**Come verrà usato:** su un **Mac** collegato a un **mixer esterno**. Il microfono va nel mixer, non nel computer: gli effetti voce del programma (riverbero ecc.) sono spenti di default (Impostazioni → Audio → «Usa il microfono dentro il programma»). L'audio esce dall'uscita scelta nel sistema; c'è la scelta Mono/Stereo. Chi lo usa ogni sera è **dislessica e vede poco**.

**Già fatto**
- Tauri 2 + React + TypeScript + Tailwind, compilazione Windows e Mac con GitHub Actions (Windows e Mac in sequenza), **aggiornamenti automatici** firmati, scheda Impostazioni → Aggiornamenti con «Cerca aggiornamenti», `npm run bump`
- Libreria da cartelle (MP3+CDG, audio, video; i MIDI/KAR sono elencati), ricerca veloce, lettore con decoder CD+G (`src/lib/cdg.ts`)
- Scaletta + riserva, cantanti, anteprima in cuffia, schermo testi su secondo monitor, messaggi a schermo, **immagine di sfondo** per la TV
- Scheda **Audio**: tonalità/velocità, equalizzatore, devocalizzatore, uscita Mono/Stereo, Mix con dissolvenza; effetti per il microfono (opzionali)
- Scheda **Effetti**: 10 effetti sonori creati dal programma (applausi, fischio, rullo…) che si possono togliere e rimettere, file propri, **stacchetti automatici** tra i brani, **musica di sottofondo**, sfondo TV
- Striscia «Sta suonando» con pulsanti per fermare ogni effetto; tasto Esc
- YouTube con yt-dlp (pulsante «Scarica yt-dlp» nell'app), ricerca, anteprima, **«In scaletta» / «In riserva»** con download in sottofondo
- Interfaccia a schede (Impostazioni, Audio, Effetti) pensata per stare in una schermata
- **Accessibilità** (vedi sotto)

**Ancora da fare** (in quest'ordine)
1. Riproduzione **MIDI/KAR** con testi sincronizzati (`src/lib/kar.ts`) — fase 1, **in corso da parte di Antigravity**
2. Libreria su **SQLite + FTS5** al posto del file JSON, lettura dei tag con `lofty`, supporto ai file `.zip` con MP3+G — fase 1
3. Riordino della scaletta con trascinamento, salvataggio/caricamento di playlist con nome — fase 2
4. **Prenotazioni da telefono** con QR code (fase 6), **quiz** (fase 7), **sincronizzatore di testi** (fase 8), **assistente vocale IA** (fase 9)
5. **Grafica professionale (fase 10):** nuovo nome (quello attuale è provvisorio), logo e icona dell'app con la mascotte di Cosmonet, restyling di tutte le schermate e della schermata TV, nuove icone, schermata iniziale. Regole: mantieni caratteri per la dislessia, testo ingrandibile e i tre temi (Scuro, Crema, Alto contrasto) funzionanti; ogni schermata deve stare in una finestra senza scorrere; pulsanti almeno 44 px; niente colori fissi nel codice (solo i token del tema). Prima si approvano i bozzetti, poi si scrive il codice.

## REQUISITI DI ACCESSIBILITÀ (valgono per ogni nuova schermata)

L'app sarà usata soprattutto da una persona **dislessica e ipovedente**.
- Mai testo sotto 1rem; dimensioni sempre in `rem` (la scala si cambia dal menu «Aa»). Icone sempre accompagnate da una parola, oppure con `title`/`aria-label`.
- Colori **solo tramite i token dei temi** (`bg-panel`, `text-text`, `text-muted`, `bg-accent`, `text-on-accent`… definiti in `src/index.css`), mai esadecimali fissi: devono funzionare nei temi Scuro, Crema e Alto contrasto.
- Pulsanti alti almeno 2,75rem (`Btn` in `src/components/ui.tsx` lo fa già). Niente testo giustificato, niente corsivo, niente tutto maiuscolo, frasi corte.
- Testi sullo schermo TV grandi e in contrasto elevato; rispettano `displayTextScale`.
- Ogni controllo raggiungibile da tastiera, con il contorno di focus già definito nel CSS.

## REGOLA DI RILASCIO

Ogni volta che finisci una fase e il codice compila: `npm run bump patch` (o `minor` per una funzione nuova), commit e push su `main`. GitHub Actions pubblica gli installer e le app già installate propongono l'aggiornamento. **Non cambiare né perdere la chiave di firma** e non toccare la chiave pubblica in `tauri.conf.json`.

---

## Come usare questo brief
Dai ad Antigravity **una fase alla volta** (sezione "Fasi"), incollando prima "Stato del progetto", i requisiti di accessibilità e le sezioni 1–4, e poi la fase richiesta. Ogni fase ha i criteri di accettazione: non passare alla successiva finché non sono tutti soddisfatti. A fine fase: commit con messaggio `fase N: ...` e aggiornamento del README.

---

## 1. Contesto e vincoli
- Nome progetto: **CosmoKaraoke**. Repo: `CosmoNetinfo/CosmoKaraoke`.
- Offline-first, nessun server cloud obbligatorio, nessun account, nessun costo ricorrente.
- Solo librerie open source con licenza compatibile con uso personale.
- Il codice deve essere scritto da zero: **non copiare** nome, grafica, testi o contenuti di Karaoke 5.
- Prestazioni: deve restare fluido su un portatile con i5-12500H, 16 GB RAM, Windows 11. Libreria fino a 50.000 brani.

## 2. Stack (le convenzioni abituali dei progetti CosmoNet)
- **Tauri 2.0** (backend Rust) + **React + Vite + TypeScript**
- Database locale **SQLite** con ricerca **FTS5**
- Stato UI: Zustand. Stile: Tailwind CSS. Icone: lucide-react.
- Build con **GitHub Actions** (workflow `release.yml`, matrice `windows-latest`, `macos-latest` per arm64 e x64, con `tauri-apps/tauri-action`).
- Linter/formatter: ESLint + Prettier; Rust: `cargo fmt` + `cargo clippy` senza warning.
- Test: Vitest per la logica TypeScript (decoder, parser, coda), `cargo test` per il Rust.

## 3. Esclusioni (non implementare)
1. **Ricerca nella rete P2P**: non si fa, per motivi di diritto d'autore. Al suo posto: archivio locale + YouTube.
2. **Formati proprietari K5 e KFN**: non si leggono né si scrivono. I formati supportati sono quelli aperti (vedi fase 1). Il sincronizzatore salva in un formato aperto proprio (JSON) ed esporta in LRC/KAR.
3. Nessuna funzione che aggiri protezioni, licenze o DRM.

## 4. Architettura
```
cosmokaraoke/
├─ src/                      # frontend React
│  ├─ app/                   # shell, routing, finestre (controllo, schermo testi)
│  ├─ features/
│  │  ├─ library/            # explorer, ricerca, anteprima
│  │  ├─ playlist/           # doppia playlist, coda cantanti
│  │  ├─ player/             # motore audio, CDG, KAR, video
│  │  ├─ mixer/              # tonalità, velocità, EQ, jingle, mix control
│  │  ├─ display/            # finestra TV / secondo schermo
│  │  ├─ youtube/            # ricerca, anteprima, download
│  │  ├─ singers/            # cantanti, prenotazioni, voti, messaggi
│  │  ├─ quiz/
│  │  ├─ sync-editor/        # sincronizzatore testi
│  │  └─ assistant/          # assistente vocale IA
│  └─ lib/                   # cdg.ts, kar.ts, lrc.ts, audio-engine.ts
├─ src-tauri/
│  ├─ src/
│  │  ├─ library.rs          # scansione cartelle, tag, SQLite
│  │  ├─ ytdlp.rs            # ricerca e download con yt-dlp
│  │  ├─ server.rs           # server HTTP+WebSocket LAN (axum)
│  │  ├─ windows.rs          # gestione secondo schermo
│  │  └─ main.rs
│  └─ tauri.conf.json
└─ .github/workflows/release.yml
```
Comunicazione tra finestra di controllo e finestra schermo testi: eventi Tauri (`emit`/`listen`). Il motore audio vive nella finestra di controllo; la finestra schermo riceve solo lo stato di riproduzione (posizione, testo corrente, messaggi).

### Modello dati SQLite (minimo)
- `songs(id, path, zip_entry, format, title, artist, album, duration_ms, added_at, play_count)` + tabella FTS5 su titolo/artista/nome file
- `singers(id, name, created_at)`
- `queue(id, song_id, singer_id, position, status)` — status: `in_attesa|in_riproduzione|cantato`
- `votes(id, queue_id, score, created_at)`
- `jingles(id, name, path, hotkey)`
- `settings(key, value)` — cartelle libreria, schermo testi, uscita cuffie, ecc.

---

## 5. Fasi

### FASE 0 — Scheletro
Crea il progetto Tauri 2 + React + Vite + TS, Tailwind, Zustand, SQLite, ESLint/Prettier, workflow GitHub Actions che compila Windows e macOS, README con istruzioni di avvio in italiano.
**Accettazione:** `npm run tauri dev` apre la finestra su Windows e Mac; la CI produce gli installer.

### FASE 1 — Libreria e lettore base
- **Libreria:** impostazioni per aggiungere cartelle; scansione in background (crate `walkdir`, tag con `lofty`); indicizzazione in SQLite con FTS5; ricerca istantanea per titolo/artista; barra di avanzamento della scansione.
- **Formati supportati:**
  - MP3+CDG, WMA+CDG, CD+G (file `.cdg` accoppiato all'audio con lo stesso nome; anche dentro file `.zip`, crate `zip`)
  - MIDI/KAR con testi
  - MP3/WMA semplici (senza testo)
  - Video MP4/FLV/altri formati supportati dal webview
- **Decoder CDG (`lib/cdg.ts`):** pacchetti da 24 byte (comando, istruzione, parità Q 2 byte, dati 16 byte, parità P 4 byte); si elaborano i pacchetti con `comando & 0x3F == 9`; 300 pacchetti al secondo; schermo 300×216 con area visibile 288×192 e bordo; istruzioni da gestire: 1 memory preset, 2 border preset, 6 tile block, 20 scroll preset, 24 scroll copy, 28 define transparent colour, 30 e 31 load colour table (16 colori), 38 tile block XOR. Rendering su `<canvas>` sincronizzato con `currentTime` dell'audio.
- **KAR/MIDI (`lib/kar.ts`):** parser MIDI (es. `@tonejs/midi`), testi dagli eventi meta lyric/text, evidenziazione sillaba per sillaba sincronizzata. Riproduzione audio con un sintetizzatore SoundFont in JS (valuta `spessasynth_lib` o equivalente open source).
- **Player:** play/pausa/stop, barra di avanzamento, volume.
**Accettazione:** si aggiunge una cartella, si cerca un brano e lo si riproduce con i testi corretti in tutti e tre i casi (CDG, KAR, MP4).

### FASE 2 — Coda cantanti e doppia playlist
- Cantanti: crea/modifica/elimina; ogni brano in coda è assegnato a un cantante.
- Coda con riordino a trascinamento, "prossimo cantante" ben visibile, ripetizione automatica.
- **Doppia playlist** affiancata; spostamento di brani tra le due.
- **Anteprima in cuffia:** riproduzione su una seconda uscita audio scelta nelle impostazioni, mentre la sala ascolta l'altra (`AudioContext.setSinkId`). **Rischio:** su macOS il WebView potrebbe non supportarlo; in tal caso implementa l'anteprima nel backend Rust con la crate `cpal`.
- Salvataggio e caricamento di playlist.
**Accettazione:** la coda sopravvive alla chiusura dell'app; l'anteprima suona solo sulle cuffie.

### FASE 3 — Doppio schermo
- Seconda finestra (`WebviewWindow`) a schermo intero sul monitor scelto (`availableMonitors`), senza controlli, con testi grandi, sfondo personalizzabile (colore, immagine, video), nome del cantante corrente e del prossimo.
- Controllo dalla finestra principale: scelta del monitor, anteprima di ciò che si vede sulla TV, pulsante "schermo nero".
- Messaggi a schermo (testo con durata e colore) e area "prossimo cantante".
**Accettazione:** con due monitor, i testi vanno sul secondo e il controllo resta sul primo; con un solo monitor c'è una finestra staccata ridimensionabile.

### FASE 4 — Mixer
- **Trasposizione di tonalità** da −12 a +12 semitoni senza cambiare la velocità, e **velocità** da 50% a 150% senza cambiare la tonalità. Per l'audio: `soundtouchjs` o equivalente (controlla la licenza: va bene per uso personale). Per il KAR/MIDI la trasposizione si applica alle note nel sintetizzatore.
- Equalizzatore a 10 bande (`BiquadFilterNode`).
- Volume separato **base** e **microfono**; ingresso microfono con eco/riverbero semplice (`ConvolverNode`).
- **Jingle e applausi:** griglia di pad con suoni da una cartella, scorciatoie da tastiera.
- **Mix Control:** pulsante che sfuma il brano in corso e fa partire il successivo con dissolvenza incrociata (durata impostabile).
- **Devocalizzatore in tempo reale:** modalità semplice con cancellazione del canale centrale (L−R) tramite Web Audio, attivabile con un interruttore. Il risultato dipende dal brano: dichiaralo nell'interfaccia.
**Accettazione:** cambio tonalità e velocità in tempo reale senza interruzioni; mix control funzionante.

### FASE 5 — YouTube
- **Ricerca:** richiama **yt-dlp** come programma esterno (cartella dell'app o PATH; se manca, messaggio chiaro in italiano con link per installarlo). Comando di ricerca: `yt-dlp "ytsearch10:<testo> karaoke" --flat-playlist --dump-json`.
- **Anteprima:** player incorporato ufficiale (iframe) nella finestra.
- **Download:** `yt-dlp -f "bv*[height<=720]+ba/b" --merge-output-format mp4 -o "<libreria>/YouTube/%(title)s.%(ext)s"`; progresso in tempo reale; a fine download il file entra nella libreria e può essere messo in coda.
- Avviso nel README e nella schermata: la funzione è **solo per uso personale**; il download dei video può violare i termini di YouTube e il diritto d'autore.
**Accettazione:** cerco un brano, lo guardo in anteprima, lo scarico e lo riproduco dalla libreria.

### FASE 6 — Prenotazioni da telefono (Karaoke5 Live)
- Il backend Rust avvia un server **axum** sulla rete locale (porta configurabile) che serve una pagina web leggera e un canale **WebSocket**.
- Schermata con **QR code** che contiene l'indirizzo IP locale; gli ospiti scansionano e non installano nulla.
- Dal telefono: inserire il proprio nome, cercare brani in libreria, prenotare, inviare un messaggio a schermo, votare l'esibizione (1–5 stelle), chat.
- Dal controllo: approvare/rifiutare richieste, limite di prenotazioni per persona, blocco della pagina, moderazione dei messaggi (filtro parole configurabile).
- Sicurezza: il server ascolta solo sulla rete locale, PIN di sala opzionale, limite di frequenza delle richieste.
**Accettazione:** da un telefono sulla stessa rete si prenota un brano e compare in coda; il voto compare nella classifica.

### FASE 7 — Quiz musicale
- Domande generate dalla libreria con i tag: "Qual è il titolo?", "Chi è l'artista?" (risposte a scelta multipla con falsi plausibili dalla stessa libreria); per i KAR anche "completa il testo".
- Riproduzione di un estratto del brano; più modalità (singolo, a squadre, a tempo).
- **Multigiocatore** dallo stesso server della fase 6: i giocatori rispondono dal telefono; classifica a schermo.
**Accettazione:** una partita completa con almeno 3 telefoni.

### FASE 8 — Sincronizzatore di testi
- Editor: carica un audio (MP3) e un testo; l'utente riproduce e **preme un tasto a ogni sillaba/riga** per assegnare i tempi; correzione dei tempi a mano; anteprima del risultato.
- Salvataggio in formato aperto JSON proprio; **esportazione LRC** (e KAR dove fattibile). Opzionale: rendering MP4 con testi tramite ffmpeg esterno.
**Accettazione:** creo un brano sincronizzato, lo esporto e lo riapro nel lettore.

### FASE 9 — Assistente vocale IA (facoltativa)
- Campo "chiedi una canzone", scritto o a voce. Un modello interpreta la frase e restituisce `{titolo, artista}`; l'app cerca prima nell'archivio locale e poi su YouTube, e mette in coda o riproduce.
- Provider gratuiti in ordine: Groq, poi Google Gemini, poi OpenRouter; chiavi API inserite dall'utente nelle impostazioni e salvate nel portachiavi di sistema, mai nel repository.
- Voce: prova la Web Speech API; se non disponibile nel webview, alternativa offline con whisper.cpp come programma esterno.
- Lingue: italiano, inglese, spagnolo, francese (le altre dove supportate dal modello).
**Accettazione:** dire "metti Albachiara di Vasco" trova e accoda il brano.

---

## 6. Regole per Antigravity
1. Leggi prima il README e i file già presenti; non inventare strutture diverse da quelle sopra.
2. Una fase per volta, con commit a fine fase.
3. Nessuna dipendenza senza controllare la licenza e senza segnalarla nel README (sezione "Licenze").
4. Tutte le stringhe dell'interfaccia in italiano; errori chiari, mai solo codici.
5. Se un requisito è ambiguo o rischioso (per esempio audio su macOS), proponi la soluzione più semplice e segnalala nel README invece di fermarti.
6. Non salvare chiavi, token o percorsi personali nel repository.
