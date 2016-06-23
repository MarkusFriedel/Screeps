import {Config} from "./../../config/config";

export interface SourceInfoInterface {
    id: string;
    roomName: string;
    energy: number;
    energyCapacity: number;
    lastScanTime: number;
    keeper: boolean;
    harvestingSpots: number;
}

export class SourceInfo implements SourceInfoInterface {

    id: string;
    roomName: string;
    energy: number;
    energyCapacity: number;
    lastScanTime: number;
    pos: RoomPosition;
    keeper: boolean;
    harvestingSpots: number;
    containerId: string;

    constructor(id: string) {
        
        this.id = id;
        let source = <Source>Game.getObjectById(id);
        if (source != null) {
            this.lastScanTime = Game.time;

            if (Memory['sources'] == null)
                Memory['sources'] = {};

            if (Memory['sources'][id] == null)
                Memory['sources'][id] = {};
            this.roomName = source.room.name;
            this.containerId = Memory['sources'][id].containerId;
            this.energy = source.energy;
            this.energyCapacity = source.energyCapacity;
            this.pos = source.pos;
            this.lastScanTime = Game.time;
            this.keeper = source.pos.findInRange(FIND_STRUCTURES, 5, { filter: (s) => s.structureType == STRUCTURE_KEEPER_LAIR }).length > 0;

            var surroundingTerrain = source.room.lookForAtArea('terrain', source.pos.y - 1, source.pos.x - 1, source.pos.y + 1, source.pos.x + 1);

            let walls = 0;
            for (let y = source.pos.y - 1; y <= source.pos.y + 1; y++)
                for (let x = source.pos.x - 1; x <= source.pos.x + 1; x++) {
                    let row = surroundingTerrain[y][x];
                    if (_.some(row, (r) => r == 'wall'))
                        walls++;
                }
                    
            this.harvestingSpots = 9 - walls;

            if (!Game.getObjectById(this.containerId)) {
                let container = this.findContainer();
                if (container) {
                    this.containerId = container.id;
                    Memory['sources'][id].containerId = this.containerId;
                }
                else {
                    this.containerId = null;
                    Memory['sources'][id].containerId = null;
                }
            }
            
            Memory['sources'][id] = this;
        }
        else {
            this.roomName = Memory['sources'][id].roomName;
            this.energy = Memory['sources'][id].energy;
            this.energyCapacity = Memory['sources'][id].energyCapacity;
            this.pos = new RoomPosition(Memory['sources'][id].pos.x, Memory['sources'][id].pos.y, Memory['sources'][id].pos.roomName);
            this.lastScanTime = Memory['sources'][id].lastScanTime;
            this.keeper = Memory['sources'][id].keeper;
            this.harvestingSpots = Memory['sources'][id].harvestingSpots;
            this.containerId = Memory['sources'][id].containerId;

            
        }
    }

    public findContainer() {
        let candidates = this.pos.findInRange<Container>(FIND_STRUCTURES, 4, {
            filter: (s: Structure) => s.structureType == STRUCTURE_CONTAINER
        });
        if (candidates.length > 0)
            return candidates[0];
        else return null;
    }

    public containerMissing() {
        if (Game.rooms[this.roomName] == null)
            return false;
        if (Game.getObjectById(this.containerId) != null)
            return false;
        let container = this.findContainer();

        if (container!=null) {
            this.containerId = container.id;
            Memory['sources'][this.id].containerId = this.containerId;
            return false;
        }
        this.containerId = null;
        Memory['sources'][this.id].containerId = null;

        return this.pos.findInRange<ConstructionSite>(FIND_CONSTRUCTION_SITES, 4, {
            filter: (s: Structure) => s.structureType == STRUCTURE_CONTAINER
        }).length==0;



    }

    getAssignedHarvesters() {
        return _.filter(Game.creeps, (c) => c.memory.role=='harvester' && c.memory.sourceId == this.id);
    }
}