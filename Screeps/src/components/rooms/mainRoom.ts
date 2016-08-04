/// <reference path="../structures/myLink.ts" />
/// <reference path="./spawnManager.ts" />
/// <reference path="./constructionManager.ts" />
/// <reference path="./repairManager.ts" />
/// <reference path="./upgradeManager.ts" />
/// <reference path="./spawnFillManager.ts" />
/// <reference path="./energyHarvestingManager.ts" />
/// <reference path="./defenseManager.ts" />
/// <reference path="./reservationManager.ts" />
/// <reference path="./linkFillerManager.ts" />
/// <reference path="./roadConstructionManager.ts" />
/// <reference path="./towerManager.ts" />
/// <reference path="./mineralHarvestingManager.ts" />
/// <reference path="./terminalManager.ts" />
/// <reference path="./labManager.ts" />
/// <reference path="./sourceKeeperManager.ts" />
/// <reference path="../structures/myTower.ts" />
/// <reference path="../structures/myObserver.ts" />
/// <reference path="./carrierManager.ts" />


class MainRoom implements MainRoomInterface {

    public get memory(): MainRoomMemory {
        return this.accessMemory();
    }






    private _room: { time: number, room: Room };
    public get room(): Room {
        //let trace = this.tracer.start('Property room');
        if (this._room == null || this._room.time < Game.time)
            this._room = {
                time: Game.time, room: Game.rooms[this.name]
            };
        //trace.stop();
        return this._room.room;
    }
    private _connectedRooms: { time: number, rooms: MyRoomInterface[] };
    public get connectedRooms() {
        if (this._connectedRooms == null || this._connectedRooms.time < Game.time)
            this._connectedRooms = { time: Game.time, rooms: _.filter(_.map(Colony.memory.rooms, r => Colony.getRoom(r.name)), (r) => r.name != this.name && r.mainRoom && r.mainRoom.name == this.name) }
        return this._connectedRooms.rooms;
    }

    private _harvestersShouldDeliver: { time: number, value: boolean };
    public get harvestersShouldDeliver() {
        if (this._harvestersShouldDeliver == null || this._harvestersShouldDeliver.time < Game.time)
            this._harvestersShouldDeliver = {
                time: Game.time,
                value: !this.mainContainer || (this.managers.energyHarvestingManager.sourceCarrierCreeps.length == 0 && this.mainContainer.store.energy < this.maxSpawnEnergy) || (this.managers.spawnFillManager.creeps.length == 0 && this.room.energyAvailable < 500)
            };

        return this._harvestersShouldDeliver.value;
    }

    private _dropOffStructure: { time: number, structures: { [resource: string]: Structure } }
    public getDropOffStructure(resource: string) {
        if (this._dropOffStructure == null || this._dropOffStructure.time < Game.time)
            this._dropOffStructure = { time: Game.time, structures: {} };
        if (!this._dropOffStructure.structures[resource])
            this._dropOffStructure.structures[resource] = resource == RESOURCE_ENERGY ? this.mainContainer || this.spawns[0] : this.terminal;
        return this._dropOffStructure.structures[resource];

    }

    private _energyDropOffStructure: { time: number, structure: Structure };
    public get energyDropOffStructure() {
        if (this._energyDropOffStructure == null || this._energyDropOffStructure.time < Game.time) {
            let structure: Structure = null;
            if (this.mainContainer && this.managers.spawnFillManager.creeps.length > 0)
                structure = this.mainContainer;
            else
                structure = _.sortBy(this.spawns, s => s.energy)[0];
            this._energyDropOffStructure = { time: Game.time, structure: structure };
        }
        return this._energyDropOffStructure.structure;
    }

    public get allRooms() {
        return this.connectedRooms.concat(this.myRoom);
    }

    public getResourceAmount(resource: string): number {
        let value = 0;
        if (this.mainContainer && this.mainContainer.store[resource])
            value += this.mainContainer.store[resource];
        if (this.terminal && this.terminal.store[resource])
            value += this.terminal.store[resource];
        return value;
    }

    public get harvestingActive() {
        if (this.memory.harvestingActive == null)
            this.memory.harvestingActive = true;
        return this.memory.harvestingActive;
    }

    public set harvestingActive(value: boolean) {
        this.memory.harvestingActive = value;
    }

