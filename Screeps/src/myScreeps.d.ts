declare var STRUCTURE_PORTAL: string;

declare var BODYPARTS_ALL: Array<string>;

interface IStructure {
    id: String;
    pos: Room;
    room: string;
    hits: number;
    hitsMax: number;
}

interface cachedProperty<T> {
    time: number;
    value: T;
}

interface ColonyMemory {
    mainRooms: {
        [roomName: string]: MainRoomMemory;
    }
    rooms: {
        [roomName: string]: MyRoomMemory;
    }
    claimingManagers: {
        [roomName: string]: ClaimingManagerMemory;
    }
    invasionManagers: {
        [roomName: string]: InvasionManagerMemory;
    }
    reactionManager: ReactionManagerMemory;
    militaryManager: MilitaryManagerMemory;
    traceThreshold: number;
}

interface ReactionManagerMemory {
    setupTime: number;
}

interface TowerManagerMemory {

}


interface MainRoomMemory {
    name: string;
    mainPosition: RoomPositionMemory;
    spawnManager: SpawnManagerMemory;
    constructionManager: ConstructionManagerMemory;
    repairManager: RepairManagerMemory;
    upgradeManager: UpgradeManagerMemory;
    spawnFillManager: SpawnFillManagerMemory;
    energyHarvestingManager: EnergyHarvestingManagerMemory;
    defenseManager: DefenseManagerMemory;
    reservationManager: ReservationManagerMemory;
    roadConstructionManager: RoadConstructionManagerMemory;
    towerManager: TowerManagerMemory;
    mainContainerId: { time: number, id: string };
    labManager: LabManagerMemory;
    terminalManager: TerminalManagerMemory;
    extractorContainerId: { time: number, id: string };
    myObserver: MyObserverMemory;
}

interface RoomPositionMemory {
    x: number;
    y: number;
    roomName: string;
}

interface LabManagerMemory {
    labs: { [id: string]: LabMemory };
}

interface MyMineralMemory {
    id: string;
    pos: RoomPositionMemory;
    amount: number;
    refreshTime: number;
    keeper: boolean;
    terminalRoadBuiltTo: string;
    //containerId: { time: number, id: string };
    pathLengthToTerminal: { time: number, length: number };
    resource: string;
    hasExtractor: { time: number, hasExtractor: boolean };
}

interface MySourceMemory {
    id: string;
    pos: RoomPositionMemory;
    capacity: number;
    keeper: boolean;
    harvestingSpots: number;
    roadBuiltToRoom: string;
    //hasSourceDropOff: boolean;
    linkId: { time: number, id: string };
    //dropOffStructure: cachedProperty<{ id: string, pos: RoomPosition }>;
    //sourceDropOffContainer: cachedProperty<{ id: string, pos: RoomPosition }>;
    pathLengthToMainContainer: { time: number, length: number };
}

interface MyContainerMemory {
    id: string;
    pos: RoomPositionMemory;
    lastScanTime: number;
}

interface MyRoomMemory {
    name: string;
    lastScanTime: number;
    sources: {
        [id: string]: MySourceMemory;
    }
    containers: {
        [id: string]: MyContainerMemory;
    }
    mainRoomName: string;
    foreignOwner: boolean;
    foreignReserver: boolean;
    hostileScan: HostileScanMemory;
    mainRoomDistanceDescriptions: MainRoomDistanceDescriptions;
    hasController: boolean;
    travelMatrix: { time: number, matrix: number[] };
    myMineral: MyMineralMemory;
}

interface HostilesInformationMemory {

}

interface HostilesInformationInterface {

}

interface ConstructionManagerMemory {

}

interface DefenseManagerMemory {

}

interface EnergyHarvestingManagerMemory {
    debug: boolean,
    verbose: boolean
}

interface RepairTarget {
    id: string;
    pos: RoomPositionMemory;
    repairToHits: number;
    isEmergency: boolean;
}

interface RepairTargetHashMap {
    [roomName: string]: Array<RepairTarget>;
}

interface RepairManagerMemory {
    repairTargets: RepairTargetHashMap;
    emergencyTargets: RepairTargetHashMap;
}

