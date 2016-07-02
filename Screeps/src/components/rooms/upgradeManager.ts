import {MainRoom} from "./mainRoom";
import {Upgrader} from "../creeps/upgrader/upgrader";
import {UpgraderDefinition} from "../creeps/upgrader/upgraderDefinition";

export class UpgradeManager {

    _creeps: { time: number, creeps: Array<Creep> } = { time: 0, creeps: null };
    public get creeps(): Array<Creep> {
        if (this._creeps.time < Game.time)
            this._creeps = {
                time: Game.time, creeps: _.filter(this.mainRoom.creeps, (c) => c.memory.role == 'upgrader')
            };
        return this._creeps.creeps;
    }

    constructor(public mainRoom: MainRoom) {
    }


    public checkCreeps() {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if (this.mainRoom.mainContainer != null && this.mainRoom.room.energyAvailable == Game.rooms[this.mainRoom.name].energyCapacityAvailable && this.mainRoom.spawnManager.queue.length == 0 && (this.creeps.length < 1 || this.mainRoom.mainContainer.store.energy == this.mainRoom.mainContainer.storeCapacity || this.mainRoom.mainContainer.store.enery > 200000)) {
            this.mainRoom.spawnManager.AddToQueue(UpgraderDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, _.any(this.mainRoom.links, x => x.nearController)).getBody(), { role: 'upgrader' }, 1);
        }
    }

    public tick() {
        this.creeps.forEach((c) => new Upgrader(c, this.mainRoom).tick());
    }

}