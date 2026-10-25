use lofty::file::TaggedFileExt;
use lofty::probe::Probe;
use lofty::tag::Accessor;
use rusqlite::{params, Connection, Row};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs::File;
use std::io::Read;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Song {
    pub id: String,
    pub path: String,
    pub title: String,
    pub artist: String,
    /// "cdg" | "kar" | "video" | "audio"
    pub format: String,
    pub ext: String,
    pub cdg: Option<String>,
    pub zip_entry: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtractedZipSong {
    pub audio_path: String,
    pub cdg_path: Option<String>,
}

pub fn db_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    use tauri::Manager;
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("cosmokaraoke.db"))
}

pub fn open_db(app: &tauri::AppHandle) -> Result<Connection, String> {
    let path = db_path(app)?;
    let conn = Connection::open(&path).map_err(|e| e.to_string())?;
    conn.execute_batch(
        "PRAGMA journal_mode = WAL;
         PRAGMA synchronous = NORMAL;
         CREATE TABLE IF NOT EXISTS songs (
             id TEXT PRIMARY KEY,
             path TEXT NOT NULL,
             title TEXT NOT NULL,
             artist TEXT NOT NULL,
             format TEXT NOT NULL,
             ext TEXT NOT NULL,
             cdg TEXT,
             zip_entry TEXT
         );
         CREATE VIRTUAL TABLE IF NOT EXISTS songs_fts USING fts5(
             id UNINDEXED,
             title,
             artist,
             tokenize = 'unicode61 remove_diacritics 2'
         );",
    )
    .map_err(|e| e.to_string())?;
    Ok(conn)
}

fn map_song_row(r: &Row) -> rusqlite::Result<Song> {
    Ok(Song {
        id: r.get(0)?,
        path: r.get(1)?,
        title: r.get(2)?,
        artist: r.get(3)?,
        format: r.get(4)?,
        ext: r.get(5)?,
        cdg: r.get(6)?,
        zip_entry: r.get(7)?,
    })
}

/// Legge artista e titolo dai tag ID3 / Vorbis / MP4 tramite lofty.
fn read_audio_tags(p: &Path) -> Option<(String, String)> {
    let tagged_file = Probe::open(p).ok()?.read().ok()?;
    let tag = tagged_file.primary_tag().or_else(|| tagged_file.first_tag())?;
    let artist = tag.artist().map(|s| s.trim().to_string()).filter(|s| !s.is_empty())?;
    let title = tag.title().map(|s| s.trim().to_string()).filter(|s| !s.is_empty())?;
    Some((artist, title))
}

