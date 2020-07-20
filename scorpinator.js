// ==UserScript==
// @name         Scorpinator
// @namespace    http://RjHuffaker.github.io
// @version      3.010
// @updateURL    http://RjHuffaker.github.io/scorpinator.js
// @description  Provides various helper functions to PestPac, customized to our particular use-case.
// @author       You
// @match        app.pestpac.com/*
// @match        https://app.pestpac.com/*
// @match        reporting.pestpac.com/reports/serviceSetups/reportRemote.asp
// @match        *app.heymarket.com/*
// @match        *secure.helpscout.net/conversation/*
// @match        *azpestcontrol.services*
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

    var activeSetups = [];

    var addSetupTask = false;

    var excludedWeekDays = [];

    var excludedWeeks = [];

    var excludedTechs = [];

    var PROXMODE = "list";

    var PROXMAP;

    var PROXMAPMARKERS = [];

    var PROXLISTSIZE = 50;

    var GROUPBY = "GENERAL";

    var WEEKDAYS = {
        "MON": { name: "Monday", excluded: false },
        "TUE": { name: "Tuesday", excluded: false },
        "WED": { name: "Wednesday", excluded: false },
        "THU": { name: "Thursday", excluded: false },
        "FRI": { name: "Friday!", excluded: false }
    };

    var WEEKS = {
        "1": { name: "Week 1", excluded: false },
        "2": { name: "Week 2", excluded: false },
        "3": { name: "Week 3", excluded: false },
        "4": { name: "Week 4", excluded: false }
    };

    var MONTHFILTER = {
        name: "Month",
        options: {
            "Any": { name: "Any", checked: true },
            "Odd": { name: "Odd", checked: false },
            "Even": { name: "Even", checked: false },
            "Specific": {
                name: "Specific",
                checked: false,
                options: {
                    "JAN": { name: "JAN", checked: true },
                    "FEB": { name: "FEB", checked: false },
                    "MAR": { name: "MAR", checked: false },
                    "APR": { name: "APR", checked: false },
                    "MAY": { name: "MAY", checked: false },
                    "JUN": { name: "JUN", checked: false },
                    "JUL": { name: "JUL", checked: false },
                    "AUG": { name: "AUG", checked: false },
                    "SEP": { name: "SEP", checked: false },
                    "OCT": { name: "OCT", checked: false },
                    "NOV": { name: "NOV", checked: false },
                    "DEC": { name: "DEC", checked: false }
                }
            }
        }
    };

    var DAILYTOTALS = {
        "450": { name: "450", excluded: false },
        "500": { name: "500", excluded: false },
        "550": { name: "550", excluded: false },
        "600": { name: "600", excluded: false },
        "650": { name: "650", excluded: false },
        "700": { name: "700", excluded: false },
        "750": { name: "750", excluded: false },
        "800": { name: "800", excluded: false },
        "850": { name: "850", excluded: false },
        "900": { name: "900", excluded: false },
        "950": { name: "950", excluded: false },
        "1000": { name: "1000", excluded: false },
        "1050": { name: "1050", excluded: false },
        "1100": { name: "1100", excluded: false },
        "1150": { name: "1150", excluded: false },
        "1200": { name: "1200", excluded: false },
        "1250": { name: "1250", excluded: false },
        "1300": { name: "1300", excluded: false },
        "1350": { name: "1350", excluded: false },
        "1400": { name: "1400", excluded: false },
        "1450": { name: "1450", excluded: false },
        "1500": { name: "1500", excluded: false },
        "1550": { name: "1550", excluded: false },
        "1600": { name: "1600", excluded: false }
    };

    var AGES = {
        "> 5 Years": { name: "> 5 Years", excluded: false },
        "< 5 Years": { name: "< 5 Years", excluded: false },
        "< 4 Years": { name: "< 4 Years", excluded: false },
        "< 3 Years": { name: "< 3 Years", excluded: false },
        "< 2 Years": { name: "< 2 Years", excluded: false },
        "< 1 Year": { name: "< 1 Year", excluded: false },
        "< 9 Months": { name: "< 9 Months", excluded: false },
        "< 6 Months": { name: "< 6 Months", excluded: false },
        "< 3 Months": { name: "< 3 Months", excluded: false },
        "< 1 Month": { name: "< 1 Month", excluded: false }
    };

    var CITIES = [
        { name: "Phoenix", branch: "35" },
        { name: "New River", branch: "35" },
        { name: "Gold Canyon", branch: "35" },
        { name: "Apache Junction", branch: "35" },
        { name: "Casa Grande", branch: "35" },
        { name: "Arizona City", branch: "35" },
        { name: "Coolidge", branch: "35" },
        { name: "Florence", branch: "35" },
        { name: "Maricopa", branch: "35" },
        { name: "San Tan Valley", branch: "35" },
        { name: "Queen Creek", branch: "35" },
        { name: "Casa Grande", branch: "35" },
        { name: "Mesa", branch: "35" },
        { name: "Chandler", branch: "35" },
        { name: "Gilbert", branch: "35" },
        { name: "Scottsdale", branch: "35" },
        { name: "Paradise Valley", branch: "35" },
        { name: "Rio Verde", branch: "35" },
        { name: "Fountain Hills", branch: "35" },
        { name: "Tempe", branch: "35" },
        { name: "Glendale", branch: "35" },
        { name: "Avondale", branch: "35" },
        { name: "Buckeye", branch: "35" },
        { name: "Cave Creek", branch: "35" },
        { name: "El Mirage", branch: "35" },
        { name: "Goodyear", branch: "35" },
        { name: "Laveen", branch: "35" },
        { name: "Litchfield Park", branch: "35" },
        { name: "Peoria", branch: "35" },
        { name: "Tolleson", branch: "35" },
        { name: "Waddell", branch: "35" },
        { name: "Sun City", branch: "35" },
        { name: "Surprise", branch: "35" },
        { name: "Sun City West", branch: "35" },
        { name: "Carefree", branch: "35" },
        { name: "Red Rock", branch: "38" },
        { name: "Green Valley", branch: "38" },
        { name: "Sahuarita", branch: "38" },
        { name: "Vail", branch: "38" },
        { name: "Marana", branch: "38" },
        { name: "Tucson", branch: "38" }
    ];

    var TECHNICIANS = {};

    var SCHEDULES = ["1MON","1TUE","1WED","1THU","1FRI", "2MON","2TUE","2WED","2THU","2FRI","3MON","3TUE","3WED","3THU","3FRI","4MON","4TUE","4WED","4THU","4FRI"];

    var ROUTELIST = [];

    var PHONENUMBERS = [];

    var phoneNumberRegEx = /(?:^|[\s\(])(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?!\.\S|[^\s\)x\.])/;

    var phoneNumberRegExMatcher = new RegExp(phoneNumberRegEx);

    class ActiveSetup {
        constructor(setup) {
            this.account = setup.account;
            this.address = setup.address;
            this.city = setup.city;
            this.state = setup.state;
            this.zipcode = setup.zipcode;
            this.latitude = parseFloat(setup.latitude);
            this.longitude = parseFloat(setup.longitude);
            this.division = setup.division;
            this.service = setup.service;
            this.week = setup.week;
            this.weekDay = setup.weekDay;
            this.schedule = setup.schedule;
            this.tech = setup.tech;
            this.age = setup.age;
            this.total = setup.total;
            this.months = getMonths(setup.schedule);
        }
    }

    class technician {
        constructor(name){
            this.name = name;
            this.excluded = false;
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

        return 7918 * Math.asin(Math.sqrt(a)); // 2 * R; R = 3959 miles
    };

    initializeScorpinator();

    function initializeScorpinator(){

        var excludedList = ["blank.asp", "iframe", "invoice", "appointment", "secure.helpscout.net", "reporting.pestpac.com", "inviteUser.asp", "linkproxy.asp", "preserveSession.asp", "serviceOrder/post", "PostNote.asp"];

        if(urlContains(["app.pestpac.com"]) && !urlContains(excludedList)){

            retrieveCSS();

            focusListener();

            scorpModal();

            checkLogin(function(loginData){
                if(loginData){
                    pestpacValidated();
                } else {
                    loginPrompt();
                }
            });
        }

        if(urlContains(["app.pestpac.com/appointment/dialog/changeOrder.asp"])){
            checkLogin(function(loginData){
                if(loginData){
                    retrieveCSS();
                    appointmentDialogFixes();
                }
            });
        }

        if(urlContains(["app.pestpac.com/appointment"]) && !urlContains(["iframe"])){
            checkLogin(function(loginData){
                if(loginData){
                    appointmentFixes();
                }
            });
        }

        if(urlContains(["app.heymarket.com/chats"])){
            checkLogin(function(loginData){
                if(loginData) heymarket_sockets();
            });
        }

        if(urlContains(["secure.helpscout.net/conversation"])){
            helpscout_sockets();
        }

        if(urlContains(["reporting.pestpac.com/reports/serviceSetups/reportRemote.asp"])){
            checkLogin(function(loginData){
                if(loginData) accountListExtractinator();
            });
        }

        if(urlContains(["location/detail.asp"])){
            checkLogin(function(loginData){
                if(loginData) monitorInvoiceDetail();
            });
        }

        if(urlContains(["location/add.asp", "location/edit.asp"])){
            checkLogin(function(loginData){
                if(loginData) monitorAddress();
            });
        }

        if(urlContains(["iframe/billHist.asp"]) && urlContains(["scorpinator=0"])){
            checkLogin(function(loginData){
                if(loginData) monitorHistory();
            });
        }

        if(urlContains(["invoice/detail.asp"]) && urlContains(["scorpinator=0"])){
            checkLogin(function(loginData){
                if(loginData) monitorInvoice();
            });
        }

        if(urlContains(["azpestcontrol.services"])){
            checkLogin(function(loginData){

            });
        }

    }

    function pestpacValidated(){
        retrieveGoogleMaps();
        retrieveActiveSetups();
        traversinator();
        autoGenerator();
        autoTaskinator();
        autoDataFixinator();
        autoSetupinator();
        autoWelcomator();
        autoEmailinator();
        pestpac_sockets();
        paymentNotificator();
        serviceOrderDuplicator();
    }

    function getLoginData(){
        var loginData = GM_getValue("currentUser") ? GM_getValue("currentUser") : localStorage.getItem("currentUser");

        if(!loginData){
            return false;
        }

        try {
            loginData = JSON.parse(loginData);
        } catch(e){
            console.error(e);

            GM_deleteValue("currentUser");
            localStorage.removeItem("currentUser");

            return false;
        }

        return loginData;
    }

    function checkLogin(callback){

        var loginData = getLoginData();

        if(loginData){
            if(loginData.token){
                checkToken(loginData.token, function(response){
                    if(response){
                        if(callback) callback(loginData);
                    } else {
                        if(callback) callback(false);
                    }
                });
            } else {
                if(callback) callback(false);
            }
        } else {
            if(callback) callback(false);
        }
    }

    function checkToken(token, callback){
        httpGetAsync(`https://azpestcontrol.services/api/users.php?token=`+token, function(response){
            if(callback) callback(JSON.parse(response));
        });
    }

    function loginPrompt(){

        var modalData = {
            height: "auto",
            width: "300px",
            title: "Scorpinator Login",
            userLogin: true,
            createSetup: false,
            updateSetup: false,
            followUp: false,
            showHistory: false
        };

        toggleScorpModal(modalData);

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

    function retrieveMapsApiKey(callback){
        var loginData = getLoginData();

        if(loginData){
            httpGetAsync("https://azpestcontrol.services/api/googleMaps.php?token="+loginData.token, function(response){
                if(callback) callback(response);
            });
        }
    }

    function retrieveGoogleMaps(){
        retrieveMapsApiKey(function(key){
            if(typeof google === 'object' && typeof google.maps === 'object'){
                console.log("maps api loaded");
            } else {
                var maps = window.document.createElement('script');
                maps.language = "javascript";
                maps.type = "text/javascript";
                maps.src = 'https://maps.googleapis.com/maps/api/js?key='+key;
                document.getElementsByTagName("HEAD")[0].appendChild(maps);
            }
        });
    }

    function retrieveActiveSetups(){
        var loginData = getLoginData();

        if(loginData){
            httpGetAsync("https://azpestcontrol.services/api/activeSetups.php?token="+loginData.token, function(response){
                var responseList = JSON.parse(response);
                for(var i = 0; i < responseList.length; i++){
                    activeSetups.push(new ActiveSetup(responseList[i]));
                }

                addProximinator();

            });
        } else {
            alert("Scorpinator Login Expired!!");
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

    function xmlToJson(xml) {
        // Create the return object
        if(!xml) return;

        var obj = {};

        if (xml.nodeType == 1) { // element
            // do attributes
            if (xml.attributes.length > 0) {
                obj["@attributes"] = {};
                for (var j = 0; j < xml.attributes.length; j++) {
                    var attribute = xml.attributes.item(j);
                    obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
                }
            }
        } else if (xml.nodeType == 3) { // text
            obj = xml.nodeValue;
        }

        // do children
        if (xml.hasChildNodes()) {
            for(var i = 0; i < xml.childNodes.length; i++) {

                var item = xml.childNodes.item(i);
                var nodeName = item.nodeName;

                if (typeof(obj[nodeName]) === "undefined") {
                    if(nodeName === "#text"){
                        obj = xmlToJson(item);
                    } else {
                        obj[nodeName] = xmlToJson(item);
                    }
                } else {
                    if (typeof(obj[nodeName].push) === "undefined") {
                        var old = obj[nodeName];
                        obj[nodeName] = [];
                        obj[nodeName].push(old);
                    }
                    obj[nodeName].push(xmlToJson(item));
                }
            }
        }
        return obj;
    };

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    function httpGetAsync(theUrl, callback) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
                callback(xmlHttp.responseText);
            }
        };
        xmlHttp.open("GET", theUrl, true); // true for asynchronous
        xmlHttp.send(null);
    }

    function httpPost(theUrl, data, callback){
        var xmlHttp = new XMLHttpRequest();
        var mimeType = "application/x-www-form-urlencoded";
        xmlHttp.open('POST', theUrl, true);  // true for asynchronous

        xmlHttp.setRequestHeader('Content-Type', mimeType);

        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
                callback(xmlHttp.responseText);
            }
        };

        xmlHttp.send(data);
    }

    function httpGetXML(theUrl, callback) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
                callback(xmlToJson(xmlHttp.responseXML));
            }
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

    function toggleDisplay(elements, display){
        elements.forEach(function(el){
            if(el){
                el.style.display = display
            };
        });
    }

    function spinButton(elem, size){
        var _count = 0;
        var spinterval = setInterval(spinner, 20);
        function spinner(){
            if(_count <= 20){
                var growth = _count <= 10 ? Math.abs(1+_count*.1) : Math.abs(3-_count*.1);
                elem.style.margin = "-"+Math.abs(growth*size*.25)+"px";
                elem.style.width = Math.round(growth*size)+"px";
                elem.style.height = Math.round(growth*size)+"px";
                elem.style.transform = "rotate("+Math.abs(_count*18)+"deg)";
                _count++;
            } else {
                clearInterval(spinterval);
            }
        }
    }

    function alignLeftRight(leftDiv, rightDiv){
        leftDiv.style.position = "absolute";
        leftDiv.style.width = "50%";
        leftDiv.style.left = "0";

        rightDiv.style.position = "absolute";
        rightDiv.style.width = "50%";
        rightDiv.style.right = "0";
        rightDiv.style.textAlign = "right";

        var wrapperDiv = document.createElement("div");
        wrapperDiv.style.position = "relative";
        wrapperDiv.style.height = "2em";
        wrapperDiv.appendChild(leftDiv);
        wrapperDiv.appendChild(rightDiv);

        return wrapperDiv;
    }

    function getFutureDate(startDate, daysOut){
        var newDate = new Date();

        if(startDate){
            newDate = new Date(startDate);
        }

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

    function getDifferenceInDays(firstDate, secondDate){

        if(secondDate){
            var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
            if(firstDate){
                firstDate = new Date(firstDate);
            } else {
                firstDate = new Date();
            }
            secondDate = new Date(secondDate);

            return Math.round(Math.abs((firstDate.getTime() - secondDate.getTime())/(oneDay)));
        } else {
            console.log('Error: differenceInDays: firstDate: '+firstDate+", secondDate: "+secondDate);
        }
    }


    function getReadableDate(input){
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

        var date = input.split("/")[1];

        if(date.length===1){
            date = date
                .replace("1", "1st").replace("2", "2nd").replace("3", "3rd").replace("4", "4th")
                .replace("5", "5th").replace("6", "6th").replace("7", "7th").replace("8", "8th").replace("9", "9th");
        } else {
            date = date
                .replace("01", "1st").replace("02", "2nd").replace("03", "3rd").replace("04", "4th").replace("05", "5th")
                .replace("06", "6th").replace("07", "7th").replace("08", "8th").replace("09", "9th").replace("10", "10th")
                .replace("11", "11th").replace("12", "12th").replace("13", "13th").replace("14", "14th").replace("15", "15th")
                .replace("16", "16th").replace("17", "17th").replace("18", "18th").replace("19", "19th").replace("20", "20th")
                .replace("21", "21st").replace("22", "22nd").replace("23", "23rd").replace("24", "24th").replace("25", "25th")
                .replace("26", "26th").replace("27", "27th").replace("28", "28th").replace("29", "29th").replace("30", "30th")
                .replace("31", "31st");
        }

        return month+" "+date;
    }

    function getWeekday(input){
        var date = new Date(input);
        return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][date.getDay()];
    }

    function getCurrentReadableTime(){
        var hours = new Date().getHours();
        hours = hours<13?hours:hours-12;

        var minutes = new Date().getMinutes();
        minutes = minutes>10?minutes:"0"+minutes;

        return hours+":"+minutes;
    }

    function getCurrentReadableDate(withZeroes){
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth()+1;
        var yy = today.getFullYear().toString().substring(2);


        if(dd<10 && withZeroes) {
            dd = '0'+dd;
        }

        if(mm<10 && withZeroes) {
            mm = '0'+mm;
        }

        return mm+'/'+dd+'/'+yy;
    }

    function convertMinutesToHours(mins){
        let h = Math.floor(mins / 60);
        let m = mins % 60;
        h = h < 10 ? "0" + h : h;
        m = m < 10 ? "0" + m : m;
        return h+":"+m;
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
            accountName = addressBlock.children[0].children[1].children[0].children[0].innerHTML.replace("amp; ","");
        } else {
            accountId = "";
            accountName = "";
        }

        return { id: accountId, name: accountName, phoneNumbers: PHONENUMBERS };
    }

    function getLocationAddress(){
        var address = {};

        var addressTable = document.getElementById("location-address-block");
        var addressList = [];
        if(addressTable){
            var addressTableRows = addressTable.children[0].children;
            for(var i = 0; i < addressTableRows.length; i++){
                var addressRow = addressTableRows[i];
                if(!addressRow.children[0].children[0]){
                    var rowText = addressRow.children[0].innerHTML.replace(/\#([^#]+)/, "");  // Filters out lines starting with "#"
                    addressList.push(rowText);
                }
            }
            if(addressList.length === 2){
                address.street = addressList[0];
                address.city = addressList[1].split(", ")[0];
                address.state = addressList[1].split(", ")[1].split(" ")[0];
                address.zipcode = addressList[1].split(", ")[1].split(" ")[1];
            } else if(addressList.length > 2){
                address.street = addressList[0];
                var thirdline;
                if(addressList[1].split(", ").length > 1){
                    thirdline = addressList[1].split(", ")
                } else {
                    address.suite = addressList[1];
                    thirdline = addressList[2].split(", ")
                }
                address.city = thirdline[0];
                address.state = thirdline[1].split(" ")[0];
                address.zipcode = thirdline[1].split(" ")[1];
            }

        } else {
            address.street = document.getElementById("Address").value.trim();
            address.suite = document.getElementById("Address2").value.trim();
            address.city = document.getElementById("City").value.trim();
            address.state = document.getElementById("State").value.trim();
            address.zipcode = document.getElementById("Zip").value.trim();
        }

        address.timestamp = Date.now();

        return address;
    }

    function getBranch(city){
        for(var i = 0; i < CITIES.length; i++){
            if(city === CITIES[i].name){
                return CITIES[i].branch;
            }
        }
    }

    function getMonths(schedule){
        if(schedule.length === 5 && schedule[4] === "M"){
            return "111111111111";
        } else if(schedule.includes("BJ")){
            return "101010101010";
        } else if(schedule.includes("BF")){
            return "010101010101";
        } else if(schedule.includes("QJ")){
            return "100100100100";
        } else if(schedule.includes("QF")){
            return "010010010010";
        } else if(schedule.includes("QM")){
            return "001001001001";
        }
    }

    function getNextServiceDate(startDate, schedule, frequency){
        var daysOut,
        day = schedule.substring(1,4),
        week = parseInt(schedule.substring(0,1));
        var newDate = new Date(startDate);

        frequency = frequency.toUpperCase();

        if(day=="Sun") day = 0;
        if(day=="Mon") day = 1;
        if(day=="Tue") day = 2;
        if(day=="Wed") day = 3;
        if(day=="Thu") day = 4;
        if(day=="Fri") day = 5;
        if(day=="Sat") day = 6;

        if(frequency=="M") daysOut = 20;
        if(frequency=="B") daysOut = 45;
        if(frequency=="Q") daysOut = 75;

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

            if(ordersTableRows[row])
            if(!ordersTableRows[row].classList.contains("noncollapsible")){
                var orderColumns = ordersTableRows[row].children;

                var popuptext = ordersTableRows[row].getAttribute("popuptext");

                serviceOrder.id = orderColumns[3].children[0].innerHTML.trim();
                serviceOrder.date = removeLeadingZeroes(orderColumns[4].innerHTML.slice(14,22));
                serviceOrder.day = getWeekDay(orderColumns[4].innerHTML.slice(5,8));
                serviceOrder.tech = orderColumns[9].children[0].innerHTML.trim().replace("&nbsp;","");

                if(orderColumns[10].children[0]){
                    serviceOrder.service = orderColumns[10].children[0].innerHTML.trim().replace("&nbsp;","");
                } else {
                    serviceOrder.service = orderColumns[10].innerHTML.trim().replace("&nbsp;","");
                }

                if(popuptext){
                    serviceOrder.timeRange = popuptext.replace(/<\/?[^>]+(>|$)/g, "").split("Time Range:&nbsp;").pop().split("Targets:")[0];
                    serviceOrder.orderInstructions = popuptext.replace(/<\/?[^>]+(>|$)/g, "").split("Order Instructions:&nbsp;").pop().split("Location Instructions:")[0];
                    serviceOrder.locationInstructions = popuptext.replace(/<\/?[^>]+(>|$)/g, "").split("Location Instructions:&nbsp;").pop();
                    if(popuptext.includes("Start Time:")){
                        serviceOrder.startTime = popuptext.replace(/<\/?[^>]+(>|$)/g, "").split("Start Time:").pop().split("End Time:")[0].trim();
                        serviceOrder.endTime = popuptext.replace(/<\/?[^>]+(>|$)/g, "").split("End Time:").pop().split("Last Screen Viewed:")[0].trim();
                    }
                }

            }

            return serviceOrder;
        }

        function getWeekDay(abrev){
            if(abrev==="Mon"){
                return "Monday";
            } else if(abrev==="Tue"){
                return "Tuesday";
            } else if(abrev==="Wed"){
                return "Wednesday";
            } else if(abrev==="Thu"){
                return "Thursday";
            } else if(abrev==="Fri"){
                return "Friday";
            } else if(abrev==="Sat"){
                return "Saturday";
            } else if(abrev==="Sun"){
                return "Sunday";
            }
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
                serviceSetup.lastDate = setupColumns[5].innerHTML.replace("&nbsp;", "");
                serviceSetup.nextDate = setupColumns[6].innerHTML.replace("&nbsp;", "");
                serviceSetup.price = setupColumns[8].innerHTML.replace("&nbsp;", "");
                serviceSetup.active = setupTableRows[row].getAttribute("bgcolor")==="#ffffff";
            }

            return serviceSetup;
        }
    }

    function getGuesstimate(zData){

        var basePrice = 100;

        var homeSqFt = zData.finishedSqFt ? zData.finishedSqFt : 0;
        var lotSqFt = zData.lotSizeSqFt ? zData.lotSizeSqFt : 0;

        var PRICE_INCREMENT = 10;

        var AVERAGE_HOME_MIN = 1500;
        var AVERAGE_HOME_MAX = 3000;
        var HOME_SQFT_INCREMENT = 500;

        var AVERAGE_LOT_MIN = 5445;       // 1/8 Acre
        var AVERAGE_LOT_MAX = 10890;      // 1/4 Acre
        var LOT_SQFT_INCREMENT = 10890;   // 1/4 Acre

        if(homeSqFt){
            if(homeSqFt < AVERAGE_HOME_MIN && lotSqFt < AVERAGE_LOT_MIN){
                basePrice -= 10;
            }

            if(homeSqFt > AVERAGE_HOME_MAX){
                basePrice += Math.ceil((homeSqFt - AVERAGE_HOME_MAX) / HOME_SQFT_INCREMENT) * PRICE_INCREMENT;
            }
        }

        if(lotSqFt){
            if(lotSqFt < AVERAGE_LOT_MIN && homeSqFt < AVERAGE_HOME_MIN){
                basePrice -= 10;
            }

            if(lotSqFt > AVERAGE_LOT_MAX){
                basePrice += Math.ceil((lotSqFt - AVERAGE_LOT_MAX) / LOT_SQFT_INCREMENT) * PRICE_INCREMENT;
            }
        }

        return getPricing(basePrice);

        function getPricing(base){
            var INITIAL = 1;
            var ONETIME = 1.3;
            var QUARTERLY = .95;
            var BIMONTHLY = .7;
            var MONTHLY = .5;

            return {
                initial: prettifyPrice(base * INITIAL),
                oneTime: prettifyPrice(base * ONETIME),
                quarterly: prettifyPrice(base * QUARTERLY),
                bimonthly: prettifyPrice(base * BIMONTHLY),
                monthly: prettifyPrice(base * MONTHLY)
            };

            function prettifyPrice(price){
                var roundedPrice = Math.round(price/5)*5;

                var priceString = roundedPrice.toString();

                if(priceString.substr(priceString.length-1) === "0"){
                    return parseInt(priceString)-1;
                } else {
                    return parseInt(priceString);
                }

            }

        }

    }

    function monitorAddress(){

        var addressInput = document.getElementById("Address");
        var cityInput = document.getElementById("City");
        var stateInput = document.getElementById("State");
        var zipInput = document.getElementById("Zip");
        var branchInput = document.getElementById("BranchID");

        var mapMessage = document.getElementById("map_message");

        addressInput.addEventListener("blur", checkAddress);

        cityInput.addEventListener("blur", checkAddress);

        stateInput.addEventListener("blur", checkAddress);

        zipInput.addEventListener("blur", checkAddress);

        if(mapMessage.innerHTML === "Address not found; position is approximate"){

            checkAddress();

        }

        function checkAddress(){

            var address = addressInput.value.trim();
            var city = cityInput.value.trim();
            var state = stateInput.value.trim();
            var zip = zipInput.value.trim();

            if(address && city && state && zip){

                branchInput.value = getBranch(city);

                var butSave = document.getElementById("butSave");
                var butAdd = document.getElementById("butAdd");
                var mapMessage = document.getElementById("map_message");

                fetchGeocodes(function(data){
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

                    getNearestActiveSetups(data, function(dataList){
                        setDivision(dataList);
                    });

                });

            }

        }

    }

    function monitorInvoiceDetail(){

        GM_deleteValue("InvoiceDetail");

        GM_addValueChangeListener("InvoiceDetail", function(name, old_value, new_value, remote){

            var invoiceDetail = new_value;

            if(invoiceDetail){

                var historyDiv = document.getElementById("show-history")

                historyDiv.appendChild(document.createElement("hr"));

                invoiceDetail = JSON.parse(invoiceDetail);

                var invoiceTable = formatHistory(invoiceDetail)

                historyDiv.appendChild(invoiceTable);

            }

        });

    }

    function monitorHistory(){

        var body = document.getElementsByTagName("body")[0];

        var iframe = document.createElement("IFRAME");

        iframe.style.display = "none";

        body.appendChild(iframe);

        var invoiceLinks = [];

        Array.from(document.getElementsByTagName("a")).forEach(
            function(element, index, array){

                var href = element.href;

                if(href){

                    var hrefMatch = href.match(/'(.*?)'/);

                    if(hrefMatch){
                        var hrefMatch = hrefMatch[1];

                        if(hrefMatch.includes("invoice")){

                            invoiceLinks.push("https://app.pestpac.com"+hrefMatch+"scorpinator=0");

                        }
                    }
                }
            });

        GM_setValue("InvoiceLinks", invoiceLinks.toString());

        GM_setValue("InvoiceDetails", "[]");

        if(invoiceLinks[0]) iframe.contentWindow.location.href = invoiceLinks[0];

    }

    function monitorInvoice(){

        var invoiceLinks = GM_getValue("InvoiceLinks");
        if(invoiceLinks){
            invoiceLinks = GM_getValue("InvoiceLinks").split(",");
        }

        var invoiceDetails = GM_getValue("InvoiceDetails");
        if(invoiceDetails){
            invoiceDetails = JSON.parse(GM_getValue("InvoiceDetails"));
        } else {
            invoiceDetails = [];
        }

        sessionStorage.removeItem("InvoiceLinks");

        sessionStorage.removeItem("InvoiceDetails");

        if(invoiceLinks.length < 1){ console.log("no list: "+invoiceLinks); }

        invoiceLinks.forEach(function(element, index, array){

            if(element === window.location.href){

                var invoice = {};

                var serviceCode1 = document.getElementById("ServiceCode1");

                if(serviceCode1){

                    invoice.serviceCode1 = serviceCode1.value;

                    var description1 = document.getElementById("Description1");

                    var unitPrice1 = document.getElementById("UnitPrice1");

                    var workDate  = document.getElementById("WorkDate");

                    var tech1 = document.getElementById("Tech1");

                    var directions = document.getElementsByName("Directions")[0];

                    var fieldComment = document.getElementById("FieldComment");

                    if(description1) invoice.description1 = description1.value;

                    if(unitPrice1) invoice.unitPrice1 = unitPrice1.value;

                    if(workDate) invoice.workDate = workDate.value;

                    if(tech1) invoice.technician = tech1.value;

                    if(directions) invoice.locationInstructions = directions.value;

                    if(fieldComment) invoice.techComment = fieldComment.value;

                //    invoiceDetails.push(invoice);

                    GM_setValue("InvoiceDetail", JSON.stringify(invoice));

                //    GM_setValue("InvoiceDetails", JSON.stringify(invoiceDetails));

                }

                GM_setValue("InvoiceLinks", invoiceLinks.toString());

                index++;

                if(index < 5 && invoiceLinks[index]){

                    window.location.href = invoiceLinks[index];

                }

            }

        });

    }

    function formatHistory(invoice){
        var tableData = { rows: [] };

        tableData.rows.push(
            { cells: [
                { content: displayText( { bold: invoice.workDate+" --- "+invoice.serviceCode1+" --- $"+invoice.unitPrice1+" --- "+invoice.description1 } ) }
            ] }
        );

        tableData.rows.push(
            { cells: [
                { content: displayText( { bold: "Location: ", plain: invoice.locationInstructions } ) }
            ] }
        );

        tableData.rows.push(
            { cells: [
                { content: displayText( { bold: "Tech Notes ("+invoice.technician+"): ", plain: invoice.techComment } ) }
            ] }
        );

        return createTable(tableData);
    }

    function getHistoryTable(){
        var invoiceDetails = JSON.parse(GM_getValue("InvoiceDetails"));

        var tableData = { rows: [] };

        invoiceDetails.forEach(function(invoice){

            tableData.rows.push(
                { cells: [
                    { content: displayText( { bold: invoice.workDate+" --- "+invoice.serviceCode1+" --- $"+invoice.unitPrice1+" --- "+invoice.description1 } ) }
                ] }
            );

            tableData.rows.push(
                { cells: [
                    { content: displayText( { bold: "Location: ", plain: invoice.locationInstructions } ) }
                ] }
            );

            tableData.rows.push(
                { cells: [
                    { content: displayText( { bold: "Tech Notes ("+invoice.technician+"): ", plain: invoice.techComment } ) }
                ] }
            );

        });

        return createTable(tableData);
    }

    function addToHistoryDiv(invoiceDetail){

        var historyDiv = document.getElementById("historyDiv");

        if(historyDiv){
            var invoiceText = displayText( { bold: invoiceDetail.workDate+" --- "+invoiceDetail.serviceCode1+" --- $"+invoiceDetail.unitPrice1+" --- "+invoiceDetail.description1 } );
            historyDiv.appendChild(invoiceText);
        }
    }

    function showHistoryModal(){
        if(!checkLastFocus()) return;

        var historyDiv = document.createElement("div");
        historyDiv.id = "historyDiv";

        historyDiv.appendChild(displayText( { title: "Service History" } ));

        var invoiceDetails = JSON.parse(GM_getValue("InvoiceDetails"));

        var tableData = { rows: [] }

        invoiceDetails.forEach(function(invoice){

            tableData.rows.push(
                { cells: [
                    { content: displayText( { bold: invoice.workDate+" --- "+invoice.serviceCode1+" --- $"+invoice.unitPrice1+" --- "+invoice.description1 } ) }
                ] }
            );

            tableData.rows.push(
                { cells: [
                    { content: displayText( { bold: "Location: ", plain: invoice.locationInstructions } ) }
                ] }
            );

            tableData.rows.push(
                { cells: [
                    { content: displayText( { bold: "Tech Notes ("+invoice.technician+"): ", plain: invoice.techComment } ) }
                ] }
            );

        });

        var scorpModalContent = document.getElementById("scorp-modal-content");

        var historyTable = createTable(tableData);

        historyDiv.appendChild(historyTable);

        console.log(historyDiv);

        scorpModalContent.appendChild(historyDiv);

        var modalData = {
            height: "auto",
            width: "750px",
            title: "History"
        };

        toggleScorpModal(modalData);
    }

    function showHistoryConfirm(){

        var invoiceDetails = JSON.parse(GM_getValue("InvoiceDetails"));

        var invoiceText = "SERVICE HISTORY: \n";

        invoiceDetails.forEach(function(invoice){
            invoiceText = invoiceText
                +invoice.workDate+" --- "+invoice.serviceCode1+" --- $"+invoice.unitPrice1+" --- "+invoice.description1
                +"\nLocation: "+invoice.locationInstructions
                +"\nTech Notes ("+invoice.technician+"): "+invoice.techComment
                +"\n##################################################\n";
        });

        var historyConfirm = confirm(invoiceText);

        if(historyConfirm) GM_deleteValue("InvoiceDetails");

        return historyConfirm;

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
                    var newWindow = window.open("https://app.pestpac.com"+newURL);
                    quickSearchField.value = "";
                    document.getElementsByClassName("actions")[0].children[1].click();
                } else {
                    window.location.href="https://app.pestpac.com"+newURL;
                }
            }

            if(i > 10) clearInterval(clickInterval);
        }, 100);
    }

    function goToNotes(accountId){
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
                var newURL = pattern.exec(onclickText)[0].replaceAll("'", "").replace("location/detail.asp","notes/default.asp");

                window.location.href="https://app.pestpac.com"+newURL;

            }

            if(i > 10) clearInterval(clickInterval);
        }, 100);
    }

    function focusListener(){
        if(urlContains(["app.pestpac.com"]) && !urlContains(["appointment"])){

            recordFocus();

            window.addEventListener("focus", function(event){
                recordFocus();
            }, false);

            function recordFocus(){
                window.name = Date.now();

                GM_setValue("PestPacFocus", window.name);

            }

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

    function fetchGeocodes(callback){
        retrieveMapsApiKey(function(key){
            var addressObject = getLocationAddress();

            var address = addressObject.street+"+"+addressObject.zipcode;

            address = address.replaceAll(", ", "+");
            address = address.replaceAll(" ", "+");

            var requestString = "https://maps.googleapis.com/maps/api/geocode/json?address="+address+",&key="+key;

            httpGetAsync(requestString, function(data){
                var dataObj = JSON.parse(data);
                var geoCodes = {};

                if(dataObj.results[0]){
                    geoCodes.longitude = parseFloat(dataObj.results[0].geometry.location.lng).toFixed(6);
                    geoCodes.latitude = parseFloat(dataObj.results[0].geometry.location.lat).toFixed(6);

                    sessionStorage.setItem("longitude", geoCodes.longitude);
                    sessionStorage.setItem("latitude", geoCodes.latitude);

                    callback(geoCodes);
                } else {
                    callback(false);
                    console.log("No Google Maps Data Found :(");
                }
            });
        });
    }

    function getColor(setup){;

        if(GROUPBY === "WEEK"){
            return getColorScale(WEEKS)[setup.schedule.substring(0,1)];
        } else if(GROUPBY === "WEEKDAY"){
            return getColorScale(WEEKDAYS)[setup.schedule.substring(1,4)];
        } else if(GROUPBY === "TECHNICIAN"){
            return getColorScale(TECHNICIANS)[setup.tech];
        } else if(GROUPBY === "AGE"){
            return getColorScale(AGES)[setup.age];
        } else {
            var dailyTotal = Math.floor(setup.dailyTotal/50)*50;
            dailyTotal = dailyTotal > 400 ? dailyTotal : 450;
            return getColorScale(DAILYTOTALS)[dailyTotal.toString()];
        }

    }

    function getColorScale(dataModel){

        var colorScale = {};

        var keyList;

        var colorList = [
            "0,0,255",
            "0,63,255",
            "0,127,255",
            "0,191,255",
            "0,255,255",
            "0,255,191",
            "0,255,127",
            "0,255,63",
            "0,255,0",
            "63,255,0",
            "127,255,0",
            "191,255,0",
            "255,255,0",
            "255,191,0",
            "255,127,0",
            "255,63,0",
            "255,0,0",
            "255,0,63",
            "255,0,127",
            "255,0,191",
            "255,0,255",
            "191,0,255",
            "127,0,255",
            "63,0,255"
        ];

        if(!dataModel){

            if(GROUPBY === "WEEK"){
                keyList = Object.keys(WEEKS);
            } else if(GROUPBY === "WEEKDAY"){
                keyList = Object.keys(WEEKDAYS);
            } else if(GROUPBY === "TECHNICIAN"){
                keyList = Object.keys(TECHNICIANS);
            } else if(GROUPBY === "AGE"){
                keyList = Object.keys(AGES);
            } else {
                keyList = Object.keys(DAILYTOTALS);
            }
        } else {
            keyList = Object.keys(dataModel);
        }

        var conversionRate = colorList.length/keyList.length;

        keyList.forEach(function(key, index){

            var newIndex = Math.round(conversionRate * index);

            colorScale[key] = "rgb("+colorList[newIndex]+")";

        });

        return colorScale;
    }

    function getMarker(setup){
        if(GROUPBY === "WEEK"){
            return getMarkerScale(WEEKS)[setup.schedule.substring(0,1)];
        } else if(GROUPBY === "WEEKDAY"){
            return getMarkerScale(WEEKDAYS)[setup.schedule.substring(1,4)];
        } else if(GROUPBY === "TECHNICIAN"){
            return getMarkerScale(TECHNICIANS)[setup.tech];
        } else if(GROUPBY === "SCHEDULE"){
            return getMarkerScale(SCHEDULES)[setup.schedule.substring(1,4)];
        } else if(GROUPBY === "AGE"){
            return getMarkerScale(AGES)[setup.age];
        } else {
            var dailyTotal = Math.floor(setup.dailyTotal/50)*50;
            dailyTotal = dailyTotal > 449 ? dailyTotal : 450;
            return getMarkerScale(DAILYTOTALS)[dailyTotal];
        }

    }

    function getMarkerScale(dataModel){

        var markerScale = {};

        var markerList = [
            "0_0_255",
            "0_63_255",
            "0_127_255",
            "0_191_255",
            "0_255_255",
            "0_255_191",
            "0_255_127",
            "0_255_63",
            "0_255_0",
            "63_255_0",
            "127_255_0",
            "191_255_0",
            "255_255_0",
            "255_191_0",
            "255_127_0",
            "255_63_0",
            "255_0_0",
            "255_0_63",
            "255_0_127",
            "255_0_191",
            "255_0_255",
            "191_0_255",
            "127_0_255",
            "63_0_255"
        ];

        var keyList = Object.keys(dataModel);

        var conversionRate = markerList.length/keyList.length;

        keyList.forEach(function(key, index){

            var newIndex = Math.round(conversionRate * index);

            markerScale[key] = "https://rjhuffaker.github.io/markers/"+markerList[newIndex]+".png";

        });

        return markerScale;
    }

    function getNearestActiveSetups(data, callback){
        var al = activeSetups.length;
        var nearestList = [];
        var _long = parseFloat(data.longitude);
        var _lat = parseFloat(data.latitude);

        var accountId = getContactInfo().id;

        refreshTechnicianList();

        for(var i = 1; i < al; i++){
            var setup = activeSetups[i];
            if(!setup.account){
                console.error("No setup.account", setup);
            }

            var dailyTotal = Math.floor(setup.dailyTotal/50)*50;
            dailyTotal = dailyTotal > 400 ? dailyTotal : 450;

            if(setup.account !== accountId){

                if(monthFilter(setup.months)){

                    updateTechnicianList(activeSetups[i]);

                    if(DAILYTOTALS[dailyTotal] && !DAILYTOTALS[dailyTotal].excluded){

                        if(WEEKDAYS[setup.weekDay] && !WEEKDAYS[setup.weekDay].excluded){

                            if(WEEKS[setup.week] && !WEEKS[setup.week].excluded){

                                if(!TECHNICIANS[setup.tech] || !TECHNICIANS[setup.tech].excluded){

                                    if(AGES[setup.age] && !AGES[setup.age].excluded){

                                        if(nearestList.length < PROXLISTSIZE){
                                            setup.hyp = setup.getDist(_long, _lat).toFixed(2);
                                            nearestList.push(setup);
                                        } else {
                                            for(var ij = 0; ij < nearestList.length; ij++){
                                                var nearSetup = nearestList[ij];

                                                if(setup.getDist(_long, _lat) < nearSetup.getDist(_long, _lat)){

                                                    setup.hyp = setup.getDist(_long, _lat).toFixed(2);
                                                    nearestList.splice(ij, 0, setup);
                                                    nearestList = nearestList.slice(0, PROXLISTSIZE);
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        alphabetizeTechnicianList();

        if(nearestList.length > 1){
            for(var j = 0; j < nearestList.length; j++){
                var _nearest = nearestList[j];
                for(var key in TECHNICIANS){
                    var _tech = TECHNICIANS[key];
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

        function monthFilter(monthString){
            var returnvar = false;
            if(MONTHFILTER.options["Any"].checked){
                returnvar = true;
            } else if(MONTHFILTER.options["Odd"].checked){
                for(var i = 0; i < 10; i+=2){
                    returnvar = true;
                    if(monthString.charAt(i) === "0"){
                        returnvar = false;
                        break;
                    }
                }
            } else if(MONTHFILTER.options["Even"].checked){
                for(var i = 1; i < 11; i+=2){
                    returnvar = true;
                    if(monthString.charAt(i) === "0"){
                        returnvar = false;
                        break;
                    }
                }
            } else if(MONTHFILTER.options["Specific"].checked){
                Object.keys(MONTHFILTER.options["Specific"].options).forEach(function(key, index){
                    var month = MONTHFILTER.options["Specific"].options[key];
                    if(month.checked && (monthString.charAt(index) === "1")){
                        returnvar = true;
                    }
                });
            }

            return returnvar;
        }

        function refreshTechnicianList(){
            for(var key in TECHNICIANS){
                var _tech = TECHNICIANS[key];
                for(var key in _tech.dailyTotals){
                    _tech.dailyTotals[key] = 0;
                }
                for(var key in _tech.dailyStops){
                    _tech.dailyStops[key] = 0;
                }
            }
        }

        function updateTechnicianList(setup){
            var addTech = true;

            for(var key in TECHNICIANS){
                var _tech = TECHNICIANS[key];
                if(setup.tech && setup.tech === _tech.name){
                    addTech = false;
                    var multiplier;
                    if(MONTHFILTER.options["Any"].checked){
                        if(setup.schedule[4] === "M"){
                            multiplier = 1;
                        } else if(setup.schedule[4] === "B"){
                            multiplier = 0.5;
                        } else if(setup.schedule[4] === "Q"){
                            multiplier = 0.33;
                        }
                    } else {
                        multiplier = 1;
                    }
                    if(setup.schedule){
                        _tech.dailyTotals[setup.schedule.substring(0,4)] += Math.ceil(parseInt(setup.total) * multiplier);
                        _tech.dailyStops[setup.schedule.substring(0,4)] += multiplier;
                    } else {
                        console.error("No setup.schedule", setup);
                    }
                }
            }

            if(addTech && setup.tech){
                TECHNICIANS[setup.tech] = new technician(setup.tech);
            }

        }

        function alphabetizeTechnicianList(){
            var _techArray = [];

            var _technicians = {};

            for(var key in TECHNICIANS){
                _techArray.push(TECHNICIANS[key])
            }

            _techArray.sort(function(a, b){
                if (a.name < b.name)
                    return -1;
                if (a.name > b.name)
                    return 1;
                return 0;
            });

            _techArray.forEach(function(tech){
                _technicians[tech.name] = tech;
            });

            TECHNICIANS = _technicians;
        }

    }

    function scorpModal(){

        var scorpOverlay = document.createElement("div");
        scorpOverlay.classList.add("ui-widget-overlay");
        scorpOverlay.classList.add("ui-front");
        scorpOverlay.id = "scorp-overlay";
        scorpOverlay.style.display = "none";
        scorpOverlay.onclick = closeScorpModal;

        var scorpModal = document.createElement("div");
        scorpModal.classList.add("ui-dialog");
        scorpModal.classList.add("ui-widget");
        scorpModal.classList.add("ui-widget-content");
        scorpModal.classList.add("ui-corner-all");
        scorpModal.classList.add("ui-front");
        scorpModal.style.position = "fixed";
        scorpModal.style.top = "40%";
        scorpModal.style.left = "40%";
        scorpModal.style.display = "block";
        scorpModal.style.borderRadius = "10px";
        scorpModal.id = "scorp-modal";
        scorpModal.style.display = "none";

        var titleDiv = document.createElement("div");
        titleDiv.classList.add("ui-dialog-titlebar");
        titleDiv.classList.add("ui-widget-header");
        titleDiv.classList.add("ui-corner-all");
        titleDiv.classList.add("ui-helper-clearfix");

        var titleSpan = document.createElement("span");
        titleSpan.classList.add("ui-dialog-title");
        titleSpan.id = "scorp-modal-title";
        titleSpan.innerHTML = "&nbsp;";

        var closeButton = document.createElement("button");
        closeButton.classList.add("ui-button");
        closeButton.classList.add("ui-widget");
        closeButton.classList.add("ui-state-default");
        closeButton.classList.add("ui-corner-all");
        closeButton.classList.add("ui-button-icon-only");
        closeButton.classList.add("ui-dialog-titlebar-close");
        closeButton.onclick = closeScorpModal;

        var closeIcon = document.createElement("span");
        closeIcon.classList.add("ui-button-icon-primary");
        closeIcon.classList.add("ui-icon");
        closeIcon.classList.add("ui-icon-closethick");

        var contentDiv = document.createElement("div");
        contentDiv.classList.add("ui-dialog-content");
        contentDiv.classList.add("ui-widget-content");
        contentDiv.style.width = "auto";
        contentDiv.style.background = "white";
        contentDiv.id = "scorp-modal-content";

        contentDiv.appendChild(createUserLogin());
        contentDiv.appendChild(createFormatSetup());
        contentDiv.appendChild(createFollowUp());
        contentDiv.appendChild(createShowHistory());

        closeButton.appendChild(closeIcon);
        titleDiv.appendChild(titleSpan);
        titleDiv.appendChild(closeButton);
        scorpModal.appendChild(titleDiv);
        scorpModal.appendChild(contentDiv);

        document.body.appendChild(scorpOverlay);
        document.body.appendChild(scorpModal);

        monitorScorpModal();

        function createUserLogin(){

            var tableData = { rows: [
                { cells: [
                    { content: displayText( { title: "Scorpinator Login" } ), colSpan: 2 }
                ] },
                { cells: [
                    { content: displayText( { line: true } ), colSpan: 2 }
                ] },
                { cells: [
                    { content: createLabel("Username") },
                    { content: createInput("ScorpinatorUsername") }
                ] },
                { cells: [
                    { content: createLabel("Password") },
                    { content: createInput("ScorpinatorPassword") }
                ] },
                { cells: [
                    { content: displayText( { plain: "Use same credentials as azpestcontrol.services" } ), colSpan: 2 }
                ] },
                { cells: [
                    { content: displayText( { line: true } ), colSpan: 2 }
                ] },
                { cells: [
                    { content: createButton( { text: "Login", onclick: login } ) },
                    { content: createButton( { text: "Cancel", onclick: cancel } ) }
                ] }
            ] };

            var _div = document.createElement("div");
            _div.style.display = "none";
            _div.id = "scorpinatorLogin";

            _div.appendChild(createTable(tableData));

            return _div;


            function login(){
                var username = document.getElementById("ScorpinatorUsernameInput").value;
                var password = document.getElementById("ScorpinatorPasswordInput").value;

                if(username && password){
                    httpGetAsync(`https://azpestcontrol.services/api/users.php?username=`+username+`&password=`+password, function(response){
                        response = JSON.parse(response);
                        if(response){
                            console.log("LOGIN SUCCESSFUL");
                            GM_setValue("currentUser", JSON.stringify(response));

                            closeScorpModal();
                            initializeScorpinator();
                        } else {
                            console.log("LOGIN FAILED");
                        }
                    });
                }
            }

            function cancel(){
                closeScorpModal();

            }
        }

        function createFormatSetup(){
            var _div = document.createElement("div");
            _div.style.display = "none";
            _div.id = "format-setup";

            _div.appendChild(createLabeledInput("serviceCode", ""));
            _div.appendChild(createLabeledInput("price", ""));
            _div.appendChild(createLabeledInput("schedule", ""));
            _div.appendChild(createLabeledInput("tech", ""));
            _div.appendChild(createLabeledInput("duration", ""));
            _div.appendChild(createLabeledInput("startDate", ""));
            _div.appendChild(createLabeledInput("nextDate", ""));
            _div.appendChild(createLabeledInput("target", ""));

            _div.appendChild(createButton({text: "Create Setup", onclick: createSetup}));

            _div.appendChild(createButton({text: "Update Setup", onclick: updateSetup}));

            return _div

            function createSetup(){

                var setupData = {};

                setupData.serviceCode = document.getElementById("serviceCodeInput").value;
                setupData.price = document.getElementById("priceInput").value;
                setupData.schedule = document.getElementById("scheduleInput").value;
                setupData.tech = document.getElementById("techInput").value;
                setupData.duration = document.getElementById("durationInput").value;
                setupData.nextDate = document.getElementById("nextDateInput").value;
                setupData.startDate = document.getElementById("startDateInput").value;
                setupData.target = document.getElementById("targetInput").value;

                sessionStorage.setItem("serviceSetup", JSON.stringify(setupData));

                document.getElementById("subject").value = "Send Welcome Letter";

                document.getElementById("butSave").click();

                var newUrl = window.location.href.replace("location/detail.asp?", "serviceSetup/detail.asp?Mode=New&RenewalOrSetup=S&");

                window.location.href = newUrl;

            }

            function updateSetup(){
                var setupData = {};

                setupData.serviceCode = document.getElementById("serviceCodeInput").value;
                setupData.price = document.getElementById("priceInput").value;
                setupData.schedule = document.getElementById("scheduleInput").value;
                setupData.duration = document.getElementById("durationInput").value;
                setupData.nextDate = document.getElementById("nextDateInput").value;
                setupData.lastGenerated = setupData.nextDate;
                setupData.startDate = document.getElementById("startDateInput").value;
                setupData.target = document.getElementById("targetInput").value;
                setupData.division = document.getElementById("Division").value;
                setupData.tech = document.getElementById("techInput").value;

                sessionStorage.setItem("serviceSetup", JSON.stringify(setupData));

                document.getElementById("subject").value = "Send Welcome Letter & Generate 1st Service";

                document.getElementById("butSave").click();

                document.getElementById("RSRow1").click();

            }

            function modifySetup(){
                //if already opened to location
            }
        }

        function createFollowUp(){

            var _div = document.createElement("div");
            _div.style.display = "none";
            _div.id = "follow-up";

            var followUpTextarea = document.createElement("textarea");
            followUpTextarea.style.height = "7.5em";
            followUpTextarea.style.width = "95%";
            followUpTextarea.style.fontSize = "12pt";
            followUpTextarea.style.resize = "none";
            followUpTextarea.id = "follow-up-textarea";

            _div.appendChild(createTable({
                rows: [
                    { cells: [
                        { content: followUpTextarea, colSpan: 2 }
                    ] },
                    { cells: [
                        { content: createButton({ text: "Text Follow Up", onclick: textFollowUp }) },
                        { content: createButton({ text: "Cancel", onclick: closeScorpModal }) }
                    ] },
                    { cells: [
                        { content: displayText({ plain: "&nbsp;" }) }
                    ] }
                ],
                width: "100%"
            }));

            function textFollowUp(){
                textFollowUpHandler(followUpTextarea.value);
                closeScorpModal();
            }

            return _div
        }

        function createShowHistory(){
            var _div = document.createElement("div");
            _div.style.display = "none";
            _div.id = "show-history";
            _div.appendChild(displayText({title: "Service History"}));

            return _div
        }

        function monitorScorpModal(){
            GM_addValueChangeListener("scorpModal", function(name, old_value, new_value, remote){
                if(new_value === "closed"){
                    closeScorpModal();
                }
            });
        }

    }

    function toggleScorpModal(modalData){

        console.log("toggleScorpModal", modalData);

        var scorpOverlay = document.getElementById("scorp-overlay");
        var scorpModal = document.getElementById("scorp-modal");
        var contentDiv = document.getElementById("scorp-modal-content");
        var titleSpan = document.getElementById("scorp-modal-title");

        if(!modalData){
            scorpOverlay.style.display = "none";
            scorpModal.style.display = "none";

        } else if(checkLastFocus()){

            scorpOverlay.style.display = "block";
            scorpModal.style.display = "block";

            contentDiv.style.width = modalData.width;
            contentDiv.style.height = modalData.height;
            titleSpan.innerHTML = modalData.title;

            var userLogin = document.getElementById("scorpinatorLogin");
            var formatSetup = document.getElementById("format-setup");
            var followUp = document.getElementById("follow-up");
            var showHistory = document.getElementById("show-history");

            var createSetupButton = document.getElementById("CreateSetupButton");
            var updateSetupButton = document.getElementById("UpdateSetupButton");

            if(modalData.userLogin){
                userLogin.style.display = "block";
                document.getElementById("ScorpinatorPasswordInput").type = "password";
            } else {
                userLogin.style.display = "none";
                document.getElementById("ScorpinatorPasswordInput").type = "text";
            }

            if(modalData.createSetup || modalData.updateSetup){
                formatSetup.style.display = "block";

                document.getElementById("serviceCodeInput").value = modalData.setupData.serviceCode;
                document.getElementById("priceInput").value = modalData.setupData.price;
                document.getElementById("scheduleInput").value = modalData.setupData.schedule;
                document.getElementById("techInput").value = modalData.setupData.tech;
                document.getElementById("durationInput").value = modalData.setupData.duration;
                document.getElementById("nextDateInput").value = modalData.setupData.nextDate;
                document.getElementById("startDateInput").value = modalData.setupData.startDate;
                document.getElementById("targetInput").value = modalData.setupData.target;

            } else {
                formatSetup.style.display = "none";
            }

            if(modalData.createSetup){
                createSetupButton.style.display = "block";
                updateSetupButton.style.display = "none";
            } else if(modalData.updateSetup){
                createSetupButton.style.display = "none";
                updateSetupButton.style.display = "block";
            } else {
                createSetupButton.style.display = "none";
                updateSetupButton.style.display = "none";
            }

            if(modalData.followUp){
                followUp.style.display = "block";

                document.getElementById("follow-up-textarea").value = modalData.followUpText;

                showHistory.style.display = "block";

            } else {
                followUp.style.display = "none";
            }

            if(modalData.showHistory){
                showHistory.style.display = "block";
            } else {
                showHistory.style.display = "none";
            }

        }
    }

    function closeScorpModal(){
        GM_deleteValue("scorpModal");
        toggleScorpModal();
    }

    function addProximinator(){
        if(!urlContains(["LocationID","location/add.asp","serviceSetup/detail.asp"])) return;
        if(urlContains(["letters","dialog","notes"])) return;

        var bodyElement = document.getElementsByTagName('body')[0];

        bodyElement.appendChild(createProxIcon());

        bodyElement.appendChild(createProxModal());

        window.addEventListener("click", clickToDismiss);

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
                proxContainer.style.zIndex = 10000;
                proxContainer.style.display = "block";

                var legendSpacer = document.createElement("div");
                legendSpacer.id = "legend-spacer";
                legendSpacer.style.height = "20px";

                var proxTabList = [
                    {id: "list", title: "List", shown: PROXMODE==="list", onSelect: setProxMode},
                    {id: "map", title: "Map", shown: PROXMODE==="map", onSelect: setProxMode},
                    {id: "zillow", title: "Zillow", shown: PROXMODE==="zillow", content: createZillowDiv(), onSelect: setProxMode},
                    {id: "service", title: "Service", shown: PROXMODE==="service", content: createServiceDiv(), onSelect: setProxMode},
                    {id: "update", title: "Update", shown: PROXMODE==="update", content: createUpdateDiv(), onSelect: setProxMode},
                    {id: "profile", title: "Login", shown: PROXMODE==="profile", content: createProfileDiv(), onSelect: setProxMode},
                    {id: "rules", title: "Rules", shown: PROXMODE==="rules", content: createRulesDiv(), onSelect: setProxMode}
                ];

                proxContainer.appendChild(createProxHeader());
                proxContainer.appendChild(createProxTabs(proxTabList, 300, 466, "proximator"));

                proxContainer.appendChild(legendSpacer);

                proxContainer.appendChild(createProxLegend());

                return proxContainer;

                function createProxHeader(){
                    var proxHeader = document.createElement("div");
                    proxHeader.id = "prox-header";
                    proxHeader.style.borderBottom = "1px solid";

                    proxHeader.appendChild(createProxHeaderImage());
                    proxHeader.appendChild(createProxTitle());
                    proxHeader.appendChild(createProxExit());

                    return proxHeader

                    function createProxHeaderImage(){
                        var proxHeaderImage = document.createElement("img");
                        proxHeaderImage.id = "prox-header-image";
                        proxHeaderImage.src = "https://rjhuffaker.github.io/ScorpImage.png";
                        proxHeaderImage.style.display = "inline";

                        proxHeaderImage.onclick = testClick;

                        return proxHeaderImage;

                        function testClick(){
                            alert("Help! I've been clicked!");
                            GM_deleteValue("activeSetups");
                            GM_deleteValue("residential");
                            GM_deleteValue("phoneNumber");
                            GM_deleteValue("phoneNum");
                            GM_deleteValue("altNum");
                            GM_deleteValue("mobileNum");
                            GM_deleteValue("InvoiceDetails");
                            GM_deleteValue("autoText");
                        }
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
                        proxTitle.innerHTML = "Scorpinator";

                        return proxTitle;
                    }

                }

                function setProxMode(event){
                    var mode = event.target.id.replace("proximator-", "").replace("-tab-label", "");

                    PROXMODE = mode;

                    var showLegend = true;

                    var proxContainer = document.getElementById("proximator-container");
                    var tabWrapper = document.getElementById("proximator-wrapper");
                    var proxLegend = document.getElementById("prox-legend");
                    var legendSpacer = document.getElementById("legend-spacer");

                    if(mode==="list" || mode==="map"){
                        proxContainer.style.height = "300px";
                        tabWrapper.style.height = "280px";
                        legendSpacer.style.display = "block";
                        proxLegend.style.display = "block";
                    } else {
                        proxContainer.style.height = "432px";
                        tabWrapper.style.height = "432px";
                        legendSpacer.style.display = "none";
                        proxLegend.style.display = "none";
                    }
                }

            }

        }

        function createProxTabs(tabList, height, width, containerID){
            var proxTabContainer = document.createElement("div");
            proxTabContainer.id = containerID+"-container";
            proxTabContainer.style.height = height+"px";
            proxTabContainer.style.width = width+"px";
            proxTabContainer.style.boxSizing = "border-box";

            proxTabContainer.appendChild(createProxTabLabels(tabList, containerID));
            proxTabContainer.appendChild(createProxTabWrapper(tabList, containerID));

            return proxTabContainer;

            function createProxTabLabels(tabs, containerID){
                var proxTabLabels = document.createElement("div");
                proxTabLabels.style.height = "20px";
                proxTabLabels.style.width = "100%";
                proxTabLabels.style.position = "absolute";
                proxTabLabels.style.marginTop = "-20px";

                tabs.forEach(function(tab){
                    var tabLabel = document.createElement("div");
                    tabLabel.innerHTML = tab.title;
                    tabLabel.id = containerID+"-"+tab.id+"-tab-label";
                    tabLabel.classList.add(containerID+"-tab-label");
                    tabLabel.style.cursor = "pointer";
                    tabLabel.style.display = "inline-block";
                    tabLabel.style.height = "20px";
                    tabLabel.style.boxSizing = "border-box";

                    tabLabel.style.border = "solid";
                    tabLabel.style.borderWidth = "1px 1px 0 1px";
                    tabLabel.style.margin = "0 4px 0 4px";
                    tabLabel.style.padding = "4px 8px 0 8px";
                    tabLabel.style.borderRadius = "4px 4px 0 0";
                    tabLabel.style.fontSize = "12px";

                    if(tab.shown){
                        tabLabel.style.backgroundColor = "white";
                        tabLabel.style.borderBottom = "none";
                    } else {
                        tabLabel.style.backgroundColor = "grey";
                        tabLabel.style.borderBottom = "1px solid";
                    }

                    proxTabLabels.appendChild(tabLabel);

                    tabLabel.onclick = function(event){
                        if(tab.onSelect) tab.onSelect(event);

                        var tabContentList = Array.from(document.getElementsByClassName(containerID+"-tab-content"));
                        tabContentList.forEach(function(tabContent){
                            if(tabContent.id===containerID+"-"+tab.id+"-tab-content"){
                                tabContent.style.display = "block";
                            } else {
                                tabContent.style.display = "none";
                            }
                        });
                        var tabLabelList = Array.from(document.getElementsByClassName(containerID+"-tab-label"));
                        tabLabelList.forEach(function(tabLabel){
                            if(tabLabel.id===containerID+"-"+tab.id+"-tab-label"){
                                tabLabel.style.backgroundColor = "white";
                                tabLabel.style.borderBottom = "none";
                            } else {
                                tabLabel.style.backgroundColor = "grey";
                                tabLabel.style.borderBottom = "1px solid";
                            }
                        });

                    }

                });

                return proxTabLabels;
            }

            function createProxTabWrapper(tabs, containerID){
                var proxTabWrapper = document.createElement("div");
                proxTabWrapper.id = containerID+"-wrapper";
                proxTabWrapper.style.height = "90%";
                proxTabWrapper.style.width = "90%";

                proxTabWrapper.style.height = height-20+"px";
                proxTabWrapper.style.width = width-20+"px";
                proxTabWrapper.style.padding = "10px";

                tabs.forEach(function(tab){
                    var tabContent = document.createElement("div");

                    tabContent.id = containerID+"-"+tab.id+"-tab-content";
                    tabContent.classList.add(containerID+"-tab-content");

                    tabContent.style.height = "100%";
                    tabContent.style.width = "100%";

                    tabContent.style.display = tab.shown?"block":"none";

                    if(tab.content){
                        tabContent.appendChild(tab.content);
                    }

                    proxTabWrapper.appendChild(tabContent);
                });

                return proxTabWrapper;
            }

        }

        function proxIconListener(){

            setTimeout(function(){
                var proxModal = document.getElementById("prox-modal");

                if(proxModal.classList.contains("show")){
                    addSetupTask = false;
                    proxModal.classList.remove("show");
                } else {
                    proxModal.classList.add("show");
                    fetchGeocodes(function(dataList){
                        getNearestActiveSetups(dataList, function(dataList){
                            sessionStorage.removeItem("mapState");
                            generateProxContent(dataList);
                            setDivision(dataList);
                        });
                    });

                }
            }, 0);

        }

        function generateProxContent(data){

            var address = getLocationAddress();

            var listLabel = document.getElementById("proximator-list-tab-label");
            var mapLabel = document.getElementById("proximator-map-tab-label");
            var zillowLabel = document.getElementById("proximator-zillow-tab-label");
            var serviceLabel = document.getElementById("proximator-service-tab-label");

            var listContent = document.getElementById("proximator-list-tab-content");
            var mapContent = document.getElementById("proximator-map-tab-content");
            var zillowContent = document.getElementById("proximator-zillow-tab-content");
            var serviceContent = document.getElementById("proximator-service-tab-content");

            if(address.street && address.zipcode){

                generateProxList(data);

                if(!PROXMAP){
                    generateProxMap(data);
                } else {
                    updateProxMap(data);
                }

                generateProxLegend();

                toggleDisplay([listLabel, mapLabel, zillowLabel, serviceLabel], "inline-block");

            } else {

                toggleDisplay([listLabel, mapLabel, zillowLabel, serviceLabel, mapContent, listContent, zillowContent, serviceContent], "none");

            }

        }

        function generateProxList(data){

            var listTabContent = document.getElementById("proximator-list-tab-content");
            listTabContent.innerHTML = "";
            listTabContent.style.height = "100%";
            listTabContent.style.width = "100%";

            listTabContent.appendChild(createProxTableHeader(data));
            listTabContent.appendChild(createProxTable(data));

            function createProxTableHeader(){
                var _table = document.createElement("table");
                _table.border = 1;
                _table.style.width = "430px";
                _table.style.height = "6%";

                var _headerRow = _table.insertRow(0);

                _headerRow.style.fontWeight = "bold";

                var headerList = [
                    {text: "Account", width: "14%"},
                    {text: "Zip", width: "12%"},
                    {text: "Schedule", width: "16%"},
                    {text: "Tech/Division", width: "30%"},
                    {text: "Distance", width: "18%"},
                    {text: "Stops", width: "10%"}
                ];

                headerList.forEach(function(header){
                    var newCell = _headerRow.insertCell();
                    newCell.innerHTML = header.text;
                    newCell.style.width = header.width;
                });

                return _table;

            }

            function createProxTable(data){
                var proxTable = document.createElement("table");
                proxTable.border = 1;

                if(data.length > 1){
                    for(var i = 0; i < data.length; i++){
                        createTableRow(data[i]);
                    }
                }

                var scrollDiv = document.createElement("div");
                scrollDiv.style.height = "94%";
                scrollDiv.style.width = "100%";
                scrollDiv.style.overflowY = "scroll";
                scrollDiv.style.border = "1px solid grey";

                scrollDiv.appendChild(proxTable);

                return scrollDiv;

                function createTableRow(rowData){

                    var _goToAnchor = document.createElement("a");
                    _goToAnchor.innerHTML = rowData.account;
                    _goToAnchor.style.textDecoration = "none";
                    _goToAnchor.style.color = "#000";

                    var _techAnchor = document.createElement("a");
                    _techAnchor.innerHTML = rowData.tech+"/"+rowData.division;
                    _techAnchor.style.textDecoration = "none";
                    _techAnchor.style.color = "#000";

                    var _tr = proxTable.insertRow();

                    var cell_1 = _tr.insertCell();
                    cell_1.appendChild(_goToAnchor);
                    cell_1.style.width = "14%";

                    var cell_2 = _tr.insertCell();
                    cell_2.innerHTML = rowData.zipcode.substring(0,5);
                    cell_2.style.width = "12%";

                    var cell_3 = _tr.insertCell();
                    cell_3.innerHTML = rowData.schedule;
                    cell_3.style.width = "16%";

                    var cell_4 = _tr.insertCell();
                    cell_4.appendChild(_techAnchor);
                    cell_4.style.width = "30%";

                    var cell_5 = _tr.insertCell();
                    cell_5.innerHTML = rowData.hyp+" mi";
                    cell_5.style.width = "18%";

                    var cell_6 = _tr.insertCell();
                    cell_6.innerHTML = Math.ceil(rowData.dailyStops);
                    cell_6.style.width = "10%";

                    if(urlContains(["serviceSetup/detail.asp"])){
                        _tr.classList.add("add-setup-task");
                        _tr.dataSetup = rowData;
                        _tr.addEventListener("click", function(e) {
                            GM_setValue("serviceSetup", this.dataSetup);

                            document.getElementById("prox-modal").classList.remove("show");
                        });
                    }

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
                            goToAccount(rowData.account, true);
                        });

                        _techAnchor.style.cursor = "pointer";
                        _techAnchor.addEventListener("click", function(e) {

                            alert(createTechSchedule(rowData.tech));
                        });
                    }

                    _tr.style.textShadow = "0 0 2px "+getColor(rowData);

                    function createTechSchedule(tech){
                        var schedule = "";

                        Object.keys(TECHNICIANS).forEach(
                            function(key){
                                var route = TECHNICIANS[key];

                                if(route.name === tech){
                                    schedule = "Daily Stops/Totals for "+route.name+"\n        MON              TUE               WED               THU                FRI\n";

                                    for(var day in route.dailyStops){
                                        var dayString = "";

                                        dayString = dayString+Math.ceil(route.dailyStops[day])+"/"+Math.ceil(route.dailyTotals[day]);

                                        for(var i = dayString.length; i < 7; i++){
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

            }

        }

        function generateProxMap(data){
            var mapTabContent = document.getElementById("proximator-map-tab-content");
            mapTabContent.innerHTML = "";
            mapTabContent.style.height = "100%";
            mapTabContent.style.width = "100%";

            mapTabContent.appendChild(createProxMap());

            initMap(data);

            function createProxMap(){

                var proxMap = document.createElement("div");
                proxMap.id = "prox-map";
                proxMap.style.height = "100%";
                proxMap.style.width = "100%";
                proxMap.style.border = "1px solid #999";
                proxMap.style.zIndex = "0";

                return proxMap;
            }

            function initMap(data) {

                var _latitude = parseFloat(sessionStorage.getItem("latitude"));

                var _longitude = parseFloat(sessionStorage.getItem("longitude"));

                var myLatLng = {lat: _latitude, lng: _longitude};

                PROXMAP = new google.maps.Map(document.getElementById("prox-map"), {
                    center: myLatLng,
                    zoom: 13
                });

                PROXMAPMARKERS = [];

                data.forEach(function(activeSetup){

                    var imageUrl = getMarker(activeSetup, GROUPBY);

                    var image = {
                        url: imageUrl,
                        size: new google.maps.Size(32, 32),
                        scaledSize: new google.maps.Size(32, 32),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(15, 31)
                    };

                    var marker = new google.maps.Marker({
                        map: PROXMAP,
                        icon: image,
                        position: {lat: activeSetup.latitude, lng: activeSetup.longitude},
                        title: createMarkerTitle(activeSetup)
                    });

                    PROXMAPMARKERS.push(marker);

                    marker.addListener("click", function(e){
                        if(addSetupTask){
                            addSetupTaskDetails(activeSetup);
                            addSetupTask = false;
                            document.getElementById("prox-modal").classList.remove("show");
                        } else {
                            goToAccount(activeSetup.account, true);
                        }
                    });


                });

                var marker = new google.maps.Marker({
                    map: PROXMAP,
                    icon: {
                        url: "https://maps.google.com/mapfiles/kml/paddle/wht-circle.png",
                        size: new google.maps.Size(40, 40),
                        scaledSize: new google.maps.Size(40, 40),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(20, 40)
                    },
                    position: myLatLng,
                    title: "_lat: "+_latitude+"_lng"+_longitude
                });

                google.maps.event.addListener(PROXMAP, 'tilesloaded', tilesLoaded);

                loadMapState();

                google.maps.event.addListener(PROXMAP, "bounds_changed", onBoundsChanged);

                var fullScreenLegend = document.createElement("div");
                fullScreenLegend.style.border = "1px solid";
                fullScreenLegend.style.backgroundColor = "white";

                PROXMAP.controls[google.maps.ControlPosition.BOTTOM].push(fullScreenLegend);

                function onBoundsChanged(){
                    var proxMapHeight = $(PROXMAP.getDiv()).children().eq(0).height();
                    var proxMapWidth = $(PROXMAP.getDiv()).children().eq(0).width();

                    if(proxMapHeight === window.innerHeight && proxMapWidth === window.innerWidth){
                        fullScreenLegend.appendChild(document.getElementById("legend-content"));
                    } else {
                        document.getElementById("prox-legend").appendChild(document.getElementById("legend-content"))
                    }
                }


                function tilesLoaded(){
                    google.maps.event.clearListeners(PROXMAP, 'tilesloaded');
                    google.maps.event.addListener(PROXMAP, 'zoom_changed', saveMapState);
                    google.maps.event.addListener(PROXMAP, 'dragend', saveMapState);
                }

                function saveMapState(){
                    var mapZoom = PROXMAP.getZoom();
                    var mapCenter = PROXMAP.getCenter();
                    var mapLat = mapCenter.lat();
                    var mapLng = mapCenter.lng();
                    var mapString = mapLat + "_" + mapLng + "_" + mapZoom;
                    sessionStorage.setItem("mapState", mapString);
                }

                function loadMapState(){
                    var mapString = sessionStorage.getItem("mapState");
                    if(!mapString) return;
                    var mapArray = mapString.split("_");
                    var savedMapLat = parseFloat(mapArray[0]);
                    var savedMapLng = parseFloat(mapArray[1]);
                    var savedMapZoom = parseFloat(mapArray[2]);
                    if ((!isNaN(savedMapLat)) && (!isNaN(savedMapLng)) && (!isNaN(savedMapZoom))) {
                        PROXMAP.setCenter(new google.maps.LatLng(savedMapLat,savedMapLng));
                        PROXMAP.setZoom(savedMapZoom);
                    }

                }

            }

        }

        function generateProxLegend(){
            var proxLegend = document.getElementById("prox-legend");
            var legendContent = document.getElementById("legend-content");

            if(!legendContent){
                proxLegend.appendChild(createLegendContent());
            }

            function createLegendContent(){
                var legendContent = document.createElement("div");
                legendContent.id = "legend-content";

                legendContent.appendChild(createProxTabs([
                    {id: "general", title: "General", shown: GROUPBY==="GENERAL", content: createGeneralTab()},
                    {id: "dailyTotal", title: "DailyTotal", shown: GROUPBY==="DAILYTOTAL", content: createDailyTotalTab(), onSelect: tabClick},
                    {id: "week", title: "Week", shown: GROUPBY==="WEEK", content: createWeekTab(), onSelect: tabClick},
                    {id: "weekDay", title: "WeekDay", shown: GROUPBY==="WEEKDAY", content: createWeekDayTab(), onSelect: tabClick},
                    {id: "technician", title: "Technician", shown: GROUPBY==="TECHNICIAN", content: createTechnicianTab(), onSelect: tabClick},
                    {id: "age", title: "Age", shown: GROUPBY==="AGE", content: createAgeTab(), onSelect: tabClick}
                ], 132, 468, "prox-legend"));

                return legendContent;


                function tabClick(event){
                    GROUPBY = event.target.id.replace("-tab-label", "").replace("prox-legend-", "").toUpperCase();

                    var checkBoxes = Array.from(document.getElementsByClassName("groupByBox"));

                    checkBoxes.forEach(function(checkBox){
                        checkBox.checked = checkBox.id.replace("GroupByBox","").toUpperCase() === GROUPBY;
                    });

                    fetchGeocodes(function(data){
                        if(!data) return;
                        getNearestActiveSetups(data, function(data){
                            generateProxContent(data);
                        });
                    });
                }

                function createGeneralTab(){
                    var generalTab = document.createElement("div");

                    generalTab.appendChild(createSetupsReturned());

                    generalTab.appendChild(createRadioSelect(MONTHFILTER));

                    return generalTab;

                    function refreshScorpinator(){
                        fetchGeocodes(function(data){
                            getNearestActiveSetups(data, function(data){
                                generateProxContent(data);
                            });
                        });
                    };

                    function createFirstRow(){
                        var wrapperDiv = document.createElement("div");
                        wrapperDiv.style.position = "relative";
                        wrapperDiv.appendChild(createSetupsReturned());

                        return wrapperDiv;

                    }

                    function createSetupsReturned(){

                        var wrapperDiv = document.createElement("div");

                        wrapperDiv.style.fontSize = "10pt";
                        wrapperDiv.style.fontWeight = "bold";
                        wrapperDiv.innerHTML = "Setups: ";

                        wrapperDiv.appendChild(createLegendSelect([50, 100, 250, 500, 1000, 10000], PROXLISTSIZE, function(event){
                            PROXLISTSIZE = event.target.value;
                            fetchGeocodes(function(data){
                                if(!data) return;
                                getNearestActiveSetups(data, function(data){
                                    generateProxContent(data);
                                });
                            });
                        }));

                        return wrapperDiv;

                    }

                    function createRadioSelect(dataModel){
                        var optionsDiv = document.createElement("div");
                        optionsDiv.id = dataModel.name+"OptionsDiv";
                        optionsDiv.style.display = "flex";
                        optionsDiv.style.flexWrap = "wrap";

                        for(var key in dataModel.options){
                            optionsDiv.appendChild(createToggle(dataModel, key));
                        }

                        var radioHeader = document.createElement("p");
                        radioHeader.innerHTML = dataModel.name+":";
                        radioHeader.style.fontSize = "10pt";
                        radioHeader.style.fontWeight = "bold";

                        var wrapperDiv = document.createElement("div");
                        wrapperDiv.appendChild(radioHeader);
                        wrapperDiv.appendChild(optionsDiv);
                        wrapperDiv.style.width = "100%";

                        return wrapperDiv;

                        function createToggle(dataModel, key){

                            var _radio = document.createElement("input");
                            _radio.setAttribute("type", "radio");
                            _radio.id = dataModel.options[key].name+"Option";
                            _radio.classList.add(dataModel.name+"Option");
                            _radio.value = "";
                            _radio.checked = dataModel.options[key].checked;

                            var _label = document.createElement("label");
                            _label.appendChild(_radio);
                            _label.appendChild(document.createTextNode(dataModel.options[key].name));

                            var _radioDiv = document.createElement("div");
                            _radioDiv.style.display = "flex";
                            _radioDiv.style.width = "16%";
                          //  _radioDiv.style.flexWrap = "wrap";
                            _radioDiv.appendChild(_label);

                            _radio.onclick = function(event){
                                dataModel.options[key].checked = true;

                                var radioList = Array.from(document.getElementsByClassName(dataModel.name+"Option"));

                                radioList.forEach(function(radioButton){
                                    var radioKey = radioButton.id.replace("Option", "");

                                    dataModel.options[radioKey].checked = dataModel.options[radioKey] === dataModel.options[key];

                                    radioButton.checked = dataModel.options[radioKey].checked;

                                    if(dataModel.options[radioKey].options){
                                        var subOptionsDiv = document.getElementById(dataModel.options[radioKey].name+"OptionsDiv");
                                        if(subOptionsDiv){
                                            if(!dataModel.options[radioKey].checked){
                                                subOptionsDiv.parentNode.removeChild(subOptionsDiv);
                                            }
                                        } else if(dataModel.options[radioKey].checked){
                                            var subOptionsDiv = createRadioSelect(dataModel.options[radioKey]);
                                            subOptionsDiv.id = dataModel.options[radioKey].name+"OptionsDiv";

                                            subOptionsDiv.style.display = "flex";
                                            subOptionsDiv.style.flexWrap = "wrap";
                                            subOptionsDiv.style.width = "100%";


                                            optionsDiv.appendChild(subOptionsDiv);
                                        }
                                    }

                                });

                                refreshScorpinator();
                            };

                            return _radioDiv;
                        }

                    }

                    function createFilter(dataModel){
                        var _filterDiv = document.createElement("div");

                        for(var key in dataModel){
                            _filterDiv.appendChild(createToggle(key, dataModel));
                        }

                        return _filterDiv;

                        function createToggle(key, dataModel){
                            var _radio = document.createElement("input");
                            _radio.setAttribute("type", "radio");
                            _radio.id = key+"Radio";
                            _radio.classList.add("monthRadio");

                            _radio.onclick = function(event){

                                var radioKey = event.target.id.replace("Radio", "");

                                dataModel[radioKey].checked = true;

                                Array.from(document.getElementsByClassName("monthRadio")).forEach(function(radioButton){
                                    var _key = radioButton.id.replace("Radio", "");

                                    dataModel[_key].checked = (radioButton.id === radioKey+"Radio");

                                    radioButton.checked = dataModel[_key].checked;
                                });

                                fetchGeocodes(function(data){
                                    getNearestActiveSetups(data, function(data){
                                        generateProxContent(data);
                                    });
                                });

                            };

                            var _label = document.createElement("label");
                            _label.appendChild(_radio);
                            _label.appendChild(document.createTextNode(key));

                            return _label;
                        }

                    }

                }

                function createDailyTotalTab(){
                    var dailyTotalTab = document.createElement("div");
                    dailyTotalTab.appendChild(createLegendHeader("DailyTotal", DAILYTOTALS));
                    dailyTotalTab.appendChild(createLegendList("DailyTotal", DAILYTOTALS));

                    return dailyTotalTab;
                }

                function createWeekTab(){
                    var weekTab = document.createElement("div");
                    weekTab.appendChild(createLegendHeader("Week", WEEKS));
                    weekTab.appendChild(createLegendList("Week", WEEKS));

                    return weekTab
                }

                function createWeekDayTab(){
                    var weekDayTab = document.createElement("div");
                    weekDayTab.appendChild(createLegendHeader("WeekDay", WEEKDAYS));
                    weekDayTab.appendChild(createLegendList("WeekDay", WEEKDAYS));

                    return weekDayTab;
                }

                function createTechnicianTab(){
                    var technicianTab = document.createElement("div");
                    technicianTab.appendChild(createLegendHeader("Technician", TECHNICIANS));
                    technicianTab.appendChild(createLegendList("Technician", TECHNICIANS));

                    return technicianTab;
                }

                function createAgeTab(){
                    var ageTab = document.createElement("div");
                    ageTab.appendChild(createLegendHeader("Age", AGES));
                    ageTab.appendChild(createLegendList("Age", AGES));

                    return ageTab;
                }

            }

            function createLegendSelect(options, dataModel, onchange){
                var _select = document.createElement("select");
                _select.style.display = "inline-block";
                _select.value = dataModel;
                _select.onchange = onchange;

                options.forEach(function(option){
                    _select.options.add(new Option(option));
                });

                return _select;
            }

            function createLegendHeader(listType, dataModel){
                var _filterTitle = document.createElement("div");
                _filterTitle.innerHTML = listType+"  ";
                _filterTitle.style.fontSize = "10pt";
                _filterTitle.style.fontWeight = "bold";

                var _header = document.createElement("div");
                _header.appendChild(_filterTitle);
                _header.appendChild(createSelectAll());

                return alignLeftRight(_filterTitle, _header)

                function createSelectAll(){
                    var _selectAllBox = document.createElement("input");
                    _selectAllBox.type = "checkbox";
                    _selectAllBox.name = listType+"SelectAllBox";
                    _selectAllBox.id = listType+"SelectAllBox";
                    _selectAllBox.onclick = selectAll;

                    var _selectAllLabel = document.createElement("label");
                    _selectAllLabel.innerHTML = "&nbsp;Select All&nbsp;";
                    _selectAllLabel.htmlFor = listType+"SelectAllBox";
                    _selectAllLabel.style.cursor = "pointer";
                    _selectAllLabel.style.fontWeight = "bold";

                    var _selectAllSpan = document.createElement("span");
                    _selectAllSpan.appendChild(_selectAllBox);
                    _selectAllSpan.appendChild(_selectAllLabel);

                    return _selectAllSpan;

                    function selectAll(){

                        var checkBoxes = Array.from(document.getElementsByClassName(listType+"Box"))

                        checkBoxes.forEach(function(checkBox){
                            checkBox.checked = event.target.checked;
                            dataModel[checkBox.id.replace("Box", "")].excluded = event.target.checked;
                        });

                        fetchGeocodes(function(data){
                            if(!data) return;
                            getNearestActiveSetups(data, function(data){
                                generateProxContent(data);
                            });
                        });
                    }
                }
            }

            function createLegendList(listType, dataModel){

                var _checkList = document.createElement("ul");
                _checkList.style.listStyle = "none";
                _checkList.style.padding = "5px";

                var colorScale = getColorScale(dataModel);

                var listLength = Object.keys(dataModel).length

                var width = Math.round(400/listLength);

                for (var key in dataModel){

                    var _checkBox = document.createElement("input");
                    _checkBox.id = key+"Box";
                    _checkBox.type = "checkbox";
                    _checkBox.name = dataModel[key].name+"Box";
                    _checkBox.checked = dataModel[key].excluded;
                    _checkBox.style.cursor = "pointer";
                    _checkBox.classList.add(listType+"Box");

                    var _label = document.createElement("label");
                    _label.id = key+"Label";
                    _label.htmlFor = key+"Box";
                    _label.style.cursor = "pointer";
                    _label.innerHTML = dataModel[key].name+"&nbsp;&nbsp;"
                    _label.classList.add("legendLabel");
                    _label.classList.add(listType+"Label");
                    _label.style.textShadow = "0 0 2px "+colorScale[key];

                    var _listItem = document.createElement("li");
                    _listItem.style.transform = "rotate("+Math.round(listLength*2.5)+"deg)";
                    _listItem.style.display = "inline-block";

                    _listItem.style.width = width+"px";
                    _listItem.style.whiteSpace = "nowrap";

                    var _wrapperDiv = document.createElement("div");
                    _wrapperDiv.style.textAlign = "left";
                    _wrapperDiv.style.width = "100%";

                    _wrapperDiv.appendChild(_checkBox);
                    _wrapperDiv.appendChild(_label);

                    _listItem.appendChild(_wrapperDiv);

                    _checkList.appendChild(_listItem);

                    _checkBox.onclick = function(event){

                        var checkBoxData = event.target.id.replace("Box", "");
                        dataModel[checkBoxData].excluded = event.target.checked;

                        var checkBoxes = Array.from(document.getElementsByClassName(listType+"Box"));
                        var selectAll = true;
                        checkBoxes.forEach(function(checkBox){
                            if(!checkBox.checked){
                                selectAll = false;
                            }
                        });
                        document.getElementById(listType+"SelectAllBox").checked = selectAll;

                        fetchGeocodes(function(data){
                            getNearestActiveSetups(data, function(data){
                                generateProxContent(data);
                            });
                        });

                    };

                }

                return _checkList;
            }

        }

        function updateProxMap(data){

            PROXMAPMARKERS.forEach(function(marker){
                marker.setMap(null);
            })

            PROXMAPMARKERS = [];

            data.forEach(function(activeSetup){

                var imageUrl = getMarker(activeSetup, GROUPBY);

                var image = {
                    url: imageUrl,
                    size: new google.maps.Size(64, 64),
                    scaledSize: new google.maps.Size(32, 32),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(15, 31)
                };

                var marker = new google.maps.Marker({
                    map: PROXMAP,
                    icon: image,
                    position: {lat: activeSetup.latitude, lng: activeSetup.longitude},
                    title: createMarkerTitle(activeSetup)
                });

                PROXMAPMARKERS.push(marker);

                marker.addListener("click", function(e){
                    if(addSetupTask){
                        addSetupTaskDetails(activeSetup);
                        addSetupTask = false;
                        document.getElementById("prox-modal").classList.remove("show");
                    } else {
                        goToAccount(activeSetup.account, true);
                    }
                });

            });

        }

        function createMarkerTitle(setup){
            var title = setup.schedule
                +"\n  Location: "+setup.account
                +"\n  Division: "+setup.division
                +"\n  Service: "+setup.service
                +"\n  Tech: "+setup.tech
                +"\n  Age: "+setup.age
                +"\n  Total: "+setup.total
                +"\n  Months: "+setup.months;

            return title;
        }

        function createProxLegend(){

            var proxLegend = document.createElement("div");
            proxLegend.id = "prox-legend";
            proxLegend.style.border = "1px solid";
            proxLegend.style.backgroundColor = "white";



            return proxLegend;
        }

        function createZillowDiv(){

            sendZillowRequest();

            var zillowDiv = document.createElement("div");
            zillowDiv.id = "zillowDiv";
            zillowDiv.height = "100%";
            zillowDiv.width = "100%";
            zillowDiv.innerHTML = "<div style='font-size: 9pt'><strong>Zillonating...</strong></div>";

            GM_addValueChangeListener("zillowData", function(name, old_value, new_value, remote){
                populateZillowDiv(new_value);
                populateServiceDiv(new_value);
            });

            return zillowDiv;

        }

        function sendZillowRequest(){
            var loginData = getLoginData();

            if(loginData){

                var address = getLocationAddress();

                var baseUrl = "https://azpestcontrol.services/api/zillowData.php";

                var queryUrl = baseUrl+"?token="+loginData.token+"&address="+address.street+"&citystatezip="+address.zipcode.replaceAll(" ", "+");

                var zillowLabel = document.getElementById("proximator-zillow-tab-label");
                var zillowContent = document.getElementById("proximator-zillow-tab-content");

                httpGetXML(queryUrl, function(data){
                    if(!data) return;
                    var searchResults = data['SearchResults:searchresults'];
                    if(searchResults.response){
                        var zillowData = searchResults.response.results.result;
                        zillowData.date = new Date();
                        GM_setValue("zillowData", JSON.stringify(zillowData));

                        console.log("ZILLONATED");

                        console.log(zillowData);

                        if(zillowLabel&&zillowContent){
                            toggleDisplay([zillowLabel], "inline-block");
                            toggleDisplay([zillowContent], "block");
                        }
                    } else {
                        if(zillowLabel&&zillowContent){
                            toggleDisplay([zillowLabel, zillowContent], "none");
                        }
                    }
                });

            }

        }

        function populateZillowDiv(zData){
            zData = JSON.parse(zData);

            if(!checkAddress(zData.address)) return;

            var zillowDiv = document.getElementById("zillowDiv");

            zillowDiv.innerHTML = "";

            zillowDiv.appendChild(displayText({title: zData.address.street}));
            zillowDiv.appendChild(displayText({title: zData.address.city+", "+zData.address.state+" "+zData.address.zipcode, line: true}));
            zillowDiv.appendChild(displayText({title: zData.useCode, line: true}));
            zillowDiv.appendChild(displayText({bold: "Year Built: ", plain: zData.yearBuilt}));
            zillowDiv.appendChild(displayText({bold: "Home Sq Ft: ", plain: zData.finishedSqFt}));
            zillowDiv.appendChild(displayText({bold: "Lot Sq Ft: ", plain: zData.lotSizeSqFt}));
            zillowDiv.appendChild(displayText({bold: "Bedrooms: ", plain: zData.bedrooms}));
            zillowDiv.appendChild(displayText({bold: "Bathrooms: ", plain: zData.bathrooms}));
            zillowDiv.appendChild(displayText({bold: "Total Rooms: ", plain: zData.totalRooms}));

        }

        function createServiceDiv(){
            var serviceDiv = document.createElement("div");
            serviceDiv.id = "serviceDiv";
            serviceDiv.height = "100%";
            serviceDiv.width = "100%";

            serviceDiv.appendChild(displayText({title: "Service Builder", line: true}));

            return serviceDiv;
        }

        function populateServiceDiv(zData){
            zData = JSON.parse(zData);

            if(!checkAddress(zData.address)) return;

            displayGuesstimate(getGuesstimate(zData));

            function displayGuesstimate(guesstimate){
                var serviceDiv = document.getElementById("serviceDiv");
                serviceDiv.innerHTML = "";

                serviceDiv.appendChild(displayText({title: zData.address.street}));
                serviceDiv.appendChild(displayText({title: zData.address.city+", "+zData.address.state+" "+zData.address.zipcode, line: true}));

                serviceDiv.appendChild(createSqFtInputs());

                serviceDiv.appendChild(displayText({line: true}));

                serviceDiv.appendChild(displayText({bold: "Initial: ", plain: "$"+guesstimate.initial}));
                serviceDiv.appendChild(displayText({bold: "One Time: ", plain: "$"+guesstimate.oneTime}));
                serviceDiv.appendChild(displayText({bold: "Quarterly: ", plain: "$"+guesstimate.quarterly}));
                serviceDiv.appendChild(displayText({bold: "Bimonthly: ", plain: "$"+guesstimate.bimonthly}));
                serviceDiv.appendChild(displayText({bold: "Monthly: ", plain: "$"+guesstimate.monthly}));
            }

            function createSqFtInputs(){

                var homeSqFtInput = document.createElement("input");
                homeSqFtInput.value = zData.finishedSqFt;
                homeSqFtInput.style.width = "50%";
                homeSqFtInput.style.textAlign = "right";
                homeSqFtInput.style.fontSize = "11pt";
                homeSqFtInput.style.margin = "0";
                homeSqFtInput.style.padding = "0";

                homeSqFtInput.addEventListener("blur", function(){
                    zData.finishedSqFt = homeSqFtInput.value;
                    displayGuesstimate(getGuesstimate(zData));
                });

                var homeSqFtLabel = document.createElement("label");
                homeSqFtLabel.style.top = "2px";
                homeSqFtLabel.style.width = "49%";
                homeSqFtLabel.style.fontSize = "10pt";
                homeSqFtLabel.style.fontWeight = "bold";
                homeSqFtLabel.innerHTML = "Home Sq Ft: ";

                var homeDiv = document.createElement("div");
                homeDiv.style.display = "flex";
                homeDiv.appendChild(homeSqFtLabel);
                homeDiv.appendChild(homeSqFtInput);

                var lotSqFtInput = document.createElement("input");
                lotSqFtInput.value = zData.lotSizeSqFt;
                lotSqFtInput.style.width = "49%";
                lotSqFtInput.style.textAlign = "right";
                lotSqFtInput.style.fontSize = "11pt";
                lotSqFtInput.style.margin = "0";
                lotSqFtInput.style.padding = "0";

                lotSqFtInput.addEventListener("blur", function(){
                    zData.lotSizeSqFt = lotSqFtInput.value;
                    displayGuesstimate(getGuesstimate(zData));
                });

                var lotSqFtLabel = document.createElement("label");
                lotSqFtLabel.style.top = "2px";
                lotSqFtLabel.style.left = "1%";
                lotSqFtLabel.style.width = "50%";
                lotSqFtLabel.style.fontSize = "10pt";
                lotSqFtLabel.style.fontWeight = "bold";
                lotSqFtLabel.innerHTML = "Lot Sq Ft: ";

                var lotDiv = document.createElement("div");
                lotDiv.style.display = "flex";
                lotDiv.appendChild(lotSqFtLabel);
                lotDiv.appendChild(lotSqFtInput);

                var sqFtDiv = document.createElement("div");
                sqFtDiv.style.display = "flex";
                sqFtDiv.appendChild(homeDiv);
                sqFtDiv.appendChild(lotDiv);

                return sqFtDiv;
            }

        }

        function createUpdateDiv(){
            var tableData = { rows: [
                { cells: [
                    { content: displayText( { title: "Update Account Data"} ) }
                ] },
                { cells: [
                    { content: displayText( { line: true } ) }
                ] },
                { cells: [
                    { content: displayText( { plain: "&nbsp;&nbsp;&nbsp; Opens a service setup report in a new window, extracting relevant details and uploading them to azpestcontrol.services database. Gives alert upon completion."} ) }
                ] },
                { cells: [
                    { content: displayText( { plain: "&nbsp;&nbsp;&nbsp; Uploading account data allows the most recent changes to be accessed remotely from authorized users, both through azpestcontrol.services and Scorpinator userscript."} ) }
                ] },
                { cells: [
                    { content: displayText( { line: true } ) }
                ] },
                { cells: [
                    { content: createButton( { text: "Update", onclick: updateClick } ) }
                ] }
            ] };

            var updateDiv = document.createElement("div");
            updateDiv.id = "updateDiv";
            updateDiv.height = "100%";
            updateDiv.width = "100%";

            updateDiv.appendChild(createTable(tableData));

            return updateDiv;

            function updateClick(){
                GM_setValue("retrieveAccountData", "activeSetups");

                var retrieveURL = "https://app.pestpac.com/reports/gallery/offload.asp?OffloadAction=https%3A%2F%2Freporting.pestpac.com%2Freports%2FserviceSetups%2FreportRemote.asp&ReportID=47&CompanyKey=108175&CompanyID=12";

                window.open(retrieveURL);

            }
        }

        function createProfileDiv(){
            var loginData = getLoginData();

            var tableData = { rows: [
                { cells: [
                    { content: displayText( { title: "Scorpinator User Profile" } ) }
                ] },
                { cells: [
                    { content: displayText( { line: true } ) }
                ] },
                { cells: [
                    { content: displayText( { bold: "User: ", plain: loginData.username } ) }
                ] },
                { cells: [
                    { content: displayText( { bold: "Role: ", plain: loginData.role } ) }
                ] },
                { cells: [
                    { content: displayText( { plain: "Uses same login credentials as azpestcontrol.services" } ) }
                ] },
                { cells: [
                    { content: displayText( { line: true } ) }
                ] },
                { cells: [
                    { content: createButton( { text: "Logout", onclick: logoutClick } ) }
                ] }
            ] };

            var profileDiv = document.createElement("div");
            profileDiv.id = "profileDiv";
            profileDiv.height = "100%";
            profileDiv.width = "100%";

            profileDiv.appendChild(createTable(tableData));

            return profileDiv;

            function logoutClick(){
                console.log("LOGGED OUT");
                GM_deleteValue("currentUser");
                location.reload();
            };

        }

        function createTimeCardDiv(){
            var timeCardLink = document.createElement("a");
            timeCardLink.innerHTML = "TimeCard";
            timeCardLink.onclick = function(){
                window.open("https://azpestcontrol.services/timeCard");
            };

            var timeCardDiv = document.createElement("div");
            timeCardDiv.id = "timeCardDiv";
            timeCardDiv.height = "100%";
            timeCardDiv.width = "100%";

            timeCardDiv.appendChild(timeCardLink);

            return timeCardDiv;

            function getUserList(){
                httpGetAsync("https://azpestcontrol.services/api/_users.php", accountString, function(res){
                    alert("Scorpinator SetupList update complete: "+res);
                    window.close();
                });
            }

        }

        function createRulesDiv(){
            var loginData = getLoginData();

            var rulesDiv = document.createElement("div");
            rulesDiv.style.height = "430px";
            rulesDiv.style.width = "444px";

            var rulesUrl = "https://azpestcontrol.services/article/read/2";

            var iframe = document.createElement("iframe");
            iframe.id = "rulesIframe";
            iframe.style.height = "100%";
            iframe.style.width = "100%";
            iframe.src = rulesUrl;

            rulesDiv.appendChild(iframe);

            return rulesDiv;
        }

        function checkAddress(address){

            var location = getLocationAddress();

            var checkAddress = address.street.split(" ")[0]+" "+address.zipcode;

            var checkLocation = location.street.split(" ")[0]+" "+address.zipcode;

            if(checkAddress === checkLocation) {
                return true;
            }

            return checkAddress === checkLocation;

        }

        function clickToDismiss(event){
            var element = event.target;

            var proxModal = document.getElementById("prox-modal");

            if(!proxModal) return;

            if(proxModal.classList.contains("show")){

                if(checkElementAncestry(element, proxModal)) return;

                proxModal.classList.remove("show");

            }

        }

        function addSetupTaskDetails(activeSetup){
            var taskNameInput = document.getElementById("subject");
            var descriptionInput = document.getElementById("description");
            var dueDateInput = document.getElementById("dueDate");

            var _service = descriptionInput.value.match(/Service: (.*)/g)[0].split(" ")[1];

            var _schedule = activeSetup.schedule.substring(0,1) + capitalizeFirstLetter(activeSetup.schedule.substring(1,4));
            var _technician = capitalizeFirstLetter(activeSetup.tech);
            var _nextDate = getNextServiceDate(dueDateInput.value, _schedule, _service.slice(-1));

            descriptionInput.value = descriptionInput.value
                                        .replace("Schedule: ", "Schedule: "+_schedule)
                                        .replace("Technician: ", "Technician: "+_technician)
                                        .concat("\nNextDate: "+_nextDate);

        }
    }

    function createLabel(field){
        var _label = document.createElement("label");
        _label.style.margin = "2%";
        _label.style.fontSize = "13px";
        _label.style.fontWeight = "bold";
        _label.htmlFor = field+"Input";
        _label.innerHTML = capitalizeFirstLetter(field);

        return _label;
    }

    function createInput(field){
        var _input = document.createElement("input");
        _input.style.margin = "1% 2% 1% 2%";
        _input.style.padding = "1%";
        _input.style.width = "94%";
        _input.style.fontSize = "13px";
        _input.id = field+"Input";
        _input.name = field+"Input";
        _input.type = "text";

        return _input;
    }

    function createLabeledInput(field, value){
        var _label = createLabel(field);

        var _input = createInput(field);
        _input.value = value;
        _input.id = field.replace(" ", "")+"Input";

        var _div = document.createElement("div");
        _div.style.width = "24%";
        _div.style.display = "inline-block";

        _div.appendChild(_label);
        _div.appendChild(_input);

        return _div;
    }

    function createButton(buttonData){
        var _button = document.createElement("button");
        _button.classList.add("scorpinated");
        _button.id = buttonData.text.replace(" ", "")+"Button";
        _button.innerHTML = buttonData.text;
        _button.addEventListener('click', buttonData.onclick);

        return _button;
    }

    function createIcon(iconData){

        var iconImg = document.createElement("img");
        iconImg.id = iconData.id;
        iconImg.src = iconData.src;
        iconImg.style.width = iconData.size;
        iconImg.style.height = iconData.size;

        var iconLink = document.createElement("a");
        iconLink.style.cursor = "pointer";
        iconLink.addEventListener('click', function(){
            iconData.onclick();
        });

        iconLink.appendChild(iconImg);

        return iconLink;
    }

    function createTable(tableData){
        var _table = document.createElement("table");

        for(var i = 0; i < tableData.rows.length; i++){
            var _rowData = tableData.rows[i];
            var _row = _table.insertRow();
            for(var ii = 0; ii < _rowData.cells.length; ii++){
                var _cellData = _rowData.cells[ii];
                var _cell = _row.insertCell();
                if(_cellData.colSpan) _cell.colSpan = _cellData.colSpan;
                if(_cellData.content) _cell.appendChild(_cellData.content);
            }
        }

        if(tableData.width){
            _table.style.width = tableData.width;
        }

        return _table;
    }

    function displayText(data){
        var outputDiv = document.createElement("div");

        if(data.title){
            var titleDiv = document.createElement("div");
            titleDiv.style.fontSize = "11pt";
            titleDiv.innerHTML = "<strong>"+data.title+"</strong>";
            outputDiv.appendChild(titleDiv);
        }

        if(data.bold){
            var boldSpan = document.createElement("span");
            boldSpan.style.fontSize = "9pt";
            boldSpan.innerHTML = "<strong>"+data.bold+"</strong>";
            outputDiv.appendChild(boldSpan);
        }

        if(data.plain){
            var plainSpan = document.createElement("span");
            plainSpan.style.fontSize = "9pt";
            plainSpan.innerHTML = data.plain;
            outputDiv.appendChild(plainSpan);
        }

        if(data.line){
            var hr = document.createElement("hr");
            outputDiv.appendChild(hr);
        }

        return outputDiv;
    }

    function setDivision(dataList){
        if(urlContains(["location/add.asp", "location/edit.asp"])){

            var divisionSelect = document.getElementById("Division");

            if(!divisionSelect.value){
                var divisionList = [];
                for(var i = 0; i < dataList.length; i++){
                    if(dataList[i].zipcode===document.getElementById("Zip").value){
                        divisionList.push(dataList[i].division);
                    }
                }

                var division = divisionList.sort((a,b) => divisionList.filter(v => v===a).length - divisionList.filter(v => v===b).length).pop();

                if(!division) return;

                divisionSelect.focus();
                divisionSelect.value = division;
                divisionSelect.blur();

                var divisionLabel = divisionSelect.parentElement.previousElementSibling;
                divisionLabel.classList.add("scorpinated");
            }
        }
    }

    function autoTaskinator(){
        if(urlContains(["/task"])){

            fixLinks();

            var observer = new MutationObserver(function(mutations){

                mutations.forEach(function(mutation){

                    if (!mutation.addedNodes) return

                    for (var i = 0; i < mutation.addedNodes.length; i++) {

                        var node = mutation.addedNodes[i];

                        if(node.children)
                        if(node.children[0])
                        if(node.children[0].id === "managerTasksTable") fixLinks();

                    }

                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            function fixLinks(){
                var _linkList = document.getElementsByClassName("location-link");

                for(var i = 0; i < _linkList.length; i++){
                    var _link = _linkList[i];
                    _link.target = "_blank";
                }
            }

        } else if(urlContains(["location/detail.asp"])){
            addServiceOrderLinks();
            addTaskButtons();
        }

        function addServiceOrderLinks(){
            var ordersTable = document.getElementById("OrdersTable");
            var ordersTableRows = null;

            var taskServices = ["BED BUGS","CARPET BEETLE","COM-IN","FREE ESTIMATE","FREE ESTIMATE C","IN","IN.2","FLEAS","ONE","RE-START","ROACH","TICK-IN","TICKS","WDO TERMITE","WDO INSP E","WDO INSP H"];

            if(ordersTable){
                ordersTableRows = ordersTable.children[0].children;

                for(var i = 0; i < ordersTableRows.length; i++){
                    var container = document.createElement("td");
                    container.style.width = "72px";
                    container.style.textAlign = "center";
                    container.style.cursor = "default";
                    container.onclick = function(e){
                        e.stopPropagation();
                        e.preventDefault();
                    }

                    ordersTableRows[i].insertBefore(container, ordersTableRows[i].firstChild);

                    if(!ordersTableRows[i].classList.contains("noncollapsible")){
                        var serviceOrder = getServiceOrder(i);
                        if(serviceOrder.service!==""){
                            container.style.height = "20px";
                            container.appendChild(createTextReminderLink(i));

                            if(taskServices.indexOf(serviceOrder.service) > -1){
                                container.appendChild(createTaskLink(i));
                            }
                        }
                    }
                }

            }

            function createTaskLink(row){
                var link = document.createElement("a");
                link.id = "taskLink"+row;
                link.style.cursor = "pointer";
                link.style.marginLeft = "4px";
                link.style.marginRight = "4px";
                link.style.hover = "";

                var taskIcon = createTaskIcon(row);

                link.appendChild(taskIcon);

                link.addEventListener("click", function(e){
                    e.stopPropagation();
                    setTimeout(function(){
                        var addTask = document.getElementById("addTask");
                        var collapsedAddTask = document.getElementById("collapsedAddTask");
                        var row = e.target.id.replace("taskIcon","");

                        console.log(row);

                        if(addTask){
                            addTask.click();
                        } else {
                            collapsedAddTask.click();
                        }

                        createSetupTask(row);
                    }, 500);

                    spinButton(taskIcon, 16);
                });

                return link;

                function createTaskIcon(row){
                    var image = document.createElement("img");
                    image.src = "https://rjhuffaker.github.io/clipboard.png";
                    image.id = "taskIcon"+row;
                    image.style.margin = "-4px";
                    image.style.width = "16px";
                    image.style.height = "16px";

                    return image;
                }
            }

            function createTextReminderLink(row){
                var link = document.createElement("a");
                link.style.cursor = "pointer";
                link.class = "autoText-link";
                link.style.marginLeft = "4px";
                link.style.marginRight = "8px";

                var textIcon = createTextIcon(JSON.stringify(row));

                link.appendChild(textIcon);

                link.addEventListener("click", function(e){

                    e.stopPropagation();

                    var row = e.target.id.replace("textIcon","");

                    var serviceOrder = getServiceOrder(row);

                    console.log(serviceOrder);

                    var textData = {
                        phone: getContactInfo().phoneNumbers[0],
                        name: getContactInfo().name,
                        id: getContactInfo().id,
                        message: "",
                        division: document.getElementById("Division").value,
                        timeStamp: Date.now()
                    };

                    if(serviceOrder.service==="IN" || serviceOrder.service==="TICK-IN"){
                        if(serviceOrder.day==="Saturday" || serviceOrder.day==="Sunday"){
                            textData.message = "Hi, this is Responsible Pest Control. Thank you for purchasing our services online. It appears you had requested a "
                                +serviceOrder.day+" appointment. Unfortunately, we don't provide Saturday or Sunday services. "
                                +"We do however, start as early as 7am and our last appointment is around 4:30-5pm Monday-Friday. "
                                +"Is there a day or time that would work for you? Thanks again! Responsible Pest Control";
                        } else if(serviceOrder.tech===""){
                            alert("Not scheduled!");
                            return;
                        } else if(serviceOrder.orderInstructions.includes("Last Screen Viewed:")){
                            textData.message = "Hi, this is Responsible Pest Control. Thank you for purchasing our services online. We have you scheduled for "
                                +serviceOrder.day+", "+getReadableDate(serviceOrder.date)
                                +", with an arrival time between "+serviceOrder.startTime+" and "+serviceOrder.endTime
                                +". We look forward to serving you. Feel free to contact us with any questions or concerns. Call/text 480-924-4111";
                        } else {
                            textData.message = "Hi, this is Responsible Pest Control. We have your home scheduled for service on "+serviceOrder.day+", "
                                +getReadableDate(serviceOrder.date)+". If you have any questions or need to reschedule please let me know. If not, we'll see you "
                                +serviceOrder.day+". Thanks!";
                        }
                    } else {
                        textData.message = "Hi, this is Responsible Pest Control. We have your home scheduled for service on "+serviceOrder.day+", "
                            +getReadableDate(serviceOrder.date)+". If you have any questions or need to reschedule please let me know. If not, we'll see you "
                            +serviceOrder.day+". Thanks!";
                    }

                    GM_setValue("autoText", JSON.stringify(textData));

                    spinButton(textIcon, 16);
                });

                return link;

                function createTextIcon(serviceOrder){
                    var image = document.createElement("img");
                    image.src = "https://rjhuffaker.github.io/heymarket_black.png";
                    image.id = "textIcon"+i;
                    image.style.margin = "-4px";
                    image.style.width = "16px";
                    image.style.height = "16px";

                    return image;
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

                var target = getSetupTarget(document.getElementById("tblDirections").value+" "+serviceOrder.locationInstructions+" "+serviceOrder.orderInstructions);

                var setupPrice = "";

                var taskName = "";

                var taskDescription = "";

                switch (serviceOrder.service){
                    case "BED BUGS":
                        prioritySelect.value = "3";
                        taskTypeSelect.value = "12";
                        dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                        taskForSelect.value = "2719";
                        taskName = "Generate follow-up for Bed Bugs on "+getFutureDate(serviceOrder.date, 14);
                        taskForSelect.value = "2915";
                        break;
                    case "CARPET BEETLE":
                        prioritySelect.value = "3";
                        taskTypeSelect.value = "12";
                        dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                        taskForSelect.value = "2719";
                        taskName = "Generate follow-up for Carpet Beetles on "+getFutureDate(serviceOrder.date, 14);
                        taskForSelect.value = "2915";
                        break;
                    case "FREE ESTIMATE":
                        prioritySelect.value = "3";
                        taskTypeSelect.value = "16";
                        dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                        taskForSelect.value = "2719";
                        addSetupTask = true;
                        taskName = "Check Estimate";
                        taskDescription = "Service: $??M\nSchedule: \nTechnician: \nTarget: "+target+"\nDuration: \nStartDate: "+serviceOrder.date;
                        document.getElementById("prox-icon").click();
                        break;
                    case "FREE ESTIMATE C":
                        prioritySelect.value = "3";
                        taskTypeSelect.value = "16";
                        dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                        taskForSelect.value = "2719";
                        addSetupTask = true;
                        taskName = "Check estimate";
                        taskDescription = "Service: $??COMM\nSchedule: \nTechnician: \nTarget: "+target+"\nDuration: \nStartDate: "+serviceOrder.date;
                        document.getElementById("prox-icon").click();
                        break;
                    case "IN":
                        prioritySelect.value = "3";
                        taskTypeSelect.value = "16";
                        dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                        taskForSelect.value = "2915";
                        addSetupTask = true;
                        setupPrice = getSetupPrice(serviceOrder.locationInstructions);

                        if(serviceOrder.orderInstructions.includes("Service: ")){
                            taskName = "Update New Setup";
                        } else {
                            taskName = "Create New Setup";
                        }
                        taskDescription = "Service: "+setupPrice+"\nSchedule: \nTechnician: \nTarget: "+target+"\nDuration: "+getSetupDuration(setupPrice)+"\nStartDate: "+serviceOrder.date;
                        document.getElementById("prox-icon").click();
                        break;
                    case "IN.2":
                        prioritySelect.value = "3";
                        taskTypeSelect.value = "16";
                        dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                        taskForSelect.value = "2915";
                        addSetupTask = true;
                        setupPrice = getSetupPrice(serviceOrder.locationInstructions);
                        taskName = "Create New Setup";
                        taskDescription = "Service: "+setupPrice+"\nSchedule: \nTechnician: \nTarget: "+target+"\nDuration: "+getSetupDuration(setupPrice)+"\nStartDate: "+serviceOrder.date;
                        document.getElementById("prox-icon").click();
                        break;
                    case "COM-IN":
                        prioritySelect.value = "3";
                        taskTypeSelect.value = "16";
                        dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                        taskForSelect.value = "2719";
                        addSetupTask = true;
                        setupPrice = getSetupPrice(serviceOrder.locationInstructions);
                        taskName = "Create New Setup (Commercial)";
                        taskDescription = "Service: "+setupPrice.toUpperCase().replace("M", "COMM")+"\nSchedule: \nTechnician: \nTarget: "+target+"\nDuration: "+getSetupDuration(setupPrice)+"\nStartDate: "+serviceOrder.date;
                        document.getElementById("prox-icon").click();
                        break;
                    case "FLEAS":
                        prioritySelect.value = "3";
                        taskTypeSelect.value = "12";
                        dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                        taskForSelect.value = "2719";
                        taskName = "Generate 1 more Flea treatment on "+getFutureDate(serviceOrder.date, 14);
                        break;
                    case "ONE":
                        prioritySelect.value = "3";
                        taskTypeSelect.value = "16";
                        dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                        taskName = "Check one-time for ongoing";
                        taskDescription = "Service: \nSchedule: \nTechnician: \nTarget: "+target+"\nDuration: \nStartDate: "+serviceOrder.date;
                        break;
                    case "RE-START":
                        prioritySelect.value = "3";
                        taskTypeSelect.value = "16";
                        dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                        taskForSelect.value = "2915";
                        addSetupTask = true;
                        setupPrice = getSetupPrice(serviceOrder.locationInstructions);
                        taskName = "Create New Setup";
                        taskDescription = "Service: "+setupPrice+"\nSchedule: \nTechnician: \nTarget: "+target+"\nDuration: "+getSetupDuration(setupPrice)+"\nStartDate: "+serviceOrder.date;
                        document.getElementById("prox-icon").click();
                        break;
                    case "ROACH":
                        prioritySelect.value = "3";
                        taskTypeSelect.value = "12";
                        dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                        taskForSelect.value = "2719";
                        taskName = "Generate 2 more GR treatments @ $100 ea";
                        break;
                    case "TICKS":
                        prioritySelect.value = "3";
                        taskTypeSelect.value = "12";
                        dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                        taskForSelect.value = "2719";
                        taskName = "Generate 1 more Tick treatment on "+getFutureDate(serviceOrder.date, 14);
                        break;
                    case "TICK-IN":
                        prioritySelect.value = "3";
                        taskTypeSelect.value = "16";
                        dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                        taskForSelect.value = "2915";
                        addSetupTask = true;
                        setupPrice = getSetupPrice(serviceOrder.locationInstructions);
                        taskName = "Generate 1 more Tick treatment on "+getFutureDate(serviceOrder.date, 14)+" & Create New Setup";
                        taskDescription = "Service: "+setupPrice+"\nSchedule: \nTechnician: \nTarget: "+target+"\nDuration: "+getSetupDuration(setupPrice)+"\nStartDate: "+serviceOrder.date;
                        document.getElementById("prox-icon").click();
                        break;
                    case "WDO TERMITE":
                        prioritySelect.value = "3";
                        taskTypeSelect.value = "12";
                        dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                        taskForSelect.value = "2719";
                        taskName = "Add termite warranty";
                        break;
                    case "WDO INSP E":
                        prioritySelect.value = "2";
                        taskTypeSelect.value = "13";
                        dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                        taskForSelect.value = "2853";
                        taskName = "Check for Report";
                        break;
                    case "WDO INSP H":
                        prioritySelect.value = "2";
                        taskTypeSelect.value = "13";
                        dueDateInput.value = getFutureDate(serviceOrder.date, 1);
                        taskForSelect.value = "2853";
                        taskName = "Check for Report";
                        break;
                    default:
                        console.log("TODO: Don't know what to do with this.");
                }

                taskNameInput.value = taskName;

                descriptionInput.value = taskDescription;

                function getSetupPrice(data){
                    var setupPrice = "???";

                    var setupNotes = [
                        { input: "40mo", output: "$40M" },
                        { input: "$40mo", output: "$40M" },
                        { input: "40 mo", output: "$40M" },
                        { input: "mo$40", output: "$40M" },
                        { input: "mo $40", output: "$40M" },
                        { input: "mo @ $40", output: "$40M" },
                        { input: "monthly @ $40", output: "$40M" },

                        { input: "45mo", output: "$45M" },
                        { input: "$45mo", output: "$45M" },
                        { input: "45 mo", output: "$45M" },
                        { input: "mo$45", output: "$45M" },
                        { input: "mo $45", output: "$45M" },
                        { input: "mo @ $45", output: "$45M" },
                        { input: "monthly @ $45", output: "$45M" },

                        { input: "49mo", output: "$49M" },
                        { input: "$49mo", output: "$49M" },
                        { input: "49 mo", output: "$49M" },
                        { input: "mo$49", output: "$49M" },
                        { input: "mo $49", output: "$49M" },
                        { input: "mo @ $49", output: "$49M" },
                        { input: "monthly @ $49", output: "$49M" },

                        { input: "55mo", output: "$55M" },
                        { input: "$55mo", output: "$55M" },
                        { input: "55 mo", output: "$55M" },
                        { input: "mo$55", output: "$55M" },
                        { input: "mo $55", output: "$55M" },
                        { input: "mo @ $55", output: "$55M" },
                        { input: "monthly @ $55", output: "$55M" },

                        { input: "59mo", output: "$59M" },
                        { input: "$59mo", output: "$59M" },
                        { input: "59 mo", output: "$59M" },
                        { input: "mo$59", output: "$59M" },
                        { input: "mo $59", output: "$59M" },
                        { input: "mo @ $59", output: "$59M" },
                        { input: "monthly @ $59", output: "$59M" },

                        { input: "60mo", output: "$60M" },
                        { input: "$60mo", output: "$60M" },
                        { input: "60 mo", output: "$60M" },
                        { input: "mo$60", output: "$60M" },
                        { input: "mo $60", output: "$60M" },
                        { input: "mo @ $60", output: "$60M" },
                        { input: "monthly @ $60", output: "$60M" },

                        { input: "65mo", output: "$65M" },
                        { input: "$65mo", output: "$65M" },
                        { input: "65 mo", output: "$65M" },
                        { input: "mo$65", output: "$65M" },
                        { input: "mo $65", output: "$65M" },
                        { input: "mo @ $65", output: "$65M" },
                        { input: "monthly @ $65", output: "$65M" },

                        { input: "69mo", output: "$69M" },
                        { input: "$69mo", output: "$69M" },
                        { input: "69 mo", output: "$69M" },
                        { input: "mo$69", output: "$69M" },
                        { input: "mo $69", output: "$69M" },
                        { input: "mo @ $69", output: "$69M" },
                        { input: "monthly @ $69", output: "$69M" },

                        { input: "55eom", output: "$55B" },
                        { input: "55 bimonthly", output: "$55B" },
                        { input: "59eom", output: "$59B" },
                        { input: "59 bimonthly", output: "$59B" },
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
                        { input: "99 quarterly", output: "$99Q" },

                        { input: "property size: small selected service: monthly", output: "$45M" },
                        { input: "property size: medium selected service: monthly", output: "$49M" },
                        { input: "property size: large selected service: monthly", output: "$55M" }
                    ];

                    for(var i = 1; i < setupNotes.length; i++){

                        if(data.toLowerCase().indexOf(setupNotes[i].input) > -1){
                            setupPrice = setupNotes[i].output;
                        }
                    }

                    return setupPrice;
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

                function getSetupDuration(data){
                    var duration = "00:25";

                    if(data){
                        var price = parseInt(data.toUpperCase().replace("M","").replace("$",""));
                        if(!isNaN(price)) duration = convertMinutesToHours(Math.ceil(price/10)*5);
                    }

                    return duration;
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
                        if(allNotesContainer) allNotesContainer.style.minHeight = "18px";

                        var lastNoteSection = document.getElementById("lastNoteSection");
                        if(lastNoteSection) lastNoteSection.style.minHeight = "140px";

                        var locationTaskNoteSection = document.getElementById("locationTaskNoteSection");
                        if(locationTaskNoteSection) locationTaskNoteSection.parentNode.style.minHeight = "166px";

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

                var taskName = document.getElementById("subject").value.toLowerCase();

                var taskDescription = document.getElementById("description").value;

                if(taskName.includes("follow up")){

                    otherButtonsContainer.appendChild(createButton({ text: "Text Follow-up", onclick: sendFollowUpHandler }));
                    otherButtonsContainer.appendChild(createButton({ text: "Generate", onclick: generateHandler }));

                    otherButtonsContainer.appendChild(createHistoryIframe());

                } else if(taskName.includes("update new") && taskDescription.includes("Schedule:")){

                    otherButtonsContainer.appendChild(createButton({ text: "Update Setup", onclick: updateSetupHandler }));
                    otherButtonsContainer.appendChild(createButton({ text: "Missed", onclick: missedHandler }));
                    otherButtonsContainer.appendChild(createButton({ text: "Balance", onclick: balanceHandler }));
                    otherButtonsContainer.appendChild(createHistoryIframe());

                } else if(taskName.includes("create new") && taskDescription.includes("Schedule:")){

                    otherButtonsContainer.appendChild(createButton({ text: "Create Setup", onclick: createSetupHandler }));
                    otherButtonsContainer.appendChild(createButton({ text: "Missed", onclick: missedHandler }));
                    otherButtonsContainer.appendChild(createButton({ text: "Balance", onclick: balanceHandler }));
                    otherButtonsContainer.appendChild(createButton({ text: "Undecided", onclick: undecidedHandler }));

                    otherButtonsContainer.appendChild(createHistoryIframe());

                } else if(taskName.includes("send welcome")){
                    otherButtonsContainer.appendChild(createButton({ text: "Welcome Letter", onclick: welcomeHandler }));
                    otherButtonsContainer.appendChild(createButton({ text: "Generate", onclick: generateHandler }));
                }

                if(taskName){
                    otherButtonsContainer.appendChild(createButton({ text: "Complete", onclick: completeHandler }));
                } else {
                    otherButtonsContainer.appendChild(createButton({ text: "Blank Setup Task", onclick: createBlankSetupTask }));
                }

                return otherButtonsContainer;

                function createHistoryIframe(){
                    var locationID = window.location.search.match(/\LocationID.*/g)[0].replace("LocationID=","");
                    var historyUrl = "iframe/billHist.asp?LocationID="+locationID+"&Sort=Date&BillFilter=B&OpenOnly=0&scorpinator=0";

                    var iframe = document.createElement("iframe");
                    iframe.id = "historyIframe";
                    iframe.src = historyUrl;
                    iframe.style.display = "none";

                    return iframe;
                }

            }
        }

        function completeHandler(event){
            event.preventDefault();
            document.getElementById("status").value = "C";
            document.getElementById("butSave").click();
        }

        function missedHandler(event){
            event.preventDefault();

            var locationPhoneNumberLink = document.getElementById('locationPhoneNumberLink');

            if(locationPhoneNumberLink){
                var taskDescription = document.getElementById("description").value;

                var startDate = taskDescription.match(/StartDate: (.*)/g)[0].split(" ")[1];

                GM_setValue("autoText", JSON.stringify({
                    phone: locationPhoneNumberLink.value,
                    name: getContactInfo().name,
                    id: getContactInfo().id,
                    message: "Hi, Responsible Pest Control here. It looks like we were scheduled to come by on "+startDate+" but it didn't work out. Please reply or give us a call @ 480-924-4111 to reschedule. Thank you!",
                    division: document.getElementById("Division").value,
                    timeStamp: Date.now()
                }));

                document.getElementById("subject").value = "Send Text to Reschedule Initial";

                document.getElementById("description").value = taskDescription+"\n"+getCurrentReadableDate()+" Sent Txt (Reschedule)";

                document.getElementById("status").value = "C";
            }
        }

        function createBlankSetupTask(){
            event.preventDefault();

            var taskNameInput = document.getElementById("subject");
            var descriptionInput = document.getElementById('description');
            var prioritySelect = document.getElementById("priority");
            var taskTypeSelect = document.getElementById("taskType");
            var dueDateInput = document.getElementById("dueDate");
            var taskForSelect = document.getElementById("taskForID");

            prioritySelect.value = "3";
            taskTypeSelect.value = "16";
            dueDateInput.value = getFutureDate(false, 0);
            taskForSelect.value = "2915";
            taskNameInput.value = "Create New Setup";
            descriptionInput.value = "Service: \nSchedule: \nTechnician: \nTarget: \nDuration: \nStartDate: "
            addSetupTask = true;

            document.getElementById("prox-icon").click();

        }

        function balanceHandler(event){
            event.preventDefault();

            var locationPhoneNumberLink = document.getElementById('locationPhoneNumberLink');

            if(locationPhoneNumberLink){
                var taskDescription = document.getElementById("description").value;

                var dueDateInput = document.getElementById("dueDate");

                var startDate = taskDescription.match(/StartDate: (.*)/g)[0].split(" ")[1];

                GM_setValue("autoText", JSON.stringify({
                    phone: locationPhoneNumberLink.value,
                    name: getContactInfo().name,
                    id: getContactInfo().id,
                    message: "Responsible Pest Control here, just following up with service provided on "+startDate+
                    ". We'd like to schedule your regular service but we're still seeing a balance on your account. Please give us a call @ 480-924-4111 so we can get this resolved. Thanks!",
                    division: document.getElementById("Division").value,
                    timeStamp: Date.now()
                }));

                document.getElementById("subject").value += " - Balance";

                document.getElementById("description").value = taskDescription+"\n"+getCurrentReadableDate()+" Sent Txt (Balance)";

                dueDateInput.value = getFutureDate(false, 7);

            }
        }

        function undecidedHandler(event){
            event.preventDefault();

            var locationPhoneNumberLink = document.getElementById('locationPhoneNumberLink');

            if(locationPhoneNumberLink){
                var taskDescription = document.getElementById("description").value;

                var dueDateInput = document.getElementById("dueDate");

                var startDate = taskDescription.match(/StartDate: (.*)/g)[0].split(" ")[1];

                GM_setValue("autoText", JSON.stringify({
                    phone: locationPhoneNumberLink.value,
                    name: getContactInfo().name,
                    id: getContactInfo().id,
                    message: "Hi, I was going thru my records saw that we treated your home on "+startDate+
                    ", but didn't settle on an ongoing service. To review, no contract but we do give warranty. We can do monthly @$49, every-other-month @$69, or quarterly @$95. Thank you! - Responsible Pest Control",
                    division: document.getElementById("Division").value,
                    timeStamp: Date.now()
                }));

                document.getElementById("subject").value = "Create New Setup - Undecided";

                document.getElementById("description").value = taskDescription+"\n"+getCurrentReadableDate()+" Sent Txt (Undecided)";

                dueDateInput.value = getFutureDate(false, 7);

            }
        }

        function updateSetupHandler(event){
            event.preventDefault();

            var serviceSetup = getSetupData();

            var modalData = {
                height: "300px",
                width: "500px",
                title: "Update Setup?",
                userLogin: false,
                createSetup: false,
                updateSetup: true,
                followUp: false,
                showHistory: true,
                setupData: serviceSetup
            };

            toggleScorpModal(modalData);

            document.getElementById("prox-icon").click();

        }

        function createSetupHandler(event){
            event.preventDefault();

            var serviceSetup = getSetupData();

            var modalData = {
                height: "300px",
                width: "500px",
                title: "Create Setup?",
                userLogin: false,
                createSetup: true,
                updateSetup: false,
                followUp: false,
                showHistory: true,
                setupData: serviceSetup
            };

            toggleScorpModal(modalData);

            document.getElementById("prox-icon").click();

        }


        function getSetupData(){
            var taskNameInput = document.getElementById("subject");
            var dueDate = document.getElementById("dueDate").value;
            var taskType = document.getElementById("taskType").value;
            var description = document.getElementById("description").value;
            var directions = document.getElementById("tblDirections").value;

            var serviceCode, price, schedule, tech, duration, startDate, nextDate;

            if(description.includes("Service:")){

                var _service = description.match(/Service:(.*)/g)[0].split(":")[1].trim();

                serviceCode = _service.replaceAll(/[^a-zA-Z]+/, "").toUpperCase().replace("M", "MONTHLY").replace("B", "BIMONTHLY").replace("Q", "QUARTERLY").replace("C", "MONTHLY");

                price = _service.replaceAll(/[^0-9]+/, '')+".00";

                schedule = description.match(/Schedule:(.*)/g)[0].split(":")[1].trim()+serviceCode[0];

                tech = getTechnician(description.match(/Technician:(.*)/g)[0].split(":")[1].trim());

            }

            if(description.includes("StartDate:")){
                startDate = description.match(/StartDate:(.*)/g)[0].split(":")[1].trim();
            } else {
                startDate = dueDate;
            }

            if(description.includes("NextDate:")){
                nextDate = description.match(/NextDate:(.*)/g)[0].split(":")[1].trim();
            }

            if(description.includes("Duration:")){
                duration = description.match(/Duration:(.*)/g)[0].split("Duration:")[1].trim();
            } else {
                var cost = parseInt(price.toUpperCase().replace("M","").replace("$",""));

                duration = convertMinutesToHours(Math.ceil(cost/9)*5);
            }

            var setupData = {};

            setupData.serviceCode = serviceCode;
            setupData.price = price;
            setupData.schedule = schedule;
            setupData.tech = tech;
            setupData.duration = duration;
            setupData.startDate = startDate;
            setupData.nextDate = nextDate;
            setupData.target = getSetupTarget(directions);

            return setupData;

            function getTechnician(name){
                if(name==="Brian"){
                    return "DEREK S";
                } else if(name==="Craig"){
                    return "CRAIG L";
                } else if(name==="Daniel"){
                    return "DANIEL A";
                } else if(name==="Derek"){
                    return "DEREK S";
                } else if(name==="Jeff"){
                    return "JEFF H";
                } else if(name==="Kody"){
                    return "CRAIG L";
                } else if(name==="Jesse"){
                    return "JESSE H";
                } else if(name==="Joseph"){
                    return "JOSEPH A";
                } else if(name==="Jon"){
                    return "Jon J";
                } else if(name==="Josh"){
                    return "Jon J";
                } else if(name==="Michael"){
                    return "MICHAEL R";
                } else if(name==="Troy" || name==="Troy w"){
                    return "LUIS A";
                } else if(name){
                    return name;
                } else {
                    return "";
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


        function welcomeHandler(event){
            event.preventDefault();

            var taskNameInput = document.getElementById("subject");

            var dueDateInput = document.getElementById("dueDate");

            var prioritySelect = document.getElementById("priority");

            var taskDescription = document.getElementById('description').value;

            var serviceSetup = getServiceSetup(1);

            var welcomeLetter = {};

            welcomeLetter.division = document.getElementById("Division").value;

            welcomeLetter.schedule = getServiceSchedule(serviceSetup.schedule);

            welcomeLetter.startDate = taskDescription.match(/StartDate: (.*)/g)[0].split(" ")[1];

            welcomeLetter.nextDate = taskDescription.match(/NextDate: (.*)/g)[0].split(" ")[1];

            if(taskDescription.includes("NextDate:")){
                welcomeLetter.nextDate = getReadableDate(taskDescription.match(/NextDate: (.*)/g)[0].split(" ")[1]);
            } else {
                welcomeLetter.nextDate = getReadableDate(serviceSetup.nextDate);
            }

            taskNameInput.value = "Follow up for Initial";

            dueDateInput.value = getFutureDate(welcomeLetter.startDate, 14);

            prioritySelect.value = "2";

            sessionStorage.setItem("welcomeLetter", JSON.stringify(welcomeLetter));

            document.getElementById("butSave").click();

            var newUrl = window.location.href.replace("location","letters").replace("detail","default");

            window.location.href = newUrl;
        }

        function generateHandler(){
            event.preventDefault();

            var serviceSetup = getServiceSetup(1);

            var taskDescription = document.getElementById('description').value;

            serviceSetup.nextDate = taskDescription.match(/NextDate: (.*)/g)[0].split(" ")[1];

            GM_setValue("generateService", JSON.stringify(serviceSetup));

            document.getElementById("RSOrderLink1").click();
        }

        function sendFollowUpHandler(event){
            event.preventDefault();

            var followUpText = getFollowUpText();

            var modalData = {
                height: "500px",
                width: "500px",
                title: "Send Follow Up?",
                userLogin: false,
                createSetup: false,
                updateSetup: false,
                followUp: true,
                showHistory: true,
                followUpText: followUpText
            };

            toggleScorpModal(modalData);

        }
    }

    function getFollowUpText(){
        var taskDescription = document.getElementById('description').value;

        var startDate, nextDate, currentDate = new Date();

        if(taskDescription.includes("StartDate:")){
            startDate = taskDescription.match(/StartDate: (.*)/g)[0].split(" ")[1];
        } else {
            startDate = getFutureDate(document.getElementById("dueDate").value, -14);
        }

        var serviceSetup = getServiceSetup(1);

        var nextService = getServiceOrder(1);

        if(nextService.date){
            nextDate = nextService.date;
        } else if(taskDescription.includes("NextDate:")){
            nextDate = taskDescription.match(/NextDate: (.*)/g)[0].split(" ")[1];
        }

        return "Responsible Pest Control here, just following up with service provided on "+startDate+
            ". Just wanted to make sure we have taken care of your pest problems. If not, please call us @ 480-924-4111. We have your next service scheduled for "+nextDate+". Thanks!";
    }



    function textFollowUpHandler(message){
        var taskSubject = document.getElementById('subject').value;

        var taskDescription = document.getElementById('description').value;

        if(taskSubject.toLowerCase().includes('follow up')){

            var startDate, nextDate, currentDate = new Date();

            if(taskDescription.includes("StartDate:")){
                startDate = taskDescription.match(/StartDate: (.*)/g)[0].split(" ")[1];
            } else {
                startDate = getFutureDate(document.getElementById("dueDate").value, -14);
            }

            var serviceSetup = getServiceSetup(1);

            var nextService = getServiceOrder(1);

            if(nextService.date){
                nextDate = nextService.date;
            } else if(taskDescription.includes("NextDate:")){
                nextDate = taskDescription.match(/NextDate: (.*)/g)[0].split(" ")[1];
            }

            var locationPhoneNumberLink = document.getElementById('locationPhoneNumberLink');

            if(!locationPhoneNumberLink) return;
            var textNumber = locationPhoneNumberLink.value;

            if(new Date(nextDate) > currentDate && getDifferenceInDays(currentDate, nextDate) > 2){

                GM_setValue("autoText", JSON.stringify({
                    phone: locationPhoneNumberLink.value,
                    name: getContactInfo().name,
                    id: getContactInfo().id,
                    message: message,
                    division: document.getElementById("Division").value,
                    timeStamp: Date.now()
                }));

                document.getElementById("status").value = "C";

            } else if(confirm("Next service is "+nextDate+". Are you sure you want to text follow up?")){

                GM_setValue("autoText", JSON.stringify({
                    phone: locationPhoneNumberLink.value,
                    name: getContactInfo().name,
                    id: getContactInfo().id,
                    message: message,
                    division: document.getElementById("Division").value,
                    timeStamp: Date.now()
                }));

                document.getElementById("status").value = "C";

            }
        }
    }


    function autoSetupinator(){
        if(urlContains(["serviceSetup/detail.asp"])){

            var serviceSetup = JSON.parse(sessionStorage.getItem("serviceSetup"));

            if(serviceSetup){

                var editButton = document.getElementById("butEdit");

                if(editButton){
                    editButton.click();
                }

                addSetupDetails(serviceSetup);

            }

            GM_addValueChangeListener("serviceSetup", function(name, old_value, new_value, remote){

                var serviceSetup = new_value;

                if(serviceSetup){

                    addSetupDetails(serviceSetup);

                }

            });

        }

        function addSetupDetails(serviceSetup){

            sessionStorage.removeItem("serviceSetup");

            var serviceCodeInput = document.getElementById("ServiceCode1");
            var unitPriceInput = document.getElementById("UnitPrice1");
            var scheduleInput = document.getElementById("Schedule");
            var workTimeInput = document.getElementById("WorkTime");
            var timeRangeInput = document.getElementById("TimeRange");
            var durationInput = document.getElementById("Duration");
            var lastGenInput = document.getElementById("LastGeneratedDate");
            var startDateInput = document.getElementById("StartDate");
            var targetInput = document.getElementById("TargetPest");
            var divisionInput = document.getElementById("Division");
            var techInput = document.getElementById("Tech1");

            if(serviceSetup.serviceCode){
                serviceCodeInput.focus();
                serviceCodeInput.value = serviceSetup.serviceCode;
                serviceCodeInput.blur();
            }

            if(serviceSetup.price){
                unitPriceInput.focus();
                unitPriceInput.value = serviceSetup.price;
                unitPriceInput.blur();
            }

            workTimeInput.focus();
            workTimeInput.value = getCurrentReadableTime();
            workTimeInput.blur();

            timeRangeInput.focus();
            timeRangeInput.value = "";
            timeRangeInput.blur();

            if(serviceSetup.duration){
                durationInput.focus();
                durationInput.value = serviceSetup.duration;
                durationInput.blur();
            }

            if(serviceSetup.lastGenerated){
                lastGenInput.focus();
                lastGenInput.value = serviceSetup.lastGenerated;
                lastGenInput.blur();
            }

            if(serviceSetup.startDate){
                startDateInput.focus();
                startDateInput.value = serviceSetup.startDate;
                startDateInput.blur();
            }

            if(serviceSetup.target){
                targetInput.focus();
                targetInput.value = serviceSetup.target;
                targetInput.blur();
            }

            if(serviceSetup.division){
                divisionInput.focus();
                divisionInput.value = serviceSetup.division
                divisionInput.blur();
            }

            if(serviceSetup.tech){
                techInput.focus();
                techInput.value = serviceSetup.tech;
                techInput.blur();
            }

            scheduleInput.focus();
            scheduleInput.value = parseSchedule(serviceSetup);
            scheduleInput.blur();

            GM_deleteValue("serviceSetup");

            sessionStorage.setItem("generateService", JSON.stringify(serviceSetup));

        }

        function parseSchedule(setup){
            var month;
            var schedule;

            if(setup.nextDate.includes("/")){
                month = parseInt(setup.nextDate.split("/")[0]);
            } else {
                month = parseInt(setup.startDate.split("/")[0]);
            }

            if(setup.serviceCode === "BIMONTHLY"){
                if(month % 2){
                    schedule = setup.schedule+"J";
                } else {
                    schedule = setup.schedule+"F";
                }
            } else if(serviceSetup.serviceCode === "QUARTERLY"){
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
        if(!urlContains(["letters/default.asp", "letters/add.asp", "letters/detail.asp"])) return;

        var welcomeLetter = sessionStorage.getItem("welcomeLetter");

        if(welcomeLetter){

            welcomeLetter = JSON.parse(welcomeLetter);

            if(urlContains(["letters/default.asp"])){

                document.getElementById("butAddLetter").click();

            } else if(urlContains(["letters/add.asp"])){

                document.getElementById("SLT").click();

                var letterCodeInput = document.getElementById("StdLetterSourceCode");

                letterCodeInput.focus();

                letterCodeInput.value = "WELCOME "+welcomeLetter.division;

                letterCodeInput.blur();

                document.getElementById("butContinue").click();
            } else if(urlContains(["letters/detail.asp"])){
                setTimeout(function(){

                    sessionStorage.removeItem("welcomeLetter");

                    var iframe = document.getElementById('Letter_ifr').contentWindow.document;

                    var letter = iframe.getElementById("tinymce");

                    var nameInput = document.getElementById('Name');

                    letter.innerHTML = letter.innerHTML
                        .replace("first week of each month", welcomeLetter.schedule)
                        .replace("DATE", welcomeLetter.nextDate);

                    nameInput.value = "Welcome";

                }, 1500);
            }
        }
    }

    function autoEmailinator(){
        if(!urlContains(["detailEmail.asp"])) return;

        var emailData = GM_getValue("emailData");

        if(emailData){
            emailData = JSON.parse(emailData);

            if(urlContains(["detailEmail.asp"])){

                setTimeout(function(){
                    GM_deleteValue("emailData");
                    document.getElementById("chkMailToLocation").click();
                    document.getElementById("MailSubject").value = emailData.subject;
                    document.getElementById("Message").value = emailData.message;
                    document.getElementById("NoteCode").value = emailData.noteCode;
                }, 1500);
            }
        }
    }

    function autoGenerator(){
        if(!urlContains(["location/detail.asp", "serviceOrder/detail.asp"])) return;

        var serviceSetup = GM_getValue("generateService");

        if(serviceSetup){

            serviceSetup = JSON.parse(serviceSetup);

            if(urlContains(["location/detail.asp"])){

                var daysToNextService = getDifferenceInDays(null, serviceSetup.nextDate);

                if(daysToNextService < 45){

                    if(confirm("Generate Next Service: "+serviceSetup.nextDate+"?")){
                        document.getElementById("RSOrderLink1").click();
                    } else {
                        GM_deleteValue("generateService");
                    }

                }

            } else if(urlContains(["serviceOrder/detail.asp"])){
                setTimeout(function(){

                    var workDateInput = document.getElementById("WorkDate");
                    var earliestInput = document.getElementById("SEligibleDate");
                    var latestInput = document.getElementById("EEligibleDate");

                    var directionsInput = document.getElementsByName("Directions")[0];

                    workDateInput.focus();
                    workDateInput.value = serviceSetup.nextDate;
                    workDateInput.blur();

                    earliestInput.focus();
                    earliestInput.value = serviceSetup.nextDate;
                    earliestInput.blur();

                    latestInput.focus();
                    latestInput.value = serviceSetup.nextDate;
                    latestInput.blur();

                    var directionsValue = directionsInput.value;

                    directionsInput.value = directionsValue.replace("**", "*"+serviceSetup.nextDate+"*");

                    GM_deleteValue("generateService");

                }, 1500);
            }
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
        } else if(urlContains(["leads/detail.asp"])){
            leadDetailFixes();
        } else if(urlContains(["leads/"])){
            if(!urlContains(["detailEmail"])){
                leadsListFixes();
            }
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
            var emailInput = document.getElementById("EMail");
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

                    if(contactLinks[i].parentNode.parentNode.parentNode.parentNode.id === "billto-address-block"){
                        var rpcIcon = document.createElement("img");
                        rpcIcon.src = "https://responsiblepestcontrol.net/wp-content/themes/responsiblepest/images/favicon.ico";
                        rpcIcon.style.height = "20px";
                        rpcIcon.style.width = "20px";
                        rpcIcon.setAttribute("data-email", contactLinks[i].children[1].innerHTML);

                        contactLinks[i].appendChild(document.createTextNode("  "));
                        contactLinks[i].appendChild(rpcIcon);
                        contactLinks.id = "contactEmail";

                    }
                }
            }

        }

        function locationAddFixes(){
            var directionsInput = document.getElementById("Directions");
            if(directionsInput.value===""){
                directionsInput.value = "** ";
            }
            var directionsInput = document.getElementById("Directions");

            var directionsBlock = directionsInput.parentElement.previousSibling.previousSibling;

            directionsBlock.appendChild(createTargetIcons());
        }

        function locationEditFixes(){
            var editButton = document.getElementById("butEdit");
            var saveButton = document.getElementById("butSave");
            var addressInput = document.getElementById("Address");
            var mobileInput = document.getElementById("Mobile");
            var directionsInput = document.getElementById("Directions");

            var directionsBlock = directionsInput.parentElement.previousSibling.previousSibling;

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

            directionsBlock.appendChild(createTargetIcons());

        }

        function leadDetailFixes(){

            var buttonsDiv = document.getElementsByClassName("buttons")[0];

            var emailButton = createButton({ text: "Send Email", onclick: sendEmail });

            var textButton = createButton({ text: "Send Text", onclick: sendText });

            emailButton.style.marginRight = "0.5em";

            textButton.style.marginRight = "0.5em";

            buttonsDiv.insertBefore(emailButton, buttonsDiv.children[0]);

            buttonsDiv.insertBefore(textButton, buttonsDiv.children[0]);

            function sendEmail(event){
                event.preventDefault();

                GM_setValue("emailData", JSON.stringify({
                    subject: "Responsible Pest Control",
                    message: "Hi, this is Ryan with Responsible Pest Control. I noticed that you started filling out an online form but didn't get all the way through."+
                        " Just wanted to check if you had any questions or would like help getting service set up. Feel free to reply or call/text @ 480-924-4111 to schedule an appointment.",
                    noteCode: "QUOTE"
                }));

                document.getElementById("butEmail").click();
            }

            function sendText(event){
                event.preventDefault();

                var contactName = document.getElementById("Contact").value.replace("  ", " ");

                var contactPhone = document.getElementById("Phone").value;

                GM_setValue("autoText", JSON.stringify({
                    phone: contactPhone,
                    name: contactName,
                    id: "LEAD",
                    message: "Hi, this is Ryan with Responsible Pest Control. I noticed that you started filling out an online form but didn't get all the way through."+
                        " Just wanted to check if you had any questions or would like help getting service set up. Feel free to text back or give us a call @ 480-924-4111",
                    timeStamp: Date.now()
                }));

            }

        }

        function leadsListFixes(){

            var nameInput = document.getElementById("LeadName");
            var phoneInput = document.getElementById("LeadPhone");

            var butRefresh = document.getElementById("butRefresh");

            var leadInfo = GM_getValue("findLead");

            if(leadInfo){
                leadInfo = JSON.parse(leadInfo);

                nameInput.value = leadInfo.name.split(", ")[0];

                GM_deleteValue("findLead");

                butRefresh.click();

            } else {

                GM_addValueChangeListener('findLead', function(name, old_value, new_value, remote){
                    leadInfo = JSON.parse(new_value);

                    nameInput.value = leadInfo.name.split(", ")[0];

                    GM_deleteValue("findLead");

                    butRefresh.click();
                });

            }

            butRefresh.parentElement.parentElement.children[1].appendChild(createButton({text: "Clear", onclick: clearFields}));

            function clearFields(e){
                e.preventDefault();
                nameInput.value = "";
                phoneInput.value = "";
                butRefresh.click();
            }

        }

        function createTargetIcons(){
            var scorpionData = {
                id: "scorpionIcon",
                src: "https://static.thenounproject.com/png/1928919-200.png",
                size: "18pt",
                onclick: function(){
                    toggleTarget("Scorpions");
                }
            };

            var spiderData = {
                id: "spiderIcon",
                src: "https://static.thenounproject.com/png/2050533-200.png",
                size: "18pt",
                onclick: function(){
                    toggleTarget("Spiders");
                }
            };

            var cricketData = {
                id: "cricketIcon",
                src: "https://static.thenounproject.com/png/1975340-200.png",
                size: "18pt",
                onclick: function(){
                    toggleTarget("Crickets");
                }
            };

            var roachData = {
                id: "roachIcon",
                src: "https://static.thenounproject.com/png/1026139-200.png",
                size: "18pt",
                onclick: function(){
                    toggleTarget("Roaches");
                }
            };

            var antData = {
                id: "antIcon",
                src: "https://static.thenounproject.com/png/93320-200.png",
                size: "18pt",
                onclick: function(){
                    toggleTarget("Ants");
                }
            };

            var tickData = {
                id: "tickIcon",
                src: "https://static.thenounproject.com/png/1975345-200.png",
                size: "18pt",
                onclick: function(event){
                    toggleTarget("Ticks");
                }
            };

            var topDiv = document.createElement("div");
            topDiv.appendChild(createIcon(scorpionData));
            topDiv.appendChild(createIcon(spiderData));
            topDiv.appendChild(createIcon(cricketData));

            var BottomDiv = document.createElement("div");
            BottomDiv.appendChild(createIcon(roachData));
            BottomDiv.appendChild(createIcon(antData));
            BottomDiv.appendChild(createIcon(tickData));

            var containerDiv = document.createElement("div");
            containerDiv.style.marginTop = "5pt";
            containerDiv.style.bottomTop = "5pt";
            containerDiv.appendChild(topDiv);
            containerDiv.appendChild(BottomDiv);

            return containerDiv;

            function toggleTarget(pest){
                var directionsInput = document.getElementById("Directions");

                var directions = directionsInput.value.trim();

                if(directions.includes(pest)){
                    directions = directions.replace(pest, "").replace("  ", " ");
                } else {
                    directions = directions.replace("**", "** "+pest).replace("  ", " ").trim();
                }

                directionsInput.value = directions;
            }
        }

    }

    function appointmentFixes(){
        var popup = document.getElementById("Popup");

        if(!popup) return;

        var observer = new MutationObserver(function(mutations){

            mutations.forEach(function(mutation){

                if (!mutation.addedNodes) return

                for (var i = 0; i < mutation.addedNodes.length; i++) {

                    var node = mutation.addedNodes[i];

                    var nodeString = node.innerHTML.toString().replace(/<\/?[^>]+(>|$)/g, "").replaceAll("&nbsp;"," ");

                    if(nodeString.includes("Phone: ")){
                        var phoneNum = nodeString.match(/Phone: (.*)/)[1].substring(0,12);
                        GM_setValue("phoneNum", phoneNum);
                    } else {
                        GM_deleteValue("phoneNum");
                    }

                    if(nodeString.includes("Alt: ")){
                        var altNum = nodeString.match(/Alt: (.*)/)[1].substring(0,12);
                        GM_setValue("altNum", altNum);
                    } else {
                        GM_deleteValue("altNum");
                    }

                    if(nodeString.includes("Mobile: ")){
                        var mobileNum = nodeString.match(/Mobile: (.*)/)[1].substring(0,12);
                        GM_setValue("mobileNum", mobileNum);
                    } else {
                        GM_deleteValue("mobileNum");
                    }

                }

            });
        });

        observer.observe(popup, {
            childList: true,
            subtree: true
        });

    }

    function appointmentDialogFixes(){

        var saveButton = document.getElementById("butSave");

        var focusTable = saveButton.parentElement.parentElement.parentElement.parentElement;

        var newRow = focusTable.insertRow();
        newRow.classList.add("NoConflict");

        var newCell = newRow.insertCell();
        newCell.setAttribute("colspan", "3");
        newCell.setAttribute("align", "center");
        newCell.setAttribute("valign", "middle");

        var phoneNum = GM_getValue("phoneNum");
        var altNum = GM_getValue("altNum");
        var mobileNum = GM_getValue("mobileNum");

        if(phoneNum){
            var textPhoneBut = createButton({ text: "Text Phone", onclick: sendReminderText });
            textPhoneBut.setAttribute("data-phone", phoneNum);
            textPhoneBut.style.margin = "0 0.25em";
            newCell.appendChild(textPhoneBut);
        }

        if(altNum){
            var textAltBut = createButton({ text: "Text Alt", onclick: sendReminderText });
            textAltBut.setAttribute("data-phone", altNum);
            textAltBut.style.margin = "0 0.25em";
            newCell.appendChild(textAltBut);
        }

        if(mobileNum && mobileNum !== phoneNum){
            var textMobileBut = createButton({ text: "Text Mobile", onclick: sendReminderText });
            textMobileBut.setAttribute("data-phone", mobileNum);
            textMobileBut.style.margin = "0 0.25em";
            newCell.appendChild(textMobileBut);
        }

        function sendReminderText(e){
            e.preventDefault();

            var workDate = document.getElementById("WorkDate").value;
            var timeRange = document.getElementById("TimeRange").value;

            var locationInput = document.getElementById("Directions");
            var locationInstructions = locationInput.value;

            var serviceDate = getReadableDate(workDate);
            var serviceDay = getWeekday(workDate);

            var message = "";

            if(timeRange){
                message = "Hi, this is Responsible Pest Control. We have your home scheduled for service on "+
                    serviceDay+", "+serviceDate+" with an arrival between "+timeRange+
                    ". If you have any questions or need to reschedule please let me know. If not, we'll see you "+serviceDay+". Thanks!";
            } else {
                message = "Hi, this is Responsible Pest Control. We have your home scheduled for service on "+
                    serviceDay+", "+serviceDate+
                    ". If you have any questions or need to reschedule please let me know. If not, we'll see you "+serviceDay+". Thanks!";
            }

            var phoneNumber = e.target.getAttribute("data-phone");

            GM_setValue("autoText", JSON.stringify({
                phone: phoneNumber,
                message: message,
                timeStamp: Date.now()
            }));
        }

    };

    function pestpac_sockets(){

        if(urlContains(["location/detail.asp"])){
            addContactIcons(document.getElementById("location-address-block"));
            addContactIcons(document.getElementById("billto-address-block"));

            var billToEmail = document.getElementById("lo");


        }

        email_socket();

        function email_socket(){

            if(urlContains(["blank", "iframe"])) return;

            if(!checkLastFocus()) return;

            var contact = GM_getValue("contactInfo");

            if(contact){

                if(urlContains(["location/add.asp"])){

                    inputContactInfo(JSON.parse(contact));

                } else {

                    if(!checkLastFocus()) return;

                    window.focus();

                    window.location = "https://app.pestpac.com/location/add.asp";

                }

            } else {

                GM_addValueChangeListener('contactInfo', function(name, old_value, new_value, remote){

                    if(urlContains(["location/add.asp"])){

                        if(!checkLastFocus()) return;

                        window.focus();

                        inputContactInfo(JSON.parse(new_value));

                    } else {

                        if(!checkLastFocus()) return;

                        window.focus();

                        window.location = "https://app.pestpac.com/location/add.asp";

                    }

                });

            }

            function inputContactInfo(contact){

                GM_deleteValue("contactInfo");

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

                if(contact.zipcode){
                    zipInput.value = contact.zipcode;
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

        }

    }

    function heymarket_sockets(){
        addPestPacIcon();

        GM_addValueChangeListener("autoText", function(name, old_value, new_value, remote){

            if(!new_value) return;

            var textData = JSON.parse(new_value);

            window.focus();

            if(textData.phone !== ""){
                goToContact(textData.phone, function(){
                    GM_setValue("updateContact", JSON.stringify({id:textData.id, name:textData.name, phone:textData.phone, division:textData.division}));

                    GM_setValue("currentAssignee", textData.division);

                    if(textData.message){
                        prepareMessage(textData.message);
                    } else {
                        updateContact(textData.id, textData.name, textData.phone, textData.division);
                    }
                });
            } else if(textData.id){
                goToContact(textData.id, function(){
                    prepareMessage(textData.message);
                });
            }

        });

        function addPestPacIcon(){

            var observer = new MutationObserver(function(mutations){
                mutations.forEach(function(mutation){

                    if (!mutation.addedNodes) return

                    for (var i = 0; i < mutation.addedNodes.length; i++) {

                        var node = mutation.addedNodes[i];

                        if(!node.classList) return;

                        if(node.id === "profile-content"){

                            var headerBar = document.getElementsByClassName("chat-room-container")[0].children[0];

                            if(!headerBar) return;

                            headerBar.appendChild(createPestPacLink());

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
                link.style.height = "32px";
                link.style.width = "32px";
                link.appendChild(createPestPacImage());

                link.addEventListener("click", function(){
                    var contactInfo = getHeyMarketContactInfo();
                    GM_setValue("findAccount", JSON.stringify(contactInfo));
                    spinButton(document.getElementById("pestPacImage"), 32);
                });

                var iconHeaderDiv = document.createElement("div");
                iconHeaderDiv.classList.add("icon-header");
                iconHeaderDiv.appendChild(link);

                return iconHeaderDiv;

                function createPestPacImage(){
                    var image = document.createElement("img");
                    image.id = "pestPacImage";
                    image.src = "https://rjhuffaker.github.io/pestpac_logo.png";
                    image.style.height = "32px";
                    image.style.width = "32px";

                    return image;
                }
            }

            function getHeyMarketContactInfo(){
                var profileContent = document.getElementById("profile-content");
                if(!profileContent){
                    alert("profileContent not found!");
                    return;
                }

                var nameInput = document.querySelectorAll('[name="contact-name"]')[0];
                var phoneInput = document.querySelectorAll('[name="contact-phone"]')[0];

                var name = nameInput.value.replace("  ", " ");
                var phone = phoneInput.value.replace(/[()\-]/g, "").replace(" ","");

                var contactInfo = { name: name, phone: phone, timeStamp: new Date() };

                return contactInfo;
            }
        }

        function goToContact(textNumber, callback){

            addAssigneeListener();

            var composeIcon = document.getElementsByClassName('ico-compose')[0];

            if(composeIcon){

                composeIcon.click();

            }

            setTimeout(function(){

                var searchInput = document.getElementById('contact-search-input');

                if(searchInput){

                    var keyUpEvent = document.createEvent("Event");
                    keyUpEvent.initEvent('keyup');
                    searchInput.focus();
                    searchInput.value = textNumber;
                    searchInput.dispatchEvent(keyUpEvent);
                    searchInput.blur();

                    setTimeout(function(){

                        var moveToInbox = document.getElementsByClassName('icon-move-to-inbox')[0];

                        if(moveToInbox){
                            moveToInbox.click();
                        }

                        var firstContact = document.getElementsByClassName('contact-link')[0];

                        if(firstContact){

                            firstContact.click();

                            setTimeout(function(){

                                if(callback) callback();

                            }, 0);

                        } else {

                            console.log("no firstContact");

                        }

                    }, 500);

                }

            }, 500);

        }

        function prepareMessage(messageBody){
            setTimeout(function(){
                var messageTextarea = document.getElementById('message-textarea');

                if(messageTextarea){
                    messageTextarea.value = messageBody;
                    messageTextarea.dispatchEvent(new InputEvent('input'));
                }

                GM_setValue("autoText","");

                var sendButton = document.getElementById("btn-send");

                if(!sendButton) return;

                sendButton.onclick = function(){

                    var contactData = GM_getValue("updateContact");

                    if(contactData){
                        contactData = JSON.parse(contactData);

                        updateContact(contactData.id, contactData.name, contactData.phone, contactData.division);
                    }

                    GM_setValue("updateContact", "");

                    addAssigneeListener();

                };

            }, 500);

        }

        function updateContact(account, name, phone, division){
            var moveToInbox = document.getElementsByClassName('icon-move-to-inbox')[0];

            var nameInput = document.querySelectorAll('[name="contact-name"]')[0];
            var phoneInput = document.querySelectorAll('[name="contact-phone"]')[0];

            if(moveToInbox){
                moveToInbox.click();
            }

            if(name){
                if(!nameInput || !phoneInput) return;
                var contactPhone = phone.replace(/[()\-]/g, "").replace(" ","");
                var currentPhone = phoneInput.value.replace(/[()\-]/g, "").replace(" ","");
                if(currentPhone !== contactPhone) return;
            }

            setTimeout(function(){

                var nameInput = document.querySelectorAll('[name="contact-name"]')[0];
                var phoneInput = document.querySelectorAll('[name="contact-phone"]')[0];

                if(!nameInput.value.includes(account)){
                    if(name){
                        var nameList = name.split(" ");

                        if(nameList.length === 2){
                            name = name.split(" ")[1]+", "+name.split(" ")[0].replace("&", " & ").replace("amp;", "");
                        }

                        nameInput.focus();
                        nameInput.value = account+" "+name;
                        nameInput.blur();
                    }

                    var keyUpEvent = document.createEvent("Event");
                    keyUpEvent.initEvent('keyup');
                    nameInput.dispatchEvent(keyUpEvent);

                }

                addAssigneeListener();

            }, 1000);

        }

        function addAssigneeListener(){

            var assigneeDiv = document.getElementsByClassName("assignee")[0];

            if(!assigneeDiv){
                console.log("NO ASSIGNEE DIV");
                return;
            }

            assigneeDiv.onclick = function(event){

                var division = GM_getValue("currentAssignee");

                setTimeout(function(){

                    division = division.split(" ")[0];

                    var optionList = document.getElementsByClassName("each-option");

                    for(var i = 0; i < optionList.length; i++){
                        var optionButton = optionList[i];

                        var buttonText = optionButton.innerHTML;

                        if(buttonText.toUpperCase().split(" ")[0] === division.toUpperCase().split(" ")[0]){

                            optionButton.style.color = "green";

                            optionButton.style.fontWeight = "bolder";

                        }

                    }


                }, 100);

            }

        }

    }




    function helpscout_sockets(){

        var observer = new MutationObserver(function(mutations){
            mutations.forEach(function(mutation){

                if (!mutation.addedNodes) return

                for (var i = 0; i < mutation.addedNodes.length; i++) {

                    var node = mutation.addedNodes[i]
                    if(!node.classList) return;

                    if(node.id === "tkContent"){

                        var tkContent = document.getElementById("tkContent");

                        if(!tkContent) return;

                        addContactIcons(tkContent);

                        tkContent.appendChild(createPestPacLink());

                    }
                }

            });
        });

        observer.observe(document.getElementById("js-wrap"), {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });

        var tkContent = document.getElementById("tkContent");

        if(tkContent){

            addContactIcons(tkContent);

            tkContent.appendChild(createPestPacLink());

        }

        function createPestPacLink(){
            var pestPacIcon = document.createElement("img");
            pestPacIcon.id = "pestPacIcon";
            pestPacIcon.src = "https://rjhuffaker.github.io/pestpac_logo.png";
            pestPacIcon.style.margin = "-4px";
            pestPacIcon.style.width = "20px";
            pestPacIcon.style.height = "20px";

            var pestPacLink = document.createElement("a");
            pestPacLink.style.margin = "12px";
            pestPacLink.style.cursor = "pointer";
            pestPacLink.appendChild(pestPacIcon);
            pestPacLink.appendChild(document.createTextNode(" Send to PestPac"));

            pestPacLink.onclick = sendContactInfo;

            return pestPacLink;

            function sendContactInfo(){
                spinButton(document.getElementById("pestPacIcon"), 20);
                GM_setValue("contactInfo", JSON.stringify(getContactInfo()));

                function getContactInfo(){
                    var contact = {};

                    Array.from(document.getElementsByTagName("tr")).forEach(
                        function(element, index, array){

                            if(element.hasAttribute("style")){

                                if(element.style.backgroundColor === "rgb(234, 242, 250)"){

                                    var headerText, contentRow;

                                    if(element.children[0].children[0]){
                                        headerText = element.children[0].children[0].innerHTML;
                                    }

                                    var elementSibling = element.nextElementSibling;

                                    if(elementSibling){
                                        if(elementSibling.children[1]){
                                            contentRow = elementSibling.children[1].innerHTML;
                                        }
                                    }

                                    if(headerText === "Name"){
                                        contact.name = contentRow.replace(/<(?:.|\n)*?>/gm, '');

                                        if(contact.name.split(" ")){
                                            contact.fname = contact.name.split(" ")[0];
                                            contact.lname = contact.name.split(" ")[1];
                                        }

                                    } else if(headerText === "Email"){
                                        contact.email = contentRow.replace(/<(?:.|\n)*?>/gm, '');
                                    } else if(headerText === "Phone"){
                                        contact.phone = contentRow.replace(/<(?:.|\n)*?>/gm, '').replace("(", "").replace(") ", "-").replace(/\s+/g, "");
                                    } else if(headerText === "Address"){
                                        if(contentRow.split("<br>").length){
                                            contact.address = contentRow.split("<br>")[0];
                                            var zipcodeRegEx = /85[0-9]{3}/;
                                            var zipcodeRegExMatcher = new RegExp(zipcodeRegEx);

                                            if(zipcodeRegExMatcher.exec(contentRow)){
                                                contact.zipcode = zipcodeRegExMatcher.exec(contentRow)[0];
                                            }
                                        }

                                    } else if(headerText === "Pest concerns &amp; square footage."){
                                        contact.details = contentRow.replace(/<(?:.|\n)*?>/gm, '');
                                    }

                                }

                            }

                        });

                    contact.date = Date.now();

                    return contact;

                }

            }

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

                    PHONENUMBERS.push(phoneNumber);

                    child.splitText(phoneNumbers.index + phoneNumbers[0].length);

                    node.insertBefore(document.createTextNode("  "), node.childNodes[++i]);
                    node.insertBefore(createTextLink(phoneNumber), node.childNodes[++i]);

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
                GM_setValue("autoText", JSON.stringify({
                    phone: phoneNumber,
                    name: getContactInfo().name,
                    id: getContactInfo().id,
                    message: "",
                    division: document.getElementById("Division").value,
                    timeStamp: Date.now()
                }));

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

                var accountInfo = JSON.parse(new_value);

                var accountIdRegEx = /(?<!\d)\d{5,6}(?!\d)/;
                var accountIdRegExMatcher = new RegExp(accountIdRegEx);
                var accountIdMatch = null;
                accountIdMatch = accountIdRegExMatcher.exec(accountInfo.name);

                if(accountIdMatch){
                    console.log("goToAccount: Account="+accountIdMatch[0]);
                    goToAccount(accountIdMatch[0]);
                } else if(accountInfo.name.includes("LEAD")){
                    var leadName = accountInfo.name.replace("LEAD", "").trim();

                    GM_setValue("findLead", JSON.stringify({
                        name: leadName,
                        phone: accountInfo.phone,
                        timeStamp: Date.now()
                    }));

                    window.location.href = "https://app.pestpac.com/leads/";
                } else {
                    var phoneNumberMatch = phoneNumberRegExMatcher.exec(accountInfo.phone);

                    if(phoneNumberMatch){
                        console.log("goToAccount: Phone="+phoneNumberMatch[0]);
                        goToAccount(phoneNumberMatch[0]);
                    }
                }

            });
        }
    }

    function paymentNotificator(){

        if(urlContains(["app.pestpac.com/reports/payment/report.asp"])){
            var rowList = document.getElementsByTagName('tr');

            for(var i= 0; i < rowList.length; ++i){
                var _row = rowList[i];
                if(_row.children.length === 9 && _row.children[0].innerHTML !== "Date"){

                    var _payment = {};
                    _payment.date = _row.children[0].children[0].innerHTML.replace(/&nbsp;/g,"");
                    _payment.id = _row.children[1].children[0].children[0].innerHTML;
                    _payment.amount = _row.children[3].children[0].innerHTML.replace(/&nbsp;/g,"");

                    var _dateLink = document.createElement("a");
                    _dateLink.innerHTML = _payment.date;
                    _dateLink.href = "#"+_payment.id;
                    _dateLink.dataPayment = _payment;
                    _dateLink.onclick = function(event){
                        var _payment = event.target.dataPayment;
                        sessionStorage.setItem("paymentNote", JSON.stringify(_payment))
                        window.open("/search/default.asp");
                    }

                    var _td = _row.children[0];
                    _td.children[0].innerHTML = "";
                    _td.children[0].appendChild(_dateLink);

                }
            }

        } else if(urlContains(["app.pestpac.com/search/default.asp"])){
            var _payment = sessionStorage.getItem("paymentNote");
            if(_payment){
                sessionStorage.removeItem("paymentNote");
                _payment = JSON.parse(_payment);
                goToNotes(_payment.id);
            }
        } else if(urlContains(["app.pestpac.com/notes/default.asp"])){
            var _payment = sessionStorage.getItem("paymentNote");
            if(_payment){
                sessionStorage.removeItem("paymentNote");
                _payment = JSON.parse(_payment);
                var butAdd = document.getElementById("butAdd");
                var noteCode = document.getElementById("NoteCode");
                var noteText = document.getElementById("Note");


                butAdd.click();
                noteCode.value = "BILLING";
                noteText.value = _payment.date+" Released web payment of $"+_payment.amount;


            }
        }

    }

    function serviceOrderDuplicator(){

        if(urlContains(["location/detail.asp"])){
            var duplicateOrder = JSON.parse(sessionStorage.getItem("duplicateOrder"));
            if(duplicateOrder){

                if(duplicateOrder.delete){

                    sessionStorage.removeItem("duplicateOrder");

                } else {

                    duplicateOrder.delete = true;

                    sessionStorage.setItem("duplicateOrder", JSON.stringify(duplicateOrder));

                    var aButton = document.getElementsByClassName("ui-button")[0];

                    if(aButton){
                        setTimeout(function(){aButton.click();}, 0);
                    }

                    document.getElementById("butOrder").click();

                }
            }
        } else if(urlContains(["serviceOrder/detail.asp"])){

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

            if(urlContains(["Mode=New"])){

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

            } else {

                var duplicatorButton = createButton({ text: "Duplicate", onclick: duplicateService });

                duplicatorButton.style.marginRight = "0.5em";

                choicesSpan.insertBefore(duplicatorButton, choicesSpan.children[0]);

                function duplicateService(event){
                    event.preventDefault();

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

                    sessionStorage.setItem("duplicateOrder", JSON.stringify(duplicateOrder));

                    document.getElementById("butExit").click();
                }

            }

        }
    }

    function accountListExtractinator(){
        var loginData = getLoginData();

        if(GM_getValue("retrieveAccountData") === "activeSetups" && loginData){

            GM_setValue("retrieveAccountData", null);

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

            httpPost("https://azpestcontrol.services/api/activeSetups.php?token="+loginData.token, accountString, function(res){
                alert("Scorpinator SetupList update complete: "+res);
                window.close();
            });

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
                            if(index === 11){
                                data += getAccountAge(element.children[0].innerHTML.replace("&nbsp;", "").replace("&nbsp;", ""));
                            } else {
                                data += element.children[0].innerHTML.replace("&nbsp;", "").replace("&nbsp;", "");
                            }
                        }
                    }

                    if(index+1 !== array.length){
                        data += "\t";
                    }
                }
            );

            var accountString = formatSchedule(data);

            if(accountString.includes("Report Totals")
                || accountString.includes("WEEKLY")
                    || accountString.includes("BIWEEKLY")
                        || accountString.includes("28 DAYS")
                            || accountString.includes("3 WEEKS")
                                || accountString.includes("6 WEEKS")
                                    || accountString.includes("TMSJ"))
            {
                return false;
            } else if(accountString.split("\t").length !== 15){
                return false;
            } else if(["","CRISSANNA","DN","GABBY","MYLISSA","SKYE","HALEY",""].indexOf(accountString.split("\t")[12]) > -1){
                return false;
            } else {
                return accountString;
            }

            function formatSchedule(account){
                var _account = account;
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
                    _account = _account.replace(scheduleList[i].input, scheduleList[i].output);
                }

                return _account;
            }

            function getAccountAge(monthDayYear){
                var oneDay = 24*60*60*1000;
                var _currentDate = new Date();
                var _accountDate = new Date(monthDayYear.split("/")[0]+"/"+monthDayYear.split("/")[1]+"/20"+monthDayYear.split("/")[2]);
                var _accountAge = Math.floor(Math.abs((_currentDate.getTime() - _accountDate.getTime())/(oneDay)));

                if(_accountAge < 30){
                    return "< 1 Month";
                } else if(_accountAge < 91){
                    return "< 3 Months";
                } else if(_accountAge < 182){
                    return "< 6 Months";
                } else if(_accountAge < 273){
                    return "< 9 Months";
                } else if(_accountAge < 365){
                    return "< 1 Year";
                } else if(_accountAge < 730){
                    return "< 2 Years";
                } else if(_accountAge < 1095){
                    return "< 3 Years";
                } else if(_accountAge < 1460){
                    return "< 4 Years";
                } else if(_accountAge < 1825){
                    return "< 5 Years";
                } else {
                    return "> 5 Years";
                }


                if(_accountAge < 30){
                     return "< 1 Month";
                } else if(_accountAge < 330){
                    if(_accountAge < 45){
                        return "1 Month";
                    } else {
                        return Math.round(_accountAge/30)+" Months";
                    }
                } else if(_accountAge < 3653){
                    if(_accountAge < 548){
                        return "1 Year";
                    } else {
                        return Math.round(_accountAge/365)+" Years";
                    }
                } else {
                    return "> 10 years";
                }
            }

        }

    }

})();