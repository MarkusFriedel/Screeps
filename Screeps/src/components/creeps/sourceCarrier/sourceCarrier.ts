/// <reference path="../myCreep.ts" />
/// <reference path="../../../colony/colony.ts" />

class SourceCarrier extends MyCreep {
    public get memory(): SourceCarrierMemory { return this.creep.memory; }

    _source: { time: number, source: Source } = { time: 0, source: null };
    public get source(): Source {
        if (this._source.time < Game.time)
            this._source = {
                time: Game.time, source: Game.getObjectById<Source>(this.memory.sourceId)
            };
        return this._source.source;
    }

    _mySource: { time: number, mySource: MySourceInterface };
    public get mySource(): MySourceInterface {
        if (this._mySource==null ||  this._mySource.time < Game.time)
            this._mySource = {
                time: Game.time, mySource: this.mainRoom.sources[this.memory.sourceId]
            };
        return this._mySource.mySource;
    }

    private reassignMainRoom() {
        let mainRoom = _.filter(Colony.mainRooms, r => _.any(r.sources, s => s.id == this.memory.sourceId))[0];
        if (mainRoom) {
            this.memory.mainRoomName = mainRoom.name;
            this.mainRoom = mainRoom;
            this._mySource = null;
        }
    }

    public static staticTracer: Tracer;
    public tracer: Tracer;

    constructor(public creep: Creep, public mainRoom: MainRoomInterface) {
        super(creep);

        this.memory.autoFlee = true;

        if (SourceCarrier.staticTracer == null) {
            SourceCarrier.staticTracer = new Tracer('SourceCarrier');
            Colony.tracers.push(SourceCarrier.staticTracer);
        }
        this.tracer = SourceCarrier.staticTracer;
    }

    pickUpEnergy(): boolean {
        let resources = _.filter(Colony.getRoom(this.creep.room.name).resourceDrops, r => r.resourceType == RESOURCE_ENERGY);
        let energy = _.sortBy(_.filter(resources, r => r.pos.inRangeTo(this.creep.pos, 4)), r => r.pos.getRangeTo(this.creep.pos))[0];
        if (energy != null) {
            if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(energy);
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

        if (!this.mySource)
            this.reassignMainRoom();

        if (!this.mySource) {
            trace.stop();
            return;
        }

        if (this.memory.state == null || this.memory.state == SourceCarrierState.Deliver && this.creep.carry.energy == 0) {

            this.memory.path = PathFinder.search(this.creep.pos, { pos: this.mySource.pos, range: 6 }, { roomCallback: Colony.getTravelMatrix, plainCost: 2, swampCost: 3 });
            this.memory.path.path.unshift(this.creep.pos);
            this.memory.state = SourceCarrierState.Pickup;

        }
        else if (this.memory.state == SourceCarrierState.Pickup && _.sum(this.creep.carry) == this.creep.carryCapacity) {

            this.memory.path = PathFinder.search(this.creep.pos, { pos: this.mainRoom.energyDropOffStructure.pos, range: 3 }, { roomCallback: Colony.getTravelMatrix, plainCost: 2, swampCost: 10 });
            this.memory.path.path.unshift(this.creep.pos);
            this.memory.state = SourceCarrierState.Deliver;
        }

        if (this.memory.state == SourceCarrierState.Pickup) {
            if (!this.pickUpEnergy()) {
                if (this.memory.path.path.length > 2) {
                    this.moveByPath();
                }
                else if (this.creep.room.name != this.mySource.pos.roomName || !this.creep.pos.inRangeTo(this.mySource.pos, 2))
                        this.creep.moveTo(this.mySource.pos);

                //else {
                //    let harvesters = _.filter(this.mainRoom.creepManagers.harvestingManager.harvesterCreeps, c => c.memory.sourceId == this.mySource.id && c.memory.state==HarvesterState.Harvesting);
                //    if (harvesters.length>0 && !harvesters[0].pos.isNearTo(this.creep.pos))
                //        this.creep.moveTo(harvesters[0]);
                //}
            }
        }
        else if (this.memory.state == SourceCarrierState.Deliver) {
            if (!this.mainRoom) {
                trace.stop();
                return;
            }
            if (!this.mainRoom.mainContainer) {
                trace.stop();
                return;
            }
            if (this.memory.path.path.length > 2) {
                this.moveByPath();
            }
            else {
                if (this.creep.transfer(this.mainRoom.mainContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(this.mainRoom.mainContainer);
            }
        }

        trace.stop();

        //if (this.creep.carry.energy < this.creep.carryCapacity && !(this.creep.carry.energy > this.creep.carryCapacity / 2 && this.creep.room.name == this.mainRoom.name))
        //    this.pickUpNew();
        //else
        //    this.deliverNew();


    }
}
