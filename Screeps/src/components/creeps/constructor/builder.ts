/// <reference path="../myCreep.ts" />

class Builder extends MyCreep {
    public get memory(): ConstructorMemory { return this.creep.memory; }
    target: ConstructionSite;
    targetPosition: RoomPosition;



    constructor(public creep: Creep, public mainRoom: MainRoomInterface) {
        super(creep);
        this.memory.autoFlee = true;

        this.target = Game.getObjectById<ConstructionSite>(this.memory.targetId);
        if (this.target != null) {
            this.targetPosition = this.target.pos;
            this.memory.targetPosition = this.targetPosition;
        }
        else if (this.creep.memory.targetPosition != null) {
            this.targetPosition = new RoomPosition(this.memory.targetPosition.x, this.memory.targetPosition.y, this.memory.targetPosition.roomName);
            if (Game.rooms[this.targetPosition.roomName] != null) {
                this.targetPosition = null;
                this.target = null;
                this.memory.targetId = null;
                this.memory.targetPosition = null;
            }
        }

    }

    construct() {

        if (this.target != null) {
            if (this.creep.pos.x == 0 || this.creep.pos.x == 49 || this.creep.pos.y == 0 || this.creep.pos.y == 49)
                this.creep.moveTo(this.target);
            else {

                let result = this.creep.build(this.target);
                if (result == ERR_RCL_NOT_ENOUGH)
                    this.target.remove();
                else if (result == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(this.target);
            }
        }
        else {
            this.creep.moveTo(this.targetPosition);
        }
    }

    upgrade() {
        if (this.mainRoom.room.controller.level == 8) {
            if (this.mainRoom.spawns[0].recycleCreep(this.creep) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.mainRoom.spawns[0]);
        }
        else {
            if (this.creep.upgradeController(this.mainRoom.room.controller) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.mainRoom.room.controller);
        }
    }

    public myTick() {
        if (this.creep.carry.energy > 0) {
            if (this.targetPosition != null && this.mainRoom.room.controller.ticksToDowngrade >= 1000)
                this.construct();
            else
                this.upgrade();
        }
        else {
            this.memory.targetId = null;
            this.memory.targetPosition = null;
            if (this.mainRoom == null)
                return;
            var mainContainer: Storage | Container;

            if (Game.cpu.bucket > 5000)
                mainContainer = this.creep.pos.findClosestByRange<Storage|Container>(FIND_STRUCTURES, { filter: (x: Container) => (x.structureType == STRUCTURE_CONTAINER || x.structureType == STRUCTURE_STORAGE) && x.store.energy >= this.creep.carryCapacity });

            if (mainContainer == null)
                mainContainer = this.mainRoom.mainContainer;
            if (mainContainer != null) {
                //this.creep.say('Main');
                if (!this.mainRoom.mainContainer || mainContainer.store.energy > this.mainRoom.maxSpawnEnergy  || this.mainRoom.mainContainer && mainContainer.id != this.mainRoom.mainContainer.id)
                    if (mainContainer.transfer(this.creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(mainContainer);
            }
            else {
                //this.creep.say('NoMain');
                if (this.mainRoom.spawnManager.isIdle) {
                    let spawn = this.mainRoom.room.find<Spawn>(FIND_MY_SPAWNS)[0];

                    if (spawn.transferEnergy(this.creep) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(spawn);
                }
            }
        }
    }

}