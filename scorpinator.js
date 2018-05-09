// ==UserScript==
// @name         Scorpinator
// @namespace    http://RjHuffaker.github.io
// @version      1.315
// @updateURL    http://RjHuffaker.github.io/scorpinator.js
// @description  Provides various helper functions to PestPac, customized to our particular use-case.
// @author       You
// @match        app.pestpac.com/*
// @match        https://app.pestpac.com/*
// @match        reporting.pestpac.com/reports/serviceSetups/reportRemote.asp
// @match        *app.heymarket.com/*
// @match        https://email24.godaddy.com/webmail.php
// @require      https://unpkg.com/github-api/dist/GitHub.bundle.js
// @grant        window.open
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @run-at       document-idle
// ==/UserScript==


(function() {
    'use strict';
    /*jshint esnext: true */

    var activeSetups;

    var addSetupTask = false;

    var iterating = false;

    var taskSendFollowUpButton;

    var excludedWeekDays = [];

    var excludedWeeks = [];

    var excludedTechs = [];

    var WEEKDAYS = ["MON","TUE","WED","THU","FRI"];

    var WEEKS = ["1","2","3","4"];

    var TECHNICIANS = ["BRYANJ", "CONNOR", "CRAIG L", "DANIEL A", "DENZIL", "DEVIN", "EMANUEL", "FRANKR", "GARRETT", "JEFF H", "JORDAN", "JOSE", "JOSEPH A",
                                    "KODY", "LANDON", "MICHAELM", "MICHAEL R", "MIGUEL", "MITCHELL", "RAYBROWN", "RHETT", "SHAWN", "TREVORP"];
    var ROUTELIST = [];

  //  var phoneNumberRegEx = /[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;

    var phoneNumberRegEx = /(?:^|[\s\(])(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?!\.\S|[^\s\)x\.])/;

    var phoneNumberRegExMatcher = new RegExp(phoneNumberRegEx);

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
        if(!urlContains(["blank", "iframe"])){
            retrieveCSS();
            focusListener();
            retrieveActiveSetups();
            autoTaskinator();
            autoGeocodinator();
            autoDataFixinator();
            traversinator();
            autoSetupinator();
            autoWelcomator();
            autoContactinator();
            serviceOrderDuplicator();
            accountListExtractinator();
            goDaddyAddressGrabber();
        }
    }

    function triggerMouseEvent(node, eventType) {
        var clickEvent = document.createEvent ('MouseEvents');
        clickEvent.initEvent (eventType, true, true);
        node.dispatchEvent (clickEvent);
    }

    function retrieveCSS(){
        var link = window.document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = 'https://RjHuffaker.github.io/scorpinator.css';
        document.getElementsByTagName("HEAD")[0].appendChild(link);
    }

    function retrieveActiveSetups(){
        if(urlContains(["app.pestpac.com"])){
            var residential = GM_getValue("residential");
            if(residential){
                activeSetups = tsvToObjectArray(residential, 0);

                proximinator();
            } else {
                httpGetAsync("https://rjhuffaker.github.io/residential.csv",
                             function(response){
                    activeSetups = tsvToObjectArray(response, 0);

                    proximinator();
                });
            }

            GM_addValueChangeListener("residential", function(name, old_value, new_value, remote){
                activeSetups = tsvToObjectArray(new_value, 0);

                proximinator();
            });
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

    function tsvToObjectArray(tsv, start){
        var lines = tsv.split("\n");
        var result = [];

        for(var i = start?start:0; i < lines.length;i++){
            var _current = lines[i].split("\t");
            if(_current.length > 10){
                result.push(new ActiveSetup(_current));
            }
        }
        return result;
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

    function checkElementAncestry(element, testElement, generations){
        var currentElement = element;
        while(currentElement.parentElement){
            if(currentElement===testElement){
                return true;
            } else {
                currentElement = currentElement.parentNode;
            }
        }
    }

    function checkClassAncestry(element, testClass, generations){
        var currentElement = element;
        while(currentElement.parentElement){
            if(currentElement.classList.contains(testClass)){
                return true;
            } else {
                currentElement = currentElement.parentNode;
            }
        }
    }

    function spinButton(elem, size){
        var _count = 0;
        var spinterval = setInterval(spinner, 25);
        function spinner(){
            if(_count <= 20){
                var growth = _count <= 10 ? Math.abs(1+_count*.1) : Math.abs(3-_count*.1);
                elem.style.margin = "-"+Math.abs(growth*size*.25)+"px";
                elem.style.width = Math.abs(growth*size)+"px";
                elem.style.height = Math.abs(growth*size)+"px";
                elem.style.transform = "rotate("+Math.abs(_count*18)+"deg)";
                _count++;
            } else {
                clearInterval(spinterval);
            }
        }
    }

    function getFutureDate(startDate, daysOut){
        var newDate = new Date(startDate);
        newDate.setDate(newDate.getDate() + daysOut);

        if(newDate.getDay() === 0){ //Sunday
            newDate.setDate(newDate.getDate() + 1);
        } else if(newDate.getDay() === 6){
            newDate.setDate(newDate.getDate() + 2);
        }

        var dd = newDate.getDate();
        var mm = newDate.getMonth()+1;
        var yy = newDate.getFullYear().toString().substring(2,4);

        return mm+"/"+dd+"/"+yy;
    }

    function removeLeadingZeroes(dateString){
        var dateList = dateString.split("/");
        return parseInt(dateList[0])+"/"+parseInt(dateList[1])+"/"+parseInt(dateList[2]);
    }

    function getServiceSchedule(input){
        var week = input.substring(0,1)
        .replace("1", "first week ").replace("2", "second week ").replace("3", "third week ").replace("4", "fourth week ");

        var frequency = input.substring(4)
        .replace("QJ", "of every January, April, July and October")
        .replace("QF", "of every February, May, August and November")
        .replace("QM", "of every March, June, September and December")
        .replace("BJ", "of every other month")
        .replace("BF", "of every other month");

        if(input.substring(4) === "M") frequency = "of each month";

        return week+frequency;
    }

    function getContactInfo(){
        var accountId;
        var accountName;

        var locationHeaderDetailLink = document.getElementById("locationHeaderDetailLink");
        var addressBlock = document.getElementById("location-address-block");

        if(addressBlock && locationHeaderDetailLink){
            accountId = locationHeaderDetailLink.children[0].innerHTML;
            accountName = addressBlock.children[0].children[1].children[0].children[0].innerHTML;
        } else {
            accountId = "";
            accountName = "";
        }
        return accountId+"|"+accountName;
    }

    function getServiceDate(input){

        var month = input.split("/")[0];

        if(month.length===1){
            month = month
                .replace("1", "January").replace("2", "February").replace("3", "March")
                .replace("4", "April").replace("5", "May").replace("6", "June")
                .replace("7", "July").replace("8", "August").replace("9", "September");
        } else {
            month = month
                .replace("01", "January").replace("02", "February").replace("03", "March")
                .replace("04", "April").replace("05", "May").replace("06", "June")
                .replace("07", "July").replace("08", "August").replace("09", "September")
                .replace("10", "October").replace("11", "November").replace("12", "December");
        }

        var day = input.split("/")[1];

        if(day.length===1){
            day = day
                .replace("1", "1st").replace("2", "2nd").replace("3", "3rd").replace("4", "4th")
                .replace("5", "5th").replace("6", "6th").replace("7", "7th").replace("8", "8th").replace("9", "9th");
        } else {
            day = day
                .replace("01", "1st").replace("02", "2nd").replace("03", "3rd").replace("04", "4th").replace("05", "5th")
                .replace("06", "6th").replace("07", "7th").replace("08", "8th").replace("09", "9th").replace("10", "10th")
                .replace("11", "11th").replace("12", "12th").replace("13", "13th").replace("14", "14th").replace("15", "15th")
                .replace("16", "16th").replace("17", "17th").replace("18", "18th").replace("19", "19th").replace("20", "20th")
                .replace("21", "21st").replace("22", "22nd").replace("23", "23rd").replace("24", "24th").replace("25", "25th")
                .replace("26", "26th").replace("27", "27th").replace("28", "28th").replace("29", "29th").replace("30", "30th")
                .replace("31", "31st");
        }

        return month+" "+day;
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
        if(frequency=="B") daysOut = 45;
        if(frequency=="Q") daysOut = 60;

        newDate.setDate(newDate.getDate() + daysOut);


        for(var i = 0; i < 31; i++){
            newDate.setDate(newDate.getDate() + 1);

            if(newDate.getDay() === day && newDate.getDate() > (week-1)*7  && newDate.getDate() <= (week)*7 ){
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
                serviceOrder.date = removeLeadingZeroes(orderColumns[4].innerHTML.slice(14,22));
                serviceOrder.tech = orderColumns[9].children[0].innerHTML.trim().replace("&nbsp;","");
                serviceOrder.service = orderColumns[10].children[0].innerHTML.trim();
                if(ordersTableRows[row].getAttribute("popuptext")){
                    serviceOrder.instructions = ordersTableRows[row].getAttribute("popuptext").replace(/<\/?[^>]+(>|$)/g, "").split("Location Instructions:&nbsp;").pop();
                }

            }

            return serviceOrder;
        }
    }

    function getServiceSetup(row){
        var serviceSetup = {};

        var setupTable = document.getElementById("ProgramsTable");
        var setupTableRows = null;
        if(setupTable){
            setupTableRows = setupTable.children[0].children;

            if(!setupTableRows[row].classList.contains("noncollapsible")){
                var setupColumns = setupTableRows[row].children;
                serviceSetup.serviceCode = setupColumns[2].children[0].innerHTML.replace("&nbsp;", "");
                serviceSetup.schedule = setupColumns[3].children[0].innerHTML.replace("&nbsp;", "");
                serviceSetup.tech = setupColumns[4].children[0].innerHTML.replace("&nbsp;", "");
                serviceSetup.lastService = setupColumns[5].innerHTML.replace("&nbsp;", "");
                serviceSetup.nextService = setupColumns[6].innerHTML.replace("&nbsp;", "");
                serviceSetup.price = setupColumns[8].innerHTML.replace("&nbsp;", "");
                serviceSetup.active = setupTableRows[row].getAttribute("bgcolor")==="#ffffff";
            }

            return serviceSetup;
        }
    }

    function goToAccount(accountId, openWindow){
        var quickSearchField = document.getElementById("quicksearchfield");
        quickSearchField.value = accountId;

        var keyUpEvent = document.createEvent("Event");
        keyUpEvent.initEvent('keyup');
        quickSearchField.dispatchEvent(keyUpEvent);

        var i = 0;
        var clickInterval = setInterval(function(){
            i++;
            var searchResults = document.getElementsByClassName("quick-search-result");
            if(searchResults.length > 0){
                clearInterval(clickInterval);

                var pattern = new RegExp(/'(.*?)'/g);
                var onclickText = searchResults[0].getAttribute('onclick');
                var newURL = pattern.exec(onclickText)[0].replaceAll("'", "");

                if(openWindow){
                    var newWindow = window.open("http://app.pestpac.com"+newURL);
                    quickSearchField.value = "";
                    document.getElementsByClassName("actions")[0].children[1].click();
                } else {
                    window.location.href="http://app.pestpac.com"+newURL;
                }
            }

            if(i > 10) clearInterval(clickInterval);
        }, 100);
    }

    function fetchGeocodes(address, callback){
        address = address.replaceAll(", ", "+");
        address = address.replaceAll(" ", "+");

        var requestString = "https://maps.googleapis.com/maps/api/geocode/json?address="+address+",&key=AIzaSyBi54ehlrrs28I7qEeU1jA6mJKB0If9KkI";

        httpGetAsync(requestString, function(data){
            var dataObj = JSON.parse(data);
            var geoCodes = {};

            geoCodes.longitude = parseFloat(dataObj.results[0].geometry.location.lng).toFixed(6);
            geoCodes.latitude = parseFloat(dataObj.results[0].geometry.location.lat).toFixed(6);

            sessionStorage.setItem("longitude", geoCodes.longitude);
            sessionStorage.setItem("latitude", geoCodes.latitude);

            callback(geoCodes);
        });
    }

    function focusListener(){
        if(urlContains(["app.pestpac.com"])){

            recordFocus();

            window.addEventListener("focus", function(event){
                recordFocus();
            }, false);

            function recordFocus(){
                window.name = Date.now();
                GM_setValue("PestPacFocus", window.name);
            }

        } else if(urlContains(["app.heymarket.com"])){
            return;
        }
    }

    function checkLastFocus(){
        var lastFocus = GM_getValue("PestPacFocus");

        if(lastFocus === window.name){
            return true;
        } else {
            return false;
        }
    }

    function proximinator(){
        if(!urlContains(["LocationID","location/add.asp","serviceSetup/detail.asp"])) return;
        if(urlContains(["letters","dialog","notes"])) return;

        var bodyElement = document.getElementsByTagName('body')[0];

        bodyElement.appendChild(createProxIcon());

        bodyElement.appendChild(createProxModal());

        function createProxIcon(){
            var proxIcon = document.createElement("img");
            proxIcon.src = "https://rjhuffaker.github.io/scorpIcon.png";
            proxIcon.id = "prox-icon";

            proxIcon.addEventListener('mouseover', function(){
                proxIcon.style.opacity = "1.0";
            });
            proxIcon.addEventListener('mouseout', function(){
                proxIcon.style.opacity = "0.6";
            });

            proxIcon.onclick = proxIconListener;

            return proxIcon;
        }

        function createProxModal(){
            var proxModal = document.createElement("div");
            proxModal.id = "prox-modal";
            proxModal.style.zIndex = 9000;

            proxModal.appendChild(createProxContainer());
            proxModal.appendChild(createProxFilter());
            proxModal.appendChild(createCaretDivBorder());
            proxModal.appendChild(createCaretDiv());

            return proxModal;

            function createCaretDiv(){
                var caretDiv = document.createElement("div");
                caretDiv.id = "caret-div";
                caretDiv.style.zIndex = 10000;

                return caretDiv;
            }

            function createCaretDivBorder(){
                var caretDivBorder = document.createElement("div");
                caretDivBorder.id = "caret-div-border";
                caretDivBorder.style.zIndex = 10000;

                return caretDivBorder;
            }

            function createProxContainer(){
                var proxContainer = document.createElement("div");
                proxContainer.id = "prox-container";
                proxContainer.style.position = "absolute";
                proxContainer.style.zIndex = 10000;

                proxContainer.appendChild(createProxHeader());
                proxContainer.appendChild(createProxContent());

                return proxContainer;

                function createProxHeader(){
                    var proxHeader = document.createElement("div");
                    proxHeader.id = "prox-header";

                    proxHeader.appendChild(createProxHeaderImage());
                    proxHeader.appendChild(createProxTitle());
                    proxHeader.appendChild(createProxExit());

                    return proxHeader

                    function createProxHeaderImage(){
                        var proxHeaderImage = document.createElement("img");
                        proxHeaderImage.id = "prox-header-image";
                        proxHeaderImage.src = "https://rjhuffaker.github.io/ScorpImage.png";
                        proxHeaderImage.style.display = "inline";

                        return proxHeaderImage;
                    }

                    function createProxExit(){
                        var proxExit = document.createElement("span");
                        proxExit.id = "prox-exit";
                        proxExit.innerHTML = "&#10006;";
                        proxExit.onclick = proxModalDismiss;

                        return proxExit;

                        function proxModalDismiss(){
                            document.getElementById("prox-modal").classList.remove("show");
                        }
                    }

                    function createProxTitle(){
                        var proxTitle = document.createElement("span");
                        proxTitle.id = "prox-title";
                        proxTitle.style.boxSizing = "border-box";
                        proxTitle.innerHTML = "Scorpinator";

                        return proxTitle;
                    }

                }

                function createProxContent(){
                    var proxContent = document.createElement("div");
                    proxContent.id = "prox-content";

                    return proxContent;
                }

            }

            function createProxFilter(){
                var proxFilter = document.createElement("div");
                proxFilter.id = "prox-tab";

                proxFilter.appendChild(createProxFilterLabel());
                proxFilter.appendChild(createProxFilterContent());

                return proxFilter;

                function createProxFilterLabel(){
                    var proxFilterLabel = document.createElement("div");
                    proxFilterLabel.id = "prox-tab-label";
                    proxFilterLabel.style.fontSize = "14pt";
                    proxFilterLabel.style.cursor = "pointer";

                    proxFilterLabel.innerHTML = "Filter Results By:";
                    proxFilterLabel.classList.add("scorpinated");
                    proxFilterLabel.onclick = proxFilterResize;

                    return proxFilterLabel;

                    function proxFilterResize(){
                        if(proxFilter.classList.contains("expanded")){
                            proxFilter.classList.remove("expanded");
                            proxFilter.style.left = "-15px";
                        } else {
                            proxFilter.classList.add("expanded");
                            proxFilter.style.left = "-224px";
                        }
                    }

                }

                function createProxFilterContent(){
                    var proxFilterContent = document.createElement("div");
                    proxFilterContent.id = "prox-tab-content";
                    proxFilterContent.style.padding = "5px";

                    var weekDayExclude = document.createElement("input");
                    weekDayExclude.type = "checkbox";
                    weekDayExclude.name = "weekDayExcludeBox";

                    var weekDayInclude = document.createElement("input");
                    weekDayInclude.type = "checkbox";
                    weekDayInclude.name = "weekDayIncludeBox";

                    proxFilterContent.appendChild(createProxFilterHeader("WeekDay", WEEKDAYS, excludedWeekDays));
                    proxFilterContent.appendChild(createProxFilter(WEEKDAYS, excludedWeekDays, "WeekDay"));
                    proxFilterContent.appendChild(document.createElement("hr"));

                    proxFilterContent.appendChild(createProxFilterHeader("Week", WEEKS, excludedWeeks));
                    proxFilterContent.appendChild(createProxFilter(WEEKS, excludedWeeks, "Week"));
                    proxFilterContent.appendChild(document.createElement("hr"));

                    proxFilterContent.appendChild(createProxFilterHeader("Technician", TECHNICIANS, excludedTechs));
                    proxFilterContent.appendChild(createProxFilter(TECHNICIANS, excludedTechs, "Technician"));

                    return proxFilterContent;
                }

                function createProxFilterHeader(filterName, inputList, outputList){
                    var _filterTitle = document.createElement("div");
                    _filterTitle.innerHTML = filterName;
                    _filterTitle.style.fontSize = "10pt";
                    _filterTitle.style.fontWeight = "bold";

                    var _selectAllBox = document.createElement("input");
                    _selectAllBox.type = "checkbox";
                    _selectAllBox.name = filterName+"SelectAllBox";
                    _selectAllBox.id = filterName+"SelectAllBox";
                    _selectAllBox.onclick = selectAll;

                    var _selectAllLabel = document.createElement("label");
                    _selectAllLabel.innerHTML = "&nbsp;Select All&nbsp;";
                    _selectAllLabel.htmlFor = filterName+"SelectAllBox";
                    _selectAllLabel.style.cursor = "pointer";
                    _selectAllLabel.style.fontWeight = "bold";

                    var _headerDiv = document.createElement("div");
                    _headerDiv.appendChild(_filterTitle);
                    _headerDiv.appendChild(_selectAllBox);
                    _headerDiv.appendChild(_selectAllLabel);

                    return _headerDiv;

                    function selectAll(event){
                        var checkBoxes = Array.from(document.getElementsByClassName(filterName+"Box"))

                        if(event.target.checked){
                            inputList.forEach(function(item){
                                if(outputList.indexOf(item) > -1) return;
                                outputList.push(item);
                                checkBoxes.forEach(function(checkBox){
                                    checkBox.checked = true;
                                });
                            });

                        } else {
                            outputList.length = 0;
                            checkBoxes.forEach(function(checkBox){
                                checkBox.checked = false;
                            });
                        }

                        fetchGeocodes(getLocationAddress(), function(data){
                            getNearestActiveSetups(data, function(data){
                                generateProxContent(data);
                            });
                        });
                    }

                }


                function createProxFilter(inputList, outputList, filterType){
                    var _checkList = document.createElement("div");

                    inputList.forEach(function(filter){
                        var _checkBox = document.createElement("input");
                        _checkBox.type = "checkbox";
                        _checkBox.name = filter+"Box";
                        _checkBox.checked = outputList.indexOf(filter) > -1;
                        _checkBox.id = filter+"Box";
                        _checkBox.style.cursor = "pointer";
                        _checkBox.classList.add(filterType+"Box");

                        var _spacer = document.createElement("span");
                        _spacer.innerHTML = "<br/>";

                        var _label = document.createElement("label");
                        _label.innerHTML = filter+"&nbsp;&nbsp;";
                        _label.htmlFor = filter+"Box";
                        _label.style.cursor = "pointer";

                        _checkList.appendChild(_checkBox);
                        _checkList.appendChild(_label);
                        _checkList.appendChild(_spacer);

                        _checkBox.onclick = function(event){
                            var checkBoxData = event.target.id.replace("Box", "");
                            var selectAllBox = document.getElementById(filterType+"SelectAllBox")

                            if(event.target.checked){
                                outputList.push(checkBoxData);
                            } else {
                                var index = outputList.indexOf(checkBoxData);
                                outputList.splice(index, 1);
                            }

                            if(inputList.length === outputList.length){
                                selectAllBox.checked = true;
                            } else {
                                selectAllBox.checked = false;
                            }

                            fetchGeocodes(getLocationAddress(), function(data){
                                getNearestActiveSetups(data, function(data){
                                    generateProxContent(data);
                                });
                            });
                        };
                    });

                    return _checkList;
                }

            }

        }

        function proxIconListener(){
            var proxModal = document.getElementById("prox-modal");
            if(proxModal.classList.contains("show")){
                addSetupTask = false;
                proxModal.classList.remove("show");
            } else {
                proxModal.classList.add("show");
                fetchGeocodes(getLocationAddress(), function(dataList){
                    getNearestActiveSetups(dataList, function(dataList){
                        generateProxContent(dataList);
                        fixDivision(dataList);
                    });
                });

                setTimeout(function(){
                    window.addEventListener('click', clickToDismiss);
                }, 100);
            }

            function fixDivision(dataList){
                if(urlContains(["location/add.asp", "location/edit.asp"])){
                    autoGeocodinator();
                    var divisionSelect = document.getElementById("Division");

                    if(!divisionSelect.value){
                        var divisionList = [];
                        for(var i = 0; i < dataList.length; i++){
                            if(dataList[i].zipCode===document.getElementById("Zip").value){
                                divisionList.push(dataList[i].division);
                            }
                        }
                        divisionSelect.focus();
                        divisionSelect.value = divisionList.sort((a,b) => divisionList.filter(v => v===a).length - divisionList.filter(v => v===b).length).pop();
                        divisionSelect.blur();

                        var divisionLabel = divisionSelect.parentElement.previousElementSibling;
                        divisionLabel.classList.add("scorpinated");
                    }
                }
            }

            function clickToDismiss(e){
                var element = e.target;

                if(checkElementAncestry(element, proxModal)) return;

                proxModal.classList.remove("show");
                window.removeEventListener('click', clickToDismiss);
            }

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

            return address.replace(/#[1-9]+,/g, "");
        }

        function getNearestActiveSetups(data, callback){
            var al = activeSetups.length;
            var lowest = 10000;
            var nearest = {};
            var nearestList = [];
            var _long = parseFloat(data.longitude);
            var _lat = parseFloat(data.latitude);

            ROUTELIST.length = 0;

            for(var i = 1; i < al; i++){
                var setup = activeSetups[i];
                if(!setup.id){
                    console.log("ummmm");
                }

                var addTech = true;
                if(ROUTELIST.length)
                for(var ii = 0; ii < ROUTELIST.length; ii++){
                    var _tech = ROUTELIST[ii];
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

                        if(activeSetups[i].schedule){
                            _tech.dailyTotals[activeSetups[i].schedule.substring(0,4)] += Math.round(parseInt(activeSetups[i].total) * multiplier);
                            _tech.dailyStops[activeSetups[i].schedule.substring(0,4)] += 1;
                        } else {
                            console.log("NO SCHEDULE 1: "+activeSetups[i]);
                        }
                    }
                }

                if(addTech && activeSetups[i].tech){
                    ROUTELIST.push(new technician(activeSetups[i].tech));
                }

                if(excludedWeekDays.indexOf(setup.weekDay) < 0 && excludedWeeks.indexOf(setup.week) < 0 && excludedTechs.indexOf(setup.tech) < 0)

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

            if(nearestList.length > 1){
                for(var j = 0; j < nearestList.length; j++){
                    var _nearest = nearestList[j];
                    for(var ji = 0; ji < ROUTELIST.length; ji++){
                        var _tech = ROUTELIST[ji];
                        if(_tech.name === _nearest.tech){
                            if(_nearest.schedule){
                                _nearest.dailyTotal = _tech.dailyTotals[_nearest.schedule.substring(0,4)];
                                _nearest.dailyStops = _tech.dailyStops[_nearest.schedule.substring(0,4)];
                            }
                        }
                    }
                }
            }

            callback(nearestList);
        }

        function generateProxContent(data){

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

            var _proxContent = document.getElementById("prox-content");
            _proxContent.innerHTML = "";

            _proxContent.appendChild(createProxTable(data));
            _proxContent.appendChild(createGeocodesLabel());
            _proxContent.appendChild(createRetrieveLink());
            _proxContent.appendChild(createProxLegend());

            function createProxTable(data){
                var proxTable = document.createElement("table");
                proxTable.border = 1;
                proxTable.style.right = "10px";
                if(data.length > 1){
                    for(var i = 0; i < data.length; i++){
                        createTableRow(data[i]);
                    }
                }
                createTableHeader();

                return proxTable;

                function createTableRow(rowData){
                    if(!rowData.zipCode){
                        console.log(rowData);
                    }

                    var _goToAnchor = document.createElement("a");
                    _goToAnchor.innerHTML = rowData.id;
                    _goToAnchor.style.textDecoration = "none";
                    _goToAnchor.style.color = "#000";

                    var _techAnchor = document.createElement("a");
                    _techAnchor.innerHTML = rowData.tech+"/"+rowData.division;
                    _techAnchor.style.textDecoration = "none";
                    _techAnchor.style.color = "#000";

                    var _tr = proxTable.insertRow();
                    _tr.insertCell().appendChild(_goToAnchor);
                    _tr.insertCell().innerHTML = rowData.zipCode.substring(0,5);
                    _tr.insertCell().innerHTML = rowData.schedule;
                    _tr.insertCell().appendChild(_techAnchor);
                    _tr.insertCell().innerHTML = rowData.hyp+" km";
                    _tr.insertCell().innerHTML = rowData.dailyStops;

                    if(addSetupTask){
                        _tr.classList.add("add-setup-task");
                        _tr.dataSetup = rowData;
                        _tr.addEventListener("click", function(e) {
                            addSetupTaskDetails(this.dataSetup);
                            addSetupTask = false;
                            document.getElementById("prox-modal").classList.remove("show");
                        });
                    } else {
                        _goToAnchor.style.cursor = "pointer";
                        _goToAnchor.addEventListener("click", function(e) {
                            goToAccount(rowData.id, true);
                        });

                        _techAnchor.style.cursor = "pointer";
                        _techAnchor.addEventListener("click", function(e) {

                            alert(createTechSchedule(rowData.tech));
                        });
                    }

                    for(var ii = 0; ii < colorScale.length; ii++){
                        if(rowData.dailyTotal < colorScale[ii].amount){
                            _tr.style.textShadow = "1px 1px 0 "+colorScale[ii].color;
                            break;
                        }
                        _tr.style.textShadow = "1px 1px 0 rgb(255,0,255)";
                    }

                    function createTechSchedule(tech){
                        var schedule = "";

                        ROUTELIST.forEach(
                            function(route){
                                if(route.name === tech){
                                    schedule = "Daily Stops/Totals for "+route.name+"\n        MON              TUE               WED               THU                FRI\n";

                                    for(var day in route.dailyStops){
                                        var dayString = "";

                                        dayString = dayString+route.dailyStops[day]+"/"+route.dailyTotals[day];

                                        console.log(dayString.length);

                                        for(var i = dayString.length; i < 7; i++){
                                            console.log(i);
                                            dayString = " "+dayString+" ";
                                        }


                                        if(day.includes("MON")){
                                            dayString = day[0]+":   " + dayString;
                                        }

                                        if(day.includes("FRI")){
                                            dayString = dayString+"\n";
                                        } else {
                                            dayString = dayString+"    |    ";
                                        }

                                        schedule = schedule+dayString;
                                    }

                                }
                            });

                        return schedule;
                    }

                }

                function createTableHeader(){
                    var _header = proxTable.createTHead();

                    var _headerRow = _header.insertRow(0);

                    _headerRow.insertCell().innerHTML = "Account#";
                    _headerRow.insertCell().innerHTML = "Zip Code";
                    _headerRow.insertCell().innerHTML = "Schedule";
                    _headerRow.insertCell().innerHTML = "Tech/Division";
                    _headerRow.insertCell().innerHTML = "Distance *";
                    _headerRow.insertCell().innerHTML = "Stops";
                    _headerRow.style.fontWeight = "bold";
                }

            }


            function createGeocodesLabel(){
                var geocodesLabel = document.createElement("span");
                geocodesLabel.id = "geocodesLabel";
                geocodesLabel.innerHTML = "Latitude: "+sessionStorage.getItem("latitude")+" Longitude: "+sessionStorage.getItem("longitude");

                return geocodesLabel;
            }

            function createRetrieveLink(){
                var retrieveLink = document.createElement("a");
                retrieveLink.innerHTML = "Retrieve Account Data";
                retrieveLink.style.position = "absolute";
                retrieveLink.style.paddingTop = "2px";
                retrieveLink.style.right = "10px";
                retrieveLink.style.cursor = "pointer";

                retrieveLink.onclick = function(){
                    GM_setValue("retrieveAccountData", "residential");

                    var retrieveURL = "http://app.pestpac.com/reports/gallery/offload.asp?OffloadAction=http%3A%2F%2Freporting.pestpac.com%2Freports%2FserviceSetups%2FreportRemote.asp&ReportID=47&CompanyKey=108175&CompanyID=12";

                    window.open(retrieveURL,'_blank', 'toolbar=no,status=no,menubar=no,scrollbars=no,resizable=no,left=10000, top=10000, width=10, height=10, visible=none', '');

                  //  window.open("http://app.pestpac.com/reports/gallery/offload.asp?OffloadAction=http%3A%2F%2Freporting.pestpac.com%2Freports%2FserviceSetups%2FreportRemote.asp&ReportID=47&CompanyKey=108175&CompanyID=12");
                }

                return retrieveLink;
            }

            function createProxLegend(){

                var proxLegend = document.createElement("div");

                proxLegend.appendChild(createLegendHeader());

                for(var j = 0; j < colorScale.length; j++){
                    var _div = document.createElement("div");
                    _div.innerHTML = "$"+colorScale[j].amount;
                    _div.style.textShadow = "1px 1px 0 "+colorScale[j].color;
                    _div.style.transform = "rotate(300deg)";
                    _div.style.display = "inline-block";
                    _div.style.marginTop = "12px";
                    _div.style.marginBottom = "16px";
                    _div.style.width = "21px";
                    proxLegend.appendChild(_div);
                }

                var fineText = document.createElement("div");
                fineText.innerHTML = "*As the crow flies, not as the technician drives.";
                fineText.style.textAlign = "right";

                proxLegend.appendChild(fineText);

                return proxLegend;

                function createLegendHeader(){
                    var legendHeader = document.createElement("div");
                    if(addSetupTask){
                        legendHeader.innerHTML = "Select an active setup to assign technician and schedule.<h3>Average Daily Total:</h3>";
                    } else {
                        legendHeader.innerHTML = "<h3>Average Daily Total:</h3>";
                    }
                    return legendHeader;
                }

            }

            function addSetupTaskDetails(activeSetup){
                var taskNameInput = document.getElementById("subject");
                var descriptionInput = document.getElementById("description");
                var dueDateInput = document.getElementById("dueDate");

                var _frequency = taskNameInput.value.slice(-1);
                var _startDate = dueDateInput.value;
                var _schedule = activeSetup.schedule.substring(0,1) + capitalizeFirstLetter(activeSetup.schedule.substring(1,4));
                var _tech = capitalizeFirstLetter(activeSetup.tech.split(" ")[0]);
                var _nextDate = getNextServiceDate(_startDate, _schedule, _frequency);
                taskNameInput.value = taskNameInput.value.concat(" "+_schedule+" "+_tech);
                descriptionInput.value = descriptionInput.value.concat("\nNextDate: "+_nextDate);

            }
        }
    }

    function autoTaskinator(){
        if(urlContains(["/task"])){
            document.getElementById("taskFilter").click(); //Makes task page a little easier to use
        } else if(urlContains(["location/detail.asp"])){
            addCreateTaskLink();
            addTaskButtons();
        }

        function addCreateTaskLink(){
            var ordersTable = document.getElementById("OrdersTable");
            var ordersTableRows = null;
            if(ordersTable){
                ordersTableRows = ordersTable.children[0].children;

                for(var i = 0; i < ordersTableRows.length; i++){
                    var container = document.createElement("td");
                    container.style.width = "72px";
                    container.style.textAlign = "center";

                    ordersTableRows[i].insertBefore(container, ordersTableRows[i].firstChild);

                    if(!ordersTableRows[i].classList.contains("noncollapsible")){
                        var serviceOrder = getServiceOrder(i);
                        if(["BED BUGS","FREE ESTIMATE","FREE ESTIMATE C","IN","IN.2","COM-IN","RE-START","ROACH","TICKS"]
                           .indexOf(serviceOrder.service) > -1){

                            var taskButton = document.createElement("a");
                            taskButton.innerHTML = "Create Task";
                            taskButton.id = "taskButton"+i;
                            taskButton.classList.add("primary-link");

                            taskButton.style.fontFamily = "NewRocker";

                            container.appendChild(taskButton);

                            taskButton.addEventListener("click", function(e) {
                                e.stopPropagation();
                                setTimeout(function(){
                                    var addTask = document.getElementById("addTask");
                                    var collapsedAddTask = document.getElementById("collapsedAddTask");
                                    var row = e.target.id.replace("taskButton","");

                                    if(addTask){
                                        addTask.click();
                                    } else {
                                        collapsedAddTask.click();
                                    }

                                    createSetupTask(row);
                                }, 100);
                            });
                        }
                    }
                }
            }

            function createSetupTask(row){
                var serviceOrder = getServiceOrder(row);

                var taskNameInput = document.getElementById("subject");
                var descriptionInput = document.getElementById('description');
                var prioritySelect = document.getElementById("priority");
                var taskTypeSelect = document.getElementById("taskType");
                var dueDateInput = document.getElementById("dueDate");
                var taskForSelect = document.getElementById("taskForID");

                var target = getSetupTarget(document.getElementById("tblDirections").value);

                var taskName = "";

                var taskDescription = "";

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
                        dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                        taskName = "Check to see what estimate was";
                        break;
                    case "FREE ESTIMATE C":
                        prioritySelect.value = "3";
                        taskTypeSelect.value = "16";
                        dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                        taskName = "Check to see what estimate was";
                        break;
                    case "IN":
                        prioritySelect.value = "3";
                        taskTypeSelect.value = "16";
                        dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                        addSetupTask = true;
                        taskName = getSetupPrice(serviceOrder.instructions);
                        taskDescription = "Target: "+target+"\nStartDate: "+serviceOrder.date;
                        document.getElementById("prox-icon").click();
                        break;
                    case "IN.2":
                        prioritySelect.value = "3";
                        taskTypeSelect.value = "16";
                        dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                        addSetupTask = true;
                        taskName = getSetupPrice(serviceOrder.instructions);
                        taskDescription = "Target: "+target+"\nStartDate: "+serviceOrder.date;
                        document.getElementById("prox-icon").click();
                        break;
                    case "COM-IN":
                        prioritySelect.value = "3";
                        taskTypeSelect.value = "16";
                        dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                        addSetupTask = true;
                        taskName = getSetupPrice(serviceOrder.instructions);
                        taskDescription = "Target: "+target+"\nStartDate: "+serviceOrder.date+"\nCOMMERCIAL";
                        document.getElementById("prox-icon").click();
                        break;
                    case "RE-START":
                        prioritySelect.value = "3";
                        taskTypeSelect.value = "16";
                        dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                        addSetupTask = true;
                        taskName = getSetupPrice(serviceOrder.instructions);
                        taskDescription = "Target: "+target+"\nStartDate: "+serviceOrder.date;
                        document.getElementById("prox-icon").click();
                        break;
                    case "ROACH":
                        prioritySelect.value = "3";
                        taskTypeSelect.value = "12";
                        dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                        taskName = "Generate 2 more GR treatments @ $100 ea";
                        break;
                    case "TICKS":
                        prioritySelect.value = "3";
                        taskTypeSelect.value = "12";
                        dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                        taskName = "Generate 1 more Tick treatment on "+getFutureDate(serviceOrder.date, 14);
                        break;
                    default:
                        console.log("TODO: Don't know what to do with this.");
                }

                taskNameInput.value = taskName;

                descriptionInput.value = taskDescription;

                taskForSelect.value = "2915"

                function getSetupPrice(data){
                    var setupName = "";

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
                            setupName = "New "+setupNotes[i].output;
                            break;
                        }
                        setupName = "New ???";
                    }

                    return setupName;
                }

                function getSetupTarget(data){
                    data = data.toLowerCase();
                    if(data.includes("scorpion")){
                        return "SCORPIONS";
                    } else if(data.includes("spider")){
                        return "SPIDERS, E";
                    } else if(data.includes("roach")){
                        return "ROACHES";
                    } else if(data.includes("cricket")){
                        return "CRICKETS,";
                    } else if(data.includes("ticks")){
                        return "TICKS";
                    } else if(data.includes("ants")){
                        return "ANTS";
                    } else {
                        return "";
                    }
                }
            }
        }

        function addTaskButtons(){

            var locationRowSection = document.getElementsByClassName('location-row-section')[0];

            locationRowSection.addEventListener('click', taskFormClickWatcher, true);

            function taskFormClickWatcher(event){
                setTimeout(function(){

                    var tasksForm = document.getElementById("tasksForm");

                    if(tasksForm){
                        if(tasksForm.classList.contains("buttonated")) return;

                        tasksForm.classList.add("buttonated");

                        var expandedRowButtonsContainer = document.getElementsByClassName("expanded-row-buttons-container")[0];
                        expandedRowButtonsContainer.style.justifyContent = "space-between";
                        expandedRowButtonsContainer.style.position = "static";
                        expandedRowButtonsContainer.style.padding = "0px 32px";

                        var allNotesContainer = document.getElementById("allNotesContainer");
                        allNotesContainer.style.minHeight = "18px";

                        var lastNoteSection = document.getElementById("lastNoteSection");
                        lastNoteSection.style.minHeight = "140px";

                        var locationTaskNoteSection = document.getElementById("locationTaskNoteSection");
                        locationTaskNoteSection.parentNode.style.minHeight = "166px";

                        var cancelEditContainer = document.getElementById("cancelEditContainer");

                        expandedRowButtonsContainer.insertBefore(createOtherButtonsContainer(), cancelEditContainer);
                        expandedRowButtonsContainer.insertBefore(createSpacerDiv(), cancelEditContainer);

                    }

                }, 500);
            };

            function createSpacerDiv(){
                var spacerDiv = document.createElement("div");
                spacerDiv.style.display = "flex";
                spacerDiv.style.flex = "1";

                return spacerDiv;
            }

            function createOtherButtonsContainer(){
                var otherButtonsContainer = document.createElement("div");
                otherButtonsContainer.id = "otherTaskButtons";
                otherButtonsContainer.style.display = "flex";

                var taskName = document.getElementById("subject").value;

                if(taskName.includes("Follow up")){
                    otherButtonsContainer.appendChild(createTaskSendFollowUpButton());
                } else if(taskName.includes("New")){
                    otherButtonsContainer.appendChild(createTaskFollowUpButton());
                    otherButtonsContainer.appendChild(createTaskSetupButton());
                    otherButtonsContainer.appendChild(createTaskWelcomeButton());
                } else {
                    otherButtonsContainer.appendChild(createTaskFollowUpButton());
                }

                if(taskName){
                    otherButtonsContainer.appendChild(createCompleteButton());
                }

                return otherButtonsContainer;

                function createTaskSendFollowUpButton(){
                    var taskSendFollowUpButton = document.createElement("button");
                    taskSendFollowUpButton.classList.add("scorpinated");
                    taskSendFollowUpButton.innerHTML = "Text Follow-up";
                    taskSendFollowUpButton.onclick = sendFollowUpListener;

                    return taskSendFollowUpButton;
                }

                function createTaskFollowUpButton(){
                    var taskFollowUpButton = document.createElement("button");
                    taskFollowUpButton.classList.add("scorpinated");
                    taskFollowUpButton.innerHTML = "Follow Up";
                    taskFollowUpButton.onclick = followUpListener;

                    return taskFollowUpButton;
                }

                function createTaskSetupButton(){
                    var taskSetupButton = document.createElement("button");
                    taskSetupButton.innerHTML = "Create Setup";
                    taskSetupButton.classList.add("scorpinated");
                    taskSetupButton.onclick = createSetupListener;

                    return taskSetupButton;
                }

                function createTaskWelcomeButton(){
                    var taskWelcomeButton = document.createElement("button");
                    taskWelcomeButton.classList.add("scorpinated");
                    taskWelcomeButton.innerHTML = "Welcome Letter";
                    taskWelcomeButton.onclick = welcomeListener;

                    return taskWelcomeButton;
                }

                function createCompleteButton(){
                    var completeButton = document.createElement("button");
                    completeButton.classList.add("scorpinated");
                    completeButton.innerHTML = "Complete";
                    completeButton.addEventListener("click", function(e){
                        e.preventDefault();
                        document.getElementById("status").value = "C";
                        document.getElementById("butSave").click();
                    });

                    return completeButton;
                }

            }
        }

        function followUpListener(event){
            event.preventDefault();

            var butSave = document.getElementById("butSave");
            var dueDate = document.getElementById("dueDate").value;
            var taskName = document.getElementById("subject").value;
            var taskDescription = document.getElementById("description").value;
            var taskType = document.getElementById("taskType").value;

            var startDate;

            if(taskDescription.includes("StartDate:")){
                startDate = taskDescription.match(/StartDate: (.*)/g)[0].split(" ")[1];
            } else {
                startDate = getFutureDate(dueDate, -1);
            }

            if(taskName && startDate && taskType!=="Select"){
                butSave.click();
                createFollowUpTask(startDate, taskDescription);
            } else {
                alert("Task fields incomplete");
                return;
            }

            function createFollowUpTask(taskDate, taskDescription){
                console.log(taskDescription);
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
                    var descriptionInput = document.getElementById("description");
                    var taskTypeSelect = document.getElementById("taskType");
                    var dueDateInput = document.getElementById("dueDate");
                    var taskForSelect = document.getElementById("taskForID");

                    prioritySelect.value = "2";
                    taskNameInput.value = "Follow up for initial";
                    descriptionInput.value = taskDescription;
                    taskTypeSelect.value = "16";
                    dueDateInput.value = getFutureDate(taskDate, 14);
                    taskForSelect.value = "2915"

                }, 1000);
            }
        }

        function createSetupListener(event){
            event.preventDefault();

            var taskNameInput = document.getElementById("subject");
            var dueDate = document.getElementById("dueDate").value;
            var taskType = document.getElementById("taskType").value;
            var description = document.getElementById("description").value;
            var directions = document.getElementById("tblDirections").value;

            var taskArray = taskNameInput.value.split(" ");

            var startDate, nextDate;

            if(description.includes("StartDate: ")){
                startDate = description.match(/StartDate: (.*)/g)[0].split(" ")[1];
                nextDate = description.match(/NextDate: (.*)/g)[0].split(" ")[1];
            } else {
                startDate = dueDate;
            }

            var serviceSetup = {};

            serviceSetup.price = taskArray[1].replaceAll(/[^0-9]+/, '')+".00";
            serviceSetup.frequency = taskArray[1].replaceAll(/[^a-zA-Z]+/, '').replace("M", "MONTHLY").replace("B", "BIMONTHLY").replace("Q", "QUARTERLY");
            serviceSetup.schedule = taskArray[2]+taskArray[1].replaceAll(/[^a-zA-Z]+/, '');
            serviceSetup.tech = getTechnician(taskArray[3]);
            serviceSetup.startDate = startDate;
            serviceSetup.nextDate = nextDate;
            serviceSetup.target = getSetupTarget(directions);

            serviceSetup = JSON.stringify(serviceSetup);

            sessionStorage.setItem("serviceSetup", serviceSetup);

            var newUrl = window.location.href.replace("location/detail.asp?", "serviceSetup/detail.asp?Mode=New&RenewalOrSetup=S&");

            window.location.href = newUrl;


            function getTechnician(name){
                if(name==="Daniel"){
                    return "DANIEL A";
                } else if(name==="Craig" || name==="Kody"){
                    return "CRAIG L";
                } else if(name==="Jeff"){
                    return "JEFF H";
                } else if(name==="Joseph"){
                    return "JOSEPH A";
                } else if(name==="Michael"){
                    return "MICHAEL R";
                } else {
                    return name;
                }
            }

            function getSetupTarget(data){
                data = data.toLowerCase();
                if(data.includes("scorpion")){
                    return "SCORPIONS";
                } else if(data.includes("spider")){
                    return "SPIDERS, E";
                } else if(data.includes("roach")){
                    return "ROACHES";
                } else if(data.includes("cricket")){
                    return "CRICKETS,";
                } else if(data.includes("ticks")){
                    return "TICKS";
                } else if(data.includes("ants")){
                    return "ANTS";
                } else {
                    return "";
                }
            }
        }

        function welcomeListener(event){
            event.preventDefault();

            var taskDescription = document.getElementById('description').value;

            var serviceSetup = getServiceSetup(1);

            var welcomeLetter = {};

            welcomeLetter.division = document.getElementById("Division").value;

            welcomeLetter.schedule = getServiceSchedule(serviceSetup.schedule);

            if(taskDescription.includes("NextDate:")){
                welcomeLetter.nextService = getServiceDate(taskDescription.match(/NextDate: (.*)/g)[0].split(" ")[1]);
            } else {
                welcomeLetter.nextService = getServiceDate(serviceSetup.nextService);
            }

            welcomeLetter = JSON.stringify(welcomeLetter);

            sessionStorage.setItem("welcomeLetter", welcomeLetter);

            var newUrl = window.location.href.replace("location","letters").replace("detail","default");

            window.location.href = newUrl;
        }

        function sendFollowUpListener(event){
            event.preventDefault();

            var taskSubject = document.getElementById('subject').value;

            var taskDescription = document.getElementById('description').value;

            var startDate, nextDate;

            if(taskDescription.includes("StartDate:")){
                startDate = taskDescription.match(/StartDate: (.*)/g)[0].split(" ")[1];
            } else {
                startDate = getFutureDate(document.getElementById("dueDate").value, -14);
            }

            var nextService = getServiceOrder(1);

            if(nextService.date){
                nextDate = nextService.date;
            } else if(taskDescription.includes("NextDate:")){
                nextDate = taskDescription.match(/NextDate: (.*)/g)[0].split(" ")[1];
            }

            if(taskSubject.includes('Follow up')){
                var locationPhoneNumberLink = document.getElementById('locationPhoneNumberLink');

                if(!locationPhoneNumberLink) return;
                var textNumber = locationPhoneNumberLink.value;
                var messageBody = "Responsible Pest Control here, just following up with service provided on "+startDate+
                    ". Just wanted to make sure we have taken care of your pest problems. If not, please call us @ 480-924-4111. We have your next service scheduled for "+nextDate+". Thanks!";

                GM_setValue('autoText', textNumber+"|"+getContactInfo()+"|"+messageBody+"|"+Date.now());

                document.getElementById("status").value = "C";

                document.getElementById("butSave").click();

            }
        }
    }

    function autoSetupinator(){
        if(urlContains(["serviceSetup/detail.asp"])){
            var serviceSetup = JSON.parse(sessionStorage.getItem("serviceSetup"));
            sessionStorage.removeItem("serviceSetup");

            if(serviceSetup){

                var serviceCodeInput = document.getElementById("ServiceCode1");
                var unitPriceInput = document.getElementById("UnitPrice1");
                var scheduleInput = document.getElementById("Schedule");
                var workTimeInput = document.getElementById("WorkTime");
                var startDateInput = document.getElementById("StartDate");
                var targetInput = document.getElementById("TargetPest");
                var techInput = document.getElementById("Tech1");

                serviceCodeInput.focus();
                serviceCodeInput.value = serviceSetup.frequency;
                serviceCodeInput.blur();

                unitPriceInput.focus();
                unitPriceInput.value = serviceSetup.price;
                unitPriceInput.blur();

                workTimeInput.focus();
                workTimeInput.value = getCurrentReadableTime();
                workTimeInput.blur();

                startDateInput.focus();
                startDateInput.value = serviceSetup.startDate;
                startDateInput.blur();

                targetInput.focus();
                targetInput.value = serviceSetup.target;
                targetInput.blur();

                techInput.focus();
                techInput.value = serviceSetup.tech;
                techInput.blur();

                scheduleInput.focus();
                scheduleInput.value = parseSchedule(serviceSetup);
                scheduleInput.blur();

            }
        }

        function getCurrentReadableTime(){
            var hours = new Date().getHours();
            hours = hours<13?hours:hours-12;

            var minutes = new Date().getMinutes();
            minutes = minutes>10?minutes:"0"+minutes;

            return hours+":"+minutes
        }

        function parseSchedule(setup){
            var month;
            var schedule;

            if(setup.nextDate.includes("/")){
                month = parseInt(setup.nextDate.split("/")[0]);
            } else {
                month = parseInt(setup.startDate.split("/")[0]);
            }

            if(setup.frequency === "BIMONTHLY"){
                if(month % 2){
                    schedule = setup.schedule+"J";
                } else {
                    schedule = setup.schedule+"F";
                }
            } else if(serviceSetup.frequency === "QUARTERLY"){
                if(month===1 || month===4 || month===7 || month===10){
                    schedule = setup.schedule+"J";
                } else if(month===2 || month===5 || month===8 || month===11){
                    schedule = setup.schedule+"F";
                } else if(month===3 || month===6 || month===9 || month===12){
                    schedule = setup.schedule+"M";
                }
            } else {
                schedule = setup.schedule;
            }

            return schedule;

        }

    }

    function autoWelcomator(){
        if(urlContains(["letters/default.asp"])){
            if(sessionStorage.getItem("welcomeLetter")){
                document.getElementById("butAddLetter").click();
            }
        } else if(urlContains(["letters/add.asp"])){
            if(sessionStorage.getItem("welcomeLetter")){
                var welcomeLetter = JSON.parse(sessionStorage.getItem("welcomeLetter"));

                document.getElementById("SLT").click();

                var letterCodeInput = document.getElementById("StdLetterSourceCode");

                letterCodeInput.focus();

                letterCodeInput.value = "WELCOME "+welcomeLetter.division;

                letterCodeInput.blur();

                document.getElementById("butContinue").click();
            }
        } else if(urlContains(["letters/detail.asp"])){
            if(sessionStorage.getItem("welcomeLetter")){
                setTimeout(function(){
                    var welcomeLetter = JSON.parse(sessionStorage.getItem("welcomeLetter"));

                    sessionStorage.removeItem("welcomeLetter");

                    var iframe = document.getElementById('Letter_ifr').contentWindow.document;

                    var letter = iframe.getElementById("tinymce");

                    var nameInput = document.getElementById('Name');

                    console.log(welcomeLetter);

                    letter.innerHTML = letter.innerHTML
                        .replace("first week of each month", welcomeLetter.schedule)
                        .replace("DATE", welcomeLetter.nextService);

                    nameInput.value = "Welcome";

                }, 1500);
            }
        }
    }

    function autoGeocodinator(){
		if(!urlContains(["location/edit.asp", "location/add.asp"])) return;

		var butSave = document.getElementById("butSave");
		var butAdd = document.getElementById("butAdd");
		var addressInput = document.getElementById("Address");
        var stateInput = document.getElementById("State");
		var mapMessage = document.getElementById("map_message");

        if(!mapMessage) return;
		if(mapMessage.innerHTML === "Address not found; position is approximate"){

			var address = addressInput.value.replaceAll(" ", "+")+"+"+stateInput.value;
			var requestString = "https://maps.googleapis.com/maps/api/geocode/json?address="+address+",&key=AIzaSyBi54ehlrrs28I7qEeU1jA6mJKB0If9KkI";

			var longitudeInput = document.getElementById("Longitude");
			var latitudeInput = document.getElementById("Latitude");

			fetchGeocodes(address, function(data){
				document.getElementById("Longitude").value = data.longitude;
				document.getElementById("Latitude").value = data.latitude;
				document.getElementById("ExclBatchGeoCode").click();

                mapMessage.innerHTML = "Correct GeoCode Found.";
                mapMessage.classList.add("scorpinated");
                mapMessage.style.color = "black";

                if(butSave){
                    butSave.style.fontSize = "14px";
                    butSave.classList.add("scorpinated");
                    butSave.innerHTML = "Save";
                } else if(butAdd){
                    butAdd.style.fontSize = "14px";
                    butAdd.classList.add("scorpinated");
                    butAdd.innerHTML = "Save";
                }
			});
		}
    }

    function autoDataFixinator(){
        if(urlContains(["pestpac.com"])){
            menuFixes();
        }

        if(urlContains(["location/detail.asp"])){
            locationDetailFixes();
        } else if(urlContains(["location/edit.asp"])){
            locationEditFixes();
        } else if(urlContains(["location/add.asp"])){
            locationAddFixes();
        } else if(urlContains(["billto/edit.asp"])){
            billToEditFixes();
        }

        function menuFixes(){
            var ppMenu = document.getElementsByClassName("pp-menu")[0];
            if(!ppMenu) return;
            var reportsLink = ppMenu.children[0].children[0].children[5].children[0];
            if(reportsLink.innerHTML === "Reports"){
                reportsLink.href = "/reports/reports.asp";
                reportsLink.style.textDecoration = "none";
            }
        }

        function billToEditFixes(){
            var editButton = document.getElementById("butEdit");
            var saveButton = document.getElementById("butSave");
            var addressInput = document.getElementById("Address");
            var streetLabel, streetSearchLabel, streetSearchInput, directionsInput;
            var phoneInput, phoneExtInput, altPhoneInput, altPhoneExtInput, mobileInput, mobileLabel;
            if(addressInput.value.indexOf(".") > -1){
                streetLabel = addressInput.parentElement.previousElementSibling;
                addressInput.value = addressInput.value.replaceAll(".", "");

                streetLabel.classList.add("scorpinated");

                editButton.classList.add("scorpinated");
                editButton.innerHTML = "Edit";

                saveButton.classList.add("scorpinated");
                saveButton.innerHTML = "Save";
            }
        }

        function locationDetailFixes(){
            var contactLinks = document.getElementsByClassName("contact-link-span");
            var urlString = window.location.search.replace("?", "");
            for(var i = 0; i < contactLinks.length; i++){
                if(contactLinks[i].hasAttribute("onclick")){
                    var makeCall = contactLinks[i].onclick;
                    // Disables calling on click
                    contactLinks[i].onclick = null;
                    contactLinks[i].style.cursor = "inherit";
                } else if(contactLinks[i].children[1]){
                    contactLinks[i].children[1].href = "https://app.pestpac.com/letters/detailEmail.asp?Mode=New&"+urlString;
                }
            }
        }

        function locationAddFixes(){
            var directionsInput = document.getElementById("Directions");
            if(directionsInput.value===""){
                directionsInput.value = "** ";
            }
        }

        function locationEditFixes(){
            var editButton = document.getElementById("butEdit");
            var saveButton = document.getElementById("butSave");
            var addressInput = document.getElementById("Address");
            var mobileInput = document.getElementById("Mobile");
            var directionsInput = document.getElementById("Directions");

            if(addressInput.value.indexOf(".") > -1){

                var streetSearchInput = document.getElementById("Street");

                var streetLabel = addressInput.parentElement.previousElementSibling;
                addressInput.value = addressInput.value.replaceAll(".", "");
                streetLabel.classList.add("scorpinated");

                var streetSearchLabel = streetSearchInput.parentElement.previousElementSibling;
                streetSearchInput.value = streetSearchInput.value.replaceAll(".", "");
                streetSearchLabel.classList.add("scorpinated");

                saveButton.classList.add("scorpinated");

                saveButton.innerHTML = "Save";

            }

            if(mobileInput.value === ""){
                var phoneInput = document.getElementById("Phone");
                var phoneExtInput = document.getElementById("PhoneExt");

                var altPhoneInput = document.getElementById("AltPhone");
                var altPhoneExtInput = document.getElementById("AltPhoneExt");

                var mobileLabel = mobileInput.parentElement.previousElementSibling;

                var phoneExt = phoneExtInput.value.toLowerCase();
                var altPhoneExt = altPhoneExtInput.value.toLowerCase();

                if(directionsInput.value.toLowerCase().includes("call reminders")) return;

                if(phoneExt.includes("cell") || phoneExt.includes("text")){
                    mobileInput.value = phoneInput.value;
                } else if(altPhoneExt.includes("cell") || altPhoneExt.includes("text")){
                    mobileInput.value = altPhoneInput.value;
                } else if(phoneInput.value !== "" && !phoneExt.includes("home") && !phoneExt.includes("call")){
                    mobileInput.value = phoneInput.value;
                } else if(altPhoneInput.value !== "" && !altPhoneExt.includes("home") && !altPhoneExt.includes("call")){
                    mobileInput.value = altPhoneInput.value;
                }

                if(mobileInput.value !== ""){
                    mobileLabel.classList.add("scorpinated");

                    saveButton.innerHTML = "Save";

                    saveButton.classList.add("scorpinated");
                }
            }

            directionsInput.value = directionsInput.value.replace("scorpions", "Scorpions");

            directionsInput.value = directionsInput.value.replace("scorpions txt reminders", "TEXT REMINDERS - Scorpions");

            directionsInput.value = directionsInput.value.replace("scorpions text reminders", "TEXT REMINDERS - Scorpions");

            if(!directionsInput.value.match(/\*/g)){

                directionsInput.value = "** "+directionsInput.value;

            }
        }
    }

    function autoContactinator(){
        if(urlContains(["location/detail.asp"])){
            GM_addValueChangeListener('autoCall', function(name, old_value, new_value, remote){
                console.log("autoCall");

                console.log(GM_getValue('autoCall'));

                if(!checkLastFocus()) return;

                console.log(new_value);

                var _callData = new_value.split("|");
                var phoneNumber = _callData[0];

                $.ajax({
                    type: "POST",
                    url:  'https://188107.voiceforpest.com:8443/WebProxy/api/sessions/' + window.localStorage.getItem("AltigenSessionID") + '/calls',
                    data: {
                        sessionId: window.localStorage.getItem("AltigenSessionID"),
                        target: phoneNumber
                    }
                })
                    .success(function(data){
                    console.log("ClickToCall");
                    window.localStorage.setItem("AltigenSessionState", "ClickToCall");
                });

            });
        }

        if(urlContains(["location/detail.asp"])){
            addContactIcons(document.getElementById("location-address-block"));
            addContactIcons(document.getElementById("billto-address-block"));

        } else if(urlContains(["godaddy.com/webmail.php"])){
            watchWebmail();

        } else if(urlContains(['/app.heymarket.com/'])){
            addPestPacIcon();

            GM_addValueChangeListener('autoText', function(name, old_value, new_value, remote){
                var _textData = new_value.split("|");
                var _textNumber = _textData[0];
                var _textAccount = _textData[1];
                var _textName = _textData[2];
                var _textBody = _textData[3];

                window.focus();

                goToContact(_textNumber, function(){
                    prepareMessage(_textBody);
                    updateContact(_textAccount, _textName);
                });

            });

        }

        function watchWebmail(){
            var observer = new MutationObserver(function(mutations){
                mutations.forEach(function(mutation){
                    if (!mutation.addedNodes) return

                    for (var i = 0; i < mutation.addedNodes.length; i++) {

                        var node = mutation.addedNodes[i]
                        if(!node.classList) return;

                        if(node.id === "view_body" && node.style.display !== "none"){
                            addContactIcons(node);
                        }
                    }

                });
            });

            observer.observe(document.getElementById("main"), {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true
            });
        }

        function goToContact(textNumber, callback){
            var inputSearchContact = document.getElementById('inputSearchContact');

             if(inputSearchContact){
                var keyUpEvent = document.createEvent("Event");
                keyUpEvent.initEvent('keyup');
                inputSearchContact.value = textNumber;
                inputSearchContact.dispatchEvent(keyUpEvent);

                var firstContactRow = document.getElementsByClassName('contact-row')[0];
                firstContactRow.children[0].click();
            }

            if(callback) callback();
        }

        function prepareMessage(messageBody){
            setTimeout(function(){
                var messageTextarea = document.getElementById('message-textarea');

                if(messageTextarea){
                    messageTextarea.value = messageBody;
                    messageTextarea.dispatchEvent(new InputEvent('input'));
                }

            }, 500);
        }

        function updateContact(account, name){
            console.log("updateContact: "+account+" "+name);
            var nameDiv = document.getElementsByClassName("name")[0];
            if(nameDiv && nameDiv.innerHTML.includes(account)){
                console.log("Do nothing "+account+" "+nameDiv.innerHTML);
            } else {
                console.log("Update Contact Info");
                var nameList = name.split(" ");
                if(nameList.length = 2){
                    name = name.split(" ")[1]+", "+name.split(" ")[0];
                }

                setTimeout(function(){
                    var optionsDot = document.getElementsByClassName("options-dot")[0];
                    if(optionsDot) optionsDot.click();
                }, 100);

                setTimeout(function(){
                    var editButton = document.getElementsByClassName("edit")[0];

                    triggerMouseEvent(editButton, "mousedown");

                    var nameInput = document.querySelectorAll('[name="contact-name"]')[0];
                    nameInput.value = account+" "+name;
                }, 100);

            }
        }

        function addContactIcons(node){
            if(!node.childNodes) return;

            for(var i = 0; i < node.childNodes.length; ++i){
                var child = node.childNodes[i];
                if (child.nodeName == "SCRIPT" || child.nodeName == "NOSCRIPT"
                    || child.nodeName == "OBJECT" || child.nodeName == "EMBED"
                    || child.nodeName == "APPLET" || child.nodeName == "IFRAME") {
                    continue;
                }

                if(child.childNodes.length > 0){
                    addContactIcons(child);
                } else if (child.nodeType == 3){
                    var phoneNumbers = phoneNumberRegExMatcher.exec(child.nodeValue);
                    if(phoneNumbers){

                        var nextChild = child.nextSibling;
                        if(nextChild && nextChild.class == "autoText-link"){
                            continue;
                        }

                        var phoneNumber =  (phoneNumbers[1] ? phoneNumbers[1] : phoneNumbers[2]) + phoneNumbers[3] + phoneNumbers[4];
                        var formattedPhoneNumber = "(" + (phoneNumbers[1] ? phoneNumbers[1] : phoneNumbers[2]) + ") " + phoneNumbers[3] + "-" + phoneNumbers[4];

                        child.splitText(phoneNumbers.index + phoneNumbers[0].length);

                        node.insertBefore(document.createTextNode("  "), node.childNodes[++i]);
                        node.insertBefore(createTextLink(phoneNumber), node.childNodes[++i]);
                        node.insertBefore(document.createTextNode("  "), node.childNodes[++i]);
                        node.insertBefore(createPhoneLink(phoneNumber), node.childNodes[++i]);

                    }
                }
            }

            function createTextLink(phoneNumber){
                var link = document.createElement("a");
                link.style.cursor = "pointer";
                link.class = "autoText-link";
                link.style.marginLeft = "4px";
                link.style.marginRight = "4px";
                var textIcon = createTextIcon();
                link.appendChild(textIcon);
                link.addEventListener("click", function(){
                    GM_setValue('autoText', phoneNumber.replace(/\D/g,'')+"|"+getContactInfo()+"||"+Date.now());
                    spinButton(textIcon, 20);
                });

                return link;

                function createTextIcon(){
                    var image = document.createElement("img");
                    image.id = "textIcon";
                    image.src = "https://rjhuffaker.github.io/heymarket_black.png";
                    image.style.margin = "-4px";
                    image.style.width = "20px";
                    image.style.height = "20px";

                    return image;
                }
            }

            function createPhoneLink(phoneNumber){
                var link = document.createElement("a");
                link.style.cursor = "pointer";
                link.class = "autoText-link";
                link.style.marginLeft = "4px";
                link.style.marginRight = "4px";
                var phoneIcon = createPhoneIcon();
                link.appendChild(phoneIcon);
                link.onclick = function(){
                    GM_setValue('autoCall', phoneNumber+"|"+Date.now());
                    spinButton(phoneIcon, 20);
                };

                return link;

                function createPhoneIcon(){
                    var image = document.createElement("img");
                    image.id = "phoneIcon";
                    image.src = "https://rjhuffaker.github.io/phone_icon.png";
                    image.style.margin = "-4px";
                    image.style.width = "20px";
                    image.style.height = "20px";

                    return image;
                }
            }

        }

        function addPestPacIcon(){

            var observer = new MutationObserver(function(mutations){
                mutations.forEach(function(mutation){

                    if (!mutation.addedNodes) return

                    for (var i = 0; i < mutation.addedNodes.length; i++) {

                        var node = mutation.addedNodes[i]
                        if(!node.classList) return;

                        if(node.id === "profile-content"){
                            var chatRoomContainer = document.getElementsByClassName("chat-room-container")[0];

                            if(!chatRoomContainer) return;

                            chatRoomContainer.appendChild(createPestPacLink());

                        }
                    }

                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true
            });

            function createPestPacLink(){
                var link = document.createElement("a");
                link.style.cursor = "pointer";
                link.style.position = "absolute";
                link.style.top = "12px";
                link.style.right = "115px";
                link.style.height = "30px";
                link.style.width = "30px";
                link.appendChild(createPestPacImage());

                link.addEventListener("click", function(){
                        var contactInfo = getHeyMarketContactInfo();
                        GM_setValue("findAccount", contactInfo+"|"+Date.now());
                        spinButton(document.getElementById("pestPacImage"), 30);
                });

                return link;

                function createPestPacImage(){
                    var image = document.createElement("img");
                    image.id = "pestPacImage";
                    image.src = "https://rjhuffaker.github.io/pestpac_logo.png";
                    image.style.height = "30px";
                    image.style.width = "30px";

                    return image;
                }
            }

            function getHeyMarketContactInfo(){
                var profileContent = document.getElementById("profile-content");
                if(!profileContent){
                    alert("profileContent not found!");
                    return;
                }
                var name = profileContent.children[2].children[0].innerHTML;
                var phone = profileContent.children[2].children[1].innerHTML;

                var nameDiv = document.getElementsByClassName("name")[0];
                var phoneLink = document.getElementsByClassName("phone")[0];

                var contactInfo;
                if(phone){
                    contactInfo = name.replace("(", "").replace(") ", "-")+" "+phone;
                } else {
                    contactInfo = name.replace("(", "").replace(") ", "-");
                }

                return contactInfo;
            }
        }

    }

    function goDaddyAddressGrabber(){
        if(urlContains(["godaddy.com/webmail.php"])){
            var observer = new MutationObserver(function(mutations){
                mutations.forEach(function(mutation){
                    if (!mutation.addedNodes) return

                    for (var i = 0; i < mutation.addedNodes.length; i++) {

                        var node = mutation.addedNodes[i];

                        if(node.id === "view_body" && node.style.display !== "none"){

                            node.appendChild(createPestPacLink());

                        }
                    }
                });
            });

            observer.observe(document.getElementById("main"), {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true
            });
        }


        if(urlContains(["app.pestpac.com"])){

            if(urlContains(["blank", "iframe"])) return;

            if(!checkLastFocus()) return;

            var contact = GM_getValue("contactInfo");

            if(contact){

                console.log("contact detected");

                console.log(contact);

                if(urlContains(["location/add.asp"])){

                    inputContactInfo(JSON.parse(contact));

                } else {

                    if(!checkLastFocus()) return;

                    window.focus();

                    window.location = "http://app.pestpac.com/location/add.asp";

                }

            } else {

                console.log("no contact");

                GM_addValueChangeListener('contactInfo', function(name, old_value, new_value, remote){

                    if(urlContains(["location/add.asp"])){

                        if(!checkLastFocus()) return;

                        window.focus();
                        console.log("New:");
                        console.log(new_value);
                        console.log("Old:");
                        console.log(old_value);

                        inputContactInfo(JSON.parse(new_value));

                    } else {

                        if(!checkLastFocus()) return;

                        window.focus();

                        window.location = "http://app.pestpac.com/location/add.asp";

                    }

                });

            }

        }


        function inputContactInfo(contact){
            console.log("updateContactInfo");

            GM_deleteValue("contactInfo");

            console.log("inputContactInfo");

            var fNameInput = document.getElementById("FName");
            var lNameInput = document.getElementById("LName");
            var addressInput = document.getElementById("Address");
            var zipInput = document.getElementById("Zip");
            var phoneInput = document.getElementById("Phone");
            var emailInput = document.getElementById("EMail");

            if(fNameInput && contact.fname){
                fNameInput.value = contact.fname;
                lNameInput.value = contact.lname;
            }

            if(contact.address){
                addressInput.value = contact.address.replace(".", "");
            }

            if(contact.zip){
                zipInput.value = contact.zip;
            }

            if(contact.phone){
                phoneInput.value = contact.phone;
            }

            if(contact.email){
                emailInput.value = contact.email;
            }

            setTimeout(function(){
                fNameInput.focus();
                fNameInput.blur();
                lNameInput.focus();
                lNameInput.blur();
                addressInput.focus();
                addressInput.blur();
                zipInput.focus();
                zipInput.blur();
                phoneInput.focus();
                phoneInput.blur();
                emailInput.focus();
                emailInput.blur();
            }, 1000);

        }

        function createPestPacLink(){
            var pestPacIcon = document.createElement("img");
            pestPacIcon.id = "pestPacIcon";
            pestPacIcon.src = "https://rjhuffaker.github.io/pestpac_logo.png";
            pestPacIcon.style.width = "20px";
            pestPacIcon.style.height = "20px";
            pestPacIcon.style.marginBottom = "-4px";

            var pestPacLink = document.createElement("a");
            pestPacLink.style.margin = "4px";
            pestPacLink.style.cursor = "pointer";
            pestPacLink.appendChild(pestPacIcon);
            pestPacLink.appendChild(document.createTextNode("Send to PestPac"));

            pestPacLink.onclick = sendContactInfo;

            return pestPacLink;

            function sendContactInfo(){
                spinButton(document.getElementById("pestPacIcon"), 20);
                GM_setValue("contactInfo", JSON.stringify(getContactInfo()));

                function getContactInfo(){
                    var contact = {};

                    Array.from(document.getElementsByTagName("tr")).forEach(
                        function(element, index, array){
                            if(element.hasAttribute("bgcolor")){
                                if(element.bgColor === "#EAF2FA"){
                                    var headerText = element.children[0].children[0].children[0].innerHTML;
                                    var contentRow = element.nextElementSibling.children[1].children[0].innerHTML;

                                    if(headerText === "Name"){
                                        contact.name = contentRow.replace(/<(?:.|\n)*?>/gm, '');

                                        if(contact.name.split(" ")){
                                            contact.fname = contact.name.split(" ")[0];
                                            contact.lname = contact.name.split(" ")[1];
                                        }

                                    } else if(headerText === "Email"){
                                        contact.email = contentRow.replace(/<(?:.|\n)*?>/gm, '');
                                    } else if(headerText === "Phone"){
                                        contact.phone = contentRow.replace(/<(?:.|\n)*?>/gm, '').replace("(", "").replace(") ", "-");
                                    } else if(headerText === "Address"){
                                        if(contentRow.split("<br>").length){
                                            contact.address = contentRow.split("<br>")[0];
                                            var zipCodeRegEx = /85[0-9]{3}/;
                                            var zipCodeRegExMatcher = new RegExp(zipCodeRegEx);

                                            if(zipCodeRegExMatcher.exec(contentRow)){
                                                contact.zip = zipCodeRegExMatcher.exec(contentRow)[0];
                                            }
                                        }

                                    } else if(headerText === "Pest concerns &amp; square footage."){
                                        contact.details = contentRow.replace(/<(?:.|\n)*?>/gm, '');
                                    }
                                }
                            }
                        });

                    contact.date = Date.now();

                    console.log(contact);

                    return contact;

                }

            }

        }

    }

    function traversinator(){
        if(!urlContains(["app.pestpac.com"])) return;

        findAccountListener();

        if(!urlContains(["location/detail.asp?LocationID"])) return;

        var advancedSearchWrapper = document.getElementsByClassName("advanced-search-wrapper")[0];
        var locationHeaderDetailLink = document.getElementById("locationHeaderDetailLink");

        if(!locationHeaderDetailLink) return;

        advancedSearchWrapper.appendChild(createTraverseDiv());

        function createTraverseDiv(){
            var traverseDiv = document.createElement("div");
            traverseDiv.id = "traverse-div";
            traverseDiv.style.width = "136px";
            traverseDiv.style.padding = "10px 0px";

            traverseDiv.appendChild(createPrevLink());
            traverseDiv.appendChild(createNextLink());

            return traverseDiv;

            function createPrevLink(){
                var prevLink = document.createElement("a");
                prevLink.classList.add("advanced-search");
                prevLink.innerHTML = "Prev";
                prevLink.href = "#";
                prevLink.style.width = "25%";
                prevLink.style.marginRight = "25%";
                prevLink.style.display = "inline-block";
                prevLink.style.textAlign = "left";

                prevLink.addEventListener("click", function(e){
                    e.preventDefault();
                    var currentID = parseInt(locationHeaderDetailLink.children[0].innerHTML);
                    traverseAccounts(false, currentID);
                });

                return prevLink;
            }

            function createNextLink(){
                var nextLink = document.createElement("a");
                nextLink.classList.add("advanced-search");
                nextLink.innerHTML = "Next";
                nextLink.href = "#";
                nextLink.style.width = "25%";
                nextLink.style.marginLeft = "25%";
                nextLink.style.display = "inline-block";
                nextLink.style.textAlign = "right";

                nextLink.addEventListener("click", function(e){
                    e.preventDefault();
                    var currentID = parseInt(locationHeaderDetailLink.children[0].innerHTML);
                    traverseAccounts(true, currentID);
                });

                return nextLink;
            }

        }

        function traverseAccounts(forward, startID){
            var newID = forward ? startID+1 : startID-1;
            goToAccount(newID);
        }

        function findAccountListener(){
            GM_deleteValue("findAccount");

            GM_addValueChangeListener("findAccount", function(name, old_value, new_value, remote){
                if(!checkLastFocus()) return;

                window.focus();

                console.log("New: "+new_value);
                console.log("Old: "+old_value);

                var accountInfo = new_value.split("|")[0].replace("(", "").replace(") ", "-");

                console.log("accountInfo "+accountInfo);

                var accountIdRegEx = /(?<!\d)\d{5,6}(?!\d)/;
                var accountIdRegExMatcher = new RegExp(accountIdRegEx);
                var accountIdMatch = null;
                accountIdMatch = accountIdRegExMatcher.exec(accountInfo);

                if(accountIdMatch){
                    console.log("goToAccount: "+accountIdMatch[0]);
                    goToAccount(accountIdMatch[0]);
                } else {
                    console.log("accountId null");

                    var phoneNumberMatch = phoneNumberRegExMatcher.exec(accountInfo);

                    if(phoneNumberMatch){
                        console.log("goToAccount: "+phoneNumberMatch[0]);
                        goToAccount(phoneNumberMatch[0]);
                    }
                }

            });

            var goToAccountId = GM_getValue("goToAccount");

            if(goToAccountId){
                GM_deleteValue("goToAccount");
                goToAccount(goToAccountId);
            }

        }
    }

    function serviceOrderDuplicator(){
        if(urlContains(["location/detail.asp"])){
            if(sessionStorage.getItem("duplicateOrder")){
                var aButton = document.getElementsByClassName("ui-button")[0];
                if(aButton){
                    setTimeout(function(){aButton.click();}, 0);
                }

                document.getElementById("butOrder").click();
            }
        }
        if(urlContains(["serviceOrder/detail.asp"])){

            var serviceCodeInput = document.getElementById("ServiceCode1");
            var unitPriceInput = document.getElementById("UnitPrice1");
            var workDateInput = document.getElementById("WorkDate");
            var workTimeInput = document.getElementById("WorkTime");
            var timeRangeInput = document.getElementById("TimeRange");
            var timeBeginInput = document.getElementById("RouteOptTime1Beg");
            var timeEndInput = document.getElementById("RouteOptTime1End");
            var targetInput = document.getElementById("TargetPest");
            var techInput = document.getElementById("Tech1");
            var directionsInput = document.getElementById("Directions");

            var choicesSpan = document.getElementById("Choices");
            var butExit = document.getElementById("butExit");

            if(choicesSpan){

                var duplicatorButton = document.createElement("button");
                duplicatorButton.classList.add("scorpinated");
                duplicatorButton.innerHTML = "Duplicate";
                duplicatorButton.style.marginRight = "8px";

                choicesSpan.insertBefore(duplicatorButton, choicesSpan.children[0]);

                duplicatorButton.addEventListener("click", function(e){
                    e.preventDefault();
                    console.log("duplicate");

                    var duplicateOrder = {};

                    duplicateOrder.serviceCode = serviceCodeInput.value;
                    duplicateOrder.unitPrice = unitPriceInput.value;
                    duplicateOrder.workDate = workDateInput.value;
                    duplicateOrder.workTime = workTimeInput.value;
                    duplicateOrder.timeRange = timeRangeInput.value;
                    duplicateOrder.timeBegin = timeBeginInput.value;
                    duplicateOrder.timeEnd = timeEndInput.value;
                    duplicateOrder.target = targetInput.value;
                    duplicateOrder.tech = techInput.value;
                    duplicateOrder.directions = directionsInput.value;

                    duplicateOrder = JSON.stringify(duplicateOrder);

                    sessionStorage.setItem("duplicateOrder", duplicateOrder);

                    butExit.click();

                });

            } else {

                var duplicateOrder = JSON.parse(sessionStorage.getItem("duplicateOrder"));
                if(!duplicateOrder) return;

                sessionStorage.removeItem("duplicateOrder");

                serviceCodeInput.focus();
                serviceCodeInput.value = duplicateOrder.serviceCode;
                serviceCodeInput.blur();

                unitPriceInput.focus();
                unitPriceInput.value = duplicateOrder.unitPrice;
                unitPriceInput.blur();

                workDateInput.focus();
                workDateInput.value = duplicateOrder.workDate;
                workDateInput.blur();

                workTimeInput.focus();
                workTimeInput.value = duplicateOrder.workTime;
                workTimeInput.blur();

                setTimeout(function(){
                    document.getElementById("ToggleOptimizationFields").click();

                    timeRangeInput.focus();
                    timeRangeInput.value = duplicateOrder.timeRange;
                    timeRangeInput.blur();

                    timeBeginInput.focus();
                    timeBeginInput.value = duplicateOrder.timeBegin;
                    timeBeginInput.blur();

                    timeEndInput.focus();
                    timeEndInput.value = duplicateOrder.timeEnd;
                    timeEndInput.blur();

                },1000);

                targetInput.focus();
                targetInput.value = duplicateOrder.target;
                targetInput.blur();

                techInput.focus();
                techInput.value = duplicateOrder.tech;
                techInput.blur();

                setTimeout(function(){
                    document.getElementById("spanDirections").click();

                    directionsInput.focus();
                    directionsInput.value = duplicateOrder.directions;
                    directionsInput.blur();
                },1000);

            }
        }
    }

    function accountListExtractinator(){
        if(urlContains(["reporting.pestpac.com/reports/serviceSetups/reportRemote.asp"])){

            console.log(GM_getValue("retrieveAccountData"));

            if(GM_getValue("retrieveAccountData") === "residential"){

                GM_deleteValue("retrieveAccountData");

                var rowList = Array.from(document.getElementsByTagName("tr"));

                var accountString = "";

                rowList.forEach(
                    function(element, index, array) {
                        if(!element) return;
                        if(element.children[0]){
                            if(element.children[0].children[0]){
                                if(element.children[0].children[0].children[0]){
                                    var account = extractAccount(element);
                                    if(account){
                                        accountString += account;
                                        if(index+1 !== array.length){
                                            accountString += "\n";
                                        }
                                    }
                                }
                            }
                        }
                    }
                );

                let api = new GithubAPI({username: 'RjHuffaker',password: 'Ph@ntom8'});

                api.setRepo('RjHuffaker', 'RjHuffaker.github.io');

                var nowDate = Date.now();

                api.setBranch('master')
                    .then( () => api.pushFiles(
                    'Commit '+nowDate,
                    [
                        {content: accountString, path: 'residential.csv'}
                    ])
                         )
                    .then(function() {
                    console.log('Files committed!');
                });

                GM_setValue("residential", accountString);

                window.close();

            }
        }

        function extractAccount(element){
            var tdList = Array.from(element.children);
            var data = "";
            tdList.forEach(
                function(element, index, array){
                    if(element.children[0]){
                        if(element.children[0].children[0]){
                            data += element.children[0].children[0].innerHTML.replace("&nbsp;", "");
                        } else {
                            data += element.children[0].innerHTML.replace("&nbsp;", "").replace("&nbsp;", "");
                        }
                    }

                    if(index+1 !== array.length){
                        data += "\t";
                    }
                }
            );

            var accountString = formatSchedule(data);

            if(accountString.includes("WEEKLY") || accountString.includes("BIWEEKLY") || accountString.includes("Report Totals") || accountString.includes("28 DAYS") || accountString.includes("3 WEEKS") || accountString.includes("6 WEEKS")){
                return false;
            } else if(accountString.split("\t").length !== 14){
                return false;
            } else if(["","CRISSANNA","DN","GABBY","JULIA","MYLISSA","RENAE","SKYE"].indexOf(accountString.split("\t")[12]) > -1){
                return false;
            } else {
                return accountString;
            }

            function formatSchedule(schedule){
                var _schedule = schedule;
                var scheduleList = [
                    {input: "1MON", output: "1\tMON\t1MON"},
                    {input: "1TUE", output: "1\tTUE\t1TUE"},
                    {input: "1WED", output: "1\tWED\t1WED"},
                    {input: "1THU", output: "1\tTHU\t1THU"},
                    {input: "1FRI", output: "1\tFRI\t1FRI"},
                    {input: "2MON", output: "2\tMON\t2MON"},
                    {input: "2TUE", output: "2\tTUE\t2TUE"},
                    {input: "2WED", output: "2\tWED\t2WED"},
                    {input: "2THU", output: "2\tTHU\t2THU"},
                    {input: "2FRI", output: "2\tFRI\t2FRI"},
                    {input: "3MON", output: "3\tMON\t3MON"},
                    {input: "3TUE", output: "3\tTUE\t3TUE"},
                    {input: "3WED", output: "3\tWED\t3WED"},
                    {input: "3THU", output: "3\tTHU\t3THU"},
                    {input: "3FRI", output: "3\tFRI\t3FRI"},
                    {input: "4MON", output: "4\tMON\t4MON"},
                    {input: "4TUE", output: "4\tTUE\t4TUE"},
                    {input: "4WED", output: "4\tWED\t4WED"},
                    {input: "4THU", output: "4\tTHU\t4THU"},
                    {input: "4FRI", output: "4\tFRI\t4FRI"}
                ];

                for(var i = 0; i < scheduleList.length; i++){
                    _schedule = _schedule.replace(scheduleList[i].input, scheduleList[i].output);
                }

                return _schedule;
            }
        }

    }

    function GithubAPI(auth) {
        let repo;
        let filesToCommit = [];
        let currentBranch = {};
        let newCommit = {};
        this.gh = new GitHub(auth);

        this.setRepo = function(userName, repoName) {
            repo = this.gh.getRepo(userName, repoName);
        };

        this.setBranch = function(branchName) {
            return repo.listBranches()
                .then((branches) => {
                let branchExists = branches.data
                .find( branch => branch.name === branchName );
                if (!branchExists) {
                    return repo.createBranch('master', branchName)
                        .then(() => {
                        currentBranch.name = branchName;
                    });
                } else {
                    currentBranch.name = branchName;
                }
            });
        };

        this.pushFiles = function(message, files) {
            return getCurrentCommitSHA()
                .then(getCurrentTreeSHA)
                .then( () => createFiles(files) )
                .then(createTree)
                .then( () => createCommit(message) )
                .then(updateHead)
                .catch((e) => {
                console.error(e);
            });
        };

        function getCurrentCommitSHA() {
            return repo.getRef('heads/' + currentBranch.name)
                .then((ref) => {
                currentBranch.commitSHA = ref.data.object.sha;
            });
        }

        function getCurrentTreeSHA() {
            return repo.getCommit(currentBranch.commitSHA)
                .then((commit) => {
                currentBranch.treeSHA = commit.data.tree.sha;
            });
        }

        function createFiles(files) {
            let promises = [];
            let length = files.length;
            for (let i = 0; i < length; i++) {
                promises.push(createFile(files[i]));
            }
            return Promise.all(promises);
        }

        function createFile(file) {
            return repo.createBlob(file.content)
                .then((blob) => {
                filesToCommit.push({
                    sha: blob.data.sha,
                    path: file.path,
                    mode: '100644',
                    type: 'blob'
                });
            });
        }

        function createTree() {
            return repo.createTree(filesToCommit, currentBranch.treeSHA)
                .then((tree) => {
                newCommit.treeSHA = tree.data.sha;
            });
        }

        function createCommit(message) {
            return repo.commit(currentBranch.commitSHA, newCommit.treeSHA, message)
                .then((commit) => {
                newCommit.sha = commit.data.sha;
            });
        }

        function updateHead() {
            return repo.updateHead(
                'heads/' + currentBranch.name,
                newCommit.sha
            );
        }

    }

})();