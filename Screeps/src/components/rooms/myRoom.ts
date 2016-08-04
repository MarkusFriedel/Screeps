/// <reference path="../sources/mySource.ts" />
/// <reference path="../sources/myMineral.ts" />
/// <reference path="../structures/myContainer.ts" />
/// <reference path="./hostileScan.ts" />

class MyRoom implements MyRoomInterface {

    public get memory(): MyRoomMemory {
        return this.accessMemory();
    }

    private accessMemory() {
        if (Colony.memory.rooms == null)
            Colony.memory.rooms = {};
        if (Colony.memory.rooms[this.name] == null)
            Colony.memory.rooms[this.name] = {
                name: this.name,
                containers: undefined,
                sources: undefined,
                hostileScan: undefined,
                foreignOwner: undefined,
                foreignReserver: undefined,
                lastScanTime: undefined,
                mainRoomDistanceDescriptions: undefined,
                mainRoomName: undefined,
                hasController: undefined,
                controllerPosition: undefined,
                compressedCostMatrix: undefined,
                myMineral: undefined,
                repairStructures: undefined,
                emergencyRepairStructures: undefined,
            };
        return Colony.memory.rooms[this.name];
    }




    public hostileScan: HostileScanInterface;

    public get controllerPosition() {
        if (this.memory.controllerPosition)
            return RoomPos.fromObj(this.memory.controllerPosition);
        else return null;
    }

    public get repairWalls(): { [id: string]: RepairStructure } {
        if (this.memory.repairWalls == null || this.memory.repairWalls.time + 1450 < Game.time) {
            this.reloadRepairStructures(0.5);
        }
        if (this.memory.repairWalls)
            return this.memory.repairWalls.structures;
        else
            return {};
    }

    public get repairStructures(): { [id: string]: RepairStructure } {
        if (this.memory.repairStructures == null || this.memory.repairStructures.time + 1450 < Game.time) {
            this.reloadRepairStructures(0.5);
        }
        if (this.memory.repairStructures)
            return this.memory.repairStructures.structures;
        else
            return {};
    }

    public reloadRepairStructures(hitsFactor: number) {
        if (this.room) {
            let structures = _.map(this.room.find<Structure>(FIND_STRUCTURES, { filter: (s: Structure) => s.hits < s.hitsMax && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_CONTAINER || s.hits < hitsFactor * s.hitsMax && s.hits <= s.hitsMax - 500 && (s.structureType != STRUCTURE_CONTAINER || !_.any(this.mySources, x => x.hasKeeper)) }), s => <RepairStructure>{ id: s.id, hits: s.hits, hitsMax: s.hitsMax, pos: s.pos, structureType: s.structureType });
            let nonWalls = _.indexBy(_.filter(structures, s => s.structureType != STRUCTURE_WALL && s.structureType != STRUCTURE_RAMPART || s.hits < 10000), x => x.id);
            let walls = _.indexBy(_.filter(structures, s => s.structureType == STRUCTURE_WALL || s.structureType == STRUCTURE_RAMPART), x => x.id);
            this.memory.repairStructures = { time: Game.time, structures: nonWalls };
            this.memory.repairWalls = { time: Game.time, structures: walls };

        }
    }

    private _emergencyRepairStructures: { time: number, structures: RepairStructure[] };
    public get emergencyRepairStructures() {
        if (this._emergencyRepairStructures == null || this._emergencyRepairStructures.time + 10 < Game.time) {
            let structures = _.filter(this.repairStructures, RepairManager.emergencyTargetDelegate);
            if (structures.length == 0)
                structures = _.filter(this.repairWalls, RepairManager.emergencyTargetDelegate);
            this._emergencyRepairStructures = { time: Game.time, structures: structures }
        }

        return this._emergencyRepairStructures.structures;
    }

    private _resourceDrops: { time: number, resources: Resource[] };
    public get resourceDrops() {
        if (this._resourceDrops == null || this._resourceDrops.time < Game.time) {
            if (this.room)
                this._resourceDrops = { time: Game.time, resources: this.room.find<Resource>(FIND_DROPPED_RESOURCES) };
            else
                this._resourceDrops = { time: Game.time, resources: [] };
        }
        return this._resourceDrops.resources;
    }

    private _room: { time: number, room: Room } = { time: -1, room: null };
    public get room(): Room {
        //let trace = this.tracer.start('Property room');
        if (this._room.time < Game.time)
            this._room = {
                time: Game.time, room: Game.rooms[this.name]
            };
        //trace.stop();
        return this._room.room;
    }

