import {SpawnRoomHandler} from "../../rooms/spawnRoomHandler";

export class Constructor {

    creep: Creep;
    targetId: string;
    target: ConstructionSite;
    targetPosition: RoomPosition;
    spawnRoomHandler: SpawnRoomHandler;

    constructor(creep: Creep, spawnRoomHandler: SpawnRoomHandler) {
        this.creep = creep;

        this.targetId = creep.memory.targetId;
        this.spawnRoomHandler = spawnRoomHandler;

        this.target = Game.getObjectById<ConstructionSite>(this.targetId);
        if (this.target != null) {
            this.creep.memory.targetPosition = this.target.pos;
            this.targetPosition = this.target.pos;
        }
        else if (this.creep.memory.targetId != null) {
            this.targetPosition = new RoomPosition(creep.memory.targetPosition.x, creep.memory.targetPosition.y, creep.memory.targetPosition.roomName);
            if (Game.rooms[this.targetPosition.roomName] != null) {
                this.targetPosition = null;
                this.target = null;
                this.targetId = null;
                this.creep.memory.targetId = null;
                this.creep.memory.targetPosition = null;
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

        if (this.creep.carry.energy > 0) {
            if (this.targetPosition != null)
                this.construct();
            else
                this.upgrade();
        }
        else {
            var mainContainer = this.spawnRoomHandler.mainContainer;
            if (mainContainer != null) {
                if (mainContainer.store.energy > 100)
                    if (mainContainer.transfer(this.creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(mainContainer);
            }
            else {
                if (this.spawnRoomHandler.spawnManager.isIdle) {
                    for (var spawnName in Game.spawns) {
                        var spawn = Game.spawns[spawnName];
                    }

                    if (spawn.transferEnergy(this.creep) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(spawn);
                }
            }
        }
    }

}