    private _sources: { [id: string]: MySourceInterface };
    public get sources() {
        if (this._sources == null) {
            let sources = _.indexBy(_.map(this.myRoom.mySources, x => x), x => x.id);
            let rooms = _.filter(this.connectedRooms, x => x.canHarvest);
            for (var roomIdx in rooms)
                for (var sourceIdx in this.connectedRooms[roomIdx].mySources)
                    sources[this.connectedRooms[roomIdx].mySources[sourceIdx].id] = this.connectedRooms[roomIdx].mySources[sourceIdx];
            this._sources = sources;
        }
        return this._sources;
    }
    public invalidateSources() {
        this._sources = null;
    }

    private _minerals: { time: number, minerals: { [id: string]: MyMineralInterface } }
    public get minerals() {
        if (this._minerals == null || this._minerals.time < Game.time) {
            this._minerals = { time: Game.time, minerals: _.indexBy(_.map(_.filter(this.allRooms, x => x.myMineral != null && (!x.myMineral.hasKeeper || _.size(this.managers.labManager.myLabs) > 0) && x.myMineral.hasExtractor), x => x.myMineral), x => x.id) }
        }

        return this._minerals.minerals;
    }

    //_mineralId: string;
    //_mineral: { time: number, mineral: Mineral } = { time: -1, mineral: null }
    //public get mineral() {
    //    let trace = this.tracer.start('Property mineral');
    //    if (this._mineral.time < Game.time) {
    //        if (this._mineralId == null) {
    //            let mineral = this.room.find<Mineral>(FIND_MINERALS)[0];
    //            this._mineralId = mineral ? mineral.id : null;
    //        }
    //        this._mineral = { time: Game.time, mineral: Game.getObjectById<Mineral>(this._mineralId) };
    //    }
    //    trace.stop();
    //    return this._mineral.mineral;
    //}

    //private _extractor: { time: number, extractor: StructureExtractor } = { time: -1, extractor: null };
    //public get extractor() {
    //    let trace = this.tracer.start('Property extractor');
    //    if (this._extractor.time < Game.time) {
    //        if (this.mineral) {
    //            let extractor = this.mineral.pos.lookFor<StructureExtractor>(LOOK_STRUCTURES)[0];
    //            if (extractor == null && CONTROLLER_STRUCTURES.extractor[this.room.controller.level] > 0) {
    //                let construction = this.mineral.pos.lookFor<StructureExtractor>(LOOK_CONSTRUCTION_SITES)[0];
    //                if (construction == null)
    //                    this.mineral.pos.createConstructionSite(STRUCTURE_EXTRACTOR);
    //                this._extractor = { time: Game.time, extractor: null };
    //            }
    //            else
    //                this._extractor = { time: Game.time, extractor: extractor };
    //        }
    //        else
    //            this._extractor = { time: Game.time, extractor: null };
    //    }
    //    trace.stop();
    //    return this._extractor.extractor;
    //}

    public get terminal() {
        return this.room.terminal;
    }

    //public get extractorContainerId() {
    //    if (this.room.controller.level < 6)
    //        return null;
    //    if (this.memory.extractorContainerId == null || this.memory.extractorContainerId.time + 100 < Game.time) {
    //        if (this.extractor != null && this.terminal != null) {
    //            let container = this.extractor.pos.findInRange<Container>(FIND_STRUCTURES, 2, { filter: (s: Structure) => s.structureType == STRUCTURE_CONTAINER })[0];
    //            if (container) {
    //                this._extractorContainer = {
    //                    time: Game.time, container: container
    //                };
    //                this.memory.extractorContainerId = {
    //                    time: Game.time, id: container.id
    //                }
    //            }
    //            else {
    //                let constructionSite = this.extractor.pos.findInRange<ConstructionSite>(FIND_CONSTRUCTION_SITES, 2, { filter: (s: ConstructionSite) => s.structureType == STRUCTURE_CONTAINER })[0];
    //                if (constructionSite == null) {
    //                    let pathToTerminal = PathFinder.search(this.extractor.pos, { pos: this.terminal.pos, range: 2 });
    //                    pathToTerminal.path[0].createConstructionSite(STRUCTURE_CONTAINER);
    //                }

