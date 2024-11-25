/**
 * Copyright 2024 https://github.com/mahboube89
 * Licensed under the MIT License;
*/

import { LocationManager } from "./locationManager.js";


class App {

    #map; // Private variable to store the Leaflet map instance
    #lastClickedLocation;  // Stores the last clicked map coordinates
    locations = []; // Array to store all saved locations


    constructor() {

        // Initialize LocationManager with necessary IDs and callback
        this.locationManager = new LocationManager("locationOptions", "confirmSelection", "cancelSelection", this._addNewLocation.bind(this));
    
        // Load the map based on user's geolocation
        this._getLocation();
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
                    this.#map.flyTo(coords, 13, {
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

        console.log(this.locations);
        
        
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

}


const app = new App();

