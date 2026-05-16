use std::collections::HashMap;
use std::fs;
use std::net::UdpSocket;
use std::path::PathBuf;
use std::sync::Mutex;
use std::thread;
use chrono::Datelike;
use tiny_http::{Header, Method, Response, Server, StatusCode};

struct ServerState { running: bool, port: u16, _handle: Option<thread::JoinHandle<()>> }
static SERVER: Mutex<Option<ServerState>> = Mutex::new(None);

fn sync_dir() -> PathBuf { dirs_next::home_dir().unwrap_or_else(|| PathBuf::from(".")).join("Documents").join("interview-flashcards").join("sync") }
fn journal_dir() -> PathBuf { sync_dir().join("journal") }
fn device_id_path() -> PathBuf { sync_dir().join("device_id") }
fn seen_ops_path() -> PathBuf { sync_dir().join("seen_ops.json") }

fn ensure_dir(path: &PathBuf) { if let Some(p) = path.parent() { let _ = fs::create_dir_all(p); } }

fn get_device_id() -> String {
  let path = device_id_path();
  if let Ok(c) = fs::read_to_string(&path) { return c.trim().to_string(); }
  let id = uuid::Uuid::new_v4().to_string();
  ensure_dir(&path); let _ = fs::write(&path, &id);
  id
}

fn current_month() -> String { let n = chrono::Local::now(); format!("{}-{:02}", n.year(), n.month()) }

fn journal_path(did: &str) -> PathBuf { journal_dir().join(format!("{}_{}.oplog", did, current_month())) }

pub fn append_op(op_json: &str) -> Result<(), String> {
  let dir = journal_dir(); fs::create_dir_all(&dir).map_err(|e| format!("创建目录失败: {}", e))?;
  let did = get_device_id(); let path = journal_path(&did);
  let mut content = if path.exists() { fs::read_to_string(&path).unwrap_or_default() } else { String::new() };
  content.push_str(op_json); content.push('\n');
  fs::write(&path, &content).map_err(|e| format!("写入失败: {}", e))
}

fn scan_ops(from_ts: u64) -> Vec<String> {
  let dir = journal_dir(); if !dir.exists() { return vec![]; }
  let mut ops = vec![];
  if let Ok(entries) = fs::read_dir(&dir) {
    for e in entries.flatten() {
      let p = e.path();
      if p.extension().and_then(|s| s.to_str()) != Some("oplog") { continue; }
      if let Ok(content) = fs::read_to_string(&p) {
        for line in content.lines() { let line = line.trim(); if line.is_empty() { continue; }
          if let Ok(v) = serde_json::from_str::<serde_json::Value>(line) {
            if let Some(ts) = v.get("ts").and_then(|t| t.as_u64()) { if ts > from_ts { ops.push(line.to_string()); } }
          }
        }
      }
    }
  }
  ops
}

fn update_seen(peer: &str, max_ts: u64) -> Result<(), String> {
  let path = seen_ops_path();
  let mut seen: HashMap<String, u64> = if path.exists() { serde_json::from_str(&fs::read_to_string(&path).unwrap_or_default()).unwrap_or_default() } else { HashMap::new() };
  seen.insert(peer.to_string(), max_ts);
  let json = serde_json::to_string_pretty(&seen).map_err(|e| format!("序列化失败: {}", e))?;
  ensure_dir(&path); fs::write(&path, &json).map_err(|e| format!("写入失败: {}", e))
}

