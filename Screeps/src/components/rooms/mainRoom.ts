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
/// <reference path="./powerManager.ts" />
/// <reference path="./nukeManager.ts" />


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
            if (this.memory.connectedRooms == null)
                this.memory.connectedRooms = _.map(_.filter(Colony.memory.rooms, r => r.mrn == this.name), r => r.name);
        //}
        //this._connectedRooms = { time: Game.time, rooms: _.map(this.memory.connectedRooms, r => Colony.getRoom(r)) }

        //this._connectedRooms = { time: Game.time, rooms: _.filter(_.map(Colony.memory.rooms, r => Colony.getRoom(r.name)), (r) => r.name != this.name && r.mainRoom && r.mainRoom.name == this.name) }
        this._connectedRooms = { time: Game.time, rooms: _.map(_.filter(Colony.memory.rooms, (r) => r.name != this.name && r.mrn == this.name), r => Colony.getRoom(r.name)) }
        return this._connectedRooms.rooms;
    }

    private _loadHarvestersShouldDeliver() {
        if (this._harvestersShouldDeliver == null || this._harvestersShouldDeliver.time + 10 < Game.time)
            this._harvestersShouldDeliver = {
                time: Game.time,
                value: !this.mainContainer || (this.managers.energyHarvestingManager.sourceCarrierCreeps.length == 0 && this.mainContainer.store.energy < this.maxSpawnEnergy) || (this.managers.spawnFillManager.creeps.length == 0 && this.room.energyAvailable < 500)
            };
    }

    private _harvestersShouldDeliver: { time: number, value: boolean };
    public get harvestersShouldDeliver() {
        this._loadHarvestersShouldDeliver();

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

    private _harvestingSites: { [id: string]: HarvestingSiteInterface };
    public get harvestingSites() {
        if (this._harvestingSites == null)
            this._harvestingSites = _.indexBy(_.values<HarvestingSiteInterface>(this.minerals).concat(_.values<HarvestingSiteInterface>(this.sources)), harvestingSite => harvestingSite.id);
        return this._harvestingSites;
    }

    private _minerals: { [id: string]: MyMineralInterface }
    public get minerals() {
        if (this._minerals == null)
            this._minerals = _.indexBy(_.map(_.filter(this.allRooms, room => room.myMineral), room => room.myMineral), myMineral => myMineral.id);
        return this._minerals;
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


    public get terminal() {
        return this.room.terminal;
    }


    _maxSpawnEnergy: { time: number, maxSpawnEnergy: number } = { time: -101, maxSpawnEnergy: 300 };
    public get maxSpawnEnergy(): number {
        if (this.mainContainer == null || this.managers.spawnFillManager.creeps.length == 0 || this.mainContainer.store.energy == 0 && this.managers.energyHarvestingManager.harvesterCreeps.length == 0) {
            return 300;
        }
        return this.room.energyCapacityAvailable;
    }



    private _creeps: { time: number, creeps: Array<Creep> };
    private _creeps_get(): Array<Creep> {
        if (this._creeps == null || this._creeps.time < Game.time)
            this._creeps = {
                time: Game.time, creeps: Colony.getCreeps(this.name)
            };
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

    private _nuker: { time: number, nuker: StructureNuker };
    public get nuker() {
        if (this._nuker == null || this._nuker.time < Game.time) {
            if (this.memory.nukerId && this.memory.nukerId.id) {
                var nuker = Game.getObjectById<StructureNuker>(this.memory.nukerId.id);
                if (!nuker)
                    this.memory.nukerId = { time: Game.time, id: null };
            }
            else if (!this.memory.nukerId || this.memory.nukerId.time + 100 < Game.time) {
                nuker = this.room.find<StructureNuker>(FIND_MY_STRUCTURES, { filter: (s: Structure) => s.structureType == STRUCTURE_NUKER })[0];
                this.memory.nukerId = { time: Game.time, id: nuker ? nuker.id : null };
            }
            this._nuker = { time: Game.time, nuker: nuker };
        }
        return this._nuker.nuker;
    }

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
        carrierManager: CarrierManager,
        powerManager: PowerManager,
        nukeManager: NukeManager
    }



    constructor(roomName: string) {
        if (myMemory['profilerActive']) {
            this.creepsByRole = profiler.registerFN(this.creepsByRole, 'MainRoom.creepsByRole');
            this.tick = profiler.registerFN(this.tick, 'MainRoom.tick');
            this.tickCreeps = profiler.registerFN(this.tickCreeps, 'MainRoom.tickCreeps');
            this.checkCreeps = profiler.registerFN(this.checkCreeps, 'MainRoom.checkCreeps');
            this._creeps_get = profiler.registerFN(this._creeps_get, 'MainRoom._creeps_get');
            this._loadHarvestersShouldDeliver = profiler.registerFN(this._loadHarvestersShouldDeliver, 'MainRoom.harvestersShouldDeliver');
        }

        this.name = roomName;
        this.myRoom = Colony.getRoom(roomName);
        this.myRoom.mainRoom = this;
        if (this.myRoom.memory.mrd == null)
            this.myRoom.memory.mrd = {};
        this.myRoom.memory.mrd[this.name] = { n: this.name, d: 0 };

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
            carrierManager: new CarrierManager(this),
            powerManager: new PowerManager(this),
            nukeManager: new NukeManager(this)
        }

        if (!this.memory.roadConstructionManager)
            this.memory.roadConstructionManager = null;
        this.roadConstructionManager = new RoadConstructionManager(this);
    }



    placeMainContainer() {
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
        if (this.myRoom.requiresDefense && this.room.controller.level < 3)
            return;

        if (this.room.controller.ticksToDowngrade < 2000)
            this.managers.upgradeManager.preTick();
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
            this.managers.defenseManager.preTick();
            if (this.mainContainer && this.mainContainer.store.energy > 10000 && this.managers.upgradeManager.creeps.length == 0)
                this.managers.upgradeManager.preTick();
            if (!this.myRoom.requiresDefense)
                _.forEach(_.sortByOrder(_.filter(this.allRooms, r => !r.requiresDefense), [r => _.any(r.mySources, s => s.hasKeeper ? 1 : 0), r => r.memory.mrd[this.name].d, r => _.size(r.mySources)], ['asc', 'asc', 'desc']), myRoom => {
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

        

        this.managers.constructionManager.preTick();

        if (this.managers.upgradeManager.creeps.length > 0)
            this.managers.upgradeManager.preTick();

        this.managers.carrierManager.preTick();

        this.managers.nukeManager.preTick();
    }

    tickCreeps() {
        this.managers.energyHarvestingManager.tick();
        this.managers.repairManager.tick();
        this.managers.constructionManager.tick();

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

        this.managers.nukeManager.tick();
    }

    public tick() {
        let startCpu = Game.cpu.getUsed();
        console.log();
        console.log('MainRoom ' + this.name + ': ' + this.creeps.length + ' creeps');

        //_.forEach(this.allRooms, r => console.log('&nbsp;Room: ' + r.name + ': RepairTargets: ' + _.size(r.repairStructures)));


        if (this.room == null) {
            return;
        }
        try {
            this.links.forEach(x => x.tick());
        }
        catch (e) {
            console.log(e.stack);
        }

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