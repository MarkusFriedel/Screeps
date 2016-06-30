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

interface IMySourceMemory {
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
        [id: string]: IMySourceMemory;
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
    queue:any;
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

declare enum HarvesterState {
    Harvesting = 0,
    Delivering = 1,
    Repairing=2
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
declare enum RepairerState {
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



interface MainRoomDistanceDescriptions {
    [roomName: string]: { roomName: string, distance: number };
}

interface ClaimingManagerMemory {
    targetPosition: RoomPosition;
}

interface InvasionManagerMemory {
    targetRoomName: string;
}