interface SpawnFillManagerMemory {

}

interface SpawnManagerMemory {
    queue: any;
    debug: boolean;
    verbose: boolean;
}

interface UpgradeManagerMemory {

}

interface ReservationManagerMemory {

}

interface RoadConstructionManagerMemory {
    remainingPath: RoomPosition[];
}

interface CreepMemory {
    mainRoomName?: string;
    handledByColony?: boolean;
    role: string;
    path?: { path: RoomPosition[], ops: number };
    autoFlee?: boolean;
    requiredBoosts?: { [compound: string]: { compound: string, amount: number } }
}

interface ScoutMemory extends CreepMemory {
    targetPosition: RoomPosition | { x: number, y: number, roomName: string }; 
}

declare const enum EnergyHarvesterState {
    Harvesting = 0,
    Delivering = 1,
    Repairing = 2
}
interface EnergyHarvesterMemory extends CreepMemory {
    sourceId: string;
    state: EnergyHarvesterState;
}

declare const enum SourceCarrierState {
    Pickup = 0,
    Deliver = 1
}

interface SourceCarrierMemory extends CreepMemory {
    sourceId: string;
    state: SourceCarrierState;
}



interface MineralHarvesterMemory extends CreepMemory {
    mineralId: string;

}

declare const enum MineralCarrierState {
    Pickup = 0,
    Deliver = 1
}

interface MineralCarrierMemory extends CreepMemory {
    mineralId: string;
    state: MineralCarrierState;
}

interface DefenderMemory extends CreepMemory {
    targetRoomName: string;
}
declare const enum RepairerState {
    Refilling = 0,
    Repairing = 1
}
interface RepairerMemory extends CreepMemory {
    targetId: string;
    isEmergency: boolean;
    roomName: string;
    state: RepairerState;
    fillupContainerId: string;
}

interface ConstructorMemory extends CreepMemory {
    targetId: string;
    targetPosition: RoomPositionMemory;
}

interface ReserverMemory extends CreepMemory {
    targetRoomName: string;
}

interface InvaderMemory extends CreepMemory {
    targetRoomName: string;
    state: string;
    rallyPoint: RoomPosition;
}

interface ExitDescription {
    [direction: string]: string;
}

interface TowerMemory {
    repairTarget: RepairTarget;
    healTarget: CreepTarget;
    attackTarget: CreepTarget;
}

declare const enum LabMode {
    available = 0,
    import = 1,
    reaction = 2,
    publish = 4
}

interface LabMemory {
    resource: string;
    mode: LabMode;
    reactionLabIds: string[];
    publishBackup: {
        resource: string;
        mode: LabMode;
        reactionLabIds: string[];
    }
    backup: {
        resource: string;
        mode: LabMode;
        reactionLabIds: string[];
    }
}

interface LabManagerMemory {

}

interface CreepTarget {

}

interface DistanceDescription {
    roomName: string;
    distance: number;
}

interface MainRoomDistanceDescriptions {
    [roomName: string]: DistanceDescription;
}

interface ClaimingManagerMemory {
    targetPosition: RoomPosition;
    verbose: boolean;
}

interface InvasionManagerMemory {
    targetRoomName: string;
    verbose: boolean;
}

interface MyResourceInterface {
    id: string;
    room: Room;
    hasKeeper: boolean;
    pos: RoomPosition;
    roadBuiltToRoom: string;
    pathLengthToDropOff: number;
    myRoom: MyRoomInterface;
}

interface MyMineralInterface extends MyResourceInterface {
    mineral: Mineral;
    amount: number;
    refreshTime: number;
    hasExtractor: boolean;
    resource: string;
}

interface MySourceInterface extends MyResourceInterface {
    source: Source;
    capacity: number;
    link: Link,
    maxHarvestingSpots: number;
}

interface MyContainerInterface {

}



