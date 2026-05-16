mod sync_server;

use std::fs;
use std::path::PathBuf;

fn data_file_path() -> PathBuf {
    let home = dirs_next::home_dir().unwrap_or_else(|| PathBuf::from("."));
    home.join("Documents").join("interview-flashcards").join("data.json")
}

#[tauri::command]
fn read_data() -> Result<String, String> {
    let path = data_file_path();
    if !path.exists() { return Ok("{}".to_string()); }
    fs::read_to_string(&path).map_err(|e| format!("读取失败: {}", e))
}

#[tauri::command]
fn write_data(json: String) -> Result<(), String> {
    let path = data_file_path();
    if let Some(parent) = path.parent() { fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e))?; }
    fs::write(&path, &json).map_err(|e| format!("写入失败: {}", e))
}

#[tauri::command]
fn get_data_path() -> String { data_file_path().to_string_lossy().to_string() }

#[tauri::command] fn sync_start_server(port: u16) -> Result<String, String> { sync_server::start_server(port) }
#[tauri::command] fn sync_stop_server() -> Result<(), String> { sync_server::stop_server() }
#[tauri::command] fn sync_get_status() -> serde_json::Value { sync_server::get_status() }
#[tauri::command] fn sync_append_op(op_json: String) -> Result<(), String> { sync_server::append_op(&op_json) }
#[tauri::command] fn sync_read_all_ops() -> serde_json::Value { sync_server::read_all_ops() }
#[tauri::command] fn sync_read_seen_ops() -> serde_json::Value { sync_server::read_seen_ops() }

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            read_data, write_data, get_data_path,
            sync_start_server, sync_stop_server, sync_get_status,
            sync_append_op, sync_read_all_ops, sync_read_seen_ops,
        ])
        .run(tauri::generate_context!())
        .expect("启动失败");
}
