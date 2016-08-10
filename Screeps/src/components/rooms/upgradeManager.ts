/// <reference path="../creeps/upgrader/upgraderDefinition.ts" />
/// <reference path="../creeps/upgrader/upgrader.ts" />
/// <reference path="./manager.ts" />

class UpgradeManager implements UpgradeManagerInterface {

    _creeps: { time: number, creeps: Array<Creep> } = { time: 0, creeps: null };
    public get creeps(): Array<Creep> {
        if (this._creeps.time < Game.time)
            this._creeps = {
                time: Game.time, creeps: this.mainRoom.creepsByRole('upgrader')
            };
        return this._creeps.creeps;
    }

    

    constructor(public mainRoom: MainRoom) {
        if (myMemory['profilerActive']) {
            this.preTick = profiler.registerFN(this.preTick, 'UpgradeManager.preTick');
            this.tick = profiler.registerFN(this.tick, 'UpgradeManager.tick');
        }
    }


    public preTick() {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if ((this.mainRoom.room.controller.ticksToDowngrade < 2000 || this.mainRoom.mainContainer != null && this.mainRoom.room.energyAvailable == this.mainRoom.room.energyCapacityAvailable) && (this.creeps.length == 0 && (this.mainRoom.mainContainer.structureType != STRUCTURE_STORAGE || this.mainRoom.mainContainer.store.energy >= 10000) || (_.sum(this.mainRoom.mainContainer.store) == this.mainRoom.mainContainer.storeCapacity || this.mainRoom.mainContainer.store.energy > 150000 || this.mainRoom.mainContainer.store.energy > 100000 && this.mainRoom.room.controller.level < 6 || this.mainRoom.mainContainer.store.energy > 15000 && this.mainRoom.room.controller.level < 5) && this.creeps.length < 10 && this.mainRoom.room.controller.level < 8)) {
            let definition = UpgraderDefinition.getDefinition(Math.min(this.mainRoom.maxSpawnEnergy, 300 * _.size(this.mainRoom.sources)), _.any(this.mainRoom.links, x => x.nearController), this.mainRoom.room.controller.level == 8 ? 15 : 50, this.mainRoom.managers.labManager.availablePublishResources);
            this.mainRoom.spawnManager.addToQueue(definition.getBody(), { role: 'upgrader', requiredBoosts: definition.boosts }, 1);
        }
    }

    public tick() {
        this.creeps.forEach((c) => new Upgrader(c.name, this.mainRoom).tick());
    }

}