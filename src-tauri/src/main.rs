// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod app_utils;
mod command;
mod panel_appearance;
mod panel_configuraion;
mod panel_listeners;
mod panel_positioning;
mod tray;
mod workspace_listener;

use std::error::Error;
use tauri::{App, AppHandle};

/// Main entry point of the Tauri application.
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            command::init_menubar_panel,
            command::show_menubar_panel,
            command::exit_app,
        ])
        .plugin(tauri_nspanel::init())
        .setup(setup_app)
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}

/// Application setup function.
///
/// This function is called once during the application initialization.
fn setup_app(app: &mut App) -> Result<(), Box<dyn Error>> {
    // Set the activation policy to Accessory, making the app a menu bar app.
    app.set_activation_policy(tauri::ActivationPolicy::Accessory);

    // Get a handle to the application.
    let app_handle: AppHandle = app.handle().clone();

    // Initialize the system tray.
    tray::create(&app_handle)?;

    Ok(())
}
