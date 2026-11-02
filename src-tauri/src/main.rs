#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::env;
use std::path::PathBuf;
use std::process::Command;

#[derive(Serialize, Deserialize)]
pub struct HostToolchainStatus {
    pub os: String,
    pub arch: String,
    pub java_installed: bool,
    pub java_version: String,
    pub android_home: Option<String>,
    pub gradle_available: bool,
    pub adb_available: bool,
}

#[tauri::command]
fn detect_host_toolchain() -> HostToolchainStatus {
    let java_out = Command::new("java").arg("-version").output();
    let (java_installed, java_version) = match java_out {
        Ok(out) => {
            let stderr = String::from_utf8_lossy(&out.stderr).to_string();
            let first_line = stderr.lines().next().unwrap_or("Installed").to_string();
            (out.status.success(), first_line)
        }
        Err(_) => (false, "Not detected in PATH".to_string()),
    };

    let android_home = env::var("ANDROID_HOME")
        .ok()
        .or_else(|| env::var("ANDROID_SDK_ROOT").ok());

    let gradle_available = Command::new("gradle").arg("--version").output().is_ok();
    let adb_available = Command::new("adb").arg("version").output().is_ok();

    HostToolchainStatus {
        os: env::consts::OS.to_string(),
        arch: env::consts::ARCH.to_string(),
        java_installed,
        java_version,
        android_home,
        gradle_available,
        adb_available,
    }
}

#[tauri::command]
fn invoke_local_gradle_build(project_dir: String, task_name: String) -> Result<String, String> {
    let path = PathBuf::from(&project_dir);
    if !path.exists() {
        return Err(format!("Project path does not exist: {}", project_dir));
    }

    let wrapper = if cfg!(target_os = "windows") {
        path.join("gradlew.bat")
    } else {
        path.join("gradlew")
    };

    let cmd_prog = if wrapper.exists() {
        wrapper.to_string_lossy().to_string()
    } else {
        "gradle".to_string()
    };

    let output = Command::new(cmd_prog)
        .current_dir(&path)
        .arg(&task_name)
        .arg("--stacktrace")
        .output()
        .map_err(|e| format!("Failed to spawn Gradle process: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if output.status.success() {
        Ok(format!("{}\n{}", stdout, stderr))
    } else {
        Err(format!("Gradle build failed:\n{}\n{}", stdout, stderr))
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            detect_host_toolchain,
            invoke_local_gradle_build
        ])
        .run(tauri::generate_context!())
        .expect("error while running AndroForge Studio Tauri application");
}
