import {Config} from "./../../config/config";
import {MyRoom} from "../rooms/myRoom";
import {MainRoom} from "../rooms/mainRoom";
import {MySourceMemory} from "./mySourceMemory";
import {RoomPos} from "../../helpers";
import {Tracer} from "../../tracer";
import {Colony} from "../../colony/colony";
//import {ObjectWithMemory} from "../../objectWithMemory";


export class MySource {

    private get memory(): MySourceMemory {
        return this.accessMemory();
    }

    private memoryInitialized = false;
    public tracer: Tracer;

    private accessMemory() {
        if (this.myRoom.memory.sources == null)
            this.myRoom.memory.sources = {};
        if (this.myRoom.memory.sources[this.id] == null) {
            let mem = new MySourceMemory();
            mem.id = this.id;
            this.myRoom.memory.sources[this.id] = mem;
            mem.pos = this.source.pos;
        }
        this.memoryInitialized = true;
        return this.myRoom.memory.sources[this.id];
    }

    private _room: { time: number, room: Room } = { time: -1, room: null };
    public get room(): Room {
        let trace = this.tracer.start('Property room');
        if (this._room.time < Game.time)
            this._room = {
                time: Game.time, room: Game.rooms[this.pos.roomName]
            };
        trace.stop();
        return this._room.room;

    }

    private _source: { time: number, source: Source } = { time: -1, source: null }
    public get source(): Source {
        let trace = this.tracer.start('Property source');
        if (this._source.time < Game.time)
            this._source = { time: Game.time, source: Game.getObjectById<Source>(this.id) }
        trace.stop();
        return this._source.source;
    }

    private _sourceDropOffContainer: { time: number, sourceDropOffContainer: Structure } = { time: -1, sourceDropOffContainer: null }
    public get sourceDropOffContainer(): { id: string, pos: RoomPosition } {
        let trace = this.tracer.start('Property sourceDropOffContainer');
        if (this._sourceDropOffContainer.time == Game.time)
            return this._sourceDropOffContainer.sourceDropOffContainer;

        if (this.source && (!this.memory.sourceDropOffContainer || (this.memory.sourceDropOffContainer.time + 50) < Game.time)) {
            let structure = this.getSourceDropOffContainer();
            this._sourceDropOffContainer = { time: Game.time, sourceDropOffContainer: structure };
            this.memory.sourceDropOffContainer = { time: Game.time, value: structure ? { id: structure.id, pos: structure ? structure.pos : null } : null }
            trace.stop();
            return structure;
        }
        else {
            let structure = null;
            if (this.memory.sourceDropOffContainer.value)
                structure = Game.getObjectById<Structure>(this.memory.sourceDropOffContainer.value.id);
            trace.stop();
            if (structure == null)
                structure = this.memory.sourceDropOffContainer.value

            this._sourceDropOffContainer = { time: Game.time, sourceDropOffContainer: structure };
            return structure ? structure : null;
        }


    }
    private _dropOffStructre: { time: number, dropOffStructure: Structure } = { time: -1, dropOffStructure: null }
    public get dropOffStructure(): { id: string, pos: RoomPosition } {
        let trace = this.tracer.start('Property dropOffStructure');
        if (this._dropOffStructre.time == Game.time)
            return this._dropOffStructre.dropOffStructure;

        if (this.source && (!this.memory.dropOffStructure || this.memory.dropOffStructure.time + 50 < Game.time)) {
            let structure = this.getDropOffStructure();
            this.memory.dropOffStructure = { time: Game.time, value: structure ? { id: structure.id, pos: structure.pos } : null }
            trace.stop();
            return structure;
        }
        else {
            let structure = Game.getObjectById<Structure>(this.memory.dropOffStructure.value.id);
            trace.stop();
            this._dropOffStructre = { time: Game.time, dropOffStructure: structure };
            return structure ? structure : (this.memory.dropOffStructure ? { id: this.memory.dropOffStructure.value.id, pos: RoomPos.fromObj(this.memory.dropOffStructure.value.pos) } : null);
        }
    }

    private _nearByConstructionSite: { time: number, constructionSite: ConstructionSite } = { time: -1, constructionSite: null };
    public get nearByConstructionSite(): ConstructionSite {
        let trace = this.tracer.start('Property nearByConstruction');
        if (this._nearByConstructionSite.time + 10 < Game.time) {
            this._nearByConstructionSite = {
                time: Game.time, constructionSite: _.filter(RoomPos.fromObj(this.memory.pos).findInRange<ConstructionSite>(FIND_CONSTRUCTION_SITES, 4))[0]
            };
        }
        trace.stop();
        return this._nearByConstructionSite.constructionSite;
    }

    public get pos(): RoomPosition {
        let trace = this.tracer.start('Property pos');
        trace.stop();
        return this.source != null ? this.source.pos : RoomPos.fromObj(this.memory.pos);
    }

    public get maxHarvestingSpots(): number {
        let trace = this.tracer.start('Property maxHarvestingSpots');
        if (this.memory.harvestingSpots != null || this.source == null) {
            trace.stop();
            return this.memory.harvestingSpots;
        }
        else {
            let pos = this.source.pos;
            trace.stop();
            return _.filter((<LookAtResultWithPos[]>this.source.room.lookForAtArea(LOOK_TERRAIN, pos.y - 1, pos.x - 1, pos.y + 1, pos.x + 1, true)), x => x.terrain == 'swamp' || x.terrain == 'plain').length;
        }
    }

