/// <reference path="./bodyInfo.ts" />

class CreepInfo implements CreepInfoInterface {
    public get memory(): CreepInfoMemory {
        return this.accessMemory();
    }

    private accessMemory() {
        if (this.hostileScan.memory.creeps.creeps == null)
            this.hostileScan.memory.creeps.creeps = {};
        if (this.hostileScan.memory.creeps.creeps[this.id] == null) {
            let creep = Game.getObjectById<Creep>(this.id);
            if (creep)
                this.hostileScan.memory.creeps.creeps[this.id] = {
                    id: this.id,
                    body: creep.body,
                    hits: creep.hits,
                    hitsMax: creep.hitsMax,
                    my: creep.my,
                    owner: creep.owner ? creep.owner.username : null,
                    pos: creep.pos,
                    ticksToLive: creep.ticksToLive,
                };
        }

        return this.hostileScan.memory.creeps.creeps[this.id];
    }

    public get bodyParts() {
        return this.memory.body;
    }

    private _creep: {time: number, creep: Creep }
    public get creep() {
        if (this._creep == null || this._creep.time < Game.time)
            this._creep = { time: Game.time, creep: Game.getObjectById<Creep>(this.id) }
        return this._creep.creep;
    }

    private _bodyInfo: { time: number, bodyInfo: BodyInfo }
    public get bodyInfo() {
        if (this._bodyInfo == null || this._bodyInfo.time < Game.time)
            this._bodyInfo = { time: Game.time, bodyInfo: new BodyInfo(this.bodyParts) }
        return this._bodyInfo.bodyInfo;
    }

    public get hits() {
        return this.memory.hits;
    }
    public get hitsMax() {
        return this.memory.hitsMax;
    }
    public get my() {
        return this.memory.my;
    }
    public get owner() {
        return this.memory.owner;
    }

    private _roomPosition: { time: number, pos: RoomPosition } = null;
    public get pos() {
        if (this._roomPosition == null || this._roomPosition.time < Game.time)
            this._roomPosition = { time: Game.time, pos: RoomPos.fromObj(this.memory.pos) };
        return this._roomPosition.pos;
    }

    public get ticksToLive() {
        return this.memory.ticksToLive;
    }



    constructor(public id: string, public hostileScan: HostileScanInterface) {
        this.accessMemory();
    }
}