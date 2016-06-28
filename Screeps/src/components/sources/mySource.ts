import {Config} from "./../../config/config";
import {MyRoom} from "../rooms/myRoom";
//import {ObjectWithMemory} from "../../objectWithMemory";


export class MySource {

    public get memory(): MySourceMemory {
        return this.accessMemory();
    }

    _room: { time: number, room: Room } = { time: 0, room: null };
    public get room(): Room {
        if (this._room.time < Game.time)
            this._room = {
                time: Game.time, room: Game.rooms[this.pos.roomName]
            };
        return this._room.room;
    }

    accessMemory() {
        if (this.myRoom.memory.sources == null)
            this.myRoom.memory.sources = {};
        if (this.myRoom.memory.sources[this.id] == null)
            this.myRoom.memory.sources[this.id] = {
                id:this.id,
                containerId: null,
                energyCapacity: null,
                harvestingSpots: null,
                keeper: null,
                lastScanTime: null,
                pos: null,
                mainContainerRoadBuiltTo: null,
                mainContainerPathLength: null,
                linkId:null
            }
        return this.myRoom.memory.sources[this.id];
    }

    id: string;
    pos: RoomPosition;

    constructor(id: string,public myRoom: MyRoom) {
        this.id = id;
        this.memory.id = id;        
        if (this.memory.lastScanTime == null)
            this.scan();
        if (this.memory.pos)
            this.pos = new RoomPosition(this.memory.pos.x, this.memory.pos.y, this.memory.pos.roomName);       
    }

    getHarvestingSpots(source) {
        var surroundingTerrain = source.room.lookForAtArea('terrain', source.pos.y - 1, source.pos.x - 1, source.pos.y + 1, source.pos.x + 1);

        let walls = 0;
        for (let y = source.pos.y - 1; y <= source.pos.y + 1; y++)
            for (let x = source.pos.x - 1; x <= source.pos.x + 1; x++) {
                let row = surroundingTerrain[y][x];
                if (_.some(row, (r) => r == 'wall'))
                    walls++;
            }

        return 9 - walls;
    }

    public findContainer() {
        let candidates = this.pos.findInRange<Container | Storage>(FIND_STRUCTURES, 4, {
            filter: (s: Structure) => s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE
        });
        if (candidates.length > 0)
            return candidates[0];
        else return null;
    }

    public findLink() {
        let candidates = this.pos.findInRange<Link>(FIND_MY_STRUCTURES, 4, {
            filter: (s: Structure) => s.structureType == STRUCTURE_LINK
        });
        if (candidates.length > 0)
            return candidates[0];
        else return null;
    }

   calculatePathLengthToMainContainer() {
        let mainContainer = null;
        this.myRoom && this.myRoom.mainRoom && (mainContainer = this.myRoom.mainRoom.mainContainer);

        let sourceContainer = null;
        this.memory.containerId && (sourceContainer = Game.getObjectById(this.memory.containerId));

        if (mainContainer == null || sourceContainer == null)
            return null;

        let path = PathFinder.search(mainContainer.pos, { pos: sourceContainer.pos, range: 2 });

        this.memory.mainContainerPathLength = path.path.length;
        return this.memory.mainContainerPathLength;
    }


    public scan() {
        let source = <Source>Game.getObjectById(this.id);
        if (source != null) {
            this.memory.lastScanTime = Game.time;


            this.memory.energyCapacity = source.energyCapacity;
            this.memory.pos = source.pos;
            this.pos = new RoomPosition(this.memory.pos.x, this.memory.pos.y, this.memory.pos.roomName);       
            this.memory.lastScanTime = Game.time;
            this.memory.keeper = source.pos.findInRange(FIND_STRUCTURES, 5, { filter: (s) => s.structureType == STRUCTURE_KEEPER_LAIR }).length > 0;

            this.memory.harvestingSpots = this.getHarvestingSpots(source);

            if (this.memory.mainContainerPathLength==null)
                this.calculatePathLengthToMainContainer();

            if (!Game.getObjectById(this.memory.containerId)) {
                let container = this.findContainer();
                if (container) {
                    this.memory.containerId = container.id;
                }
                else {
                    this.memory.containerId = null;
                }
            }

            if (!Game.getObjectById(this.memory.linkId)) {
                let link = this.findLink();
                if (link)
                    this.memory.linkId = link.id;
                else
                    this.memory.linkId = null;
            }

            return true;
        }
        return false;
    }

    public containerMissing() {
        if (this.room == null)
            return false;
        if (Game.getObjectById(this.memory.containerId) != null)
            return false;
        let container = this.findContainer();
        let link = this.findLink();

        if (container != null) {
            this.memory.containerId = container.id;
            return false;
        }
        if (link != null) {
            this.memory.linkId = link.id;
            return false;
        }

        this.memory.containerId = null;

        return this.pos.findInRange<ConstructionSite>(FIND_CONSTRUCTION_SITES, 4, {
            filter: (s: Structure) => s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE || s.structureType == STRUCTURE_LINK
        }).length == 0;



    }
}