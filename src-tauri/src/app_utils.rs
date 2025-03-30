use tauri_nspanel::cocoa::base::id;
use tauri_nspanel::objc::{class, msg_send, sel, sel_impl};

/// Retrieves the process ID (PID) of the current application.
fn current_app_pid() -> i32 {
    let process_info: id = unsafe { msg_send![class!(NSProcessInfo), processInfo] };
    let pid: i32 = unsafe { msg_send![process_info, processIdentifier] };
    pid
}

/// Retrieves the process ID (PID) of the currently frontmost application.
fn frontmost_app_pid() -> i32 {
    let workspace: id = unsafe { msg_send![class!(NSWorkspace), sharedWorkspace] };
    let frontmost_application: id = unsafe { msg_send![workspace, frontmostApplication] };
    let pid: i32 = unsafe { msg_send![frontmost_application, processIdentifier] };
    pid
}

/// Checks if the current application is the frontmost application (i.e., its menu bar is active).
pub fn is_menubar_frontmost() -> bool {
    frontmost_app_pid() == current_app_pid()
}
