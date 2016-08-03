declare var STRUCTURE_PORTAL: string;

declare var BODYPARTS_ALL: Array<string>;

interface Object {
    getName(): string;
}

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
    boostPowers: { [power: string]: { bodyPart: string, resources: Array<{ resource: string, factor: number }> } };
    active: boolean;
    armyManager: ArmyManagerMemory;
    exits: {
        [roomName: string]: { [direction: string]: string }
    };
    creepIdx?: number;
}

interface ReactionManagerMemory {
    setupTime: number;
    publishableCompounds: { time: number, compounds: string[] }
    highestPowerCompounds: { time: number, compounds: string[] }
}

interface TowerManagerMemory {

}


interface MainRoomMemory {
    name: string;
    mainPosition?: RoomPositionMemory;
    spawnManager?: SpawnManagerMemory;
    constructionManager?: ConstructionManagerMemory;
    repairManager?: RepairManagerMemory;
    upgradeManager?: UpgradeManagerMemory;
    spawnFillManager?: SpawnFillManagerMemory;
    energyHarvestingManager?: EnergyHarvestingManagerMemory;
    defenseManager?: DefenseManagerMemory;
    reservationManager?: ReservationManagerMemory;
    roadConstructionManager?: RoadConstructionManagerMemory;
    sourceKeeperManager?: SourceKeeperManagerMemory;
    towerManager?: TowerManagerMemory;
    mainContainerId?: { time: number, id: string };
    labManager?: LabManagerMemory;
    terminalManager?: TerminalManagerMemory;
    extractorContainerId?: { time: number, id: string };
    myObserver?: MyObserverMemory;
    harvestingActive?: boolean;

}

interface RoomPositionMemory {
    x: number;
    y: number;
    roomName: string;
}

interface LabManagerMemory {
    labs: { [id: string]: LabMemory };
}

interface HarvestingSiteMemory {
    id: string;
    pos: RoomPositionMemory;
    keeper?: boolean;
    lairId?: string;
    harvestingSpots?: number;
    roadBuiltToRoom?: string;
}

interface MyMineralMemory extends HarvestingSiteMemory {
    
    amount: number;
    refreshTime: number;
    terminalRoadBuiltTo?: string;
    //containerId: { time: number, id: string };
    pathLengthToTerminal?: { time: number, length: number };
    resource: string;
    hasExtractor?: { time: number, hasExtractor: boolean };
}

interface MySourceMemory extends HarvestingSiteMemory {
    
    capacity: number;
    
    
    //hasSourceDropOff: boolean;
    linkId: { time: number, id: string };
    //dropOffStructure: cachedProperty<{ id: string, pos: RoomPosition }>;
    //sourceDropOffContainer: cachedProperty<{ id: string, pos: RoomPosition }>;
    containerId: string;
    pathLengthToMainContainer: { time: number, length: number };
}

interface MyContainerMemory {
    id: string;
    pos: RoomPositionMemory;
    lastScanTime: number;
}

interface RepairStructure {
    id: string;
    hits: number;
    hitsMax: number;
    pos: RoomPosition;
    structureType: string;
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
    mainRoomName?: string;
    foreignOwner: boolean;
    foreignReserver: boolean;
    hostileScan: HostileScanMemory;
    mainRoomDistanceDescriptions: MainRoomDistanceDescriptions;
    hasController: boolean;
    controllerPosition: RoomPosition;
    travelMatrix?: { time: number, matrix: number[] };
    compressedTravelMatrix?: { time: number, matrix: CompressedCostMatrix };
    myMineral?: MyMineralMemory;
    repairStructures?: { time: number, structures: { [id: string]: RepairStructure } };
    repairWalls?: { time: number, structures: { [id: string]: RepairStructure } };
    emergencyRepairStructures?: { time: number, structures: Array<RepairStructure> };
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
    verbose: boolean,
    sleepUntil?: { [sourceId: string]: number, sleepUntil?: number };
    creepCounts?: { [sourceId: string]:  {harvesters:number, carriers:number} };
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
    sleepingUntil?: number;
}

interface UpgradeManagerMemory {

}

interface ReservationManagerMemory {

}

interface RoadConstructionManagerMemory {
    remainingPath: RoomPosition[];
}