    public get hasController() {
        return this.memory.hasController;
    }

    public get canHarvest() {
        //let trace = this.tracer.start('Property canHarvest');
        let result = (this.mainRoom && this.name == this.mainRoom.name || !(this.memory.foreignOwner || this.memory.foreignReserver));
        //trace.stop();
        return result;
    }

    public myMineral: MyMineralInterface;


    private _mySources: { time: number, mySources: { [id: string]: MySourceInterface; } } = null;

    public get mySources(): { [id: string]: MySourceInterface; } {
        //let trace = this.tracer.start('Property mySources');
        if (this._mySources == null) {
            if (this.memory.sources == null && this.room) {
                this._mySources = { time: Game.time, mySources: _.indexBy(_.map(this.room.find<Source>(FIND_SOURCES), x => new MySource(x.id, this)), (x) => x.id) };
            }
            else if (this.memory.sources != null) {
                this._mySources = { time: Game.time, mySources: _.indexBy(_.map(this.memory.sources, x => new MySource(x.id, this)), (x) => x.id) };
            }
        }
        //trace.stop();
        if (this._mySources)
            return this._mySources.mySources;
        else return {};
    }

    public get useableSources() {
        //let trace = this.tracer.start('Property useableSources');
        let result = _.filter(this.mySources, x => !x.hasKeeper);
        //trace.stop();
        return result;
    }

    private _mainRoom: MainRoomInterface = null;
    public get mainRoom() {
        //let trace = this.tracer.start('Property mainRoom');
        if (this._mainRoom == null)
            this._mainRoom = Colony.mainRooms[this.memory.mainRoomName];
        //trace.stop();
        return this._mainRoom;
    }
    public set mainRoom(value: MainRoomInterface) {
        if (value != null && (this._mainRoom == null || this._mainRoom.name != value.name))
            value.invalidateSources();
        this._mainRoom = value;
        this.memory.mainRoomName = (value == null ? null : value.name);
    }

    constructor(public name: string) {

        this.getCustomMatrix = profiler.registerFN(this.getCustomMatrix, 'MyRoom.getCustomMatrix');

        this.memory.name = name;

        this.hostileScan = new HostileScan(this);

        this.refresh(true);


    }






    private costMatrixSetArea(costMatrix: CostMatrix, pos: RoomPosition, range: number, value: number) {
        for (let x = -range; x <= range; x++) {
            for (let y = -range; y <= range; y++) {
                if (Game.map.getTerrainAt(pos.x + x, pos.y + y, this.name) != 'wall' && costMatrix.get(pos.x + x, pos.y + x) < 255) {
                    if (value < 255) {
                        let currentCosts = costMatrix.get(pos.x + x, pos.y + y);
                        if (currentCosts > 0)
                            var terrainValue = currentCosts;
                        else if (Game.map.getTerrainAt(pos) == 'plain')
                            terrainValue = 2;
                        else
                            terrainValue = 5;
                        costMatrix.set(pos.x + x, pos.y + y, Math.min(value * terrainValue, 254));
                    }
                    else
                        costMatrix.set(pos.x + x, pos.y + y, Math.max(value, costMatrix.get(pos.x + x, pos.y + y)));
                }
            }
        }
    }


    private _costMatrix: { time: number, matrix: CostMatrix };
    public get costMatrix(): CostMatrix | boolean {
        if (this.memory.foreignOwner) {
            delete this.memory.costMatrix;
            delete this.memory.compressedCostMatrix;
            return false;
        }

        if (Colony.memory.useCompressedCostMatrix)
            delete this.memory.costMatrix;
        else
            delete this.memory.compressedCostMatrix;

        if (this._costMatrix == null || this._costMatrix.time + 200 < Game.time) {
            if (Colony.memory.useCompressedCostMatrix) {
                if ((this.memory.compressedCostMatrix == null || this.memory.compressedCostMatrix.time + 200 < Game.time) && this.room) {
                    this.recreateCostMatrix();
                }
                else if (this.memory.compressedCostMatrix != null) {
                    this._costMatrix = { time: this.memory.compressedCostMatrix.time, matrix: MyCostMatrix.decompress(this.memory.compressedCostMatrix.matrix) };
                }
            }
            else {
                if ((this.memory.costMatrix == null || this.memory.costMatrix.time + 200 < Game.time) && this.room) {
                    this.recreateCostMatrix();
                }
                else if (this.memory.costMatrix != null) {
                    this._costMatrix = { time: this.memory.costMatrix.time, matrix: PathFinder.CostMatrix.deserialize(this.memory.costMatrix.matrix) };
                }
            }
        }
        if (this._costMatrix)
            return this._costMatrix.matrix;
        else
            return new PathFinder.CostMatrix();
    }

