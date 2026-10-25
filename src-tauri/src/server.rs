use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Query, State,
    },
    http::StatusCode,
    response::{Html, IntoResponse, Json},
    routing::{get, post},
    Router,
};
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::{broadcast, oneshot, Mutex};

use crate::db::{open_db, search_songs_fts, Song};
use crate::{search_youtube_raw, YtItem};

pub fn get_lan_ip() -> String {
    if let Ok(socket) = std::net::UdpSocket::bind("0.0.0.0:0") {
        if socket.connect("8.8.8.8:80").is_ok() {
            if let Ok(addr) = socket.local_addr() {
                let ip = addr.ip().to_string();
                if ip != "0.0.0.0" {
                    return ip;
                }
            }
        }
    }
    "127.0.0.1".to_string()
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct LiveServerConfig {
    pub port: u16,
    pub pin: Option<String>,
    pub room_name: String,
    pub allow_bookings: bool,
    pub auto_approve: bool,
    pub max_per_singer: usize,
    pub blocked_words: Vec<String>,
}

impl Default for LiveServerConfig {
    fn default() -> Self {
        Self {
            port: 5555,
            pin: None,
            room_name: "CosmoKaraoke Live".to_string(),
            allow_bookings: true,
            auto_approve: false,
            max_per_singer: 3,
            blocked_words: vec![],
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct BookingRequest {
    pub id: String,
    pub singer: String,
    pub song_id: String,
    pub title: String,
    pub artist: String,
    pub format: String,
    pub note: Option<String>,
    pub created_at: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct LiveMessage {
    pub id: String,
    pub singer: String,
    pub text: String,
    pub created_at: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct LiveVote {
    pub id: String,
    pub singer: String,
    pub song: String,
    pub rating: u8,
    pub voter_id: String,
    pub created_at: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NowPlayingInfo {
    pub title: String,
    pub artist: String,
    pub singer: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SingerScore {
    pub singer: String,
    pub count: usize,
    pub average: f32,
}

pub struct LiveState {
    pub app_handle: tauri::AppHandle,
    pub config: LiveServerConfig,
    pub pending_bookings: Vec<BookingRequest>,
    pub messages: Vec<LiveMessage>,
    pub votes: Vec<LiveVote>,
    pub now_playing: Option<NowPlayingInfo>,
    pub tx_ws: broadcast::Sender<String>,
}

pub type SharedLiveState = Arc<Mutex<LiveState>>;

pub struct LiveServerController {
    shutdown_tx: Option<oneshot::Sender<()>>,
    pub state: SharedLiveState,
    pub port: u16,
    pub running: bool,
}

// Mobile Web Client HTML/JS/CSS embedded directly
const MOBILE_HTML: &str = r#"<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>CosmoKaraoke Live</title>
  <style>
    :root {
      --bg: #0f172a;
      --panel: #1e293b;
      --card: #334155;
      --text: #f8fafc;
      --muted: #94a3b8;
      --accent: #38bdf8;
      --accent-hover: #0284c7;
      --on-accent: #0f172a;
      --success: #22c55e;
      --danger: #ef4444;
      --border: #475569;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { background: var(--bg); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; }
    header { background: var(--panel); padding: 1rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
    h1 { font-size: 1.25rem; font-weight: 700; color: var(--accent); }
    .status-badge { font-size: 0.8rem; padding: 0.25rem 0.6rem; border-radius: 9999px; background: #064e3b; color: #6ee7b7; font-weight: 600; }
    .status-badge.offline { background: #7f1d1d; color: #fca5a5; }

    nav { display: flex; background: var(--panel); border-bottom: 1px solid var(--border); }
    nav button { flex: 1; padding: 0.85rem 0.5rem; background: transparent; border: none; color: var(--muted); font-size: 1rem; font-weight: 600; cursor: pointer; border-bottom: 3px solid transparent; }
    nav button.active { color: var(--accent); border-bottom-color: var(--accent); background: rgba(56, 189, 248, 0.05); }

    main { flex: 1; padding: 1rem; max-width: 600px; margin: 0 auto; width: 100%; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }

    .card { background: var(--panel); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1.1rem; margin-bottom: 1rem; }
    .card-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between; }
    
    label { display: block; font-size: 0.95rem; font-weight: 600; color: var(--muted); margin-bottom: 0.4rem; }
    input, textarea, select {
      width: 100%; padding: 0.85rem 1rem; font-size: 1.05rem; background: var(--bg); color: var(--text);
      border: 1px solid var(--border); border-radius: 0.5rem; margin-bottom: 0.9rem; outline: none;
    }
    input:focus, textarea:focus { border-color: var(--accent); }

    .btn {
      display: inline-flex; justify-content: center; align-items: center; width: 100%;
      min-height: 3rem; padding: 0.75rem 1.25rem; font-size: 1.1rem; font-weight: 700;
      background: var(--accent); color: var(--on-accent); border: none; border-radius: 0.6rem;
      cursor: pointer; text-decoration: none; transition: opacity 0.15s;
    }
    .btn:active { opacity: 0.85; }
    .btn-secondary { background: var(--card); color: var(--text); }
    .btn-small { min-height: 2.2rem; font-size: 0.95rem; padding: 0.4rem 0.8rem; width: auto; }

    .song-item {
      background: var(--card); border-radius: 0.5rem; padding: 0.85rem 1rem; margin-bottom: 0.6rem;
      display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;
    }
    .song-info { flex: 1; min-width: 0; }
    .song-title { font-weight: 700; font-size: 1.05rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .song-artist { font-size: 0.9rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .song-format { font-size: 0.75rem; color: var(--accent); font-weight: 600; text-transform: uppercase; margin-top: 0.15rem; }

    .stars { display: flex; gap: 0.5rem; justify-content: center; margin: 1.2rem 0; }
    .star-btn { font-size: 2.5rem; background: none; border: none; cursor: pointer; color: #475569; transition: transform 0.1s, color 0.15s; }
    .star-btn.active { color: #f59e0b; }
    .star-btn:active { transform: scale(1.2); }

    .msg-bubble { background: var(--card); border-radius: 0.6rem; padding: 0.75rem 1rem; margin-bottom: 0.5rem; }
    .msg-meta { font-size: 0.8rem; color: var(--muted); margin-bottom: 0.25rem; display: flex; justify-content: space-between; }
    .msg-text { font-size: 1rem; color: var(--text); }

    .notice { padding: 0.85rem; border-radius: 0.5rem; margin-bottom: 1rem; font-size: 0.95rem; font-weight: 500; }
    .notice.info { background: rgba(56, 189, 248, 0.15); border: 1px solid var(--accent); color: var(--accent); }
    .notice.success { background: rgba(34, 197, 94, 0.15); border: 1px solid var(--success); color: var(--success); }
    .notice.error { background: rgba(239, 68, 68, 0.15); border: 1px solid var(--danger); color: var(--danger); }
  </style>
</head>
<body>
  <header>
    <div>
      <h1 id="room-name">CosmoKaraoke Live</h1>
      <span id="user-display" style="font-size: 0.85rem; color: var(--muted);">Non registrato</span>
    </div>
    <span id="conn-badge" class="status-badge">Connesso</span>
  </header>

  <nav>
    <button class="active" onclick="switchTab('prenota')">🎵 Brani</button>
    <button onclick="switchTab('vota')">⭐ Vota</button>
    <button onclick="switchTab('messaggi')">💬 Dediche</button>
    <button onclick="switchTab('profilo')">👤 Profilo</button>
  </nav>

  <main>
    <!-- TAB 1: PRENOTA BRANO -->
    <div id="tab-prenota" class="tab-content active">
      <div id="booking-alert" style="display:none;" class="notice error">
        Le prenotazioni sono temporaneamente chiuse dalla regia.
      </div>

      <div class="card">
        <div style="display:flex; gap:0.5rem; margin-bottom: 0.8rem;">
          <button id="src-local" class="btn btn-small" style="flex:1;" onclick="setSearchSource('local')">📁 Catalogo locale</button>
          <button id="src-yt" class="btn btn-small btn-secondary" style="flex:1;" onclick="setSearchSource('youtube')">▶️ Cerca su YouTube</button>
        </div>
        <label for="search-input" id="search-label">Cerca nel catalogo del locale:</label>
        <input type="search" id="search-input" placeholder="Titolo o artista..." oninput="onSearch(this.value)">
        <div id="search-status" style="font-size: 0.9rem; color: var(--muted); margin-bottom: 0.5rem;"></div>
        <div id="songs-list"></div>
      </div>
    </div>

    <!-- TAB 2: VOTA E ORA IN ONDA -->
    <div id="tab-vota" class="tab-content">
      <div class="card" style="text-align: center;">
        <div style="font-size: 0.85rem; color: var(--accent); font-weight: 700; text-transform: uppercase;">Ora in onda</div>
        <div id="now-title" style="font-size: 1.4rem; font-weight: 800; margin-top: 0.4rem;">Nessun brano attivo</div>
        <div id="now-artist" style="font-size: 1.05rem; color: var(--muted); margin-top: 0.2rem;"></div>
        <div id="now-singer" style="font-size: 1.15rem; color: var(--text); font-weight: 700; margin-top: 0.5rem;"></div>

        <div style="margin-top: 1.5rem; border-top: 1px solid var(--border); padding-top: 1rem;">
          <div style="font-weight: 700; font-size: 1.1rem;">Vota questa esibizione:</div>
          <div class="stars">
            <button class="star-btn" onclick="rate(1)">★</button>
            <button class="star-btn" onclick="rate(2)">★</button>
            <button class="star-btn" onclick="rate(3)">★</button>
            <button class="star-btn" onclick="rate(4)">★</button>
            <button class="star-btn" onclick="rate(5)">★</button>
          </div>
          <div id="vote-feedback" style="min-height: 1.5rem; font-weight: 600; color: var(--success);"></div>
        </div>
      </div>
    </div>

    <!-- TAB 3: DEDICHE E MESSAGGI -->
    <div id="tab-messaggi" class="tab-content">
      <div class="card">
        <div class="card-title">Invia una dedica o messaggio alla TV</div>
        <label for="msg-input">Il tuo messaggio:</label>
        <textarea id="msg-input" rows="3" placeholder="Scrivi una dedica o un incoraggiamento..."></textarea>
        <button class="btn" onclick="sendMessage()">Invia sul maxi-schermo</button>
        <div id="msg-feedback" style="margin-top: 0.5rem; font-weight: 600;"></div>
      </div>

      <div class="card">
        <div class="card-title">Messaggi recenti</div>
        <div id="messages-list">
          <div style="color: var(--muted); font-size: 0.95rem;">Nessun messaggio ancora.</div>
        </div>
      </div>
    </div>

    <!-- TAB 4: PROFILO / PIN -->
    <div id="tab-profilo" class="tab-content">
      <div class="card">
        <div class="card-title">Il tuo profilo cantante</div>
        <label for="singer-name">Il tuo nome:</label>
        <input type="text" id="singer-name" placeholder="Es. Mario Rossi" onchange="saveProfile()">
        
        <div id="pin-container" style="display: none;">
          <label for="room-pin">PIN di sala (richiesto dal locale):</label>
          <input type="password" id="room-pin" placeholder="PIN a 4 cifre" onchange="saveProfile()">
        </div>

        <button class="btn" onclick="saveProfile(true)">Salva impostazioni</button>
        <div id="profile-feedback" style="margin-top: 0.5rem; font-weight: 600;"></div>
      </div>
    </div>
  </main>

  <script>
    let myName = localStorage.getItem('cosmo_singer_name') || ''
    let myPin = localStorage.getItem('cosmo_room_pin') || ''
    let voterId = localStorage.getItem('cosmo_voter_id') || ('v_' + Math.random().toString(36).substr(2, 9))
    localStorage.setItem('cosmo_voter_id', voterId)

    let serverInfo = { roomName: 'CosmoKaraoke Live', allowBookings: true, requiresPin: false }
    let searchTimer = null

    function init() {
      document.getElementById('singer-name').value = myName
      document.getElementById('room-pin').value = myPin
      updateUserDisplay()
      fetchStatus()
      connectWs()
    }

    function updateUserDisplay() {
      const el = document.getElementById('user-display')
      el.textContent = myName ? ('Cantante: ' + myName) : 'Nome non impostato (vai in Profilo)'
    }

    function switchTab(name) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'))
      document.querySelectorAll('nav button').forEach(el => el.classList.remove('active'))
      document.getElementById('tab-' + name).classList.add('active')
      const idx = ['prenota', 'vota', 'messaggi', 'profilo'].indexOf(name)
      if (idx >= 0) document.querySelectorAll('nav button')[idx].classList.add('active')
    }

    async function fetchStatus() {
      try {
        const res = await fetch('/api/status')
        const data = await res.json()
        serverInfo = data
        document.getElementById('room-name').textContent = data.roomName || 'CosmoKaraoke Live'
        document.getElementById('booking-alert').style.display = data.allowBookings ? 'none' : 'block'
        document.getElementById('pin-container').style.display = data.requiresPin ? 'block' : 'none'
        if (data.nowPlaying) {
          updateNowPlaying(data.nowPlaying)
        }
      } catch (e) {
        console.error(e)
      }
    }

    function updateNowPlaying(np) {
      document.getElementById('now-title').textContent = np.title || 'In pausa'
      document.getElementById('now-artist').textContent = np.artist || ''
      document.getElementById('now-singer').textContent = np.singer ? ('Canta: ' + np.singer) : ''
    }

    let ws = null
    function connectWs() {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
      ws = new WebSocket(`${proto}//${location.host}/ws`)
      ws.onopen = () => {
        const badge = document.getElementById('conn-badge')
        badge.textContent = 'Connesso'
        badge.className = 'status-badge'
      }
      ws.onclose = () => {
        const badge = document.getElementById('conn-badge')
        badge.textContent = 'Disconnesso'
        badge.className = 'status-badge offline'
        setTimeout(connectWs, 3000)
      }
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'now_playing') {
            updateNowPlaying(msg.payload)
          } else if (msg.type === 'new_message') {
            renderMessage(msg.payload, true)
          } else if (msg.type === 'status') {
            fetchStatus()
          }
        } catch (e) {}
      }
    }

    let searchSource = 'local'
    function setSearchSource(src) {
      searchSource = src
      document.getElementById('src-local').className = src === 'local' ? 'btn btn-small' : 'btn btn-small btn-secondary'
      document.getElementById('src-yt').className = src === 'youtube' ? 'btn btn-small' : 'btn btn-small btn-secondary'
      document.getElementById('search-label').textContent = src === 'local' ? 'Cerca nel catalogo del locale:' : 'Cerca basi karaoke su YouTube:'
      document.getElementById('search-input').placeholder = src === 'local' ? 'Titolo o artista locale...' : 'Cerca canzone su YouTube...'
      onSearch(document.getElementById('search-input').value)
    }

    function onSearch(val) {
      clearTimeout(searchTimer)
      const q = val.trim()
      if (q.length < 2) {
        document.getElementById('songs-list').innerHTML = ''
        document.getElementById('search-status').textContent = 'Digita almeno 2 caratteri...'
        return
      }
      document.getElementById('search-status').textContent = 'Ricerca in corso...'
      searchTimer = setTimeout(async () => {
        try {
          const url = searchSource === 'youtube' ? `/api/youtube?q=${encodeURIComponent(q)}` : `/api/songs?q=${encodeURIComponent(q)}`
          const res = await fetch(url)
          const list = await res.json()
          renderSongs(list, searchSource === 'youtube')
        } catch (e) {
          document.getElementById('search-status').textContent = 'Errore di connessione'
        }
      }, searchSource === 'youtube' ? 600 : 300)
    }

    function renderSongs(songs, isYt = false) {
      const el = document.getElementById('songs-list')
      if (!songs || songs.length === 0) {
        document.getElementById('search-status').textContent = 'Nessun brano trovato'
        el.innerHTML = ''
        return
      }
      document.getElementById('search-status').textContent = `Trovati ${songs.length} brani:`
      el.innerHTML = songs.map(s => {
        const id = s.id
        const title = s.title
        const artist = isYt ? (s.channel || 'YouTube') : (s.artist || 'Artista sconosciuto')
        const fmt = isYt ? 'YouTube' : s.format
        return `
          <div class="song-item">
            <div class="song-info">
              <div class="song-title">${escapeHtml(title)}</div>
              <div class="song-artist">${escapeHtml(artist)}</div>
              <div class="song-format" style="${isYt ? 'color:#ef4444;' : ''}">${fmt}</div>
            </div>
            <button class="btn btn-small" onclick="bookSong('${id}', '${escapeAttr(title)}', '${escapeAttr(artist)}', '${isYt ? 'youtube' : 'local'}')">Prenota</button>
          </div>
        `
      }).join('')
    }

    async function bookSong(id, title, artist, format = 'local') {
      if (!myName) {
        alert('Inserisci prima il tuo nome nel pannello Profilo!')
        switchTab('profilo')
        return
      }
      const note = prompt(`Vuoi aggiungere una nota o dedica per "${title}"? (Facoltativo):`, '')
      if (note === null) return // annullato
      
      try {
        const res = await fetch('/api/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            singer: myName,
            pin: myPin,
            songId: id,
            title,
            artist,
            format,
            note: note.trim() || undefined
          })
        })
        const data = await res.json()
        if (res.ok) {
          alert('✅ Prenotazione inviata con successo! È in lista di attesa per la regia.')
        } else {
          alert('❌ Impossibile prenotare: ' + (data.error || 'Errore del server'))
        }
      } catch (e) {
        alert('Errore di connessione durante la prenotazione')
      }
    }

    async function rate(stars) {
      document.querySelectorAll('.star-btn').forEach((btn, idx) => {
        btn.classList.toggle('active', idx < stars)
      })
      const fb = document.getElementById('vote-feedback')
      fb.textContent = 'Invio voto...'
      try {
        const res = await fetch('/api/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rating: stars,
            voterId
          })
        })
        if (res.ok) {
          fb.textContent = `Hai votato ${stars} stelle! Grazie!`
        } else {
          fb.textContent = 'Voto registrato.'
        }
      } catch (e) {
        fb.textContent = 'Errore invio voto'
      }
    }

    async function sendMessage() {
      if (!myName) {
        alert('Inserisci prima il tuo nome nel pannello Profilo!')
        switchTab('profilo')
        return
      }
      const text = document.getElementById('msg-input').value.trim()
      if (!text) return
      const fb = document.getElementById('msg-feedback')
      fb.textContent = 'Invio dedica in corso...'
      fb.style.color = 'var(--muted)'
      try {
        const res = await fetch('/api/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            singer: myName,
            pin: myPin,
            text
          })
        })
        const data = await res.json()
        if (res.ok) {
          fb.textContent = '✅ Messaggio inviato alla regia!'
          fb.style.color = 'var(--success)'
          document.getElementById('msg-input').value = ''
          renderMessage({ singer: myName, text, createdAt: Date.now() }, true)
        } else {
          fb.textContent = '❌ ' + (data.error || 'Impossibile inviare')
          fb.style.color = 'var(--danger)'
        }
      } catch (e) {
        fb.textContent = 'Errore di connessione'
        fb.style.color = 'var(--danger)'
      }
    }

    function renderMessage(msg, prepend = false) {
      const container = document.getElementById('messages-list')
      const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const html = `
        <div class="msg-bubble">
          <div class="msg-meta">
            <strong>${escapeHtml(msg.singer)}</strong>
            <span>${time}</span>
          </div>
          <div class="msg-text">${escapeHtml(msg.text)}</div>
        </div>
      `
      if (prepend) {
        container.innerHTML = html + container.innerHTML
      } else {
        container.innerHTML += html
      }
    }

    function saveProfile(notify = false) {
      myName = document.getElementById('singer-name').value.trim()
      myPin = document.getElementById('room-pin').value.trim()
      localStorage.setItem('cosmo_singer_name', myName)
      localStorage.setItem('cosmo_room_pin', myPin)
      updateUserDisplay()
      if (notify) {
        const fb = document.getElementById('profile-feedback')
        fb.textContent = 'Profilo salvato correttamente!'
        fb.style.color = 'var(--success)'
        setTimeout(() => fb.textContent = '', 3000)
      }
    }

    function escapeHtml(str) {
      return (str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m])
    }
    function escapeAttr(str) {
      return (str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m])
    }

    window.onload = init
  </script>
