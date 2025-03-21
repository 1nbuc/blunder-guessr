// ==UserScript==
// @name         Blunder-Guessr - GeoGuessr Weak Rounds Collector
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Collects and saves GeoGuessr rounds with low scores
// @author       1nbuc
// @match        *://*.geoguessr.com/*
// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_info
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @require      https://miraclewhips.dev/geoguessr-event-framework/geoguessr-event-framework.min.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geoguessr.com
// ==/UserScript==
