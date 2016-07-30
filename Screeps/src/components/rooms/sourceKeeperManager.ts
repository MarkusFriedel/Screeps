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
        if (this.mainRoom.spawnManager.isBusy) {
            return;
        }

        _.forEach(_.filter(this.mainRoom.allRooms, r => _.any(r.mySources, s => s.hasKeeper)), myRoom => {

            if (_.filter(this.creeps, c => c.memory.roomName == myRoom.name).length == 0) {
                let definition = KeeperBusterDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, this.mainRoom.managers.labManager.availablePublishResources);

                if (definition != null) {


                    let memory: KeeperBusterMemory = {
                        role: 'keeperBuster',
                        autoFlee: false,
                        requiredBoosts: definition.boosts,
                        handledByColony: false,
                        mainRoomName: this.mainRoom.name,
                        roomName: myRoom.name,
                        path: null,
                        fleeing: null,
                        targetId:null
                    }

                    this.mainRoom.spawnManager.addToQueue(definition.getBody(), memory);
                }
            }
        });

    }

    public _tick() {
        _.forEach(this.creeps, c => new KeeperBuster(this.mainRoom, c).tick());
    }

}