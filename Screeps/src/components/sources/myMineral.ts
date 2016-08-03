class MyMineral  {

    private get memory(): MyMineralMemory {
        return this.accessMemory();
    }

    

    private accessMemory() {
        if (this.myRoom.memory.myMineral == null) {
            let mineral = Game.getObjectById<Mineral>(this.id);
            this.myRoom.memory.myMineral = {
                id: this.id,
                amount: mineral.mineralAmount,
                refreshTime: mineral.ticksToRegeneration ? mineral.ticksToRegeneration + Game.time : null,
                pos: mineral.pos,
                resource: mineral.mineralType,

            };
        }

        return this.myRoom.memory.myMineral;
    }

    constructor(public myRoom: MyRoom, public id: string) {
        
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

    private _keeper: { time: number, keeper: KeeperInterface };
    public get keeper() {
        if (this.room && (this._keeper == null || this._keeper.time < Game.time)) {
            if (this.memory.lairId)
                var lair = Game.getObjectById<StructureKeeperLair>(this.memory.lairId);
            if (!lair) {
                lair = this.mineral.pos.findInRange<StructureKeeperLair>(FIND_HOSTILE_STRUCTURES, 5, { filter: (s: Structure) => s.structureType == STRUCTURE_KEEPER_LAIR })[0];
                this.memory.lairId = lair.id;
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
        return this.memory.terminalRoadBuiltTo;
    }
    public set roadBuiltToRoom(value: string) {
        this.memory.terminalRoadBuiltTo = value;
    }

    public get maxHarvestingSpots(): number {
        //let trace = this.tracer.start('Property maxHarvestingSpots');
        if (this.memory.harvestingSpots != null || this.mineral == null) {
            //trace.stop();
            return this.memory.harvestingSpots;
        }
        else {
            let pos = this.mineral.pos;
            let spots = _.filter((<LookAtResultWithPos[]>this.mineral.room.lookForAtArea(LOOK_TERRAIN, pos.y - 1, pos.x - 1, pos.y + 1, pos.x + 1, true)), x => x.terrain == 'swamp' || x.terrain == 'plain').length;
            this.memory.harvestingSpots = spots;
            //trace.stop();
            return spots;
        }
    }

    _pathLengthToTerminal: { time: number, length: number };
    public get pathLengthToDropOff() {
        if ((this._pathLengthToTerminal == null || this._pathLengthToTerminal.time + 500 < Game.time) && this.mineral)
            if (this.memory.pathLengthToTerminal && this.memory.pathLengthToTerminal.time + 500 < Game.time) {
                this._pathLengthToTerminal = this.memory.pathLengthToTerminal;
            }
            else {
                this._pathLengthToTerminal = {
                    time: Game.time,
                    length: PathFinder.search(this.myRoom.mainRoom.spawns[0].pos, { pos: this.mineral.pos, range: 4 }, { roomCallback: Colony.getTravelMatrix }).path.length
                };
                this.memory.pathLengthToTerminal = this._pathLengthToTerminal;
            }

        if (this._pathLengthToTerminal == null)
            return 50;
        else
            return this._pathLengthToTerminal.length;
    }

    public get amount() {
        if (this.mineral)
            this.memory.amount = this.mineral.mineralAmount;
        return this.memory.amount;
    }

    public get refreshTime() {
        if (this.mineral)
            this.memory.refreshTime = this.mineral.ticksToRegeneration != null ? this.mineral.ticksToRegeneration + Game.time : null;
        return this.memory.refreshTime;
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
        if ((this.memory.hasExtractor == null || this.memory.hasExtractor.time + 100 < Game.time) && this.room) {
            let extractor = _.filter(this.pos.lookFor<StructureExtractor>(LOOK_STRUCTURES), s => s.structureType == STRUCTURE_EXTRACTOR &&  (s.my && s.isActive() || s.owner == null))[0];
            this.memory.hasExtractor = { time: Game.time, hasExtractor: extractor != null };
        }
        if (this.memory.hasExtractor)
            return this.memory.hasExtractor.hasExtractor;
        else return false;
    }

    public get resource() {
        return this.memory.resource;
    }
}