interface PathMovement {
    path: RoomPosition[];
    ops: number;
    target: {
        pos: RoomPosition;
        range: number;
    };
}

interface CreepMemory {
    mainRoomName?: string;
    handledByColony?: boolean;
    role: string;
    path?: { path: RoomPosition[], ops: number };
    autoFlee?: boolean;
    fleeing?: boolean;
    requiredBoosts?: { [compound: string]: { compound: string, amount: number } };
    pathMovement?: PathMovement;
    recycle?: { spawnId: string };
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
    targetCheckTime: number;
}

interface ConstructorMemory extends CreepMemory {
    targetId: string;
    targetPosition: RoomPositionMemory;
    fillupContainerId: string;
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

interface HarvestingSiteInterface {
    id: string;
    room: Room;
    hasKeeper: boolean;
    pos: RoomPosition;
    roadBuiltToRoom: string;
    pathLengthToDropOff: number;
    myRoom: MyRoomInterface;
    keeper: KeeperInterface;
    usable: boolean;
}

interface MyMineralInterface extends HarvestingSiteInterface {
    mineral: Mineral;
    amount: number;
    refreshTime: number;
    hasExtractor: boolean;
    resource: string;
    maxHarvestingSpots: number;
    
}

interface MySourceInterface extends HarvestingSiteInterface {
    source: Source;
    capacity: number;
    link: Link,
    container: StructureContainer;
    maxHarvestingSpots: number;
    rate: number;
    

}

interface KeeperInterface {
    lair: StructureKeeperLair;
    creep: Creep;
}

interface MyContainerInterface {

}

interface CompressedCostMatrix {
    matrix: { i: number, v: number }[];
}

interface MyRoomInterface {
    name: string;
    room: Room;
    mySources: { [id: string]: MySourceInterface; };
    useableSources: MySourceInterface[];
    mainRoom: MainRoomInterface;
    memory: MyRoomMemory;
    canHarvest: boolean;
    refresh();
    closestMainRoom: MainRoomInterface;
    hostileScan: HostileScanInterface;
    requiresDefense: boolean;
    hasController: boolean;
    controllerPosition: RoomPosition;
    travelMatrix: CostMatrix | boolean;
    resourceDrops: Resource[];
    repairStructures: { [id: string]: RepairStructure };
    myMineral: MyMineralInterface;
    emergencyRepairStructures: Array<RepairStructure>;
    creepAvoidanceMatrix: CostMatrix | boolean;
    recreateTravelMatrix();

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
    creepsByRole(role: string): Array<Creep>,
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
    harvestingActive: boolean;
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

    availablePublishResources: { [resource: string]: number };
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
    roomName: string;
    targetId: string;
}

interface SourceKeeperManagerMemory {
    sleepUntil?: { [roomName: string]: number };
}

interface SourceKeeperManagerInterface {
    preTick(myRoom: MyRoomInterface);
    tick();
}

declare const enum SpawnConstructorState {
    moving = 0,
    harvesting = 1,
    constructing = 2
}

interface SpawnConstructorMemory extends CreepMemory {
    state: SpawnConstructorState;
    targetPosition: RoomPosition;
    sourceId: string;
}

interface ArmyManagerInterface {

}

interface ArmyManagerMemory {
    nextId: number;
    armies: { [id: string]: ArmyMemory }
}

interface ArmyInterface {
    id: number;
}

declare const enum ArmyState {
    Idle = 0,
    Rally = 1,
    Movement = 2
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
    rallyPoint: RoomPosition;
}

interface ArmyCreepMemory extends CreepMemory {
    armyId: number;
}

interface ArmyHealerMemory extends ArmyCreepMemory {

}

interface ArmyWarriorMemory extends ArmyCreepMemory {

}

interface ArmyDismantlerMemory extends ArmyCreepMemory {

}

declare const enum CarrierState {
    Pickup = 1,
    Delivery = 2
}

interface CarrierMemory extends CreepMemory {
    sourceRoomName: string;
    targetRoomName: string;
    state: CarrierState;

}

interface LabCarrierMemory extends CreepMemory {
    idleUntil: number;
}

interface TerminalFillerMemory extends CreepMemory {
    idleUntil: number;
}

interface SpawnFillerMemory extends CreepMemory {
    targetStructureId: string;
}