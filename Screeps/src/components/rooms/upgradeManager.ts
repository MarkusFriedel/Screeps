import {SpawnRoomHandler} from "./spawnRoomHandler";
import {Upgrader} from "../creeps/upgrader/upgrader";
import {UpgraderDefinition} from "../creeps/upgrader/upgraderDefinition";

export class UpgradeManager {

    spawnRoomHandler: SpawnRoomHandler;
    creeps: Array<Creep>;

    constructor(spawnRoomHandler: SpawnRoomHandler) {
        this.spawnRoomHandler = spawnRoomHandler;
        this.creeps = _.filter(spawnRoomHandler.creeps, (c) => c.memory.role == 'upgrader');
    }

    public checkCreeps() {
        if (this.spawnRoomHandler.mainContainer != null && this.spawnRoomHandler.room.energyAvailable == this.spawnRoomHandler.room.energyCapacityAvailable && this.spawnRoomHandler.spawnManager.queue.length == 0 && _.filter(Game.creeps, (c) => c.memory.role == 'upgrader').length < 2) {
            this.spawnRoomHandler.spawnManager.AddToQueue(UpgraderDefinition.getDefinition(this.spawnRoomHandler.maxSpawnEnergy).getBody(), { role: 'upgrader', spawnRoomName: this.spawnRoomHandler.roomName }, 1);
        }
    }

    public tick() {
        this.creeps.forEach((c) => new Upgrader(c, this.spawnRoomHandler).tick());
    }

}