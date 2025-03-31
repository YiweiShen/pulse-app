use tauri::{
    image::Image,
    tray::{MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
    AppHandle,
};
use tauri_nspanel::ManagerExt;

use crate::panel_positioning::position_menubar_panel;

/// Handles tray icon click events to toggle the main application panel's visibility.
///
/// This function is called when a tray icon event occurs and specifically handles
/// left-click events to show or hide the main application panel.
///
/// # Arguments
///
/// * `app_handle`: A reference to the application handle.
/// * `event`: The tray icon event that occurred.
fn handle_tray_click(app_handle: &AppHandle, event: TrayIconEvent) {
    if let TrayIconEvent::Click { button_state, .. } = event {
        // Only proceed if the left mouse button was released.
        if button_state == MouseButtonState::Up {
            // Get the main application panel. We expect it to exist.
            let main_panel = app_handle.get_webview_panel("main").unwrap();

            // Toggle the visibility of the main panel.
            if main_panel.is_visible() {
                // If the panel is visible, order it out (hide it).
                main_panel.order_out(None);
            } else {
                // If the panel is not visible, position it and then show it.
                position_menubar_panel(app_handle, 0.0);
                main_panel.show();
            }
        }
    }
}

/// Creates and configures the system tray icon.
///
/// This function loads the tray icon image, sets up its event handler
/// to toggle the visibility of the main application panel on left-click,
/// and builds the tray icon.
///
/// # Arguments
///
/// * `app_handle`: A reference to the application handle.
///
/// # Returns
///
/// A `tauri::Result` containing the created `TrayIcon` on success, or an error if icon loading or tray icon creation fails.
fn create_tray_icon(
    app_handle: &AppHandle,
    id: &str,
    icon_bytes: &'static [u8],
) -> tauri::Result<TrayIcon> {
    // Load the tray icon image from the specified bytes.
    let tray_icon_image = Image::from_bytes(icon_bytes)?;
    app_handle.remove_tray_by_id("tray");
    app_handle.remove_tray_by_id("tray_unread");
    // Build the tray icon with the specified ID and icon.
    let tray_icon = TrayIconBuilder::with_id(id)
        .icon(tray_icon_image)
        .icon_as_template(true) // Indicate that the icon should be treated as a template (for macOS light/dark mode).
        .on_tray_icon_event(move |tray, event| {
            // Get a clone of the application handle for use within the closure.
            let app_handle = tray.app_handle().clone();

            // Handle tray icon click events using the dedicated function.
            handle_tray_click(&app_handle, event);
        })
        .build(app_handle)?; // Build the tray icon and handle potential errors.

    Ok(tray_icon)
}

pub fn create(app_handle: &AppHandle) -> tauri::Result<TrayIcon> {
    create_tray_icon(
        app_handle,
        "tray",
        include_bytes!("../icons/status_no_mail.png"),
    )
}

pub fn create_unread(app_handle: &AppHandle) -> tauri::Result<TrayIcon> {
    create_tray_icon(
        app_handle,
        "tray_unread",
        include_bytes!("../icons/status_unread.png"),
    )
}
