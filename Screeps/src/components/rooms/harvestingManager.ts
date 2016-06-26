import {Config} from "./../../config/config";
import {MainRoom} from "./mainRoom";
import {Harvester} from "../creeps/harvester/harvester";
import {HarvesterDefinition} from "../creeps/harvester/harvesterDefinition";
import {SourceCarrier} from "../creeps/sourceCarrier/sourceCarrier";
import {SourceCarrierDefinition} from "../creeps/sourceCarrier/sourceCarrierDefinition";
import {Colony} from "../../colony/colony";
import {MySource} from "../sources/mySource";

export class HarvestingManager {

    public get memory(): HarvestingManagerMemory {
        return this.accessMemory();
    }

    accessMemory() {
        if (this.mainRoom.memory.harvestingManager == null)
            this.mainRoom.memory.harvestingManager = {
                debug: false,
                verbose: false
            }
        return this.mainRoom.memory.harvestingManager;
    }

    mainRoom: MainRoom;
    harvesterCreeps: Array<Creep>;
    idleHarvesterCreeps: Array<Creep>;
    sourceCarrierCreeps: Array<Creep>;
    idleSourceCarrierCreeps: Array<Creep>;

    constructor(mainRoom: MainRoom) {
        this.mainRoom = mainRoom;
        this.getData();
    }

    public placeSourceContainers() {
        if (Game.time % 50 != 0)
            return;
        if (this.mainRoom.mainContainer)
            for (var idx in this.mainRoom.sources) {
                var sourceInfo = this.mainRoom.sources[idx];
                if (sourceInfo.memory.keeper)
                    continue;
                if (!sourceInfo.memory.keeper && sourceInfo.containerMissing()) {
                    var path = sourceInfo.pos.findPathTo(this.mainRoom.mainContainer.pos, { ignoreCreeps: true });
                    var containerPosition = new RoomPosition(path[0].x, path[0].y, sourceInfo.pos.roomName);
                    containerPosition.createConstructionSite(STRUCTURE_CONTAINER);
                }
            }
    }

    getData() {
        this.harvesterCreeps = _.filter(this.mainRoom.creeps, (c) => c.memory.role == 'harvester');
        this.idleHarvesterCreeps = _.filter(this.harvesterCreeps, (c) => c.memory.sourceId == null);
        this.sourceCarrierCreeps = _.filter(this.mainRoom.creeps, (c) => c.memory.role == 'sourceCarrier');
        this.idleSourceCarrierCreeps = _.filter(this.sourceCarrierCreeps, (c) => c.memory.sourceId == null);
    }

    getHarvesterBodyAndCount(sourceInfo: MySource) {
        let partsRequired = Math.ceil(sourceInfo.memory.energyCapacity / ENERGY_REGEN_TIME);
        let maxWorkParts = HarvesterDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, sourceInfo.memory.containerId != null).work;

        if (maxWorkParts >= partsRequired)
            return { body: HarvesterDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, sourceInfo.memory.containerId != null, partsRequired), count: 1 };
        else {
            let creepCount = Math.min(Math.ceil(partsRequired / maxWorkParts), sourceInfo.memory.harvestingSpots);
            partsRequired = Math.min(Math.ceil(partsRequired / creepCount), maxWorkParts);
            return { body: HarvesterDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, sourceInfo.memory.containerId != null, partsRequired), count: creepCount };
        }
    }

    getSourceCarrierBodyAndCount(sourceInfo: MySource) {
        let useRoads = (sourceInfo.memory.mainContainerRoadBuiltTo == this.mainRoom.name);
        let pathLengh = sourceInfo.memory.mainContainerPathLength;
        if (pathLengh == null)
            pathLengh = sourceInfo.calculatePathLengthToMainContainer();

        if (pathLengh == null) {
            return {
                body: SourceCarrierDefinition.getDefinition(500),
                count: 0
            };
        }

        let energyPerTick = sourceInfo.memory.energyCapacity / ENERGY_REGEN_TIME;

        let requiredCarryModules = Math.ceil(pathLengh*(useRoads ? 2 : 3)  * energyPerTick / 50);

        let maxCarryParts = SourceCarrierDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, requiredCarryModules).carry;

        if (maxCarryParts >= requiredCarryModules)
            return { body: SourceCarrierDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, requiredCarryModules), count: 1 };
        else {
            let creepCount = Math.ceil(requiredCarryModules / maxCarryParts);
            requiredCarryModules = Math.ceil(requiredCarryModules / creepCount);
            return { body: SourceCarrierDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, requiredCarryModules), count: creepCount };
        }


    }

    public checkCreeps() {
        this.getData();
        if (Memory['verbose'] || this.memory.verbose)
            console.log('HarvestingManager.checkCreeps()');
        for (var idx in this.mainRoom.sources) {
            var sourceInfo = this.mainRoom.sources[idx];
            if (Memory['verbose'] || this.memory.verbose)
                console.log('HarvestingManager.checkCreeps(): Source [' + sourceInfo.id + ']');
            if (!Colony.getRoom(sourceInfo.pos.roomName).canHarvest()) {
                if (Memory['verbose'] || this.memory.verbose)
                    console.log('HarvestingManager.checkCreeps(): We can\'t mine in this room');
                continue;
            }

            if (sourceInfo.memory.keeper) {
                if (Memory['verbose'] || this.memory.verbose)
                    console.log('HarvestingManager.checkCreeps(): Skipping the source keeper');
                continue;
            }
            var harvesters = _.filter(this.harvesterCreeps, (c) => (<HarvesterMemory>c.memory).sourceId == sourceInfo.id);
            if (Memory['verbose'] || this.memory.verbose)
                console.log('HarvestingManager.checkCreeps(): Harvesters: ' + harvesters.length + ', Harvesting spots: ' + sourceInfo.memory.harvestingSpots);
            //if (harvesters.length < sourceInfo.memory.harvestingSpots) {
            if (Memory['verbose'] || this.memory.verbose)
                    console.log('HarvestingManager.checkCreeps(): Add harvester to queue');
            let requirements = this.getHarvesterBodyAndCount(sourceInfo);
            this.mainRoom.spawnManager.AddToQueue(requirements.body.getBody(), { role: 'harvester', sourceId: sourceInfo.id }, Math.min(requirements.count, sourceInfo.memory.harvestingSpots + (sourceInfo.memory.containerId==null ? 1 : 0)) - harvesters.length);
            //}

            if (sourceInfo.memory.containerId && this.mainRoom.mainContainer && sourceInfo.memory.containerId != this.mainRoom.mainContainer.id) {
                var sourceCarriers = _.filter(this.sourceCarrierCreeps, (c) => (<SourceCarrierMemory>c.memory).sourceId == sourceInfo.id);
                let requirements = this.getSourceCarrierBodyAndCount(sourceInfo);
                this.mainRoom.spawnManager.AddToQueue(requirements.body.getBody(), { role: 'sourceCarrier', sourceId: sourceInfo.id }, Math.min(requirements.count,2) - sourceCarriers.length);
            }
        }
    }

    public tick() {
        this.getData();
        this.harvesterCreeps.forEach((c) => new Harvester(c, this.mainRoom).tick());
        this.sourceCarrierCreeps.forEach((c) => new SourceCarrier(c, this.mainRoom).tick());
    }

}