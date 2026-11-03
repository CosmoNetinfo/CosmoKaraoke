# CosmoKaraoke

CosmoKaraoke è un programma karaoke per Windows e macOS. La versione attuale è destinata all'uso personale e non è in vendita.

L'interfaccia è in italiano e include caratteri leggibili, testo ingrandibile e temi ad alto contrasto. La libreria musicale e le impostazioni restano sul computer; non servono account o un server cloud. Internet serve per gli aggiornamenti e, se attivate, le funzioni YouTube.

Per le istruzioni passo per passo consulta la [Guida utente](docs/Guida-utente.md).

Hai provato l'app? [Segnala un problema o proponi un miglioramento](https://cosmonetinfo.github.io/CosmoKaraoke-Site/feedback.html) oppure partecipa al [forum GitHub Discussions](https://github.com/CosmoNetinfo/CosmoKaraoke/discussions). Le segnalazioni pubbliche aiutano a riprodurre i problemi e a discutere le idee con gli altri utenti.

## Novità in v0.4.5

- La scheda **Brani eseguiti** registra localmente fino a 500 brani avviati; mostra i brani della sessione e il cantante più presente, permette di riaccodare un brano e di cancellare lo storico.
- La pagina Aspetto raggruppa le skin per disposizione: **Standard**, **Casa · Standard**, **Professionale · Regia** e **Premium · Regia**. Le anteprime rappresentano navigazione, pannelli e dock.
- Aggiunta la skin **Casa Chiara**; aggiornate **Broadcast Grafite** e **Control Room Blu** con testi bianchi e colori controllati per mantenere un contrasto leggibile.
- **Stage Black** ha una regia palco più essenziale e geometrica. Le icone laterali sono più riconoscibili e leggibili anche con la barra compressa.
- Aggiornata la guida italiana con indicazioni per lo storico, le nuove skin e schermate dell'app. Per proteggere l'indirizzo locale, la guida non mostra il QR personale di Live.
- Il testo sui pulsanti accentati viene scelto in base al contrasto reale del colore, così resta leggibile anche con accenti personalizzati.

## Novità in v0.4.4

- Aggiunta una raccolta di sette skin distinte: **Cosmo Notte**, **Studio Perla**, **Broadcast**, **Control Room**, **Salotto**, **Festa** e **Stage Black**, divise per stile Standard, Professionale, Casa e Premium. Le anteprime mostrano anche la disposizione del layout.
- La navigazione laterale Professionale si comprime alle sole icone e si ridimensiona trascinandone il bordo.
- La colonna di regia Professionale è stata portata in un pannello inferiore regolabile, con schede per riproduzione/TV/messaggi e scaletta/cantanti. Le impostazioni di larghezza e altezza vengono ricordate.
- La scheda Audio rende sempre disponibili le sezioni Microfono ed Effetti voce; l'attivazione del microfono gestisce la richiesta dei permessi e lo stato del motore audio.
- Aggiunti cinque preset per l'equalizzatore a 10 bande: Neutro, Voce chiara, Caldo, Bassi e Brillante.
- Le skin vengono salvate e applicate all'avvio; le impostazioni precedenti vengono migrate conservando il layout Professionale già scelto.

## Novità in v0.4.3

- La modalità Professionale ha una barra laterale più ampia, con icone e nomi delle sezioni sempre leggibili.
- Sistemati allineamento e spazi della regia; rimossa la scritta che si sovrapponeva ai comandi superiori.
- Pannelli e controlli professionali aggiornati con un aspetto più pulito e contemporaneo.

## Novità in v0.4.2

- Due modalità grafiche: **Standard**, con temi e colore principale regolabili, e **Professionale**, con navigazione laterale e aspetto da consolle broadcast.
- La dimensione dell'intera interfaccia si può regolare dal **75% al 200%**. Carattere, spaziatura e temi accessibili restano disponibili nella modalità Standard.
- Restyling della regia, della Libreria, di YouTube e dei pannelli: icone in riquadri dedicati, pulsanti più definiti, superfici professionali e cursori audio ridisegnati.
- Nella modalità Professionale, cursori, levette, indicatori e pannelli richiamano una consolle audio da regia.
- Se rimuovi per errore un brano dalla scaletta o dalla riserva, puoi premere **Annulla** o **Ctrl+Z** (⌘Z su Mac) entro 6 secondi: il brano torna nella posizione originale.

## Novità in v0.4.0

