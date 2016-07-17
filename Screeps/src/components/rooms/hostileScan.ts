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
    public get creeps() {
        if (this.myRoom.room && (this._creeps == null || this._creeps.time < Game.time)) {
            this.refreshCreeps();
        }
        else if (this.memory.creeps) {
            this._creeps = { time: this.memory.creeps.time, creeps: {} };
            this._creeps.creeps = _.indexBy(_.map(this.memory.creeps.creeps, creep => new CreepInfo(creep.id, this)), x => x.id);
        }
        if (this._creeps)

            return this._creeps.creeps;
        else return null;
    }

    public refreshCreeps() {
        if (this.myRoom.room) {
            this._creeps = { time: Game.time, creeps: {} };
            this.memory.creeps = { time: Game.time, creeps: {} };
            this._creeps.creeps = _.indexBy(_.map(this.myRoom.room.find<Creep>(FIND_HOSTILE_CREEPS, { filter: (c: Creep) => c.owner.username != 'Source Keeper' }), creep => new CreepInfo(creep.id, this)), x => x.id);
        }
    }

    constructor(public myRoom: MyRoomInterface) {
        if (this.myRoom.room)
            this.refreshCreeps();
    }
}