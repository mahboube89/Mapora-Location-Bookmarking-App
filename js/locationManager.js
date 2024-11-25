/**
 * Copyright 2024 https://github.com/mahboube89
 * Licensed under the MIT License;
*/

export class LocationManager {

    constructor(locationOptions, confirmSelection,cancelSelection, addLocationToMap) {
        // Reference to the DOM element for location options (accordion)
        this.locationOptions = document.getElementById(locationOptions);

        // Reference to the confirm button
        this.confirmButton = document.getElementById(confirmSelection);

        // Reference to the cancel button
        this.cancelButton = document.getElementById(cancelSelection);

        // Callback function passed from App class to handle the confirmed location
        this.addLocationToMap = addLocationToMap;

        // Stores the user-selected location type
        this.selectedLocationType = null;

        // Reference to the textarea for notes
        this.noteField = document.querySelector(".note-field-textarea");

        // Set up event listeners for confirm and cancel buttons
        this._setEventListener();
    }

    _setEventListener() {

        // Listen for confirm button click and handle it
        this.confirmButton.addEventListener("click" , ()=> this._confirmSelection());

        // Listen for cancel button click and handle it
        this.cancelButton.addEventListener("click", ()=> this.hideAndResetOptions());

        // Add event listener for "Escape" key to cancel the selection
        document.addEventListener("keydown", this._handleEscape.bind(this));
    }

    showOptions() {
        // Show the location options accordion
        this.locationOptions.classList.remove("location-selector--hidden");

        // Add event listener for "Escape" key to cancel the selection
        document.addEventListener("keydown", this._handleEscape.bind(this));
    }

    _handleEscape(event) {
        // If the "Escape" key is pressed, cancel the selection
        if (event.key === "Escape") {
            this.hideAndResetOptions();
        }
    }


}