- Restyling della regia: navigazione più chiara, stato della serata sempre visibile e stato della TV a colpo d'occhio.
- Libreria e scaletta hanno superfici e stati vuoti più leggibili; dalla scaletta vuota si può aprire direttamente la Libreria.
- Anteprima TV e schermata di attesa hanno una gerarchia visiva più curata, mantenendo temi, caratteri e impostazioni esistenti.
- Sezioni Live riorganizzate in schede più leggibili, con stato del server messo in evidenza.
- Interfaccia Live per smartphone aggiornata con schede compatte, pulsanti comodi al tocco e stati di connessione più chiari.
- Lo script di aggiornamento versione mantiene allineati i metadati dei lockfile Node e Rust.

## Novità in v0.3.0

- La scansione della libreria mostra l'avanzamento e il numero di brani trovati. Se alcuni percorsi non sono accessibili, segnala il problema e conserva la libreria precedente.
- La schermata Libreria vuota offre un collegamento diretto alle impostazioni per aggiungere o controllare le cartelle.
- La scaletta è più leggibile e può essere riordinata da tastiera con i pulsanti **Sposta più in alto** e **Sposta più in basso**.
- I badge e gli elementi informativi della TV seguono i temi scelti; sullo schermo TV si applica anche il carattere selezionato.
- I tasti da **1 a 9** avviano gli effetti disponibili, in linea con la guida e con i comandi mostrati nell'app.
- README e guida sono stati aggiornati per descrivere i formati, i codec e i comandi correnti.

## Scaricare e installare

