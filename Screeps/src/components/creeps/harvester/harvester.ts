import {SourceInfo} from "../../sources/sourceInfo";
import {SpawnRoomHandler} from "../../rooms/spawnRoomHandler";

export class Harvester {

    creep: Creep;
    sourceId: string;
    source: Source;
    sourcePosition: RoomPosition;
    spawnRoomHandler: SpawnRoomHandler;

    constructor(creep: Creep, spawnRoomHandler: SpawnRoomHandler) {
        this.creep = creep;

        this.sourceId = creep.memory.sourceId;
        this.spawnRoomHandler = spawnRoomHandler;
        
        this.source = Game.getObjectById<Source>(this.sourceId);

        if (this.source == null)
            this.sourcePosition = this.source.pos;
        else
            this.sourcePosition = new SourceInfo(this.sourceId).pos;
    }

    harvest() {
        if (this.source != null) {
            if (this.creep.harvest(this.source) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.source);
        }
        else {
            this.creep.moveTo(this.sourcePosition);
        }
    }

    public tick() {

        if (this.creep.carry.energy < this.creep.carryCapacity) {
            this.harvest();
        }
        else {
            let dropOffContainer:Container|Storage|Spawn = this.spawnRoomHandler.mainContainer;

            if (dropOffContainer == null || this.spawnRoomHandler.creepManagers.spawnFillManager.creeps.length==0) {
                for (var spawnName in Game.spawns) {
                    dropOffContainer = Game.spawns[spawnName];
                }
            }

            if (this.creep.transfer(dropOffContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(dropOffContainer);
        }
    }

}