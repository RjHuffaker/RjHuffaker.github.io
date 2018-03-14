// ==UserScript==
// @name         helperFunctions
// @namespace    http://RjHuffaker.github.io
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        http://*/*
// @grant        none
// ==/UserScript==

(function() {
    /*jshint esnext: true */
    
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

    function getServiceDate(input){
        var month = input.substring(0,3)
        .replace("01/", "January ").replace("02/", "February ").replace("03/", "March ")
        .replace("04/", "April ").replace("05/", "May ").replace("06/", "June ")
        .replace("07/", "July ").replace("08/", "August ").replace("09/", "September ")
        .replace("10/", "October ").replace("11/", "November ").replace("12/", "December ");

        var day = input.substring(3,6)
        .replace("01/", "1st").replace("02/", "2nd").replace("03/", "3rd").replace("04/", "4th").replace("05/", "5th")
        .replace("06/", "6th").replace("07/", "7th").replace("08/", "8th").replace("09/", "9th").replace("10/", "10th")
        .replace("11/", "11th").replace("12/", "12th").replace("13/", "13th").replace("14/", "14th").replace("15/", "15th")
        .replace("16/", "16th").replace("17/", "17th").replace("18/", "18th").replace("19/", "19th").replace("20/", "20th")
        .replace("21/", "21st").replace("22/", "22nd").replace("23/", "23rd").replace("24/", "24th").replace("25/", "25th")
        .replace("26/", "26th").replace("27/", "27th").replace("28/", "28th").replace("29/", "29th").replace("30/", "30th")
        .replace("31/", "31st");

        return month+day;
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
})();