</body>
</html>"#;

// ---------------------------------------------------------------------------
// HTTP Handlers
// ---------------------------------------------------------------------------

async fn handle_root() -> Html<&'static str> {
    Html(MOBILE_HTML)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct StatusResponse {
    room_name: String,
    allow_bookings: bool,
    requires_pin: bool,
    now_playing: Option<NowPlayingInfo>,
}

async fn handle_status(State(state): State<SharedLiveState>) -> Json<StatusResponse> {
    let s = state.lock().await;
    Json(StatusResponse {
        room_name: s.config.room_name.clone(),
        allow_bookings: s.config.allow_bookings,
        requires_pin: s.config.pin.is_some(),
        now_playing: s.now_playing.clone(),
    })
}

#[derive(Deserialize)]
struct SearchQuery {
    q: String,
}

async fn handle_songs_search(
    State(state): State<SharedLiveState>,
    Query(q): Query<SearchQuery>,
) -> Result<Json<Vec<Song>>, (StatusCode, Json<serde_json::Value>)> {
    let app = {
        let s = state.lock().await;
        s.app_handle.clone()
    };

    let conn = open_db(&app).map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e })),
        )
    })?;

    let songs = search_songs_fts(&conn, &q.q, None, 50).unwrap_or_default();
    Ok(Json(songs))
}

