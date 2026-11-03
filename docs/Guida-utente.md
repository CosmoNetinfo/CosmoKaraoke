# Guida utente di CosmoKaraoke

**Versione descritta: 0.4.4.** Questa guida accompagna le schermate e i comandi dell'interfaccia italiana. La libreria e le preferenze vengono salvate sul computer; non serve un account.

## Avvio rapido

Per preparare una serata per la prima volta:

1. Apri **Impostazioni → Cartelle** e aggiungi la cartella che contiene i brani.
2. Vai in **Impostazioni → Aspetto** e scegli lo stile Standard o una skin Professionale.
3. Torna in **Libreria**, cerca un brano e premi **Accoda**.
4. In **Cantanti**, registra i nomi dei partecipanti e, se vuoi, assegnali ai brani.
5. Collega il televisore o il secondo monitor, apri **Impostazioni → Schermo TV** e scegli dove mostrare i testi.
6. Seleziona il primo brano della scaletta e premi **Avvia** nel pannello di riproduzione.

## 1. Orientarsi nell'interfaccia

La barra superiore contiene il marchio, il comando **Aa** per l'accessibilità, **Schermo nero** e **Apri TV testi**. La barra di stato sotto mostra se la regia è pronta, in pausa o in riproduzione, il brano corrente, quanti brani sono in scaletta e lo stato della TV.

Le sezioni principali sono **Libreria**, **YouTube**, **Audio**, **Effetti**, **Live** e **Impostazioni**.

Il layout **Standard** mostra player e serata nella colonna di destra. Le skin **Broadcast**, **Control Room** e **Stage Black** usano il layout **Professionale**: navigazione laterale e pannello inferiore a schede. In quel layout **Riproduzione e TV** contiene anteprima, player e messaggi; **Scaletta e cantanti** contiene la serata.

## 2. Installare e avviare

