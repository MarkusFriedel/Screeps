import {Config} from "./config/config";
import {ColonyHandler} from "./colony/colonyHandler";

/**
 * Singleton object.
 * Since singleton classes are considered anti-pattern in Typescript, we can effectively use namespaces.
 * Namespace's are like internal modules in your Typescript application. Since GameManager doesn't need multiple instances
 * we can use it as singleton.
 */
export namespace GameManager {

    export function globalBootstrap() {
        // Set up your global objects.
        // This method is executed only when Screeps system instantiated new "global".

        // Use this bootstrap wisely. You can cache some of your stuff to save CPU
        // You should extend prototypes before game loop in here.


        
    }

    export function loop() {
        // Loop code starts here
        // This is executed every tick

        for (var name in Memory.creeps) {
            if (!Game.creeps[name]) {
                delete Memory.creeps[name];
            }
        }


        if (Memory['verbose'])
            console.log('MainLoop');

        new ColonyHandler().tick();
    }

}