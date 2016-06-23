import {SourceInfo} from "../../sources/sourceInfo";
import {SpawnRoomHandler} from "../../rooms/spawnRoomHandler";

export class SpawnFiller {

    creep: Creep;
    spawnRoomHandler: SpawnRoomHandler;

    constructor(creep: Creep, spawnRoomHandler: SpawnRoomHandler) {
        this.creep = creep;
        this.spawnRoomHandler = spawnRoomHandler;
    }

    refill() {
        let mainContainer = this.spawnRoomHandler.mainContainer;
        if (mainContainer != null) {
            if (mainContainer.transfer(this.creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(mainContainer);
        }
    }

    public tick() {

        if (this.creep.carry.energy == 0) {
            this.refill();
        }

        else {

            //var targets: Array<Spawn | Extension> = this.spawnRoomHandler.room.find<Spawn | Extension>(FIND_MY_STRUCTURES, {
            //    filter: (s: Spawn | Extension) => s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_EXTENSION && s.energy < s.energyCapacity);

            //if (targets.length == 0)
            //    this.refill();
            //else {
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
