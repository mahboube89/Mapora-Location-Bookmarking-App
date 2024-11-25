/**
 * Copyright 2024 https://github.com/mahboube89
 * Licensed under the MIT License;
*/

import { showNotification } from "./utils.js";

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
        this.noteField = document.querySelector(".location-selector__textarea");

        // Set up event listeners for confirm and cancel buttons
        this._setEventListener();
    }
    

    /**
     * Adds event listeners for confirm, cancel, and Escape key actions.
     * Handles user interactions with the location selector.
    */
    _setEventListener() {

        // Listen for confirm button click and handle it
        this.confirmButton.addEventListener("click" , ()=> this._confirmSelection());

        // Listen for cancel button click and handle it
        this.cancelButton.addEventListener("click", ()=> this.hideAndResetOptions());

        // Add event listener for "Escape" key to cancel the selection
        document.addEventListener("keydown", this._handleEscape.bind(this));
    }


    /**
     * Displays the location options accordion.
     * Adds an event listener for the Escape key to handle cancelling the selection.
    */
    showOptions() {
        // Show the location options accordion
        this.locationOptions.classList.remove("location-selector--hidden");

        // Add event listener for "Escape" key to cancel the selection
        document.addEventListener("keydown", this._handleEscape.bind(this));
    }


    /**
     * Handles Escape key press to cancel and reset the location options.
     * @param {KeyboardEvent} event - The keyboard event triggered by pressing a key.
     */
    _handleEscape(event) {
        // If the "Escape" key is pressed, cancel the selection
        if (event.key === "Escape") {

            // Hide and reset the location options
            this.hideAndResetOptions();
        }
    }


    /**
     * Confirms the selected location type and notes.
     * Collects data and passes it to the callback function provided by the App class.
     */
    _confirmSelection() {
        
        // Retrieve the selected radio button for location type
        const selectedRadio = document.querySelector('input[name="locationType"]:checked');

        if(!selectedRadio) {
            // Show error notification if no location type is selected
            showNotification("Please select a location type.", "error");
            return;
        }     
               
        // Format the date to a readable string (e.g., "Aug 21, 2024")
        const formattedDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        // Get the selected type and corresponding notes
        const selectedType = selectedRadio.value;
        const noteField = document.querySelector(`.location-selector__textarea[data-option="${selectedType}"]`);
        const notes = noteField ? noteField.value : '';
        
        // Prepare location data object
        const locationData = {
            id: (Date.now() + '').slice(-10),
            type: selectedType.toLowerCase().replace(/\s+/g, '-'),
            notes,
            created_at: formattedDate
        }
        
        // Pass the location data to the callback (App class method)
        if(this.addLocationToMap) {
            this.addLocationToMap(locationData);
            this.hideAndResetOptions();
        }
    }

    
    /**
     * Hides the location options accordion and resets its inputs.
     * Clears the UI state for the next interaction.
    */
    hideAndResetOptions() {
        // Hide the location options accordion
        this.locationOptions.style.display = "none";
        this.locationOptions.classList.add('location-selector--hidden');

        // Delay reset for smooth UX
        setTimeout(() => {
            this.locationOptions.style.display = "flex"
        }, 1000);

        // Reset the location-widget__content height
        document.querySelector(".location-widget__content").style.height = "540px";

        // Clear note field and radio button selections
        document.querySelectorAll('.location-selector__textarea').forEach(textarea => textarea.value = "");

        // Reset all radio button selections
        document.querySelectorAll('input[type="radio"]').forEach(radio => radio.checked = false);

    }

}