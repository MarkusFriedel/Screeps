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
    mainContainerId: string;

}

interface RoomPositionMemory {
    x: number;
    y: number;
    roomName: string;
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
    hostiles: boolean;
    mainRoomDistanceDescriptions: MainRoomDistanceDescriptions;
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
    roadBuiltToMainContainer:string;
    pathLengthToMainContainer: number;
    requiresCarrier: boolean;
    energyCapacity: number;
    hasLink: boolean;
    myRoom: MyRoomInterface;
    containerMissing: boolean;
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
    scanForHostiles();
    scan();
    closestMainRoom: MainRoomInterface;
    exits: ExitDescription;
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
    extensionCount: number;
    links: Array<MyLinkInterface>;
    sources: {
        [id: string]: MySourceInterface;
    };
    memory: MainRoomMemory;
    tick();
    creepManagers: {
        constructionManager: ConstructionManagerInterface,
        repairManager: RepairManagerInterface,
        upgradeManager: UpgradeManagerInterface,
        spawnFillManager: SpawnFillManagerInterface,
        harvestingManager: HarvestingManagerInterface,
        defenseManager: DefenseManagerInterface,
        reservationManager: ReservationManagerInterface,
        linkFillerManager: LinkFillerManagerInterface
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
}

interface BodyInterface {
    costs: number;
    getBody(): Array<string>;
}

interface RoomAssignmentHandlerInterface {

}

interface TowerManagerInterface {

}

