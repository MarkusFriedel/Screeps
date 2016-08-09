/// <reference path="../creeps/spawnFiller/spawnFillerDefinition.ts" />
/// <reference path="../creeps/spawnFiller/spawnFiller.ts" />
/// <reference path="./manager.ts" />

class SpawnFillManager implements SpawnFillManagerInterface {

    _creeps: { time: number, creeps: Array<Creep> } = { time: 0, creeps: null };
    public get creeps(): Array<Creep> {
        if (this._creeps.time < Game.time)
            this._creeps = {
                time: Game.time, creeps: this.mainRoom.creepsByRole('spawnFiller')
            };
        return this._creeps.creeps;
    }

    

    constructor(public mainRoom: MainRoom) {
        if (myMemory['profilerActive']) {
            this.preTick = profiler.registerFN(this.preTick, 'SpawnFillManager.preTick');
            this.tick = profiler.registerFN(this.tick, 'SpawnFillManager.tick');
        }
    }

    public preTick() {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if (this.mainRoom.mainContainer != null && _.size(_.filter(this.mainRoom.creeps, (c) => c.memory.role == 'spawnFiller' && (c.ticksToLive > 70 || c.ticksToLive === undefined))) < 2) {
            this.mainRoom.spawnManager.addToQueue(SpawnFillerDefinition.getDefinition(this.creeps.length == 0 ? this.mainRoom.room.energyAvailable : this.mainRoom.maxSpawnEnergy).getBody(), { role: 'spawnFiller' }, 1, true);
        }
    }

    public tick() {
        this.creeps.forEach((c) => new SpawnFiller(c.name, this.mainRoom).tick());
    }

}