pub fn start_server(port: u16) -> Result<String, String> {
  let mut state = SERVER.lock().map_err(|e| format!("锁失败: {}", e))?;
  if state.as_ref().map_or(false, |s| s.running) { return Err("服务已在运行".to_string()); }
  let device_id = get_device_id();
  let server = Server::http(format!("0.0.0.0:{}", port)).map_err(|e| format!("启动失败: {}", e))?;
  let handle = thread::spawn(move || {
    for mut req in server.incoming_requests() {
      match (req.method(), req.url()) {
        (&Method::Get, "/ping") => {
          let j = serde_json::json!({"deviceId": device_id, "deviceName": hostname(), "version": "0.1.0"});
          respond(req, &j.to_string());
        }
        (&Method::Post, "/sync/exchange") => {
          let mut body = String::new(); let _ = req.as_reader().read_to_string(&mut body);
          let p: serde_json::Value = serde_json::from_str(&body).unwrap_or_default();
          let from_ts = p.get("fromTs").and_then(|t| t.as_u64()).unwrap_or(0);
          let peer = p.get("deviceId").and_then(|t| t.as_str()).unwrap_or("").to_string();

          // Save client's ops to our oplog
          if let Some(client_ops) = p.get("ops").and_then(|v| v.as_array()) {
            for op in client_ops { let _ = append_op(&op.to_string()); }
          }

          let ops: Vec<serde_json::Value> = scan_ops(from_ts).iter().filter_map(|l| serde_json::from_str(l).ok()).collect();
          let max_ts = ops.iter().filter_map(|o| o.get("ts").and_then(|t| t.as_u64())).max().unwrap_or(0);
          if !peer.is_empty() && max_ts > 0 { let _ = update_seen(&peer, max_ts); }
          let j = serde_json::json!({"serverDeviceId": device_id, "serverTime": chrono::Utc::now().timestamp_millis() as u64, "ops": ops, "clientOpsSeen": max_ts});
          respond(req, &j.to_string());
        }
        (&Method::Options, _) => {
          let r = Response::from_string("ok").with_status_code(StatusCode(204))
            .with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap())
            .with_header(Header::from_bytes("Access-Control-Allow-Methods", "GET,POST,OPTIONS").unwrap())
            .with_header(Header::from_bytes("Access-Control-Allow-Headers", "Content-Type").unwrap());
          let _ = req.respond(r);
        }
        _ => { let r = Response::from_string("{}").with_status_code(StatusCode(404)).with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap()); let _ = req.respond(r); }
      }
    }
  });
  *state = Some(ServerState { running: true, port, _handle: Some(handle) });
  Ok(format!("{}:{}", local_ip(), port))
}

pub fn stop_server() -> Result<(), String> { *SERVER.lock().map_err(|e| format!("锁失败: {}", e))? = None; Ok(()) }

pub fn get_status() -> serde_json::Value {
  let st = SERVER.lock().ok();
  let running = st.as_ref().and_then(|s| s.as_ref()).map_or(false, |s| s.running);
  let port = st.as_ref().and_then(|s| s.as_ref()).map_or(9876, |s| s.port);
  serde_json::json!({"running": running, "port": port, "deviceId": get_device_id(), "deviceName": hostname(), "ip": if running { local_ip() } else { String::new() }})
}

pub fn read_all_ops() -> serde_json::Value {
  let dir = journal_dir(); let mut files = HashMap::new();
  if dir.exists() { if let Ok(entries) = fs::read_dir(&dir) { for e in entries.flatten() { let p = e.path(); if let (Some(n), Some(ext)) = (p.file_name(), p.extension()) { if ext == "oplog" { if let Ok(c) = fs::read_to_string(&p) { files.insert(n.to_string_lossy().to_string(), c); } } } } } }
  serde_json::json!(files)
}

pub fn read_seen_ops() -> serde_json::Value {
  let path = seen_ops_path();
  if path.exists() { if let Ok(c) = fs::read_to_string(&path) { if let Ok(s) = serde_json::from_str::<HashMap<String, u64>>(&c) { return serde_json::json!(s); } } }
  serde_json::json!({})
}

fn respond(req: tiny_http::Request, body: &str) {
  let r = Response::from_string(body).with_header(Header::from_bytes("Content-Type", "application/json").unwrap()).with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap());
  let _ = req.respond(r);
}

fn hostname() -> String { std::env::var("HOSTNAME").or_else(|_| std::env::var("COMPUTERNAME")).unwrap_or_else(|_| "unknown".to_string()) }

fn local_ip() -> String {
  if let Ok(s) = UdpSocket::bind("0.0.0.0:0") { if let Ok(()) = s.connect("8.8.8.8:80") { if let Ok(a) = s.local_addr() { return a.ip().to_string(); } } }
  "127.0.0.1".to_string()
}
