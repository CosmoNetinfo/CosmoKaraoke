// Cambia il numero di versione in tutti i file che lo contengono.
// Uso:  npm run bump patch      (0.1.0 -> 0.1.1)
//       npm run bump minor      (0.1.0 -> 0.2.0)
//       npm run bump major      (0.1.0 -> 1.0.0)
//       npm run bump 0.3.5      (numero preciso)
import { readFileSync, writeFileSync } from 'node:fs'

const arg = process.argv[2]
if (!arg) {
  console.error('Indica patch, minor, major oppure un numero (es. 0.3.5).')
  process.exit(1)
}

const conf = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8'))
const [maj, min, pat] = conf.version.split('.').map(Number)
let next
if (arg === 'patch') next = `${maj}.${min}.${pat + 1}`
else if (arg === 'minor') next = `${maj}.${min + 1}.0`
else if (arg === 'major') next = `${maj + 1}.0.0`
else if (/^\d+\.\d+\.\d+$/.test(arg)) next = arg
else {
  console.error(`"${arg}" non è valido: usa patch, minor, major oppure x.y.z`)
  process.exit(1)
}

conf.version = next
writeFileSync('src-tauri/tauri.conf.json', JSON.stringify(conf, null, 2) + '\n')

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
pkg.version = next
writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n')

const cargo = readFileSync('src-tauri/Cargo.toml', 'utf8')
writeFileSync('src-tauri/Cargo.toml', cargo.replace(/^version = ".*"$/m, `version = "${next}"`))

console.log(`Versione aggiornata: ${conf.version === next ? next : next}`)
console.log('Ora fai commit e push su main: GitHub compila e pubblica la nuova versione.')
