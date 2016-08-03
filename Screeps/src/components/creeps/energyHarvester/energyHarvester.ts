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


    constructor(public creep: Creep, public mainRoom: MainRoomInterface) {
        super(creep);

        this.memory.autoFlee = true;

        this.myTick = profiler.registerFN(this.myTick, 'EnergyHarvester.tick');
        this.construct = profiler.registerFN(this.construct, 'EnergyHarvester.construct');
        this.repair = profiler.registerFN(this.repair, 'EnergyHarvester.repair');
        this.harvest = profiler.registerFN(this.harvest, 'EnergyHarvester.harvest');
        this.deliver = profiler.registerFN(this.deliver, 'EnergyHarvester.deliver');

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
        this.memory.path = PathFinder.search(this.creep.pos, { pos: this.mySource.pos, range: 1 }, { roomCallback: Colony.getTravelMatrix, plainCost: 2, swampCost: 10, maxOps: 10000 });
        this.memory.path.path.unshift(this.creep.pos);
    }

    repair(): boolean {
        if (Game.time % 5 != 0)
            return;
        let repairPower = _.filter(this.creep.body, b => b.type == WORK).length * REPAIR_POWER;
        let repairCost = REPAIR_POWER * REPAIR_COST;
        if (this.mySource.container && RepairManager.emergencyTargetDelegate(this.mySource.container) && this.creep.carry.energy >= repairCost && this.mySource.container.hits < this.mySource.container.hitsMax - repairPower) {
            if (this.creep.repair(this.mySource.container) == OK) {
                let container = Game.getObjectById<Container>(this.mySource.container.id);
                if (container && this.myRoom.repairStructures[container.id]) {
                    if (container.hits == container.hitsMax)
                        delete this.myRoom.repairStructures[container.id];
                    else
                        this.myRoom.repairStructures[container.id].hits = container.hits;

                }
            }
            //this.creep.say('Repair');
            return true;
        }
        return false;
    }

    construct(): boolean {
        if (this.mySource.container || this.mySource.link || this.mySource.hasKeeper)
            return false;
        else if (this.creep.carry.energy >= _.filter(this.creep.body, b => b.type == WORK).length * BUILD_POWER) {
            let construction = this.mySource.pos.findInRange<ConstructionSite>(FIND_CONSTRUCTION_SITES, 1)[0];
            if (construction) {
                this.creep.build(construction);
                //this.creep.say('Build');
                return true;
            }
            else {
                this.creep.pos.createConstructionSite(STRUCTURE_CONTAINER);
            }
        }
        return false;
    }

    private harvest() {
        if (this.memory.path && this.memory.path.path.length > 2) {
            //this.creep.say('Path');
            this.moveByPath();
        }
        else if (this.creep.room.name != this.mySource.myRoom.name) {
            this.createHarvestPath();
            if (this.memory.path.path.length <= 2)
                this.creep.moveTo(this.mySource.pos);
            else
                this.moveByPath();
            //this.creep.say('Travel');
        }
        else if (!this.creep.pos.isNearTo(this.mySource.pos)) {
            if (this.mySource.container && !this.creep.pos.isEqualTo(this.mySource.container.pos) && !this.mySource.container.pos.isEqualTo(this.creep.pos) && this.mySource.container.pos.lookFor(LOOK_CREEPS).length == 0) {
                this.creep.moveTo(this.mySource.container);
            }
            else this.creep.moveTo(this.mySource.pos);
            //this.creep.say('MoveIn');
        }
        else if (!this.healed && !this.repair() && !this.construct()) {
            if (this.mySource.container && !this.creep.pos.isEqualTo(this.mySource.container.pos) && this.mySource.container.pos.lookFor(LOOK_CREEPS).length == 0)
                this.creep.moveTo(this.mySource.container);

            if (this.creep.harvest(this.mySource.source) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.mySource.source);
            //this.creep.say('Harvest');

            if (this.creep.carry.energy > this.creep.carryCapacity - _.filter(this.creep.body, b => b.type == WORK).length * 2) {
                if (this.mySource.link) {
                    //this.creep.say('Link');
                    if (this.creep.transfer(this.mySource.link, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(this.mySource.link);

                }
                else if (this.mainRoom.harvestersShouldDeliver) {
                    //this.creep.say('Deliver');
                    if (this.memory.path == null) {
                        this.memory.path = PathFinder.search(this.creep.pos, { pos: this.mainRoom.mainContainer.pos, range: 5 }, { roomCallback: Colony.getTravelMatrix, plainCost: 2, swampCost: 10 });
                        this.memory.path.path.unshift(this.creep.pos);
                    }
                    if (this.memory.path && this.memory.path.path.length > 2)
                        this.moveByPath();
                    else if (this.creep.transfer(this.mainRoom.energyDropOffStructure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(this.mainRoom.energyDropOffStructure);
                }

            }
        }
    }

    private deliver() {
        if (this.memory.path && this.memory.path.path.length > 2)
            this.moveByPath();
        else {
            if (this.creep.transfer(this.mainRoom.energyDropOffStructure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.mainRoom.energyDropOffStructure);
        }
    }

    public myTick() {
        //this.creep.say('Tick');
        this.healed = false;

        if (this.mySource == null) {
            //this.creep.say('Reassign');
            this.reassignMainRoom();
        }

        if (!this.mySource) {
            //this.creep.say('No Source');
            return;
        }

        if (_.filter(this.creep.body, b => b.type == HEAL).length > 0 && this.creep.hits + _.filter(this.creep.body, b => b.type == HEAL).length * HEAL_POWER <= this.creep.hitsMax) {
            this.creep.heal(this.creep);
            //this.creep.say('Heal');
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
                return;
            }

            this.memory.path = PathFinder.search(this.creep.pos, { pos: this.mainRoom.energyDropOffStructure.pos, range: 2 }, { roomCallback: Colony.getTravelMatrix, plainCost: 2, swampCost: 10 });


            this.memory.state = EnergyHarvesterState.Delivering;
        }

        if (this.memory.state == EnergyHarvesterState.Harvesting) {
            //this.creep.say('State 1');
            this.harvest();
        }
        else if (this.memory.state == EnergyHarvesterState.Delivering) {
            //this.creep.say('State 2');
            this.deliver();
        }
        else {
            //console.log('Nothing');
        }
    }

}