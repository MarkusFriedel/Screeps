/// <reference path="../../components/creeps/creepInfo.ts" />

class HostileScan implements HostileScanInterface {

    public get memory(): HostileScanMemory {
        return this.accessMemory();
    }

    private accessMemory() {
        if (this.myRoom.memory.hostileScan == null)
            this.myRoom.memory.hostileScan = {
                creeps: null,
                scanTime: null
            };

        return this.myRoom.memory.hostileScan;
    }

    public get scanTime() {
        return this.memory.scanTime;
    }


    private _creeps: { time: number, creeps: { [id: string]: CreepInfoInterface } }
    private creeps_get() {
        if (this.allCreeps == null)
            return null;
        if (this._creeps == null || this._creeps.time < Game.time)
            this._creeps = { time: Game.time, creeps: _.indexBy(_.filter(this.allCreeps, c => c.owner != 'Source Keeper'), c => c.id) };

        return this._creeps.creeps;
    }
    public get creeps() {
        return this.creeps_get();
    }

    private _keepers: { time: number, creeps: { [id: string]: CreepInfoInterface } }
    public get keepers() {
        if (this.allCreeps == null)
            return null;
        if (this._keepers == null || this._keepers.time < Game.time)
            this._keepers = { time: Game.time, creeps: _.indexBy(_.filter(this.allCreeps, c => c.owner == 'Source Keeper'), c => c.id) };

        return this._keepers.creeps;
    }

    private _allCreeps: { time: number, creeps: { [id: string]: CreepInfoInterface } }
    public get allCreeps() {
        if (this.myRoom.room && (this._allCreeps == null || this._allCreeps.time < Game.time)) {
            this.refreshCreeps();
        }
        else if (this.memory.creeps) {
            this._allCreeps = { time: this.memory.creeps.time, creeps: {} };
            this._allCreeps.creeps = _.indexBy(_.map(this.memory.creeps.creeps, creep => new CreepInfo(creep.id, this)), x => x.id);
        }
        else
            return null;
        if (this._allCreeps)

            return this._allCreeps.creeps;
        else return null;
    }



    public refreshCreeps() {
        if (this.myRoom.room) {
            this._allCreeps = { time: Game.time, creeps: {} };
            this.memory.creeps = { time: Game.time, creeps: {} };
            this._allCreeps.creeps = _.indexBy(_.map(this.myRoom.room.find<Creep>(FIND_HOSTILE_CREEPS), creep => new CreepInfo(creep.id, this)), x => x.id);
        }
    }

    constructor(public myRoom: MyRoomInterface) {
        this.creeps_get = profiler.registerFN(this.creeps_get, 'HostileScan.creeps');
        if (this._allCreeps && this._allCreeps.time + 500 < Game.time)
            this._allCreeps = null;
    }
}