use serde::Serialize;
mod db;

use db::{
    extract_zip_song, load_songs_from_db, open_db, save_songs_to_db, scan_directories,
    search_songs_fts, ExtractedZipSong, Song,
};
use std::path::PathBuf;
use std::process::Command;
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

// ---------------------------------------------------------------------------
// Libreria SQLite + FTS5
// ---------------------------------------------------------------------------

#[tauri::command]
async fn scan_library(app: tauri::AppHandle, paths: Vec<String>) -> Result<Vec<Song>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let songs = scan_directories(&paths);
        if let Ok(mut conn) = open_db(&app) {
            let _ = save_songs_to_db(&mut conn, &songs);
        }
        Ok(songs)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn search_library(
    app: tauri::AppHandle,
    query: String,
    format: Option<String>,
    limit: Option<usize>,
) -> Result<Vec<Song>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let conn = open_db(&app)?;
        search_songs_fts(&conn, &query, format.as_deref(), limit.unwrap_or(200))
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn load_library(app: tauri::AppHandle) -> Result<Vec<Song>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let conn = open_db(&app)?;
        load_songs_from_db(&conn)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn prepare_zip_song(
    app: tauri::AppHandle,
    zip_path: String,
    audio_entry: String,
    cdg_entry: Option<String>,
) -> Result<ExtractedZipSong, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let cache_dir = app.path().app_cache_dir().map_err(|e| e.to_string())?;
        extract_zip_song(&cache_dir, &zip_path, &audio_entry, cdg_entry.as_deref())
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
    "yt-dlp non trovato. Premi il pulsante «Scarica yt-dlp» qui sotto: lo installa da solo."
        .to_string()
}

/// Scarica yt-dlp (ultima versione ufficiale) nella cartella dati dell'app.
#[tauri::command]
async fn ytdlp_install(app: tauri::AppHandle) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let (asset, exe_name) = if cfg!(windows) {
            ("yt-dlp.exe", "yt-dlp.exe")
        } else if cfg!(target_os = "macos") {
            ("yt-dlp_macos", "yt-dlp")
        } else {
            ("yt-dlp", "yt-dlp")
        };
        let url = format!("https://github.com/yt-dlp/yt-dlp/releases/latest/download/{asset}");
        let dir = app
            .path()
            .app_data_dir()
            .map_err(|e| e.to_string())?
            .join("bin");
        std::fs::create_dir_all(&dir).map_err(|e| format!("Non riesco a creare la cartella: {e}"))?;
        let tmp = dir.join(format!("{exe_name}.download"));
        let dest = dir.join(exe_name);

        let resp = ureq::get(&url)
            .call()
            .map_err(|e| format!("Download non riuscito (controlla la connessione): {e}"))?;
        let mut reader = resp.into_body().into_reader();
        let mut file = std::fs::File::create(&tmp).map_err(|e| e.to_string())?;
        std::io::copy(&mut reader, &mut file).map_err(|e| format!("Download interrotto: {e}"))?;
        drop(file);

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&tmp, std::fs::Permissions::from_mode(0o755))
                .map_err(|e| e.to_string())?;
        }
        if dest.exists() {
            let _ = std::fs::remove_file(&dest);
        }
        std::fs::rename(&tmp, &dest).map_err(|e| e.to_string())?;

        let out = ytdlp_command(&app)
            .arg("--version")
            .output()
            .map_err(|_| "yt-dlp scaricato ma non parte su questo computer.".to_string())?;
        if out.status.success() {
            Ok(String::from_utf8_lossy(&out.stdout).trim().to_string())
        } else {
            Err("yt-dlp scaricato ma non parte su questo computer.".to_string())
        }
    })
    .await
    .map_err(|e| e.to_string())?
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
            search_library,
            load_library,
            prepare_zip_song,
            load_blob,
            save_blob,
            ytdlp_check,
            ytdlp_install,
            ytdlp_search,
            ytdlp_download,
            list_monitors,
            open_display,
            close_display,
        ])
        .run(tauri::generate_context!())
        .expect("errore durante l'avvio di CosmoKaraoke");
}
