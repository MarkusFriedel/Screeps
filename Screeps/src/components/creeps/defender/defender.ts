import {MySource} from "../../sources/mySource";
import {MainRoom} from "../../rooms/mainRoom";

export class Defender {

    creep: Creep;
    mainRoom: MainRoom;
    memory: DefenderMemory;

    constructor(creep: Creep, mainRoom: MainRoom) {
        this.creep = creep;
        this.mainRoom = mainRoom;
        this.memory = <DefenderMemory>this.creep.memory;

    }

    public tick() {
        this.memory = <DefenderMemory>this.creep.memory;
        let closestHostileCreep = this.creep.pos.findClosestByPath<Creep>(FIND_HOSTILE_CREEPS);

        if (closestHostileCreep != null) {
            this.creep.moveTo(closestHostileCreep);
            this.creep.attack(closestHostileCreep);
            this.creep.rangedAttack(closestHostileCreep);
        }
        else {
            let otherRoom = _.filter(this.mainRoom.allRooms, (r) => r.name != this.creep.room.name && r.memory.hostiles && r.canHarvest)[0];
            if (otherRoom != null)
                this.creep.moveTo(new RoomPosition(25, 25, otherRoom.name));
            else {
                this.creep.moveTo(this.mainRoom.mainPosition);
            }
        }
    }
}
