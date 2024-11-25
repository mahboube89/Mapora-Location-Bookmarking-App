/**
 * Copyright 2024 https://github.com/mahboube89
 * Licensed under the MIT License;
*/

import { LocationManager } from "./locationManager.js";
import { showNotification } from "./utils.js";

class App {

    #map; // Private variable to store the Leaflet map instance
    #lastClickedLocation;  // Stores the last clicked map coordinates
    locations = []; // Array to store all saved locations
    filteredLocations = []; // Array for storing filtered locations based on tab selection
    savedMarkers = new Map() // Map to store saved markers

    #locateButton;
    #logoButton;
    #locationTabs;
    #contentContainer;

    constructor() {

        // Initialize LocationManager with necessary IDs and callback
        this.locationManager = new LocationManager("locationOptions", "confirmSelection", "cancelSelection", this._addNewLocation.bind(this));
    
        // Load the map based on user's geolocation
        this._getLocation();

        // Store DOM elements
        this.#locateButton = document.getElementById('locateMe');
        this.#logoButton = document.getElementById('logo');
        this.#locationTabs = document.querySelectorAll(".location-widget__tab-input");
        this.#contentContainer = document.querySelector(".location-widget__content-inner");

        // Set up event listeners
        this._setEventListener();

        // Set event listeners for tab interactions
        this._setEventListenerToTabs();

        // Set the "all" tab as selected by default
        document.getElementById("all").checked = true;

        
    }


    /**
     * Sets up event listeners for user interactions.
     * - Handles clicks on the "Locate Me" button and the logo to trigger user location retrieval.
     */
    _setEventListener() {
        this.#locateButton.addEventListener('click', () => this._locateUser());
        this.#logoButton.addEventListener('click', () => this._locateUser());
    }


    /**
     * Retrieves the user's current geolocation.
     * - Initializes the map if it's not already loaded.
     * - Returns the position object if successful.
     *
     * @returns {Promise<Object>} The user's geolocation position object.
     * @throws {Error} If geolocation is not supported or fails to retrieve the location.
    */
    async _getLocation() {  

        // Check if the browser supports geolocation
        if(! navigator.geolocation) {
            showNotification("Geolocation is not supported by this browser.", "error");
            throw new Error("Geolocation is not supported by this browser.");
        }

        try {
            // Request user's geolocation
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
    
            // Ensure position is valid
            if (!position) throw new Error("Position is undefined.");
            
            // Only initialize the map if it's not already initialized
            if (!this.#map) {
                this._loadMap(position);
            }
            
            return position; // Return the position object

        } catch (error) {
            showNotification(`Unable to retrieve your location. ${error.message}`, "error");
            throw error; // Re-throw the error for further handling if necessary
        }
    }


    /**
     * Centers the map on the user's current location and adds a marker.
     * Retrieves the current geolocation and updates the map view.
     */
    async _locateUser() {

        try {
            // Get the user's current geolocation
            const position = await this._getLocation();

            const { latitude, longitude } = position.coords;
            const coords = [latitude, longitude];

            // Center the map on the user's current location
            this.#map.flyTo(coords, 15, {
                animate: true,
                duration: 1, // Smooth animation duration
                easeLinearity: 0.2,
            });

            // Add or update the current location marker
            this._addCurrentLocationMarker(coords);

