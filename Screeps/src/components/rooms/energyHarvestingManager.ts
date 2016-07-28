/// <reference path="../creeps/energyHarvester/energyHarvesterDefinition.ts" />
/// <reference path="../creeps/energyHarvester/energyHarvester.ts" />
/// <reference path="../creeps/sourceCarrier/sourceCarrierDefinition.ts" />
/// <reference path="../creeps/sourceCarrier/sourceCarrier.ts" />
/// <reference path="./manager.ts" />

class EnergyHarvestingManager extends Manager implements EnergyHarvestingManagerInterface {

    public get memory(): EnergyHarvestingManagerMemory {
        return this.accessMemory();
    }

    accessMemory() {
        if (this.mainRoom.memory.energyHarvestingManager == null)
            this.mainRoom.memory.energyHarvestingManager = {
                debug: false,
                verbose: false
            }
        return this.mainRoom.memory.energyHarvestingManager;
    }

    _harvesterCreeps: { time: number, creeps: Array<Creep> } = { time: -1, creeps: null };
    public get harvesterCreeps(): Array<Creep> {
        if (this._harvesterCreeps.time < Game.time)
            this._harvesterCreeps = {
                time: Game.time, creeps: this.mainRoom.creepsByRole('harvester')
            };
        return this._harvesterCreeps.creeps;
    }

    _sourceCarrierCreeps: { time: number, creeps: Array<Creep> } = { time: -1, creeps: null };
    public get sourceCarrierCreeps(): Array<Creep> {
        if (this._sourceCarrierCreeps.time < Game.time)
            this._sourceCarrierCreeps = {
                time: Game.time, creeps: this.mainRoom.creepsByRole('sourceCarrier')
            };
        return this._sourceCarrierCreeps.creeps;
    }
    private static _staticTracer: Tracer;
    public static get staticTracer(): Tracer {
        if (EnergyHarvestingManager._staticTracer == null) {
            EnergyHarvestingManager._staticTracer = new Tracer('EnergyHarvestingManager');
            Colony.tracers.push(EnergyHarvestingManager._staticTracer);
        }
        return EnergyHarvestingManager._staticTracer;
    }

    constructor(public mainRoom: MainRoom) {
        super(EnergyHarvestingManager.staticTracer);
    }

    //public placeSourceContainers() {
    //    try {
    //        if (Game.time % 50 != 0)
    //            return;
    //        if (this.mainRoom.mainContainer)
    //            for (var idx in this.mainRoom.sources) {
    //                var sourceInfo = this.mainRoom.sources[idx];
    //                if (sourceInfo.hasKeeper || !sourceInfo.myRoom.canHarvest)
    //                    continue;
    //                if (!sourceInfo.hasKeeper && sourceInfo.containerMissing) {
    //                    var path = sourceInfo.pos.findPathTo(this.mainRoom.mainContainer.pos, { ignoreCreeps: true });
    //                    var containerPosition = new RoomPosition(path[0].x, path[0].y, sourceInfo.pos.roomName);
    //                    containerPosition.createConstructionSite(STRUCTURE_CONTAINER);
    //                }
    //            }
    //    }
    //    catch (e) {
    //        console.log(e.stack);
    //    }
    //}


    getHarvesterBodyAndCount(sourceInfo: MySourceInterface, noLocalRestriction = false) {
        let trace = this.tracer.start('getHarvesterBodyAndCount()');

        let mainRoom = noLocalRestriction ? _.max(_.values<MainRoom>(Colony.mainRooms), (x) => x.maxSpawnEnergy) : this.mainRoom;

        let partsRequired = Math.ceil((sourceInfo.capacity / ENERGY_REGEN_TIME) * (this.mainRoom.name != sourceInfo.myRoom.name ? 1.1 : 1) / 2) + 1;
        if (sourceInfo.hasKeeper)
            partsRequired *= 2;


        let maxWorkParts = EnergyHarvesterDefinition.getDefinition(mainRoom.maxSpawnEnergy, !this.mainRoom.harvestersShouldDeliver).work;
        

        if (maxWorkParts >= partsRequired) {
            trace.stop();
            return { body: EnergyHarvesterDefinition.getDefinition(mainRoom.maxSpawnEnergy, !this.mainRoom.harvestersShouldDeliver, partsRequired, this.mainRoom.managers.labManager.availablePublishResources,true), count: 1 };
        }
        else {
            let creepCount = Math.min(Math.ceil(partsRequired / maxWorkParts), sourceInfo.maxHarvestingSpots);
            partsRequired = Math.min(Math.ceil(partsRequired / creepCount), maxWorkParts);
            trace.stop();
            return { body: EnergyHarvesterDefinition.getDefinition(mainRoom.maxSpawnEnergy, !this.mainRoom.harvestersShouldDeliver, partsRequired), count: creepCount };
        }
    }

