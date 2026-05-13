use std::fs;
use std::path::PathBuf;

/// 获取数据文件路径：~/Documents/interview-flashcards/data.json
fn data_file_path() -> PathBuf {
    let home = dirs_next::home_dir().unwrap_or_else(|| PathBuf::from("."));
    home.join("Documents")
        .join("interview-flashcards")
        .join("data.json")
}

/// 读取数据文件，返回 JSON 字符串
#[tauri::command]
fn read_data() -> Result<String, String> {
    let path = data_file_path();
    if !path.exists() {
        return Ok("{}".to_string());
    }
    fs::read_to_string(&path).map_err(|e| format!("读取失败: {}", e))
}

/// 写入数据文件
#[tauri::command]
fn write_data(json: String) -> Result<(), String> {
    let path = data_file_path();
    // 确保目录存在
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e))?;
    }
    fs::write(&path, &json).map_err(|e| format!("写入失败: {}", e))
}

/// 获取数据文件路径（用于显示）
#[tauri::command]
fn get_data_path() -> String {
    data_file_path().to_string_lossy().to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![read_data, write_data, get_data_path])
        .run(tauri::generate_context!())
        .expect("启动失败");
}