#[derive(Deserialize)]
struct YtQuery {
    q: String,
}

async fn handle_youtube_search(
    State(state): State<SharedLiveState>,
    Query(q): Query<YtQuery>,
) -> Result<Json<Vec<YtItem>>, (StatusCode, Json<serde_json::Value>)> {
    let app = {
        let s = state.lock().await;
        s.app_handle.clone()
    };

    let items = search_youtube_raw(&app, &q.q).map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e })),
        )
    })?;

    Ok(Json(items))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct BookPayload {
    singer: String,
    pin: Option<String>,
    song_id: String,
    title: String,
    artist: String,
    format: Option<String>,
    note: Option<String>,
}

async fn handle_book(
    State(state): State<SharedLiveState>,
    Json(payload): Json<BookPayload>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let mut s = state.lock().await;

    if !s.config.allow_bookings {
        return Err((
            StatusCode::FORBIDDEN,
            Json(serde_json::json!({ "error": "Le prenotazioni sono temporaneamente bloccate" })),
        ));
    }

    if let Some(ref pin) = s.config.pin {
        if payload.pin.as_deref().unwrap_or("") != pin {
            return Err((
                StatusCode::UNAUTHORIZED,
                Json(serde_json::json!({ "error": "PIN di sala non valido" })),
            ));
        }
    }

    let singer = payload.singer.trim().to_string();
    if singer.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Nome cantante obbligatorio" })),
        ));
    }

    // Limite prenotazioni per persona
    let current_bookings_count = s
        .pending_bookings
        .iter()
        .filter(|b| b.singer.eq_ignore_ascii_case(&singer))
        .count();
    if current_bookings_count >= s.config.max_per_singer {
        return Err((
            StatusCode::TOO_MANY_REQUESTS,
            Json(serde_json::json!({
                "error": format!("Hai raggiunto il limite di {} prenotazioni in attesa", s.config.max_per_singer)
            })),
        ));
    }

    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let id = format!("book_{nanos}");
    let booking = BookingRequest {
        id: id.clone(),
        singer: singer.clone(),
        song_id: payload.song_id,
        title: payload.title,
        artist: payload.artist,
        format: payload.format.unwrap_or_else(|| "song".to_string()),
        note: payload.note,
        created_at: (nanos / 1_000_000) as u64,
    };

    use tauri::Emitter;
    if s.config.auto_approve {
        // Notifica frontend per inserimento diretto
        let _ = s.app_handle.emit("live:auto_booking", &booking);
    } else {
        // Aggiungi a pending e notifica host
        s.pending_bookings.push(booking.clone());
        let _ = s.app_handle.emit("live:new_pending_booking", &booking);
    }

    let _ = s.tx_ws.send(serde_json::to_string(&serde_json::json!({
        "type": "booking_received",
        "payload": { "id": id, "singer": singer }
    })).unwrap_or_default());

    Ok(Json(serde_json::json!({ "success": true, "id": id })))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct MessagePayload {
    singer: String,
    pin: Option<String>,
    text: String,
}

