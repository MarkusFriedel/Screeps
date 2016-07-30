/// <reference path="../../../colony/colony.ts" />
/// <reference path="../myCreep.ts" />


class EnergyHarvester extends MyCreep {
    public get memory(): EnergyHarvesterMemory { return this.creep.memory; }

    _source: { time: number, source: Source } = { time: -1, source: null };
    public get source(): Source {
        if (this._source.time < Game.time)
            this._source = {
                time: Game.time, source: Game.getObjectById<Source>(this.memory.sourceId)
            };
        return this._source.source;
    }

    _mySource: { time: number, mySource: MySourceInterface };
    public get mySource(): MySourceInterface {
        if (this._mySource == null || this._mySource.time < Game.time)
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

        if (EnergyHarvester.staticTracer == null) {
            EnergyHarvester.staticTracer = new Tracer('Harvester');
            //Colony.tracers.push(EnergyHarvester.staticTracer);
        }
        this.tracer = EnergyHarvester.staticTracer;
    }


    //tryRepair(): boolean {
    //    let structures = Colony.getRoom(this.creep.room.name).repairStructures;
    //    let target = _.filter(structures, s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_WALL && (s.pos.x - this.creep.pos.x) ** 2 + (s.pos.y - this.creep.pos.y) ** 2 <= 9)[0];

    //    if (target) {
    //        this.creep.repair(target);
    //        return true;
    //    }
    //    return false;
    //}

    //tryBuild(): boolean {
    //    let target = _.filter(Game.constructionSites, c => c.pos.roomName == this.creep.room.name && (c.pos.x - this.creep.pos.x) ** 2 + (c.pos.y - this.creep.pos.y) ** 2 <= 9)[0];

    //    if (target) {
    //        this.creep.build(target);
    //        return true;
    //    }
    //    return false;
    //}

    healed: boolean = false;

    createHarvestPath() {
        this.memory.path = PathFinder.search(this.creep.pos, { pos: this.mySource.pos, range: 5 }, { roomCallback: Colony.getTravelMatrix, plainCost: 2, swampCost: 10 });
        this.memory.path.path.unshift(this.creep.pos);
    }

