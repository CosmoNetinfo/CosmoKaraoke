use serde::{Deserialize, Serialize};
mod db;
mod server;

use db::{
    extract_zip_song, load_songs_from_db, open_db, save_songs_to_db, scan_directories,
    search_songs_fts, ExtractedZipSong, Song,
};
use server::{
    get_lan_ip, BookingRequest, LiveMessage, LiveServerConfig, LiveServerController,
    NowPlayingInfo, SingerScore,
};
use std::path::PathBuf;
use std::process::Command;
use std::sync::Arc;
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

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct YtItem {
    pub id: String,
    pub title: String,
    pub channel: String,
    pub duration: Option<f64>,
}

pub fn search_youtube_raw(app: &tauri::AppHandle, query: &str) -> Result<Vec<YtItem>, String> {
    let q = format!("ytsearch10:{} karaoke", query.trim());
    let out = ytdlp_command(app)
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
}

#[tauri::command]
async fn ytdlp_search(app: tauri::AppHandle, query: String) -> Result<Vec<YtItem>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        search_youtube_raw(&app, &query)
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
// Server LAN per prenotazioni da telefono (Fase 6)
// ---------------------------------------------------------------------------

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LiveServerInfo {
    pub running: bool,
    pub ip: String,
    pub port: u16,
    pub url: String,
    pub config: LiveServerConfig,
    pub pending_count: usize,
    pub message_count: usize,
}

#[tauri::command]
async fn start_live_server(
    server: tauri::State<'_, Arc<tokio::sync::Mutex<LiveServerController>>>,
    port: Option<u16>,
) -> Result<LiveServerInfo, String> {
    let mut c = server.lock().await;
    let target_port = port.unwrap_or(c.port);
    let url = c.start(target_port).await?;
    let ip = get_lan_ip();
    let s = c.state.lock().await;
    Ok(LiveServerInfo {
        running: true,
        ip,
        port: target_port,
        url,
        config: s.config.clone(),
        pending_count: s.pending_bookings.len(),
        message_count: s.messages.len(),
    })
}

#[tauri::command]
async fn stop_live_server(
    server: tauri::State<'_, Arc<tokio::sync::Mutex<LiveServerController>>>,
) -> Result<(), String> {
    let mut c = server.lock().await;
    c.stop().await;
    Ok(())
}

#[tauri::command]
async fn get_live_server_info(
    server: tauri::State<'_, Arc<tokio::sync::Mutex<LiveServerController>>>,
) -> Result<LiveServerInfo, String> {
    let c = server.lock().await;
    let s = c.state.lock().await;
    let ip = get_lan_ip();
    let port = c.port;
    let url = format!("http://{ip}:{port}");
    Ok(LiveServerInfo {
        running: c.running,
        ip,
        port,
        url,
        config: s.config.clone(),
        pending_count: s.pending_bookings.len(),
        message_count: s.messages.len(),
    })
}

#[tauri::command]
async fn update_live_config(
    server: tauri::State<'_, Arc<tokio::sync::Mutex<LiveServerController>>>,
    config: LiveServerConfig,
) -> Result<(), String> {
    let c = server.lock().await;
    let mut s = c.state.lock().await;
    s.config = config.clone();
    let _ = s.tx_ws.send(serde_json::to_string(&serde_json::json!({
        "type": "status",
        "payload": {
            "roomName": config.room_name,
            "allowBookings": config.allow_bookings,
        }
    })).unwrap_or_default());
    Ok(())
}

#[tauri::command]
async fn get_live_pending_bookings(
    server: tauri::State<'_, Arc<tokio::sync::Mutex<LiveServerController>>>,
) -> Result<Vec<BookingRequest>, String> {
    let c = server.lock().await;
    let s = c.state.lock().await;
    Ok(s.pending_bookings.clone())
}

