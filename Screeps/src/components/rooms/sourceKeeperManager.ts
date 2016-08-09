/// <reference path="../creeps/keeperBuster/keeperBuster.ts" />
/// <reference path="../creeps/keeperBuster/keeperBusterDefinition.ts" />
/// <reference path="./manager.ts" />

class SourceKeeperManager implements SourceKeeperManagerInterface {

    public get memory(): SourceKeeperManagerMemory {
        return this.accessMemory();
    }

    accessMemory() {
        if (this.mainRoom.memory.sourceKeeperManager == null)
            this.mainRoom.memory.sourceKeeperManager = {
            }
        return this.mainRoom.memory.sourceKeeperManager;
    }

    _creeps: { time: number, creeps: Array<Creep> };
    public get creeps(): Array<Creep> {

        if (this._creeps == null || this._creeps.time < Game.time)
            this._creeps = {
                time: Game.time, creeps: this.mainRoom.creepsByRole('keeperBuster')
            };

        return this._creeps.creeps;
    }



    constructor(public mainRoom: MainRoom) {
        if (myMemory['profilerActive']) {
            this.preTick = profiler.registerFN(this.preTick, 'SourceKeeperManager.preTick');
            this.tick = profiler.registerFN(this.tick, 'SourceKeeperManager.tick');
        }
    }

    private sleep(myRoom: MyRoomInterface) {
        if (!this.memory.sleepUntil)
            this.memory.sleepUntil = {};
        this.memory.sleepUntil[myRoom.name] = Game.time + 10;

    }

    public preTick(myRoom: MyRoomInterface) {
        if (this.mainRoom.spawnManager.isBusy || (this.memory.sleepUntil && this.memory.sleepUntil[myRoom.name] > Game.time)) {
            return;
        }



        if (!(myRoom.myMineral.usable && myRoom.myMineral.hasKeeper && myRoom.myMineral.keeper && (!myRoom.myMineral.keeper.creep || myRoom.myMineral.keeper.creep.hits > 100) || _.any(myRoom.mySources, s => s.usable && s.hasKeeper && s.keeper&&(!s.keeper.creep || s.keeper.creep.hits > 100)))) {
            this.sleep(myRoom);
            return;
        }

        let definition = KeeperBusterDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, this.mainRoom.managers.labManager.availablePublishResources);
        if (definition == null) {
            console.log('NO KEEPERBUSTER definition');
            this.sleep(myRoom);
            return;
        }
        if (_.filter(this.creeps, c => c.memory.roomName == myRoom.name && !c.memory.recycle && (c.spawning || (c.ticksToLive != null && c.ticksToLive > _.min(myRoom.mySources, x => x.pathLengthToDropOff).pathLengthToDropOff + 50 + definition.getBody().length * 3))).length == 0) {


            if (definition != null) {


                let memory: KeeperBusterMemory = {
                    role: 'keeperBuster',
                    requiredBoosts: definition.boosts,
                    mainRoomName: this.mainRoom.name,
                    roomName: myRoom.name,
                }
                console.log('Trying to build KeeperBuster');

                this.mainRoom.spawnManager.addToQueue(definition.getBody(), memory);
            }
        }

    }

    public tick() {
        _.forEach(this.creeps, c => new KeeperBuster(c.name, this.mainRoom).tick());
    }

}