/// <reference path="../creeps/upgrader/upgraderDefinition.ts" />
/// <reference path="../creeps/upgrader/upgrader.ts" />
/// <reference path="./manager.ts" />

class UpgradeManager extends Manager implements UpgradeManagerInterface {

    _creeps: { time: number, creeps: Array<Creep> } = { time: 0, creeps: null };
    public get creeps(): Array<Creep> {
        if (this._creeps.time < Game.time)
            this._creeps = {
                time: Game.time, creeps: this.mainRoom.creepsByRole('upgrader')
            };
        return this._creeps.creeps;
    }

    private static _staticTracer: Tracer;
    public static get staticTracer(): Tracer {
        if (UpgradeManager._staticTracer == null) {
            UpgradeManager._staticTracer = new Tracer('UpgradeManager');
            Colony.tracers.push(UpgradeManager._staticTracer);
        }
        return UpgradeManager._staticTracer;
    }

    constructor(public mainRoom: MainRoom) {
        super(UpgradeManager.staticTracer);
    }


    public _preTick() {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if (this.mainRoom.mainContainer != null && this.mainRoom.room.energyAvailable == this.mainRoom.room.energyCapacityAvailable && this.mainRoom.spawnManager.queue.length < 1 && (this.creeps.length < 1 || (this.mainRoom.mainContainer.store.energy == this.mainRoom.mainContainer.storeCapacity || this.mainRoom.mainContainer.store.energy > 300000 || this.mainRoom.mainContainer.store.energy > 50000 && this.mainRoom.room.controller.level<6) && this.creeps.length < 5 && this.mainRoom.room.controller.level < 8)) {
            this.mainRoom.spawnManager.addToQueue(UpgraderDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, _.any(this.mainRoom.links, x => x.nearController), this.mainRoom.room.controller.level==8 ? 15 : 50).getBody(), { role: 'upgrader' }, 1);
        }
    }

    public _tick() {
        this.creeps.forEach((c) => new Upgrader(c, this.mainRoom).tick());
    }

}