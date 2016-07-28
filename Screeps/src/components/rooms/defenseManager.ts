/// <reference path="../creeps/defender/defenderDefinition.ts" />
/// <reference path="../creeps/defender/defender.ts" />
/// <reference path="./manager.ts" />

class DefenseManager extends Manager  implements DefenseManagerInterface {

    _creeps: { time: number, creeps: Array<Creep> } = { time: 0, creeps: null };
    public get creeps(): Array<Creep> {
        if (this._creeps.time < Game.time)
            this._creeps = {
                time: Game.time, creeps: this.mainRoom.creepsByRole('defender')
            };
        return this._creeps.creeps;
    }

    maxCreeps = 1;

    private static _staticTracer: Tracer;
    public static get staticTracer(): Tracer {
        if (DefenseManager._staticTracer == null) {
            DefenseManager._staticTracer = new Tracer('DefenseManager');
            Colony.tracers.push(DefenseManager._staticTracer);
        }
        return DefenseManager._staticTracer;
    }

    constructor(public mainRoom: MainRoom) {
        super(DefenseManager.staticTracer);

    }

    public _preTick() {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if (_.filter(this.mainRoom.allRooms, (r) => !r.memory.foreignOwner && !r.memory.foreignReserver && r.requiresDefense && r.canHarvest).length > 0 && this.creeps.length < this.maxCreeps) {
            this.mainRoom.spawnManager.addToQueue(DefenderDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'defender' }, this.maxCreeps - this.creeps.length,true);
        }
    }

    public _tick() {
        this.creeps.forEach((c) => new Defender(c, this.mainRoom).tick());
    }

}