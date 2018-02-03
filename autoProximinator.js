// ==UserScript==
// @name         AutoProximinator
// @namespace    http://RjHuffaker.github.io
// @version      1.009
// @updateURL    http://RjHuffaker.github.io/autoProximinator.js
// @description  Provides various helper functions to PestPac, customized to our particular use-case.
// @author       You
// @match        https://app.pestpac.com/location/detail.asp*
// @match        https://app.pestpac.com/location/edit.asp*
// @match        https://app.pestpac.com/location/add.asp
// @match        https://app.pestpac.com/serviceSetup*
// @match        https://app.pestpac.com/serviceOrder*
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

    class technician {
        constructor(name){
            this.name = name;
            this.schedule = {
                "1MON": 0, "1TUE": 0, "1WED": 0, "1THU": 0, "1FRI": 0,
                "2MON": 0, "2TUE": 0, "2WED": 0, "2THU": 0, "2FRI": 0,
                "3MON": 0, "3TUE": 0, "3WED": 0, "3THU": 0, "3FRI": 0,
                "4MON": 0, "4TUE": 0, "4WED": 0, "4THU": 0, "4FRI": 0
            };
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
        httpGetAsync("https://rjhuffaker.github.io/residential.csv",
        function(response){
            activeSetups = tsvToObjectArray(response);
            scorpinatorPopup();
        });

        var link = window.document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = 'https://RjHuffaker.github.io/scorpinator.css';
        document.getElementsByTagName("HEAD")[0].appendChild(link);

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

    function tsvToObjectArray(tsv){
        var lines=tsv.split("\n");
        var result = [];

        for(var i=1;i<lines.length;i++){
            var currentline=lines[i].split("\t");

            result.push(new ActiveSetup(currentline));
        }
        return result;
    }

    function scorpinatorPopup(){
        scorpIcon = document.createElement("img");
        scorpIcon.src = "https://rjhuffaker.github.io/scorpIcon.png";
        scorpIcon.id = "scorp-icon";

        scorpContent = document.createElement("div");
        scorpContent.id = "scorp-content";

        scorpHeader = document.createElement("div");
        scorpHeader.id = "scorp-header";
        scorpHeader.innerHTML = "<span><br>Scorpinator</span>";

        scorpModal = document.createElement("div");
        scorpModal.id = "scorp-modal";

        var scorpContainer = document.createElement("div");
        scorpContainer.id = "scorp-container";

        var caretDiv = document.createElement("div");
        caretDiv.id = "caret-div";

        var caretDivBorder = document.createElement("div");
        caretDivBorder.id = "caret-div-border";

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

        scorpModal.style.visibility = "hidden";

        scorpIcon.addEventListener("click", function(e) {
            if(scorpModal.style.visibility === "hidden"){
                scorpModal.style.visibility = "visible";
            } else {
                scorpModal.style.visibility = "hidden";
            }

            fetchGeocodes(getLocationAddress(), function(data){
                getNearestActiveSetup(data, function(data){
                    scorpContent.innerHTML = "";
                    formatScorpContent(data);
                });
            });
        });

    }

    function getNearestActiveSetup(data, callback){
        var al = activeSetups.length;
        var lowest = 10000;
        var nearest = {};
        var nearestList = [];
        var _long = parseFloat(data.longitude);
        var _lat = parseFloat(data.latitude);

        var techList = [];

        for(var i = 1; i < al; i++){
            var setup = activeSetups[i];

            var addTech = true;
            for(var ii = 0; ii < techList.length; ii++){
                var _tech = techList[ii];
                if(activeSetups[i].tech && activeSetups[i].tech === _tech.name){
                    addTech = false;
                    var multiplier;
                    if(activeSetups[i].schedule[4] === "M"){
                        multiplier = 1;
                    } else if(activeSetups[i].schedule[4] === "B"){
                        multiplier = 0.5;
                    } else if(activeSetups[i].schedule[4] === "q"){
                        multiplier = 0.33;
                    }

                    _tech.schedule[activeSetups[i].schedule.substring(0,4)] += Math.round(parseInt(activeSetups[i].total) * multiplier);
                }
            }

            if(addTech) techList.push(new technician(activeSetups[i].tech));

            if(nearestList.length > 0){
                for(var ij = 0; ij < nearestList.length; ij++){
                    var nearSetup = nearestList[ij];
                    if(setup.getDist(_long, _lat) < nearSetup.getDist(_long, _lat)){
                        setup.hyp = setup.getDist(_long, _lat).toFixed(3);
                        nearestList.splice(ij, 0, setup);
                        nearestList = nearestList.slice(0, 20);
                        break;
                    }
                }
            } else {
                nearestList.push(setup);
            }
        }
        /*
        for(var k = 0; k < nearestList.length; k++){
            for(var l = 0; l < al; l++){
                console.log(activeSetups[l].schedule);
                if(activeSetups[l].schedule.substring(0,3) === nearestList[k].schedule.substring(0,3) && activeSetups[l].tech === nearestList[k].tech){
                    nearestList[k].heat++;
                }
            }
        }
        */

        for(var j = 0; j < nearestList.length; j++){
            for(var ji = 0; ji < techList.length; ji++){
                if(techList[ji].name === nearestList[j].tech){
                    nearestList[j].heat = techList[ji].schedule[nearestList[j].schedule.substring(0,4)];
                }
            }
        }

        callback(nearestList);
    }

    function formatScorpContent(data){

        var _table = document.createElement("table");
        _table.border = 1;

        var _header = _table.insertRow();
        _header.insertCell().innerHTML = "Zip Code";
        _header.insertCell().innerHTML = "Schedule";
        _header.insertCell().innerHTML = "Tech/Division";
        _header.insertCell().innerHTML = "Distance";

        _header.style.fontWeight = "bold";

        for(var i = 0; i < data.length; i++){
            var _tr = _table.insertRow();
            _tr.insertCell().innerHTML = data[i].zipCode.substring(0,5);
            _tr.insertCell().innerHTML = data[i].schedule;
            _tr.insertCell().innerHTML = data[i].tech+"/"+data[i].division;
            _tr.insertCell().innerHTML = data[i].hyp+" km";


            if(data[i].heat < 450){
                _tr.style.textShadow = "1px 1px 0 rgb(0,0,255)";
            } else if(data[i].heat < 500){
                _tr.style.textShadow = "1px 1px 0 rgb(0,63,255)";
            } else if(data[i].heat < 550){
                _tr.style.textShadow = "1px 1px 0 rgb(0,127,255)";
            } else if(data[i].heat < 600){
                _tr.style.textShadow = "1px 1px 0 rgb(0,191,255)";
            } else if(data[i].heat < 650){
                _tr.style.textShadow = "1px 1px 0 rgb(0,255,255)";
            } else if(data[i].heat < 700){
                _tr.style.textShadow = "1px 1px 0 rgb(0,255,191)";
            } else if(data[i].heat < 750){
                _tr.style.textShadow = "1px 1px 0 rgb(0,255,127)";
            } else if(data[i].heat < 800){
                _tr.style.textShadow = "1px 1px 0 rgb(0,255,63)";
            } else if(data[i].heat < 850){
                _tr.style.textShadow = "1px 1px 0 rgb(0,255,0)";
            } else if(data[i].heat < 850){
                _tr.style.textShadow = "1px 1px 0 rgb(63,255,0)";
            } else if(data[i].heat < 900){
                _tr.style.textShadow = "1px 1px 0 rgb(127,255,0)";
            } else if(data[i].heat < 950){
                _tr.style.textShadow = "1px 1px 0 rgb(191,255,0)";
            } else if(data[i].heat < 1000){
                _tr.style.textShadow = "1px 1px 0 rgb(255,255,0)";
            } else if(data[i].heat < 1050){
                _tr.style.textShadow = "1px 1px 0 rgb(255,191,0)";
            } else if(data[i].heat < 1100){
                _tr.style.textShadow = "1px 1px 0 rgb(255,127,0)";
            } else if(data[i].heat < 1150){
                _tr.style.textShadow = "1px 1px 0 rgb(255,63,0)";
            } else if(data[i].heat < 1200) {
                _tr.style.textShadow = "1px 1px 0 rgb(255,0,0)";
            } else if(data[i].heat < 1250){
                _tr.style.textShadow = "1px 1px 0 rgb(255,0,63)";
            } else if(data[i].heat < 1300){
                _tr.style.textShadow = "1px 1px 0 rgb(255,0,127)";
            } else if(data[i].heat < 1350){
                _tr.style.textShadow = "1px 1px 0 rgb(255,0,191)";
            } else {
                _tr.style.textShadow = "1px 1px 0 rgb(255,0,255)";
            }
        }

        scorpContent.appendChild(_table);
    }

})();