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
        //this.creep.say('test');
        let container: Container | Link = null;
        this.mainRoom.sources[this.sourceId].memory.linkId && (container = Game.getObjectById<Link>(this.mainRoom.sources[this.sourceId].memory.linkId));
        if (container == null){
            if (this.mainRoom.creepManagers.harvestingManager.sourceCarrierCreeps.length == 0 || this.mainRoom.creepManagers.spawnFillManager.creeps.length == 0)
                return false;
            this.mainRoom.sources[this.sourceId].memory.containerId && (container = Game.getObjectById<Container>(this.mainRoom.sources[this.sourceId].memory.containerId));
        }
        if (container) {
            let result = this.creep.transfer(container, RESOURCE_ENERGY);
            if (result == ERR_NOT_IN_RANGE && !dontMove)
                this.creep.moveTo(container);
            return true;
        }

        return false;
    }

    dropOff() {
        if (!this.sourceContainerDropOff()) {
            let dropOffContainer: Container | Storage | Spawn = this.mainRoom.mainContainer;

            if (dropOffContainer == null || this.mainRoom.creepManagers.spawnFillManager.creeps.length == 0) {
                //this.creep.say('test');
                let spawns = this.mainRoom.room.find<Spawn>(FIND_MY_SPAWNS, { filter: (x: Spawn) => x.energy < x.energyCapacity });
                for (var spawnName in spawns) {
                    dropOffContainer = spawns[spawnName];
                }
            }

            if (dropOffContainer) {
                if (this.creep.transfer(dropOffContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(dropOffContainer);
            }
            else if (this.memory.doConstructions) {
                let nearestConstructionSite = this.creep.pos.findClosestByRange<ConstructionSite>(FIND_CONSTRUCTION_SITES);
                if (this.creep.build(nearestConstructionSite) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(nearestConstructionSite);
            }
        }
    }

    public tick() {
        this.memory = <HarvesterMemory>this.creep.memory;

        if (!this.mainRoom.sources[this.sourceId])
            return;

        if (this.memory.state == null) {
            if (this.creep.carry.energy <= this.creep.carryCapacity)
                this.memory.state = 'harvesting';
            else
                this.memory.state = 'delivering';
        }

        if (this.memory.state == 'harvesting' && this.creep.carry.energy == this.creep.carryCapacity)
            this.memory.state = 'delivering';
        else if (this.memory.state == 'delivering' && this.creep.carry.energy == 0)
            this.memory.state = 'harvesting';

        if (this.memory.state == 'harvesting') {
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