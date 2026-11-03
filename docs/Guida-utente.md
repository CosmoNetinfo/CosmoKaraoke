# Guida utente di CosmoKaraoke

Questa guida accompagna la versione 0.4.4. I nomi dei comandi si riferiscono all'interfaccia italiana.

## 1. Installazione e primo avvio

Scarica l'installer Windows o il pacchetto macOS dalla [pagina Releases](https://github.com/CosmoNetinfo/CosmoKaraoke/releases/latest). Avvia l'installer e apri CosmoKaraoke.

1. Apri **Impostazioni → Cartelle**.
2. Seleziona **Aggiungi cartella** e scegli una cartella che contiene i tuoi brani karaoke. Puoi aggiungerne più di una; vengono incluse anche le sottocartelle.
3. Attendi che la scansione mostri i file analizzati e i brani trovati. Per aggiornare il catalogo dopo aver aggiunto o spostato file, premi **Riscansiona**.
4. Torna a **Libreria** e cerca il titolo o l'artista.

La libreria e le impostazioni restano sul computer. Non serve creare un account.

## 2. Skin, layout e leggibilità

Apri **Impostazioni → Aspetto** per scegliere una skin. Le anteprime distinguono anche il layout:

| Skin | Categoria | Layout |
| --- | --- | --- |
| Cosmo Notte | Standard | Standard |
| Studio Perla | Standard | Standard chiaro |
| Broadcast | Professionale | Regia laterale e dock inferiore |
| Control Room | Professionale | Regia laterale e dock inferiore |
| Salotto | Casa | Standard |
| Festa | Casa | Standard |
| Stage Black | Premium | Regia laterale e dock inferiore |

La selezione viene salvata e riutilizzata all'avvio. Per un colore personale usa il selettore colore nella pagina Aspetto. Il pulsante **Aa** permette di regolare al volo la dimensione dell'interfaccia; nelle opzioni Standard sono disponibili anche carattere, spaziatura e temi accessibili.

Nel layout Professionale:

- premi il pulsante in alto vicino al marchio per alternare la barra laterale completa e la modalità con sole icone;
- trascina il bordo destro della barra laterale per regolarne la larghezza;
- trascina il bordo superiore del pannello inferiore per regolarne l'altezza;
- usa **Riproduzione e TV** e **Scaletta e cantanti** per cambiare il contenuto della regia inferiore;
- premi il controllo con le frecce in alto a destra del dock per alternare altezza compatta e ampia.

## 3. Libreria e formati

La barra di ricerca della **Libreria** cerca titolo e artista. I filtri separano i brani CD+G, KAR e video. Ogni risultato può essere ascoltato in anteprima, accodato o avviato subito.

Formati riconosciuti:

- **CD+G:** file audio accompagnato da un file `.cdg` con lo stesso nome;
- **ZIP CD+G:** archivio con audio e grafica CD+G;
- **MIDI/KAR:** riproduzione con il sintetizzatore incluso; il testo appare se il file KAR lo contiene;
- **audio:** tra gli altri MP3, WMA, WAV, OGG, M4A, FLAC e AAC;
- **video:** tra gli altri MP4, MKV, AVI, FLV, WebM, MOV e M4V. I codec disponibili dipendono dal sistema operativo.

## 4. Scaletta, riserva e cantanti

La sezione **Scaletta e cantanti** contiene schede per **Scaletta**, **Riserva**, **Cantanti** e **Salvate**.

- Aggiungi un brano alla scaletta dalla Libreria o da YouTube. La riserva serve a preparare brani da usare più tardi.
- Riordina i brani trascinandoli o usando i pulsanti per spostarli in alto e in basso.
- Usa le frecce di trasferimento per spostare un brano tra scaletta e riserva.
- In **Cantanti**, aggiungi i nomi e scegli il cantante attivo. Puoi anche assegnare un cantante direttamente a un brano in coda.
- Per conservare una selezione, scrivi un nome e premi **Salva**. La scheda **Salvate** permette di ricaricarla.
- Se togli un brano per errore, usa **Annulla** o **Ctrl+Z** (⌘Z su Mac) entro il tempo indicato dalla notifica.