interface MyRoomInterface {
    name: string;
    room: Room;
    myContainers: { [id: string]: MyContainerInterface; };
    mySources: { [id: string]: MySourceInterface; };
    useableSources: MySourceInterface[];
    mainRoom: MainRoomInterface;
    memory: MyRoomMemory;
    canHarvest: boolean;
    refresh();
    closestMainRoom: MainRoomInterface;
    exits: ExitDescription;
    hostileScan: HostileScanInterface;
    requiresDefense: boolean;
    hasController: boolean;
    travelMatrix: CostMatrix | boolean;
    resourceDrops: Resource[];
    repairStructures: Structure[];
    myMineral: MyMineralInterface;
    emergencyRepairs: Array<Structure>;
    creepAvoidanceMatrix: CostMatrix | boolean;
}

interface SpawnQueueItem {
    body: string[];
    memory: any;
}

interface SpawnManagerInterface {
    isBusy: boolean;
    spawns: Array<Spawn>;
    queue: Array<SpawnQueueItem>;
    isIdle: boolean;
    mainRoom: MainRoomInterface;
    addToQueue(body: string[], memory: any, count?: number, priority?: boolean);
    spawn();
}

interface RoadConstructionManagerInterface {
    tick();
}

interface MyLinkInterface {
    id: string;
    tick();
    link: Link;
    nextToStorage: boolean;
    nearController: boolean;
    nearSource: boolean;
    nextToTower: boolean;
    maxLevel: number;
    minLevel: number;
}

interface MainRoomInterface {
    name: string,
    room: Room,
    maxSpawnEnergy: number,
    creeps: Array<Creep>,
    creepsByRole(role:string): Array<Creep>,
    mainContainer: Container | Storage,
    spawns: Array<Spawn>,
    spawnManager: SpawnManagerInterface,
    myRoom: MyRoomInterface,
    allRooms: Array<MyRoomInterface>,
    connectedRooms: Array<MyRoomInterface>,
    mainPosition: RoomPosition,
    roadConstructionManager: RoadConstructionManagerInterface,
    
    extensionCount: number,
    links: Array<MyLinkInterface>,
    sources: {
        [id: string]: MySourceInterface,
    };
    towers: Array<Tower>,
    memory: MainRoomMemory,
    //mineral: Mineral;
    minerals: { [id: string]: MyMineralInterface },
    //extractor: StructureExtractor,
    //extractorContainer: Container,
    terminal: Terminal,
    tick();
    managers: {
        constructionManager: ConstructionManagerInterface,
        repairManager: RepairManagerInterface,
        upgradeManager: UpgradeManagerInterface,
        spawnFillManager: SpawnFillManagerInterface,
        energyHarvestingManager: EnergyHarvestingManagerInterface,
        defenseManager: DefenseManagerInterface,
        reservationManager: ReservationManagerInterface,
        linkFillerManager: LinkFillerManagerInterface,
        towerManager: TowerManagerInterface,
        terminalManager: TerminalManagerInterface,
        mineralHarvestingManager: MineralHarvestingManagerInterface,
        sourceKeeperManager: SourceKeeperManagerInterface,
        labManager: LabManagerInterface,
    };
    invalidateSources();
    getResourceAmount(resource: string): number,
    energyDropOffStructure: Structure;
    harvestersShouldDeliver: boolean;
    myObserver: MyObserverInterface;
    
}

interface ClaimingManagerInterface {
    tick();
}

interface InvasionManagerInterface {
    roomName: string;
}

interface ConstructionManagerInterface {

}

interface RepairManagerInterface {

}
interface UpgradeManagerInterface {

}
interface SpawnFillManagerInterface {
    creeps: Array<Creep>;
}
interface EnergyHarvestingManagerInterface {
    sourceCarrierCreeps: Array<Creep>;
    harvesterCreeps: Array<Creep>;
}
interface DefenseManagerInterface {

}
interface ReservationManagerInterface {

}
interface LinkFillerManagerInterface {

}


interface RoomAssignmentInterface {
    canAssignRoom(myRoom: MyRoomInterface): boolean;
    tryAddRoom(myRoom: MyRoomInterface): boolean;
    assignedRooms: Array<MyRoomInterface>;
    freeMetric: number;
    mainRoom: MainRoomInterface;
    metric: number;
}

