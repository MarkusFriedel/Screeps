import {MySource} from "../../sources/mySource";
import {MainRoom} from "../../rooms/mainRoom";
import {RepairManager} from "../../rooms/repairManager";


export enum RepairerState {
    Refilling,
    Repairing
}

export class Repairer {

    public get memory(): RepairerMemory { return this.creep.memory; }


    constructor(public creep: Creep, public mainRoom: MainRoom) {

    }

    getEmergencyTarget() {
        return this.creep.pos.findClosestByRange<Structure>(FIND_STRUCTURES, { filter: RepairManager.emergencyTargetDelegate });
    }

    public tick() {
        if (this.creep.room.name == this.memory.roomName &&(this.creep.pos.x == 0 || this.creep.pos.x == 49 || this.creep.pos.y == 0 || this.creep.pos.y == 49))
            this.creep.moveTo(new RoomPosition(25,25,this.creep.room.name));

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
                    target = this.creep.pos.findClosestByRange<Structure>(FIND_STRUCTURES, { filter: RepairManager.targetDelegate });
                    if (target) {
                        this.memory.targetId = target.id;
                        this.memory.isEmergency = false;
                    }
                    else {
                        target = this.creep.pos.findClosestByRange<Structure>(FIND_STRUCTURES, { filter: (x:Structure) => !RepairManager.forceStopRepairDelegate(x) && x.hits<x.hitsMax });
                        if (target) {
                            this.memory.targetId = target.id;
                            this.memory.isEmergency = false;
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
                if (this.creep.room.name == this.mainRoom.name) {
                    container = <Container | Storage>this.mainRoom.mainContainer;
                }
                else {
                    container = this.creep.pos.findClosestByRange<Container | Storage>(FIND_STRUCTURES, { filter: (x: Structure) => x.structureType == STRUCTURE_CONTAINER || x.structureType == STRUCTURE_STORAGE });
                }

                if (container != null) {
                    this.memory.fillupContainerId = container.id;
                }
            }

            let container = Game.getObjectById<Container | Storage>(this.memory.fillupContainerId);

            if (container == null)
                this.memory.fillupContainerId = null;
            else if (container.store.energy > this.creep.carryCapacity) {
                if (container.transfer(this.creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(container);
            }

        }

    }

}