    //            }
    //        }
    //    }
    //    if (this.memory.extractorContainerId)
    //        return this.memory.extractorContainerId.id;
    //    else return null;
    //}
    //private _extractorContainer: { time: number, container: Container };
    //public get extractorContainer() {
    //    let trace = this.tracer.start('Property extractorContainer');
    //    if ((this._extractorContainer == null || this._extractorContainer.time < Game.time) && this.extractorContainerId != null) {
    //        this._extractorContainer = { time: Game.time, container: Game.getObjectById<Container>(this.extractorContainerId) };

    //    }
    //    trace.stop();
    //    if (this._extractorContainer)
    //        return this._extractorContainer.container;
    //    else return null;
    //}

    _maxSpawnEnergy: { time: number, maxSpawnEnergy: number } = { time: -101, maxSpawnEnergy: 300 };
    public get maxSpawnEnergy(): number {
        //let trace = this.tracer.start('Property maxSpawnEnergy');
        if (this.mainContainer == null || this.managers.spawnFillManager.creeps.length == 0 || this.mainContainer.store.energy == 0 && this.managers.energyHarvestingManager.harvesterCreeps.length == 0) {
            //trace.stop();
            return 300;
        }
        //if (this._maxSpawnEnergy.time + 100 < Game.time)
        //    this._maxSpawnEnergy = {
        //        //time: Game.time, maxSpawnEnergy: this.getMaxSpawnEnergy()
        //        time: Game.time, maxSpawnEnergy: this.room.energyCapacityAvailable
        //    };

        //trace.stop();
        return this.room.energyCapacityAvailable;
        //return this._maxSpawnEnergy.maxSpawnEnergy;
        //return 400;
    }



    private _creeps: { time: number, creeps: Array<Creep> };
    private _creeps_get(): Array<Creep> {
        if (this._creeps == null || this._creeps.time < Game.time)
            this._creeps = {
                //time: Game.time, creeps: _.filter(Game.creeps, (c) => (<CreepMemory>c.memory).mainRoomName === this.name && !(<CreepMemory>c.memory).handledByColony)
                time: Game.time, creeps: Colony.getCreeps(this.name)
            };
        //trace.stop();
        return this._creeps.creeps;
    }
    public get creeps(): Array<Creep> {
        return this._creeps_get();

    }



    private _creepsByRole: { time: number, creeps: _.Dictionary<Creep[]> };
    public creepsByRole(role: string) {
        if (this._creepsByRole == null || this._creepsByRole.time < Game.time) {
            this._creepsByRole = { time: Game.time, creeps: _.groupBy(this.creeps, c => c.memory.role) };
        }
        return this._creepsByRole.creeps[role] || [];
    }

    private get mainContainerId() {
        //let trace = this.tracer.start('Property mainContainerId');
        if (this.memory.mainContainerId == null || this.memory.mainContainerId.time + 100 > Game.time) {
            let container = this.checkAndPlaceStorage();
            this.memory.mainContainerId = { time: Game.time, id: container ? container.id : null }
        }
        //trace.stop();
        return this.memory.mainContainerId.id;
    }

    _mainContainer: { time: number, mainContainer: Container | Storage };
    public get mainContainer(): Container | Storage {
        if (this.room && this.room.storage)
            return this.room.storage;
        //let trace = this.tracer.start('Property mainContainer');
        if (this._mainContainer == null || this._mainContainer.time < Game.time)
            this._mainContainer = { time: Game.time, mainContainer: Game.getObjectById<Container | Storage>(this.mainContainerId) }
        //trace.stop();
        return this._mainContainer.mainContainer;
    }

    _spawns: { time: number, spawns: Array<Spawn> } = { time: -1, spawns: null };
    public get spawns(): Array<Spawn> {
        //let trace = this.tracer.start('Property spawns');
        if (this._spawns.time < Game.time)
            this._spawns = {
                time: Game.time, spawns: _.filter(Game.spawns, x => x.room.name == this.name)
            };
        //trace.stop();
        return this._spawns.spawns;
    }

    private _towerIds: { time: number, ids: Array<string> };
    private _towers: { time: number, towers: Array<Tower> };
    public get towers(): Array<Tower> {
        //let trace = this.tracer.start('Property towers');
        if (this._towerIds == null || this._towerIds.time + 100 < Game.time)
            this._towerIds = {
                time: Game.time, ids: _.map(_.filter(this.room.find<Tower>(FIND_MY_STRUCTURES, { filter: (x: Structure) => x.structureType == STRUCTURE_TOWER })), t => t.id)
            };
        if (this._towers == null || this._towers.time < Game.time) {
            this._towers = {
                time: Game.time, towers: []
            };

            _.forEach(this._towerIds.ids, id => {
                let tower = Game.getObjectById<Tower>(id);
                if (tower)
                    this._towers.towers.push(tower);
            });


        }
        //trace.stop();
        return this._towers.towers;
    }

