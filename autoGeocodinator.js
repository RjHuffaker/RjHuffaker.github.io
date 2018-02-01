// ==UserScript==
// @name         AutoGeocodinator
// @namespace    http://RjHuffaker.github.io
// @version      1.00
// @updateURL    http://RjHuffaker.github.io/autoGeocodinator.js
// @description  Corrects faulty geocoding
// @author       RjHuffaker
// @match        https://app.pestpac.com/location/edit.asp*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    /*jshint esnext: true */
    
    autoGeocodinator();
    
    function autoGeocodinator(){
		console.log("autoGeocodinating");
		var saveButton = document.getElementById("butSave");
		var addressInput = document.getElementById("Address");
		var mapMessage = document.getElementById("map_message");

		if(mapMessage.innerHTML === "Address not found; position is approximate"){

			var address = addressInput.value.replaceAll(" ", "+");
			var requestString = "https://maps.googleapis.com/maps/api/geocode/json?address="+address+",+AZ&key=AIzaSyBi54ehlrrs28I7qEeU1jA6mJKB0If9KkI";

			var longitudeInput = document.getElementById("Longitude");
			var latitudeInput = document.getElementById("Latitude");

			fetchGeocodes(address, function(data){
				document.getElementById("Longitude").value = parseFloat(data.longitude).toFixed(6);

				document.getElementById("Latitude").value = parseFloat(data.latitude).toFixed(6);

				document.getElementById("ExclBatchGeoCode").click();

				mapMessage.style.color = "red";

				mapMessage.innerHTML = "SCORPINATOR: GeoCode over-ridden.";

				saveButton.style.border = "2px solid red";

			});
		}
    }

    function fetchGeocodes(address, callback){
        address = address.replaceAll(", ", "+");
        address = address.replaceAll(" ", "+");

        var requestString = "https://maps.googleapis.com/maps/api/geocode/json?address="+address+"+AZ,+AZ&key=AIzaSyBi54ehlrrs28I7qEeU1jA6mJKB0If9KkI";

        httpGetAsync(requestString, function(data){
            var dataObj = JSON.parse(data);
            var geoCodes = {};
            geoCodes.longitude = dataObj.results[0].geometry.location.lng;
            geoCodes.latitude = dataObj.results[0].geometry.location.lat;

            callback(geoCodes);
        });
    }

    function httpGetAsync(theUrl, callback) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
                callback(xmlHttp.responseText);
        };
        xmlHttp.open("GET", theUrl, true); // true for asynchronous
        xmlHttp.send(null);
    }

})();