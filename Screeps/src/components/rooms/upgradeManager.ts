/// <reference path="../creeps/upgrader/upgraderDefinition.ts" />
/// <reference path="../creeps/upgrader/upgrader.ts" />

class UpgradeManager implements UpgradeManagerInterface {

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
        if (this.mainRoom.mainContainer != null && this.mainRoom.room.energyAvailable == this.mainRoom.room.energyCapacityAvailable && this.mainRoom.spawnManager.queue.length < 1 && (this.creeps.length < 1 || (this.mainRoom.mainContainer.store.energy == this.mainRoom.mainContainer.storeCapacity || this.mainRoom.mainContainer.store.energy > 300000) && this.creeps.length < 5 && this.mainRoom.room.controller.level<9)) {
            this.mainRoom.spawnManager.addToQueue(UpgraderDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, _.any(this.mainRoom.links, x => x.nearController)).getBody(), { role: 'upgrader' }, 1);
        }
    }

    public tick() {
        this.creeps.forEach((c) => new Upgrader(c, this.mainRoom).tick());
    }

}