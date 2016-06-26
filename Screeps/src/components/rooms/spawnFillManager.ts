import {MainRoom} from "./mainRoom";
import {SpawnFiller} from "../creeps/spawnFiller/spawnFiller";
import {SpawnFillerDefinition} from "../creeps/spawnFiller/spawnFillerDefinition";

export class SpawnFillManager {

    mainRoom: MainRoom;
    creeps: Array<Creep>;

    constructor(mainRoom: MainRoom) {
        this.mainRoom = mainRoom;
        this.getData();
    }

    public checkCreeps() {
        if (this.mainRoom.mainContainer != null && _.size(_.filter(Game.creeps, (c) => c.memory.role == 'spawnFiller')) < 2) {
            this.mainRoom.spawnManager.AddToQueue(SpawnFillerDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'spawnFiller' }, 1);
        }
    }

    getData() {
        this.creeps = _.filter(this.mainRoom.creeps, (c) => c.memory.role == 'spawnFiller');
    }

    public tick() {
        this.getData();
        this.creeps.forEach((c) => new SpawnFiller(c, this.mainRoom).tick());
    }

}