    private _creepAvoidanceMatrix: { time: number, matrix: CostMatrix };
    public get creepAvoidanceMatrix(): CostMatrix | boolean {
        if (this.costMatrix === false)
            return false;
        if (!this.room)
            return this.costMatrix;
        if (this._creepAvoidanceMatrix == null || this._creepAvoidanceMatrix.time < Game.time && this.room) {
            let matrix = (<CostMatrix>this.costMatrix).clone();
            _.forEach(this.room.find<Creep>(FIND_CREEPS), c => matrix.set(c.pos.x, c.pos.y, 255));
            this._creepAvoidanceMatrix = { time: Game.time, matrix: matrix }
        }
        return this._creepAvoidanceMatrix.matrix;
    }

    public getCustomMatrix(opts?: CostMatrixOpts): CostMatrix | boolean {
        if (this.costMatrix === false)
            return false;

        let costMatrix = (opts && opts.avoidCreeps) ? (<CostMatrix>this.creepAvoidanceMatrix) : (<CostMatrix>this.costMatrix);

        let customMatrix: CostMatrix = null;
        if (opts && !opts.ignoreAllKeepers) {

            let keeperSources = _.filter(this.mySources, s => s.hasKeeper);
            if (keeperSources.length > 0) {
                if (!customMatrix)
                    customMatrix = costMatrix.clone();

                let sourcesToAvoid = _.filter(keeperSources, s => s.id != opts.ignoreKeeperSourceId);

                let sourcePositions = _.map(sourcesToAvoid, s => s.pos);

                let lairPositions = _.map(_.filter(sourcesToAvoid, s => s.lairPosition), s => s.lairPosition);

                if (this.myMineral && this.myMineral.hasKeeper && this.myMineral.id != opts.ignoreKeeperSourceId) {
                    sourcePositions.push(this.myMineral.pos);
                    if (this.myMineral.lairPosition)
                        lairPositions.push(this.myMineral.lairPosition);
                }

                let protectedPositions = sourcePositions.concat(lairPositions);

                let ignoreSourcePositions = _.map(sourcesToAvoid, s => s.pos);
                let ignoreLairPositions = _.map(_.filter(sourcesToAvoid, s => s.lairPosition), s => s.lairPosition);

                _.forEach(protectedPositions, pos => { this.costMatrixSetArea(customMatrix, pos, 5, 50) });

                _.forEach(ignoreSourcePositions, pos => { this.costMatrixSetArea(customMatrix, pos, 5, 10) });
                _.forEach(ignoreLairPositions, pos => { this.costMatrixSetArea(customMatrix, pos, 5, 5) });
            }
        }
        return customMatrix || costMatrix;
    }

    public recreateCostMatrix() {
        if (!this.room)
            return;
        let costMatrix = this.createCostMatrix();
        if (Colony.memory.useCompressedCostMatrix)
            this.memory.compressedCostMatrix = { time: Game.time, matrix: MyCostMatrix.compress(costMatrix) };
        else
            this.memory.costMatrix = { time: Game.time, matrix: costMatrix.serialize() };
        //this.memory.compressedTravelMatrix = { time: Game.time, matrix: MyCostMatrix.compress(this._travelMatrix.matrix) };
        this._costMatrix = { time: Game.time, matrix: costMatrix };
    }

