/// <reference path="../myCreep.ts" />

class Repairer extends MyCreep {

    public get memory(): RepairerMemory { return this.creep.memory; }


    constructor(public creep: Creep, public mainRoom: MainRoom) {
        super(creep);
        this.memory.autoFlee = true;
    }

    getEmergencyTarget() {
        let myRoom = Colony.getRoom(this.creep.room.name);
        if (myRoom)
            var target = _.sortBy(_.filter(myRoom.repairStructures, RepairManager.emergencyTargetDelegate), x => (x.pos.x - this.creep.pos.x) ** 2 + (x.pos.y - this.creep.pos.y) ** 2)[0];
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

    public myTick() {
        let myRoom = Colony.getRoom(this.creep.room.name);
        if (this.creep.room.name == this.memory.roomName && (this.creep.pos.x == 0 || this.creep.pos.x == 49 || this.creep.pos.y == 0 || this.creep.pos.y == 49)) {
            if (this.creep.pos.x == 0)
                this.creep.move(RIGHT);
            else if (this.creep.pos.x == 49)
                this.creep.move(LEFT);
            else if (this.creep.pos.y == 0)
                this.creep.move(BOTTOM);
            else if (this.creep.pos.y == 49)
                this.creep.move(TOP);
        }
        else {

            if (this.memory.state == RepairerState.Repairing && this.creep.carry.energy == 0) {
                this.memory.state = RepairerState.Refilling;
                this.memory.fillupContainerId = null;
                this.memory.targetId = null;
            }
            else if (this.memory.state == RepairerState.Refilling && this.creep.carry.energy == this.creep.carryCapacity)
                this.memory.state = RepairerState.Repairing;



            if (this.memory.state == RepairerState.Repairing) {
                if (this.creep.room.name != this.memory.roomName) {
                    this.creep.moveTo(new RoomPosition(25, 25, this.memory.roomName));
                }

                if (this.creep.room.name == this.memory.roomName && this.memory.targetId == null) {
                    let target = this.getEmergencyTarget();

                    if (target) {
                        this.memory.targetId = target.id;
                        this.memory.isEmergency = true;
                    }
                    else {
                        target = _.sortBy(_.filter(myRoom.repairStructures, RepairManager.targetDelegate), x => (x.pos.x - this.creep.pos.x) ** 2 + (x.pos.y - this.creep.pos.y) ** 2)[0];
                        //target = this.creep.pos.findClosestByRange<Structure>(FIND_STRUCTURES, { filter: RepairManager.targetDelegate });
                        if (target) {
                            this.memory.targetId = target.id;
                            this.memory.isEmergency = false;
                        }
                        else {
                            //target = this.creep.pos.findClosestByRange<Structure>(FIND_STRUCTURES, { filter: (x: Structure) => !RepairManager.forceStopRepairDelegate(x) && x.hits < x.hitsMax });
                            target = _.sortBy(_.filter(myRoom.repairStructures, s => !RepairManager.forceStopRepairDelegate(s) && (s.structureType == STRUCTURE_WALL || s.structureType == STRUCTURE_RAMPART)), x => x.hits)[0];
                            //target = _.sortBy(this.creep.room.find<Structure>(FIND_STRUCTURES, { filter: (x: Structure) => !RepairManager.forceStopRepairDelegate(x) && (x.structureType == STRUCTURE_WALL || x.structureType == STRUCTURE_RAMPART) }), x => x.hits)[0];
                            if (target) {
                                this.memory.targetId = target.id;
                                this.memory.isEmergency = false;
                            }
                            else {
                                target = _.sortBy(myRoom.repairStructures, x => (x.pos.x - this.creep.pos.x) ** 2 + (x.pos.y - this.creep.pos.y) ** 2)[0];
                                //target = this.creep.pos.findClosestByPath<Structure>(FIND_STRUCTURES, { filter: (x: Structure) => x.hits < x.hitsMax });
                                if (target) {
                                    this.memory.targetId = target.id;
                                    this.memory.isEmergency = false;
                                }
                            }
                        }
                    }
                }
                if (this.memory.targetId != null) {
                    let structure = Game.getObjectById<Structure>(this.memory.targetId);
                    if (structure == null) {
                        this.memory.targetId = null;
                    }
                    else {
                        if (!this.creep.pos.isNearTo(structure))
                            this.creep.moveTo(structure);
                        this.creep.repair(structure);

                        if (this.memory.isEmergency && RepairManager.emergencyStopDelegate(structure))
                            this.memory.isEmergency = false;

                        if (RepairManager.forceStopRepairDelegate(structure) || this.memory.isEmergency == false && this.getEmergencyTarget() != null)
                            this.memory.targetId = null;
                    }
                }
            }
            else {
                if (this.memory.fillupContainerId == null) {
                    let container = null;

                    container = this.mainRoom.mainContainer;

                    if (container != null) {
                        this.memory.fillupContainerId = container.id;
                    }
                }

                let container = Game.getObjectById<Container | Storage>(this.memory.fillupContainerId);

                if (container == null)
                    this.memory.fillupContainerId = null;
                else if (container.store.energy > 0) {
                    if (this.creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(container);
                }

            }

        }
    }

}
