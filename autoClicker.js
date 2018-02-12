// ==UserScript==
// @name         AutoClicker
// @namespace    http://RjHuffaker.github.io
// @version      0.1
// @description  Automatically clicks on save buttons as soon as they are visible. Use only while automatically iterating through locations
// @author       You
// @match        https://app.pestpac.com/location/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    /*jshint esnext: true */
    
    var aButton = document.getElementsByClassName("ui-button")[0];
    if(aButton){
        setTimeout(function(){aButton.click();}, 0);
    }

    var butSave = document.getElementById("butSave");
    if(butSave){
        setTimeout(function(){butSave.click();}, 500);
    }
})();