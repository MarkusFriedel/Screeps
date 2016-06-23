import {SpawnRoomHandler} from "../../rooms/spawnRoomHandler";

export class Upgrader {

    creep: Creep;
    spawnRoomHandler: SpawnRoomHandler;

    constructor(creep: Creep, spawnRoomHandler: SpawnRoomHandler) {
        this.creep = creep;

        this.spawnRoomHandler = spawnRoomHandler;

    }

    upgrade() {
        if (this.creep.upgradeController(this.creep.room.controller) == ERR_NOT_IN_RANGE)
            this.creep.moveTo(this.creep.room.controller);
    }

    public tick() {

        if (this.creep.carry.energy > 0) {
            this.upgrade();
        }
        else {
            var mainContainer = this.spawnRoomHandler.mainContainer;
            if (mainContainer != null) {
                if (mainContainer.store.energy > 200)
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