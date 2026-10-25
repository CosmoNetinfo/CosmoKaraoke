import { useState } from 'react'
import { useStore } from '../lib/store'
import { Panel } from './ui'

const SEZIONI: { titolo: string; passi: string[] }[] = [
  {
    titolo: '1. Per cominciare',
    passi: [
      'Vai in Impostazioni → Cartelle e premi «Aggiungi cartella»: scegli la cartella dove hai i brani karaoke.',
      'Il programma legge tutte le sottocartelle da solo. Quando hai nuovi brani premi «Riscansiona».',
      'Sempre in Impostazioni → Schermo TV scegli su quale schermo vuoi vedere i testi, poi premi «Apri schermo testi» in alto.',
    ],
  },
  {
    titolo: '2. Mettere le canzoni in scaletta',
    passi: [
      'Nella scheda Libreria scrivi il titolo (o il cantante) nella casella di ricerca.',
      'Premi «+» accanto al brano per metterlo in scaletta. Con «Riserva» lo metti in una seconda lista, pronta per dopo.',
      'Prima di scrivere il nome del cantante, mettilo nella casella «Nome del cantante»: verrà mostrato sulla TV.',
      'Premi «Avvia scaletta» per far partire il primo brano. Con «Prossimo» passi al successivo.',
    ],
  },
  {
    titolo: '3. Cambiare tono e velocità',
    passi: [
      'Nella scheda Audio trovi Tonalità: alza o abbassa il tono per adattarlo alla voce di chi canta.',
      'Velocità rallenta o accelera la base senza cambiare il tono.',
      'Se usi un solo altoparlante scegli «Mono» nell’uscita audio, altrimenti lascia «Stereo».',
      '«Azzera» riporta tutto come era all’inizio.',
    ],
  },
  {
    titolo: '4. Effetti, stacchetti e sottofondo',
    passi: [
      'Nella scheda Effetti ci sono i pulsanti per applausi, fischi e altri suoni: basta un clic. Anche i tasti 1–9 della tastiera li fanno partire.',
      'Se qualcosa suona troppo, guarda la striscia «Sta suonando» in basso: premi Ferma accanto al suono, oppure il tasto Esc per fermare tutto.',
      'Gli stacchetti sono musichette che partono tra una canzone e l’altra: scegli i file e ogni quanti brani devono partire.',
      'Il sottofondo è musica che suona mentre nessuno canta, e si ferma da sola quando parte un brano.',
      'Puoi mettere una foto come sfondo della TV quando non c’è testo da cantare.',
    ],
  },
  {
    titolo: '5. Canzoni da YouTube',
    passi: [
      'Nella scheda YouTube la prima volta premi «Scarica yt-dlp» in Impostazioni → YouTube: è il programma che scarica i video. Basta un clic.',
      'Cerca la base karaoke, guarda l’anteprima e premi «In scaletta»: il brano si scarica da solo mentre fai altro.',
      'Se un giorno YouTube non funziona più, premi «Aggiorna yt-dlp».',
    ],
  },
  {
    titolo: '6. Microfono e mixer',
    passi: [
      'Se il microfono è collegato a un mixer esterno, non devi fare nulla: il programma non lo tocca.',
      'Se invece vuoi usare il microfono del computer, accendi «Usa il microfono dentro il programma» nella scheda Audio: appariranno riverbero e altri effetti voce.',
    ],
  },
  {
    titolo: '7. Aggiornare il programma',
    passi: [
      'Vai in Impostazioni → Aggiornamenti e premi «Cerca aggiornamenti».',
      'Se c’è una versione nuova premi «Aggiorna e riavvia». Non si aggiorna mai da solo mentre canti.',
    ],
  },
  {
    titolo: '8. Se qualcosa non va',
    passi: [
      'Non si sente niente: controlla il volume nella scheda Audio e l’uscita audio scelta in Impostazioni → Cuffie.',
      'La TV è nera: premi «Apri schermo testi» e controlla di aver scelto il monitor giusto.',
      'Un brano non parte: prova a premerci sopra due volte, oppure fai «Riscansiona».',
      'Se resta bloccato, chiudi e riapri il programma: la scaletta viene salvata da sola.',
    ],
  },
  {
    titolo: '9. Parole che si incontrano',
    passi: [
      'CD+G: il formato dei dischi karaoke classici, con musica e testo in due file (.cdg e .mp3).',
      'KAR / MIDI: brani fatti di note, non registrati: il programma li suona da sé e puoi cambiare tono e velocità senza perdere qualità.',
      'Scaletta: l’elenco dei brani che verranno cantati, in ordine.',
      'Riserva: una seconda lista di brani pronti, se le richieste cambiano.',
      'Dissolvenza: quando un brano sfuma piano mentre parte il successivo.',
    ],
  },
]

export function Guida() {
  const [open, setOpen] = useState(0)
  const showHints = useStore((s) => s.settings.showHints)
  const patch = useStore((s) => s.patchSettings)
  return (
    <Panel title="Guida semplice">
      <label className="mb-3 flex cursor-pointer items-center gap-3 text-lg">
        <input
          type="checkbox"
          className="h-6 w-6"
          checked={showHints}
          onChange={(e) => patch({ showHints: e.target.checked })}
        />
        <span>Mostra i suggerimenti quando passo il mouse sui pulsanti</span>
      </label>
      <div className="space-y-2">
        {SEZIONI.map((s, i) => (
          <div key={s.titolo} className="rounded-xl bg-row">
            <button
              type="button"
              onClick={() => setOpen(open === i ? -1 : i)}
              className="w-full px-4 py-3 text-left text-xl font-semibold"
              aria-expanded={open === i}
            >
              {open === i ? '▾ ' : '▸ '}
              {s.titolo}
            </button>
            {open === i && (
              <ul className="list-disc space-y-2 px-8 pb-4 text-lg leading-relaxed">
                {s.passi.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </Panel>
  )
}