    getSourceCarrierBodyAndCount(sourceInfo: MySourceInterface, maxMiningRate?: number) {
        let trace = this.tracer.start('getSourceCarrierBodyAndCount()');
        let useRoads = (this.mainRoom.mainContainer && sourceInfo.roadBuiltToRoom == this.mainRoom.name);
        let pathLengh = (sourceInfo.pathLengthToDropOff + 10) * 1;

        if (pathLengh == null) {
            trace.stop();
            return {
                body: SourceCarrierDefinition.getDefinition(500),
                count: 0
            };
        }

        let sourceRate = sourceInfo.capacity / ENERGY_REGEN_TIME;

        let energyPerTick = maxMiningRate == null ? sourceRate : Math.min(maxMiningRate, sourceRate);

        let requiredCarryModules = Math.ceil(pathLengh * (useRoads ? 2 : 3) * energyPerTick / 50);

        let maxCarryParts = SourceCarrierDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, requiredCarryModules).carry;

        if (maxCarryParts >= requiredCarryModules) {
            trace.stop();
            return { body: SourceCarrierDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, requiredCarryModules), count: 1 };
        }
        else {
            let creepCount = Math.ceil(requiredCarryModules / maxCarryParts);
            requiredCarryModules = Math.ceil(requiredCarryModules / creepCount);
            trace.stop();
            return { body: SourceCarrierDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, requiredCarryModules), count: creepCount };
        }
    }


    public _preTick() {
        let startCpu: number;
        let endCpu: number;
        let spawnManager: SpawnManagerInterface = null;

        if (this.mainRoom.mainContainer && this.mainRoom.mainContainer.store.energy >= 700000)
            return;

        //if (this.mainRoom.spawnManager.isBusy) {
        //    let mainRoom = _.sortBy(_.filter(Colony.mainRooms, r => !r.spawnManager.isBusy && r.maxSpawnEnergy >= this.mainRoom.maxSpawnEnergy && r.myRoom.memory.mainRoomDistanceDescriptions[this.mainRoom.name].distance <= 3), x => x.myRoom.memory.mainRoomDistanceDescriptions[this.mainRoom.name].distance)[0];
        //    if (mainRoom)
        //        spawnManager = mainRoom.spawnManager;
        //}
        //else
        spawnManager = this.mainRoom.spawnManager;

        if (spawnManager == null || spawnManager.isBusy)
            return;

        let harvestersBySource = _.groupBy(this.harvesterCreeps, x => x.memory.sourceId);
        let carriersBySource = _.groupBy(this.sourceCarrierCreeps, x => x.memory.sourceId);

        for (var idx in this.mainRoom.sources) {
            if (spawnManager.isBusy)
                break;

            var sourceInfo = this.mainRoom.sources[idx];
            if (!Colony.getRoom(sourceInfo.pos.roomName).canHarvest) {
                continue;
            }
            if (sourceInfo.hasKeeper && _.size(this.mainRoom.managers.labManager.myLabs)==0) {
                continue;
            }

            //var harvesters = _.filter(this.harvesterCreeps, (c) => (<EnergyHarvesterMemory>c.memory).sourceId == sourceInfo.id);
            let harvesters = harvestersBySource[idx];

            let harvesterRequirements = this.getHarvesterBodyAndCount(sourceInfo);

            let requestedCreep = false;
            if (!sourceInfo.hasKeeper && harvesterRequirements.body.energyHarvestingRate * harvesterRequirements.count < sourceInfo.capacity / ENERGY_REGEN_TIME) {
                let requestHarvesterRequirements = this.getHarvesterBodyAndCount(sourceInfo, true);
                requestedCreep = Colony.spawnCreep(this.mainRoom.myRoom, requestHarvesterRequirements.body, { role: 'harvester', state: EnergyHarvesterState.Harvesting, sourceId: sourceInfo.id, mainRoomName: this.mainRoom.name, requiredBoosts: requestHarvesterRequirements.body.boosts, }, requestHarvesterRequirements.count - (harvesters ? harvesters.length : 0));
            }
            if (!requestedCreep) {
                let livingHarvesters = _.filter(harvesters, x => (x.ticksToLive > sourceInfo.pathLengthToDropOff + harvesterRequirements.body.getBody().length * 3 || x.spawning));
                spawnManager.addToQueue(harvesterRequirements.body.getBody(), { role: 'harvester', state: EnergyHarvesterState.Harvesting, sourceId: sourceInfo.id, mainRoomName: this.mainRoom.name,  }, harvesterRequirements.count - livingHarvesters.length);
            }

            if (sourceInfo.link == null) {
                let miningRate = Math.min(harvesterRequirements.body.energyHarvestingRate * harvesterRequirements.count, Math.ceil(sourceInfo.capacity / 300));
                //var sourceCarriers = _.filter(this.sourceCarrierCreeps, (c) => (<SourceCarrierMemory>c.memory).sourceId == sourceInfo.id);
                let sourceCarriers = carriersBySource[idx];
                let requirements = this.getSourceCarrierBodyAndCount(sourceInfo, miningRate);
                spawnManager.addToQueue(requirements.body.getBody(), { role: 'sourceCarrier', sourceId: sourceInfo.id, mainRoomName: this.mainRoom.name }, requirements.count - (sourceCarriers ? sourceCarriers.length : 0));
            }
        }
    }

    public _tick() {
        this.harvesterCreeps.forEach((c) => { new EnergyHarvester(c, this.mainRoom).tick() });
        this.sourceCarrierCreeps.forEach((c) => { new SourceCarrier(c, this.mainRoom).tick() });
    }


}