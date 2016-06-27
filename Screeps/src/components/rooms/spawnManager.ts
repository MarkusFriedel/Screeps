import {MainRoom} from "./mainRoom";

export interface SpawnQueueItem {
    body: string[];
    memory: any;
}

export class SpawnManager {

    public get memory(): SpawnManagerMemory {
        return this.accessMemory();
    }

    accessMemory() {
        if (this.mainRoom.memory.spawnManager == null)
            this.mainRoom.memory.spawnManager = {
                debug: false,
                verbose: false,
                queue:null
            }
        return this.mainRoom.memory.spawnManager;
    }

    queue: SpawnQueueItem[] = [];
    isIdle: boolean;
    mainRoom: MainRoom;

    constructor(mainRoom: MainRoom, memory: SpawnManagerMemory) {
        this.mainRoom = mainRoom;
    }

    public AddToQueue(body: string[], memory: any, count: number = 1, priority:boolean=false) {
        if (Memory['verbose'] || this.memory.verbose &&count>0)
            console.log('[' + this.mainRoom.name + '] ' + 'SpawnManager.AddToQueue(): ' + memory['role'] + ': ' + count);
        for (let i = 0; i < count; i++) {
            if (priority)
                this.queue.unshift({ body: body, memory: memory });
            else
                this.queue.push({ body: body, memory: memory });
        }
    }

    public spawn() {
        if (Memory['verbose'] || this.memory.verbose)
            console.log('[' + this.mainRoom.name + '] ' + 'SpawnManager.spawn(): queue.length is ' + this.queue.length);
        if (Memory['debug'] || this.memory.debug)
            this.memory.queue = JSON.parse(JSON.stringify(this.queue));

        if (this.queue.length == 0) {
            this.isIdle = true;
           
            return;
        }
        for (let idx in this.mainRoom.spawnNames) {
            let spawn = Game.spawns[this.mainRoom.spawnNames[idx]];
            if (Memory['verbose'] || this.memory.verbose)
                console.log('[' + this.mainRoom.name + '] ' +'SpawnManager.spawn(): Spawn: ' + spawn.name);
            if (this.queue.length == 0) {
                if (Memory['verbose'] || this.memory.verbose)
                    console.log('[' + this.mainRoom.name + '] ' +'SpawnManager.spawn(): emptied the queue');
                break;
            }
            var queueItem = this.queue[0];
            if (Memory['verbose'] || this.memory.verbose)
                console.log('[' + this.mainRoom.name + '] ' +'SpawnManager.spawn(): First item: ' + queueItem.memory['role']+': '+ queueItem.body.join(', '));
            // TODO not only try the last queue item
            if (spawn.spawning == null) {
                if (Memory['verbose'] || this.memory.verbose)
                    console.log('[' + this.mainRoom.name + '] ' +'SpawnManager.spawn(): Spawn is not busy');
                let creepMemory = <CreepMemory>queueItem.memory;
                creepMemory.mainRoomName = this.mainRoom.name;
                var result = spawn.createCreep(queueItem.body, null, creepMemory);
                if (Memory['verbose'] || this.memory.verbose)
                    console.log('[' + this.mainRoom.name + '] ' +'SpawnManager.spawn(): Spawn result: ' + result);
                if (Memory['verbose'] || this.memory.verbose)
                    console.log('[' + this.mainRoom.name + '] ' +'spawn.createCreepResult: ' + result);
                if (_.isString(result))
                    this.queue.shift();
            }
            else {
                if (Memory['verbose'] || this.memory.verbose)
                    console.log('[' + this.mainRoom.name + '] ' +'SpawnManager.spawn(): Spawn is busy');
            }

        }

        this.queue = [];
    }

}