Scarica il pacchetto adatto al computer dalla [pagina Releases](https://github.com/CosmoNetinfo/CosmoKaraoke/releases/latest): installer `.exe` per Windows oppure pacchetto `.dmg` per macOS. Installa e avvia CosmoKaraoke come un normale programma.

La prima volta l'elenco brani può essere vuoto: aggiungi una o più cartelle musicali prima di cercare. Non spostare o rinominare i file mentre una canzone è in riproduzione. Se cambi la struttura delle cartelle, esegui una nuova scansione.

## 3. Scegliere una skin e regolare la leggibilità

Apri **Impostazioni → Aspetto**. Ogni scheda mostra il nome, la categoria, il tipo di layout e una piccola anteprima. Seleziona una skin per applicarla subito; la scelta viene salvata per il successivo avvio.

| Skin | Categoria | Disposizione |
| --- | --- | --- |
| Cosmo Notte | Standard | Navigazione superiore e player laterale |
| Studio Perla | Standard | Layout Standard con superfici chiare |
| Broadcast | Professionale | Navigazione laterale e dock inferiore |
| Control Room | Professionale | Navigazione laterale e dock inferiore |
| Salotto | Casa | Layout Standard con palette calda |
| Festa | Casa | Layout Standard con palette viola e rosa |
| Stage Black | Premium | Regia Professionale scura con accento oro |

Il nome **Premium** identifica una skin grafica: non attiva abbonamenti o funzioni a pagamento.

Per usare la regia Professionale:

1. Scegli **Broadcast**, **Control Room** o **Stage Black**.
2. Premi il pulsante vicino al marchio per comprimere la barra laterale alle sole icone; premilo di nuovo per riaprire le etichette.
3. Per allargare o stringere la barra, trascina il suo bordo destro. Quando è compressa, riaprila prima di ridimensionarla.
4. Nel pannello inferiore trascina il bordo superiore per regolare quanto spazio occupa.
5. Usa le schede **Riproduzione e TV** e **Scaletta e cantanti** per passare da player e messaggi alla gestione della serata. Il pulsante con le frecce alterna altezza compatta e ampia.

Il pulsante **Aa** apre i controlli rapidi. Il cursore **Dimensione dell'interfaccia** riduce o ingrandisce testi e controlli. Nello stile Standard sono disponibili anche il colore principale, i temi Scuro/Crema/Alto contrasto, i caratteri inclusi e le regolazioni per spaziatura e altezza delle righe. In **Impostazioni → Aspetto** puoi impostare il colore personalizzato.

## 4. Preparare la libreria musicale

1. Apri **Impostazioni → Cartelle**.
2. Premi **Aggiungi cartella** e seleziona la cartella dei brani. Puoi ripetere l'operazione per altre cartelle.
3. Attendi la fine della scansione. La schermata mostra i file analizzati e i brani individuati.
4. Se una cartella non è accessibile, controlla che l'unità sia collegata e che Windows/macOS permetta all'app di leggerla. La libreria precedente viene mantenuta se una scansione incontra percorsi non accessibili.
5. Per rimuovere una cartella dall'indice, usa il pulsante cestino accanto al percorso. Per aggiornare l'indice dopo aver aggiunto file, premi **Riscansiona**.

Rimuovere una cartella dall'elenco dell'app non cancella i file musicali dal disco.

### Formati riconosciuti

- **CD+G:** una traccia audio e un file `.cdg` con lo stesso nome base, per esempio `Brano.mp3` e `Brano.cdg`.
- **ZIP CD+G:** archivio che contiene audio e grafica CD+G. L'app estrae i file necessari durante la riproduzione.
- **MIDI/KAR:** file MIDI riprodotti dal sintetizzatore incluso; i testi vengono visualizzati se sono incorporati nel file KAR.
- **Audio:** MP3, WMA, WAV, OGG, M4A, FLAC, AAC e altri formati supportati dal sistema.
- **Video:** MP4, MKV, AVI, FLV, WebM, MOV e M4V. La riproduzione dipende anche dai codec disponibili nel componente WebView del sistema operativo.

## 5. Cercare e aggiungere un brano

In **Libreria**:

1. Scrivi nel campo di ricerca il titolo, l'artista o una parte del nome del file.
2. Se necessario, filtra i risultati per **Tutti**, **CD+G**, **KAR** o **Video**.
3. Per ascoltare un'anteprima, usa l'icona cuffie. L'anteprima non aggiunge il brano alla scaletta.
4. Premi **Accoda** per inserirlo nella scaletta oppure **+** per metterlo nella riserva.
5. Usa il pulsante di riproduzione del risultato per avviarlo subito.

I brani CD+G accoppiati vengono trattati come una canzone sola. Se non trovi un file, controlla che la cartella corretta sia inclusa e che l'estensione sia supportata, poi riscansiona.

## 6. Gestire scaletta, riserva e cantanti

Apri la scheda **Scaletta e cantanti** (nel layout Standard è nel pannello **La serata**). Le sue schede sono:

- **Scaletta:** brani pronti per essere riprodotti nell'ordine mostrato.
- **Riserva:** brani conservati per dopo, senza interferire con la scaletta principale.
- **Cantanti:** elenco dei partecipanti e selezione di chi è al microfono.
- **Salvate:** scalette salvate con un nome.

Per organizzare la scaletta:

1. Trascina un brano per riordinarlo oppure usa i pulsanti **Sposta su** e **Sposta giù**.
2. Usa il pulsante con le frecce per spostare un brano tra scaletta e riserva.
3. Usa il cestino per rimuoverlo. Se l'hai tolto per errore, premi **Annulla** nella notifica oppure **Ctrl+Z** (⌘Z su Mac) entro il tempo indicato.
4. Per salvare una scaletta, inserisci un nome nel campo in fondo alla lista e premi **Salva**. Puoi ricaricarla o eliminarla dalla scheda **Salvate**.

Per assegnare i cantanti, apri **Cantanti**, aggiungi i nomi e seleziona il cantante attivo. Puoi anche assegnare un nome direttamente al singolo brano in coda. Il nome assegnato accompagna il brano nella gestione della serata e può essere mostrato sulla TV.

## 7. Riprodurre e controllare l'audio

Nel pannello di riproduzione:

- **Avvia/Riprendi:** parte il brano selezionato o riprende quello in pausa.
- **Stop:** interrompe la riproduzione corrente.
- **Salta:** passa al brano successivo in scaletta.
- **Barra di avanzamento:** trascina il cursore per spostarti in un altro punto del brano.
- **Tonalità:** cambia la tonalità a passi di un semitono.
- **Velocità:** cambia la velocità senza dover modificare manualmente il file.
- **Mixa con dissolvenza:** abbassa il brano attuale e avvia quello successivo con una transizione.

La sezione **Audio → Brano** contiene anche volume, tonalità e velocità con cursori più precisi, uscita **Stereo/Mono**, riduzione della voce centrale e durata della dissolvenza. La riduzione della voce funziona meglio con brani stereo in cui la voce è centrata; non è disponibile per MIDI/KAR.

### Equalizzatore

Apri **Audio → Equalizzatore**. Il controllo **Preset** applica una curva a tutte le 10 bande:

- **Neutro:** nessuna modifica;
- **Voce chiara:** enfatizza la zona di presenza della voce;
- **Caldo:** dà più corpo alle frequenze basse;
- **Bassi:** aumenta le frequenze più basse;
- **Brillante:** enfatizza le frequenze alte.

I preset sono punti di partenza: puoi regolare ciascuna banda individualmente da **-12 dB a +12 dB**. Se tocchi un cursore, il preset diventa **Personalizzato**. **Azzera** nella scheda Brano ripristina equalizzatore, tonalità, velocità e riduzione della voce.

### Microfono ed effetti voce

Per usare il microfono collegato al computer, apri **Audio → Microfono** e premi **Acceso**. Alla prima attivazione il sistema può chiedere il permesso di accesso. Regola **Volume voce** prima di iniziare.

In **Audio → Effetti voce** puoi scegliere un preset (Pulita, Sala concerti, Teatro, Voce doppia o Eco da stadio), poi personalizzare riverbero, dimensione della sala, eco, distanza e ripetizioni, chorus, bassi, acuti e livellamento della voce. Gli effetti si applicano al microfono dell'app.

Se il microfono è collegato a un mixer esterno, puoi lasciare spento il microfono nell'app e gestire volume ed effetti sul mixer. Per evitare fischi, usa cuffie oppure allontana il microfono dagli altoparlanti.

In **Impostazioni → Cuffie** puoi scegliere l'uscita per l'anteprima in cuffia se il sistema la supporta; altrimenti l'app mostra che questa opzione non è disponibile.

## 8. Collegare la TV e mostrare i testi

1. Collega il secondo monitor o il televisore al computer.
2. Apri **Impostazioni → Schermo TV** e seleziona il monitor dall'elenco. Se scegli **Finestra normale**, la TV si apre come una finestra ridimensionabile.
3. Facoltativamente scegli colore o immagine di sfondo, grandezza dei testi e allargamento fino ai bordi.
4. Premi **Apri TV testi** nella barra superiore.
5. Avvia un brano con testo. Controlla l'anteprima nella regia e sposta la finestra TV sullo schermo corretto se non è stata aperta sul monitor selezionato.

**Schermo nero** oscura temporaneamente la proiezione lasciando aperta la finestra. Premi di nuovo per ripristinare la visualizzazione.

Nel pannello **Messaggio sullo schermo TV**, scrivi un annuncio, scegli 5, 10 o 20 secondi oppure **fisso**, poi invia. **Cancella** rimuove il messaggio.

## 9. Effetti e musica tra i brani

La sezione **Effetti** contiene suoni pronti all'uso e strumenti per gestire effetti personalizzati, stacchetti musicali tra i brani e musica di sottofondo. I comandi disponibili dipendono dalla scheda Effetti selezionata. Premi **Esc** per fermare gli effetti attivi.

Gli stacchetti e la musica di sottofondo si configurano separatamente: scegli i file, regola volume e comportamento automatico e controlla le opzioni prima di avviare la serata. Gli stacchetti non sono brani da cantare e non vengono assegnati ai partecipanti.

## 10. Usare Live con i telefoni degli ospiti

Live crea un piccolo server sulla rete locale. Non è necessario installare un'app sui telefoni.

1. Collega computer e telefoni alla stessa rete Wi-Fi. Le reti ospiti o alcune reti aziendali possono impedire ai dispositivi di comunicare tra loro.
2. Apri **Live → Regole e filtri**. Imposta nome sala, porta, PIN facoltativo, numero massimo di prenotazioni per cantante, disponibilità delle richieste e parole da filtrare. Salva le impostazioni.
3. Premi **Accendi server**. Se Windows o macOS chiede il permesso di rete, consenti l'accesso sulla rete privata che stai usando.
4. Apri **QR Code e Link** e mostra il QR agli ospiti oppure copia l'indirizzo. Gli ospiti lo aprono con la fotocamera o il browser del telefono.
5. Gestisci le richieste dalla scheda **Prenotazioni**: puoi inserirle in scaletta, metterle in riserva o rifiutarle. Se attivi l'approvazione automatica, le richieste seguono direttamente le regole configurate.
6. Leggi le dediche in **Dediche e messaggi**. Puoi mostrarne una sulla TV per 10 secondi o eliminarla.
7. Consulta i voti e la media per cantante in **Classifica voti**.
8. Al termine della serata torna in Live e premi **Spegni server**.

Se il telefono non apre il link, verifica che entrambi i dispositivi siano sulla stessa rete e che il firewall consenta l'accesso a CosmoKaraoke. Non pubblicare il link su reti che non controlli; se vuoi limitare l'accesso, imposta un PIN.

## 11. Ricerca YouTube (facoltativa)

La sezione **YouTube** richiede una connessione a Internet. Scrivi titolo o artista, premi **Cerca** e attendi i risultati. Puoi aprire l'anteprima, aggiungere il risultato alla scaletta o alla riserva oppure scaricare il video.

Per scaricare serve `yt-dlp`; se manca, la pagina propone **Scarica yt-dlp**. In **Impostazioni → YouTube** puoi scegliere la cartella di destinazione. Le richieste YouTube approvate da Live possono essere accodate e scaricate quando partono.

Il download può essere soggetto ai termini del servizio, alle autorizzazioni dei titolari e alle leggi applicabili. Usa solo contenuti per cui hai i diritti o l'autorizzazione necessaria.

## 12. Aggiornare il programma

Apri **Impostazioni → Aggiornamenti** per controllare manualmente la disponibilità di una versione. CosmoKaraoke controlla anche all'avvio e periodicamente; mostra una proposta di aggiornamento e non si riavvia senza il tuo consenso. Se preferisci, scarica l'ultima release dalla pagina ufficiale collegata sopra.

## 13. Tasti rapidi

| Tasto | Azione |
| --- | --- |
| **Spazio** | Pausa o riprendi, se il cursore non è in un campo di testo |
| **Ctrl+M** (Windows) / **⌘+M** (Mac) | Dissolvenza e avvio del brano successivo |
| **1–9** | Avvia uno dei primi nove effetti disponibili |
| **Esc** | Ferma gli effetti attivi |
| **Ctrl+Z** (Windows) / **⌘+Z** (Mac) | Annulla la rimozione recente di un brano, se la notifica è ancora visibile |

## 14. Risoluzione dei problemi

### La Libreria non trova i miei brani

Controlla **Impostazioni → Cartelle**, verifica che il disco sia collegato e premi **Riscansiona**. Per CD+G controlla che audio e `.cdg` abbiano lo stesso nome base. Per i file KAR il testo deve essere incorporato nel file.

### La scansione segnala percorsi non accessibili

Ricollega il disco o rendi nuovamente disponibile la cartella. Quando una scansione incontra percorsi non accessibili, l'app conserva la libreria già indicizzata.

### Il brano è in riproduzione ma non sento l'audio

Controlla volume dell'app e del computer, uscita audio selezionata nel sistema operativo, cavi e mixer. Prova un file audio noto e verifica se il problema riguarda un singolo formato.

### Il microfono non si accende o non si sente

Consenti a CosmoKaraoke di usare il microfono nelle impostazioni di privacy del sistema. Poi torna in **Audio → Microfono** e attivalo. Se lo usi tramite un mixer esterno, verifica che l'ingresso e il canale siano aperti sul mixer.

### La finestra TV è sul monitor sbagliato

Chiudi la finestra TV, seleziona il monitor corretto in **Impostazioni → Schermo TV** e riaprila. Puoi usare **Finestra normale** per spostarla manualmente.

### Un video non si apre

La riproduzione video dipende dai codec installati e dal WebView del sistema operativo. Prova un MP4 supportato dal computer; file con estensioni simili possono usare codec interni diversi.

### Il QR Live si apre ma il telefono non carica la pagina

Controlla che computer e telefono siano sulla stessa rete, che il server Live sia acceso e che il firewall permetta le connessioni in ingresso sulla rete privata. Evita la rete Wi-Fi ospiti se isola i dispositivi.

## 15. Dati e limiti attuali

La libreria musicale e le preferenze vengono conservate localmente. Le funzioni YouTube e Live richiedono Internet o la rete locale quando le usi. La disponibilità di alcuni formati audio/video dipende dal computer e dai codec del sistema. Il programma non include un catalogo di brani: devi aggiungere file che hai già a disposizione.

Per problemi non risolti, indica sistema operativo, versione di CosmoKaraoke, formato del brano e passaggi che hai eseguito. Non allegare file musicali protetti o dati personali degli ospiti.
