/// <reference path="../creeps/minerals/mineralHarvesterDefinition.ts" />
/// <reference path="../creeps/minerals/mineralHarvester.ts" />
/// <reference path="../creeps/sourceCarrier/sourceCarrierDefinition.ts" />
/// <reference path="../creeps/minerals/mineralCarrier.ts" />
/// <reference path="./manager.ts" />

class MineralHarvestingManager implements MineralHarvestingManagerInterface {

    private _harvesters: { time: number, harvesters: { [name: string]: Harvester } }
    public get harvesters() {
        if (this._harvesters == null)
            this._harvesters = { time: Game.time, harvesters: _.indexBy(_.map(this.harvesterCreeps, c => new Harvester(c.name, this.mainRoom)), x => x.name) };
        else if (this._harvesters.time < Game.time) {
            _.forEach(this.harvesterCreeps, c => {
                if (!this._harvesters.harvesters[c.name])
                    this._harvesters.harvesters[c.name] = new Harvester(c.name, this.mainRoom);
            });
        }
        return this._harvesters.harvesters;
    }

    private _sourceCarriers: { time: number, sourceCarriers: { [name: string]: HarvestingCarrier } }
    public get sourceCarriers() {
        if (this._sourceCarriers == null)
            this._sourceCarriers = { time: Game.time, sourceCarriers: _.indexBy(_.map(this.carrierCreeps, c => new HarvestingCarrier(c.name, this.mainRoom)), x => x.name) };
        else if (this._sourceCarriers.time < Game.time) {
            _.forEach(this.carrierCreeps, c => {
                if (!this._sourceCarriers.sourceCarriers[c.name])
                    this._sourceCarriers.sourceCarriers[c.name] = new HarvestingCarrier(c.name, this.mainRoom);
            });
        }
        return this._sourceCarriers.sourceCarriers;
    }

    private _harvesterCreeps: { time: number, creeps: Array<Creep> };
    public get harvesterCreeps(): Array<Creep> {
        if (this._harvesterCreeps == null || this._harvesterCreeps.time < Game.time)
            this._harvesterCreeps = {
                time: Game.time, creeps: _.filter(this.mainRoom.creepsByRole('mineralHarvester'), c => this.mainRoom.minerals[c.memory.sId])
            };
        return this._harvesterCreeps.creeps;
    }

    private _carrierCreeps: { time: number, creeps: Array<Creep> };
    public get carrierCreeps(): Array<Creep> {
        if (this._carrierCreeps == null || this._carrierCreeps.time < Game.time)
            this._carrierCreeps = {
                time: Game.time, creeps: _.filter(this.mainRoom.creepsByRole('mineralCarrier'), c => this.mainRoom.minerals[c.memory.sId])
            };
        return this._carrierCreeps.creeps;
    }

    private _harvestersByMineral: { time: number, harvesters: { [sourceId: string]: Creep[] } };
    public get harvestersByMineral() {
        if (this._harvestersByMineral == null || this._harvestersByMineral.time < Game.time)
            this._harvestersByMineral = {
                time: Game.time, harvesters: _.groupBy(this.harvesterCreeps, x => x.memory.sId)
            }
        return this._harvestersByMineral.harvesters;
    }
    private _carriersByMineral: { time: number, carriers: { [sourceId: string]: Creep[] } };
    public get carriersByMineral() {
        if (this._carriersByMineral == null || this._carriersByMineral.time < Game.time)
            this._carriersByMineral = {
                time: Game.time, carriers: _.groupBy(this.carrierCreeps, x => x.memory.sId)
            }
        return this._carriersByMineral.carriers;
    }


    constructor(public mainRoom: MainRoom) {
        if (myMemory['profilerActive']) {
            this.preTick = profiler.registerFN(this.preTick, 'MineralHarvestingManager.preTick');
            this.tick = profiler.registerFN(this.tick, 'MineralHarvestingManager.tick');
        }
    }

