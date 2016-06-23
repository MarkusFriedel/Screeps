import {SpawnRoomHandler} from "./spawnRoomHandler";

export interface SpawnQueueItem {
    body: string[];
    memory: any;
}

export class SpawnManager {

    spawns: Spawn[];
    queue: SpawnQueueItem[] = [];
    isIdle: boolean;
    spawnRoomHandler: SpawnRoomHandler;


    constructor(spawnRoomHandler: SpawnRoomHandler) {
        this.spawnRoomHandler = spawnRoomHandler;

        this.spawns = _.filter(Game.spawns, (s) => s.room.name == spawnRoomHandler.roomName);

        if (Memory.rooms[spawnRoomHandler.roomName]['spawnManager'] == null)
            Memory.rooms[spawnRoomHandler.roomName]['spawnManager'] = {};

    }

    public AddToQueue(body: string[], memory: any, count) {
        for (let i = 0; i < count; i++)
            this.queue.push({body:body,memory:memory});
    }

    public spawn() {
        if (this.queue.length == 0) {
            this.isIdle = true;
            return;
        }
        let reversedQueue = this.queue.reverse();

        for (let idx in this.spawns) {
            let spawn = this.spawns[idx];
            if (reversedQueue.length == 0)
                break;
            var queueItem = reversedQueue[reversedQueue.length - 1];
            // TODO not only try the last queue item
            if (spawn.spawning == null && spawn.canCreateCreep(queueItem.body) == OK) {
                spawn.createCreep(queueItem.body, null, queueItem.memory);
                reversedQueue.pop();
            }

        }
    }

}