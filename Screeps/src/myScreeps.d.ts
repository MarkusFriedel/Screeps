declare var BODYPARTS_ALL: Array<string>;

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

}

interface RoomPositionMemory {
    x: number;
    y: number;
    roomName: string;
}

interface MySourceMemory {
    id: string;
    pos: RoomPositionMemory;
    energyCapacity: number;
    lastScanTime: number;
    keeper: boolean;
    harvestingSpots: number;
    containerId: string;
    mainContainerRoadBuiltTo: string;
    mainContainerPathLength: number;
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
    structureType: string;
    hits: number;
    hitsMax: number;
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

interface HarvesterMemory extends CreepMemory {
    sourceId: string;
    doConstructions: boolean;
    state: string;
}

interface SourceCarrierMemory extends CreepMemory {
    sourceId: string;
}

interface DefenderMemory extends CreepMemory {
    targetRoomName: string;
}

interface RepairerMemory extends CreepMemory {
    repairTarget: RepairTarget;
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