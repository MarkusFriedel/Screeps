declare class Body implements BodyInterface {
    static getFromBodyArray(parts: BodyPartDefinition[]): Body;
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
    harvestingRate: number;
    isMilitaryDefender: boolean;
    isMilitaryAttacker: boolean;
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
    static staticTracer: Tracer;
    tracer: Tracer;
    constructor(link: Link, mainRoom: MainRoom);
    tick(): void;
}
declare class SpawnManager implements SpawnManagerInterface {
    mainRoom: MainRoomInterface;
    memory: SpawnManagerMemory;
    accessMemory(): SpawnManagerMemory;
    canSpawn: boolean;
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
    function getDefinition(maxEnergy: number, minCarry?: boolean, maxWorkParts?: number): Body;
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
declare namespace EnergyHarvesterDefinition {
    function getDefinition(maxEnergy: number, hasSourceContainer?: boolean, maxWorkParts?: number): Body;
}
declare abstract class MyCreep {
    creep: Creep;
    memory: CreepMemory;
    private _myRoom;
    myRoom: MyRoomInterface;
    haveToFlee: boolean;
    constructor(creep: Creep);
    moveByPath(customPath?: RoomPosition[]): number;
    flee(): void;
    tick(): void;
    abstract myTick(): any;
}
declare class EnergyHarvester extends MyCreep {
    creep: Creep;
    mainRoom: MainRoomInterface;
    memory: EnergyHarvesterMemory;
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
    private reassignMainRoom();
    static staticTracer: Tracer;
    tracer: Tracer;
    constructor(creep: Creep, mainRoom: MainRoomInterface);
    myTick(): void;
}
declare namespace SourceCarrierDefinition {
    function getDefinition(maxEnergy: number, maxCarryParts?: number): Body;
}
declare class SourceCarrier extends MyCreep {
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
    private reassignMainRoom();
    static staticTracer: Tracer;
    tracer: Tracer;
    constructor(creep: Creep, mainRoom: MainRoomInterface);
    pickUpEnergy(): boolean;
    myTick(): void;
}
declare class MemoryObject {
}
declare class EnergyHarvestingManager extends MemoryObject implements EnergyHarvestingManagerInterface {
    mainRoom: MainRoom;
    memory: EnergyHarvestingManagerMemory;
    accessMemory(): EnergyHarvestingManagerMemory;
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
    accessMemory(): TowerManagerMemory;
    _creeps: {
        time: number;
        creeps: Array<Creep>;
    };
    creeps: Array<Creep>;
    constructor(mainRoom: MainRoomInterface);
    checkCreeps(): void;
    tick(): void;
}
declare class MineralHarvester extends MyCreep {
    creep: Creep;
    mainRoom: MainRoomInterface;
    memory: MineralHarvesterMemory;
    _mineral: {
        time: number;
        mineral: Mineral;
    };
    mineral: Mineral;
    _myMineral: {
        time: number;
        myMineral: MyMineralInterface;
    };
    myMineral: MyMineralInterface;
    static staticTracer: Tracer;
    tracer: Tracer;
    constructor(creep: Creep, mainRoom: MainRoomInterface);
    myTick(): void;
}
declare class MineralCarrier extends MyCreep {
    creep: Creep;
    mainRoom: MainRoomInterface;
    memory: MineralCarrierMemory;
    _mineral: {
        time: number;
        mineral: Mineral;
    };
    mineral: Mineral;
    _myMineral: {
        time: number;
        myMineral: MyMineralInterface;
    };
    myMineral: MyMineralInterface;
    static staticTracer: Tracer;
    tracer: Tracer;
    constructor(creep: Creep, mainRoom: MainRoomInterface);
    pickUpMineral(): boolean;
    myTick(): void;
}
declare class MineralHarvestingManager implements MineralHarvestingManagerInterface {
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
declare class TerminalFiller {
    creep: Creep;
    mainRoom: MainRoomInterface;
    private mainContainer;
    private terminal;
    static staticTracer: Tracer;
    tracer: Tracer;
    constructor(creep: Creep, mainRoom: MainRoomInterface);
    private saveBeforeDeath();
    private transferCompounds();
    private transferEnergy();
    tick(): void;
}
declare class TerminalManager implements TerminalManagerInterface {
    mainRoom: MainRoom;
    memory: TerminalManagerMemory;
    accessMemory(): TerminalManagerMemory;
    _creeps: {
        time: number;
        creeps: Array<Creep>;
    };
    creeps: Array<Creep>;
    maxCreeps: number;
    static staticTracer: Tracer;
    tracer: Tracer;
    constructor(mainRoom: MainRoom);
    checkCreeps(): void;
    tick(): void;
    handleTradeAgreements(terminal: Terminal): void;
    handleEnergyBalance(terminal: Terminal): void;
    handleMineralBalance(terminal: Terminal): void;
    send(resource: string, amount: number, destination: string, description?: string): boolean;
    resourceSentOn: number;
    handleTerminal(terminal: Terminal): void;
}
declare class MyLab implements MyLabInterface {
    labManager: LabManagerInterface;
    id: string;
    memory: LabMemory;
    accessMemory(): LabMemory;
    private _connectedLabs;
    connectedLabs: MyLab[];
    private _lab;
    lab: StructureLab;
    static staticTracer: Tracer;
    tracer: Tracer;
    constructor(labManager: LabManagerInterface, id: string);
    backup(): void;
    restore(): void;
    setUpReaction(resource: string): MyLab[];
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
    private pickUp();
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
    freeLabs: MyLab[];
    imports: string[];
    publishs: string[];
    reactions: string[];
    private _publish;
    publish: string[];
    constructor(mainRoom: MainRoomInterface);
    private bestLabForReaction(resource);
    requiredLabsForReaction(resource: string): number;
    reset(): void;
    addReaction(resource: string): MyLabInterface[];
    backup(): void;
    restore(): void;
    addPublish(resource: string): void;
    checkCreeps(): void;
    tick(): void;
}
declare class MyTower {
    tower: Tower;
    mainRoom: MainRoom;
    static staticTracer: Tracer;
    tracer: Tracer;
    constructor(tower: Tower, mainRoom: MainRoom);
    private handleHostiles();
    private handleWounded();
    private repairEmergencies();
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
    private _connectedRooms;
    connectedRooms: MyRoomInterface[];
    private _harvestersShouldDeliver;
    harvestersShouldDeliver: boolean;
    private _dropOffStructure;
    getDropOffStructure(resource: string): Structure;
    private _energyDropOffStructure;
    energyDropOffStructure: Structure;
    allRooms: MyRoomInterface[];
    getResourceAmount(resource: string): number;
    private _sources;
    sources: {
        [id: string]: MySourceInterface;
    };
    invalidateSources(): void;
    private _minerals;
    minerals: {
        [id: string]: MyMineralInterface;
    };
    terminal: StructureTerminal;
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
    private mainContainerId;
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
    private _towerIds;
    private _towers;
    towers: Array<Tower>;
    accessMemory(): MainRoomMemory;
    name: string;
    myRoom: MyRoomInterface;
    mainPosition: RoomPosition;
    spawnManager: SpawnManagerInterface;
    roadConstructionManager: RoadConstructionManagerInterface;
    labManager: LabManagerInterface;
    extensionCount: number;
    links: Array<MyLinkInterface>;
    creepManagers: {
        constructionManager: ConstructionManager;
        repairManager: RepairManager;
        upgradeManager: UpgradeManager;
        spawnFillManager: SpawnFillManager;
        energyHarvestingManager: EnergyHarvestingManager;
        defenseManager: DefenseManager;
        reservationManager: ReservationManager;
        linkFillerManager: LinkFillerManager;
        towerManager: TowerManager;
        terminalManager: TerminalManager;
        mineralHarvestingManager: MineralHarvestingManager;
    };
    constructor(roomName: string);
    placeMainContainer(): void;
    placeStorage(): void;
    checkAndPlaceMainContainer(): Container;
    checkAndPlaceStorage(): Storage | Container;
    checkCreeps(): void;
    tickCreeps(): void;
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
    forbidden: Array<string>;
    private assignments;
    private roomsToAssign;
    private roomFilter(myRoom);
    private rooms;
    private mainRooms;
    constructor();
    private assignRoomsByMinDistance();
    private getMainRoomCandidates();
    private assignCollisions();
    getAssignments(): _.Dictionary<{
        mainRoom: MainRoomInterface;
        metric: number;
        myRooms: MyRoomInterface[];
    }>;
    assignRooms(): void;
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
declare class Army implements ArmyInterface {
    militaryManager: MilitaryManagerInterface;
    id: any;
    memory: ArmyMemory;
    accessMemory(): ArmyMemory;
    constructor(militaryManager: MilitaryManagerInterface, id: any);
}
declare class MilitaryManager implements MilitaryManagerInterface {
    memory: MilitaryManagerMemory;
    accessMemory(): MilitaryManagerMemory;
    private _armies;
    armies: {
        [id: number]: ArmyInterface;
    };
    tick(): void;
}
declare class ReactionManager implements ReactionManagerInterface {
    memory: ReactionManagerMemory;
    accessMemory(): ReactionManagerMemory;
    private labRooms;
    private totalStorage(resource);
    requiredAmount: number;
    private forbiddenCompounds;
    private _publishableCompunds;
    publishableCompounds: string[];
    private _highestPowerCompounds;
    highestPowerCompounds: string[];
    canProvide(resource: string, amount?: number): any;
    private static _BOOSTPOWERS;
    static BOOSTPOWERS: {
        [power: string]: {
            bodyPart: string;
            resources: Array<{
                resource: string;
                factor: number;
            }>;
        };
    };
    private static basicCompounds;
    private static powerPriority;
    private _ingredients;
    ingredients: {
        [output: string]: string[];
    };
    private _highestTierPowers;
    private requiredResources;
    private _availableResources;
    getAvailableResourceAmount(resource: string): number;
    private labManagers;
    registerLabManager(labManager: LabManagerInterface): void;
    private setupPublishs();
    private importCounts;
    private publishCounts;
    private imports;
    private reactions;
    private setupProcess(resource);
    private setupProcessChain(resource);
    private backup();
    private restore();
    private setup();
    tick(): void;
    private sendResourcesUsingTerminals();
}
declare class RoomPos {
    static fromObj(obj: {
        x: number;
        y: number;
        roomName: string;
    }): RoomPosition;
    static equals(pos1: {
        x: number;
        y: number;
        roomName: string;
    }, pos2: {
        x: number;
        y: number;
        roomName: string;
    }): boolean;
    static isOnEdge(pos: {
        x: number;
        y: number;
        roomName: string;
    }): boolean;
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
    pos: RoomPosition;
    maxHarvestingSpots: number;
    hasKeeper: boolean;
    roadBuiltToRoom: string;
    _pathLengthToMainContainer: {
        time: number;
        length: number;
    };
    pathLengthToMainContainer: number;
    private _capacityLastFresh;
    capacity: number;
    private _link;
    link: StructureLink;
    constructor(id: string, myRoom: MyRoom);
    getHarvestingSpots(source: any): number;
}
declare class MyMineral implements MyMineralInterface {
    myRoom: MyRoom;
    id: string;
    private memory;
    static staticTracer: Tracer;
    tracer: Tracer;
    private accessMemory();
    constructor(myRoom: MyRoom, id: string);
    room: Room;
    mineral: Mineral;
    private _pos;
    pos: RoomPosition;
    hasKeeper: boolean;
    roadBuiltToTerminal: string;
    _pathLengthToTerminal: {
        time: number;
        length: number;
    };
    pathLengthToTerminal: number;
    amount: number;
    refreshTime: number;
    hasExtractor: boolean;
    resource: string;
}
declare class MyContainer implements MyContainerInterface {
    id: string;
    myRoom: MyRoom;
    memory: MyContainerMemory;
    accessMemory(): MyContainerMemory;
    constructor(id: string, myRoom: MyRoom);
}
declare class BodyInfo implements BodyInfoInterface {
    parts: BodyPartDefinition[];
    constructor(parts: BodyPartDefinition[]);
    private _attackRate;
    attackRate: number;
    private _rangedAttackRate;
    rangedAttackRate: number;
    totalAttackRate: number;
    private _healRate;
    healRate: number;
    private _damageRate;
    damageRate: number;
    private _toughAmount;
    toughAmount: number;
}
declare class CreepInfo implements CreepInfoInterface {
    id: string;
    hostileScan: HostileScanInterface;
    memory: CreepInfoMemory;
    private accessMemory();
    bodyParts: BodyPartDefinition[];
    private _creep;
    creep: Creep;
    private _bodyInfo;
    bodyInfo: BodyInfo;
    hits: number;
    hitsMax: number;
    my: boolean;
    owner: string;
    private _roomPosition;
    pos: RoomPosition;
    ticksToLive: number;
    constructor(id: string, hostileScan: HostileScanInterface);
}
declare class HostileScan implements HostileScanInterface {
    myRoom: MyRoomInterface;
    memory: HostileScanMemory;
    private accessMemory();
    scanTime: number;
    private _creeps;
    creeps: {
        [id: string]: CreepInfoInterface;
    };
    refreshCreeps(): void;
    constructor(myRoom: MyRoomInterface);
}
declare class MyRoom implements MyRoomInterface {
    name: string;
    memory: MyRoomMemory;
    private accessMemory();
    static staticTracer: Tracer;
    tracer: Tracer;
    hostileScan: HostileScanInterface;
    private _repairStructures;
    repairStructures: Structure[];
    private _emergencyRepairs;
    emergencyRepairs: Structure[];
    private _resourceDrops;
    resourceDrops: Resource[];
    private _room;
    room: Room;
    hasController: boolean;
    private _myContainers;
    myContainers: {
        [id: string]: MyContainerInterface;
    };
    canHarvest: boolean;
    myMineral: MyMineralInterface;
    private _mySources;
    mySources: {
        [id: string]: MySourceInterface;
    };
    useableSources: MySourceInterface[];
    private _mainRoom;
    mainRoom: MainRoomInterface;
    exitNames: Array<string>;
    private _exits;
    exits: ExitDescription;
    constructor(name: string);
    private _creepAvoidanceMatrix;
    creepAvoidanceMatrix: CostMatrix;
    private _travelMatrix;
    travelMatrix: CostMatrix;
    private createTravelMatrix();
    requiresDefense: boolean;
    closestMainRoom: MainRoomInterface;
    refresh(): void;
}
declare class Scout extends MyCreep {
    memory: ScoutMemory;
    constructor(creep: Creep);
    myTick(): void;
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
    var militaryManager: MilitaryManagerInterface;
    function getRoom(roomName: string): MyRoomInterface;
    function getCreepAvoidanceMatrix(roomName: string): CostMatrix;
    function getTravelMatrix(roomName: string): CostMatrix;
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
