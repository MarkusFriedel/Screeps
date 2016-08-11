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
    useCompressedCostMatrix?: boolean;
    useKeeperMatrix?: boolean;
    createPathTime?: number;
    pathSliceTime?: number;
    harvestKeeperRooms?: boolean;
    forbiddenRooms?: string[];
    roomAssignment?: RoomAssignmentSolution;
}

interface RoomAssignmentSolution {
    [mainRoomName: string]: RoomAssignmentEntry
}

interface RoomAssignmentEntry {
    mainRoomName: string,
    metric: number,
    rooms: string[] 
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
    powerBanks?: { [id: string]: MyPowerBankMemory };
    connectedRooms?: string[];
    nukerId?: { time: number, id: string };
}

interface RoomPositionMemory {
    x: number;
    y: number;
    roomName: string;
}

interface LabManagerMemory {
    labs: { [id: string]: LabMemory };
}

interface HarvestingSiteMemoryOld {
    id: string;
    pos?: RoomPositionMemory;
    keeper?: boolean;
    lairId?: string;
    lairPos?: RoomPosition;
    harvestingSpots?: number;
    /**
    * roadBuiltToRoom
    **/
    roadBuiltToRoom?: string;
    /**
    * Container Id
    **/
    cId?: string;
    /**
    * Container Id
    **/
    cPos?: RoomPosition;

    /**
    * Resource type
    **/
    rt?: string;
    /**
    * Resource amount
    **/
    amount?: number;
    /**
    * PathLengthToMainContainer
    **/

    pl?: { time: number, length: number };
}

interface HarvestingSiteMemory {
    id: string;
    pos?: RoomPositionMemory;
    keeper?: boolean;
    lairId?: string;
    lairPos?: RoomPosition;
    /**
    * Harvesting spot count
    **/
    hs?: number;
    /**
    * roadBuiltToRoom
    **/
    rbtr?: string;
    /**
    * Container Id
    **/
    cId?: string;
    /**
    * Container Id
    **/
    cPos?: RoomPosition;

    /**
    * Resource type
    **/
    rt?: string;
    /**
    * Resource amount
    **/
    a?: number;
    /**
    * PathLengthToMainContainer
    **/

    pl?: { time: number, length: number };
}

interface MyMineralMemoryOld extends HarvestingSiteMemoryOld {


    pathLengthToTerminal?: { time: number, length: number };

    hasExtractor?: { time: number, hasExtractor: boolean };

    refreshTime: number;

    terminalRoadBuiltTo: string;
    containerId: { time: number, id: string }
}

interface MyMineralMemory extends HarvestingSiteMemory {

    /**
    * Has Extractor
    **/
    e?: { time: number, hasExtractor: boolean };

    /**
    * Refresh time
    **/
    rti?: number;

}

interface MySourceMemoryOld extends HarvestingSiteMemoryOld {
    /**
    * Capacity
    **/
    energyCapacity?: number;


    /**
    * Link Id
    **/
    linkId?: { time: number, id: string };
    //dropOffStructure: cachedProperty<{ id: string, pos: RoomPosition }>;
    //sourceDropOffContainer: cachedProperty<{ id: string, pos: RoomPosition }>;
    pathLengthToMainContainer?: { time: number, length: number };


}

interface MySourceMemory extends HarvestingSiteMemory {
    /**
    * Capacity
    **/
    c?: number;



    /**
    * Link Id
    **/
    lId?: { time: number, id: string };
    //dropOffStructure: cachedProperty<{ id: string, pos: RoomPosition }>;
    //sourceDropOffContainer: cachedProperty<{ id: string, pos: RoomPosition }>;


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
    /**
    * StructureType
    **/
    sT: string;
}