#[tauri::command]
async fn approve_booking(
    server: tauri::State<'_, Arc<tokio::sync::Mutex<LiveServerController>>>,
    id: String,
) -> Result<Option<BookingRequest>, String> {
    let c = server.lock().await;
    let mut s = c.state.lock().await;
    if let Some(pos) = s.pending_bookings.iter().position(|b| b.id == id) {
        let req = s.pending_bookings.remove(pos);
        let _ = s.tx_ws.send(serde_json::to_string(&serde_json::json!({
            "type": "booking_approved",
            "payload": { "id": id, "singer": req.singer, "title": req.title }
        })).unwrap_or_default());
        Ok(Some(req))
    } else {
        Ok(None)
    }
}

#[tauri::command]
async fn reject_booking(
    server: tauri::State<'_, Arc<tokio::sync::Mutex<LiveServerController>>>,
    id: String,
) -> Result<(), String> {
    let c = server.lock().await;
    let mut s = c.state.lock().await;
    s.pending_bookings.retain(|b| b.id != id);
    let _ = s.tx_ws.send(serde_json::to_string(&serde_json::json!({
        "type": "booking_rejected",
        "payload": { "id": id }
    })).unwrap_or_default());
    Ok(())
}

#[tauri::command]
async fn get_live_messages(
    server: tauri::State<'_, Arc<tokio::sync::Mutex<LiveServerController>>>,
) -> Result<Vec<LiveMessage>, String> {
    let c = server.lock().await;
    let s = c.state.lock().await;
    Ok(s.messages.clone())
}

#[tauri::command]
async fn delete_live_message(
    server: tauri::State<'_, Arc<tokio::sync::Mutex<LiveServerController>>>,
    id: String,
) -> Result<(), String> {
    let c = server.lock().await;
    let mut s = c.state.lock().await;
    s.messages.retain(|m| m.id != id);
    Ok(())
}

#[tauri::command]
async fn get_live_scores(
    server: tauri::State<'_, Arc<tokio::sync::Mutex<LiveServerController>>>,
) -> Result<Vec<SingerScore>, String> {
    let c = server.lock().await;
    let s = c.state.lock().await;
    let mut by_singer: std::collections::HashMap<String, Vec<u8>> = std::collections::HashMap::new();
    for v in &s.votes {
        by_singer.entry(v.singer.clone()).or_default().push(v.rating);
    }
    let mut scores: Vec<SingerScore> = by_singer
        .into_iter()
        .map(|(singer, ratings)| {
            let count = ratings.len();
            let sum: u32 = ratings.iter().map(|&r| r as u32).sum();
            let average = if count > 0 { sum as f32 / count as f32 } else { 0.0 };
            SingerScore { singer, count, average }
        })
        .collect();
    scores.sort_by(|a, b| b.average.partial_cmp(&a.average).unwrap_or(std::cmp::Ordering::Equal).then(b.count.cmp(&a.count)));
    Ok(scores)
}

#[tauri::command]
async fn sync_live_now_playing(
    server: tauri::State<'_, Arc<tokio::sync::Mutex<LiveServerController>>>,
    title: String,
    artist: String,
    singer: String,
) -> Result<(), String> {
    let c = server.lock().await;
    let mut s = c.state.lock().await;
    let np = NowPlayingInfo {
        title,
        artist,
        singer,
    };
    s.now_playing = Some(np.clone());
    let _ = s.tx_ws.send(serde_json::to_string(&serde_json::json!({
        "type": "now_playing",
        "payload": np
    })).unwrap_or_default());
    Ok(())
}

// ---------------------------------------------------------------------------

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let handle = app.handle().clone();
            let controller = Arc::new(tokio::sync::Mutex::new(LiveServerController::new(handle)));
            app.manage(controller);
            Ok(())
        })
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
            start_live_server,
            stop_live_server,
            get_live_server_info,
            update_live_config,
            get_live_pending_bookings,
            approve_booking,
            reject_booking,
            get_live_messages,
            delete_live_message,
            get_live_scores,
            sync_live_now_playing,
        ])
        .run(tauri::generate_context!())
        .expect("errore durante l'avvio di CosmoKaraoke");
}
