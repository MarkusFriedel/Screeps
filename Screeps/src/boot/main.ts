/// <reference path="../game-manager.ts" />

declare function require(string): any;
var profiler = require('screeps-profiler');
/**
 * Application bootstrap.
 * BEFORE CHANGING THIS FILE, make sure you read this:
 * http://support.screeps.com/hc/en-us/articles/204825672-New-main-loop-architecture
 *
 * Write your code to GameManager class in ./src/start/game-manager.ts
 */
declare var module: any;
declare var RawMemory: any;

//Object.prototype.getName = function () {
//    var funcNameRegex = /function (.{1,})\(/;
//    var results = (funcNameRegex).exec((this).constructor.toString());
//    return (results && results.length > 1) ? results[1] : "";
//};

/*
* Singleton object. Since GameManager doesn't need multiple instances we can use it as singleton object.
*/

// Any modules that you use that modify the game's prototypes should be require'd 
// before you require the profiler. 


// This line monkey patches the global prototypes. 
if (Memory['profilerActive']==true)
    profiler.enable();

GameManager.globalBootstrap();

function deleteNulls() {

}

// This doesn't look really nice, but Screeps' system expects this method in main.js to run the application.
// If we have this line, we can make sure that globals bootstrap and game loop work.
// http://support.screeps.com/hc/en-us/articles/204825672-New-main-loop-architecture
module.exports.loop = function () {
    let startCPU = Game.cpu.getUsed()
    console.log();
    console.log();
    console.log('Tick Start CPU:' + startCPU.toFixed(2));

    if (!Memory['colony'].active) {
        
        return;
    }
    console.log('Deserialize memory: ' + (Game.cpu.getUsed() - startCPU).toFixed(2));

    

    //console.log('Before parse: CPU:' + Game.cpu.getUsed() + ' Bucket: ' + Game.cpu.bucket);
    //var myMemory = JSON.parse((<any>RawMemory).get());
    //console.log('After parse: CPU:' + Game.cpu.getUsed() + ' Bucket: ' + Game.cpu.bucket);
    if (Memory['profilerActive'] == true) {
        profiler.wrap(function () {
            console.log();
            GameManager.loop();
        });
    }
    else {
        console.log();
        GameManager.loop();
    }
};