/**
 * Copyright 2024 https://github.com/mahboube89
 * Licensed under the MIT License;
*/


export function showNotification( message, type = 'success') {

    const notificationElement = document.getElementById('notification');

    const closeHandler = () => closeNotification(notificationElement, closeHandler);
    
    notificationElement.innerHTML = ''; // Clear previous content
    notificationElement.className = `notification show`;

    const html = `
        <div class="notification__message message--${type}">
            <h1 class="notification-title" >${type.toUpperCase()}</h1>
            <p class="notification-content">${message}</p>
            <!-- x icon through a path element -->
            <button id="close-notification" class="notification__close-btn"><span>&times;</span></button>
        </div>
    `;
    
    notificationElement.insertAdjacentHTML("beforeend", html);

    const closeButton = document.getElementById("close-notification");

    closeButton.addEventListener("click", closeHandler );

    const keydownHandler = (event) => {
        if (event.key === "Escape") {
            closeHandler();
        }
    };
    document.addEventListener("keydown", keydownHandler);

    setTimeout(() => {
        closeHandler();
    }, 4000);

}

function closeNotification(notificationElement, closeHandler) {
    
    notificationElement.className = `notification`;
    notificationElement.innerHTML = ''; // Clear content after hiding

    const closeButton = document.getElementById("close-notification");
    if (closeButton) {
        closeButton.removeEventListener("click", closeHandler);
    }
}