/// <reference path="../creeps/harvester/harvesterDefinition.ts" />
/// <reference path="../creeps/harvester/harvester.ts" />
/// <reference path="../creeps/sourceCarrier/sourceCarrierDefinition.ts" />
/// <reference path="../creeps/sourceCarrier/sourceCarrier.ts" />
/// <reference path="../../memoryObject.ts" />

class HarvestingManager extends MemoryObject implements HarvestingManagerInterface {

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

    _harvesterCreeps: { time: number, creeps: Array<Creep> } = { time: -1, creeps: null };
    public get harvesterCreeps(): Array<Creep> {
        if (this._harvesterCreeps.time < Game.time)
            this._harvesterCreeps = {
                time: Game.time, creeps: _.filter(this.mainRoom.creeps, (c) => c.memory.role == 'harvester')
            };
        return this._harvesterCreeps.creeps;
    }

    _sourceCarrierCreeps: { time: number, creeps: Array<Creep> } = { time: -1, creeps: null };
    public get sourceCarrierCreeps(): Array<Creep> {
        if (this._sourceCarrierCreeps.time < Game.time)
            this._sourceCarrierCreeps = {
                time: Game.time, creeps: _.filter(this.mainRoom.creeps, (c) => c.memory.role == 'sourceCarrier')
            };
        return this._sourceCarrierCreeps.creeps;
    }

    constructor(public mainRoom: MainRoom) {
        super();
    }

    public placeSourceContainers() {
        try {
            if (Game.time % 50 != 0)
                return;
            if (this.mainRoom.mainContainer)
                for (var idx in this.mainRoom.sources) {
                    var sourceInfo = this.mainRoom.sources[idx];
                    if (sourceInfo.hasKeeper || !sourceInfo.myRoom.canHarvest)
                        continue;
                    if (!sourceInfo.hasKeeper && sourceInfo.containerMissing) {
                        var path = sourceInfo.pos.findPathTo(this.mainRoom.mainContainer.pos, { ignoreCreeps: true });
                        var containerPosition = new RoomPosition(path[0].x, path[0].y, sourceInfo.pos.roomName);
                        containerPosition.createConstructionSite(STRUCTURE_CONTAINER);
                    }
                }
        }
        catch (e) {
            console.log(e.stack);
        }
    }


    getHarvesterBodyAndCount(sourceInfo: MySourceInterface, noLocalRestriction=false) {
        if (Memory['verbose'] || this.memory.verbose)
            console.log('MAX_ENERGY: ' + this.mainRoom.maxSpawnEnergy);

        let mainRoom = noLocalRestriction ? _.max(_.values<MainRoom>(Colony.mainRooms), (x) => x.maxSpawnEnergy) : this.mainRoom;

        let partsRequired = Math.ceil((sourceInfo.energyCapacity / ENERGY_REGEN_TIME) / 2) + 1;

        let maxWorkParts = HarvesterDefinition.getDefinition(mainRoom.maxSpawnEnergy, sourceInfo.requiresCarrier).work;

        if (maxWorkParts >= partsRequired)
            return { body: HarvesterDefinition.getDefinition(mainRoom.maxSpawnEnergy, sourceInfo.requiresCarrier, partsRequired), count: 1 };
        else {
            let creepCount = Math.min(Math.ceil(partsRequired / maxWorkParts), sourceInfo.maxHarvestingSpots);
            partsRequired = Math.min(Math.ceil(partsRequired / creepCount), maxWorkParts);
            return { body: HarvesterDefinition.getDefinition(mainRoom.maxSpawnEnergy, sourceInfo.requiresCarrier, partsRequired), count: creepCount };
        }
    }

    getSourceCarrierBodyAndCount(sourceInfo: MySourceInterface, maxMiningRate?: number) {
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
            if (!Colony.getRoom(sourceInfo.pos.roomName).canHarvest) {
                if (Memory['verbose'] || this.memory.verbose)
                    console.log('HarvestingManager.checkCreeps(): We can\'t mine in this room');
                continue;
            }

            if (sourceInfo.hasKeeper) {
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
            let requestedCreep = false;
            if (harvesterRequirements.body.harvestingRate * harvesterRequirements.count < sourceInfo.energyCapacity / ENERGY_REGEN_TIME) {
                let requestHarvesterRequirements = this.getHarvesterBodyAndCount(sourceInfo, true);
                requestedCreep = Colony.spawnCreep(this.mainRoom.myRoom, requestHarvesterRequirements.body, { role: 'harvester', state: HarvesterState.Harvesting, sourceId: sourceInfo.id, mainRoomName: this.mainRoom.name }, requestHarvesterRequirements.count - harvesters.length + (!sourceInfo.requiresCarrier ? 0 : 0));
                if (Memory['verbose'] || this.memory.verbose)
                    console.log('HarvestingManager.checkCreeps(): Requested harvester: ' + (requestedCreep ? 'sucessfull':'failed'));
            }
            if (!requestedCreep) {
                if (Memory['verbose'] || this.memory.verbose)
                    console.log('HarvestingManager.checkCreeps(): Requirements-cound: ' + harvesterRequirements.count + ' Requirements- body: ' + JSON.stringify(harvesterRequirements.body));
                let livingHarvesters = _.filter(harvesters, x => (x.ticksToLive > sourceInfo.pathLengthToMainContainer || x.ticksToLive === undefined));
                this.mainRoom.spawnManager.addToQueue(harvesterRequirements.body.getBody(), { role: 'harvester', state: HarvesterState.Harvesting, sourceId: sourceInfo.id }, harvesterRequirements.count - livingHarvesters.length + (!sourceInfo.requiresCarrier ? 0 : 0));
            }
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
                    console.log('Checking source carriers for ' + sourceInfo.id);
                let miningRate = Math.min(harvesterRequirements.body.work * 2 * harvesterRequirements.count, Math.ceil(sourceInfo.energyCapacity / 300));
                var sourceCarriers = _.filter(this.sourceCarrierCreeps, (c) => (<SourceCarrierMemory>c.memory).sourceId == sourceInfo.id);
                let requirements = this.getSourceCarrierBodyAndCount(sourceInfo,miningRate);
                this.mainRoom.spawnManager.addToQueue(requirements.body.getBody(), { role: 'sourceCarrier', sourceId: sourceInfo.id }, requirements.count - sourceCarriers.length);
            }
        }
    }

    public tick() {
        //let startCpu = Game.cpu.getUsed();
        this.harvesterCreeps.forEach((c) => { try { new Harvester(c, this.mainRoom).tick() } catch (e) { c.say('ERROR'); Memory['error'] = e; console.log(e.stack); } });
        //console.log('Harvesters ' + this.mainRoom.name + ' [' + this.harvesterCreeps.length + ']: ' + (Game.cpu.getUsed() - startCpu).toFixed(2) + ' CPU');
        //startCpu = Game.cpu.getUsed();
        this.sourceCarrierCreeps.forEach((c) => { try { new SourceCarrier(c, this.mainRoom).tick() } catch (e) { c.say('ERROR'); Memory['error'] = e; console.log(e.stack); } });
        //console.log('SourceCarriers ' + this.mainRoom.name + ' [' + this.harvesterCreeps.length + ']: ' + (Game.cpu.getUsed() - startCpu).toFixed(2) + ' CPU');
    }

}