import {MainRoom} from "../../rooms/mainRoom";

export class Constructor {

    creep: Creep;
    target: ConstructionSite;
    targetPosition: RoomPosition;
    mainRoom: MainRoom;
    memory: ConstructorMemory;

    constructor(creep: Creep, mainRoom: MainRoom) {
        this.creep = creep;
        this.memory = <ConstructorMemory>this.creep.memory;

        this.mainRoom = mainRoom;

        this.target = Game.getObjectById<ConstructionSite>(this.memory.targetId);
        if (this.target != null) {
            this.creep.memory.targetPosition = this.target.pos;
            this.targetPosition = this.target.pos;
            this.memory.targetPosition = this.targetPosition;
        }
        else if (this.creep.memory.targetId != null) {
            this.targetPosition = new RoomPosition(this.memory.targetPosition.x, this.memory.targetPosition.y, this.memory.targetPosition.roomName);
            if (Game.rooms[this.targetPosition.roomName] != null) {
                this.targetPosition = null;
                this.target = null;
                this.memory.targetId = null;
                this.memory.targetId = null;
                this.memory.targetPosition = null;
            }
        }

    }

    construct() {
        if (this.target != null) {
            if (this.creep.build(this.target) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.target);
        }
        else {
            this.creep.moveTo(this.targetPosition);
        }
    }

    upgrade() {
        if (this.creep.upgradeController(this.creep.room.controller) == ERR_NOT_IN_RANGE)
            this.creep.moveTo(this.creep.room.controller);
    }

    public tick() {
        this.memory = <ConstructorMemory>this.creep.memory;

        //this.creep.say('construct');

        if (this.creep.carry.energy > 0) {
            if (this.targetPosition != null)
                this.construct();
            else
                this.upgrade();
        }
        else {
            if (this.mainRoom == null)
                return;
            var mainContainer;

            mainContainer = this.creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: (x: Container) => (x.structureType == STRUCTURE_CONTAINER || x.structureType == STRUCTURE_STORAGE) && x.store.energy >= this.creep.carryCapacity });
            if (mainContainer == null)
                mainContainer = this.mainRoom.mainContainer;
            if (mainContainer != null) {
                if (mainContainer.store.energy > 100)
                    if (mainContainer.transfer(this.creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(mainContainer);
            }
            else {
                if (this.mainRoom.spawnManager.isIdle) {
                    let spawn = this.mainRoom.room.find<Spawn>(FIND_MY_SPAWNS)[0];

                    if (spawn.transferEnergy(this.creep) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(spawn);
                }
            }
        }
    }

}