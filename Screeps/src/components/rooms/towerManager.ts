/// <reference path="../creeps/towerFiller/towerFillerDefinition.ts" />
/// <reference path="../creeps/towerFiller/towerFiller.ts" />
/// <reference path="./manager.ts" />

class TowerManager extends Manager implements TowerManagerInterface {
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

    private static _staticTracer: Tracer;
    public static get staticTracer(): Tracer {
        if (TowerManager._staticTracer == null) {
            TowerManager._staticTracer = new Tracer('TowerManager');
            Colony.tracers.push(TowerManager._staticTracer);
        }
        return TowerManager._staticTracer;
    }

    constructor(public mainRoom: MainRoom) {
        super(TowerManager.staticTracer);

    }

    public _preTick() {
        if ((this.mainRoom.towers.length == 0 || this.mainRoom.mainContainer == null) && !(_.any(this.mainRoom.towers, x => x.energy < 0.8 * x.energyCapacity)))
            return;
        if (this.creeps.length < 1) {
            this.mainRoom.spawnManager.addToQueue(TowerFillerDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, this.mainRoom.towers.length).getBody(), { role: 'towerFiller' }, 1);
        }
    }

    public _tick() {
        this.creeps.forEach((c) => new TowerFiller(c, this.mainRoom).tick());
    }
}