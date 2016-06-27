import {MySource} from "../../sources/mySource";
import {MainRoom} from "../../rooms/mainRoom";

export class Repairer {

    creep: Creep;
    mainRoom: MainRoom;
    memory: RepairerMemory;

    constructor(creep: Creep, mainRoom: MainRoom) {
        this.creep = creep;
        this.mainRoom = mainRoom;
        this.memory = <RepairerMemory>this.creep.memory;

    }

    refill() {
        let container = this.mainRoom.mainContainer;
        if (container && container.transfer(this.creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
            this.creep.moveTo(container);
    }

    public tick() {
        //this.creep.say('repair');
        this.memory = <RepairerMemory>this.creep.memory;
        if (this.creep.carry.energy == 0) {
            this.refill();
        }
        else {

            let repairTarget = null;
            this.memory.repairTarget && (repairTarget = Game.getObjectById(this.memory.repairTarget.id));

            if (repairTarget) {
                let result = this.creep.repair(repairTarget);
                if (result == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(repairTarget);
            }
            else if (this.memory.repairTarget && this.creep.room.name != this.memory.repairTarget.pos.roomName) {
                this.creep.moveTo(new RoomPosition(this.memory.repairTarget.pos.x, this.memory.repairTarget.pos.y, this.memory.repairTarget.pos.roomName));
            }
            else {
                repairTarget = this.creep.pos.findClosestByRange<Structure>(FIND_STRUCTURES, {
                    filter: (x: Structure) => x.hits < x.hitsMax
                });
                if (repairTarget && this.creep.repair(repairTarget) == ERR_NOT_FOUND)
                    this.creep.moveTo(repairTarget);
            }
        }

    }

}