/// Scansiona una cartella riconoscendo file audio, video, MIDI/KAR e archivi .zip con MP3+CDG.
pub fn scan_directories(paths: &[String]) -> Vec<Song> {
    let mut songs = Vec::new();
    let mut seen = HashSet::new();

    for root in paths {
        for entry in WalkDir::new(root)
            .follow_links(false)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            if !entry.file_type().is_file() {
                continue;
            }
            let p = entry.path();
            let ext = match p.extension().and_then(|e| e.to_str()) {
                Some(e) => e.to_lowercase(),
                None => continue,
            };

            // Gestione archivi .zip con MP3+CDG
            if ext == "zip" {
                let path_str = p.to_string_lossy().to_string();
                if seen.insert(path_str.clone()) {
                    if let Ok(file) = File::open(p) {
                        if let Ok(mut archive) = zip::ZipArchive::new(file) {
                            let mut stems: std::collections::HashMap<String, (Option<String>, Option<String>)> =
                                std::collections::HashMap::new();

                            for i in 0..archive.len() {
                                if let Ok(entry) = archive.by_index(i) {
                                    let name = entry.name().to_string();
                                    let path_in_zip = Path::new(&name);
                                    let entry_ext = path_in_zip
                                        .extension()
                                        .and_then(|e| e.to_str())
                                        .map(|e| e.to_lowercase())
                                        .unwrap_or_default();
                                    let stem = path_in_zip
                                        .file_stem()
                                        .map(|s| s.to_string_lossy().to_string())
                                        .unwrap_or_default();

                                    if matches!(entry_ext.as_str(), "mp3" | "wav" | "wma" | "ogg") {
                                        stems.entry(stem).or_default().0 = Some(name);
                                    } else if entry_ext == "cdg" {
                                        stems.entry(stem).or_default().1 = Some(name);
                                    }
                                }
                            }

                            for (stem, (audio, cdg)) in stems {
                                if let (Some(audio_entry), Some(cdg_entry)) = (audio, cdg) {
                                    let (artist, title) = match stem.split_once(" - ") {
                                        Some((a, t)) => (a.trim().to_string(), t.trim().to_string()),
                                        None => (String::new(), stem.trim().to_string()),
                                    };
                                    let song_id = format!("{path_str}::{audio_entry}");
                                    songs.push(Song {
                                        id: song_id,
                                        path: path_str.clone(),
                                        title,
                                        artist,
                                        format: "cdg".to_string(),
                                        ext: "zip".to_string(),
                                        cdg: Some(cdg_entry),
                                        zip_entry: Some(audio_entry),
                                    });
                                }
                            }
                        }
                    }
                }
                continue;
            }

            let base_format = match ext.as_str() {
                "mp3" | "wma" | "wav" | "ogg" | "m4a" | "flac" | "aac" => "audio",
                "kar" | "mid" | "midi" => "kar",
                "mp4" | "mkv" | "avi" | "flv" | "webm" | "mov" | "m4v" => "video",
                _ => continue,
            };

            let path_str = p.to_string_lossy().to_string();
            if !seen.insert(path_str.clone()) {
                continue;
            }

            let mut format = base_format.to_string();
            let mut cdg: Option<String> = None;
            if base_format == "audio" {
                for c in ["cdg", "CDG", "Cdg"] {
                    let cp = p.with_extension(c);
                    if cp.is_file() {
                        cdg = Some(cp.to_string_lossy().to_string());
                        format = "cdg".to_string();
                        break;
                    }
                }
            }

            // Prova a leggere i tag ID3/audio con lofty
            let (artist, title) = if base_format == "audio" || base_format == "cdg" {
                if let Some((a, t)) = read_audio_tags(p) {
                    (a, t)
                } else {
                    let stem = p
                        .file_stem()
                        .map(|s| s.to_string_lossy().to_string())
                        .unwrap_or_default();
                    match stem.split_once(" - ") {
                        Some((a, t)) => (a.trim().to_string(), t.trim().to_string()),
                        None => (String::new(), stem.trim().to_string()),
                    }
                }
            } else {
                let stem = p
                    .file_stem()
                    .map(|s| s.to_string_lossy().to_string())
                    .unwrap_or_default();
                match stem.split_once(" - ") {
                    Some((a, t)) => (a.trim().to_string(), t.trim().to_string()),
                    None => (String::new(), stem.trim().to_string()),
                }
            };

            songs.push(Song {
                id: path_str.clone(),
                path: path_str,
                title,
                artist,
                format,
                ext,
                cdg,
                zip_entry: None,
            });
        }
    }

    songs.sort_by(|a, b| {
        a.artist
            .to_lowercase()
            .cmp(&b.artist.to_lowercase())
            .then(a.title.to_lowercase().cmp(&b.title.to_lowercase()))
    });

    songs
}

/// Salva i brani in SQLite e aggiorna l'indice FTS5 in una singola transazione.
pub fn save_songs_to_db(conn: &mut Connection, songs: &[Song]) -> Result<(), String> {
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    tx.execute("DELETE FROM songs", []).map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM songs_fts", []).map_err(|e| e.to_string())?;

    {
        let mut stmt_song = tx
            .prepare(
                "INSERT INTO songs (id, path, title, artist, format, ext, cdg, zip_entry)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            )
            .map_err(|e| e.to_string())?;

        let mut stmt_fts = tx
            .prepare("INSERT INTO songs_fts (id, title, artist) VALUES (?1, ?2, ?3)")
            .map_err(|e| e.to_string())?;

        for s in songs {
            stmt_song
                .execute(params![
                    s.id,
                    s.path,
                    s.title,
                    s.artist,
                    s.format,
                    s.ext,
                    s.cdg,
                    s.zip_entry
                ])
                .map_err(|e| e.to_string())?;

            stmt_fts
                .execute(params![s.id, s.title, s.artist])
                .map_err(|e| e.to_string())?;
        }
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

/// Carica tutti i brani da SQLite ordinati per artista e titolo.
pub fn load_songs_from_db(conn: &Connection) -> Result<Vec<Song>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, path, title, artist, format, ext, cdg, zip_entry
             FROM songs
             ORDER BY artist COLLATE NOCASE ASC, title COLLATE NOCASE ASC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], map_song_row).map_err(|e| e.to_string())?;

    let mut songs = Vec::new();
    for r in rows {
        songs.push(r.map_err(|e| e.to_string())?);
    }
    Ok(songs)
}

