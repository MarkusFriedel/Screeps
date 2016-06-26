import {MySource} from "../../sources/mySource";
import {MainRoom} from "../../rooms/mainRoom";

export class SourceCarrier {

    creep: Creep;
    mainRoom: MainRoom;
    memory: SourceCarrierMemory;
    mySource: MySource;
    sourceContainer: Container;

    constructor(creep: Creep, mainRoom: MainRoom) {
        this.creep = creep;
        this.mainRoom = mainRoom;
        this.memory = <SourceCarrierMemory>this.creep.memory;
        this.mySource = this.mainRoom.sources[this.memory.sourceId];

    }

    pickUp() {
        this.memory = <SourceCarrierMemory>this.creep.memory;
        if (this.mySource.pos.roomName != this.creep.room.name)
            this.creep.moveTo(this.mySource);
        else {
            this.sourceContainer = Game.getObjectById<Container>(this.mySource.memory.containerId);
            if (this.sourceContainer && this.sourceContainer.transfer(this.creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.sourceContainer);
        }
    }

    deliver() {
        if (this.creep.room.name == this.mainRoom.name) {
            let tower = this.creep.room.find<Tower>(FIND_STRUCTURES, { filter: (x: Tower) => x.structureType == STRUCTURE_TOWER && x.energy < x.energyCapacity * 0.7 });
            if (tower.length > 0) {
                if (this.creep.transfer(tower[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(tower[0]);
                return;
            }
        }

        let mainContainer = this.mainRoom.mainContainer;
        if (mainContainer != null) {
            if (this.creep.transfer(mainContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(mainContainer);
        }
    }

    public tick() {

        if (this.creep.carry.energy == 0)
            this.pickUp();
        else
            this.deliver();


    }
}