## 5. Riproduzione e controlli audio

Il pannello **Riproduzione e TV** mostra anteprima, brano corrente e controlli di trasporto. Puoi mettere in pausa o riprendere, fermare, saltare al prossimo brano, spostare il punto di ascolto, cambiare tonalità e velocità, oppure avviare la dissolvenza verso il prossimo brano.

Apri la sezione **Audio** per le regolazioni complete:

- **Brano:** volume, tonalità, velocità, uscita mono/stereo, riduzione della voce centrale (quando il formato lo consente) e durata della dissolvenza;
- **Equalizzatore:** dieci bande regolabili da -12 a +12 dB. I preset Neutro, Voce chiara, Caldo, Bassi e Brillante impostano direttamente le bande; puoi poi modificarle una per una;
- **Microfono:** attiva il microfono del computer e regola il volume;
- **Effetti voce:** regola eco, riverbero, chorus, bassi, alti e compressione. Puoi applicare un preset e personalizzarlo.

L'attivazione del microfono può chiedere il permesso al sistema operativo. Se usi un mixer esterno, puoi lasciarlo spento e gestire la voce dal mixer.

## 6. Schermo testi e messaggi

In **Impostazioni → Schermo TV**, scegli il monitor, il colore o l'immagine di sfondo e la grandezza dei testi. Premi **Apri TV testi** nella barra superiore per aprire la finestra sullo schermo scelto. **Schermo nero** oscura temporaneamente la proiezione senza chiuderla.

Nel pannello di regia puoi inviare un annuncio alla TV per 5, 10 o 20 secondi, oppure lasciarlo fisso; **Cancella** rimuove il messaggio.

## 7. Effetti e musica di sottofondo

La sezione **Effetti** permette di avviare i suoni inclusi, gestire quelli personalizzati, impostare stacchetti tra i brani e configurare musica di sottofondo. Per fermare gli effetti attivi premi **Esc**.

## 8. Live con gli ospiti

La sezione **Live** avvia un server locale e mostra un QR code. Gli ospiti devono essere collegati alla stessa rete Wi-Fi del computer. Dal telefono possono consultare i brani, inviare richieste e dediche; dalla regia puoi gestire le richieste e moderare i messaggi.

PIN, limiti per cantante e filtro delle parole sono impostazioni facoltative. Avvia il server solo quando vuoi usare il servizio e fermalo a fine serata. Il firewall del computer può chiedere se consentire l'accesso alla rete locale.

## 9. YouTube

La sezione **YouTube** è facoltativa e richiede una connessione a Internet. `yt-dlp` è necessario per la funzione di download e può essere installato dalla pagina YouTube dell'app. Usa i contenuti nel rispetto dei termini del servizio e delle autorizzazioni dei titolari.

## 10. Tasti rapidi e problemi comuni

- **Spazio:** pausa/riprendi, se il cursore non è in un campo di testo.
- **Ctrl+M** (Windows) o **⌘+M** (Mac): dissolvenza e avvio del brano successivo.
- **1–9:** avvia uno dei primi nove effetti disponibili.
- **Esc:** ferma gli effetti attivi.

**La Libreria è vuota:** controlla le cartelle in Impostazioni e avvia una nuova scansione. Verifica anche che i file siano in uno dei formati riconosciuti.

**Non sento il microfono:** controlla il permesso del microfono nelle impostazioni di Windows/macOS, seleziona la sezione Microfono e premi il comando di attivazione. Per ridurre il rischio di feedback usa le cuffie o abbassa i monitor vicino al microfono.

**Il video non si apre:** i formati video dipendono dai codec disponibili nel WebView del sistema operativo. Prova un file MP4 supportato dal sistema.

**Gli ospiti non vedono il QR/server:** verifica che telefono e computer siano sulla stessa rete e consenti CosmoKaraoke nel firewall per la rete privata.

## 11. Aggiornamenti

Quando una nuova release è pronta, l'app controlla gli aggiornamenti e propone l'installazione. Non si riavvia senza conferma. Puoi anche scaricare manualmente l'ultima versione dalla [pagina Releases](https://github.com/CosmoNetinfo/CosmoKaraoke/releases/latest).
