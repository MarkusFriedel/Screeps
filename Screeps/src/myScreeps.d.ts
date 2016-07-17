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
    harvestingManager: HarvestingManagerMemory;
    defenseManager: DefenseManagerMemory;
    reservationManager: ReservationManagerMemory;
    roadConstructionManager: RoadConstructionManagerMemory;
    towerManager: TowerManagerMemory;
    mainContainerId: string;
    terminalManager: TerminalManagerInterface;
    labManager: LabManagerMemory;
}

interface RoomPositionMemory {
    x: number;
    y: number;
    roomName: string;
}

interface LabManagerMemory {
    labs: { [id: string]: LabMemory };
}

interface MySourceMemoryInterface {
    id: string;
    pos: RoomPositionMemory;
    energyCapacity: number;
    keeper: boolean;
    harvestingSpots: number;
    mainContainerRoadBuiltTo: string;
    mainContainerPathLength: number;
    hasSourceDropOff: boolean;
    hasLink: boolean;
    dropOffStructure: cachedProperty<{ id: string, pos: RoomPosition }>;
    sourceDropOffContainer: cachedProperty<{ id: string, pos: RoomPosition }>;
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
        [id: string]: MySourceMemoryInterface;
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
}

interface HostilesInformationMemory {

}

interface HostilesInformationInterface {

}

interface ConstructionManagerMemory {

}

interface DefenseManagerMemory {

}

interface HarvestingManagerMemory {
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
    mainRoomName: string;
    handledByColony: boolean;
    role: string;
    boostWith: string[];
    path: { path: RoomPosition[], ops:number };
}

interface ScoutMemory extends CreepMemory {
    targetPosition: RoomPosition;
}

declare const enum HarvesterState {
    Harvesting = 0,
    Delivering = 1,
    Repairing = 2
}
interface HarvesterMemory extends CreepMemory {
    sourceId: string;
    state: HarvesterState;
}

interface SourceCarrierMemory extends CreepMemory {
    sourceId: string;
}

interface MineralHarvesterMemory extends CreepMemory {
}

interface MineralCarrierMemory extends CreepMemory {
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

interface MySourceInterface {
    id: string;
    room: Room;
    source: Source;
    sourceDropOffContainer: {
        id: string, pos: RoomPosition
    };
    dropOffStructure: {
        id: string, pos: RoomPosition
    };
    nearByConstructionSite: ConstructionSite;
    pos: RoomPosition;
    hasKeeper: boolean;
    roadBuiltToMainContainer: string;
    pathLengthToMainContainer: number;
    requiresCarrier: boolean;
    energyCapacity: number;
    hasLink: boolean;
    myRoom: MyRoomInterface;
    containerMissing: boolean;
    maxHarvestingSpots: number;
    hasCarrier: boolean;
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
    travelMatrix: CostMatrix;
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
    name: string;
    room: Room;
    maxSpawnEnergy: number;
    creeps: Array<Creep>;
    mainContainer: Container | Storage;
    spawns: Array<Spawn>;
    spawnManager: SpawnManagerInterface;
    myRoom: MyRoomInterface;
    allRooms: Array<MyRoomInterface>;
    mainPosition: RoomPosition;
    roadConstructionManager: RoadConstructionManagerInterface;
    labManager: LabManagerInterface;
    extensionCount: number;
    links: Array<MyLinkInterface>;
    sources: {
        [id: string]: MySourceInterface;
    };
    towers: Array<Tower>,
    memory: MainRoomMemory;
    mineral: Mineral;
    extractor: StructureExtractor;
    extractorContainer: Container,
    terminal: Terminal,
    tick();
    creepManagers: {
        constructionManager: ConstructionManagerInterface,
        repairManager: RepairManagerInterface,
        upgradeManager: UpgradeManagerInterface,
        spawnFillManager: SpawnFillManagerInterface,
        harvestingManager: HarvestingManagerInterface,
        defenseManager: DefenseManagerInterface,
        reservationManager: ReservationManagerInterface,
        linkFillerManager: LinkFillerManagerInterface,
        towerManager: TowerManagerInterface
    };
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
interface HarvestingManagerInterface {
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
    harvestingRate: number;
    isMilitaryDefender: boolean;
    isMilitaryAttacker: boolean;
}

interface RoomAssignmentHandlerInterface {

}

interface TowerManagerInterface {

}

interface TerminalManagerInterface {

}

interface LabManagerInterface {
    myLabs: { [id: string]: MyLab };
    mainRoom: MainRoomInterface;
    memory: LabManagerMemory;
    setupPublishs();
    imports: string[];
    reactions: string[];
    requiredLabsForReaction(resource: string);
    addReaction(resource: string);
    reset();
    tick();
    checkCreeps();
}

interface ReactionManagerInterface {
    ingredients: { [output: string]: string[] };
    registerLabManager(labManager: LabManagerInterface);
    canProduce(resource: string);
    tick();
    getAvailableResourceAmount(resource: string);

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
    Idle=0,
    Rally = 1,
    Movement = 2,
    Fighting = 3,
}

declare const enum ArmyMission {
    None = 0,
    Defend = 1,
    Guard = 2,
    Attack=3
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