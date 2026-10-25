/**
 * Spiegazioni che compaiono quando passi il mouse su un pulsante o un comando.
 * La chiave è l'inizio del testo del comando (minuscolo). Vince la chiave più lunga.
 * Per aggiungerne una: basta una riga qui sotto, non serve toccare i componenti.
 */
export const HINTS: Record<string, string> = {
  // schede principali
  libreria: 'Qui trovi tutti i tuoi brani. Cerca per titolo o artista e mettili in scaletta.',
  youtube: 'Cerca basi karaoke su YouTube e mettile in scaletta. Serve il programma yt-dlp.',
  audio: 'Tonalità, velocità, equalizzatore e uscita audio (Mono o Stereo).',
  effetti: 'Applausi, fischi, stacchetti tra i brani, musica di sottofondo e sfondo della TV.',
  live: 'Server per prenotazioni da smartphone, dediche sulla TV e voti del pubblico.',
  impostazioni: 'Cartelle dei brani, schermo TV, aggiornamenti e guida del programma.',
  // intestazione
  aa: "Cambia la grandezza delle scritte, il carattere e i colori dell'app.",
  'schermo nero':
    'Spegne subito l’immagine sulla TV. Il programma continua a funzionare. Premi di nuovo per rimetterla.',
  'apri schermo testi':
    'Apre la finestra con i testi da cantare. Trascinala sulla TV o sul secondo schermo.',
  'chiudi schermo testi': 'Chiude la finestra dei testi sulla TV.',
  // lettore
  'avvia scaletta': 'Fa partire il primo brano della scaletta.',
  pausa: 'Mette in pausa la musica.',
  riprendi: 'Fa ripartire la musica dal punto in cui l’avevi fermata.',
  ferma: 'Ferma quello che sta suonando.',
  'passa subito al prossimo': 'Passa subito al brano dopo, senza dissolvenza.',
  prossimo: 'Passa subito al brano dopo, senza dissolvenza.',
  mix: 'Dissolvenza: il brano in corso sfuma piano e parte il successivo.',
  'dissolvenza del brano': 'Dissolvenza: il brano in corso sfuma piano e parte il successivo.',
  invia: 'Mostra il messaggio sulla TV.',
  'togli il messaggio': 'Fa sparire il messaggio dalla TV.',
  'messaggio sullo schermo':
    'Scrivi un messaggio, per esempio «Tocca a Maria!», e premi Invio: compare sulla TV.',
  'nome del cantante': 'Scrivi il nome e premi Invio: lo vedrai sulla TV quando canta.',
  'usa per i prossimi brani': 'Il cantante scelto verrà assegnato ai brani che aggiungi da adesso.',
  elimina: 'Cancella questo cantante dall’elenco.',
  // libreria e scaletta
  'cerca per titolo': 'Scrivi una parte del titolo o del nome del cantante.',
  'tutti i formati': 'Mostra solo un tipo di brano (CD+G, video, solo audio, MIDI/KAR).',
  'riproduci subito': 'Fa partire questo brano adesso.',
  'riproduci ora': 'Fa partire questo brano adesso.',
  'ascolta in cuffia': 'Lo ascolti solo tu in cuffia, senza che si senta in sala.',
  'aggiungi alla scaletta': 'Mette il brano in fondo alla scaletta.',
  'aggiungi alla riserva': 'Lo mette nella riserva: una seconda lista di brani pronti.',
  'mostra altri': 'Mostra altri brani dell’elenco.',
  su: 'Sposta il brano più in alto nella lista.',
  giù: 'Sposta il brano più in basso nella lista.',
  'sposta nella riserva': 'Toglie il brano dalla scaletta e lo mette nella riserva.',
  'sposta nella scaletta': 'Toglie il brano dalla riserva e lo mette nella scaletta.',
  togli: 'Toglie questo elemento (non cancella nessun file dal computer).',
  'salva scaletta': 'Salva la scaletta attuale con un nome per riusarla quando vuoi.',
  'playlist salvate': 'Mostra le playlist salvate per ricaricarle o cancellarle.',
  'carica in scaletta': 'Carica questa playlist e sostituisce i brani in scaletta.',
  '+ aggiungi': 'Aggiunge i brani di questa playlist in fondo alla scaletta.',
  'elimina playlist': 'Elimina questa playlist salvata (i brani restano sul computer).',
  'svuota scaletta': 'Toglie tutti i brani dalla scaletta.',
  'svuota riserva': 'Toglie tutti i brani dalla riserva.',
  'trascina per spostare':
    'Tieni premuto e trascina per cambiare ordine o spostare nell’altra lista.',
  // YouTube
  cerca: 'Cerca su YouTube quello che hai scritto.',
  anteprima: 'Guarda il video prima di decidere (si sente anche l’audio).',
  'in scaletta': 'Mette il brano in scaletta e lo scarica da solo in sottofondo.',
  'metti in scaletta': 'Mette il brano in scaletta e lo scarica da solo in sottofondo.',
  'metti in riserva': 'Lo mette nella riserva e lo scarica da solo in sottofondo.',
  'solo scarica': 'Scarica il video sul computer senza metterlo in scaletta.',
  'scarica yt-dlp': 'Installa il programma che serve per scaricare da YouTube. Basta un clic.',
  'aggiorna yt-dlp': 'Scarica l’ultima versione di yt-dlp. Fallo se YouTube smette di funzionare.',
  // audio
  tonalità: 'Alza o abbassa il tono della canzone, a gradini, per adattarla alla tua voce.',
  velocità: 'Rallenta o accelera il brano senza cambiare il tono.',
  'dissolvenza «mix»': 'Quanti secondi dura la dissolvenza del pulsante Mix.',
  'togli la voce':
    'Prova a togliere la voce cantata dal brano. Funziona meglio sui brani in stereo.',
  'uscita audio':
    'Stereo: suono normale. Mono: tutto su un solo canale, utile con un solo altoparlante.',
  stereo: 'Suono normale da sinistra e da destra.',
  mono: 'Unisce tutto su un solo canale: usalo se c’è un solo altoparlante.',
  azzera: 'Riporta tonalità, velocità ed equalizzatore ai valori originali.',
  'riporta tonalità': 'Riporta tonalità, velocità ed equalizzatore ai valori originali.',
  volume: 'Volume generale del programma.',
  // microfono
  acceso: 'Spegne il microfono del computer.',
  spento: 'Accende il microfono del computer.',
  'volume voce': 'Quanto forte si sente il microfono.',
  'effetto pronto': 'Scegli una combinazione già pronta di riverbero, eco e voce.',
  pulita: 'Voce quasi senza effetti.',
  'sala concerti': 'Un po’ di riverbero e di eco, come in una sala.',
  teatro: 'Riverbero grande e voce brillante.',
  'voce doppia': 'Aggiunge una seconda voce leggermente spostata, come un coro.',
  'eco da stadio': 'Eco lungo, come in uno stadio.',
  quantità: 'Quanto effetto aggiungere.',
  'grandezza sala': 'Da una stanza piccola a una chiesa grande.',
  distanza: 'Quanto tempo passa tra la voce e il suo eco.',
  ripetizioni: 'Quante volte si ripete l’eco.',
  bassi: 'Più bassi: voce più calda e piena. Meno bassi: voce più leggera.',
  acuti: 'Più acuti: voce più chiara e brillante. Meno acuti: voce più morbida.',
  'livellatore voce':
    'Rende la voce più regolare, così le urla non saturano e i sussurri si sentono.',
  'usa il microfono dentro il programma': 'Lascia spento se il microfono è nel mixer esterno.',
  // effetti
  'volume effetti': 'Quanto forti suonano gli effetti (applausi, fischi…).',
  'togli effetti': 'Ti fa togliere dall’elenco gli effetti che non ti servono.',
  fatto: 'Esci dalla modalità «togli effetti».',
  'rimetti quelli tolti': 'Rimette tutti gli effetti che avevi tolto.',
  'aggiungi file audio': 'Scegli uno o più file audio dal computer.',
  prova: 'Ascolta questo file.',
  'metti uno stacchetto': 'Quando finisce un brano, parte una musichetta prima del successivo.',
  'ogni quanti brani': 'Ogni quanti brani deve partire uno stacchetto.',
  'scegli lo stacchetto a caso': 'Spuntato: sceglie a caso. Non spuntato: uno dopo l’altro.',
  'avvia sottofondo': 'Fa partire la musica di sottofondo. Si ferma da sola quando parte un brano.',
  'ferma sottofondo': 'Ferma la musica di sottofondo.',
  'brano successivo': 'Passa alla canzone seguente del sottofondo.',
  'volume sottofondo': 'Quanto forte suona la musica di sottofondo.',
  'riprendi da solo': 'Quando finisce la scaletta, il sottofondo riparte da solo.',
  'brani in ordine casuale': 'Il sottofondo sceglie le canzoni a caso.',
  'scegli immagine': 'Scegli una foto da mostrare sulla TV quando non c’è un testo da cantare.',
  'cambia immagine': 'Scegli un’altra foto per la TV.',
  'togli immagine': 'Toglie la foto dalla TV: resta il colore di sfondo.',
  'salta stacchetto': 'Interrompe lo stacchetto e passa al brano dopo.',
  'ferma tutti gli effetti':
    'Ferma tutti gli effetti che stanno suonando. Funziona anche il tasto Esc.',
  // impostazioni
  'aggiungi cartella':
    'Scegli la cartella dove tieni i brani: il programma legge anche le sottocartelle.',
  riscansiona: 'Rilegge le cartelle per trovare i brani nuovi.',
  'togli dalla libreria': 'Toglie la cartella dall’elenco. I file non vengono cancellati.',
  monitor: 'Scegli su quale schermo deve comparire il testo da cantare.',
  'colore di sfondo': 'Colore dello sfondo della TV.',
  'immagine di sfondo': 'Una foto da mostrare sulla TV quando non c’è un testo.',
  'grandezza testi': 'Ingrandisce le scritte sulla TV.',
  'allarga i testi': 'Allarga l’immagine del karaoke fino ai bordi, anche se si deforma un po’.',
  'uscita cuffie': 'La cuffia o l’uscita su cui ascolti l’anteprima.',
  'cerca aggiornamenti': 'Controlla se esiste una versione nuova del programma.',
  'aggiorna e riavvia': 'Scarica la versione nuova e riapre il programma. Non succede mai da solo.',
  'mostra i suggerimenti': 'Questi fumetti di aiuto. Spuntato: compaiono quando passi il mouse.',
  // live server
  'accendi server': 'Avvia il server Wi-Fi per consentire agli ospiti di prenotare brani dal cellulare.',
  'spegni server': 'Disattiva il server Wi-Fi e blocca le connessioni dal cellulare.',
  'qr code': 'Mostra il codice QR da inquadrare con la fotocamera dello smartphone.',
  'copia indirizzo': 'Copia il link del server Live negli appunti.',
  'apri interfaccia mobile': 'Apre la pagina per gli smartphone nel browser del computer per provarla.',
  rifiuta: 'Rifiuta questa richiesta di prenotazione inviata dal cellulare.',
  'mostra sulla tv': 'Mostra questa dedica o messaggio per 10 secondi sul maxi-schermo della TV.',
  'salva regole': 'Salva le impostazioni e i filtri di sicurezza della sala.',
}

const KEYS = Object.keys(HINTS).sort((a, b) => b.length - a.length)

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

/** Trova la spiegazione per un testo (il più simile all'inizio). */
export function hintForText(text: string): string | null {
  const t = norm(text)
  if (!t) return null
  for (const k of KEYS) if (t.startsWith(k)) return HINTS[k]
  return null
}