    public preTick(myRoom: MyRoomInterface) {

        if (this.mainRoom.spawnManager.isBusy)
            return;

        if (_.size(this.mainRoom.managers.labManager.myLabs) == 0)
            return;

        let myMineral = myRoom.myMineral;
        if (myMineral == null || (myMineral.hasKeeper && _.size(this.mainRoom.managers.labManager.myLabs) == 0) || !myMineral.hasExtractor)
            return;

        if (myMineral.myRoom && _.any(myMineral.myRoom.hostileScan.creeps, c => c.bodyInfo.totalAttackRate > 0))
            return;

        //console.log('MineralHarvestingManager.checkCreeps()');
        if ((!myMineral.hasKeeper || _.size(this.mainRoom.managers.labManager.myLabs) > 0 && myMineral.maxHarvestingSpots > 1) && this.mainRoom.terminal && myMineral.hasExtractor && (myMineral.amount > 0 || myMineral.refreshTime <= Game.time)) {
            //  console.log('MineralHarvestingManager.checkCreeps - 2');
            let targetAmount = Colony.reactionManager.requiredAmount * 5;
            let mineralType = myMineral.resourceType;
            if (mineralType == RESOURCE_HYDROGEN || mineralType == RESOURCE_OXYGEN || mineralType == RESOURCE_CATALYST) {
                targetAmount = Colony.reactionManager.requiredAmount * 10;
            }
            //console.log('MineralHarvestingManager.checkCreeps target: ' + targetAmount + ' value: ' + this.mainRoom.terminal.store[mineralType]);
            if (this.mainRoom.terminal.store[mineralType] == null || this.mainRoom.terminal.store[mineralType] < targetAmount) {

                let harvesters = this.harvestersByMineral[myMineral.id];
                let harvesterCount = harvesters ? harvesters.length : 0;

                //console.log('MineralHarvestingManager.checkCreeps - 3');
                if (harvesterCount == 0) {
                    //      console.log('MineralHarvestingManager.checkCreeps - 4');
                    let definition = MineralHarvesterDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, myMineral, this.mainRoom.managers.labManager.availablePublishResources);
                    this.mainRoom.spawnManager.addToQueue(definition.body.getBody(), { role: 'mineralHarvester', sId: myMineral.id }, definition.count);
                }

                let carriers = this.carriersByMineral[myMineral.id];
                let carrierCount = carriers ? carriers.length : 0;

                //        console.log('MineralHarvestingManager.checkCreeps - 5');
                //let pathLength = PathFinder.search(this.mainRoom.extractor.pos, { pos: this.mainRoom.terminal.pos, range: 2 }).path.length;
                let pathLength = (myMineral.pathLengthToDropOff + 10) * 1.1;
                let requiredCapacity = Math.ceil(pathLength * 2 * 10 * (['O', 'H'].indexOf(myMineral.resourceType) >= 0 ? 2 : 1) / (myMineral.hasKeeper ? 2 : 1));
                //console.log('Mineral Carrier: required capacits' + requiredCapacity);
                let definition = SourceCarrierDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, requiredCapacity, this.mainRoom.managers.labManager.availablePublishResources);
                //console.log('Mineral Carrier: ' + definition.count);
                //console.log('Mineral Carrier: body size ' + definition.body.getBody().length);
                this.mainRoom.spawnManager.addToQueue(definition.body.getBody(), { role: 'mineralCarrier', sId: myMineral.id }, definition.count - carrierCount);
            }
        }
    }

    public tick() {
        //let startCpu = Game.cpu.getUsed();
        //this.harvesterCreeps.forEach((c) => { try { new MineralHarvester(c.name, this.mainRoom).tick() } catch (e) { c.say('ERROR'); console.log(e.stack); } });
        _.forEach(this.harvesters, h => h.tick());
        //console.log('Harvesters ' + this.mainRoom.name + ' [' + this.harvesterCreeps.length + ']: ' + (Game.cpu.getUsed() - startCpu).toFixed(2) + ' CPU');
        //startCpu = Game.cpu.getUsed();
        _.forEach(this.sourceCarriers, c => c.tick());
        //this.carrierCreeps.forEach((c) => { try { new MineralCarrier(c.name, this.mainRoom).tick() } catch (e) { c.say('ERROR'); console.log(e.stack); } });
        //console.log('SourceCarriers ' + this.mainRoom.name + ' [' + this.harvesterCreeps.length + ']: ' + (Game.cpu.getUsed() - startCpu).toFixed(2) + ' CPU');
    }
}