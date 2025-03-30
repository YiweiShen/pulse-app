use std::ffi::CString;

use tauri_nspanel::{
    block::ConcreteBlock,
    cocoa::base::{id, nil},
    objc::{class, msg_send, sel, sel_impl},
};

/// Registers a listener for a specific `NSWorkspace` notification.
///
/// # Arguments
///
/// * `name`: The name of the `NSWorkspace` notification to observe (e.g., `"NSWorkspaceDidActivateApplicationNotification"`).
/// * `callback`: A closure that will be executed when the notification is received.
///
/// # Panics
///
/// Panics if the provided `name` cannot be converted into a `CString`.
pub fn register_workspace_listener(name: String, callback: Box<dyn Fn() + 'static>) {
    let workspace: id = unsafe { msg_send![class!(NSWorkspace), sharedWorkspace] };
    let notification_center: id = unsafe { msg_send![workspace, notificationCenter] };

    // Create a block (closure) to be executed when the notification is received.
    let block = ConcreteBlock::new(move |_notif: id| {
        callback();
    });
    // Blocks need to be copied to the heap for use in Objective-C.
    let block = block.copy();

    // Convert the Rust String to an NSString.
    let notification_name =
        CString::new(name).expect("Failed to create CString from notification name");
    let notification_name_id: id = unsafe {
        msg_send![class!(NSString), stringWithCString: notification_name.as_ptr() encoding: 4 /* UTF8 */]
    };

    // Register the observer.
    unsafe {
        let _: () = msg_send![
            notification_center,
            addObserverForName: notification_name_id
            object: nil // Observe all objects sending this notification
            queue: nil // Execute on the thread that posts the notification
            usingBlock: block
        ];
    }
    // The 'block' variable owns the copied block. When this function ends,
    // 'block' is dropped, but the Objective-C runtime now has a reference to it.
    // We don't need to explicitly release it in this simple case of adding an observer
    // that will likely live for the application's lifetime or until explicitly removed.
}
