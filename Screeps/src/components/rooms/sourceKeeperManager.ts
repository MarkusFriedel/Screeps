/// <reference path="../creeps/keeperBuster/keeperBuster.ts" />
/// <reference path="../creeps/keeperBuster/keeperBusterDefinition.ts" />
/// <reference path="./manager.ts" />

class SourceKeeperManager extends Manager implements SourceKeeperManagerInterface {

    _creeps: { time: number, creeps: Array<Creep> };
    public get creeps(): Array<Creep> {
        let trace = this.tracer.start('creeps()');
        if (this._creeps==null || this._creeps.time < Game.time)
            this._creeps = {
                time: Game.time, creeps: this.mainRoom.creepsByRole('keeperBuster')
            };
        trace.stop();
        return this._creeps.creeps;
    }

    private static _staticTracer: Tracer;
    public static get staticTracer(): Tracer {
        if (SourceKeeperManager._staticTracer == null) {
            SourceKeeperManager._staticTracer = new Tracer('SourceKeeperManager');
            Colony.tracers.push(SourceKeeperManager._staticTracer);
        }
        return SourceKeeperManager._staticTracer;
    }

    constructor(public mainRoom: MainRoom) {
        super(SourceKeeperManager.staticTracer);
    }

    public _preTick() {
        let trace = this.tracer.start('checkCreeps()');
        if (this.mainRoom.spawnManager.isBusy || this.creeps.length > -1) {
            trace.stop();
            return;
        }

        

        if (_.any(this.mainRoom.allRooms, r => _.any(r.mySources, s => s.hasKeeper) && _.filter(r.hostileScan.keepers, k => k.hits > 100).length > 0)) {
            trace.stop();
            return;
        }
        let definition = KeeperBusterDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, this.mainRoom.managers.labManager.availablePublishResources);

        if (definition == null) {
            trace.stop();
            return;
        }

        let memory: KeeperBusterMemory = {
            role: 'keeperBuster',
            autoFlee: false,
            requiredBoosts: definition.boosts,
            handledByColony: false,
            mainRoomName: this.mainRoom.name
        }

        //this.mainRoom.spawnManager.addToQueue(definition.getBody(), memory);

        trace.stop();
    }

    public _tick() {
        let trace = this.tracer.start('tick()');
        _.forEach(this.creeps, c => new KeeperBuster(this.mainRoom, c).tick());
        trace.stop();
    }

}