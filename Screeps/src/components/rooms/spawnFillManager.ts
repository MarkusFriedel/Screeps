import {MainRoom} from "./mainRoom";
import {SpawnFiller} from "../creeps/spawnFiller/spawnFiller";
import {SpawnFillerDefinition} from "../creeps/spawnFiller/spawnFillerDefinition";

export class SpawnFillManager {

    _creeps: { time: number, creeps: Array<Creep> } = { time: 0, creeps: null };
    public get creeps(): Array<Creep> {
        if (this._creeps.time < Game.time)
            this._creeps = {
                time: Game.time, creeps: _.filter(this.mainRoom.creeps, (c) => c.memory.role == 'spawnFiller')
            };
        return this._creeps.creeps;
    }

    constructor(public mainRoom: MainRoom) {
    }

    public checkCreeps() {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if (this.mainRoom.mainContainer != null && _.size(_.filter(this.mainRoom.creeps, (c) => c.memory.role == 'spawnFiller' && (c.ticksToLive > 70 || c.ticksToLive === undefined))) < 2) {
            this.mainRoom.spawnManager.AddToQueue(SpawnFillerDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'spawnFiller' }, 1,true);
        }
    }

    public tick() {
        this.creeps.forEach((c) => new SpawnFiller(c, this.mainRoom).tick());
    }

}