    accessMemory() {
        if (Colony.memory.mainRooms == null)
            Colony.memory.mainRooms = {};
        if (Colony.memory.mainRooms[this.name] == null)
            Colony.memory.mainRooms[this.name] = {
                name: this.name,
            };
        return Colony.memory.mainRooms[this.name];
    }

    name: string;
    myRoom: MyRoomInterface;


    public get mainPosition(): RoomPosition {
        return RoomPos.fromObj(this.memory.mainPosition);
    }


    spawnManager: SpawnManagerInterface;
    roadConstructionManager: RoadConstructionManagerInterface;

    extensionCount: number;
    links: Array<MyLinkInterface>;
    myObserver: MyObserverInterface;



    managers: {
        constructionManager: ConstructionManager,
        repairManager: RepairManager,
        upgradeManager: UpgradeManager,
        spawnFillManager: SpawnFillManager,
        energyHarvestingManager: EnergyHarvestingManager,
        defenseManager: DefenseManager,
        reservationManager: ReservationManager,
        linkFillerManager: LinkFillerManager,
        towerManager: TowerManager,
        terminalManager: TerminalManager,
        mineralHarvestingManager: MineralHarvestingManager,
        sourceKeeperManager: SourceKeeperManagerInterface,
        labManager: LabManagerInterface,
        carrierManager: CarrierManager
    }



    constructor(roomName: string) {

        this.creepsByRole = profiler.registerFN(this.creepsByRole, 'MainRoom.creepsByRole');
        this.tick = profiler.registerFN(this.tick, 'MainRoom.tick');
        this.tickCreeps = profiler.registerFN(this.tickCreeps, 'MainRoom.tickCreeps');
        this.checkCreeps = profiler.registerFN(this.checkCreeps, 'MainRoom.checkCreeps');
        this._creeps_get = profiler.registerFN(this._creeps_get, 'MainRoom._creeps_get');

        this.name = roomName;
        this.myRoom = Colony.getRoom(roomName);
        this.myRoom.mainRoom = this;
        if (this.myRoom.memory.mainRoomDistanceDescriptions == null)
            this.myRoom.memory.mainRoomDistanceDescriptions = {};
        this.myRoom.memory.mainRoomDistanceDescriptions[this.name] = { roomName: this.name, distance: 0 };

        //this.spawnNames = _.map(_.filter(Game.spawns, (s) => s.room.name == roomName), (s) => s.name);

        this.links = _.map(this.room.find<Link>(FIND_MY_STRUCTURES, { filter: (x: Structure) => x.structureType == STRUCTURE_LINK }), x => new MyLink(x, this));
        this.myObserver = new MyObserver(this);


        if (this.memory.mainPosition == null) {
            this.memory.mainPosition = this.spawns[0].pos;
        }

        //if (!this.memory.spawnManager) this.memory.spawnManager = {  }
        //if (!this.memory.constructionManager) this.memory.constructionManager = {}
        //if (!this.memory.repairManager) this.memory.repairManager = { emergencyTargets: {}, repairTargets: {} }
        //if (!this.memory.upgradeManager) this.memory.upgradeManager = {}
        //if (!this.memory.spawnFillManager) this.memory.spawnFillManager = {}
        //if (!this.memory.harvestingManager) this.memory.harvestingManager = {}
        //if (!this.memory.defenseManager) this.memory.defenseManager = {}
        //if (!this.memory.reservationManager) this.memory.reservationManager = {}

        this.spawnManager = new SpawnManager(this, this.memory.spawnManager);
        this.managers = {

            constructionManager: new ConstructionManager(this),
            repairManager: new RepairManager(this),
            upgradeManager: new UpgradeManager(this),
            spawnFillManager: new SpawnFillManager(this),
            energyHarvestingManager: new EnergyHarvestingManager(this),
            defenseManager: new DefenseManager(this),
            reservationManager: new ReservationManager(this),
            linkFillerManager: new LinkFillerManager(this),
            towerManager: new TowerManager(this),
            terminalManager: new TerminalManager(this),
            mineralHarvestingManager: new MineralHarvestingManager(this),
            sourceKeeperManager: new SourceKeeperManager(this),
            labManager: new LabManager(this),
            carrierManager: new CarrierManager(this)
        }

        if (!this.memory.roadConstructionManager)
            this.memory.roadConstructionManager = null;
        this.roadConstructionManager = new RoadConstructionManager(this);
    }



