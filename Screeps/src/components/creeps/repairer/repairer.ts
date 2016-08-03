/// <reference path="../myCreep.ts" />

class Repairer extends MyCreep {

    public get memory(): RepairerMemory { return this.creep.memory; }

    private _repairCost: number;
    public get repairCost() {
        if (!this._repairCost)
            this.repairPower* REPAIR_COST;
        return this._repairCost;
    }

    private _repairPower: number;
    public get repairPower() {
        if (!this._repairPower)
            this._repairPower = this.creep.getActiveBodyparts(WORK) * REPAIR_POWER;
        return this._repairPower;
    }

    constructor(public creep: Creep, public mainRoom: MainRoom) {
        super(creep);
        this.memory.autoFlee = true;
       

        this.myTick = profiler.registerFN(this.myTick, 'Repairer.tick');
        this.pickUpEnergy = profiler.registerFN(this.pickUpEnergy, 'Repairer.pickupEnergy');
        this.getEmergencyTarget = profiler.registerFN(this.getEmergencyTarget, 'Repairer.getEmergencyTarget');
        this.getTarget = profiler.registerFN(this.getTarget, 'Repairer.getTarget');
    }

    getEmergencyTarget() {
        let myRoom = Colony.getRoom(this.creep.room.name);
        if (myRoom)
            var target = myRoom.emergencyRepairStructures[0];
        return target;
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




    private getTarget(myRoom: MyRoomInterface): RepairStructure {
        //if (this.memory.targetCheckTime != null && this.memory.targetCheckTime + 20 > Game.time) {
        //    return;
        //}
        //this.memory.targetCheckTime = Game.time;
        let target = _.filter(myRoom.repairStructures, RepairManager.targetDelegate)[0];
        if (target) {
            this.memory.targetId = target.id;
            this.memory.isEmergency = false;
        }
        else {
            target = _.sortBy(_.filter(myRoom.repairStructures, s => !RepairManager.forceStopRepairDelegate(s) && (s.structureType == STRUCTURE_WALL || s.structureType == STRUCTURE_RAMPART)), x => x.hits)[0];
            if (target) {
                this.memory.targetId = target.id;
                this.memory.isEmergency = false;
            }
            else {
                target = myRoom.repairStructures[0];
                if (target) {
                    this.memory.targetId = target.id;
                    this.memory.isEmergency = false;
                }
            }
        }
        return target;
    }

    public myTick() {
        let myRoom = Colony.getRoom(this.creep.room.name);

        if (this.creep.carry.energy >= this.repairCost) {
            let roadDummy = _.filter(this.myRoom.repairStructures, r => this.creep.pos.inRangeTo(r.pos, 3) && r.structureType == STRUCTURE_ROAD && r.hits < r.hitsMax)[0];
            if (roadDummy) {
                let road = Game.getObjectById<StructureRoad>(roadDummy.id);
                if (this.creep.hits < this.creep.hitsMax) { // Step away from keepers
                    let keepers = _.filter(this.myRoom.hostileScan.keepers, k => k.pos.inRangeTo(this.creep.pos, 3));
                    if (keepers.length > 0) {

                        let fleePath = PathFinder.search(this.creep.pos, _.map(keepers, k => {
                            return { pos: k.pos, range: 4 }
                        }), {
                                roomCallback: Colony.getCreepAvoidanceMatrix, flee: true, plainCost: 2, swampCost: 10
                            });
                        this.creep.say('StepAway');
                        let structure = Game.getObjectById<Structure>(this.memory.targetId);
                        if (structure == null) {
                            this.creep.repair(structure);
                        }
                        this.creep.move(this.creep.pos.getDirectionTo(fleePath.path[0]));

                        return;
                    }
                }

                this.creep.say('Repair' + this.creep.repair(<Structure>road));
                if (road.hitsMax - road.hits <= this.repairPower)
                    delete this.myRoom.repairStructures[road.id];
                return;
            }
        }



        if (this.repairPower == 0)
            this.recycle();

        if (this.memory.state == RepairerState.Repairing && this.creep.carry.energy == 0) {
            this.memory.state = RepairerState.Refilling;
            this.memory.fillupContainerId = null;
            this.memory.targetId = null;
        }
        else if (this.memory.state == RepairerState.Refilling && this.creep.carry.energy == this.creep.carryCapacity) {
            this.memory.state = RepairerState.Repairing;
        }


        if (this.memory.state == RepairerState.Repairing) {
            if (this.creep.hits < this.creep.hitsMax) { // Step away from keepers
                let keepers = _.filter(this.myRoom.hostileScan.keepers, k => k.pos.inRangeTo(this.creep.pos, 3));
                if (keepers.length > 0) {

                    let fleePath = PathFinder.search(this.creep.pos, _.map(keepers, k => {
                        return { pos: k.pos, range: 4 }
                    }), {
                            roomCallback: Colony.getCreepAvoidanceMatrix, flee: true, plainCost: 2, swampCost: 10
                        });

                    this.creep.say('StepAway');
                    this.creep.move(this.creep.pos.getDirectionTo(fleePath.path[0]));

                    return;
                }
            }

            if (this.creep.room.name != this.memory.roomName || this.isOnEdge) {
                if (this.memory.path == null || this.memory.path.path.length <= 2) {
                    this.memory.path = PathFinder.search(this.creep.pos, { pos: new RoomPosition(25, 25, this.memory.roomName), range: 20 }, { roomCallback: Colony.getTravelMatrix, plainCost: 2, swampCost: 10 });
                    this.memory.path.path.unshift(this.creep.pos);
                }
                this.moveByPath();
            }
            else {
                delete this.memory.path;
                if (this.creep.room.name == this.memory.roomName && this.memory.targetId == null) {
                    let target = this.getEmergencyTarget();

                    if (target) {
                        this.memory.targetId = target.id;
                        this.memory.isEmergency = true;
                    }
                    else {
                        target = this.getTarget(myRoom);
                        if (target) {
                            this.memory.targetId = target.id;
                            this.memory.isEmergency = false;
                        }
                    }
                }
                if (this.memory.targetId != null) {
                    let structure = Game.getObjectById<Structure>(this.memory.targetId);
                    if (structure == null) {
                        this.memory.targetId = null;
                    }
                    else {
                        if (!this.creep.pos.inRangeTo(structure.pos, 3))
                            this.moveTo({ pos: structure.pos, range: 3 });
                        this.creep.repair(structure);
                        if (structure.hitsMax - structure.hits <= this.repairPower)
                            delete this.myRoom.repairStructures[structure.id];

                        if (this.memory.isEmergency && RepairManager.emergencyStopDelegate(structure))
                            this.memory.isEmergency = false;

                        if (RepairManager.forceStopRepairDelegate(structure) || this.memory.isEmergency == false && this.getEmergencyTarget() != null)
                            this.memory.targetId = null;
                    }
                }
                //else
                //    this.memory.recycle = true;
            }
        }
        else if (this.memory.state == RepairerState.Refilling) {
            if (!this.memory.fillupContainerId) {
                let possbibleContainers = _.map(_.filter(this.myRoom.mySources, s => (s.hasKeeper == false || s.keeper.lair.ticksToSpawn > 100 || s.keeper.creep && s.keeper.creep.hits <= 100) && s.container), s => s.container);
                let container = _.sortBy(possbibleContainers, x => x.pos.getRangeTo(this.creep.pos))[0];
                if (container) {
                    this.memory.fillupContainerId = container.id;
                    this.memory.path = PathFinder.search(this.creep.pos, { pos: container.pos, range: 3 }, { roomCallback: Colony.getTravelMatrix, plainCost: 1, swampCost: 5 });
                    this.memory.path.path.unshift(this.creep.pos);
                }
            }
            if (this.memory.fillupContainerId) {
                if (this.memory.path && this.memory.path.path.length > 2)
                    this.moveByPath();
                else {
                    let container = Game.getObjectById<Container>(this.memory.fillupContainerId);
                    if (this.creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                        this.moveTo({ pos: container.pos, range: 3 });
                }

            } else if (this.creep.room.name != this.mainRoom.name || this.isOnEdge) {
                if (this.memory.path == null || this.memory.path.path.length <= 2) {
                    this.memory.path = PathFinder.search(this.creep.pos, { pos: this.mainRoom.mainContainer.pos, range: 3 }, { roomCallback: Colony.getTravelMatrix, plainCost: 1, swampCost: 5 });
                    this.memory.path.path.unshift(this.creep.pos);
                }
                this.moveByPath();
            }
            else {
                this.memory.path = null;
                if (this.creep.withdraw(this.mainRoom.mainContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.moveTo({ pos: this.mainRoom.mainContainer.pos, range: 3 });
            }
        }

    }

}
