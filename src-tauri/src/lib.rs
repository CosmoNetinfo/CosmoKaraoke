use serde::Serialize;
use std::collections::HashSet;
use std::path::PathBuf;
use std::process::Command;
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};
use walkdir::WalkDir;

// ---------------------------------------------------------------------------
// Libreria
// ---------------------------------------------------------------------------

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct Song {
    id: String,
    path: String,
    title: String,
    artist: String,
    /// "cdg" | "kar" | "video" | "audio"
    format: String,
    ext: String,
    cdg: Option<String>,
}

/// Scansiona le cartelle indicate e restituisce i brani riconosciuti.
/// I file .cdg non compaiono da soli: vengono abbinati all'audio con lo stesso nome.
#[tauri::command]
async fn scan_library(paths: Vec<String>) -> Result<Vec<Song>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let mut songs: Vec<Song> = Vec::new();
        let mut seen: HashSet<String> = HashSet::new();

        for root in paths {
            for entry in WalkDir::new(&root)
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

                let stem = p
                    .file_stem()
                    .map(|s| s.to_string_lossy().to_string())
                    .unwrap_or_default();
                let (artist, title) = match stem.split_once(" - ") {
                    Some((a, t)) => (a.trim().to_string(), t.trim().to_string()),
                    None => (String::new(), stem.trim().to_string()),
                };

                songs.push(Song {
                    id: path_str.clone(),
                    path: path_str,
                    title,
                    artist,
                    format,
                    ext,
                    cdg,
                });
            }
        }

        songs.sort_by(|a, b| {
            a.artist
                .to_lowercase()
                .cmp(&b.artist.to_lowercase())
                .then(a.title.to_lowercase().cmp(&b.title.to_lowercase()))
        });
        Ok(songs)
    })
    .await
    .map_err(|e| e.to_string())?
}

// ---------------------------------------------------------------------------
// Salvataggio dati (impostazioni, code, libreria)
// ---------------------------------------------------------------------------

fn blob_path(app: &tauri::AppHandle, name: &str) -> Result<PathBuf, String> {
    if name != "state" && name != "library" {
        return Err("Nome dati non valido".into());
    }
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join(format!("{name}.json")))
}

#[tauri::command]
fn load_blob(app: tauri::AppHandle, name: String) -> Result<String, String> {
    let p = blob_path(&app, &name)?;
    if p.exists() {
        std::fs::read_to_string(p).map_err(|e| e.to_string())
    } else {
        Ok(String::new())
    }
}

#[tauri::command]
fn save_blob(app: tauri::AppHandle, name: String, json: String) -> Result<(), String> {
    let p = blob_path(&app, &name)?;
    let tmp = p.with_extension("json.tmp");
    std::fs::write(&tmp, json).map_err(|e| e.to_string())?;
    std::fs::rename(&tmp, &p).map_err(|e| e.to_string())
}

// ---------------------------------------------------------------------------
// yt-dlp (programma esterno, installato dall'utente)
// ---------------------------------------------------------------------------

fn ytdlp_command(app: &tauri::AppHandle) -> Command {
    let exe_name = if cfg!(windows) { "yt-dlp.exe" } else { "yt-dlp" };

    // 1) copia locale nella cartella dati dell'app (…/bin/yt-dlp)
    let mut program: PathBuf = PathBuf::from(exe_name);
    if let Ok(dir) = app.path().app_data_dir() {
        let local = dir.join("bin").join(exe_name);
        if local.is_file() {
            program = local;
        }
    }

    let mut cmd = Command::new(program);

    // 2) su macOS le app grafiche non vedono i percorsi di Homebrew
    if cfg!(target_os = "macos") {
        let base = std::env::var("PATH").unwrap_or_default();
        cmd.env("PATH", format!("{base}:/opt/homebrew/bin:/usr/local/bin"));
    }

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x0800_0000); // nessuna finestra nera
    }
    cmd
}

fn ytdlp_missing() -> String {
    "yt-dlp non trovato. Installalo (Windows: winget install yt-dlp, Mac: brew install yt-dlp) \
     oppure copia il programma nella cartella \"bin\" dei dati dell'app."
        .to_string()
}

#[tauri::command]
async fn ytdlp_check(app: tauri::AppHandle) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let out = ytdlp_command(&app)
            .arg("--version")
            .output()
            .map_err(|_| ytdlp_missing())?;
        if out.status.success() {
            Ok(String::from_utf8_lossy(&out.stdout).trim().to_string())
        } else {
            Err(ytdlp_missing())
        }
    })
    .await
    .map_err(|e| e.to_string())?
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct YtItem {
    id: String,
    title: String,
    channel: String,
    duration: Option<f64>,
}