async fn handle_message(
    State(state): State<SharedLiveState>,
    Json(payload): Json<MessagePayload>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let mut s = state.lock().await;

    if let Some(ref pin) = s.config.pin {
        if payload.pin.as_deref().unwrap_or("") != pin {
            return Err((
                StatusCode::UNAUTHORIZED,
                Json(serde_json::json!({ "error": "PIN di sala non valido" })),
            ));
        }
    }

    let text = payload.text.trim().to_string();
    if text.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Il testo del messaggio non può essere vuoto" })),
        ));
    }

    // Filtro parole bloccate
    for blocked in &s.config.blocked_words {
        if !blocked.is_empty() && text.to_lowercase().contains(&blocked.to_lowercase()) {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Il messaggio contiene parole non consentite" })),
            ));
        }
    }

    let id = format!("msg_{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis());
    let msg = LiveMessage {
        id: id.clone(),
        singer: payload.singer.trim().to_string(),
        text,
        created_at: std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis() as u64,
    };

    s.messages.push(msg.clone());

    use tauri::Emitter;
    let _ = s.app_handle.emit("live:new_message", &msg);

    let _ = s.tx_ws.send(serde_json::to_string(&serde_json::json!({
        "type": "new_message",
        "payload": &msg
    })).unwrap_or_default());

    Ok(Json(serde_json::json!({ "success": true, "id": id })))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct VotePayload {
    rating: u8,
    voter_id: String,
}

async fn handle_vote(
    State(state): State<SharedLiveState>,
    Json(payload): Json<VotePayload>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let mut s = state.lock().await;

    let now_playing = match s.now_playing.clone() {
        Some(np) if !np.singer.is_empty() => np,
        _ => {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Nessun cantante attualmente in esibizione" })),
            ));
        }
    };

    let rating = payload.rating.clamp(1, 5);
    let id = format!("vote_{}_{}", now_playing.singer, payload.voter_id);

    // Sostituisci se ha già votato questo cantante
    s.votes.retain(|v| !(v.singer == now_playing.singer && v.voter_id == payload.voter_id));

    let vote = LiveVote {
        id,
        singer: now_playing.singer.clone(),
        song: now_playing.title.clone(),
        rating,
        voter_id: payload.voter_id,
        created_at: std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis() as u64,
    };

    s.votes.push(vote.clone());

    use tauri::Emitter;
    let _ = s.app_handle.emit("live:new_vote", &vote);

    Ok(Json(serde_json::json!({ "success": true })))
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<SharedLiveState>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_ws(socket, state))
}

