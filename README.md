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
   - archivi `.zip` contenenti coppie MP3+CDG (estratti al volo in riproduzione)
   - video (MP4, MKV, AVI, FLV…)
   - audio semplice (senza testo, con lettura tag ID3/Vorbis/MP4)
   - MIDI/KAR: con testi sincronizzati e sintetizzatore integrato
   La libreria è salvata in un database SQLite locale con ricerca veloce full-text FTS5 (insensibile ad accenti e maiuscole).
2. **Impostazioni → Schermo testi**: scegli la TV o il secondo monitor, poi in alto premi **Apri schermo testi**.
3. **Libreria**: cerca un brano e usa **Riproduci subito**, **Aggiungi alla scaletta** o **Aggiungi alla riserva**.
4. **Cantanti**: aggiungi i nomi e assegna ogni brano a chi canta. Il nome compare sulla TV.
5. **Mixer**: tonalità, velocità, equalizzatore, voce spenta, microfono con eco, jingle e applausi (tasti 1–9).
6. **Mix** (accanto a *Prossimo*): dissolvenza del brano in corso e partenza del successivo.

Tasti rapidi: **Spazio** pausa/riprendi · **M** mix · **1–9** jingle.

### Aspetto: pulsante «Aa»

In alto a destra: dimensione del testo (100–200%), tre combinazioni di colori (*Scuro*, *Crema*, *Alto contrasto giallo su nero*), quattro caratteri (*Atkinson Hyperlegible*, *Lexend*, *OpenDyslexic*, quello del computer) e spaziatura di lettere e righe. In **Impostazioni → Schermo testi** si ingrandiscono anche le scritte sulla TV.

### Uso con un mixer esterno

Se il Mac è collegato a un mixer e il microfono è nel mixer, **non serve fare niente nel programma**: l'audio esce dall'uscita scelta in *Impostazioni di Sistema → Suono → Uscita*, e voce, riverbero ed effetti li gestisce il mixer. In *Impostazioni → Audio* l'opzione «Usa il microfono dentro il programma» resta spenta, così il Mac non chiede nemmeno il permesso del microfono. Nella scheda *Audio* puoi scegliere l'uscita **Mono** o **Stereo** a seconda del mixer.

### Effetti, stacchetti, sottofondo e sfondo TV

Nella scheda **Effetti**:
- **Effetti sonori:** dieci pulsanti già pronti (applausi, ovazione, fischio, rullo di tamburi, ba-dum-tss, tromba, fanfara, campanello, trombone triste, errore), creati dal programma. Puoi aggiungere i tuoi file audio. I tasti **1–9** fanno partire i primi nove.
- **Stacchetti:** musichette che partono da sole tra un brano e l'altro (ogni brano o ogni 2–5 brani, a caso o in ordine). Non partono se premi «Prossimo».
- **Sottofondo:** qualsiasi canzone che suona mentre nessuno canta. Si abbassa e si ferma quando parte un brano e riprende da sola alla fine della scaletta.
- **Sfondo TV:** un'immagine che si vede sulla TV quando non c'è un brano con i testi.

### YouTube (facoltativo)

Serve il programma gratuito **yt-dlp**. Nella scheda *YouTube*, se manca, compare il pulsante **Scarica yt-dlp**: lo installa da solo, senza terminale.

È una funzione **per uso personale**: scaricare i video può violare i termini di YouTube e il diritto d'autore.

### Server Live: prenotazioni e voti da smartphone

Nella scheda **Live**:
- **Punto di accesso e QR Code:** avvia il server locale con un clic. Gli ospiti inquadrano il QR code con la fotocamera del telefono: si apre subito l'interfaccia web leggera, senza installare nessuna app.
- **Prenotazioni dal cellulare:** il pubblico cerca i brani nel catalogo del locale e prenota con il proprio nome e un'eventuale dedica. Dalla regia puoi approvare in scaletta, in riserva o rifiutare (o attivare l'accettazione automatica).
- **Dediche sulla TV:** i messaggi inviati dagli smartphone arrivano in tempo reale e puoi proiettarli sulla TV per 10 secondi con un clic.
- **Voti e classifica cantanti:** il pubblico vota l'esibizione in corso da 1 a 5 stelle; la scheda Live mostra la classifica aggiornata in tempo reale.
- **Sicurezza della sala:** PIN di sala opzionale, limite di prenotazioni per persona e filtro per bloccare parole vietate.

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

Codice del progetto: uso personale. Componenti di terzi: Tauri (MIT/Apache-2.0), React (MIT), SoundTouchJS (MPL-2.0), spessasynth_lib (Apache-2.0), SoundFont TimGM6mb (GPL, 5,7 MB in public/soundfont/TimGM6mb.sf2), rusqlite (MIT), lofty (MIT/Apache-2.0), zip (MIT), axum (MIT), tokio (MIT), qrcode (MIT), lucide (ISC), caratteri Atkinson Hyperlegible, Lexend e OpenDyslexic (SIL Open Font License 1.1).
