/// <reference path="../sources/mySource.ts" />
/// <reference path="../sources/myMineral.ts" />
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
                name: this.name
            };
        return Colony.memory.rooms[this.name];
    }




    public hostileScan: HostileScanInterface;

    public get controllerPosition() {
        if (this.memory.ctrlPos)
            return RoomPos.fromObj(this.memory.ctrlPos);
        else return null;
    }

    public get repairWalls(): { [id: string]: RepairStructure } {
        if (this.memory.rw == null || this.memory.rw.time + 1450 < Game.time) {
            this.reloadRepairStructures(0.5);
        }
        if (this.memory.rw)
            return this.memory.rw.structures;
        else
            return {};
    }

    public get repairStructures(): { [id: string]: RepairStructure } {
        if (this.memory.rs == null || this.memory.rs.time + 1450 < Game.time) {
            this.reloadRepairStructures(0.5);
        }
        else if (this.memory.rsUT < Game.time) {
            this.memory.rsUT = Game.time;
            _.forEach(this.memory.rs.structures, s => {
                let structure = Game.getObjectById<Structure>(s.id);
                if (structure == null || structure.hits >= structure.hitsMax)
                    delete this.memory.rs[s.id];
                else {
                    s.hits = structure.hits;
                    s.hitsMax = structure.hitsMax;
                }
            });
        }
        if (this.memory.rs)
            return this.memory.rs.structures;
        else
            return {};
    }

    public reloadRepairStructures(hitsFactor: number) {
        if (this.room) {
            let structures = _.map(this.room.find<Structure>(FIND_STRUCTURES, { filter: (s: Structure) => s.hits < s.hitsMax && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_CONTAINER || s.hits < hitsFactor * s.hitsMax && s.hits <= s.hitsMax - 500 && (s.structureType != STRUCTURE_CONTAINER || !_.any(this.mySources, x => x.hasKeeper)) }), s => <RepairStructure>{ id: s.id, hits: s.hits, hitsMax: s.hitsMax, pos: s.pos, sT: s.structureType });
            let nonWalls = _.indexBy(_.filter(structures, s => s.sT != STRUCTURE_WALL && s.sT != STRUCTURE_RAMPART || s.hits < 10000), x => x.id);
            let walls = _.indexBy(_.filter(structures, s => s.sT == STRUCTURE_WALL || s.sT == STRUCTURE_RAMPART), x => x.id);
            this.memory.rs = { time: Game.time, structures: nonWalls };
            this.memory.rw = { time: Game.time, structures: walls };

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
        return this.memory.ctrlPos !=null;
    }

    public get canHarvest() {
        //let trace = this.tracer.start('Property canHarvest');
        let result = (this.mainRoom && this.name == this.mainRoom.name || !(this.memory.fO || this.memory.fR));
        //trace.stop();
        return result;
    }

    public myMineral: MyMineralInterface;


    private _mySources: { time: number, mySources: { [id: string]: MySourceInterface; } } = null;

    public get mySources(): { [id: string]: MySourceInterface; } {
        //let trace = this.tracer.start('Property mySources');
        if (this._mySources == null) {
            if (this.memory.srcs == null && this.room) {
                this._mySources = { time: Game.time, mySources: _.indexBy(_.map(this.room.find<Source>(FIND_SOURCES), x => new MySource(x.id, this)), (x) => x.id) };
            }
            else if (this.memory.srcs != null) {
                this._mySources = { time: Game.time, mySources: _.indexBy(_.map(this.memory.srcs, x => new MySource(x.id, this)), (x) => x.id) };
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


    private _mainRoom: { time: number, mainRoom: MainRoomInterface };
    public get mainRoom() {
        //let trace = this.tracer.start('Property mainRoom');
        if (this._mainRoom == null || this._mainRoom.time < Game.time)
            this._mainRoom = { time: Game.time, mainRoom: Colony.mainRooms[this.memory.mrn] };
        //trace.stop();
        return this._mainRoom.mainRoom;
    }
    public set mainRoom(value: MainRoomInterface) {
        if (value != null && (this.mainRoom == null || this.mainRoom.name != value.name))
            value.invalidateSources();
        //if (this._mainRoom && this._mainRoom.memory.connectedRooms)
        //    this.mainRoom.memory.connectedRooms.splice(this.mainRoom.memory.connectedRooms.indexOf(this.name), 1);
        this._mainRoom = { time: Game.time, mainRoom: value };
        //if (this._mainRoom) {
        //    if (!this.mainRoom.memory.connectedRooms)
        //        this.mainRoom.memory.connectedRooms = [];
        //    this._mainRoom.memory.connectedRooms.push(this.name);
        //}

        this.memory.mrn = (value == null ? undefined : value.name);

    }

    constructor(public name: string) {
        if (myMemory['profilerActive']) {
            this.getCustomMatrix = profiler.registerFN(this.getCustomMatrix, 'MyRoom.getCustomMatrix');
            this.createCostMatrix = profiler.registerFN(this.createCostMatrix, 'MyRoom.createCostMatrix');
            this.createKeeperMatrix = profiler.registerFN(this.createKeeperMatrix, 'MyRoom.createKeeperMatrix');
            this.refresh = profiler.registerFN(this.refresh, 'MyRoom.refresh');
        }

        //this.accessMemory();

        //let oldMemory = <MyRoomMemoryOld>this.memory;
        //let memory = this.memory;

        //delete oldMemory.containers;
        //delete oldMemory.hasController;

        //if (oldMemory.avoidKeeperMatrix) memory.aKM = oldMemory.avoidKeeperMatrix;
        //delete oldMemory.avoidKeeperMatrix;
        //if (oldMemory.compressedCostMatrix) memory.ccm = oldMemory.compressedCostMatrix;
        //delete oldMemory.compressedCostMatrix;
        //if (oldMemory.controllerPosition) memory.ctrlPos = oldMemory.controllerPosition;
        //delete oldMemory.controllerPosition;
        //if (oldMemory.costMatrix) memory.cm = oldMemory.costMatrix;
        //delete oldMemory.costMatrix;
        //if (oldMemory.emergencyRepairStructures) memory.ers = oldMemory.emergencyRepairStructures;
        //delete oldMemory.emergencyRepairStructures;
        //if (oldMemory.foreignOwner) memory.fO = oldMemory.foreignOwner;
        //delete oldMemory.foreignOwner;
        //if (oldMemory.foreignReserver) memory.fR = oldMemory.foreignReserver;
        //delete oldMemory.foreignReserver;
        //if (oldMemory.hostileScan) memory.hs = oldMemory.hostileScan;
        //delete oldMemory.hostileScan;
        //if (oldMemory.lastScanTime) memory.lst = oldMemory.lastScanTime;
        //delete oldMemory.lastScanTime;
        //if (oldMemory.mainRoomDistanceDescriptions) memory.mrd = oldMemory.mainRoomDistanceDescriptions;
        //delete oldMemory.mainRoomDistanceDescriptions;
        //if (oldMemory.mainRoomName) memory.mrn = oldMemory.mainRoomName;
        //delete oldMemory.mainRoomName;
        //if (oldMemory.myMineral) memory.min = oldMemory.myMineral;
        //delete oldMemory.myMineral;
        //if (oldMemory.repairStructures) memory.rs = oldMemory.repairStructures;
        //delete oldMemory.repairStructures;
        //if (oldMemory.repairWalls) memory.rs = oldMemory.repairWalls;
        //delete oldMemory.repairWalls;
        //if (oldMemory.sources) memory.srcs = oldMemory.sources;
        //delete oldMemory.sources;

        //if (memory.mrd) {
        //    _.forEach(memory.mrd, (distanceDescription: DistanceDescriptionOld) => {
        //        if (distanceDescription.distance) distanceDescription.d = distanceDescription.distance;
        //        delete distanceDescription.distance;
        //        if (distanceDescription.roomName) distanceDescription.n = distanceDescription.roomName;
        //        delete distanceDescription.roomName;
        //    });
        //}

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
                        else if (Game.map.getTerrainAt(pos.x + x, pos.y + y, pos.roomName) == 'plain')
                            terrainValue = 2;
                        else
                            terrainValue = 10;
                        costMatrix.set(pos.x + x, pos.y + y, Math.min(value * terrainValue, 254));
                    }
                    else
                        costMatrix.set(pos.x + x, pos.y + y, 255);
                }
            }
        }
    }


    private _costMatrix: { time: number, matrix: CostMatrix };
    public get costMatrix(): CostMatrix | boolean {
        if (this.memory.fO && this.memory.cm || this.memory.ccm) {
            delete this.memory.cm;
            delete this.memory.ccm;
            return false;
        }

        if (Colony.memory.useCompressedCostMatrix && this.memory.cm)
            delete this.memory.cm;
        else if (this.memory.ccm)
            delete this.memory.ccm;

        if (this._costMatrix == null || this._costMatrix.time + 500 < Game.time) {
            if (Colony.memory.useCompressedCostMatrix) {
                if ((this.memory.ccm == null || this.memory.ccm.time + 500 < Game.time) && this.room) {
                    this.recreateCostMatrix();
                }
                else if (this.memory.ccm != null) {
                    this._costMatrix = { time: this.memory.ccm.time, matrix: MyCostMatrix.decompress(this.memory.ccm.matrix) };
                }
            }
            else {
                if ((this.memory.cm == null || this.memory.cm.time + 500 < Game.time) && this.room) {
                    this.recreateCostMatrix();
                }
                else if (this.memory.cm != null) {
                    this._costMatrix = { time: this.memory.cm.time, matrix: PathFinder.CostMatrix.deserialize(this.memory.cm.matrix) };
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
        if ((this._creepAvoidanceMatrix == null || this._creepAvoidanceMatrix.time < Game.time) && this.room) {
            let matrix = (<CostMatrix>this.costMatrix).clone();
            _.forEach(this.room.find<Creep>(FIND_CREEPS), c => matrix.set(c.pos.x, c.pos.y, 255));
            this._creepAvoidanceMatrix = { time: Game.time, matrix: matrix }
        }
        return this._creepAvoidanceMatrix.matrix;
    }

    private _avoidKeeperMatrix: { time: number, matrix: CostMatrix };

    private createKeeperMatrix(opts, customMatrix: CostMatrix, baseMatrix: CostMatrix) {
        if (!customMatrix)
            customMatrix = baseMatrix.clone();

        console.log(this.name + ':Creating KeeperMatrix ' + ((opts && opts.ignoreKeeperSourceId) ? opts.ignoreKeeperSourceId : ''));

        let sourcesToAvoid = _.filter(this.mySources, s => !opts || !opts.ignoreKeeperSourceId || s.id != opts.ignoreKeeperSourceId);
        //console.log('Sources to avoid: ' + _.map(sourcesToAvoid, s => s.id).join(', '));
        let sourcePositions = _.map(sourcesToAvoid, s => s.pos);

        let lairPositions = _.map(_.filter(sourcesToAvoid, s => s.lairPosition), s => s.lairPosition);

        if (this.myMineral && this.myMineral.hasKeeper && (!opts || !opts.ignoreKeeperSourceId || this.myMineral.id != opts.ignoreKeeperSourceId)) {
            sourcePositions.push(this.myMineral.pos);
            if (this.myMineral.lairPosition)
                lairPositions.push(this.myMineral.lairPosition);
        }

        let protectedPositions = sourcePositions.concat(lairPositions);

        let ignoreSourcePositions = _.map(_.filter(sourcesToAvoid, s => opts && s.id == opts.ignoreKeeperSourceId), s => s.pos);
        let ignoreLairPositions = _.map(_.filter(sourcesToAvoid, s => opts && s.id == opts.ignoreKeeperSourceId && s.lairPosition), s => s.lairPosition);

        _.forEach(protectedPositions, pos => { this.costMatrixSetArea(customMatrix, pos, 4, 10) });

        _.forEach(ignoreSourcePositions, pos => {
            this.costMatrixSetArea(customMatrix, pos, 2, 0);
        });

        //_.forEach(ignoreSourcePositions, pos => { this.costMatrixSetArea(customMatrix, pos, 5, 10) });
        //_.forEach(ignoreLairPositions, pos => { this.costMatrixSetArea(customMatrix, pos, 5, 5) });

        if (!opts || !opts.ignoreKeeperSourceId && !opts.avoidCreeps) {
            this._avoidKeeperMatrix = { time: Game.time, matrix: customMatrix.clone() }
            this.memory.aKM = { time: Game.time, matrix: this._avoidKeeperMatrix.matrix.serialize() }
        }
        return customMatrix;
    }

    public getCustomMatrix(opts?: CostMatrixOpts): CostMatrix | boolean {
        if (this.memory.fO)
            return false;

        let costMatrix = (opts && opts.avoidCreeps) ? (<CostMatrix>this.creepAvoidanceMatrix) : (<CostMatrix>this.costMatrix);

        let customMatrix: CostMatrix = null;
        if (Colony.memory.useKeeperMatrix) {
            if (_.any(this.mySources, s => s.hasKeeper) && (!opts || !opts.ignoreAllKeepers)) {


                if ((!opts || !opts.ignoreKeeperSourceId && (!opts.avoidCreeps || !this.mySources[opts.ignoreKeeperSourceId] && (!this.myMineral || this.myMineral.id != opts.ignoreKeeperSourceId))) && (this._avoidKeeperMatrix && !(this._avoidKeeperMatrix.time + 200 < Game.time) || this.memory.aKM && !(this.memory.aKM.time + 200 < Game.time))) {
                    if (!this._avoidKeeperMatrix || this._avoidKeeperMatrix.time + 500 < Game.time) {
                        this._avoidKeeperMatrix = { time: Game.time, matrix: PathFinder.CostMatrix.deserialize(this.memory.aKM.matrix) }
                        console.log(this.name + ': Deserializing KeeperMatrix');
                    }
                    customMatrix = this._avoidKeeperMatrix.matrix;
                    console.log(this.name + ': Returning cached KeeperMatrix');
                }
                else {
                    customMatrix = this.createKeeperMatrix(opts, customMatrix, costMatrix);
                }
            }
        }
        return customMatrix || costMatrix;
    }

    public recreateCostMatrix() {
        if (!this.room)
            return;
        let costMatrix = this.createCostMatrix();
        if (Colony.memory.useCompressedCostMatrix)
            this.memory.ccm = { time: Game.time, matrix: MyCostMatrix.compress(costMatrix) };
        else
            this.memory.cm = { time: Game.time, matrix: costMatrix.serialize() };
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

        if (!Colony.memory.useKeeperMatrix) {

            if (_.any(this.mySources, s => s.hasKeeper)) {
                let sourcesToAvoid = this.mySources;
                //console.log('Sources to avoid: ' + _.map(sourcesToAvoid, s => s.id).join(', '));
                let sourcePositions = _.map(sourcesToAvoid, s => s.pos);

                let lairPositions = _.map(_.filter(sourcesToAvoid, s => s.lairPosition), s => s.lairPosition);

                if (this.myMineral && this.myMineral.hasKeeper) {
                    sourcePositions.push(this.myMineral.pos);
                    if (this.myMineral.lairPosition)
                        lairPositions.push(this.myMineral.lairPosition);
                }

                let protectedPositions = sourcePositions.concat(lairPositions);

                _.forEach(protectedPositions, pos => { this.costMatrixSetArea(costMatrix, pos, 4, 10) });

            }

        }

        let obstaclePositions = _.uniq(this.room.find<{ pos: RoomPosition, structureType: string }>(FIND_STRUCTURES, {
            filter: (s: Structure) => (OBSTACLE_OBJECT_TYPES.indexOf(s.structureType) >= 0) || s.structureType == STRUCTURE_PORTAL || (s.structureType == STRUCTURE_RAMPART && (<StructureRampart>s).isPublic == false && (<StructureRampart>s).my == false)
        }).concat(this.room.find<ConstructionSite>(FIND_CONSTRUCTION_SITES, {
            filter: (s: ConstructionSite) => OBSTACLE_OBJECT_TYPES.indexOf(s.structureType) >= 0 || s.structureType == STRUCTURE_CONTROLLER
        })));

        _.forEach(obstaclePositions, structure => {
            if (structure.structureType != STRUCTURE_WALL && structure.structureType != STRUCTURE_RAMPART)
                this.costMatrixSetArea(costMatrix, structure.pos, 1, 3);
            costMatrix.set(structure.pos.x, structure.pos.y, 255);
        });

        if (this.myMineral)
            var positions = _.map(this.mySources, s => s.pos).concat(this.myMineral.pos);
        else
            positions = _.map(this.mySources, s => s.pos);

        _.forEach(positions, pos => {
            this.costMatrixSetArea(costMatrix, pos, 2, 2);
        });

        return costMatrix;
    }

    public get requiresDefense() {
        return (this.mainRoom && _.size(this.hostileScan.creeps) > 0);
    }

    public get closestMainRoom() {
        //let trace = this.tracer.start('Property closestMainRoom');
        if (this.memory.mrd == null || _.size(this.memory.mrd) == 0) {
            //trace.stop();
            return null;
        }
        let result = Colony.mainRooms[_.min(this.memory.mrd, x => x.d).n];
        //trace.stop();
        return result;
    }

    public refresh(force = false) {
        let room = this.room;

        if (this.memory.lst == null || this.memory.lst + 100 < Game.time || force) {

            if (this.memory.min == null && room) {
                let mineral = room.find<Mineral>(FIND_MINERALS)[0];
                if (mineral)
                    this.myMineral = new MyMineral(this, mineral.id);
            }
            else if (this.memory.min != null)
                this.myMineral = new MyMineral(this, this.memory.min.id);

            if (room == null)
                return;




            this.memory.fO = (room.controller != null && room.controller.owner != null && !room.controller.my) ? true : undefined;
            this.memory.fR = (room.controller != null && room.controller.reservation != null && room.controller.reservation.username != Colony.myName) ? true : undefined;

            this.memory.lst = Game.time;

            if (this.room.controller)
                this.memory.ctrlPos = this.room.controller.pos;


            this.mySources;
            if (this.myMineral && this.myMineral.resourceType == null)
                delete this.memory.min;
            this.myMineral;

            //this.costMatrix;

            if (this.memory.cm && this.memory.cm.time < Game.time - 5000) {
                delete this.memory.cm;
            }
            if (this.memory.aKM && this.memory.aKM.time < Game.time - 5000) {
                delete this.memory.aKM;
            }
            if (this.memory.ccm && this.memory.ccm.time < Game.time - 5000) {
                delete this.memory.ccm;
            }
        }
    }
}