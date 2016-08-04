/// <reference path="../creeps/energyHarvester/energyHarvesterDefinition.ts" />
/// <reference path="../creeps/energyHarvester/energyHarvester.ts" />
/// <reference path="../creeps/sourceCarrier/sourceCarrierDefinition.ts" />
/// <reference path="../creeps/sourceCarrier/sourceCarrier.ts" />
/// <reference path="./manager.ts" />

class EnergyHarvestingManager implements EnergyHarvestingManagerInterface {

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

    _harvestersBySource: { time: number, harvesters: { [sourceId: string]: Creep[] } };
    public get harvestersBySource() {
        if (this._harvestersBySource == null || this._harvestersBySource.time < Game.time)
            this._harvestersBySource = {
                time: Game.time, harvesters: _.groupBy(this.harvesterCreeps, x => x.memory.sourceId)
            }
        return this._harvestersBySource.harvesters;
    }
    _carriersBySource: { time: number, carriers: { [sourceId: string]: Creep[] } };
    public get carriersBySource() {
        if (this._carriersBySource == null || this._carriersBySource.time < Game.time)
            this._carriersBySource = {
                time: Game.time, carriers: _.groupBy(this.sourceCarrierCreeps, x => x.memory.sourceId)
            }
        return this._carriersBySource.carriers;
    }

    constructor(public mainRoom: MainRoom) {
        this.preTick = profiler.registerFN(this.preTick, 'EnergyHarvestingManager.preTick');
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

        let maxSpawnEnergy = noLocalRestriction ? _.max(_.values<MainRoom>(Colony.mainRooms), (x) => x.maxSpawnEnergy).maxSpawnEnergy : this.mainRoom.maxSpawnEnergy;

        let result = EnergyHarvesterDefinition.getDefinition(maxSpawnEnergy, sourceInfo, this.mainRoom.harvestersShouldDeliver, this.mainRoom.managers.labManager.availablePublishResources);

        return result;
    }

