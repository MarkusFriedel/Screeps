class MyMineral {

    private get memory(): MyMineralMemory {
        return this.accessMemory();
    }



    private accessMemory() {
        if (this.myRoom.memory.min == null) {
            let mineral = Game.getObjectById<Mineral>(this.id);
            if (mineral)
                this.myRoom.memory.min = {
                    id: this.id,
                    a: mineral.mineralAmount,
                    rti: mineral.ticksToRegeneration ? mineral.ticksToRegeneration + Game.time : undefined,
                    pos: mineral.pos,
                    rt: mineral.mineralType,

                };
            else {
                this.myRoom.memory.min = {
                    id: this.id
                };
            }
        }

        return this.myRoom.memory.min;
    }

    constructor(public myRoom: MyRoom, public id: string) {

        this.accessMemory();

        //let oldMemory = <MyMineralMemoryOld>this.memory;
        //let memory = this.memory;
        //if (oldMemory.harvestingSpots) memory.hs = oldMemory.harvestingSpots;
        //if (oldMemory.pathLengthToTerminal) memory.pl = oldMemory.pathLengthToTerminal;
        //if (oldMemory.terminalRoadBuiltTo) memory.rbtr = oldMemory.terminalRoadBuiltTo;
        //if (oldMemory.refreshTime) memory.rti = oldMemory.refreshTime;
        //if (oldMemory.hasExtractor) memory.e = oldMemory.hasExtractor;
        //if (oldMemory.amount) memory.a = oldMemory.amount;


        //delete oldMemory.containerId;

        //delete oldMemory.harvestingSpots;
        //delete oldMemory.pathLengthToTerminal;
        //delete oldMemory.terminalRoadBuiltTo;
        //delete oldMemory.refreshTime;
        //delete oldMemory.hasExtractor;
        

    }

    public get room() {
        return this.myRoom.room;
    }

    public get mineral() {
        let mineral = Game.getObjectById<Mineral>(this.id);
        return mineral;
    }

    private _pos: { time: number, pos: RoomPosition };
    public get pos() {
        if (this._pos == null || this._pos.time < Game.time)
            this._pos = { time: Game.time, pos: RoomPos.fromObj(this.memory.pos) }
        return this._pos.pos;
    }

    public get usable() {
        return !this.hasKeeper || this.maxHarvestingSpots > 1 && _.size(this.myRoom.mainRoom.managers.labManager.myLabs) > 1;
    }

    private _site: { time: number, site: Mineral };
    public get site() {
        if (this._site == null || this._site.time < Game.time)
            this._site = { time: Game.time, site: Game.getObjectById<Mineral>(this.id) };
        return this._site.site;
    }

    private _keeper: { time: number, keeper: KeeperInterface };
    public get keeper() {
        if (!this.hasKeeper)
            return null;
        if (this.room && (this._keeper == null || this._keeper.time < Game.time)) {
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
        if (this.memory.keeper == null && this.room) {
            this.memory.keeper = this.pos.findInRange(FIND_HOSTILE_STRUCTURES, 5, { filter: (x: Structure) => x.structureType == STRUCTURE_KEEPER_LAIR }).length > 0;
        }
        if (this.memory.keeper != null)
            return this.memory.keeper;
        else
            return true;
    }

    public get roadBuiltToRoom() {
        return this.memory.rbtr;
    }
    public set roadBuiltToRoom(value: string) {
        this.memory.rbtr = value;
    }

    public get maxHarvestingSpots(): number {
        //let trace = this.tracer.start('Property maxHarvestingSpots');
        if (this.memory.hs != null || this.mineral == null) {
            //trace.stop();
            return this.memory.hs;
        }
        else {
            let pos = this.mineral.pos;
            let spots = _.filter((<LookAtResultWithPos[]>this.mineral.room.lookForAtArea(LOOK_TERRAIN, pos.y - 1, pos.x - 1, pos.y + 1, pos.x + 1, true)), x => x.terrain == 'swamp' || x.terrain == 'plain').length;
            this.memory.hs = spots;
            //trace.stop();
            return spots;
        }
    }

    private _keeperIsAlive: { time: number, isAlive: boolean };
    public get keeperIsAlive() {
        if (!this.hasKeeper)
            return false;
        if (this._keeperIsAlive == null || this._keeperIsAlive.time < Game.time) {
            this._keeperIsAlive = { time: Game.time, isAlive: this.keeper && (this.keeper.lair.ticksToSpawn < 20 || this.keeper.creep && this.keeper.creep.hits > 100)}
        }
        return this._keeperIsAlive.isAlive;
    }

    _pathLengthToTerminal: { time: number, length: number };
    public get pathLengthToDropOff() {
        if ((this._pathLengthToTerminal == null || this._pathLengthToTerminal.time + 1500 < Game.time) && this.mineral)
            if (this.memory.pl && this.memory.pl.time + 1500 < Game.time) {
                this._pathLengthToTerminal = this.memory.pl;
            }
            else {
                this._pathLengthToTerminal = {
                    time: Game.time,
                    length: PathFinder.search(this.myRoom.mainRoom.spawns[0].pos, { pos: this.mineral.pos, range: 1 }, { roomCallback: Colony.getCustomMatrix({ ignoreKeeperSourceId: this.id }), plainCost: 2, swampCost: 10, maxOps: 20000 }).path.length
                };
                this.memory.pl = this._pathLengthToTerminal;
            }

        if (this._pathLengthToTerminal == null)
            return 50;
        else
            return this._pathLengthToTerminal.length;
    }

    public get lairPosition() {
        if (!this.memory.lairPos && this.keeper && this.keeper.lair)
            this.memory.lairPos = this.keeper.lair.pos;
        return RoomPos.fromObj(this.memory.lairPos);
    }


    public get amount() {
        if (this.mineral)
            this.memory.a = this.mineral.mineralAmount;
        return this.memory.a;
    }

    public get refreshTime() {
        if (this.mineral)
            this.memory.rti = this.mineral.ticksToRegeneration != null ? this.mineral.ticksToRegeneration + Game.time : null;
        return this.memory.rti;
    }

    //public get containerId() {
    //    if (this.memory.containerId && this.memory.containerId.time == Game.time)
    //        return this.memory.containerId.id;
    //    let trace = this.tracer.start('Property containerId');
    //    if (this.room && this.memory.containerId != null && this.memory.containerId.time < Game.time && this.memory.containerId.id != null) {
    //        let container = Game.getObjectById<Container>(this.memory.containerId.id);

    //        if (container)
    //            this.memory.containerId = { time: Game.time, id: container.id };
    //        else
    //            this.memory.containerId = null;
    //    }
    //    if (this.room && this.memory.containerId == null || this.memory.containerId.time + 100 < Game.time) {
    //        let container = this.pos.findInRange<Container>(FIND_STRUCTURES, 2, { filter: (x: Structure) => x.structureType == STRUCTURE_CONTAINER })[0];
    //        if (container) {
    //            this.memory.containerId = { time: Game.time, id: container.id };
    //        }
    //        else {
    //            if (this.myRoom.mainRoom && this.myRoom.mainRoom.terminal && this.pos.findInRange<ConstructionSite>(FIND_CONSTRUCTION_SITES, 2, { filter: (x: ConstructionSite) => x.structureType == STRUCTURE_CONTAINER }).length == 0) {
    //                let path = PathFinder.search(this.pos, { pos: this.myRoom.mainRoom.terminal.pos, range: 3 }, { plainCost: 2, swampCost: 5, roomCallback: Colony.getTravelMatrix }).path;

    //                path[0].createConstructionSite(STRUCTURE_CONTAINER);
    //            }
    //        }
    //    }
    //    trace.stop();
    //    if (this.memory.containerId)
    //        return this.memory.containerId.id;
    //    else
    //        return null;
    //}

    //private _container: { time: number, container: Container };
    //public get container() {
    //    if (this._container == null || this._container.time < Game.time)
    //        this._container = { time: Game.time, container: Game.getObjectById<Container>(this.containerId) };
    //    return this._container.container;

    //}

    public get hasExtractor() {
        if ((this.memory.e == null || this.memory.e.time + 100 < Game.time) && this.room) {
            let extractor = _.filter(this.pos.lookFor<StructureExtractor>(LOOK_STRUCTURES), s => s.structureType == STRUCTURE_EXTRACTOR && (s.my && s.isActive() || s.owner == null))[0];
            this.memory.e = { time: Game.time, hasExtractor: extractor != null };
        }
        if (this.memory.e)
            return this.memory.e.hasExtractor;
        else return false;
    }

    public link = null;


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
            if (this.memory.cId == null) {
                let container = this.mineral.pos.findInRange<StructureContainer>(FIND_STRUCTURES, 1, { filter: (s: Structure) => s.structureType == STRUCTURE_CONTAINER })[0];
                if (container) {
                    this.memory.cId = container.id;
                    this._container = { time: Game.time, container: container };
                }
            }
        }
        if (this._container && this.room)
            return this._container.container;
        else return null;
    }

    public get resourceType() {
        return this.memory.rt;
    }
}