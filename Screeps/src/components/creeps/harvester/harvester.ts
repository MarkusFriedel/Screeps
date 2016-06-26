import {MySource} from "../../sources/mySource";
import {MainRoom} from "../../rooms/mainRoom";
import {Colony}from "../../../colony/colony";

export class Harvester {

    creep: Creep;
    sourceId: string;
    source: Source;
    sourcePosition: RoomPosition;
    mainRoom: MainRoom;
    memory: HarvesterMemory;

    constructor(creep: Creep, mainRoom: MainRoom) {
        this.creep = creep;
        this.mainRoom = mainRoom;
        this.memory = <HarvesterMemory>creep.memory;

        this.loadFromMemory();

    }

    getSourcePosition() {
        this.source = Game.getObjectById<Source>(this.sourceId);

        if (this.source == null)
            this.sourcePosition = this.source.pos;
        else
            this.sourcePosition = this.mainRoom.sources[this.sourceId].pos;
    }

    harvest() {
        let source = Game.getObjectById<Source>(this.sourceId);
        if (source != null) {
            if (this.creep.harvest(source) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(source);
            this.sourceContainerDropOff(true);
        }
        else {
            this.creep.moveTo(this.sourcePosition);
        }
    }

    sourceContainerDropOff(dontMove: boolean = false) {
        let container: Container = null;
        try {
            this.mainRoom.sources[this.sourceId].memory.containerId && (container = Game.getObjectById<Container>(this.mainRoom.sources[this.sourceId].memory.containerId));
            if (container) {
                let result = this.creep.transfer(container, RESOURCE_ENERGY);
                if (result == ERR_NOT_IN_RANGE && !dontMove)
                    this.creep.moveTo(container);
                return true;
            }
        }
        catch (e) {
            this.creep.say(this.sourceId);
        }
        return false;
    }

    dropOff() {
        if (this.mainRoom.creepManagers.harvestingManager.sourceCarrierCreeps.length == 0 || !this.sourceContainerDropOff()) {
            let dropOffContainer: Container|Storage|Spawn = this.mainRoom.mainContainer;

            if (dropOffContainer == null || this.mainRoom.creepManagers.spawnFillManager.creeps.length == 0 || this.mainRoom.creepManagers.harvestingManager.sourceCarrierCreeps.length == 0) {
                for (var spawnName in Game.spawns) {
                    dropOffContainer = Game.spawns[spawnName];
                }
            }

            if (this.creep.transfer(dropOffContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(dropOffContainer);
        }
    }

    public tick() {
        this.memory = <HarvesterMemory>this.creep.memory;
        if (this.creep.carry.energy < this.creep.carryCapacity) {
            this.harvest();
        }
        else {
            this.dropOff();
        }
    }

    loadFromMemory() {
        this.sourceId = this.memory.sourceId;
        this.mainRoom = Colony.mainRooms[this.memory.mainRoomName];
    }

    saveToMemory() {
        this.memory.mainRoomName = this.mainRoom.name;
    }

}