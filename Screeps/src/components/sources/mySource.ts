/// <reference path="../../memoryObject.ts" />
/// <reference path="../../helpers.ts" />

class MySource implements MySourceInterface {

    private get memory(): MySourceMemory {
        return this.accessMemory();
    }



    private memoryInitialized = false;


    private accessMemory() {
        if (this.myRoom.memory.srcs == null)
            this.myRoom.memory.srcs = {};
        if (this.myRoom.memory.srcs[this.id] == null) {
            this.myRoom.memory.srcs[this.id] = {
                id: this.id,
                pos: this.source!=null ? this.source.pos : null
            }
        }
        return this.myRoom.memory.srcs[this.id];
    }

    private _room: { time: number, room: Room };
    public get room(): Room {
        //let trace = this.tracer.start('Property room');
        if ((this._room == null || this._room.time < Game.time) && this.source)
            this._room = {
                time: Game.time, room: Game.rooms[this.source.pos.roomName]
            };
        else if (!this.source) {
            this._room = {
                time: Game.time, room: null
            };
        }
        //trace.stop();
        if (this._room)
            return this._room.room;
        else return null;

    }

    private _keeperIsAlive: { time: number, isAlive: boolean };
    public get keeperIsAlive() {
        if (!this.hasKeeper)
            return false;
        if (this._keeperIsAlive == null || this._keeperIsAlive.time < Game.time) {
            this._keeperIsAlive = { time: Game.time, isAlive: this.keeper && (this.keeper.lair.ticksToSpawn < 20 || this.keeper.creep && this.keeper.creep.hits > 100) }
        }
        return this._keeperIsAlive.isAlive;
    }

    private _source: { time: number, source: Source };
    public get source(): Source {
        //let trace = this.tracer.start('Property source');
        if (this._source == null || this._source.time < Game.time)
            this._source = { time: Game.time, source: Game.getObjectById<Source>(this.id) }
        //trace.stop();
        return this._source.source;
    }

    public get containerPosition() {
        if (this.container) {
            this.memory.cPos = this.container.pos;
            return this.memory.cPos;
        }
        else
            return RoomPos.fromObj(this.memory.cPos);
    }

    private _container: { time: number, container: StructureContainer };
    public get container() {
        if (this.link || this.hasKeeper)
            return null;
        if ((this._container == null || this._container.time < Game.time) && this.room) {
            if (this.memory.cId) {
                let container = Game.getObjectById<StructureContainer>(this.memory.cId);
                if (container == null)
                    this.memory.cId = null;
                this._container = { time: Game.time, container: container };
            }
            if (this.memory.cId == null && !this.link && !this.hasKeeper) {
                let containerLook = _.filter(<LookAtResultWithPos[]>this.source.room.lookForAtArea(LOOK_STRUCTURES, this.pos.y - 1, this.pos.x - 1, this.pos.y + 1, this.pos.x + 1, true), s => s.structure.structureType == STRUCTURE_CONTAINER)[0];
                if (containerLook) {
                    this.memory.cId = containerLook.structure.id;
                    this._container = { time: Game.time, container: <Container>containerLook.structure };
                }
            }
        }
        if (this._container && this.room)
            return this._container.container;
        else return null;
    }

    //private _sourceDropOffContainer: { time: number, sourceDropOffContainer: { id: string, pos: RoomPosition } };
    //public get sourceDropOffContainer(): { id: string, pos: RoomPosition } {
    //    let trace = this.tracer.start('Property sourceDropOffContainer');
    //    if (this._sourceDropOffContainer!=null &&  this._sourceDropOffContainer.time == Game.time)
    //        return this._sourceDropOffContainer.sourceDropOffContainer;

    //    if (this.source && (!this.memory.sourceDropOffContainer || (this.memory.sourceDropOffContainer.time + 200) < Game.time)) {
    //        let structure = this.getSourceDropOffContainer();
    //        this._sourceDropOffContainer = { time: Game.time, sourceDropOffContainer: structure };
    //        this.memory.sourceDropOffContainer = { time: Game.time, value: structure ? { id: structure.id, pos: structure ? structure.pos : null } : null }
    //        trace.stop();
    //        return structure;
    //    }
    //    else {
    //        let structure: { id: string, pos: RoomPosition } = null;
    //        if (this.memory.sourceDropOffContainer.value)
    //            structure = Game.getObjectById<Structure>(this.memory.sourceDropOffContainer.value.id);
    //        if (structure == null && this.memory.sourceDropOffContainer && this.memory.sourceDropOffContainer.value != null)
    //            structure = {
    //                id: this.memory.sourceDropOffContainer.value.id,
    //                pos: RoomPos.fromObj(this.memory.sourceDropOffContainer.value.pos)
    //            };
    //        this._sourceDropOffContainer = { time: Game.time, sourceDropOffContainer: structure };
    //        trace.stop();
    //        return structure ? structure : null;
    //    }