interface BodyInterface {
    costs: number;
    getBody(): Array<string>;
    energyHarvestingRate: number;
    isMilitaryDefender: boolean;
    isMilitaryAttacker: boolean;
}

interface RoomAssignmentHandlerInterface {

}

interface TowerManagerInterface {

}

interface TradeAgreement {
    receivingResource: string;
    paymentResource: string;
    paymentFactor: number;
    returnTax: boolean;
    partnerName: string;
    maxDistance: number;
    maxStorage: number;
    openPaymentResource: number;
    openPaymentTax: number;
    paymentRoomName: string;
}

interface TerminalManagerMemory {
    tradeAgreements: Array<TradeAgreement>;
    transactionCheckTime: number;
}

interface TerminalManagerInterface {
    resourceSentOn: number;
    send(resource: string, amount: number, destination: string, description?: string);
}

interface MyLabInterface {
    reset();
    backup();
    restore();
    backupPublish();
    restorePublish();
}

interface LabManagerInterface {
    myLabs: { [id: string]: MyLab };
    freeLabs: MyLab[];
    mainRoom: MainRoomInterface;
    memory: LabManagerMemory;
    imports: string[];
    publishs: string[];
    reactions: string[];
    requiredLabsForReaction(resource: string);
    addReaction(resource: string): MyLabInterface[];
    reset();
    tick();
    preTick();
    backup();
    restore();
    
    availablePublishResources:{ [resource: string]: number };
}

interface ReactionManagerInterface {
    ingredients: { [output: string]: string[] };
    registerLabManager(labManager: LabManagerInterface);
    //canProduce(resource: string);
    canProvide(resource: string, amount?: number);
    tick();
    getAvailableResourceAmount(resource: string);
    highestPowerCompounds: string[];
    requiredAmount: number;
    publishableCompounds: string[];
}

interface MilitaryManagerInterface {
    armies: { [id: number]: ArmyInterface };
    memory: MilitaryManagerMemory;
    tick();
}

interface MilitaryManagerMemory {
    armies: { [id: number]: ArmyMemory };
    nextId: number;
}



interface ArmyInterface {
    id: number;
}

declare const enum ArmyState {
    Idle = 0,
    Rally = 1,
    Movement = 2,
    Fighting = 3,
}

declare const enum ArmyMission {
    None = 0,
    Defend = 1,
    Guard = 2,
    Attack = 3
}

interface ArmyMemory {
    id: number;
    state: ArmyState;
    mission: ArmyMission;
}

interface HostileScanMemory {
    scanTime: number;
    creeps: { time: number, creeps: { [id: string]: CreepInfoMemory } };
}

interface HostileScanInterface {
    memory: HostileScanMemory;
    scanTime: number;
    creeps: { [id: string]: CreepInfoInterface };
    allCreeps: { [id: string]: CreepInfoInterface };
    keepers: { [id: string]: CreepInfoInterface };
}

interface CreepInfoInterface {
    id: string;
    bodyParts: BodyPartDefinition[];
    pos: RoomPosition;
    my: boolean;
    owner: string;
    ticksToLive: number;
    hits: number;
    hitsMax: number;
    bodyInfo: BodyInfoInterface;
    creep: Creep;
}

interface CreepInfoMemory {
    id: string;
    body: BodyPartDefinition[];
    pos: RoomPosition;
    my: boolean;
    owner: string;
    ticksToLive: number;
    hits: number;
    hitsMax: number;
}

interface BodyInfoInterface {
    attackRate: number;
    rangedAttackRate: number;
    totalAttackRate: number;
    healRate: number;
    damageRate: number;
    toughAmount: number;
}

interface MineralHarvestingManagerInterface {
    harvesterCreeps: Array<Creep>,
    carrierCreeps: Array<Creep>
}

interface MyObserverInterface {
    tick();
}

interface MyObserverMemory {
    scannedX: number;
    scannedY: number;
    scanTime: number;
}

interface KeeperBusterMemory extends CreepMemory {

}

interface SourceKeeperManagerInterface {
    preTick();
    tick();
}