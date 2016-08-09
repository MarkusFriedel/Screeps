/// <reference path="../../../colony/colony.ts" />
/// <reference path="../myCreep.ts" />


class EnergyHarvester extends MyCreep<EnergyHarvesterMemory> {

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


    constructor(public name: string, public mainRoom: MainRoomInterface) {
        super(name);

        this.autoFlee = true;
        if (myMemory['profilerActive']) {
            this.myTick = profiler.registerFN(this.myTick, 'EnergyHarvester.tick');
            this.construct = profiler.registerFN(this.construct, 'EnergyHarvester.construct');
            this.repair = profiler.registerFN(this.repair, 'EnergyHarvester.repair');
            this.harvest = profiler.registerFN(this.harvest, 'EnergyHarvester.harvest');
            this.tryMoveNearSource = profiler.registerFN(this.tryMoveNearSource, 'EnergyHarvester.tryMoveNearSource');
            this.tryMoveOnContainer = profiler.registerFN(this.tryMoveOnContainer, 'EnergyHarvester.tryMoveOnContainer');
            this.tryTransfer = profiler.registerFN(this.tryTransfer, 'EnergyHarvester.tryTransfer');
        }
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
            let pos = this.mySource.pos;
            //let constructions = <LookAtResultWithPos[]>this.mySource.room.lookForAtArea(LOOK_CONSTRUCTION_SITES, pos.y - 1, pos.x - 1, pos.y + 1, pos.x + 1, true);
            //console.log(JSON.stringify(constructions));
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

    private tryMoveOnContainer() {
        if (this.mySource.container && !this.creep.pos.isEqualTo(this.mySource.container.pos) && this.mySource.container.pos.lookFor<Creep>(LOOK_CREEPS).length == 0) {
            this.moveTo({ pos: this.mySource.container.pos, range: 1 }, {
                roomCallback: Colony.getCustomMatrix({ ignoreKeeperSourceId: this.mySource.id })
            });
            return true;
        }
        return false;
    }

    private tryMoveNearSource() {
        if (!this.creep.pos.isNearTo(this.mySource.pos)) {
            this.moveTo({ pos: this.mySource.pos, range: 1 }, {
                roomCallback: Colony.getCustomMatrix({ ignoreKeeperSourceId: this.mySource.id })
            });
            return true;
        }
        return false;
    }

    private tryTransfer() {
        if (this.mySource.link && this.creep.carry.energy > this.creep.carryCapacity - 2 * Body.getFromCreep(this.creep).energyHarvestingRate) {
            //this.creep.say('Link');
            if (this.creep.transfer(this.mySource.link, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.mySource.link);
            return true;

        }
        return false;
    }

    private harvest() {
        if (!this.healed && !this.repair() && !this.construct()) {

            this.tryMoveOnContainer() || this.tryMoveNearSource() || this.creep.harvest(this.mySource.source);

            this.tryTransfer();
        }
    }

    private deliver() {

        if (this.creep.transfer(this.mainRoom.energyDropOffStructure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
            this.moveTo({ pos: this.mainRoom.energyDropOffStructure.pos, range: 1 });
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

            this.memory.state = EnergyHarvesterState.Harvesting;
        }
        else if (this.memory.state == EnergyHarvesterState.Harvesting && _.sum(this.creep.carry) == this.creep.carryCapacity && !this.mySource.link && this.mainRoom.harvestersShouldDeliver) {
            if (!this.mainRoom.energyDropOffStructure) {
                return;
            }
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