async fn handle_ws(stream: WebSocket, state: SharedLiveState) {
    let (mut sender, mut receiver) = stream.split();
    let mut rx = {
        let s = state.lock().await;
        s.tx_ws.subscribe()
    };

    // Invia stato iniziale
    {
        let s = state.lock().await;
        let init_data = serde_json::json!({
            "type": "init",
            "payload": {
                "roomName": s.config.room_name,
                "allowBookings": s.config.allow_bookings,
                "nowPlaying": s.now_playing,
            }
        });
        let _ = sender.send(Message::Text(init_data.to_string())).await;
    }

    // Task broadcast -> client
    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if sender.send(Message::Text(msg)).await.is_err() {
                break;
            }
        }
    });

    // Task client -> server (mantiene viva la connessione)
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            if let Message::Close(_) = msg {
                break;
            }
        }
    });

    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    };
}

// ---------------------------------------------------------------------------
// Server Controller & Manager
// ---------------------------------------------------------------------------

impl LiveServerController {
    pub fn new(app_handle: tauri::AppHandle) -> Self {
        let (tx_ws, _) = broadcast::channel(100);
        let state = Arc::new(Mutex::new(LiveState {
            app_handle,
            config: LiveServerConfig::default(),
            pending_bookings: Vec::new(),
            messages: Vec::new(),
            votes: Vec::new(),
            now_playing: None,
            tx_ws,
        }));

        Self {
            shutdown_tx: None,
            state,
            port: 5555,
            running: false,
        }
    }