interface MyRoomMemoryOld {
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
    costMatrix?: { time: number, matrix: number[] };
    avoidKeeperMatrix?: { time: number, matrix: number[] };
    compressedCostMatrix?: { time: number, matrix: CompressedCostMatrix };
    myMineral?: MyMineralMemory;
    rsUT?: number;
    repairStructures?: { time: number, structures: { [id: string]: RepairStructure } };
    repairWalls?: { time: number, structures: { [id: string]: RepairStructure } };
    emergencyRepairStructures?: { time: number, structures: Array<RepairStructure> };

}

interface MyRoomMemory {
    name?: string;
    lst?: number;
    /**
    * Sources
    **/
    srcs?: {
        [id: string]: MySourceMemory;
    }
    /**
    * MainRoom name
    **/
    mrn?: string;
    /**
    * Foreign owner
    **/
    fO?: boolean;
    /**
    * Foreign reserver
    **/
    fR?: boolean;
    /**
    * Hostile Scan
    **/
    hs?: HostileScanMemory;
    /**
    * Distances to MainRooms
    **/
    mrd?: MainRoomDistanceDescriptions;
    /**
    * Controller position
    **/
    ctrlPos?: RoomPosition;
    /**
    * Cost matrix
    **/
    cm?: { time: number, matrix: number[] };
    /**
    * Avoid Keeper Matrix
    **/
    aKM?: { time: number, matrix: number[] };
    /**
    * Compressed cost matrix
    **/
    ccm?: { time: number, matrix: CompressedCostMatrix };
    /**
    * Mineral
    **/
    min?: MyMineralMemory;
    /**
    * RepairStructures Update time
    **/
    rsUT?: number;
    /**
    * RepairStructures
    **/
    rs?: { time: number, structures: { [id: string]: RepairStructure } };
    /**
    * RepairWalls
    **/
    rw?: { time: number, structures: { [id: string]: RepairStructure } };
    /**
    * Emergency RepairStructures
    **/
    ers?: { time: number, structures: Array<RepairStructure> };

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
    creepCounts?: { [sourceId: string]: { harvesters: number, carriers: number, harvesterRequirements: number, carrierRequirements: number } };
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
    af?: boolean;
    fleeing?: boolean;
    requiredBoosts?: { [compound: string]: { compound: string, amount: number } };
    pathMovement?: PathMovement;
    recycle?: { spawnId: string } | boolean;
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
    energyId: string;
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

interface MyPathOpts extends PathFinderOpts {
    resetPath?: boolean;
}

interface LabManagerMemory {

}

interface CreepTarget {

}

interface DistanceDescriptionOld {
    roomName: string;
    distance: number;
    n: string;
    d: number;
}

interface DistanceDescription {
    n: string;
    d: number;
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
    lairPosition: RoomPosition;
    resourceType: string;
    container: StructureContainer;
    containerPosition: RoomPosition;
    link: Link;
    site: Source | Mineral;
    amount: number;
    keeperIsAlive: boolean;
}

interface MyMineralInterface extends HarvestingSiteInterface {
    mineral: Mineral;
    amount: number;
    refreshTime: number;
    hasExtractor: boolean;
    maxHarvestingSpots: number;

}

interface MySourceInterface extends HarvestingSiteInterface {
    source: Source;
    capacity: number;

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
    resourceDrops: Resource[];
    repairStructures: { [id: string]: RepairStructure };
    repairWalls: { [id: string]: RepairStructure };
    myMineral: MyMineralInterface;
    emergencyRepairStructures: Array<RepairStructure>;
    creepAvoidanceMatrix: CostMatrix | boolean;
    recreateCostMatrix();
    reloadRepairStructures(hitsFactor: number);
    getCustomMatrix(opts?: CostMatrixOpts): CostMatrix | boolean;
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
    nuker: StructureNuker,
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
        powerManager: PowerManagerInterface;
        nukeManager: NukeManagerInterface;
    };
    invalidateSources();
    getResourceAmount(resource: string): number,
    energyDropOffStructure: Structure;
    harvestersShouldDeliver: boolean;
    myObserver: MyObserverInterface;
    harvestingActive: boolean;
    harvestingSites: { [id: string]: HarvestingSiteInterface };
}

