import {MainRoom} from "./mainRoom";
import {Upgrader} from "../creeps/upgrader/upgrader";
import {UpgraderDefinition} from "../creeps/upgrader/upgraderDefinition";

export class UpgradeManager {

    mainRoom: MainRoom;
    creeps: Array<Creep>;

    constructor(mainRoom: MainRoom) {
        this.mainRoom = mainRoom;
        this.getData();
    }

    getData() {
        this.creeps = _.filter(this.mainRoom.creeps, (c) => c.memory.role == 'upgrader');
    }

    public checkCreeps() {
        this.getData();
        if (this.mainRoom.mainContainer != null && Game.rooms[this.mainRoom.name].energyAvailable == Game.rooms[this.mainRoom.name].energyCapacityAvailable && this.mainRoom.spawnManager.queue.length == 0 && (this.creeps.length < 2 || this.mainRoom.mainContainer.store.energy == this.mainRoom.mainContainer.storeCapacity || this.mainRoom.mainContainer.store.enery>500000)) {
            this.mainRoom.spawnManager.AddToQueue(UpgraderDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'upgrader' }, 1);
        }
    }

    public tick() {
        this.getData();
        this.creeps.forEach((c) => new Upgrader(c, this.mainRoom).tick());
    }

}