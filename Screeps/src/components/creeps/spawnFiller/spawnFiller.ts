import {MySource} from "../../sources/mySource";
import {MainRoom} from "../../rooms/mainRoom";

export class SpawnFiller {

    creep: Creep;
    mainRoom: MainRoom;

    constructor(creep: Creep, mainRoom: MainRoom) {
        this.creep = creep;
        this.mainRoom = mainRoom;
    }

    refill() {
        if (!this.mainRoom)
            return;
        let mainContainer = this.mainRoom.mainContainer;
        if (mainContainer != null && mainContainer.store.energy>0) {
            if (mainContainer.transfer(this.creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(mainContainer);
        }
    }

    public tick() {

        if (this.creep.carry.energy == 0) {
            this.refill();
        }

        else {
            var target = this.creep.pos.findClosestByPath<Spawn | Extension>(FIND_MY_STRUCTURES, { filter: (s: Spawn | Extension) => (s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_EXTENSION) && s.energy < s.energyCapacity });

            if (target == null)
                this.refill();
            else {
                if (this.creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(target);
            }


        }
    }

}