interface ClaimingManagerInterface {
    tick();
}

interface InvasionManagerInterface {
    roomName: string;
}

interface ConstructionManagerInterface {
    constructions: ConstructionSite[];
}

interface RepairManagerInterface {
    creeps: Array<Creep>;

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
    mineralHarvestingRate: number;
    getHarvestingRate(resource: string): number;
    healRate: number;
    isMilitaryDefender: boolean;
    isMilitaryAttacker: boolean;
    move: number;
    work: number;
    attack: number;
    carry: number;
    heal: number;
    ranged_attack: number;
    tough: number;
    claim: number;
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
    roomName?: string;
    targetId?: string;
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

interface PowerManagerInterface {

}

interface MyPowerBankInterface {

}

interface MyPowerBankMemory {
    id: string;
    pos: RoomPosition;
    decaysAt: number;
    power: number;
}

interface ArmyMemory {
    id: number;
    state: ArmyState;
    mission: ArmyMission;
    rallyPoint: RoomPosition;
}

interface MissionPowerHarvestingMemory {


}

interface ArmyCreepMemory extends CreepMemory {
    armyId: number;
    followingCreepId: string;
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

interface CostMatrixOpts {
    ignoreAllKeepers?: boolean;
    ignoreKeeperSourceId?: string;
    avoidCreeps?: boolean;
}

declare const enum HarvesterState {
    harvest = 0,
    deliver = 1
}
declare const enum HarvestingCarrierState {
    pickup = 0,
    deliver
}

interface HarvestingCarrierMemory extends CreepMemory {
    /**
    * Harvesting Site Id
    **/
    sId: string;
    /**
    * State
    **/
    st: HarvestingCarrierState;
}

interface HarvesterMemory extends CreepMemory {
    /**
    * Harvesting Site Id
    **/
    sId: string;
    /**
    * State
    **/
    st: HarvesterState;
}

interface NukeManagerInterface {
    preTick(),
    tick(),
    isReady: boolean
}

interface StructureLab {
    cooldown: number
}

declare var BOOSTS: {
    work: {
        UO: {
            harvest: number
        },
        UHO2: {
            harvest: number
        },
        XUHO2: {
            harvest: number
        },
        LH: {
            build: number,
            repair: number
        },
        LH2O: {
            build: number,
            repair: number
        },
        XLH2O: {
            build: number,
            repair: number
        },
        ZH: {
            dismantle: number
        },
        ZH2O: {
            dismantle: number
        },
        XZH2O: {
            dismantle: number
        },
        GH: {
            upgradeController: number
        },
        GH2O: {
            upgradeController: number
        },
        XGH2O: {
            upgradeController: number
        }
    },
    attack: {
        UH: {
            attack: number
        },
        UH2O: {
            attack: number
        },
        XUH2O: {
            attack: number
        }
    },
    ranged_attack: {
        KO: {
            rangedAttack: number,
            rangedMassAttack: number
        },
        KHO2: {
            rangedAttack: number,
            rangedMassAttack: number
        },
        XKHO2: {
            rangedAttack: number,
            rangedMassAttack: number
        }
    },
    heal: {
        LO: {
            heal: number,
            rangedHeal: number
        },
        LHO2: {
            heal: number,
            rangedHeal: number
        },
        XLHO2: {
            heal: number,
            rangedHeal: number
        }
    },
    carry: {
        KH: {
            capacity: number
        },
        KH2O: {
            capacity: number
        },
        XKH2O: {
            capacity: number
        }
    },
    move: {
        ZO: {
            fatigue: number
        },
        ZHO2: {
            fatigue: number
        },
        XZHO2: {
            fatigue: number
        }
    },
    tough: {
        GO: {
            damage: number
        },
        GHO2: {
            damage: number
        },
        XGHO2: {
            damage: number
        }
    }
};

interface LookAtResultWithPos {
    constructionSite: ConstructionSite;
}