export class MySourceMemory implements IMySourceMemory {
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
    sourceDropOffContainer: cachedProperty<{ id: string, pos: RoomPosition }>
}