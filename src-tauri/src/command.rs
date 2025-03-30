use std::sync::Once;
use tauri_nspanel::ManagerExt;

use crate::panel_appearance::update_menubar_appearance;
use crate::panel_configuraion::configure_menubar_panel;
use crate::panel_listeners::setup_menubar_panel_listeners;

// Initialize the menubar panel only once.
static MENUBAR_PANEL_INIT: Once = Once::new();
const MENUBAR_PANEL_LABEL: &str = "main";

/// Initializes the menubar panel.
///
/// This function ensures that the menubar panel is initialized only once, even if called multiple times.
/// It performs the following steps on the first call:
/// 1. Converts the main window to a menubar panel.
/// 2. Applies initial appearance settings.
/// 3. Sets up event listeners.
#[tauri::command]
pub fn init_menubar_panel(app_handle: tauri::AppHandle) {
    MENUBAR_PANEL_INIT.call_once(move || {
        configure_menubar_panel(&app_handle);
        update_menubar_appearance(&app_handle);
        setup_menubar_panel_listeners(&app_handle);
    });
}

/// Shows the menubar panel.
#[tauri::command]
pub fn show_menubar_panel(app_handle: tauri::AppHandle) -> Result<(), String> {
    match app_handle.get_webview_panel(MENUBAR_PANEL_LABEL) {
        Ok(panel) => {
            panel.show();
            Ok(())
        }
        Err(err) => Err(format!(
            "Failed to get menubar panel with label '{}': {:?}",
            MENUBAR_PANEL_LABEL, err
        )),
    }
}
