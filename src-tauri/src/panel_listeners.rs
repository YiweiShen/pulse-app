use tauri::{AppHandle, Listener};
use tauri_nspanel::ManagerExt;

/// Hides the menubar panel if it's not already in the frontmost application.
///
/// This function checks if the menubar is the active application. If not, it attempts to retrieve
/// the webview panel named "main" and orders it out (hides it). It handles the case
/// where retrieving the panel might fail.
///
/// # Arguments
///
/// * `app_handle`: A reference to the Tauri application handle.
fn hide_menubar_panel(app_handle: &tauri::AppHandle) {
    // Early return if the menubar is the frontmost application.
    if super::app_utils::is_menubar_frontmost() {
        return;
    }

    // Attempt to get the menubar panel. Handle potential errors.
    let panel_result = app_handle.get_webview_panel("main");
    match panel_result {
        Ok(panel) => {
            // Order the panel out (hide it).
            panel.order_out(None);
        }
        Err(e) => {
            eprintln!("Error getting menubar panel 'main': {:?}", e);
            // TODO: Take other actions if the panel can't be retrieved.
        }
    }
}

/// Sets up listeners to automatically hide the menubar panel under certain conditions.
///
/// This function registers listeners for the following events:
/// - `menubar_panel_did_resign_key`: Triggered when the menubar panel loses focus.
/// - `NSWorkspaceDidActivateApplicationNotification`: Triggered when a different application becomes active.
/// - `NSWorkspaceActiveSpaceDidChangeNotification`: Triggered when the active macOS space changes.
///
/// In all these cases, the `hide_menubar_panel` function is called to hide the panel.
///
/// # Arguments
///
/// * `app_handle`: A reference to the Tauri application handle.
pub fn setup_menubar_panel_listeners(app_handle: &AppHandle) {
    // Clone the AppHandle for use in the first listener. Cloning is lightweight.
    let handle1 = app_handle.clone();
    app_handle.listen_any("menubar_panel_did_resign_key", move |_| {
        hide_menubar_panel(&handle1);
    });

    // Clone the AppHandle for use in the workspace listeners.
    let handle2 = app_handle.clone();
    // Create a reusable closure for hiding the panel. This avoids redundant code.
    let hide_panel_closure = Box::new(move || {
        hide_menubar_panel(&handle2);
    });

    // Register workspace listener for application activation.
    super::workspace_listener::register_workspace_listener(
        "NSWorkspaceDidActivateApplicationNotification".into(),
        hide_panel_closure.clone(), // Clone the closure for the second listener
    );

    // Register workspace listener for active space changes.
    super::workspace_listener::register_workspace_listener(
        "NSWorkspaceActiveSpaceDidChangeNotification".into(),
        hide_panel_closure,
    );
}
