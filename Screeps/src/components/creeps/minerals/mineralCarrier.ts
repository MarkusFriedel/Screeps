/// <reference path="../myCreep.ts" />
class MineralCarrier extends MyCreep {
    public get memory(): MineralCarrierMemory { return this.creep.memory; }

    _mineral: { time: number, mineral: Mineral };
    public get mineral(): Mineral {
        if (this.mineral == null || this._mineral.time < Game.time)
            this._mineral = {
                time: Game.time, mineral: Game.getObjectById<Mineral>(this.memory.mineralId)
            };
        return this._mineral.mineral;
    }

    _myMineral: { time: number, myMineral: MyMineralInterface };
    public get myMineral(): MyMineralInterface {
        if (this._myMineral == null || this._myMineral.time < Game.time)
            this._myMineral = {
                time: Game.time, myMineral: this.mainRoom.minerals[this.memory.mineralId]
            };
        return this._myMineral.myMineral;
    }

    public static staticTracer: Tracer;
    public tracer: Tracer;

    constructor(public creep: Creep, public mainRoom: MainRoomInterface) {
        super(creep);
        this.memory.autoFlee = true;

        if (MineralCarrier.staticTracer == null) {
            MineralCarrier.staticTracer = new Tracer('MineralCarrier');
            Colony.tracers.push(MineralCarrier.staticTracer);
        }
        this.tracer = MineralCarrier.staticTracer;
    }

    pickUpMineral(): boolean {
        let resources = _.filter(Colony.getRoom(this.creep.room.name).resourceDrops, r => r.resourceType == this.myMineral.resource);
        let resource = _.filter(resources, r => ((r.pos.x - this.creep.pos.x) ** 2 + (r.pos.y - this.creep.pos.y) ** 2) <= 16)[0];
        if (resource != null) {
            if (this.creep.pickup(resource) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(resource);
            return true;
        }
        return false;
    }

    public myTick() {
        let trace = this.tracer.start('tick()');
        if (this.creep.spawning) {
            trace.stop();
            return;
        }

        if (!this.myMineral) {
            this.creep.say('NoMineral');
            trace.stop();
            return;
        }

        if (this.memory.state == null || this.memory.state == MineralCarrierState.Deliver && (this.creep.carry[this.myMineral.resource]==null ||  this.creep.carry[this.myMineral.resource] == 0)) {

            this.memory.path = PathFinder.search(this.creep.pos, { pos: this.myMineral.pos, range: 6 }, { roomCallback: Colony.getTravelMatrix, plainCost: 1, swampCost: 1 });
            this.memory.path.path.unshift(this.creep.pos);
            this.memory.state = MineralCarrierState.Pickup;

        }
        else if (this.memory.state == MineralCarrierState.Pickup && _.sum(this.creep.carry) == this.creep.carryCapacity) {
            if (this.mainRoom.terminal == null) {
                this.creep.say('NoTerm');
                trace.stop();
                return;
            }

            this.memory.path = PathFinder.search(this.creep.pos, { pos: this.mainRoom.terminal.pos, range: 3 }, { roomCallback: Colony.getTravelMatrix, plainCost: 2, swampCost: 10 });
            this.memory.path.path.unshift(this.creep.pos);
            this.memory.state = MineralCarrierState.Deliver;
        }

        if (this.memory.state == MineralCarrierState.Pickup) {
            if (!this.pickUpMineral()) {
                if (this.memory.path.path.length > 2) {
                    this.moveByPath();
                }
                else {
                    if (this.creep.room.name != this.myMineral.pos.roomName || !this.creep.pos.inRangeTo(this.myMineral.pos, 2))
                        this.creep.moveTo(this.myMineral.pos);
                }
                //else {
                //    let harvesters = _.filter(this.mainRoom.creepManagers.MineralHarvestingManager.harvesterCreeps, c => c.memory.mineralId == this.myMineral.id && c.memory.state == HarvesterState.Harvesting);
                //    if (harvesters.length > 0 && !harvesters[0].pos.isNearTo(this.creep.pos))
                //        this.creep.moveTo(harvesters[0]);
                //}
            }
        }
        else if (this.memory.state == MineralCarrierState.Deliver) {
            if (!this.mainRoom || !this.mainRoom.terminal) {
                trace.stop();
                return;
            }
            if (this.memory.path.path.length > 2) {
                this.moveByPath();
            }
            else {
                if (this.creep.transfer(this.mainRoom.terminal, this.myMineral.resource) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(this.mainRoom.terminal);
            }
        }
        trace.stop();
    }
}