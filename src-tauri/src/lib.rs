use std::fs;
use std::path::PathBuf;
use std::process::{Command, Child};
use std::sync::Mutex;

fn data_file_path() -> PathBuf {
    let home = dirs_next::home_dir().unwrap_or_else(|| PathBuf::from("."));
    home.join("Documents").join("interview-flashcards").join("data.json")
}

/// 尝试启动后端服务，返回子进程句柄
fn spawn_backend() -> Option<Child> {
    let exe_dir = std::env::current_exe().ok()?.parent()?.to_path_buf();
    let home = dirs_next::home_dir().unwrap_or_else(|| PathBuf::from("."));

    let candidates: Vec<PathBuf> = vec![
        // 开发模式：项目根目录下的 backend/
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).parent()?.join("backend"),
        // 生产模式：app bundle 同级或上级的 backend/
        exe_dir.join("../../../backend"),
        exe_dir.join("../../backend"),
        exe_dir.join("../backend"),
        exe_dir.join("backend"),
        // 桌面项目目录
        home.join("Desktop").join("interview-flashcards").join("backend"),
    ];

    let backend_dir = candidates.into_iter().find(|p| p.join("package.json").exists())?;
    log::info!("启动后端: {}", backend_dir.display());

    // 尝试多种方式找到 npm/node
    let local_npm = format!("{}/.local/bin/npm", home.display());
    let local_node = format!("{}/.local/bin/node", home.display());

    let npm_cmds: Vec<&str> = vec![
        "npm",
        "/opt/homebrew/bin/npm",
        "/usr/local/bin/npm",
        &local_npm,
    ];

    for npm in &npm_cmds {
        match Command::new(npm)
            .args(["run", "dev"])
            .current_dir(&backend_dir)
            .spawn()
        {
            Ok(child) => {
                log::info!("后端已启动 (pid: {}, npm: {})", child.id(), npm);
                return Some(child);
            }
            Err(_) => continue,
        }
    }

    // 最后尝试用 node 直接运行 tsx
    let node_cmds: Vec<&str> = vec![
        "node",
        "/opt/homebrew/bin/node",
        "/usr/local/bin/node",
        &local_node,
    ];
    for node in &node_cmds {
        match Command::new(node)
            .args(["node_modules/.bin/tsx", "src/server.ts"])
            .current_dir(&backend_dir)
            .spawn()
        {
            Ok(child) => {
                log::info!("后端已启动 via node (pid: {})", child.id());
                return Some(child);
            }
            Err(_) => continue,
        }
    }

    log::warn!("后端启动失败：找不到 npm/node，请手动执行 cd backend && npm run dev");
    None
}

// 保持后端进程存活
static BACKEND_PROCESS: Mutex<Option<Child>> = Mutex::new(None);

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 启动后端
    if let Some(child) = spawn_backend() {
        *BACKEND_PROCESS.lock().unwrap() = Some(child);
    }

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            read_data, write_data, get_data_path,
        ])
        .run(tauri::generate_context!())
        .expect("启动失败");

    // 退出时清理后端进程
    if let Some(mut child) = BACKEND_PROCESS.lock().unwrap().take() {
        let _ = child.kill();
    }
}
