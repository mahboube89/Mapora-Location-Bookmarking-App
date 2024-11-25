/**
 * Copyright 2024 https://github.com/mahboube89
 * Licensed under the MIT License;
*/

/**
 * Displays a notification with a custom message and type (success, error, etc.).
 * The notification automatically hides after 4 seconds or when closed manually.
 * 
 * @param {string} message - The message to display in the notification.
 * @param {string} [type='success'] - The type of notification (e.g., 'success', 'error', 'info'). Default is 'success'.
 */

export function showNotification( message, type = 'success') {

    // Get the notification element
    const notificationElement = document.getElementById('notification');

    // Handler to close the notification
    const closeHandler = () => closeNotification(notificationElement, closeHandler);
    
    notificationElement.innerHTML = ''; // Clear previous content
    notificationElement.className = `notification show`; // Add the class to show the notification

    // Create the HTML content for the notification
    const html = `
        <div class="notification__message message--${type}">
            <h1 class="notification-title" >${type.toUpperCase()}</h1>
            <p class="notification-content">${message}</p>
            <button id="close-notification" class="notification__close-btn"><span>&times;</span></button>
        </div>
    `;
    
    // Inject the notification content into the notification element
    notificationElement.insertAdjacentHTML("beforeend", html);

    // Add an event listener for the close button
    const closeButton = document.getElementById("close-notification");
    closeButton.addEventListener("click", closeHandler );

    // Add a keyboard event listener to close the notification on pressing "Escape"
    const keydownHandler = (event) => {
        if (event.key === "Escape") {
            closeHandler();
        }
    };
    document.addEventListener("keydown", keydownHandler);

    // Automatically close the notification after 4 seconds
    setTimeout(() => {
        closeHandler();
    }, 4000);

}


/**
 * Closes the currently displayed notification and removes its content.
 * Cleans up event listeners to prevent memory leaks.
 * 
 * @param {HTMLElement} notificationElement - The notification element to close.
 * @param {Function} closeHandler - The handler function used for the close event.
 */
function closeNotification(notificationElement, closeHandler) {
    
    notificationElement.className = `notification`; // Hide the notification by resetting its class
    notificationElement.innerHTML = ''; // Clear content after hiding

    // Remove the click event listener from the close button
    const closeButton = document.getElementById("close-notification");
    if (closeButton) {
        closeButton.removeEventListener("click", closeHandler);
    }
}