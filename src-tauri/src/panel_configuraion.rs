use tauri::{Emitter, Manager};
use tauri_nspanel::{
    cocoa::appkit::{NSMainMenuWindowLevel, NSWindowCollectionBehavior},
    objc::{class, msg_send, sel, sel_impl},
    panel_delegate, WebviewWindowExt,
};

const NS_WINDOW_STYLE_MASK_NON_ACTIVATING_PANEL: i32 = 1 << 7;

/// Converts the main webview window into a menubar panel with specific behaviors.
///
/// This function performs the necessary steps to make the window act like a
/// menubar panel, including setting its level, style mask, collection behavior,
/// and a custom delegate to emit an event when the panel resigns key status.
pub fn configure_menubar_panel(app_handle: &tauri::AppHandle) {
    // Create a custom panel delegate to handle window events.
    let panel_delegate = panel_delegate!(SpotlightPanelDelegate {
        window_did_resign_key
    });

    // Get the main webview window.
    let window = app_handle
        .get_webview_window("main")
        .expect("Main window not found");

    // Convert the webview window to a native panel.
    let panel = window
        .to_panel()
        .expect("Failed to convert window to panel");

    // Clone the app handle to be moved into the delegate's event listener.
    let handle = app_handle.clone();

    // Set a listener on the panel delegate to emit an event when the window resigns key status.
    panel_delegate.set_listener(Box::new(move |delegate_name: String| {
        if delegate_name.as_str() == "window_did_resign_key" {
            // Emit a custom event that the menubar panel has resigned key status.
            let _ = handle.emit("menubar_panel_did_resign_key", ());
        }
    }));

    // Set the panel level to be above the main menu bar.
    panel.set_level(NSMainMenuWindowLevel + 1);

    // Set the style mask to make the panel non-activating. This means it won't
    // automatically become the key window when it's shown.
    panel.set_style_mask(NS_WINDOW_STYLE_MASK_NON_ACTIVATING_PANEL);

    // Set the collection behavior to control how the panel interacts with spaces
    // and full-screen applications.
    panel.set_collection_behaviour(
        NSWindowCollectionBehavior::NSWindowCollectionBehaviorCanJoinAllSpaces // Can appear in all spaces.
            | NSWindowCollectionBehavior::NSWindowCollectionBehaviorStationary // Stays on top of other windows.
            | NSWindowCollectionBehavior::NSWindowCollectionBehaviorFullScreenAuxiliary, // Behaves as an auxiliary window in full-screen mode.
    );

    // Set the custom panel delegate for the window.
    panel.set_delegate(panel_delegate);
}