    public get keeper(): boolean {
        let trace = this.tracer.start('Property keeper');
        if (this.memory.keeper != null) {
            trace.stop();
            return this.memory.keeper;
        }
        else {
            this.memory.keeper = this.source.pos.findInRange(FIND_STRUCTURES, 5, { filter: (s) => s.structureType == STRUCTURE_KEEPER_LAIR }).length > 0;
            trace.stop();
            return this.memory.keeper;
        }
    }

    public get roadBuiltToMainContainer() {
        return this.memory.mainContainerRoadBuiltTo;
    }
    public set roadBuiltToMainContainer(value: string) {
        this.memory.mainContainerRoadBuiltTo = value;
    }

    public get pathLengthToMainContainer() {
        let trace = this.tracer.start('Property pathLengthToMainContainer');
        if (this.memory.mainContainerPathLength != null || this.source == null) {
            trace.stop();
            return this.memory.mainContainerPathLength;
        }
        else {
            let pathLength = PathFinder.search(this.myRoom.mainRoom.spawns[0].pos, { pos: this.source.pos, range: 1 }).path.length;
            this.memory.mainContainerPathLength = pathLength;
            trace.stop();
            return pathLength;
        }
    }

    public get requiresCarrier() {
        //console.log('Requires Carrier: sourceDropOff: ' + ((this.sourceDropOffContainer) ? 'true' : 'false'));
        //if (this.room)
        //    console.log('Requires Carrier: getSourceDropOff: ' + (this.getSourceDropOffContainer() ? 'true' : 'false'));
        //console.log('Requires Carrier: mainContainer: ' + (this.myRoom.mainRoom.mainContainer ? 'true' : 'false'));
        //console.log('Requires Carrier: hasLink: ' + (this.hasLink ? 'true' : 'false'));
        return this.sourceDropOffContainer != null && this.myRoom.mainRoom.mainContainer != null && !this.hasLink;
    }


    public get energyCapacity() {
        let trace = this.tracer.start('Property energyCapacity');
        if (this.source)
            this.memory.energyCapacity = this.source.energyCapacity;
        trace.stop();
        return this.memory.energyCapacity;
    }

    public get hasLink() {
        let trace = this.tracer.start('Property hasLink');
        if ((this.memory.hasLink == null || (Game.time % 100 == 0)) && this.source) {
            this.memory.hasLink = this.source.pos.findInRange(FIND_STRUCTURES, 4, { filter: (x: Structure) => x.structureType == STRUCTURE_LINK }).length > 0;
        }
        trace.stop();
        return this.memory.hasLink;
    }

    constructor(public id: string, public myRoom: MyRoom) {
        this.tracer = new Tracer('MySource ' + id);
        Colony.tracers.push(this.tracer);

        this.accessMemory();
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

    public containerMissing() {
        if (this.requiresCarrier)
            return false;

        return this.pos.findInRange<ConstructionSite>(FIND_CONSTRUCTION_SITES, 4, {
            filter: (s: Structure) => (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE || s.structureType == STRUCTURE_LINK)
        }).length == 0;
    }

    private getSourceDropOffContainer() {
        let containerCandidate = this.pos.findInRange<Container | Storage>(FIND_STRUCTURES, 4, {
            filter: (s: Structure) => (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE) && s.isActive()
        })[0];

        return containerCandidate;
    }

    private getDropOffStructure(): Storage | Container | Link | Spawn {

        let linkCandidate = this.pos.findInRange<Link>(FIND_MY_STRUCTURES, 4, {
            filter: (s: Structure) => s.structureType == STRUCTURE_LINK && s.isActive()
        })[0];

        if (this.myRoom.mainRoom.creepManagers.harvestingManager.sourceCarrierCreeps.length > 0) {
            

            let sourceDropOff = this.getSourceDropOffContainer();
            if (sourceDropOff && sourceDropOff.structureType == STRUCTURE_STORAGE)
                return sourceDropOff;
            else if (linkCandidate)
                return linkCandidate;
            else if (sourceDropOff)
                return sourceDropOff;
        }

        if (linkCandidate)
            return linkCandidate;
        if (this.myRoom.mainRoom.creepManagers.spawnFillManager.creeps.length > 0) {
            if (this.myRoom.mainRoom.mainContainer)
                return this.myRoom.mainRoom.mainContainer;
        }

        if (this.myRoom.mainRoom.spawns[0])
            return this.myRoom.mainRoom.spawns[0];

        return null;
    }

    //initializeMemory(): MySourceMemory {
    //    //var mem: MySourceMemory = new MySourceMemory();
    //    //mem.id = this.source.id;
    //    //mem.pos = this.source.pos;
    //    //mem.energyCapacity = this.source.energyCapacity;
    //    //mem.keeper = this.keeper;
    //    //mem.harvestingSpots = this.maxHarvestingSpots;
    //    //mem.mainContainerRoadBuiltTo = null;
    //    //mem.mainContainerPathLength = this.pathLengthToMainContainer;
    //    //mem.hasSourceDropOff = this.hasSourceDropOff;
    //    //mem.hasLink = this.hasLink;

    //    return mem;
    //}
}