    getSourceCarrierBodyAndCount(sourceInfo: MySourceInterface, maxMiningRate?: number) {
        let useRoads = (this.mainRoom.mainContainer && sourceInfo.roadBuiltToRoom == this.mainRoom.name);
        let pathLengh = (sourceInfo.pathLengthToDropOff + 10) * 1;

        if (pathLengh == null)
            pathLengh = 50;

        let sourceRate = sourceInfo.capacity / ENERGY_REGEN_TIME;

        let energyPerTick = maxMiningRate == null ? sourceRate : Math.min(maxMiningRate, sourceRate);

        let requiredCapacity = energyPerTick * pathLengh * (useRoads ? 2 : 3);

        return SourceCarrierDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, requiredCapacity, this.mainRoom.managers.labManager.availablePublishResources);

    }

    private createCreep(sourceInfo: MySourceInterface, spawnManager: SpawnManagerInterface) {
        //var harvesters = _.filter(this.harvesterCreeps, (c) => (<EnergyHarvesterMemory>c.memory).sourceId == sourceInfo.id);
        if (this.harvestersBySource[sourceInfo.id] && this.harvestersBySource[sourceInfo.id].length != 0 && (this.carriersBySource[sourceInfo.id] && this.carriersBySource[sourceInfo.id].length != 0 || sourceInfo.link) && this.memory.creepCounts && this.memory.creepCounts[sourceInfo.id] && this.memory.creepCounts[sourceInfo.id].harvesters <= this.harvestersBySource[sourceInfo.id].length && (sourceInfo.link || this.memory.creepCounts[sourceInfo.id].carriers <= this.carriersBySource[sourceInfo.id].length)) {
            if (!this.memory.sleepUntil)
                this.memory.sleepUntil = {};
            this.memory.sleepUntil[sourceInfo.id] = Game.time + 10;
            return;
        }

        let harvesters = this.harvestersBySource[sourceInfo.id];

        let harvesterRequirements = this.getHarvesterBodyAndCount(sourceInfo);
        if (harvesterRequirements.count > 0) {
            let requestedCreep = false;
            //if (!sourceInfo.hasKeeper && harvesterRequirements.body.energyHarvestingRate * harvesterRequirements.count < sourceInfo.capacity / ENERGY_REGEN_TIME) {
            //    let requestHarvesterRequirements = this.getHarvesterBodyAndCount(sourceInfo, true);
            //    console.log('MainRoom ' + this.mainRoom.name + ' requests harvester: ' + requestHarvesterRequirements.count);
            //    requestedCreep = Colony.spawnCreep(this.mainRoom.myRoom, requestHarvesterRequirements.body, { role: 'harvester', state: EnergyHarvesterState.Harvesting, sourceId: sourceInfo.id, mainRoomName: this.mainRoom.name, requiredBoosts: requestHarvesterRequirements.body.boosts, }, requestHarvesterRequirements.count - (harvesters ? harvesters.length : 0));
            //}
            if (!requestedCreep) {
                let livingHarvesters = _.filter(harvesters, x => ((x.ticksToLive > sourceInfo.pathLengthToDropOff + harvesterRequirements.body.getBody().length * 3) || x.spawning));
                var harvesterCount = harvesterRequirements.count - livingHarvesters.length;
                spawnManager.addToQueue(harvesterRequirements.body.getBody(), { role: 'harvester', state: EnergyHarvesterState.Harvesting, sourceId: sourceInfo.id, mainRoomName: this.mainRoom.name, requiredBoosts: harvesterRequirements.body.boosts }, harvesterCount);
            }

            if (sourceInfo.link == null && this.mainRoom.mainContainer) {
                let miningRate = Math.min(Math.ceil(harvesterRequirements.body.energyHarvestingRate * harvesterRequirements.count / (sourceInfo.hasKeeper ? 2 : 1)), Math.ceil(sourceInfo.capacity / 300) * 1) * (sourceInfo.hasKeeper ? 1.2 : 1);

                //var sourceCarriers = _.filter(this.sourceCarrierCreeps, (c) => (<SourceCarrierMemory>c.memory).sourceId == sourceInfo.id);
                let sourceCarriers = this.carriersBySource[sourceInfo.id];
                let requirements = this.getSourceCarrierBodyAndCount(sourceInfo, miningRate);
                var carrierCount = Math.min(requirements.count, requirements.count) - (sourceCarriers ? sourceCarriers.length : 0);
                spawnManager.addToQueue(requirements.body.getBody(), { role: 'sourceCarrier', sourceId: sourceInfo.id, mainRoomName: this.mainRoom.name }, carrierCount);
            }
        }

        if (harvesterRequirements.count==0 || harvesterCount == 0 && carrierCount == 0) {
            if (!this.memory.sleepUntil)
                this.memory.sleepUntil = {};
            this.memory.sleepUntil[sourceInfo.id] = Game.time + 10;
            if (!this.memory.creepCounts)
                this.memory.creepCounts = {};
            this.memory.creepCounts[sourceInfo.id] = {
                carriers: this.carriersBySource[sourceInfo.id] ? this.carriersBySource[sourceInfo.id].length : 0,
                harvesters: this.harvestersBySource[sourceInfo.id] ? this.harvestersBySource[sourceInfo.id].length : 0,
            }
        }
    }

    public preTick(myRoom: MyRoomInterface) {
        if (this.mainRoom.spawnManager.isBusy || !myRoom.canHarvest || _.any(myRoom.hostileScan.creeps, c => c.bodyInfo.totalAttackRate > 0))
            return;

        if (this.memory.sleepUntil && this.memory.sleepUntil.sleepUntil > Game.time)
            return;


        let spawnManager: SpawnManagerInterface = null;

        if (this.mainRoom.mainContainer && this.mainRoom.mainContainer.store.energy >= 800000)
            this.mainRoom.harvestingActive = false;
        else if (!this.mainRoom.mainContainer || this.mainRoom.mainContainer.store.energy < 300000)
            this.mainRoom.harvestingActive = true;


        //if (this.mainRoom.spawnManager.isBusy) {
        //    let mainRoom = _.sortBy(_.filter(Colony.mainRooms, r => !r.spawnManager.isBusy && r.maxSpawnEnergy >= this.mainRoom.maxSpawnEnergy && r.myRoom.memory.mainRoomDistanceDescriptions[this.mainRoom.name].distance <= 3), x => x.myRoom.memory.mainRoomDistanceDescriptions[this.mainRoom.name].distance)[0];
        //    if (mainRoom)
        //        spawnManager = mainRoom.spawnManager;
        //}
        //else
        spawnManager = this.mainRoom.spawnManager;

        if (spawnManager == null || spawnManager.isBusy)
            return;

        let sources = _.filter(myRoom.mySources, s => s.usable && (!this.memory.sleepUntil || !this.memory.sleepUntil[s.id] || this.memory.sleepUntil[s.id] < Game.time) && (this.mainRoom.harvestingActive || s.myRoom.name == this.mainRoom.name));

        if (sources.length == 0) {
            if (!this.memory.sleepUntil)
                this.memory.sleepUntil = {};
            this.memory.sleepUntil.sleepUntil = Game.time + 10;
        }

        for (var idx in sources) {
            if (spawnManager.isBusy)
                break;

            this.createCreep(sources[idx], spawnManager);

        }
    }

    public tick() {
        this.harvesterCreeps.forEach((c) => { new EnergyHarvester(c, this.mainRoom).tick() });
        this.sourceCarrierCreeps.forEach((c) => { new SourceCarrier(c, this.mainRoom).tick() });
    }


}