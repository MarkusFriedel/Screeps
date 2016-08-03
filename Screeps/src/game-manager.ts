/// <reference path="./colony/colony.ts" />

/**
 * Singleton object.
 * Since singleton classes are considered anti-pattern in Typescript, we can effectively use namespaces.
 * Namespace's are like internal modules in your Typescript application. Since GameManager doesn't need multiple instances
 * we can use it as singleton.
 */
namespace GameManager {

    export function globalBootstrap() {
        // Set up your global objects.
        // This method is executed only when Screeps system instantiated new "global".

        // Use this bootstrap wisely. You can cache some of your stuff to save CPU
        // You should extend prototypes before game loop in here.


        console.log('Global reset');
        let startCpu = Game.cpu.getUsed();
        if (!Memory['colony'])
            Memory['colony'] = {};

        var colonyMemory = <ColonyMemory>Memory['colony'];

        Colony.initialize(colonyMemory);

        let endCpu = Game.cpu.getUsed();
        console.log('Booting: ' + (endCpu.toFixed(2)));

        console.log();
        console.log('Boot tracers :');
        //for (let idx in Colony.tracers) {
        //    Colony.tracers[idx].print();
        //}
    }



    export function loop() {
        // Loop code starts here
        // This is executed every tick

        //var a = 1;
        //if (a == 1)
        //    return;


        let startCpu = Game.cpu.getUsed();
        if (Game.time % 100 == 0)
            for (var name in Memory.creeps) {
                if (!Game.creeps[name]) {
                    delete Memory.creeps[name];
                }
            }

        if (Memory['verbose'])
            console.log('MainLoop');

        Colony.tick();


        console.log();
        console.log('Loop tracers :');
        //for (let idx in Colony.tracers) {
        //    Colony.tracers[idx].print();
        //    Colony.tracers[idx].reset();

        //}

        let endCpu = Game.cpu.getUsed();
        console.log('Time: ' + Game.time + ' Measured CPU: ' + (endCpu - startCpu).toFixed(2) + ', CPU: ' + endCpu.toFixed(2) + ' Bucket: ' + Game.cpu.bucket);

        if (Memory['cpuStat'] == null)
            Memory['cpuStat'] = [];

        Memory['cpuStat'].push(endCpu);
        if (Memory['cpuStat'].length > 100)
            (<Array<number>>Memory['cpuStat']).shift();
        console.log('100Avg: ' + (_.sum(Memory['cpuStat']) / Memory['cpuStat'].length).toFixed(2) + ' CPU');
    }

}