declare class Body implements BodyInterface {
    static getFromCreep(creep: Creep): Body;
    costs: number;
    move: number;
    work: number;
    attack: number;
    carry: number;
    heal: number;
    ranged_attack: number;
    tough: number;
    claim: number;
    getHarvestingRate(): number;
    isMilitary(): boolean;
    getBody(): string[];
}
declare class MyLink implements MyLinkInterface {
    mainRoom: MainRoom;
    _link: {
        time: number;
        link: Link;
    };
    link: Link;
    nearSource: boolean;
    nextToStorage: boolean;
    nextToTower: boolean;
    nearController: boolean;
    drain: boolean;
    fill: boolean;
    minLevel: number;
    maxLevel: number;
    id: string;
    constructor(link: Link, mainRoom: MainRoom);
    tick(): void;
}
declare class SpawnManager implements SpawnManagerInterface {
    mainRoom: MainRoomInterface;
    memory: SpawnManagerMemory;
    accessMemory(): SpawnManagerMemory;
    isBusy: boolean;
    _spawns: {
        time: number;
        spawns: Array<Spawn>;
    };
    spawns: Array<Spawn>;
    queue: SpawnQueueItem[];
    isIdle: boolean;
    constructor(mainRoom: MainRoomInterface, memory: SpawnManagerMemory);
    addToQueue(body: string[], memory: any, count?: number, priority?: boolean): void;
    spawn(): void;
}
declare namespace ConstructorDefinition {
    function getDefinition(maxEnergy: number): Body;
}
declare class Constructor {
    creep: Creep;
    mainRoom: MainRoomInterface;
    memory: ConstructorMemory;
    target: ConstructionSite;
    targetPosition: RoomPosition;
    constructor(creep: Creep, mainRoom: MainRoomInterface);
    construct(): void;
    upgrade(): void;
    tick(): void;
}
declare class ConstructionManager implements ConstructionManagerInterface {
    mainRoom: MainRoom;
    _creeps: {
        time: number;
        creeps: Array<Creep>;
    };
    creeps: Array<Creep>;
    _idleCreeps: {
        time: number;
        creeps: Array<Creep>;
    };
    idleCreeps: Array<Creep>;
    maxCreeps: number;
    constructor(mainRoom: MainRoom);
    private _constructions;
    constructions: ConstructionSite[];
    checkCreeps(): void;
    tick(): void;
}
declare namespace RepairerDefinition {
    function getDefinition(maxEnergy: number): Body;
}
declare class Repairer {
    creep: Creep;
    mainRoom: MainRoom;
    memory: RepairerMemory;
    constructor(creep: Creep, mainRoom: MainRoom);
    getEmergencyTarget(): Structure;
    tick(): void;
}
declare class RepairManager implements RepairManagerInterface {
    mainRoom: MainRoom;
    memory: RepairManagerMemory;
    accessMemory(): RepairManagerMemory;
    _creeps: {
        time: number;
        creeps: Array<Creep>;
    };
    creeps: Array<Creep>;
    _idleCreeps: {
        time: number;
        creeps: Array<Creep>;
    };
    idleCreeps: Array<Creep>;
    static forceStopRepairDelegate(s: Structure): boolean;
    static targetDelegate(s: Structure): boolean;
    static emergencyTargetDelegate(s: Structure): boolean;
    static emergencyStopDelegate(s: Structure): boolean;
    maxCreeps: number;
    constructor(mainRoom: MainRoom);
    createNewRepairers(): void;
    tick(): void;
}
declare namespace UpgraderDefinition {
    function getDefinition(maxEnergy: number, minCarry?: boolean): Body;
}
declare class Upgrader {
    creep: Creep;
    mainRoom: MainRoom;
    constructor(creep: Creep, mainRoom: MainRoom);
    upgrade(): void;
    tick(): void;
}
declare class UpgradeManager implements UpgradeManagerInterface {
    mainRoom: MainRoom;
    _creeps: {
        time: number;
        creeps: Array<Creep>;
    };
    creeps: Array<Creep>;
    constructor(mainRoom: MainRoom);
    checkCreeps(): void;
    tick(): void;
}
declare namespace SpawnFillerDefinition {
    function getDefinition(maxEnergy: number): Body;
}
declare class SpawnFiller {
    creep: Creep;
    mainRoom: MainRoomInterface;
    constructor(creep: Creep, mainRoom: MainRoomInterface);
    refill(): void;
    tick(): void;
}
declare class SpawnFillManager implements SpawnFillManagerInterface {
    mainRoom: MainRoom;
    _creeps: {
        time: number;
        creeps: Array<Creep>;
    };
    creeps: Array<Creep>;
    constructor(mainRoom: MainRoom);
    checkCreeps(): void;
    tick(): void;
}
declare namespace HarvesterDefinition {
    function getDefinition(maxEnergy: number, hasSourceContainer?: boolean, maxWorkParts?: number): Body;
}
declare class Harvester {
    creep: Creep;
    mainRoom: MainRoomInterface;
    memory: HarvesterMemory;
    _source: {
        time: number;
        source: Source;
    };
    source: Source;
    _mySource: {
        time: number;
        mySource: MySourceInterface;
    };
    mySource: MySourceInterface;
    constructor(creep: Creep, mainRoom: MainRoomInterface);
    deliver(dontMove?: boolean): void;
    harvest(): void;
    construct(): void;
    repair(): void;
    shouldRepair(): boolean;
    tick(): void;
}
declare namespace SourceCarrierDefinition {
    function getDefinition(maxEnergy: number, maxCarryParts?: number): Body;
}
declare class SourceCarrier {
    creep: Creep;
    mainRoom: MainRoomInterface;
    memory: SourceCarrierMemory;
    _source: {
        time: number;
        source: Source;
    };
    source: Source;
    _mySource: {
        time: number;
        mySource: MySourceInterface;
    };
    mySource: MySourceInterface;
    constructor(creep: Creep, mainRoom: MainRoomInterface);
    pickUp(): void;
    deliver(): void;
    tick(): void;
}
declare class MemoryObject {
}
declare class HarvestingManager extends MemoryObject implements HarvestingManagerInterface {
    mainRoom: MainRoom;
    memory: HarvestingManagerMemory;
    accessMemory(): HarvestingManagerMemory;
    _harvesterCreeps: {
        time: number;
        creeps: Array<Creep>;
    };
    harvesterCreeps: Array<Creep>;
    _sourceCarrierCreeps: {
        time: number;
        creeps: Array<Creep>;
    };
    sourceCarrierCreeps: Array<Creep>;
    constructor(mainRoom: MainRoom);
    placeSourceContainers(): void;
    getHarvesterBodyAndCount(sourceInfo: MySourceInterface, noLocalRestriction?: boolean): {
        body: Body;
        count: number;
    };
    getSourceCarrierBodyAndCount(sourceInfo: MySourceInterface, maxMiningRate?: number): {
        body: Body;
        count: number;
    };
    checkCreeps(): void;
    tick(): void;
}
declare namespace DefenderDefinition {
    function getDefinition(maxEnergy: number): Body;
}
declare class Defender {
    creep: Creep;
    mainRoom: MainRoomInterface;
    memory: DefenderMemory;
    constructor(creep: Creep, mainRoom: MainRoomInterface);
    tick(): void;
}
declare class DefenseManager implements DefenseManagerInterface {
    mainRoom: MainRoom;
    _creeps: {
        time: number;
        creeps: Array<Creep>;
    };
    creeps: Array<Creep>;
    maxCreeps: number;
    constructor(mainRoom: MainRoom);
    checkCreeps(): void;
    tick(): void;
}
declare class Reserver {
    creep: Creep;
    mainRoom: MainRoom;
    memory: ReserverMemory;
    constructor(creep: Creep, mainRoom: MainRoom);
    tick(): void;
}
declare class ReservationManager implements ReservationManagerInterface {
    mainRoom: MainRoom;
    _creeps: {
        time: number;
        creeps: Array<Creep>;
    };
    creeps: Array<Creep>;
    constructor(mainRoom: MainRoom);
    checkCreeps(): void;
    tick(): void;
}
declare namespace LinkFillerDefinition {
    function getDefinition(): Body;
}
declare class LinkFiller {
    creep: Creep;
    mainRoom: MainRoom;
    constructor(creep: Creep, mainRoom: MainRoom);
    tick(): void;
}
declare class LinkFillerManager implements LinkFillerManagerInterface {
    mainRoom: MainRoom;
    _creeps: {
        time: number;
        creeps: Array<Creep>;
    };
    creeps: Array<Creep>;
    constructor(mainRoom: MainRoom);
    checkCreeps(): void;
    tick(): void;
}
declare class RoadConstructionManager implements RoadConstructionManagerInterface {
    mainRoom: MainRoom;
    memory: RoadConstructionManagerMemory;
    accessMemory(): RoadConstructionManagerMemory;
    constructor(mainRoom: MainRoom);
    buildExtensionRoads(): void;
    constructRoad(path: RoomPosition[], startIdx?: number, endIdx?: any): void;
    buildHarvestPaths(): void;
    buildControllerRoad(): void;
    tick(): void;
}
declare namespace TowerFillerDefinition {
    function getDefinition(maxEnergy: number): Body;
}
declare class TowerFiller {
    creep: Creep;
    mainRoom: MainRoomInterface;
    constructor(creep: Creep, mainRoom: MainRoomInterface);
    tick(): void;
}
declare class TowerManager implements TowerManagerInterface {
    mainRoom: MainRoomInterface;
    memory: TowerManagerMemory;
    accessMemory(): HarvestingManagerMemory;
    _creeps: {
        time: number;
        creeps: Array<Creep>;
    };
    creeps: Array<Creep>;
    constructor(mainRoom: MainRoomInterface);
    checkCreeps(): void;
    tick(): void;
}
declare class MineralHarvester {
    creep: Creep;
    mainRoom: MainRoomInterface;
    memory: MineralHarvesterMemory;
    constructor(creep: Creep, mainRoom: MainRoomInterface);
    tick(): void;
}
declare class MineralCarrier {
    creep: Creep;
    mainRoom: MainRoomInterface;
    memory: MineralCarrierMemory;
    constructor(creep: Creep, mainRoom: MainRoomInterface);
    tick(): void;
}
declare class MineralHarvestingManager {
    mainRoom: MainRoomInterface;
    _harvesterCreeps: {
        time: number;
        creeps: Array<Creep>;
    };
    harvesterCreeps: Array<Creep>;
    _carrierCreeps: {
        time: number;
        creeps: Array<Creep>;
    };
    carrierCreeps: Array<Creep>;
    constructor(mainRoom: MainRoomInterface);
    checkCreeps(): void;
    tick(): void;
}
declare namespace TerminalFillerDefinition {
    function getDefinition(maxEnergy: number): Body;
}
declare class TerminalManager implements TerminalManagerInterface {
    mainRoom: MainRoom;
    _creeps: {
        time: number;
        creeps: Array<Creep>;
    };
    creeps: Array<Creep>;
    maxCreeps: number;
    constructor(mainRoom: MainRoom);
    checkCreeps(): void;
    tick(): void;
    handleTerminal(terminal: Terminal): void;
    handleCreep(creep: Creep): void;
}
declare class MyLab {
    labManager: LabManagerInterface;
    id: string;
    memory: LabMemory;
    accessMemory(): LabMemory;
    private _connectedLabs;
    connectedLabs: MyLab[];
    private _lab;
    lab: StructureLab;
    constructor(labManager: LabManagerInterface, id: string);
    setUpReaction(resource: string): any;
    reset(): void;
    requiredLabsForReaction(resource: string): number;
    tick(): void;
}
declare namespace LabCarrierDefinition {
    function getDefinition(maxEnergy: number): Body;
}
declare class LabCarrier {
    creep: Creep;
    labManager: LabManagerInterface;
    constructor(creep: Creep, labManager: LabManagerInterface);
    private dropOffEnergy();
    private dropOffResource();
    tick(): void;
}
declare class LabManager implements LabManagerInterface {
    mainRoom: MainRoomInterface;
    memory: LabManagerMemory;
    accessMemory(): LabManagerMemory;
    _creeps: {
        time: number;
        creeps: Array<Creep>;
    };
    creeps: Array<Creep>;
    private _myLabs;
    myLabs: {
        [id: string]: MyLab;
    };
    imports: string[];
    reactions: string[];
    private _publish;
    publish: string[];
    constructor(mainRoom: MainRoomInterface);
    private bestLabForReaction(resource);
    requiredLabsForReaction(resource: string): number;
    reset(): void;
    addReaction(resource: string): void;
    setupPublishs(): void;
    private checkCreeps();
    tick(): void;
}
declare class MyTower {
    tower: Tower;
    mainRoom: MainRoom;
    constructor(tower: Tower, mainRoom: MainRoom);
    tick(): void;
}
declare class TraceResult {
    usedCpu: number;
    startCPU: number;
    count: number;
    name: string;
    stop(): void;
}
declare class Tracer {
    name: string;
    private results;
    constructor(name: string);
    start(name: string): TraceResult;
    print(): void;
    reset(): void;
}
declare class MainRoom implements MainRoomInterface {
    memory: MainRoomMemory;
    static staticTracer: Tracer;
    tracer: Tracer;
    private _room;
    room: Room;
    _mineralId: string;
    _mineral: {
        time: number;
        mineral: Mineral;
    };
    mineral: Mineral;
    private _extractor;
    extractor: StructureExtractor;
    terminal: StructureTerminal;
    _extractorContainer: {
        time: number;
        container: Container;
    };
    extractorContainer: StructureContainer;
    _maxSpawnEnergy: {
        time: number;
        maxSpawnEnergy: number;
    };
    maxSpawnEnergy: number;
    _creeps: {
        time: number;
        creeps: Array<Creep>;
    };
    creeps: Array<Creep>;
    _mainContainerId: string;
    _mainContainer: {
        time: number;
        mainContainer: Container | Storage;
    };
    mainContainer: Container | Storage;
    _spawns: {
        time: number;
        spawns: Array<Spawn>;
    };
    spawns: Array<Spawn>;
    _towers: {
        time: number;
        towers: Array<Tower>;
    };
    towers: Array<Tower>;
    accessMemory(): MainRoomMemory;
    name: string;
    myRoom: MyRoomInterface;
    connectedRooms: Array<MyRoomInterface>;
    allRooms: Array<MyRoomInterface>;
    mainPosition: RoomPosition;
    spawnManager: SpawnManagerInterface;
    roadConstructionManager: RoadConstructionManagerInterface;
    labManager: LabManagerInterface;
    extensionCount: number;
    links: Array<MyLinkInterface>;
    sources: {
        [id: string]: MySourceInterface;
    };
    creepManagers: {
        constructionManager: ConstructionManager;
        repairManager: RepairManager;
        upgradeManager: UpgradeManager;
        spawnFillManager: SpawnFillManager;
        harvestingManager: HarvestingManager;
        defenseManager: DefenseManager;
        reservationManager: ReservationManager;
        linkFillerManager: LinkFillerManager;
        towerManager: TowerManager;
        terminalManager: TerminalManager;
        mineralHarvestingManager: MineralHarvestingManager;
    };
    constructor(roomName: string);
    getMaxSpawnEnergy(): number;
    getAllSources(): _.Dictionary<MySourceInterface>;
    update(runAll?: boolean): void;
    placeExtensions(): void;
    placeMainContainer(): void;
    placeStorage(): void;
    checkAndPlaceMainContainer(): Container;
    checkAndPlaceStorage(): Storage | Container;
    checkCreeps(): void;
    tickCreeps(): void;
    tick(): void;
}
declare class ClaimingManager implements ClaimingManagerInterface {
    targetPosition: RoomPosition;
    memory: ClaimingManagerMemory;
    accessMemory(): ClaimingManagerMemory;
    creeps: Array<Creep>;
    scouts: Array<Creep>;
    spawnConstructors: Array<Creep>;
    claimers: Array<Creep>;
    roomName: string;
    spawnConstructionSite: ConstructionSite;
    constructor(targetPosition: RoomPosition);
    tickSpawnConstructors(creep: Creep): void;
    tickClaimer(creep: Creep): void;
    checkScouts(myRoom: MyRoomInterface): boolean;
    checkClaimer(myRoom: MyRoomInterface): boolean;
    checkSpawnConstructors(myRoom: MyRoomInterface): boolean;
    finishClaimingManager(): void;
    tick(): void;
}
declare class Invader {
    creep: Creep;
    memory: InvaderMemory;
    isWarrior: boolean;
    isWorker: boolean;
    constructor(creep: Creep);
    attack(target: any): boolean;
    dismantle(target: any): boolean;
    tick(): void;
}
declare class InvasionManager implements InvasionManagerInterface {
    roomName: any;
    memory: InvasionManagerMemory;
    accessMemory(): InvasionManagerMemory;
    creeps: Array<Creep>;
    scouts: Array<Creep>;
    invaders: Array<Creep>;
    dismantlers: Array<Creep>;
    constructor(roomName: any);
    checkScouts(myRoom: MyRoomInterface): boolean;
    checkInvaders(myRoom: MyRoomInterface, rallyFlag: Flag): boolean;
    checkDismantlers(myRoom: MyRoomInterface, rallyFlag: Flag): boolean;
    endInvasion(rallyFlag: Flag): void;
    tick(): void;
}
declare var METRICSOURCEDISTANCE: number;
declare var METRICSOURCE: number;
declare var METRICROOM: number;
declare var MAXMETRIC: number;
declare var MAXDISTANCE: number;
declare class RoomAssignment implements RoomAssignmentInterface {
    mainRoom: MainRoomInterface;
    assignedRooms: Array<MyRoomInterface>;
    metric: number;
    maxMetric: number;
    freeMetric: number;
    constructor(mainRoom: MainRoomInterface);
    canAssignRoom(myRoom: MyRoomInterface): boolean;
    tryAddRoom(myRoom: MyRoomInterface): boolean;
    calculateMetricFor(myRoom: MyRoomInterface): number;
}
declare class RoomAssignmentHandler implements RoomAssignmentHandlerInterface {
    mainRooms: {
        [roomName: string]: MainRoomInterface;
    };
    forbidden: Array<string>;
    private assignments;
    private roomsToAssign;
    private roomFilter(myRoom);
    constructor(rooms: {
        [roomName: string]: MyRoomInterface;
    }, mainRooms: {
        [roomName: string]: MainRoomInterface;
    });
    private assignRoomsByMinDistance();
    private getMainRoomCandidates();
    private assignCollisions();
    getAssignments(): _.Dictionary<{
        mainRoom: MainRoomInterface;
        metric: number;
        myRooms: MyRoomInterface[];
    }>;
}
declare class ReactionManager implements ReactionManagerInterface {
    private _ingredients;
    ingredients: {
        [output: string]: string[];
    };
    private requiredResources;
    canProduce(resource: string): any;
    private _availableResources;
    getAvailableResourceAmount(resource: string): number;
    private labManagers;
    registerLabManager(labManager: LabManagerInterface): void;
    private setupPublishs();
    private imports;
    private reactions;
    private setupProcess();
    private setupTime;
    private setup();
    tick(): void;
}
declare class RoomPos {
    static fromObj(obj: {
        x: number;
        y: number;
        roomName: string;
    }): RoomPosition;
}
declare class MySourceMemory implements MySourceMemoryInterface {
    id: string;
    pos: RoomPositionMemory;
    energyCapacity: number;
    keeper: boolean;
    harvestingSpots: number;
    mainContainerRoadBuiltTo: string;
    mainContainerPathLength: number;
    hasSourceDropOff: boolean;
    hasLink: boolean;
    dropOffStructure: cachedProperty<{
        id: string;
        pos: RoomPosition;
    }>;
    sourceDropOffContainer: cachedProperty<{
        id: string;
        pos: RoomPosition;
    }>;
}
declare class MySource implements MySourceInterface {
    id: string;
    myRoom: MyRoom;
    private memory;
    static staticTracer: Tracer;
    private memoryInitialized;
    tracer: Tracer;
    private accessMemory();
    private _room;
    room: Room;
    private _source;
    source: Source;
    private _sourceDropOffContainer;
    sourceDropOffContainer: {
        id: string;
        pos: RoomPosition;
    };
    private _dropOffStructre;
    dropOffStructure: {
        id: string;
        pos: RoomPosition;
    };
    private _nearByConstructionSite;
    nearByConstructionSite: ConstructionSite;
    pos: RoomPosition;
    maxHarvestingSpots: number;
    hasKeeper: boolean;
    roadBuiltToMainContainer: string;
    _pathLengthToMainContainer: {
        time: number;
        length: number;
    };
    pathLengthToMainContainer: number;
    _requiresCarrier: {
        time: number;
        value: boolean;
    };
    requiresCarrier: boolean;
    energyCapacity: number;
    hasLink: boolean;
    constructor(id: string, myRoom: MyRoom);
    getHarvestingSpots(source: any): number;
    containerMissing: boolean;
    private getSourceDropOffContainer();
    private getDropOffStructure();
}
declare class MyContainer implements MyContainerInterface {
    id: string;
    myRoom: MyRoom;
    memory: MyContainerMemory;
    accessMemory(): MyContainerMemory;
    constructor(id: string, myRoom: MyRoom);
}
declare class MyRoom implements MyRoomInterface {
    name: string;
    memory: MyRoomMemory;
    static staticTracer: Tracer;
    tracer: Tracer;
    _room: {
        time: number;
        room: Room;
    };
    room: Room;
    _myContainers: {
        time: number;
        myContainers: {
            [id: string]: MyContainerInterface;
        };
    };
    myContainers: {
        [id: string]: MyContainerInterface;
    };
    canHarvest: boolean;
    private _mySources;
    mySources: {
        [id: string]: MySourceInterface;
    };
    useableSources: MySourceInterface[];
    private _mainRoom;
    mainRoom: MainRoomInterface;
    accessMemory(): MyRoomMemory;
    exitNames: Array<string>;
    exits: ExitDescription;
    constructor(name: string);
    closestMainRoom: MainRoomInterface;
    scan(): void;
    scanForHostiles(): void;
}
declare class Scout {
    creep: Creep;
    memory: ScoutMemory;
    constructor(creep: Creep);
    tick(): void;
}
declare namespace Colony {
    var tracers: Array<Tracer>;
    var myName: any;
    var memory: ColonyMemory;
    var mainRooms: {
        [roomName: string]: MainRoomInterface;
    };
    var rooms: {
        [roomName: string]: MyRoomInterface;
    };
    var claimingManagers: {
        [roomName: string]: ClaimingManagerInterface;
    };
    var invasionManagers: {
        [roomName: string]: InvasionManagerInterface;
    };
    var reactionManager: ReactionManagerInterface;
    function getRoom(roomName: string): MyRoomInterface;
    function assignMainRoom(room: MyRoomInterface): MainRoomInterface;
    function spawnCreep(requestRoom: MyRoomInterface, body: BodyInterface, memory: any, count?: number): boolean;
    function createScouts(): void;
    function requestCreep(): void;
    function initialize(memory: ColonyMemory): void;
    function tick(): void;
}
/**
 * Singleton object.
 * Since singleton classes are considered anti-pattern in Typescript, we can effectively use namespaces.
 * Namespace's are like internal modules in your Typescript application. Since GameManager doesn't need multiple instances
 * we can use it as singleton.
 */
declare namespace GameManager {
    function globalBootstrap(): void;
    function loop(): void;
}
declare function require(string: any): any;
/**
 * Application bootstrap.
 * BEFORE CHANGING THIS FILE, make sure you read this:
 * http://support.screeps.com/hc/en-us/articles/204825672-New-main-loop-architecture
 *
 * Write your code to GameManager class in ./src/start/game-manager.ts
 */
declare var module: any;
declare var profiler: any;