            // Notify the user of a successful location retrieval
            showNotification("Centered map on your location.", "success");

        } catch (error) {
            console.error("Location retrieval failed:", error.message);
            // Notification is handled inside _getLocation
        }
            
    }


    /**
     * Initializes the Leaflet map and adds saved locations.
     * @param {Object} position - Geolocation position object.
     */
    _loadMap(position) {
        
        const {latitude, longitude} = position.coords;
        const coords = [latitude, longitude];

        // Initialize the Leaflet map with the user's coordinates
        this.#map = L.map('map').setView(coords, 15);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(this.#map);

        // Another Map Design
        // L.tileLayer('https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png', {
        //     attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        //     maxZoom: 20
        // }).addTo(this.#map);

        // Add a marker and popup for the user's current location
        this._addCurrentLocationMarker(coords);


        // Load saved locations from localStorage and add them to the map
        this._loadLocationsFromStorage(); // Ensure this does NOT modify the view

        // Set up map click event to show location options
        this.#map.on("click", this._showLocationOptions.bind(this));

        // Render all locations on the map
        this.locations.forEach((location) => {
            this._addLocationMarker(location); // Add each saved location to the map
        });
    }


    /**
     * Handles the map click event to show the location options accordion.
     *
     * @param {Object} mapEvent - The map event object containing information about the click event.
     */
    _showLocationOptions(mapEvent) {
        // Store clicked map coordinates
        this.#lastClickedLocation = mapEvent.latlng;

        // Show the accordion to allow user selection
        this.locationManager.showOptions();
    }


    /**
     * Adds a new location based on the user's input and clicked map coordinates.
     *
     * @param {Object} locationData - The data provided by the user, including type, notes, and timestamp.
     */
    _addNewLocation(locationData) {
        
        // Ensure there is a valid clicked location before proceeding
        if( !this.#lastClickedLocation) return; 
  
        const {lat, lng} = this.#lastClickedLocation;
        
        // Combine user input data with the clicked coordinates
        const location = {
            ...locationData,
            coords: [lat, lng]
        }

        // Add the new location to the locations array
        this.locations.push(location);

        // Persist the updated locations array to localStorage
        this._saveLocationsToStorage();

        // Add a marker for the new location on the map
        this._addLocationMarker(location, true);

        // Refresh the "All" tab to include the new location
        this._renderLocation("all");
        
        // Show success notification
        showNotification("Location saved successfully!","success");
    }


    /**
     * Adds a marker on the map to indicate the user's current location.
     * If a marker already exists, it is removed before adding a new one.
     *
     * @param {Array<number>} coords - The coordinates [latitude, longitude] for the current location.
    */
    _addCurrentLocationMarker (coords) {
        // Check if a current location marker already exists, and remove it if it does
        if (this.currentLocationMarker) {
            this.#map.removeLayer(this.currentLocationMarker);
        }
    
        // Create and add a new marker at the provided coordinates
        this.currentLocationMarker = L.marker(coords)
            .addTo(this.#map)
            .bindPopup('You are here', {
                autoClose: false, // Ensure the popup remains open
                closeOnClick: false  // Prevent the popup from closing when clicking elsewhere on the map
            })
            .openPopup(); // Automatically display the popup when the marker is added
    }

    
    /**
     * Adds a marker to the map for a given location.
     * @param {Object} location - The location data containing type, created_at, and coordinates.
     * @param {boolean} shouldOpenPopup - Determines whether the popup should open automatically.
    */
    _addLocationMarker(location, shouldOpenPopup = false) {

        // Destructure the location data
        const { type, created_at, coords } = location;
        const [lat, lng] = coords;
    
        // Construct the path for the icon based on the location type
        const iconPath = `images/popup-${type.toLowerCase().replace(/\s+/g, '-')}.png`; // Path for the icon
        const icon = `<img src="${iconPath}" width="20" height="20">`;
    
        // Ensure map exists before adding a marker
        if (!this.#map) return;
    
        // Create a new Leaflet marker at the specified coordinates
        const marker = L.marker([lat, lng])
            .addTo(this.#map)
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false, // Keep popup open even when another is opened
                    closeOnClick: false, // Prevent closing popup when clicking outside
                    className: `popup-${type.toLowerCase().replace(/\s+/g, '-')}`, // Custom class for styling

                }).setContent(
                    // Set the popup content to include the icon, type, and creation date
                    `<div>${icon}</div><div>${type}<br><small>${created_at}</small></div>`
                )
            );
    
        // Automatically open the popup if specified
        if (shouldOpenPopup) {
            marker.openPopup();
        }

        // Store the marker in the savedMarkers map using the location ID as the key
        this.savedMarkers.set(location.id, marker);

    }


    /**
     * Attaches event listeners to location tabs for filtering displayed locations.
     * 
     * Each tab triggers the rendering of locations that match its type (e.g., "all", "want-to-go").
    */
    _setEventListenerToTabs() {

        // Add event listeners to each tab for filtering locations
        this.#locationTabs.forEach(tab => {
            tab.addEventListener("change", (e) => {              
                const tabType = e.target.id; // e.g., "all", "want-to-go"

                // Render locations dynamically based on the selected tab type
                this._renderLocation(tabType);               
            });
        });
    }


    /**
     * Renders locations dynamically in the UI based on the selected tab.
     * Filters locations, updates the DOM, and attaches necessary event listeners.
     * 
     * @param {string} tabType - The type of tab selected (e.g., "all", "want-to-go").
     */
    _renderLocation(tabType) {

        this.#contentContainer.innerHTML = ""; // Clear previous content

        // Create a wrapper for the filtered locations
        const savedLocationsWrapper = document.createElement("div");
        savedLocationsWrapper.classList.add("saved-location-wrapper");

        // Filter locations based on selected tab
        this.filteredLocations = tabType === "all"
        ? this.locations 
        : this.locations.filter(location => location.type.toLowerCase() === tabType)

        // Iterate through filtered locations and build HTML for each
        this.filteredLocations.forEach(location => {       
            const locationHTML = `
                <div class="location-tab location-tab--${location.type}" data-id="${location.id}" >
                    <div class="location-tab__icon">
                        <img src="images/popup-${location.type}.png" width="25" height="25">
                    </div>
                    <div class="location-tab__content">
                        <div class="location-info" >
                            <p class="location-info__date">Saved at <span>${location.created_at}</span></p>
                            <p class="location-info__note">${location.notes || 'No notes available'}</p>
                        </div>
                        <div class="location-actions" >
                            <button class="location-actions__delete-btn"><svg id="trash-svg" width="28px" height="28px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M18 6V16.2C18 17.8802 18 18.7202 17.673 19.362C17.3854 19.9265 16.9265 20.3854 16.362 20.673C15.7202 21 14.8802 21 13.2 21H10.8C9.11984 21 8.27976 21 7.63803 20.673C7.07354 20.3854 6.6146 19.9265 6.32698 19.362C6 18.7202 6 17.8802 6 16.2V6M14 10V17M10 10V17" stroke="#aaa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            savedLocationsWrapper.insertAdjacentHTML("beforeend", locationHTML);
        });
      
        // Append filtered locations to the content container if available
        if (this.filteredLocations.length > 0) {
            this.#contentContainer.appendChild(savedLocationsWrapper);
        }
        
        // Attach event listeners for each location tab to handle navigation
        const locationElements = savedLocationsWrapper.querySelectorAll(".location-tab");
        locationElements.forEach(locationElement => {
            locationElement.addEventListener( "click", (e) => this._moveToLocation(e));
        });

        // Attach event listeners to delete buttons for each location
        this._setDeleteListeners();

    }


    /**
     * Moves the map to the location of a selected item and opens its marker popup.
     * 
     * @param {Event} event - The click event triggered by a location tab.
     */
    _moveToLocation(event){

        const locationId = event.currentTarget.dataset.id;

        // Find the corresponding location by ID
        const location = this.locations.find( (loc) => loc.id === locationId);

        if (location && location.coords) {
            const [lat, lng] = location.coords;

            // Smoothly center the map on the location
            this.#map.flyTo([lat, lng], 15, {
                animate:true,
                duration: 1, // Duration in seconds
                easeLinearity: 0.2 // Adjust for smoother transitions                  
            });

            // Find and open the corresponding marker's popup
            const marker = this.savedMarkers.get(locationId);
            if (marker) {
                marker.openPopup();
            } else {
                // If marker doesn't exist (unlikely but safe), add it
                this._addLocationMarker(location, true);
            }

        }
    }


    /**
     * Saves the current locations array to localStorage.
     * This ensures persistence of data across page reloads.
    */
    _saveLocationsToStorage() {
        // Convert the locations array to a JSON string and store it in localStorage
        localStorage.setItem('locations', JSON.stringify(this.locations));
    }


    /**
    * Loads saved locations from localStorage and updates the application state.
    */
    _loadLocationsFromStorage() {

        // Get locations from localStorage
        const storedLocations = JSON.parse(localStorage.getItem("locations"));

        // If there are no stored locations, exit the function
        if(!storedLocations) return;

        // If locations exist, update the application state
        if (storedLocations) {
            this.locations = storedLocations;

            // Render all locations in the "all" tab by default
            this._renderLocation("all");
        }
    }
    

    /**
     * Sets up event listeners for delete buttons in the location actions.
     * This allows users to delete saved locations.
    */
    _setDeleteListeners() {

        // Select all delete buttons in the location actions
        const deleteButtons = document.querySelectorAll(".location-actions__delete-btn");

        // Attach a click event listener to each delete button
        deleteButtons.forEach(button => {

            button.addEventListener( "click", (e) => {

                // Get the location ID associated with the delete button
                const locationId = e.target.closest(".location-tab").dataset.id; 
                
                // Call the delete function for the specified location ID
                this._deleteLocation(locationId);
            });

        });
    }


    /**
     * Deletes a location by its ID.
     * Updates the map, localStorage, and UI dynamically.
     * 
     * @param {string} locationId - The ID of the location to be deleted.
    */
    _deleteLocation(locationId) {

        // Find the location to be deleted from the array
        const location = this.locations.find(loc => loc.id === locationId);
        
        // Show an error notification if the location is not found
        if (!location) {
            showNotification("Location not found!", "error");
            return;
        }

        // If the location exists, focus the map on its coordinates before deletion
        if (location && location.coords) {
            this.#map.flyTo(location.coords, 15, {
                animate: true,
                duration: 1, // Smooth transition duration
                easeLinearity: 0.2,
            });
        }

        // Filter out the deleted location from the locations array
        this.locations = this.locations.filter(location => location.id !== locationId);
           
        // Find and remove the corresponding marker from the map
        const marker = this.savedMarkers.get(locationId);
        if (marker) {
            this.#map.removeLayer(marker); // Remove the marker from the map
            this.savedMarkers.delete(locationId); // Remove the marker from the Map
        }
    
        // Save the updated locations array back to localStorage
        this._saveLocationsToStorage();
    
        // Dynamically remove the corresponding location tab from the DOM
        const tabElement = document.querySelector(`.location-tab[data-id="${locationId}"]`);
        if (tabElement) {
            tabElement.remove(); // Remove the tab element from the DOM
        }

        // Show a success notification to the user
        showNotification("Location deleted successfully!", "success");

        // Notify the user if no locations are left
        if (this.locations.length === 0) {
            showNotification("No saved locations available.", "info");
        }
    
    }



    /**
    * Resets all saved locations by clearing localStorage and reloading the app.
    */
    reset() {
        localStorage.removeItem("locations"); // Clear all saved locations from localStorage
        this.locations = []; // Clear the locations array
        location.reload(); // Reload the page to reset the UI
        // Show an informational notification to the user
        showNotification("All locations cleared successfully!", "info");
    }

}


const app = new App();