    private createCostMatrix(): CostMatrix {
        let costMatrix = new PathFinder.CostMatrix();

        _.forEach(this.room.find<ConstructionSite>(FIND_STRUCTURES, { filter: (s: ConstructionSite) => s.structureType == STRUCTURE_ROAD }), structure => {
            costMatrix.set(structure.pos.x, structure.pos.y, 1);
        });
        _.forEach(this.room.find<ConstructionSite>(FIND_CONSTRUCTION_SITES, { filter: (s: ConstructionSite) => s.structureType == STRUCTURE_ROAD }), structure => {
            costMatrix.set(structure.pos.x, structure.pos.y, 1);
        });


        _.forEach(this.room.find<Structure>(FIND_STRUCTURES, {
            filter: (s: Structure) => (OBSTACLE_OBJECT_TYPES.indexOf(s.structureType) >= 0) || s.structureType == STRUCTURE_PORTAL || (s.structureType == STRUCTURE_RAMPART && (<StructureRampart>s).isPublic == false && (<StructureRampart>s).my == false)
        }), structure => {
            costMatrix.set(structure.pos.x, structure.pos.y, 255);
            if (structure.structureType != STRUCTURE_WALL && structure.structureType != STRUCTURE_RAMPART)
                for (let x = -1; x <= 1; x++) {
                    for (let y = -1; y <= 1; y++) {
                        if (Game.map.getTerrainAt(structure.pos.x + x, structure.pos.y + y, this.name) != 'wall')
                            costMatrix.set(structure.pos.x + x, structure.pos.y + y, costMatrix.get(structure.pos.x + x, structure.pos.y + y) + 5);
                    }
                }
        });

        _.forEach(this.room.find<ConstructionSite>(FIND_CONSTRUCTION_SITES, {
            filter: (s: ConstructionSite) => OBSTACLE_OBJECT_TYPES.indexOf(s.structureType) >= 0 || s.structureType == STRUCTURE_CONTROLLER
        }), structure => {
            costMatrix.set(structure.pos.x, structure.pos.y, 255);
            for (let x = -1; x <= 1; x++) {
                for (let y = -1; y <= 1; y++) {
                    if (Game.map.getTerrainAt(structure.pos.x + x, structure.pos.y + y, this.name) != 'wall')
                        costMatrix.set(structure.pos.x + x, structure.pos.y + y, costMatrix.get(structure.pos.x + x, structure.pos.y + y) + 5);
                }
            }
        });

        _.forEach(this.room.find<Source>(FIND_SOURCES), structure => {
            for (let x = -2; x <= 2; x++) {
                for (let y = -2; y <= 2; y++) {
                    if (Game.map.getTerrainAt(structure.pos.x + x, structure.pos.y + y, this.name) != 'wall')
                        costMatrix.set(structure.pos.x + x, structure.pos.y + y, costMatrix.get(structure.pos.x + x, structure.pos.y + y) + 10);
                }
            }
        });

        _.forEach(this.room.find<Mineral>(FIND_MINERALS), structure => {
            for (let x = -2; x <= 2; x++) {
                for (let y = -2; y <= 2; y++) {
                    if (Game.map.getTerrainAt(structure.pos.x + x, structure.pos.y + y, this.name) != 'wall')
                        costMatrix.set(structure.pos.x + x, structure.pos.y + y, costMatrix.get(structure.pos.x + x, structure.pos.y + y) + 10);
                }
            }
        });

        return costMatrix;
    }

    public get requiresDefense() {
        return (this.mainRoom && _.size(this.hostileScan.creeps) > 0);
    }

    public get closestMainRoom() {
        //let trace = this.tracer.start('Property closestMainRoom');
        if (this.memory.mainRoomDistanceDescriptions == null || _.size(this.memory.mainRoomDistanceDescriptions) == 0) {
            //trace.stop();
            return null;
        }
        let result = Colony.mainRooms[_.min(this.memory.mainRoomDistanceDescriptions, x => x.distance).roomName];
        //trace.stop();
        return result;
    }

    public refresh(force = false) {
        let room = this.room;

        if (this.memory.lastScanTime == null || this.memory.lastScanTime + 100 < Game.time || force) {

            if (this.memory.myMineral == null && room) {
                let mineral = room.find<Mineral>(FIND_MINERALS)[0];
                if (mineral)
                    this.myMineral = new MyMineral(this, mineral.id);
            }
            else if (this.memory.myMineral != null)
                this.myMineral = new MyMineral(this, this.memory.myMineral.id);

            if (room == null)
                return;




            this.memory.foreignOwner = room.controller != null && room.controller.owner != null && !room.controller.my;
            this.memory.foreignReserver = room.controller != null && room.controller.reservation != null && room.controller.reservation.username != Colony.myName;

            this.memory.lastScanTime = Game.time;

            this.memory.hasController = this.room.controller != null;
            if (this.room.controller)
                this.memory.controllerPosition = this.room.controller.pos;


            this.mySources;
            if (this.myMineral && this.myMineral.resource == null)
                delete this.memory.myMineral;
            this.myMineral;

            this.costMatrix;
        }
    }
}