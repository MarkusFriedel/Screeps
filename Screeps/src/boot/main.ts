/// <reference path="../game-manager.ts" />

declare function require(string): any;
/**
 * Application bootstrap.
 * BEFORE CHANGING THIS FILE, make sure you read this:
 * http://support.screeps.com/hc/en-us/articles/204825672-New-main-loop-architecture
 *
 * Write your code to GameManager class in ./src/start/game-manager.ts
 */
declare var module: any;

/*
* Singleton object. Since GameManager doesn't need multiple instances we can use it as singleton object.
*/

// Any modules that you use that modify the game's prototypes should be require'd 
// before you require the profiler. 
var profiler = require('screeps-profiler');

// This line monkey patches the global prototypes. 
profiler.enable();

GameManager.globalBootstrap();

// This doesn't look really nice, but Screeps' system expects this method in main.js to run the application.
// If we have this line, we can make sure that globals bootstrap and game loop work.
// http://support.screeps.com/hc/en-us/articles/204825672-New-main-loop-architecture
module.exports.loop = function() {
    //profiler.wrap(function () {
        console.log();
        GameManager.loop();
    //});
};