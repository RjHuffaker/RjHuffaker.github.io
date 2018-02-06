// ==UserScript==
// @name         Scorpinator
// @namespace    http://RjHuffaker.github.io
// @version      1.015
// @updateURL    http://RjHuffaker.github.io/scorpinator.js
// @description  Provides various helper functions to PestPac, customized to our particular use-case.
// @author       You
// @match        https://app.pestpac.com/*
// @grant        window.open
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
            this.dailyTotals = {
                "1MON": 0, "1TUE": 0, "1WED": 0, "1THU": 0, "1FRI": 0,
                "2MON": 0, "2TUE": 0, "2WED": 0, "2THU": 0, "2FRI": 0,
                "3MON": 0, "3TUE": 0, "3WED": 0, "3THU": 0, "3FRI": 0,
                "4MON": 0, "4TUE": 0, "4WED": 0, "4THU": 0, "4FRI": 0
            };
            this.dailyStops = {
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
        // Load custom CSS
        var link = window.document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = 'https://RjHuffaker.github.io/scorpinator.css';
        document.getElementsByTagName("HEAD")[0].appendChild(link);

        // Retrieve Active Service Setups
        httpGetAsync("https://rjhuffaker.github.io/residential.csv",
        function(response){
            activeSetups = tsvToObjectArray(response);

            autoProximinator();
        });

        if(urlContains([])) ;

        contactinator();

    }

    function urlContains(list){
        var yesItDoes = false;
        for(var i = 0; i < list.length; i++){
            if(window.location.href.contains(list[i]) > -1) {
                yesItDoes = true;
            }
        }
        return yesItDoes;
    }

    function contactinator(){
        if(!document.getElementById("location-phone-link")) return;
        var contactLinks = document.getElementsByClassName("contact-link-span");
        var urlString = window.location.search.replace("?", "");
        for(var i = 0; i < contactLinks.length; i++){
            if(contactLinks[i].hasAttribute("onclick")){
                contactLinks[i].onclick = null;
                contactLinks[i].style.cursor = "inherit";
            } else if(contactLinks[i].children[1]){
                contactLinks[i].children[1].href = "https://app.pestpac.com/letters/detailEmail.asp?Mode=New&"+urlString;
            }
        }
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

    function autoProximinator(){
        scorpIcon = document.createElement("img");
        scorpIcon.src = "https://rjhuffaker.github.io/scorpIcon.png";
        scorpIcon.id = "scorp-icon";

        scorpContent = document.createElement("div");
        scorpContent.id = "scorp-content";

        scorpHeader = document.createElement("div");
        scorpHeader.id = "scorp-header";

        var scorpExit = document.createElement("span");
        scorpExit.id = "scorp-exit";
        scorpExit.innerHTML = "&#10006;";

        var scorpHeaderImage = document.createElement("img");
        scorpHeaderImage.id = "scorp-header-image";
        scorpHeaderImage.src = "https://rjhuffaker.github.io/ScorpImage.png";

        scorpHeaderImage.style.display = "inline-block";

        var scorpTitle = document.createElement("span");
        scorpTitle.id = "scorp-title";
        scorpTitle.innerHTML = "Scorpinator";

        scorpHeader.appendChild(scorpHeaderImage);
        scorpHeader.appendChild(scorpTitle);
        scorpHeader.appendChild(scorpExit);

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

        scorpExit.addEventListener("click", function(e) {
            scorpModal.style.visibility = "hidden";
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
                        multiplier = 0.25;
                    }

                    _tech.dailyTotals[activeSetups[i].schedule.substring(0,4)] += Math.round(parseInt(activeSetups[i].total) * multiplier);
                    _tech.dailyStops[activeSetups[i].schedule.substring(0,4)] += 1;
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

        for(var j = 0; j < nearestList.length; j++){
            for(var ji = 0; ji < techList.length; ji++){
                if(techList[ji].name === nearestList[j].tech){
                    nearestList[j].dailyTotal = techList[ji].dailyTotals[nearestList[j].schedule.substring(0,4)];
                    nearestList[j].dailyStops = techList[ji].dailyStops[nearestList[j].schedule.substring(0,4)];
                }
            }
        }

        console.log(techList);

        callback(nearestList);
    }

    function formatScorpContent(data){

        var colorScale = [
            {amount: 450, color: "rgb(0,0,255)"},
            {amount: 500, color: "rgb(0,63,255)"},
            {amount: 550, color: "rgb(0,127,255)"},
            {amount: 600, color: "rgb(0,191,255)"},
            {amount: 650, color: "rgb(0,255,255)"},
            {amount: 700, color: "rgb(0,255,191)"},
            {amount: 750, color: "rgb(0,255,127)"},
            {amount: 800, color: "rgb(0,255,63)"},
            {amount: 850, color: "rgb(0,255,0)"},
            {amount: 900, color: "rgb(63,255,0)"},
            {amount: 950, color: "rgb(127,255,0)"},
            {amount: 1000, color: "rgb(191,255,0)"},
            {amount: 1050, color: "rgb(255,255,0)"},
            {amount: 1100, color: "rgb(255,191,0)"},
            {amount: 1150, color: "rgb(255,127,0)"},
            {amount: 1200, color: "rgb(255,63,0)"},
            {amount: 1250, color: "rgb(255,0,0)"},
            {amount: 1300, color: "rgb(255,0,63)"},
            {amount: 1350, color: "rgb(255,0,127)"},
            {amount: 1400, color: "rgb(255,0,191)"},
            {amount: 1450, color: "rgb(255,0,255)"}
        ];

        var _table = document.createElement("table");
        _table.border = 1;

        var _header = _table.insertRow();
        _header.insertCell().innerHTML = "Zip Code";
        _header.insertCell().innerHTML = "Schedule";
        _header.insertCell().innerHTML = "Tech/Division";
        _header.insertCell().innerHTML = "Distance *";
        _header.insertCell().innerHTML = "Stops";

        _header.style.fontWeight = "bold";

        for(var i = 0; i < data.length; i++){
            var _tr = _table.insertRow();
            _tr.insertCell().innerHTML = data[i].zipCode.substring(0,5);
            _tr.insertCell().innerHTML = data[i].schedule;
            _tr.insertCell().innerHTML = data[i].tech+"/"+data[i].division;
            _tr.insertCell().innerHTML = data[i].hyp+" km";
            _tr.insertCell().innerHTML = data[i].dailyStops;

            for(var ii = 0; ii < colorScale.length; ii++){
                if(data[i].dailyTotal < colorScale[ii].amount){
                    _tr.style.textShadow = "1px 1px 0 "+colorScale[ii].color;
                    break;
                }
                _tr.style.textShadow = "1px 1px 0 rgb(255,0,255)";
            }


        }

        scorpContent.appendChild(_table);

        var scorpLegend = document.createElement("div");

        var legendHeader = document.createElement("h3");

        legendHeader.innerHTML = "Average Daily Total:";

        scorpLegend.appendChild(legendHeader);

        for(var j = 0; j < colorScale.length; j++){
            var _div = document.createElement("div");
            _div.innerHTML = "$"+colorScale[j].amount;
            _div.style.textShadow = "1px 1px 0 "+colorScale[j].color;
            _div.style.transform = "rotate(300deg)";
            _div.style.display = "inline-block";
            _div.style.marginTop = "4px";
            _div.style.width = "21px";
            scorpLegend.appendChild(_div);
        }

        var fineText = document.createElement("h4");

        fineText.innerHTML = "*As the crow flies, not as the technician drives.";

        scorpLegend.appendChild(fineText);

        scorpContent.appendChild(scorpLegend);
    }

})();