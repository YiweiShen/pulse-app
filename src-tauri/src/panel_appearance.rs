use tauri::{Manager, WebviewWindow};
use tauri_nspanel::{
    cocoa::base::id,
    objc::{msg_send, sel, sel_impl},
};

/// Updates the appearance of the main window's menubar (specifically its corner radius).
///
/// This function retrieves the main webview window and sets its corner radius.
/// It is intended to be called after the application has initialized.
///
/// # Arguments
///
/// * `app_handle`: A reference to the Tauri application handle.
pub fn update_menubar_appearance(app_handle: &tauri::AppHandle) {
    // Attempt to get the main webview window. If it doesn't exist, log an error and return.
    let Some(window) = app_handle.get_webview_window("main") else {
        eprintln!("Error: Main window not found when trying to update menubar appearance.");
        return;
    };
    set_corner_radius(&window, 13.0);
}

/// Sets the corner radius of a given webview window.
///
/// This function accesses the underlying native NSWindow and its content view's layer
/// to set the corner radius. This is a platform-specific operation for macOS.
///
/// # Arguments
///
/// * `window`: A reference to the `WebviewWindow` whose corner radius needs to be set.
/// * `radius`: The desired corner radius in points (as a `f64`).
pub fn set_corner_radius(window: &WebviewWindow, radius: f64) {
    // Get the native NSWindow handle. If it's an error, log it and return.
    let win_result = window.ns_window();
    let win = match win_result {
        Ok(win) => win as id,
        Err(e) => {
            eprintln!("Error getting native NSWindow: {}", e);
            return;
        }
    };

    unsafe {
        // Get the content view of the window.
        let view: id = msg_send![win, contentView];

        // Ensure the view has a layer. Creating one if it doesn't exist.
        let _: () = msg_send![view, setWantsLayer: 1]; // Equivalent to YES in Objective-C

        // Get the layer of the view.
        let layer: id = msg_send![view, layer];

        // Set the corner radius on the layer.
        let _: () = msg_send![layer, setCornerRadius: radius];
    }
}
