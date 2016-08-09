/// <reference path="../creeps/defender/defenderDefinition.ts" />
/// <reference path="../creeps/defender/defender.ts" />
/// <reference path="./manager.ts" />

class DefenseManager  implements DefenseManagerInterface {

    _creeps: { time: number, creeps: Array<Creep> } = { time: 0, creeps: null };
    public get creeps(): Array<Creep> {
        if (this._creeps.time < Game.time)
            this._creeps = {
                time: Game.time, creeps: this.mainRoom.creepsByRole('defender')
            };
        return this._creeps.creeps;
    }

    maxCreeps = 1;

   

    constructor(public mainRoom: MainRoom) {
        if (myMemory['profilerActive']) {
            this.preTick = profiler.registerFN(this.preTick, 'DefenseManager.preTick');
            this.tick = profiler.registerFN(this.tick, 'DefenseManager.tick');
        }

    }

    public preTick() {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if (_.filter(this.mainRoom.allRooms, (r) => !r.memory.fO && !r.memory.fR && r.requiresDefense && r.canHarvest).length > 0 && this.creeps.length < this.maxCreeps) {
            this.mainRoom.spawnManager.addToQueue(DefenderDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'defender' }, this.maxCreeps - this.creeps.length,true);
        }
    }

    public tick() {
        this.creeps.forEach((c) => new Defender(c.name, this.mainRoom).tick());
    }

}