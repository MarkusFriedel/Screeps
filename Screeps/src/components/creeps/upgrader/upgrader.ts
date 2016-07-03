import {MainRoom} from "../../rooms/mainRoom";

export class Upgrader {

    creep: Creep;
    mainRoom: MainRoom;

    constructor(creep: Creep, mainRoom: MainRoom) {
        this.creep = creep;

        this.mainRoom = mainRoom;

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
            if (!this.mainRoom)
                return;

            let energy = this.creep.pos.findInRange<Resource>(FIND_DROPPED_RESOURCES, 4)[0];
            if (energy != null && this.creep.carry.energy < this.creep.carryCapacity) {
                if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(energy);
            }
            else {

                let link = _.map(_.filter(this.mainRoom.links, x => x.nearController == true), x => x.link)[0];

                if (link) {
                    if (link.transferEnergy(this.creep) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(link);
                }
                else {
                    var mainContainer = this.mainRoom.mainContainer;
                    if (mainContainer != null) {
                        if (mainContainer.store.energy > 200)
                            if (mainContainer.transfer(this.creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                                this.creep.moveTo(mainContainer);
                    }
                    else {
                        if (this.mainRoom.spawnManager.isIdle) {
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
    }

}