    placeMainContainer() {
        if (Memory['verbose'])
            console.log('SpawnRoomHandler.placeMainContainer');
        let closestSource = this.mainPosition.findClosestByPath<Source>(FIND_SOURCES);

        let targetPos: RoomPosition = null;
        if (!closestSource)
            targetPos = new RoomPosition(this.mainPosition.x + 4, this.mainPosition.y + 4, this.name);
        else {
            targetPos = new RoomPosition(this.mainPosition.x, this.mainPosition.y, this.name);
            let direction = this.mainPosition.getDirectionTo(this.room.controller);
            switch (direction) {
                case TOP:
                    targetPos.y -= 4;
                    break;
                case TOP_RIGHT:
                    targetPos.y -= 4;
                    targetPos.x += 4;
                    break;
                case RIGHT:
                    targetPos.x += 4;
                    break;
                case BOTTOM_RIGHT:
                    targetPos.y += 4;
                    targetPos.x += 4;
                    break;
                case BOTTOM:
                    targetPos.y += 4;
                    break;
                case BOTTOM_LEFT:
                    targetPos.y += 4;
                    targetPos.x -= 4;
                    break;
                case LEFT:
                    targetPos.x -= 4;
                    break;
                case TOP_LEFT:
                    targetPos.y += 4;
                    break;
            }
        }

        targetPos.createConstructionSite(STRUCTURE_CONTAINER);
    }

    placeStorage() {
        if (Memory['verbose'])
            console.log('SpawnRoomHandler.placeStorage');

        let targetPos: RoomPosition = null;

        let storageFlag = _.filter(Game.flags, x => x.pos.roomName == this.name && x.memory.storage == true)[0];
        if (storageFlag)
            targetPos = storageFlag.pos;
        else {
            let closestSource = this.mainPosition.findClosestByPath<Source>(FIND_SOURCES);
            if (!closestSource)
                targetPos = new RoomPosition(this.mainPosition.x + 2, this.mainPosition.y + 2, this.name);
            else {
                targetPos = new RoomPosition(this.mainPosition.x, this.mainPosition.y, this.name);
                let direction = this.mainPosition.getDirectionTo(this.room.controller);
                switch (direction) {
                    case TOP:
                        targetPos.y -= 2;
                        break;
                    case TOP_RIGHT:
                        targetPos.y -= 2;
                        targetPos.x += 2;
                        break;
                    case RIGHT:
                        targetPos.x += 2;
                        break;
                    case BOTTOM_RIGHT:
                        targetPos.y += 2;
                        targetPos.x += 2;
                        break;
                    case BOTTOM:
                        targetPos.y += 2;
                        break;
                    case BOTTOM_LEFT:
                        targetPos.y += 2;
                        targetPos.x -= 2;
                        break;
                    case LEFT:
                        targetPos.x -= 2;
                        break;
                    case TOP_LEFT:
                        targetPos.y += 2;
                        break;
                }
            }
        }
        targetPos.createConstructionSite(STRUCTURE_STORAGE);
    }

    checkAndPlaceMainContainer(): Container {
        let mainContainer = null;
        this.memory.mainContainerId && (mainContainer = Game.getObjectById(this.memory.mainContainerId.id));

        if (mainContainer == null) {
            let candidates = this.mainPosition.findInRange<Container>(FIND_STRUCTURES, 4, {
                filter: (s: Structure) => s.structureType == STRUCTURE_CONTAINER
            });

            if (candidates.length > 0) {
                return candidates[0];
            } else {
                let constructionCandidates = this.mainPosition.findInRange<ConstructionSite>(FIND_CONSTRUCTION_SITES, 4, {
                    filter: (s: Structure) => s.structureType == STRUCTURE_CONTAINER
                });

                if (constructionCandidates.length == 0) {
                    this.placeMainContainer();
                }
            }
        }
        else
            return mainContainer;
    }



    checkAndPlaceStorage(): Storage | Container {
        if (this.room.storage != null) {
            return this.room.storage;
        }
        else if (CONTROLLER_STRUCTURES.storage[this.room.controller.level] > 0) {
            this.placeStorage();
        }
        return this.checkAndPlaceMainContainer();
    }

