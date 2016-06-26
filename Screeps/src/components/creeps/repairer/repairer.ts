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
        this.memory = <RepairerMemory>this.creep.memory;
        this.creep.say('REPAIR');
        if (this.creep.carry.energy == 0) {
            this.refill();
        }
        else {

            let repairTarget = null;
            this.memory.repairTarget && (repairTarget = Game.getObjectById(this.memory.repairTarget.id));

            if (repairTarget) {
                let result = this.creep.repair(repairTarget);
                this.creep.say(''+result);
                if (result == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(repairTarget);
            }
            else {
                if (this.memory.repairTarget && this.creep.room.name != this.memory.repairTarget.pos.roomName) {
                    this.creep.moveTo(new RoomPosition(this.memory.repairTarget.pos.x, this.memory.repairTarget.pos.y, this.memory.repairTarget.pos.roomName));
                }
            }
        }

    }
}
