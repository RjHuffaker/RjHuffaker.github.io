// ==UserScript==
// @name         Scorpinator
// @namespace    http://RjHuffaker.github.io
// @version      1.017
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

    var addSetupTask = false;

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

    initializeScorpinator();

    function initializeScorpinator(){
        retrieveCSS();
        retrieveActiveSetups();
        autoContactinator();
        autoTaskinator();
        autoFollowUpinator();
        autoGeocodinator();
        autoDepunctuationator();

        function retrieveCSS(){
            var link = window.document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = 'https://RjHuffaker.github.io/scorpinator.css';
            document.getElementsByTagName("HEAD")[0].appendChild(link);
        }

        function retrieveActiveSetups(){
            httpGetAsync("https://rjhuffaker.github.io/residential.csv",
                         function(response){
                activeSetups = tsvToObjectArray(response);

                autoProximinator();
            });

            function tsvToObjectArray(tsv){
                var lines = tsv.split("\n");
                var result = [];

                for(var i = 1; i < lines.length;i++){
                    var currentline = lines[i].split("\t");

                    result.push(new ActiveSetup(currentline));
                }
                return result;
            }
        }

    }

    function urlContains(list){
        var yesItDoes = false;
        for(var i = 0; i < list.length; i++){
            if(window.location.href.indexOf(list[i]) > -1) {
                yesItDoes = true;
            }
        }
        return yesItDoes;
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
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

    function getFutureDate(startDate, daysOut){
        var newDate = new Date(startDate);
        newDate.setDate(newDate.getDate() + daysOut);
        var dd = newDate.getDate();
        var mm = newDate.getMonth()+1;
        var yy = newDate.getFullYear().toString().substring(2,4);
        return mm+"/"+dd+"/"+yy;
    }

    function getNextServiceDate(startDate, schedule, frequency){
        var daysOut,
        day = schedule.substring(1,4),
        week = parseInt(schedule.substring(0,1));
        var newDate = new Date(startDate);
        if(day=="Sun") day = 0;
        if(day=="Mon") day = 1;
        if(day=="Tue") day = 2;
        if(day=="Wed") day = 3;
        if(day=="Thu") day = 4;
        if(day=="Fri") day = 5;
        if(day=="Sat") day = 6;

        if(frequency=="M") daysOut = 20;
        if(frequency=="B") daysOut = 31;
        if(frequency=="Q") daysOut = 56;

        newDate.setDate(newDate.getDate() + daysOut);

        console.log(startDate, schedule, frequency);

        for(var i = 0; i < 31; i++){
            newDate.setDate(newDate.getDate() + 1);

            if(newDate.getDay() == day && newDate.getDate() > (week-1)*7  && newDate.getDate() < (week)*7 ){
                var dd = newDate.getDate();
                var mm = newDate.getMonth()+1;
                var yy = newDate.getFullYear().toString().substring(2,4);
                return mm+"/"+dd+"/"+yy;
            }
        }

        return "???";
    }

    function getServiceOrder(row){
        var serviceOrder = {};

        var ordersTable = document.getElementById("OrdersTable");
        var ordersTableRows = null;
        if(ordersTable){
            ordersTableRows = ordersTable.children[0].children;

            if(!ordersTableRows[row].classList.contains("noncollapsible")){
                var orderColumns = ordersTableRows[row].children;

                serviceOrder.id = orderColumns[3].children[0].innerHTML.trim();
                serviceOrder.date = orderColumns[4].innerHTML.slice(14,22);
                serviceOrder.tech = orderColumns[9].children[0].innerHTML.trim().replace("&nbsp;","");
                serviceOrder.service = orderColumns[10].children[0].innerHTML.trim();
                if(ordersTableRows[row].getAttribute("popuptext")){
                    serviceOrder.instructions = ordersTableRows[row].getAttribute("popuptext").replace(/<\/?[^>]+(>|$)/g, "").split("Location Instructions:&nbsp;").pop();
                }

            }

            return serviceOrder;
        }
    }

    function autoProximinator(){
        if(!urlContains(["LocationID","location/add.asp"])) return;
        if(urlContains(["iframe","letters","dialog"])) return;

        console.log("autoProximinating");

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
                fetchGeocodes(getLocationAddress(), function(data){
                    getNearestActiveSetup(data, function(data){
                        formatScorpContent(data);
                    });
                });
            } else {
                addSetupTask = false;
                scorpModal.style.visibility = "hidden";
            }
        });

        scorpExit.addEventListener("click", function(e) {
            scorpModal.style.visibility = "hidden";
        });

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

                if(nearestList.length < 20){
                    setup.hyp = setup.getDist(_long, _lat).toFixed(3);
                    nearestList.push(setup);
                } else {
                    for(var ij = 0; ij < nearestList.length; ij++){
                        var nearSetup = nearestList[ij];
                        if(setup.getDist(_long, _lat) < nearSetup.getDist(_long, _lat)){
                            setup.hyp = setup.getDist(_long, _lat).toFixed(3);
                            nearestList.splice(ij, 0, setup);
                            nearestList = nearestList.slice(0, 20);
                            break;
                        }
                    }
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

            console.log(nearestList);

            callback(nearestList);
        }

        function formatScorpContent(data){
            scorpContent.innerHTML = "";

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
         //   if(addSetupTask) _header.insertCell().innerHTML = "";
            _header.insertCell().innerHTML = "Zip Code";
            _header.insertCell().innerHTML = "Schedule";
            _header.insertCell().innerHTML = "Tech/Division";
            _header.insertCell().innerHTML = "Distance *";
            _header.insertCell().innerHTML = "Stops";

            _header.style.fontWeight = "bold";

            for(var i = 0; i < data.length; i++){
                var _tr = _table.insertRow();

                if(addSetupTask){

                    _tr.className += "add-setup-task";
                    _tr.dataSetup = data[i];
                    _tr.addEventListener("click", function(e) {
                        addSetupTaskDetails(this.dataSetup);
                        addSetupTask = false;
                        scorpModal.style.visibility = "hidden";
                    });

                }

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
                _div.style.marginTop = "12px";
                _div.style.marginBottom = "16px";
                _div.style.width = "21px";
                scorpLegend.appendChild(_div);
            }

            var fineText = document.createElement("div");

            fineText.innerHTML = "*As the crow flies, not as the technician drives.";

            fineText.style.textAlign = "right";

            scorpLegend.appendChild(fineText);

            scorpContent.appendChild(scorpLegend);

            function addSetupTaskDetails(activeSetup){
                var taskNameInput = document.getElementById("subject");
                var dueDateInput = document.getElementById("dueDate");
                var selectTaskFor = document.getElementById("selectTaskFor");

                var _frequency = taskNameInput.value.slice(-1);
                var _startDate = dueDateInput.value;
                var _schedule = activeSetup.schedule.substring(0,1) + capitalizeFirstLetter(activeSetup.schedule.substring(1,4));
                var _tech = capitalizeFirstLetter(activeSetup.tech.split(" ")[0]);
                var _nextDate = getNextServiceDate(_startDate, _schedule, _frequency);
                taskNameInput.value = taskNameInput.value.concat(" "+_schedule+" "+_tech+" "+_nextDate);

                selectTaskFor.click();

            }

        }

    }

    function autoContactinator(){
        if(!urlContains(["location/detail.asp"])) return;
        console.log("autoContactinating");

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

    function autoTaskinator(){
        if(!urlContains(["location/detail.asp"])) return;
        if(urlContains(["iframe"])) return;

        console.log("autoTaskinating");

        var ordersTable = document.getElementById("OrdersTable");
        var ordersTableRows = null;
        if(ordersTable){
            ordersTableRows = ordersTable.children[0].children;

            for(var i = 0; i < ordersTableRows.length; i++){
                var container = document.createElement("td");
                container.style.width = "32px";
                container.style.textAlign = "center";

                ordersTableRows[i].insertBefore(container, ordersTableRows[i].firstChild);

                if(!ordersTableRows[i].classList.contains("noncollapsible")){
                    var taskButton = document.createElement("a");
                    taskButton.innerHTML = "Create Task";
                    taskButton.id = "taskButton"+i;
                    taskButton.className += "primary-link";

                    container.appendChild(taskButton);

                    taskButton.addEventListener("click", function(e) {
                        e.stopPropagation();
                        var addTask = document.getElementById("addTask");
                        var collapsedAddTask = document.getElementById("collapsedAddTask");
                        var row = e.target.id.replace("taskButton","");

                        if(addTask){
                            addTask.click();
                        } else {
                            collapsedAddTask.click();
                        }

                        createSetupTask(row);

                    });
                }
            }
        }

        function createSetupTask(row){
            var serviceOrder = getServiceOrder(row);

            var taskNameInput = document.getElementById("subject");
            var prioritySelect = document.getElementById("priority");
            var taskTypeSelect = document.getElementById("taskType");
            var dueDateInput = document.getElementById("dueDate");
            var taskForButton = document.getElementById("selectTaskFor");

            var taskName = "";

            switch (serviceOrder.service){
                case "BED BUGS":
                    prioritySelect.value = "3";
                    taskTypeSelect.value = "12";
                    dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                    taskName = "Generate follow-up for Bed Bugs on "+getFutureDate(serviceOrder.date, 14);
                    break;
                case "FREE ESTIMATE":
                    prioritySelect.value = "3";
                    taskTypeSelect.value = "16";
                    taskName = "New $?? ";
                    break;
                case "FREE ESTIMATE C":
                    console.log("TODO: Do commercial estimate stuff.");
                    break;
                case "IN":
                    prioritySelect.value = "3";
                    taskTypeSelect.value = "16";
                    dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                    addSetupTask = true;
                    newServiceSetup(serviceOrder.instructions);
                    scorpIcon.click();
                    break;
                case "RE-START":
                    prioritySelect.value = "3";
                    taskTypeSelect.value = "16";
                    dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                    addSetupTask = true;
                    newServiceSetup(serviceOrder.instructions);
                    scorpIcon.click();
                    break;
                case "ROACH":
                    prioritySelect.value = "3";
                    taskTypeSelect.value = "12";
                    dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                    taskName = "Generate 2 more GR treatments @ $100 ea";
                    break;
                case "TICK":
                    prioritySelect.value = "3";
                    taskTypeSelect.value = "12";
                    dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                    taskName = "Generate 1 more Tick treatment on "+getFutureDate(serviceOrder.date, 14);
                    break;
                default:
                    console.log("TODO: Don't know what to do with this.");
            }

            taskNameInput.value = taskName;

            function newServiceSetup(data){
                var setupNotes = [
                    { input: "40mo", output: "$40M" },
                    { input: "mo @ $40", output: "$40M" },
                    { input: "40 monthly", output: "$40M" },
                    { input: "45mo", output: "$45M" },
                    { input: "mo @ $45", output: "$45M" },
                    { input: "45 monthly", output: "$45M" },
                    { input: "49mo", output: "$49M" },
                    { input: "mo @ $49", output: "$49M" },
                    { input: "49 monthly", output: "$49M" },
                    { input: "55mo", output: "$55M" },
                    { input: "mo @ $55", output: "$55M" },
                    { input: "55 monthly", output: "$55M" },
                    { input: "60mo", output: "$60M" },
                    { input: "mo @ $60", output: "$60M" },
                    { input: "60 monthly", output: "$60M" },
                    { input: "65mo", output: "$65M" },
                    { input: "mo @ $65", output: "$65M" },
                    { input: "65 monthly", output: "$65M" },
                    { input: "55eom", output: "$55B" },
                    { input: "55 bimonthly", output: "$55B" },
                    { input: "60eom", output: "$60B" },
                    { input: "60 bimonthly", output: "$60B" },
                    { input: "65eom", output: "$65B" },
                    { input: "65 bimonthly", output: "$65B" },
                    { input: "69eom", output: "$69B" },
                    { input: "69 bimonthly", output: "$69B" },
                    { input: "75eom", output: "$75B" },
                    { input: "75 bimonthly", output: "$75B" },
                    { input: "79eom", output: "$79B" },
                    { input: "79 bimonthly", output: "$79B" },
                    { input: "90qtr", output: "$90Q" },
                    { input: "90 quarterly", output: "$90Q" },
                    { input: "95qtr", output: "$95Q" },
                    { input: "95 quarterly", output: "$95Q" },
                    { input: "99qtr", output: "$99Q" },
                    { input: "99 quarterly", output: "$99Q" }
                ];

                for(var i = 1; i < setupNotes.length; i++){
                    if(data.indexOf(setupNotes[i].input) > -1){
                        taskName = "New "+setupNotes[i].output;
                        break;
                    }
                    taskName = "New ???";
                }
            }
        }
    }

    function autoFollowUpinator(){
        if(!urlContains(["location/detail.asp"])) return;
        if(urlContains(["iframe"])) return;

        console.log("autoFollowUpinating");

        var addTask = document.getElementById("addTask");
        var collapsedAddTask = document.getElementById("collapsedAddTask");
        var collapsedTasksRow = document.getElementById("locationTasksRow");

        if(collapsedTasksRow){
            collapsedTasksRow.addEventListener("click", function(){
                var locationTasksRows = document.getElementsByClassName("location-tasks-row");
                console.log(locationTasksRows.length);
                for(var i = 0; i < locationTasksRows.length; i++){
                    locationTasksRows[i].addEventListener("click", function(){
                        setTimeout(function(){
                            addFollowUpButton();
                        }, 0);
                    }, true);
                }
            }, true);
        }

        if(collapsedAddTask){
            collapsedAddTask.addEventListener("click", addFollowUpButton, true);
        }

        function addFollowUpButton(e){
            var taskContainer = document.getElementById("taskContainer");
            taskContainer.style.width = "213px";

            var dueDateInput = document.getElementById("dueDate");
            var buttonsContainer = document.getElementsByClassName("expanded-row-buttons-container")[0];
            var butSave = document.getElementById("butSave");
            var butFollowUp = document.createElement("a");
            var followUpContainer = document.createElement("div");

            followUpContainer.appendChild(butFollowUp);
            followUpContainer.style.marginRight = "303px";

            butFollowUp.innerHTML = "Create Follow Up Task";
            butFollowUp.className += "primary-link";

            if(buttonsContainer) buttonsContainer.insertBefore(followUpContainer, buttonsContainer.children[0]);

            butFollowUp.addEventListener("click", function(e) {
                e.preventDefault();
                var dueDate = dueDateInput.value;
                butSave.click();
                createFollowUpTask(dueDate);

            });

            function createFollowUpTask(taskDate){
                setTimeout(function(){
                    var addTask = document.getElementById("addTask");
                    var collapsedAddTask = document.getElementById("collapsedAddTask");

                    if(addTask){
                        addTask.click();
                    } else {
                        collapsedAddTask.click();
                    }

                    var taskNameInput = document.getElementById("subject");
                    var prioritySelect = document.getElementById("priority");
                    var taskTypeSelect = document.getElementById("taskType");
                    var dueDateInput = document.getElementById("dueDate");
                    var selectTaskFor = document.getElementById("selectTaskFor");

                    prioritySelect.value = "2";
                    taskNameInput.value = "Follow up for initial";
                    taskTypeSelect.value = "16";
                    dueDateInput.value = getFutureDate(taskDate, 14);

                    selectTaskFor.click();

                }, 1000);
            }
        }
    }

    function autoGeocodinator(){
		if(!urlContains(["location/edit.asp"])) return;
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

    function autoDepunctuationator(){
        if(!urlContains(["location/edit.asp"])) return;
        console.log("autoDepunctuationating");

        var editButton = document.getElementById("butEdit");
        var saveButton = document.getElementById("butSave");
        var addressInput = document.getElementById("Address");
        var streetLabel, streetSearchLabel, streetSearchInput;
        var directionsInput;

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
            directionsInput = document.getElementById("Directions");

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

            directionsInput.value = directionsInput.value.replace("scorpions txt reminders", "TEXT REMINDERS - Scorpions");

            directionsInput.value = directionsInput.value.replace("scorpions text reminders", "TEXT REMINDERS - Scorpions");

            if(!directionsInput.value.match(/\*/g)){

                directionsInput.value = "** "+directionsInput.value;

            }
        }
    }

})();