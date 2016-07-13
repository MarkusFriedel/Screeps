/// <reference path="../creeps/towerFiller/towerFillerDefinition.ts" />
/// <reference path="../creeps/towerFiller/towerFiller.ts" />

class TowerManager implements TowerManagerInterface {
    public get memory(): TowerManagerMemory {
        return this.accessMemory();
    }

    accessMemory() {
        if (this.mainRoom.memory.harvestingManager == null)
            this.mainRoom.memory.harvestingManager = {
                debug: false,
                verbose: false
            }
        return this.mainRoom.memory.harvestingManager;
    }

    _creeps: { time: number, creeps: Array<Creep> } = { time: -1, creeps: null };
    public get creeps(): Array<Creep> {
        if (this._creeps.time < Game.time)
            this._creeps = {
                time: Game.time, creeps: _.filter(this.mainRoom.creeps, (c) => c.memory.role == 'towerFiller')
            };
        return this._creeps.creeps;
    }

    constructor(public mainRoom: MainRoomInterface) {

    }

    public checkCreeps() {
        if (this.mainRoom.towers.length == 0)
            return;
        if (this.creeps.length < 1) {
            this.mainRoom.spawnManager.addToQueue(TowerFillerDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'towerFiller' }, 1);
        }
    }

    public tick() {
        this.creeps.forEach((c) => new TowerFiller(c, this.mainRoom).tick());
    }
}