import {Config} from "./../../config/config";
import {MainRoom} from "./mainRoom";
import {Harvester} from "../creeps/harvester/harvester";
import {HarvesterDefinition} from "../creeps/harvester/harvesterDefinition";
import {SourceCarrier} from "../creeps/sourceCarrier/sourceCarrier";
import {SourceCarrierDefinition} from "../creeps/sourceCarrier/sourceCarrierDefinition";
import {Colony} from "../../colony/colony";
import {MySource} from "../sources/mySource";
import {Body} from "../creeps/body";

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

    _harvesterCreeps: { time: number, creeps: Array<Creep> } = { time: 0, creeps: null };
    public get harvesterCreeps(): Array<Creep> {
        if (this._harvesterCreeps.time < Game.time)
            this._harvesterCreeps = {
                time: Game.time, creeps: _.filter(this.mainRoom.creeps, (c) => c.memory.role == 'harvester')
            };
        return this._harvesterCreeps.creeps;
    }

    _sourceCarrierCreeps: { time: number, creeps: Array<Creep> } = { time: 0, creeps: null };
    public get sourceCarrierCreeps(): Array<Creep> {
        if (this._sourceCarrierCreeps.time < Game.time)
            this._sourceCarrierCreeps = {
                time: Game.time, creeps: _.filter(this.mainRoom.creeps, (c) => c.memory.role == 'sourceCarrier')
            };
        return this._sourceCarrierCreeps.creeps;
    }

    constructor(public mainRoom: MainRoom) {
    }

    public placeSourceContainers() {
        if (Game.time % 50 != 0)
            return;
        if (this.mainRoom.mainContainer)
            for (var idx in this.mainRoom.sources) {
                var sourceInfo = this.mainRoom.sources[idx];
                if (sourceInfo.keeper || !sourceInfo.myRoom.canHarvest())
                    continue;
                if (!sourceInfo.keeper && sourceInfo.containerMissing()) {
                    var path = sourceInfo.pos.findPathTo(this.mainRoom.mainContainer.pos, { ignoreCreeps: true });
                    var containerPosition = new RoomPosition(path[0].x, path[0].y, sourceInfo.pos.roomName);
                    containerPosition.createConstructionSite(STRUCTURE_CONTAINER);
                }
            }
    }


    getHarvesterBodyAndCount(sourceInfo: MySource) {
        if (Memory['verbose'] || this.memory.verbose)
            console.log('MAX_ENERGY: ' + this.mainRoom.maxSpawnEnergy);
        let partsRequired = Math.ceil((sourceInfo.energyCapacity / ENERGY_REGEN_TIME) / 2) + 1;
        let maxWorkParts = HarvesterDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, sourceInfo.requiresCarrier).work;

        if (maxWorkParts >= partsRequired)
            return { body: HarvesterDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, sourceInfo.requiresCarrier, partsRequired), count: 1 };
        else {
            let creepCount = Math.min(Math.ceil(partsRequired / maxWorkParts), sourceInfo.maxHarvestingSpots);
            partsRequired = Math.min(Math.ceil(partsRequired / creepCount), maxWorkParts);
            return { body: HarvesterDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, sourceInfo.requiresCarrier, partsRequired), count: creepCount };
        }
    }

    getSourceCarrierBodyAndCount(sourceInfo: MySource, maxMiningRate?: number) {
        let useRoads = (this.mainRoom.mainContainer && sourceInfo.roadBuiltToMainContainer == this.mainRoom.mainContainer.id);
        let pathLengh = sourceInfo.pathLengthToMainContainer;
       
        if (pathLengh == null) {
            return {
                body: SourceCarrierDefinition.getDefinition(500),
                count: 0
            };
        }

        let sourceRate = sourceInfo.energyCapacity / ENERGY_REGEN_TIME;

        let energyPerTick = maxMiningRate == null ? sourceRate : Math.min(maxMiningRate, sourceRate);

        let requiredCarryModules = Math.ceil(pathLengh*(useRoads ? 2 : 3)  * energyPerTick / 50)+1;

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
        let startCpu: number;
        let endCpu: number;
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if (Memory['verbose'] || this.memory.verbose)
            console.log('HarvestingManager.checkCreeps()');
        for (var idx in this.mainRoom.sources) {
            var sourceInfo = this.mainRoom.sources[idx];
            //if (sourceInfo.myRoom.memory.mainRoomDistanceDescriptions[this.mainRoom.name].distance >= 2 && !sourceInfo.memory.containerId)
            //    continue;

            if (Memory['verbose'] || this.memory.verbose)
                console.log('HarvestingManager.checkCreeps(): Source [' + sourceInfo.id + ']');
            if (!Colony.getRoom(sourceInfo.pos.roomName).canHarvest()) {
                if (Memory['verbose'] || this.memory.verbose)
                    console.log('HarvestingManager.checkCreeps(): We can\'t mine in this room');
                continue;
            }

            if (sourceInfo.keeper) {
                if (Memory['verbose'] || this.memory.verbose)
                    console.log('HarvestingManager.checkCreeps(): Skipping the source keeper');
                continue;
            }
            var harvesters = _.filter(this.harvesterCreeps, (c) => (<HarvesterMemory>c.memory).sourceId == sourceInfo.id);
            if (Memory['verbose'] || this.memory.verbose)
                console.log('HarvestingManager.checkCreeps(): Harvesters: ' + harvesters.length + ', Harvesting spots: ' + sourceInfo.maxHarvestingSpots);
            //if (harvesters.length < sourceInfo.memory.harvestingSpots) {
            if (Memory['verbose'] || this.memory.verbose)
                console.log('HarvestingManager.checkCreeps(): Add harvester to queue');
            
            let harvesterRequirements = this.getHarvesterBodyAndCount(sourceInfo);
            if (Memory['verbose'] || this.memory.verbose)
                console.log('HarvestingManager.checkCreeps(): Requirements-cound: ' + harvesterRequirements.count + ' Requirements- body: ' + JSON.stringify(harvesterRequirements.body));
            this.mainRoom.spawnManager.AddToQueue(harvesterRequirements.body.getBody(), { role: 'harvester', state: HarvesterState.Harvesting, sourceId: sourceInfo.id }, harvesterRequirements.count - harvesters.length + (!sourceInfo.requiresCarrier ? 0 : 0));
            //}

            //let miningRate = _.sum(_.map(harvesters, h => Body.getFromCreep(h).getHarvestingRate()));
            if (Memory['verbose'] || this.memory.verbose)
                console.log('Start checking source carriers');
            if (Memory['trace'])
                startCpu = Game.cpu.getUsed();
            if (Memory['verbose'] || this.memory.verbose) {
                console.log('Requires carrier: ' + sourceInfo.requiresCarrier);
                console.log('Has Link: ' + sourceInfo.hasLink);
            }

            if (sourceInfo.requiresCarrier && !sourceInfo.hasLink) {
                if (Memory['verbose'] || this.memory.verbose)
                    console.log('Checking source carriers for '+sourceInfo.id);
                let miningRate = harvesterRequirements.body.work * 2 * harvesterRequirements.count;
                var sourceCarriers = _.filter(this.sourceCarrierCreeps, (c) => (<SourceCarrierMemory>c.memory).sourceId == sourceInfo.id);
                let requirements = this.getSourceCarrierBodyAndCount(sourceInfo,miningRate);
                this.mainRoom.spawnManager.AddToQueue(requirements.body.getBody(), { role: 'sourceCarrier', sourceId: sourceInfo.id }, requirements.count - sourceCarriers.length);
            }
            if (Memory['trace']) {
                endCpu = Game.cpu.getUsed();
                console.log('HarvestingManagers checking SourceCarriers: ' + (endCpu - startCpu).toFixed(2));
            }
        }
    }

    public tick() {
        this.harvesterCreeps.forEach((c) => { try { new Harvester(c, this.mainRoom).tick() } catch (e) { c.say('ERROR'); Memory['error'] = e; console.log(e);} });
        this.sourceCarrierCreeps.forEach((c) => { try { new SourceCarrier(c, this.mainRoom).tick() } catch (e) { c.say('ERROR'); Memory['error'] = e; console.log(e); } });
    }

}