    public myTick() {
        let trace = this.tracer.start('tick()');

        this.healed = false;

        if (this.mySource == null)
            this.reassignMainRoom();

        if (!this.mySource) {
            trace.stop();
            return;
        }

        if (this.creep.getActiveBodyparts(HEAL) > 0 && this.creep.hits + this.creep.getActiveBodyparts(HEAL) * HEAL_POWER <= this.creep.hitsMax) {
            this.creep.heal(this.creep);
            this.healed = true;
        }
        //else if (this.creep.getActiveBodyparts(HEAL) > 0) {
        //    let surroundingCreep = this.creep.pos.findInRange<Creep>(FIND_MY_CREEPS, 1, { filter: (c: Creep) => this.creep.hits + this.creep.getActiveBodyparts(HEAL) * HEAL_POWER <= c.hitsMax })[0];
        //    if (surroundingCreep) {
        //        this.creep.heal(surroundingCreep);
        //        this.healed = true;
        //    }
        //}

        if (this.memory.state == null || this.memory.path == null || this.memory.state == EnergyHarvesterState.Delivering && this.creep.carry.energy == 0) {
            this.createHarvestPath();
            this.memory.state = EnergyHarvesterState.Harvesting;
        }
        else if (this.memory.state == EnergyHarvesterState.Harvesting && _.sum(this.creep.carry) == this.creep.carryCapacity && !this.mySource.link && this.mainRoom.harvestersShouldDeliver) {
            if (!this.mainRoom.energyDropOffStructure) {
                trace.stop();
                return;
            }

            this.memory.path = PathFinder.search(this.creep.pos, { pos: this.mainRoom.energyDropOffStructure.pos, range: 2 }, { roomCallback: Colony.getTravelMatrix, plainCost: 2, swampCost: 10 });


            this.memory.state = EnergyHarvesterState.Delivering;
        }

        if (this.memory.state == EnergyHarvesterState.Harvesting) {

            if (this.memory.path && this.memory.path.path.length > 2)
                this.moveByPath();
            else if (this.creep.room.name != this.mySource.myRoom.name) {
                this.createHarvestPath();
                this.moveByPath();
            }
            else if (!this.healed) {
                if (this.creep.harvest(this.mySource.source) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(this.mySource.source);

                if (this.creep.carry.energy > this.creep.carryCapacity - _.filter(this.creep.body, b => b.type == WORK).length * 2) {
                    if (this.mySource.link) {
                        if (this.creep.transfer(this.mySource.link, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                            this.creep.moveTo(this.mySource.link);
                    }
                    else if (this.mainRoom.harvestersShouldDeliver) {
                        if (this.memory.path == null) {
                            this.memory.path = PathFinder.search(this.creep.pos, { pos: this.mainRoom.mainContainer.pos, range: 5 }, { roomCallback: Colony.getTravelMatrix, plainCost: 2, swampCost: 10 });
                            this.memory.path.path.unshift(this.creep.pos);
                        }
                        if (this.memory.path && this.memory.path.path.length > 2)
                            this.moveByPath();
                        else if (this.creep.transfer(this.mainRoom.energyDropOffStructure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                            this.creep.moveTo(this.mainRoom.energyDropOffStructure);
                    }
                    //else {
                    //    //let carrier = _.filter(this.mainRoom.managers.energyHarvestingManager.sourceCarrierCreeps, c => c.memory.sourceId == this.mySource.id && c.memory.state == SourceCarrierState.Pickup && c.pos.isNearTo(this.creep.pos))[0];
                    //    //if (carrier)
                    //    //    this.creep.transfer(carrier, RESOURCE_ENERGY);
                    //    //else
                    //        //this.creep.drop(RESOURCE_ENERGY);
                    //}

                }
            }
            else if (this.healed && !this.mySource.pos.isNearTo(this.creep.pos))
                this.creep.moveTo(this.mySource.pos);
        }
        else if (this.memory.state == EnergyHarvesterState.Delivering) {
            if (this.memory.path && this.memory.path.path.length > 2)
                this.moveByPath();
            else {
                if (this.creep.transfer(this.mainRoom.energyDropOffStructure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(this.mainRoom.energyDropOffStructure);
            }
        }
        trace.stop();
    }

    //public myTick() {
    //    if (this.mySource == null)
    //        this.reassignMainRoom();

    //    if (!this.mySource)
    //        return;

    //    if (this.memory.state == null || this.memory.path==null || this.memory.state == HarvesterState.Delivering && this.creep.carry.energy == 0) {
    //        if (!this.mySource)
    //            return;
    //        this.memory.path = PathFinder.search(this.creep.pos, { pos: this.mySource.pos, range: 3 }, { roomCallback: Colony.getTravelMatrix, plainCost: 2, swampCost: 10 });
    //        this.memory.path.path.unshift(this.creep.pos);

    //        this.memory.state = HarvesterState.Harvesting;

    //    }
    //    else if (this.memory.state == HarvesterState.Harvesting && _.sum(this.creep.carry) == this.creep.carryCapacity) {
    //        if (!this.mySource.dropOffStructure)
    //            return;

    //        if (!this.creep.pos.isNearTo(this.mySource.dropOffStructure.pos)) {
    //            this.memory.path = PathFinder.search(this.creep.pos, { pos: this.mySource.dropOffStructure.pos, range: 5 }, { roomCallback: Colony.getTravelMatrix, plainCost: 2, swampCost: 10 });
    //            this.memory.path.path.unshift(this.creep.pos);
    //        }

    //        this.memory.state = HarvesterState.Delivering;
    //    }

    //    if (this.memory.state == HarvesterState.Harvesting) {
    //        if (this.mySource == null)
    //            return;
    //        if (this.creep.carry.energy < _.sum(this.creep.body, x => x.type == WORK ? 1 : 0) * REPAIR_COST * REPAIR_POWER || !this.tryRepair()) {
    //            if (this.creep.carry.energy < _.sum(this.creep.body, x => x.type == WORK ? 1 : 0) * BUILD_POWER || !this.tryBuild()) {
    //                if (this.memory.path.path.length > 2)
    //                    this.moveByPath();
    //                else {
    //                    if (this.creep.harvest(this.mySource.source) == ERR_NOT_IN_RANGE)
    //                        this.creep.moveTo(this.mySource.source);

    //                    if (this.creep.carry.energy >= this.creep.carryCapacity - _.filter(this.creep.body, b => b.type == WORK).length * 2 && this.mySource.dropOffStructure) {
    //                        this.creep.transfer(<Container>this.mySource.sourceDropOffContainer, RESOURCE_ENERGY);
    //                    }

    //                }
    //            }
    //        }
    //    }
    //    else if (this.memory.state == HarvesterState.Delivering) {
    //        if (this.mySource == null)
    //            return;
    //        if (this.memory.path.path.length > 2)
    //            this.moveByPath();
    //        else {
    //            if (this.creep.transfer(<Structure>this.mySource.dropOffStructure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
    //                this.creep.moveTo(this.mySource.dropOffStructure);
    //        }
    //    }
    //}
}