/// Ricerca full-text istantanea con FTS5 (supporto prefisso e diacritici).
pub fn search_songs_fts(
    conn: &Connection,
    query: &str,
    format_filter: Option<&str>,
    limit: usize,
) -> Result<Vec<Song>, String> {
    let clean = query.trim();
    if clean.is_empty() {
        let sql = match format_filter {
            Some(_) => {
                "SELECT id, path, title, artist, format, ext, cdg, zip_entry
                 FROM songs WHERE format = ?1
                 ORDER BY artist COLLATE NOCASE ASC, title COLLATE NOCASE ASC LIMIT ?2"
            }
            None => {
                "SELECT id, path, title, artist, format, ext, cdg, zip_entry
                 FROM songs
                 ORDER BY artist COLLATE NOCASE ASC, title COLLATE NOCASE ASC LIMIT ?1"
            }
        };

        let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
        let mut songs = Vec::new();
        if let Some(fmt) = format_filter {
            let rows = stmt
                .query_map(params![fmt, limit], map_song_row)
                .map_err(|e| e.to_string())?;
            for s in rows {
                songs.push(s.map_err(|e| e.to_string())?);
            }
        } else {
            let rows = stmt
                .query_map(params![limit], map_song_row)
                .map_err(|e| e.to_string())?;
            for s in rows {
                songs.push(s.map_err(|e| e.to_string())?);
            }
        }
        return Ok(songs);
    }

    // Costruisce la query FTS con prefisso per ogni parola (es. "alb*" AND "vasc*")
    let words: Vec<String> = clean
        .split_whitespace()
        .map(|w| {
            let escaped = w.replace('"', "\"\"");
            format!("\"{escaped}\"*")
        })
        .collect();
    let fts_match = words.join(" AND ");

    let sql = match format_filter {
        Some(_) => {
            "SELECT s.id, s.path, s.title, s.artist, s.format, s.ext, s.cdg, s.zip_entry
             FROM songs_fts f
             JOIN songs s ON s.id = f.id
             WHERE songs_fts MATCH ?1 AND s.format = ?2
             ORDER BY rank
             LIMIT ?3"
        }
        None => {
            "SELECT s.id, s.path, s.title, s.artist, s.format, s.ext, s.cdg, s.zip_entry
             FROM songs_fts f
             JOIN songs s ON s.id = f.id
             WHERE songs_fts MATCH ?1
             ORDER BY rank
             LIMIT ?2"
        }
    };

    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
    let mut songs = Vec::new();
    if let Some(fmt) = format_filter {
        let rows = stmt
            .query_map(params![fts_match, fmt, limit], map_song_row)
            .map_err(|e| e.to_string())?;
        for s in rows {
            songs.push(s.map_err(|e| e.to_string())?);
        }
    } else {
        let rows = stmt
            .query_map(params![fts_match, limit], map_song_row)
            .map_err(|e| e.to_string())?;
        for s in rows {
            songs.push(s.map_err(|e| e.to_string())?);
        }
    }
    Ok(songs)
}

/// Estrae i file audio e .cdg da uno zip in una cartella cache per consentire la riproduzione immediata.
pub fn extract_zip_song(
    cache_dir: &Path,
    zip_path: &str,
    audio_entry: &str,
    cdg_entry: Option<&str>,
) -> Result<ExtractedZipSong, String> {
    let zip_file = File::open(zip_path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(zip_file).map_err(|e| e.to_string())?;

    let out_dir = cache_dir.join("zip_cache");
    std::fs::create_dir_all(&out_dir).map_err(|e| e.to_string())?;

    // Pulizia file temporanei vecchi (> 30 min) per non riempire il disco
    if let Ok(entries) = std::fs::read_dir(&out_dir) {
        for e in entries.filter_map(|e| e.ok()) {
            if let Ok(meta) = e.metadata() {
                if let Ok(modified) = meta.modified() {
                    if modified.elapsed().map(|d| d.as_secs() > 1800).unwrap_or(false) {
                        let _ = std::fs::remove_file(e.path());
                    }
                }
            }
        }
    }

    let ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0);

    // Estrai audio
    let audio_ext = Path::new(audio_entry)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("mp3");
    let target_audio = out_dir.join(format!("zip_{ts}.{audio_ext}"));
    {
        let mut entry = archive.by_name(audio_entry).map_err(|e| e.to_string())?;
        let mut outfile = File::create(&target_audio).map_err(|e| e.to_string())?;
        let mut buf = Vec::new();
        entry.read_to_end(&mut buf).map_err(|e| e.to_string())?;
        std::io::Write::write_all(&mut outfile, &buf).map_err(|e| e.to_string())?;
    }

    // Estrai cdg se presente
    let target_cdg = if let Some(cdg_name) = cdg_entry {
        let cdg_path = out_dir.join(format!("zip_{ts}.cdg"));
        if let Ok(mut entry) = archive.by_name(cdg_name) {
            if let Ok(mut outfile) = File::create(&cdg_path) {
                let mut buf = Vec::new();
                let _ = entry.read_to_end(&mut buf);
                let _ = std::io::Write::write_all(&mut outfile, &buf);
                Some(cdg_path.to_string_lossy().to_string())
            } else {
                None
            }
        } else {
            None
        }
    } else {
        None
    };

    Ok(ExtractedZipSong {
        audio_path: target_audio.to_string_lossy().to_string(),
        cdg_path: target_cdg,
    })
}
