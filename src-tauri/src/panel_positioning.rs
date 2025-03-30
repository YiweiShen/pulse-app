use tauri::Manager;

use tauri_nspanel::{
    cocoa::{
        base::id,
        foundation::{NSPoint, NSRect},
    },
    objc::{class, msg_send, runtime::NO, sel, sel_impl},
};

/// Positions the menubar panel at the top of the current monitor,
/// horizontally centered around the mouse cursor, with a specified top padding.
pub fn position_menubar_panel(app_handle: &tauri::AppHandle, padding_top: f64) {
    // Get the main webview window.
    let window = app_handle
        .get_webview_window("main")
        .expect("Main window not found");

    // Get information about the monitor where the cursor is currently located.
    let monitor = monitor::get_monitor_with_cursor().expect("Could not find monitor with cursor");
    let scale_factor = monitor.scale_factor();
    let visible_area = monitor.visible_area();
    let monitor_pos = visible_area.position().to_logical::<f64>(scale_factor);
    let monitor_size = visible_area.size().to_logical::<f64>(scale_factor);

    // Get the current mouse location in screen coordinates.
    let mouse_location: NSPoint = unsafe { msg_send![class!(NSEvent), mouseLocation] };

    // Get the underlying NSWindow handle.
    let handle: id = window.ns_window().expect("Could not get NSWindow handle") as _;

    // Get the current frame (position and size) of the window.
    let mut win_frame: NSRect = unsafe { msg_send![handle, frame] };

    // Calculate the new Y-coordinate for the window's origin (top edge).
    win_frame.origin.y =
        (monitor_pos.y + monitor_size.height) - win_frame.size.height - padding_top;

    // Calculate the new X-coordinate for the window's origin (left edge).
    win_frame.origin.x = {
        // Calculate the potential top-right corner of the window if centered on the mouse.
        let potential_top_right = mouse_location.x + (win_frame.size.width / 2.0);

        // Check if the potential top-right corner would be off-screen to the right.
        let is_offscreen = potential_top_right > monitor_pos.x + monitor_size.width;

        if !is_offscreen {
            // If not off-screen, center the window horizontally on the mouse cursor.
            mouse_location.x - (win_frame.size.width / 2.0)
        } else {
            // If off-screen, adjust the X-coordinate to keep the right edge of the window
            // aligned with the right edge of the monitor.
            let overflow = potential_top_right - (monitor_pos.x + monitor_size.width);
            mouse_location.x - (win_frame.size.width / 2.0) - overflow
        }
    };

    // Set the new frame for the window without displaying it immediately.
    let _: () = unsafe { msg_send![handle, setFrame: win_frame display: NO] };
}