#[tauri::command]
async fn ytdlp_search(app: tauri::AppHandle, query: String) -> Result<Vec<YtItem>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let q = format!("ytsearch10:{} karaoke", query.trim());
        let out = ytdlp_command(&app)
            .args(["--flat-playlist", "--dump-json", "--no-warnings", &q])
            .output()
            .map_err(|_| ytdlp_missing())?;
        if !out.status.success() {
            let err = String::from_utf8_lossy(&out.stderr).trim().to_string();
            return Err(format!("Ricerca non riuscita: {err}"));
        }
        let mut items = Vec::new();
        for line in String::from_utf8_lossy(&out.stdout).lines() {
            let v: serde_json::Value = match serde_json::from_str(line) {
                Ok(v) => v,
                Err(_) => continue,
            };
            let id = v["id"].as_str().unwrap_or_default().to_string();
            if id.is_empty() {
                continue;
            }
            items.push(YtItem {
                id,
                title: v["title"].as_str().unwrap_or("(senza titolo)").to_string(),
                channel: v["channel"]
                    .as_str()
                    .or_else(|| v["uploader"].as_str())
                    .unwrap_or_default()
                    .to_string(),
                duration: v["duration"].as_f64(),
            });
        }
        Ok(items)
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Scarica un video in formato mp4 e restituisce il percorso del file.
#[tauri::command]
async fn ytdlp_download(
    app: tauri::AppHandle,
    id: String,
    dest_dir: Option<String>,
) -> Result<String, String> {
    if !id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_') {
        return Err("Identificativo video non valido".into());
    }
    let dir: PathBuf = match dest_dir.filter(|d| !d.trim().is_empty()) {
        Some(d) => PathBuf::from(d),
        None => app
            .path()
            .app_data_dir()
            .map_err(|e| e.to_string())?
            .join("YouTube"),
    };
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    tauri::async_runtime::spawn_blocking(move || {
        let template = dir.join("%(title)s.%(ext)s");
        let url = format!("https://www.youtube.com/watch?v={id}");
        let out = ytdlp_command(&app)
            .args([
                "--no-playlist",
                "--no-warnings",
                "--windows-filenames",
                "-f",
                "b[height<=720][ext=mp4]/bv*[height<=720]+ba/b",
                "--merge-output-format",
                "mp4",
                "-o",
            ])
            .arg(template)
            .args(["--print", "after_move:filepath", &url])
            .output()
            .map_err(|_| ytdlp_missing())?;
        if !out.status.success() {
            let err = String::from_utf8_lossy(&out.stderr).trim().to_string();
            return Err(format!("Download non riuscito: {err}"));
        }
        String::from_utf8_lossy(&out.stdout)
            .lines()
            .rev()
            .find(|l| !l.trim().is_empty())
            .map(|l| l.trim().to_string())
            .ok_or_else(|| "Download terminato ma il file non è stato trovato".to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

// ---------------------------------------------------------------------------
// Schermo testi (secondo monitor / TV)
// ---------------------------------------------------------------------------

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct MonitorInfo {
    index: usize,
    name: String,
    width: u32,
    height: u32,
    x: i32,
    y: i32,
}

#[tauri::command]
fn list_monitors(app: tauri::AppHandle) -> Result<Vec<MonitorInfo>, String> {
    let monitors = app.available_monitors().map_err(|e| e.to_string())?;
    Ok(monitors
        .iter()
        .enumerate()
        .map(|(index, m)| MonitorInfo {
            index,
            name: m
                .name()
                .cloned()
                .unwrap_or_else(|| format!("Schermo {}", index + 1)),
            width: m.size().width,
            height: m.size().height,
            x: m.position().x,
            y: m.position().y,
        })
        .collect())
}

#[tauri::command]
async fn open_display(app: tauri::AppHandle, monitor: Option<usize>) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("display") {
        let _ = w.set_focus();
        return Ok(());
    }
    let win = WebviewWindowBuilder::new(&app, "display", WebviewUrl::App("index.html".into()))
        .title("CosmoKaraoke - Schermo testi")
        .inner_size(960.0, 540.0)
        .build()
        .map_err(|e| e.to_string())?;

    if let Some(i) = monitor {
        if let Ok(monitors) = app.available_monitors() {
            if let Some(m) = monitors.get(i) {
                let _ = win.set_position(tauri::Position::Physical(*m.position()));
                let _ = win.set_fullscreen(true);
            }
        }
    }
    Ok(())
}

#[tauri::command]
async fn close_display(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("display") {
        w.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

// ---------------------------------------------------------------------------

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            scan_library,
            load_blob,
            save_blob,
            ytdlp_check,
            ytdlp_search,
            ytdlp_download,
            list_monitors,
            open_display,
            close_display,
        ])
        .run(tauri::generate_context!())
        .expect("errore durante l'avvio di CosmoKaraoke");
}
