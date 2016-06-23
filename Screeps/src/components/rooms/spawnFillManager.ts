import {SpawnRoomHandler} from "./spawnRoomHandler";
import {SpawnFiller} from "../creeps/spawnFiller/spawnFiller";
import {SpawnFillerDefinition} from "../creeps/spawnFiller/spawnFillerDefinition";

export class SpawnFillManager {

    spawnRoomHandler: SpawnRoomHandler;
    creeps: Array<Creep>;

    constructor(spawnRoomHandler: SpawnRoomHandler) {
        this.spawnRoomHandler = spawnRoomHandler;
        this.creeps = _.filter(spawnRoomHandler.creeps, (c) => c.memory.role == 'spawnFiller');
    }

    public checkCreeps() {
        if (this.spawnRoomHandler.mainContainer != null && _.size(_.filter(Game.creeps, (c) => c.memory.role == 'spawnFiller')) < 2) {
            this.spawnRoomHandler.spawnManager.AddToQueue(SpawnFillerDefinition.getDefinition(this.spawnRoomHandler.maxSpawnEnergy).getBody(), { role: 'spawnFiller', spawnRoomName: this.spawnRoomHandler.roomName }, 1);
        }
    }

    public tick() {
        this.creeps.forEach((c) => new SpawnFiller(c, this.spawnRoomHandler).tick());
    }

}