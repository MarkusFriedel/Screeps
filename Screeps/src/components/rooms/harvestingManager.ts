import {SpawnRoomHandler} from "./spawnRoomHandler";
import {Harvester} from "../creeps/harvester/harvester";
import {HarvesterDefinition} from "../creeps/harvester/harvesterDefinition";

export class HarvestingManager {

    spawnRoomHandler: SpawnRoomHandler;
    creeps: Array<Creep>;
    idleCreeps: Array<Creep>;

    constructor(spawnRoomHandler: SpawnRoomHandler) {
        this.spawnRoomHandler = spawnRoomHandler;
        this.creeps = _.filter(spawnRoomHandler.creeps, (c) => c.memory.role == 'harvester');
        this.idleCreeps = _.filter(this.creeps, (c) => c.memory.sourceId == null);
    }

    public placeSourceContainers() {
        for (var idx in this.spawnRoomHandler.sourceInfos) {
            var sourceInfo = this.spawnRoomHandler.sourceInfos[idx];
            if (sourceInfo.keeper)
                continue;

            var path = sourceInfo.pos.findPathTo(this.spawnRoomHandler.mainContainerPosition, { ignoreCreeps: true });
            var containerPosition = new RoomPosition(path[1].x, path[1].y, sourceInfo.roomName);
            containerPosition.createConstructionSite(STRUCTURE_CONTAINER);
        }
    }


    public checkCreeps() {


    for (var idx in this.spawnRoomHandler.sourceInfos) {
        var sourceInfo = this.spawnRoomHandler.roomInfo.sources[idx];
        if (sourceInfo.keeper)
            continue;
        var harvesters = sourceInfo.getAssignedHarvesters();
        if (harvesters.length < sourceInfo.harvestingSpots)
            this.spawnRoomHandler.spawnManager.AddToQueue(HarvesterDefinition.getDefinition(this.spawnRoomHandler.maxSpawnEnergy).getBody(), { role: 'harvester', sourceId: sourceInfo.id, spawnRoomName: this.spawnRoomHandler.roomName }, sourceInfo.harvestingSpots - harvesters.length);
    }
}

    public tick() {
    this.creeps.forEach((c) => new Harvester(c, this.spawnRoomHandler).tick());
}

}