    pub async fn start(&mut self, port: u16) -> Result<String, String> {
        if self.running {
            self.stop().await;
        }

        self.port = port;
        {
            let mut s = self.state.lock().await;
            s.config.port = port;
        }

        let app_router = Router::new()
            .route("/", get(handle_root))
            .route("/api/status", get(handle_status))
            .route("/api/songs", get(handle_songs_search))
            .route("/api/youtube", get(handle_youtube_search))
            .route("/api/book", post(handle_book))
            .route("/api/message", post(handle_message))
            .route("/api/vote", post(handle_vote))
            .route("/ws", get(ws_handler))
            .with_state(self.state.clone());

        let addr = SocketAddr::from(([0, 0, 0, 0], port));
        let listener = tokio::net::TcpListener::bind(addr)
            .await
            .map_err(|e| format!("Impossibile avviare il server sulla porta {port}: {e}"))?;

        let (tx, rx) = oneshot::channel();
        self.shutdown_tx = Some(tx);
        self.running = true;

        tokio::spawn(async move {
            let server = axum::serve(listener, app_router);
            tokio::select! {
                _ = server => {},
                _ = rx => {},
            }
        });

        let lan_ip = get_lan_ip();
        Ok(format!("http://{lan_ip}:{port}"))
    }

    pub async fn stop(&mut self) {
        if let Some(tx) = self.shutdown_tx.take() {
            let _ = tx.send(());
        }
        self.running = false;
    }
}
