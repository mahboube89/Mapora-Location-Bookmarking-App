/**
 * Copyright 2024 https://github.com/mahboube89
 * Licensed under the MIT License;
*/

import { LocationManager } from "./locationManager.js";


class App {

    #map; // Private variable to store the Leaflet map instance
    #lastClickedLocation;  // Stores the last clicked map coordinates
    locations = []; // Array to store all saved locations
    filteredLocations = []; // Array for storing filtered locations based on tab selection
    savedMarkers = []; // Array to store saved markers

    constructor() {

        // Initialize LocationManager with necessary IDs and callback
        this.locationManager = new LocationManager("locationOptions", "confirmSelection", "cancelSelection", this._addNewLocation.bind(this));
    
        // Load the map based on user's geolocation
        this._getLocation();

        // Set up event listeners
        this._setEventListener();

        // Set the "all" tab as selected by default
        document.getElementById("all").checked = true;
    }

    _setEventListener() {

        // Add event listeners to each tab for filtering locations
        const tabs = document.querySelectorAll(".location-widget__tab-input");

        tabs.forEach(tab => {
            tab.addEventListener("change", (e) => {              
                const tabType = e.target.id; // e.g., "all", "want-to-go"
                this._renderLocation(tabType);               
            });
        });

        document.getElementById('locateMe').addEventListener('click', () => {
            this._locateUser();
        });

        document.getElementById('logo').addEventListener('click', () => {
            this._locateUser();
        });


    }


    async _getLocation() {  

        if(navigator.geolocation) {
            try {

                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject)
                });

                if (!position) {
                    throw new Error("Position is undefined.");
                }
                console.log(position);
                
                this._loadMap(position);
                
            } catch (error) {
                console.log("Could not get your Position.", error.message);
    
            }
        } else {
            console.log("Geolocation is not supported by this browser.");
        }
    }

    _loadMap(position) {
        
        const {latitude, longitude} = position.coords;

        const coords = [latitude, longitude];

        this.#map = L.map('map').setView(coords, 15);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(this.#map);

        // Another Map
        // L.tileLayer('https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png', {
        //     attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        //     maxZoom: 20
        // }).addTo(this.#map);

        // Add a marker and popup for the user's current location
        this._addCurrentLocationMarker(coords);


        // Set up map click event to show location options
        this.#map.on("click", this._showLocationOptions.bind(this));
    }

    _locateUser() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
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
                },
                () => {
                    alert('Could not retrieve your location. Please enable location services.');
                }
            );
        } else {
            alert('Geolocation is not supported by your browser.');
        }
    }


    _showLocationOptions(mapEvent) {
        // Store clicked map coordinates
        this.#lastClickedLocation = mapEvent.latlng;

        // Show the accordion to allow user selection
        this.locationManager.showOptions();
    }

    _addNewLocation(locationData) {
        
        if( !this.#lastClickedLocation) return; 
  
        const {lat, lng} = this.#lastClickedLocation;
        // Add location to the array
        
        // Combine location data with coordinates
        const location = {
            ...locationData,
            coords: [lat, lng]
        }

        // Add location to the array
        this.locations.push(location);

        // Add a marker on the map
        this._addLocationMarker(location, true);

        // Update the "All" tab to include the new location
        this._renderLocation("all");
        
        
    }

    _addCurrentLocationMarker (coords) {
        // Remove the existing current location marker if it exists
        if (this.currentLocationMarker) {
            this.#map.removeLayer(this.currentLocationMarker);
        }
    
        // Add a new marker for the current location
        this.currentLocationMarker = L.marker(coords)
            .addTo(this.#map)
            .bindPopup('You are here', { autoClose: false, closeOnClick: false })
            .openPopup(); // Automatically open the popup
    }


    _addLocationMarker(location, shouldOpenPopup = false) {

        const { type, created_at, coords } = location;
        const [lat, lng] = coords;
    
        const iconPath = `images/popup-${type.toLowerCase().replace(/\s+/g, '-')}.png`; // Path for the icon
        const icon = `<img src="${iconPath}" width="20" height="20">`;
    
        // Ensure map exists before adding a marker
        if (!this.#map) return;
    
        const marker = L.marker([lat, lng])
            .addTo(this.#map)
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false,
                    closeOnClick: false,
                    className: `popup-${type.toLowerCase().replace(/\s+/g, '-')}`,
                }).setContent(
                    `<div>${icon}</div><div>${type}<br><small>${created_at}</small></div>`
                )
            );
    
        // Open popup if specified
        if (shouldOpenPopup) {
            marker.openPopup();
        }
    }

    _renderLocation(tabType) {

        const contentInner = document.querySelector(".location-widget__content-inner");
        contentInner.innerHTML = ""; // Clear previous content

        const wrapper = document.createElement("div");
        wrapper.classList.add("wrapper");

        // Filter locations based on selected tab
        this.filteredLocations = tabType === "all"
        ? this.locations 
        : this.locations.filter(location => location.type.toLowerCase() === tabType)

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
                            <button class="location-actions__delete-btn"><i class="fa-regular fa-trash-can"></i></button>
                        </div>
                    </div>
                </div>
            `;
            wrapper.insertAdjacentHTML("beforeend", locationHTML);
        });
      
        // Append filtered locations
        if (this.filteredLocations.length > 0) {
            contentInner.appendChild(wrapper);
        }
        
        // Add event listener to each location element
        const locationElements = wrapper.querySelectorAll(".location-tab");
        locationElements.forEach(locationElement => {
            locationElement.addEventListener( "click", (e) => this._moveToLocation(e));
        });

    }

    _moveToLocation(event){
        const locationId = event.currentTarget.dataset.id;

        const location = this.locations.find( (loc) => loc.id === locationId);

        if (location && location.coords) {
            const [lat, lng] = location.coords;

            this.#map.flyTo([lat, lng], 15, {
                animate:true,
                duration: 1, // Duration in seconds
                easeLinearity: 0.2 // Adjust for smoother transitions                  
            });

            // Re-add the marker and open its popup
            //this._addLocationMarker(location, true); // Pass `true` to open the popup

            // Ensure the marker exists and open its popup
            const markerIndex = this.savedMarkers.findIndex(item => item.id === locationId);
            if (markerIndex !== -1) {
                this.savedMarkers[markerIndex].marker.openPopup();
            } else {
                // If marker doesn't exist (unlikely but safe), add it
                this._addLocationMarker(location, true);
            }

        }
    }

}


const app = new App();