Apri [Releases](https://github.com/CosmoNetinfo/CosmoKaraoke/releases/latest) e scarica il pacchetto per il tuo sistema:

- **Windows:** installer `.exe`
- **macOS:** immagine `.dmg`; trascina CosmoKaraoke nella cartella Applicazioni

Questa versione non è firmata con certificati di distribuzione del produttore. Windows o macOS possono quindi mostrare un avviso di sicurezza. Scarica il programma solo dalla pagina Releases ufficiale e non disattivare le protezioni del sistema per aprire file di provenienza incerta.

Quando è disponibile un aggiornamento, l'app mostra un avviso e propone di aggiornarsi e riavviarsi. L'aggiornamento non parte da solo mentre il programma è in uso.

## Primo avvio

1. Apri **Impostazioni → Cartelle** e scegli **Aggiungi cartella**. Seleziona la cartella che contiene i tuoi brani; vengono incluse anche le sottocartelle.
2. Attendi che la scansione mostri quanti file ha analizzato e quanti brani ha trovato. Se alcuni percorsi non sono accessibili, l'app avvisa e mantiene la libreria precedente.
3. Torna alla **Libreria**, cerca un titolo o un artista e premi **Accoda**. Puoi anche riprodurre subito o aggiungere il brano alla riserva.
4. In **Impostazioni → Schermo TV**, scegli il monitor e premi **Apri TV testi** nella barra in alto.
5. In **Cantanti**, aggiungi i nomi e scegli chi canta: il nome può apparire sullo schermo TV.

## Formati musicali

- **CD+G:** file audio e `.cdg` con lo stesso nome. L'app rileva i file accoppiati.
- **Archivi ZIP:** coppie audio e CDG; audio supportato negli archivi: MP3, WAV, WMA e OGG. I file vengono estratti nella cache durante la riproduzione.
- **Audio senza testo:** MP3, WMA, WAV, OGG, M4A, FLAC e AAC. Quando disponibili, titolo e artista vengono letti dai tag; altrimenti dal nome del file.
- **MIDI e KAR:** riproduzione con sintetizzatore incluso; i testi incorporati vengono mostrati quando presenti.
- **Video:** MP4, MKV, AVI, FLV, WebM, MOV e M4V. La riproduzione di audio e video dipende anche dai codec disponibili nel WebView del sistema operativo; due computer possono quindi supportare file diversi.

La libreria è indicizzata in SQLite sul computer e consente di cercare per titolo o artista. Quando aggiungi o rimuovi file, usa **Impostazioni → Cartelle → Riscansiona**.

## Scaletta e riproduzione

- La **Scaletta** contiene i brani in attesa; la **Riserva** tiene pronti quelli da usare più tardi.
- Puoi riordinare i brani trascinandoli oppure usando i pulsanti **Sposta più in alto** e **Sposta più in basso**. I pulsanti sono utilizzabili anche con la tastiera.
- Puoi assegnare un cantante a ogni brano, salvare una scaletta e ricaricarla.
- Il pannello di riproduzione consente di mettere in pausa, passare al brano successivo, cambiare tonalità e velocità e sfumare verso il brano successivo.

Tasti rapidi:

- **Spazio:** pausa o riprendi, quando il cursore non è in un campo di testo.
- **Ctrl+M** su Windows o **⌘+M** su Mac: dissolvenza e avvio del brano successivo.
- **1–9:** avvia uno dei primi nove effetti disponibili.
- **Esc:** ferma gli effetti attivi.

## Aspetto e accessibilità

Il menu **Aa** permette di scegliere la dimensione del testo, il carattere, la spaziatura e uno dei temi **Scuro**, **Crema** e **Alto contrasto**. Carattere e tema si applicano anche ai testi e alle informazioni sullo schermo TV; i colori originali di video e file CD+G restano quelli del contenuto. Nelle impostazioni TV puoi inoltre ingrandire i testi proiettati e scegliere colore o immagine di sfondo.

## Audio ed effetti

La scheda **Audio** offre tonalità, velocità, equalizzatore, riduzione della voce centrale e impostazione mono/stereo. L'uso del microfono nel programma è facoltativo e disattivato per impostazione iniziale: se il microfono è collegato a un mixer esterno, puoi lasciare che il mixer gestisca voce ed effetti. Quando abiliti il microfono nel programma, sono disponibili eco e riverbero.

La scheda **Effetti** include effetti sonori, effetti personalizzati, stacchetti automatici tra i brani e musica di sottofondo. Puoi anche impostare un'immagine da mostrare sullo schermo TV quando non ci sono testi.

## YouTube (facoltativo)

La scheda **YouTube** può cercare e mostrare anteprime. Per scaricare i video usa `yt-dlp`: se non è installato, l'app offre un pulsante per scaricarlo. L'uso della funzione e dei contenuti deve rispettare i termini del servizio, il diritto d'autore e le autorizzazioni dei titolari dei contenuti.

## Live: smartphone nella sala

La scheda **Live** può avviare un server locale e mostrare un QR code. Gli ospiti collegati alla stessa rete possono cercare brani nel catalogo o su YouTube, prenotarli con il proprio nome e inviare dediche. Dalla regia puoi approvare le richieste nella scaletta o nella riserva, rifiutarle, proiettare una dedica per 5, 10 o 20 secondi oppure lasciarla fissa, e consultare voti e classifica.

Sono disponibili un PIN facoltativo, un limite di prenotazioni per cantante e un filtro per parole bloccate. Avvia Live solo quando vuoi usare queste funzioni e interrompilo al termine della serata.

## Aggiornamenti

Gli aggiornamenti dell'app sono firmati con la chiave Tauri del progetto. Per pubblicare una versione, chi sviluppa aggiorna il numero di versione e carica il codice su `main`; GitHub Actions prepara i pacchetti Windows e macOS e crea la release.

La chiave privata di aggiornamento è conservata nei segreti GitHub Actions e **non deve essere caricata nel repository**. Se la chiave viene persa o sostituita, gli aggiornamenti delle installazioni già distribuite potrebbero non funzionare.

## Sviluppo

Requisiti: Node.js 22 e Rust. Per lo sviluppo nativo su macOS o Windows servono anche gli strumenti di compilazione richiesti da Tauri per quel sistema.

Per aggiornare la versione prima di un rilascio usa `npm run bump patch` (oppure `minor`, `major` o un numero preciso, per esempio `npm run bump 0.4.1`). Il comando aggiorna i file di configurazione e i lockfile Node e Rust. Il flusso automatico crea la release quando il numero di versione è nuovo.

```sh
npm install
npm run tauri dev
npm run build
npm run lint
```

`npm run build` controlla TypeScript e compila l'interfaccia. `npm run tauri dev` avvia l'app desktop. La pipeline di rilascio è in `.github/workflows/release.yml`; il backend Rust si trova in `src-tauri/`.

## Licenze

Il codice del progetto è attualmente destinato all'uso personale. Il programma include componenti di terze parti: Tauri (MIT/Apache-2.0), React (MIT), SoundTouchJS (MPL-2.0), spessasynth_lib (Apache-2.0), SoundFont TimGM6mb (GPL, incluso in `public/soundfont/TimGM6mb.sf2`), rusqlite (MIT), lofty (MIT/Apache-2.0), zip (MIT), axum (MIT), tokio (MIT), qrcode (MIT), lucide (ISC) e i caratteri Atkinson Hyperlegible, Lexend e OpenDyslexic (SIL Open Font License 1.1).
