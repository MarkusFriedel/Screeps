/// <reference path="../creeps/towerFiller/towerFillerDefinition.ts" />
/// <reference path="../creeps/towerFiller/towerFiller.ts" />
/// <reference path="./manager.ts" />

class TowerManager implements TowerManagerInterface {
    public get memory(): TowerManagerMemory {
        return this.accessMemory();
    }

    accessMemory() {
        if (this.mainRoom.memory.towerManager == null)
            this.mainRoom.memory.towerManager = {
                debug: false,
                verbose: false
            }
        return this.mainRoom.memory.towerManager;
    }

    _creeps: { time: number, creeps: Array<Creep> } = { time: -1, creeps: null };
    public get creeps(): Array<Creep> {
        if (this._creeps.time < Game.time)
            this._creeps = {
                time: Game.time, creeps: this.mainRoom.creepsByRole('towerFiller')
            };
        return this._creeps.creeps;
    }

   

    constructor(public mainRoom: MainRoom) {
        if (myMemory['profilerActive']) {
            this.preTick = profiler.registerFN(this.preTick, 'TowerManager.preTick');
            this.tick = profiler.registerFN(this.tick, 'TowerManager.tick');
        }

    }

    public preTick() {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if ((this.mainRoom.towers.length == 0 || this.mainRoom.mainContainer == null) || (_.all(this.mainRoom.towers, x => x.energy > 0.5 * x.energyCapacity) && _.size(this.mainRoom.myRoom.hostileScan.creeps)==0))
            return;
        if (this.creeps.length < 1) {
            this.mainRoom.spawnManager.addToQueue(TowerFillerDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, this.mainRoom.towers.length).getBody(), { role: 'towerFiller' }, 1);
        }
    }

    public tick() {
        this.creeps.forEach((c) => new TowerFiller(c.name, this.mainRoom).tick());
    }
}