    checkCreeps() {
        if (this.managers.spawnFillManager.creeps.length == 0 && this.mainContainer && this.mainContainer.store.energy >= this.maxSpawnEnergy * 2) {
            this.managers.spawnFillManager.preTick();
        }
        else if (this.managers.energyHarvestingManager.harvesterCreeps.length == 0 && this.managers.energyHarvestingManager.sourceCarrierCreeps.length == 0)
            this.managers.energyHarvestingManager.preTick(this.myRoom);
        else {

            this.managers.spawnFillManager.preTick();
            this.managers.linkFillerManager.preTick();
            this.managers.terminalManager.preTick();
            this.managers.towerManager.preTick();
            this.managers.labManager.preTick();
            if (this.mainContainer && this.mainContainer.store.energy > 10000 && this.managers.upgradeManager.creeps.length == 0)
                this.managers.upgradeManager.preTick();
            _.forEach(_.sortByOrder(this.allRooms, [r => _.any(r.mySources, s => s.hasKeeper ? 1 : 0), r => r.memory.mainRoomDistanceDescriptions[this.name].distance, r => _.size(r.mySources)], ['asc', 'asc', 'desc']), myRoom => {
                this.managers.reservationManager.preTick(myRoom);
                if (this.mainContainer && this.mainContainer.store.energy > 50000)
                    try { this.managers.repairManager.preTick(myRoom) } catch (e) { console.log(e.stack); }
                this.managers.sourceKeeperManager.preTick(myRoom);
                this.managers.energyHarvestingManager.preTick(myRoom);
                this.managers.mineralHarvestingManager.preTick(myRoom);
                if (this.mainContainer && this.mainContainer.store.energy <= 50000)
                    try { this.managers.repairManager.preTick(myRoom) } catch (e) { console.log(e.stack); }
            });
        }

        this.managers.defenseManager.preTick();

        this.managers.constructionManager.preTick();

        if (this.managers.upgradeManager.creeps.length > 0)
            this.managers.upgradeManager.preTick();

        this.managers.carrierManager.preTick();
    }

    tickCreeps() {
        this.managers.repairManager.tick();
        this.managers.constructionManager.tick();
        this.managers.energyHarvestingManager.tick();
        this.managers.sourceKeeperManager.tick();
        this.managers.reservationManager.tick();
        this.managers.spawnFillManager.tick();
        this.managers.linkFillerManager.tick();




        this.managers.upgradeManager.tick();
        this.managers.defenseManager.tick();

        this.managers.towerManager.tick();
        this.managers.terminalManager.tick();
        this.managers.mineralHarvestingManager.tick();
        try { this.managers.labManager.tick(); } catch (e) { console.log(e.stack); }

        this.managers.carrierManager.tick();
    }

    public tick() {
        let startCpu = Game.cpu.getUsed();
        console.log();
        console.log('MainRoom ' + this.name + ': ' + this.creeps.length + ' creeps');

        //_.forEach(this.allRooms, r => console.log('&nbsp;Room: ' + r.name + ': RepairTargets: ' + _.size(r.repairStructures)));

        if (Memory['verbose'])
            console.log('SpawnRoomHandler.tick');

        if (this.room == null) {
            return;
        }

        this.links.forEach(x => x.tick());

        if (this.mainContainer)
            this.roadConstructionManager.tick();


        if (this.creeps.length > 0)
            this.checkCreeps();
        else
            this.managers.energyHarvestingManager.preTick(this.myRoom);

        this.spawnManager.spawn();

        //this.room.find<Tower>(FIND_MY_STRUCTURES, { filter: (x: Structure) => x.structureType == STRUCTURE_TOWER }).forEach(x => new MyTower(x, this).tick());
        if (_.size(this.myRoom.hostileScan.creeps) > 0)
            _.forEach(this.towers, t => new MyTower(t, this).tick());
        else if (this.towers.length > 0)
            new MyTower(this.towers[0], this).tick();

        this.tickCreeps();

        this.myObserver.tick();

        console.log('MainRoom ' + this.name + ' finished: ' + (Game.cpu.getUsed() - startCpu).toFixed(2) + ' cpu used, ' + Game.cpu.getUsed().toFixed() + ' cpu used total');
    }
}