    //}
    //private _dropOffStructre: { time: number, dropOffStructure: Structure } = { time: -1, dropOffStructure: null }
    //public get dropOffStructure(): { id: string, pos: RoomPosition } {
    //    let trace = this.tracer.start('Property dropOffStructure');
    //    if (this._dropOffStructre.time == Game.time) {
    //        trace.stop();
    //        return this._dropOffStructre.dropOffStructure;
    //    }

    //    if (this.source && (!this.memory.dropOffStructure || this.memory.dropOffStructure.time + 200 < Game.time)) {
    //        let structure = this.getDropOffStructure();
    //        this.memory.dropOffStructure = { time: Game.time, value: structure ? { id: structure.id, pos: structure.pos } : null }
    //        trace.stop();
    //        return structure;
    //    }
    //    else {
    //        let structure = Game.getObjectById<Structure>(this.memory.dropOffStructure.value.id);
    //        this._dropOffStructre = { time: Game.time, dropOffStructure: structure };
    //        trace.stop();
    //        return structure ? structure : (this.memory.dropOffStructure ? { id: this.memory.dropOffStructure.value.id, pos: RoomPos.fromObj(this.memory.dropOffStructure.value.pos) } : null);
    //    }
    //}

    //private _nearByConstructionSite: { time: number, constructionSite: ConstructionSite } = { time: -1, constructionSite: null };
    //public get nearByConstructionSite(): ConstructionSite {
    //    let trace = this.tracer.start('Property nearByConstruction');
    //    if (this._nearByConstructionSite.time + 50 < Game.time) {
    //        this._nearByConstructionSite = {
    //            time: Game.time, constructionSite: _.filter(RoomPos.fromObj(this.memory.pos).findInRange<ConstructionSite>(FIND_CONSTRUCTION_SITES, 4))[0]
    //        };
    //    }
    //    trace.stop();
    //    return this._nearByConstructionSite.constructionSite;
    //}

    public get pos(): RoomPosition {
        //let trace = this.tracer.start('Property pos');
        //trace.stop();
        if (this.memory.pos == null && this.source)
            this.memory.pos = this.source.pos;
        return RoomPos.fromObj(this.memory.pos);
    }

    public get maxHarvestingSpots(): number {
        //let trace = this.tracer.start('Property maxHarvestingSpots');
        if (this.memory.hs != null || this.source == null) {
            //trace.stop();
            return this.memory.hs;
        }
        else {
            let pos = this.source.pos;
            let spots = _.filter((<LookAtResultWithPos[]>this.source.room.lookForAtArea(LOOK_TERRAIN, pos.y - 1, pos.x - 1, pos.y + 1, pos.x + 1, true)), x => x.terrain == 'swamp' || x.terrain == 'plain').length;
            this.memory.hs = spots;
            //trace.stop();
            return spots;
        }
    }

    private _site: { time: number, site: Source };
    public get site() {
        if (this._site == null || this._site.time < Game.time)
            this._site = { time: Game.time, site: Game.getObjectById<Source>(this.id) };
        return this._site.site;
    }

    public get usable() {
        return !this.hasKeeper || this.maxHarvestingSpots > 1 && _.size(this.myRoom.mainRoom.managers.labManager.myLabs) > 1;
    }

    public get lairPosition() {
        if (!this.memory.lairPos && this.keeper && this.keeper.lair)
            this.memory.lairPos = this.keeper.lair.pos;
        return RoomPos.fromObj(this.memory.lairPos);
    }

    private _keeper: { time: number, keeper: KeeperInterface };
    public get keeper() {
        if (!this.hasKeeper || !this.room)
            return null;
        if (this.source && (this._keeper == null || this._keeper.time < Game.time)) {
            if (this.memory.lairId)
                var lair = Game.getObjectById<StructureKeeperLair>(this.memory.lairId);
            if (!lair) {
                lair = this.pos.findInRange<StructureKeeperLair>(FIND_HOSTILE_STRUCTURES, 5, { filter: (s: Structure) => s.structureType == STRUCTURE_KEEPER_LAIR })[0];
                if (lair) {
                    this.memory.lairId = lair.id;
                    this.memory.lairPos = lair.pos;
                }
            }
            let creepInfo = _.filter(this.myRoom.hostileScan.keepers, k => k.pos.inRangeTo(this.pos, 5))[0];
            this._keeper = {
                time: Game.time,
                keeper: {
                    lair: lair,
                    creep: creepInfo ? creepInfo.creep : null
                }
            };
        }
        if (this._keeper)
            return this._keeper.keeper;
        else return null;
    }

