use std::fs;
use std::io::Write;
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
        // 生产模式：避免 GUI app 直接访问 Desktop 下的项目目录
        home.join("Library").join("Application Support").join("interview-flashcards").join("backend"),
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

    let log_dir = home.join("Library").join("Logs").join("interview-flashcards");
    let _ = fs::create_dir_all(&log_dir);
    let log_path = log_dir.join("backend.log");

    // 尝试多种方式找到 npm/node
    let local_node = format!("{}/.local/bin/node", home.display());

    let path_env = format!(
        "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:{}",
        home.join(".local/bin").display()
    );

    let npm_cmds: Vec<&str> = vec![
        "/opt/homebrew/bin/npm",
        "/usr/local/bin/npm",
    ];

    for npm in &npm_cmds {
        match Command::new(npm)
            .args(["run", "dev"])
            .current_dir(&backend_dir)
            .env("PATH", &path_env)
            .env("PWD", &backend_dir)
            .env("ELECTRON_RUN_AS_NODE", "1")
            .spawn()
        {
            Ok(child) => {
                log::info!("后端已启动 (pid: {}, npm: {})", child.id(), npm);
                return Some(child);
            }
            Err(_) => continue,
        }
    }

    // 最后尝试用 node 直接加载 tsx。桌面端由 LaunchServices 启动时 PATH
    // 可能会先命中不适合运行本项目的 node，所以优先使用用户本地 node。
    // 使用 `--import` 的绝对 loader 路径可以绕过 tsx CLI wrapper；同时不要把
    // cwd 放在 Desktop 下，避免 GUI app 被 macOS 桌面目录权限拦住。
    let tsx_loader_path = backend_dir.join("node_modules").join("tsx").join("dist").join("loader.mjs");
    let server_path = backend_dir.join("src").join("server.ts");
    let node_cmds: Vec<&str> = vec![
        &local_node,
        "/opt/homebrew/bin/node",
        "/usr/local/bin/node",
        "node",
    ];
    for node in &node_cmds {
        let stdout = fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&log_path)
            .ok();
        let stderr = fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&log_path)
            .ok();

        let mut command = Command::new(node);
        command
            .arg("--import")
            .arg(&tsx_loader_path)
            .arg(&server_path)
            .current_dir(&home)
            .env("PATH", &path_env)
            .env("PWD", &home)
            .env("ELECTRON_RUN_AS_NODE", "1")
            .env("NODE_ENV", "development")
            .env("NODE_OPTIONS", "--max-old-space-size=4096");
        if let Some(file) = stdout {
            command.stdout(file);
        }
        if let Some(file) = stderr {
            command.stderr(file);
        }

        match command.spawn() {
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
    write_data_atomic(json)
}

/// Atomic write: write to .tmp.json → flush → rename → data.json
/// Also rotates backups (keeps up to 10)
fn write_data_atomic(json: String) -> Result<(), String> {
    let path = data_file_path();
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e))?;
    }

    let tmp_path = path.with_extension("tmp.json");

    // Step 1: Write to temp file
    let mut f = fs::File::create(&tmp_path)
        .map_err(|e| format!("创建临时文件失败: {}", e))?;
    f.write_all(json.as_bytes())
        .map_err(|e| format!("写入临时文件失败: {}", e))?;
    f.flush().map_err(|e| format!("flush 失败: {}", e))?;

    // Step 2: macOS full sync
    #[cfg(target_os = "macos")]
    {
        use std::os::unix::io::AsRawFd;
        let fd = f.as_raw_fd();
        // F_FULLFSYNC = 51 on macOS
        let result = unsafe { libc::fcntl(fd, libc::F_FULLFSYNC) };
        if result != 0 {
            log::warn!("fcntl F_FULLFSYNC 失败: {}", std::io::Error::last_os_error());
        }
    }
    drop(f);

    // Step 3: Rotate backups before atomic rename
    rotate_backups(&path)?;

    // Step 4: Atomic rename
    fs::rename(&tmp_path, &path).map_err(|e| format!("原子重命名失败: {}", e))?;

    Ok(())
}

/// Rotate backup files: data.backup.1.json → data.backup.2.json → ... → data.backup.10.json
fn rotate_backups(main_path: &PathBuf) -> Result<(), String> {
    let stem = main_path.file_stem()
        .unwrap_or_default()
        .to_string_lossy();

    // Remove oldest backup (10)
    let oldest = main_path.with_file_name(format!("{}.backup.10.json", stem));
    if oldest.exists() {
        let _ = fs::remove_file(&oldest);
    }

    // Shift backups 9→10, 8→9, ... 1→2
    for i in (1..10).rev() {
        let old = main_path.with_file_name(format!("{}.backup.{}.json", stem, i));
        let new = main_path.with_file_name(format!("{}.backup.{}.json", stem, i + 1));
        if old.exists() {
            let _ = fs::rename(&old, &new);
        }
    }

    // Copy current data.json → data.backup.1.json
    if main_path.exists() {
        fs::copy(main_path, main_path.with_file_name(format!("{}.backup.1.json", stem)))
            .map_err(|e| format!("备份复制失败: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
fn get_data_path() -> String { data_file_path().to_string_lossy().to_string() }

#[tauri::command]
fn choose_document_file() -> Option<String> {
    rfd::FileDialog::new()
        .add_filter("Documents", &["pdf", "docx", "doc", "txt", "md"])
        .pick_file()
        .map(|path| path.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 启动后端
    if let Some(child) = spawn_backend() {
        *BACKEND_PROCESS.lock().unwrap() = Some(child);
    }

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            read_data, write_data, get_data_path, choose_document_file,
        ])
        .run(tauri::generate_context!())
        .expect("启动失败");

    // 退出时清理后端进程
    if let Some(mut child) = BACKEND_PROCESS.lock().unwrap().take() {
        let _ = child.kill();
    }
}
