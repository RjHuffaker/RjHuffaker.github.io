// ==UserScript==
// @name         Scorpinator
// @namespace    http://RjHuffaker.github.io
// @version      1.009
// @updateURL    http://RjHuffaker.github.io/scorpinator.js
// @description  Provides various helper functions to PestPac, customized to our particular use-case.
// @author       You
// @match        https://app.pestpac.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';
    /*jshint esnext: true */

    var activeSetups, scorpModal, scorpHeader, scorpContent, scorpIcon;

    class ActiveSetup {
        constructor(setupArray) {
            this.id = setupArray[0];
            this.address = setupArray[1];
            this.city = setupArray[2];
            this.state = setupArray[3];
            this.zipCode = setupArray[4];
            this.latitude = parseFloat(setupArray[5]);
            this.longitude = parseFloat(setupArray[6]);
			this.division = setupArray[7];
            this.service = setupArray[8];
            this.week = setupArray[9];
            this.weekDay = setupArray[10];
            this.schedule = setupArray[11];
            this.tech = setupArray[12];
            this.total = setupArray[13];
        }
    }

    ActiveSetup.prototype.getDist = function(longitude,latitude){
        var p = 0.017453292519943295;    // Math.PI / 180
        var c = Math.cos;
        var a = 0.5 - c((latitude-this.latitude) * p)/2 +
              c(this.latitude * p) * c(latitude * p) *
              (1 - c((longitude-this.longitude) * p))/2;

        return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
    };

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
        console.log("howdy");
        retrieveActiveSetups();
    }


    function getLocationAddress(){
        var address = "";
        var addressTable = document.getElementById("location-address-block");
        if(addressTable){
            var addressTableRows = addressTable.children[0].children;
            for(var i = 0; i < addressTableRows.length; i++){
                if(!addressTableRows[i].getAttribute("name")){
                    if(!addressTableRows[i].children[0].children[0]){
                        if(address) address = address.concat(", ");
                        address = address.concat(addressTableRows[i].children[0].innerHTML);
                    }
                }
            }
        } else {
            address = document.getElementById("Address").value+" "+
                document.getElementById("City").value+" "+
                document.getElementById("Zip").value;

        }

        return address;
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


    function retrieveActiveSetups(){
        httpGetAsync("https://rjhuffaker.github.io/residential.csv",
        function(response){
            activeSetups = TSVToArray(response);
            scorpinatorPopup();
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


    function scorpinatorPopup(){
        if((window.location.href.indexOf("LocationID") > -1)||(window.location.href.indexOf("SetupID") > -1)||(window.location.href.indexOf("OrderID") > -1)){

            scorpContent = document.createElement("div");
            scorpContent.style.margin = "10px";

            scorpHeader = document.createElement("div");
            scorpHeader.style.height = "115px";
            scorpHeader.style.backgroundColor = "rgb(153, 10, 32)";

            scorpHeader.style.textAlign = "center";
            scorpHeader.innerHTML = "<span style='font-family: Verdana; color: white; font-size:300%;'><br>Scorpinator</span>";

            scorpIcon = document.createElement("img");
            scorpIcon.src = "https://rjhuffaker.github.io/scorpIcon.png";
            scorpIcon.style.height = "40px";
            scorpIcon.style.width = "40px";
            scorpIcon.style.position = "fixed";
            scorpIcon.style.right = "60px";
            scorpIcon.style.bottom = "0";
            scorpIcon.style.marginBottom = "10px";
            scorpIcon.style.cursor = "pointer";
            scorpIcon.style.opacity = "0.6";

            scorpModal = document.createElement("div");
            scorpModal.className += "scorp-modal";
            scorpModal.style.height = "600px";
            scorpModal.style.width = "400px";
            scorpModal.style.position = "fixed";
            scorpModal.style.bottom = "52px";
            scorpModal.style.right = "-10px";
            scorpModal.style.visibility = "hidden";

            var scorpContainer = document.createElement("div");
            scorpContainer.style.height = "568px";
            scorpContainer.style.width = "368px";
            scorpContainer.style.position = "relative";
            scorpContainer.style.top = "15px";
            scorpContainer.style.left = "15px";
            scorpContainer.style.border = "1px solid #bbb";
            scorpContainer.style.backgroundColor = "white";
            scorpContainer.style.boxShadow = "0px 0px 20px #888";

            var caretDiv = document.createElement("div");
            caretDiv.style.width = "0";
            caretDiv.style.height = "0";
            caretDiv.style.position = "absolute";
            caretDiv.style.left = "295px";
            caretDiv.style.top = "584px";
            caretDiv.style.borderTop = "15px solid white";
            caretDiv.style.borderRight = "15px solid transparent";
            caretDiv.style.borderLeft = "15px solid transparent";

            var caretDivBorder = document.createElement("div");
            caretDivBorder.style.width = "0";
            caretDivBorder.style.height = "0";
            caretDivBorder.style.position = "absolute";
            caretDivBorder.style.left = "295px";
            caretDivBorder.style.top = "585px";
            caretDivBorder.style.borderTop = "15px solid #bbb";
            caretDivBorder.style.borderRight = "15px solid transparent";
            caretDivBorder.style.borderLeft = "15px solid transparent";

            var bodyElement = document.getElementsByTagName('body')[0];

            bodyElement.appendChild(scorpIcon);
            bodyElement.appendChild(scorpModal);

            scorpModal.appendChild(scorpContainer);
            scorpModal.appendChild(caretDivBorder);
            scorpModal.appendChild(caretDiv);

            scorpContainer.appendChild(scorpHeader);
            scorpContainer.appendChild(scorpContent);

            scorpIcon.addEventListener( 'mouseover', function() {
                scorpIcon.style.opacity = "1.0";
            });
            scorpIcon.addEventListener( 'mouseout', function() {
                scorpIcon.style.opacity = "0.6";
            });

            scorpIcon.addEventListener("click", function(e) {
                if(scorpModal.style.visibility === "hidden"){
                    scorpModal.style.visibility = "visible";
                } else {
                    scorpModal.style.visibility = "hidden";
                }

                fetchGeocodes(getLocationAddress(), function(data){
                    getNearestActiveSetup(data, function(data){
                        scorpContent.innerHTML = formatSetupData(data);
                    });
                });
            });

        }

        function getNearestActiveSetup(data, callback){
            var t = activeSetups.length;
            var lowest = 10000;
            var nearest = {};
            var nearestList = [];
            var _long = parseFloat(data.longitude);
            var _lat = parseFloat(data.latitude);
            for(var i = 1; i < t; i++){
                var setup = new ActiveSetup(activeSetups[i]);
                if(nearestList.length > 0){
                    for(var ii = 0; ii < nearestList.length; ii++){
                        var nearSetup = nearestList[ii];
                        if(setup.getDist(_long, _lat) < nearSetup.getDist(_long, _lat)){
                            setup.hyp = setup.getDist(_long, _lat).toFixed(3);
                            nearestList.splice(ii, 0, setup);
                            nearestList = nearestList.slice(0, 10);
                            break;
                        }
                    }
                } else {
                    nearestList.push(setup);
                }
            }

            callback(nearestList);
        }

        function formatSetupData(data){
            var displayData = '<h2>Scheduled Nearby:</h2>'+
                '<style>'+
                'div.scorp-modal table { width: 100% }'+
                '</style>'+
                '<table border="1">'+
                '<tbody>'+
                '<tr>'+
                '<th>Zip Code</th>'+
                '<th>Technician</th>'+
                '<th>Division</th>'+
                '<th>Schedule</th>'+
                '<th>Distance</th>'+
                '</tr>';

            for(var i = 0; i < data.length; i++){
                if(data[i].hyp > 1){
                    displayData = displayData.concat(
                        '<tr><td>'+data[i].zipCode.substring(0,5)+'</td><td>'+data[i].tech+'</td><td>'+data[i].division+'</td><td>'+data[i].schedule+'</td><td>'+data[i].hyp+' KM</td></tr>'
                    );
                } else {
                    displayData = displayData.concat(
                        '<tr><td>'+data[i].zipCode.substring(0,5)+'</td><td>'+data[i].tech+'</td><td>'+data[i].division+'</td><td>'+data[i].schedule+'</td><td>'+data[i].hyp*1000+' M</td></tr>'
                    );
                }
            }
            displayData = displayData.concat('</tbody></table>');
            return displayData;
        }

    }

})();