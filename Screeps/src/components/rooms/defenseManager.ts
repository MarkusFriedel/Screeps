import {MainRoom} from "./mainRoom";
import {Defender} from "../creeps/defender/defender";
import {DefenderDefinition} from "../creeps/defender/defenderDefinition";

export class DefenseManager {

    _creeps: { time: number, creeps: Array<Creep> } = { time: 0, creeps: null };
    public get creeps(): Array<Creep> {
        if (this._creeps.time < Game.time)
            this._creeps = {
                time: Game.time, creeps: _.filter(this.mainRoom.creeps, (c) => c.memory.role == 'defender')
            };
        return this._creeps.creeps;
    }

    maxCreeps = 1;

    constructor(public mainRoom: MainRoom) {

    }

    public checkCreeps() {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if (_.filter(this.mainRoom.allRooms, (r) => !r.memory.foreignOwner && !r.memory.foreignReserver&& r.memory.hostiles && r.canHarvest).length > 0 && this.creeps.length < this.maxCreeps) {
            this.mainRoom.spawnManager.AddToQueue(DefenderDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'defender' }, this.maxCreeps - this.creeps.length);
        }
    }

    public tick() {
        this.creeps.forEach((c) => new Defender(c, this.mainRoom).tick());
    }

}