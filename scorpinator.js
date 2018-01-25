// ==UserScript==
// @name         Scorpinator
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        http://app.pestpac.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';
    /*jshint esnext: true */

    var activeSetups;

    class ActiveSetup {
        constructor(setupArray) {
            this.id = setupArray[0];
            this.address = setupArray[1];
            this.city = setupArray[2];
            this.state = setupArray[3];
            this.zipCode = setupArray[4];
            this.latitude = parseFloat(setupArray[5]);
            this.longitude = parseFloat(setupArray[6]);
            this.service = setupArray[7];
            this.week = setupArray[8];
            this.weekDay = setupArray[9];
            this.schedule = setupArray[10];
            this.tech = setupArray[11];
            this.total = setupArray[12];
        }
    }
    
    ActiveSetup.prototype.display = function(){
        return "ID: "+this.id+"\n"
            +this.address+"\n"
            +this.city+", "+this.state+" "+this.zipCode+"\n"
            +"Longitude: "+this.longitude+"\n"
            +"Latitude: "+this.latitude+"\n"
            +"Service: "+this.service+"\n"
            +"Week: "+this.week+"\n"
            +"Week Day: "+this.weekDay+"\n"
            +"Schedule: "+this.schedule+"\n"
            +"Tech: "+this.tech+"\n"
            +"Total: "+this.total+"\n";
    };
    /*
    ActiveSetup.prototype.getHypot = function(longitude, latitude){
        var _testW = Math.abs(longitude - this.longitude);
        var _testH = Math.abs(latitude - this.latitude);
        return Math.hypot(_testW, _testH).toFixed(6);
    };
    
    ActiveSetup.prototype.getDist = function(latitude,longitude) {
        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(latitude-this.latitude);  // deg2rad below
        var dLon = deg2rad(longitude-this.longitude); 
        var a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(this.latitude)) * Math.cos(deg2rad(latitude)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2)
            ; 
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        var d = R * c; // Distance in km
        return d;
        
        function deg2rad(deg) {
            return deg * (Math.PI/180)
        }
    }
    */
    ActiveSetup.prototype.getDist = function(longitude,latitude){
        var p = 0.017453292519943295;    // Math.PI / 180
        var c = Math.cos;
        var a = 0.5 - c((latitude-this.latitude) * p)/2 + 
              c(this.latitude * p) * c(latitude * p) * 
              (1 - c((longitude-this.longitude) * p))/2;

        return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
    }
    
    function distance(lat1, lon1, lat2, lon2) {
        var p = 0.017453292519943295;    // Math.PI / 180
        var c = Math.cos;
        var a = 0.5 - c((lat2 - lat1) * p)/2 + 
              c(lat1 * p) * c(lat2 * p) * 
              (1 - c((lon2 - lon1) * p))/2;
              
        return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
    }
        

    initializeScorpinator();

    function initializeScorpinator(){
        var navLogo = document.getElementsByClassName("left-nav-logo")[0];
        if(navLogo){
            navLogo.src = "http://cdn.mysitemyway.com/etc-mysitemyway/icons/legacy-previews/icons/red-white-pearls-icons-culture/032777-red-white-pearl-icon-culture-astrology2-scorpion.png";
            navLogo.height = 73;
            navLogo.width = 73;
            navLogo.style.marginTop = "-20px";
            navLogo.style.marginBottom = "-20px";
        }

        retrieveActiveSetups();
        autoGeocodinator();
        autoDepunctuationinator();
        manualProximinator();
    //    autoSetupTaskinator();

    }

    function getLocationAddress(){
        var addressTable = document.getElementById("location-address-block");
        if(!addressTable) return;
        var addressTableRows = addressTable.children[0].children;
        var address = "";
        for(var i = 0; i < addressTableRows.length; i++){
            if(!addressTableRows[i].children[0].children[0]){
                if(!addressTableRows[i].name){
                    if(address) address = address.concat(", ");

                    address = address.concat(addressTableRows[i].children[0].innerHTML);
                }
            }
        }
        return address;
    }

    function getLocationId(){
        return document.getElementById("locationHeaderDetailLink").children[0].innerHTML;
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

    function fetchGeocodes(address, callback){
        address = address.replaceAll(" ", "+");

        var requestString = "https://maps.googleapis.com/maps/api/geocode/json?address="+address+",+AZ&key=AIzaSyBi54ehlrrs28I7qEeU1jA6mJKB0If9KkI";

        httpGetAsync(requestString, function(data){
            var dataObj = JSON.parse(data);
            var geoCodes = {};
            geoCodes.longitude = dataObj.results[0].geometry.location.lng;
            geoCodes.latitude = dataObj.results[0].geometry.location.lat;

            callback(geoCodes);
        });

    }


    function retrieveActiveSetups(){
        httpGetAsync("https://rjhuffaker.github.io/residentialCoordinates.csv",
        function(response){
            activeSetups = TSVToArray(response);
        });
    }

    function TSVToArray(strData){

        var strDelimiter = "\t";

        var objPattern = new RegExp(
            (
                // Delimiters.
                "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

                // Quoted fields.
                "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

                // Standard fields.
                "([^\"\\" + strDelimiter + "\\r\\n]*))"
            ),
            "gi"
            );

        // Create an array to hold our data. Give the array
        // a default empty first row.
        var arrData = [[]];

        // Create an array to hold our individual pattern
        // matching groups.
        var arrMatches = null;

        // Keep looping over the regular expression matches
        // until we can no longer find a match.
        while (arrMatches = objPattern.exec( strData )){

            // Get the delimiter that was found.
            var strMatchedDelimiter = arrMatches[ 1 ];

            // Check to see if the given delimiter has a length
            // (is not the start of string) and if it matches
            // field delimiter. If id does not, then we know
            // that this delimiter is a row delimiter.
            if (
                strMatchedDelimiter.length &&
                strMatchedDelimiter !== strDelimiter
                ){

                // Since we have reached a new row of data,
                // add an empty row to our data array.
                arrData.push( [] );

            }

            var strMatchedValue;

            // Now that we have our delimiter out of the way,
            // let's check to see which kind of value we
            // captured (quoted or unquoted).
            if (arrMatches[ 2 ]){

                // We found a quoted value. When we capture
                // this value, unescape any double quotes.
                strMatchedValue = arrMatches[ 2 ].replace(
                    new RegExp( "\"\"", "g" ),
                    "\""
                    );

            } else {

                // We found a non-quoted value.
                strMatchedValue = arrMatches[ 3 ];
            }

            // Now that we have our value string, let's add
            // it to the data array.
            arrData[ arrData.length - 1 ].push( strMatchedValue );
        }

        // Return the parsed data.
        return( arrData );
    }

    function autoGeocodinator(){
        if(window.location.href.indexOf("location/edit.asp") > -1){

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
    }


    function autoDepunctuationinator(){
        var editButton = document.getElementById("butEdit");
        var saveButton = document.getElementById("butSave");
        var addressInput = document.getElementById("Address");
        var streetLabel, streetSearchLabel, streetSearchInput;

        if(window.location.href.indexOf("billto/edit.asp") > -1){
            if(addressInput.value.indexOf(".") > -1){
                streetLabel = addressInput.parentElement.previousElementSibling;
                addressInput.value = addressInput.value.replaceAll(".", "");
                streetLabel.style.color = "red";
                streetLabel.style.fontWeight = "bold";

                editButton.style.border = "2px solid red";
                saveButton.style.border = "2px solid red";
            }
        } else if(window.location.href.indexOf("location/edit.asp") > -1){
            streetSearchInput = document.getElementById("Street");

            if(addressInput.value.indexOf(".") > -1){

                streetLabel = addressInput.parentElement.previousElementSibling;
                addressInput.value = addressInput.value.replaceAll(".", "");
                streetLabel.style.color = "red";
                streetLabel.style.fontWeight = "bold";

                streetSearchLabel = streetSearchInput.parentElement.previousElementSibling;
                streetSearchInput.value = streetSearchInput.value.replaceAll(".", "");
                streetSearchLabel.style.color = "red";
                streetSearchLabel.style.fontWeight = "bold";

                saveButton.style.border = "2px solid red";

            }
        }
    }

    function manualProximinator(){
        var button = document.createElement("button");
        button.innerHTML = "Get Nearest Active Setup";
        button.style.display = "inline";

        var reviewHistoryDiv = document.getElementsByClassName("reviewHistory")[0];

        if(reviewHistoryDiv) reviewHistoryDiv.appendChild(button);

        button.addEventListener ("click", function(e) {
            fetchGeocodes(getLocationAddress(), function(data){
                getNearestActiveSetup(data, function(data){
                    var alertDisplay = "Scheduled Nearby: \n";
                    for(var i = 0; i < data.length; i++){
                        alertDisplay = alertDisplay.concat(data[i].schedule+" within "+data[i].hyp+"\n");
                    }
                    alert(alertDisplay);
                });
            });
        });
    }

    function getNearestActiveSetup(data, callback){
        var t = activeSetups.length;
        var lowest = 10000;
        var nearest = {};
        var fiveNearest = [];
        var _long = parseFloat(data.longitude);
        var _lat = parseFloat(data.latitude);
        for(var i = 1; i < t; i++){
            var setup = new ActiveSetup(activeSetups[i]);
            if(fiveNearest.length > 0){
                for(var ii = 0; ii < fiveNearest.length; ii++){
                    var nearSetup = fiveNearest[ii];
                    if(setup.getDist(_long, _lat) < nearSetup.getDist(_long, _lat)){
                        setup.hyp = setup.getDist(_long, _lat);
                        fiveNearest.splice(ii, 0, setup);
                        fiveNearest = fiveNearest.slice(0, 5);
                        break;
                    }
                }
            } else {
                fiveNearest.push(setup);
            }
        }
        
        console.log(fiveNearest);
        callback(fiveNearest);
    }

    function autoSetupTaskinator(){

        var button = document.createElement("button");
        button.innerHTML = "Task";
        button.style.display = "inline";

        var ordersTable = document.getElementById("OrdersTable");
        var ordersTableRows = null;
        if(ordersTable){
            ordersTableRows = ordersTable.children[0].children;

            for(var i = 0; i < ordersTableRows.length; i++){
                if(!ordersTableRows[i].classList.contains("noncollapsible")){
                    button.id = "setupTask"+i;
                    ordersTableRows[i].children[0].innerHTML = "";
                    ordersTableRows[i].children[0].appendChild(button);
                }
            }
        }

        button.addEventListener ("click", function(e) {
            e.stopPropagation();
            console.log("did something");
            var addTask = document.getElementById("addTask");
            var collapsedAddTask = document.getElementById("collapsedAddTask");
            var row = e.target.id.replace("setupTask","");
            /*
            if(addTask){
                addTask.click();
            } else {
                collapsedAddTask.click();
            }

            console.log(serviceOrders);
            */

            createSetupTask(row);

            getNearestActiveSetup();
        });

        function createSetupTask(row){
            var serviceOrder = retrieveServiceOrder(row);
            switch (serviceOrder.service){
                case "BED BUGS":
                    console.log("TODO: Create task for follow-up service 2-weeks out.");
                    break;
                case "FREE ESTIMATE":
                    console.log("TODO: Check to see if service was requested.");
                    break;
                case "FREE ESTIMATE C":
                    console.log("TODO: Do commercial estimate stuff.");
                    break;
                case "IN":
                    console.log("Create task for new service setup.");
                    break;
                case "RE-START":
                    console.log("TODO: Create task for new service setup.");
                    break;
                case "ROACH":
                    console.log("TODO: Create task for 2 additional follow-up services.");
                    break;
                case "TICK":
                    console.log("TODO: Create task for follow-up service 2-weeks out.");
                    break;
                default:
                    console.log("TODO: Don't know what to do with this.");

            }
        }

        function retrieveServiceOrder(row){
            var serviceOrder = {};

            if(!ordersTableRows[row].classList.contains("noncollapsible")){
                var orderColumns = ordersTableRows[row].children;

                serviceOrder.id = orderColumns[2].children[0].innerHTML.trim();
                serviceOrder.date = orderColumns[3].innerHTML.slice(14,22);
                serviceOrder.tech = orderColumns[8].children[0].innerHTML.trim().replace("&nbsp;","");
                serviceOrder.service = orderColumns[9].children[0].innerHTML.trim();

                serviceOrder.instructions = ordersTableRows[row].getAttribute("popuptext").replace(/<\/?[^>]+(>|$)/g, "").split("Location Instructions:&nbsp;").pop();
            }

            return serviceOrder;
        }
    }

})();