    public get hasKeeper(): boolean {
        if (this.memory.keeper != null || !this.source) {
            return this.memory.keeper;
        }
        else {
            this.memory.keeper = this.source.pos.findInRange(FIND_STRUCTURES, 5, { filter: (s) => s.structureType == STRUCTURE_KEEPER_LAIR }).length > 0;
            return this.memory.keeper;
        }
    }

    public get amount() {
        if (this.source)
            this.memory.a = this.source.energy;
        return this.memory.a;
    }

    public get rate() {
        return this.capacity / ENERGY_REGEN_TIME;
    }

    public get roadBuiltToRoom() {
        return this.memory.rbtr;
    }
    public set roadBuiltToRoom(value: string) {
        this.memory.rbtr = value;
    }

    public getPathLengthToDropOff(mainRoomName: string) {
        if (!this.memory.pl || (<any>this.memory.pl).time)
            this.memory.pl = {};
        if ((this.memory.pl[mainRoomName] == null || this.memory.pl[mainRoomName].time + 1500 < Game.time) && this.source)
            this.memory.pl[mainRoomName] = {
                time: Game.time,
                length: PathFinder.search(this.myRoom.mainRoom.spawns[0].pos, { pos: this.source.pos, range: 1 }, { roomCallback: Colony.getCustomMatrix({ ignoreKeeperSourceId: this.id }), plainCost: 2, swampCost: 10, maxOps: 20000 }).path.length
            };

        if (this.memory.pl[mainRoomName] == null)
            return 50;
        else
            return this.memory.pl[mainRoomName].length;
    }

    private _capacityLastFresh: number;
    public get capacity() {
        //let trace = this.tracer.start('Property energyCapacity');
        if (this.source && (this._capacityLastFresh == null || this._capacityLastFresh + 50 < Game.time)) {
            this.memory.c = this.source.energyCapacity;
            this._capacityLastFresh = Game.time;
        }
        //trace.stop();
        return this.memory.c;
    }

    private _loadLink() {
        if (!this.myRoom.mainRoom || this.myRoom.name != this.myRoom.mainRoom.name) {
            if (this.memory.lId)
                delete this.memory.lId;
            return null;
        }

        if (this._link == null || this._link.time < Game.time) {
            if (this.memory.lId) {
                let link = Game.getObjectById<Link>(this.memory.lId.id);
                if (link)
                    this._link = { time: Game.time, link: link };
                else
                    this.memory.lId = null;
            }
            if (this.memory.lId == null || this.memory.lId.time + 100 < Game.time) {
                let link = this.source.pos.findInRange<Link>(FIND_MY_STRUCTURES, 4, { filter: (x: Structure) => x.structureType == STRUCTURE_LINK })[0];
                if (link) {
                    this._link = { time: Game.time, link: link };
                    this.memory.lId = { time: Game.time, id: link.id };
                }
                else
                    this.memory.lId = { time: Game.time, id: null };
            }
        }
    }

    private _link: { time: number, link: Link };

    public get link() {
        this._loadLink();

        if (this._link)
            return this._link.link;
        else
            return null;
    }

    constructor(public id: string, public myRoom: MyRoom) {


        //this.accessMemory();

        let oldMemory = <MySourceMemoryOld>this.memory;
        let memory = this.memory;

        if (oldMemory.linkId)
            delete oldMemory.linkId;
        if (oldMemory.energyCapacity)
            delete oldMemory.energyCapacity;

        //if (oldMemory.capacity) memory.c = oldMemory.capacity;
        //if (oldMemory.harvestingSpots) memory.hs = oldMemory.harvestingSpots;
        //if (oldMemory.pathLengthToMainContainer) memory.pl = oldMemory.pathLengthToMainContainer;
        //if (oldMemory.roadBuiltToRoom) memory.rbtr = oldMemory.roadBuiltToRoom;

        //delete oldMemory.capacity;
        //delete oldMemory.harvestingSpots;
        //delete oldMemory.pathLengthToMainContainer;
        //delete oldMemory.roadBuiltToRoom;

        this.hasKeeper;
        this.maxHarvestingSpots;
        if (myMemory['profilerActive']) {
            this._loadLink = profiler.registerFN(this._loadLink, 'MySource.link');
            this.getHarvestingSpots = profiler.registerFN(this.getHarvestingSpots, 'MySource.getHarvestingSpots');
        }


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

    public resourceType = RESOURCE_ENERGY;
}