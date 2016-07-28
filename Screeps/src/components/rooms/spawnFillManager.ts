/// <reference path="../creeps/spawnFiller/spawnFillerDefinition.ts" />
/// <reference path="../creeps/spawnFiller/spawnFiller.ts" />
/// <reference path="./manager.ts" />

class SpawnFillManager extends Manager implements SpawnFillManagerInterface {

    _creeps: { time: number, creeps: Array<Creep> } = { time: 0, creeps: null };
    public get creeps(): Array<Creep> {
        if (this._creeps.time < Game.time)
            this._creeps = {
                time: Game.time, creeps: this.mainRoom.creepsByRole('spawnFiller')
            };
        return this._creeps.creeps;
    }

    private static _staticTracer: Tracer;
    public static get staticTracer(): Tracer {
        if (SpawnFillManager._staticTracer == null) {
            SpawnFillManager._staticTracer = new Tracer('SpawnFillManager');
            Colony.tracers.push(SpawnFillManager._staticTracer);
        }
        return SpawnFillManager._staticTracer;
    }

    constructor(public mainRoom: MainRoom) {
        super(SpawnFillManager.staticTracer);
    }

    public _preTick() {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if (this.mainRoom.mainContainer != null && _.size(_.filter(this.mainRoom.creeps, (c) => c.memory.role == 'spawnFiller' && (c.ticksToLive > 70 || c.ticksToLive === undefined))) < 2) {
            this.mainRoom.spawnManager.addToQueue(SpawnFillerDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'spawnFiller' }, 1,true);
        }
    }

    public _tick() {
        this.creeps.forEach((c) => new SpawnFiller(c, this.mainRoom).tick());
    }

}