/// <reference path="../creeps/minerals/mineralHarvesterDefinition.ts" />
/// <reference path="../creeps/minerals/mineralHarvester.ts" />
/// <reference path="../creeps/sourceCarrier/sourceCarrierDefinition.ts" />
/// <reference path="../creeps/minerals/mineralCarrier.ts" />
/// <reference path="./manager.ts" />

class MineralHarvestingManager implements MineralHarvestingManagerInterface {

    _harvesterCreeps: { time: number, creeps: Array<Creep> } = { time: -1, creeps: null };
    public get harvesterCreeps(): Array<Creep> {
        if (this._harvesterCreeps.time < Game.time)
            this._harvesterCreeps = {
                time: Game.time, creeps: this.mainRoom.creepsByRole('mineralHarvester')
            };
        return this._harvesterCreeps.creeps;
    }

    _carrierCreeps: { time: number, creeps: Array<Creep> } = { time: -1, creeps: null };
    public get carrierCreeps(): Array<Creep> {
        if (this._carrierCreeps.time < Game.time)
            this._carrierCreeps = {
                time: Game.time, creeps: this.mainRoom.creepsByRole('mineralCarrier')
            };
        return this._carrierCreeps.creeps;
    }


    constructor(public mainRoom: MainRoom) {
        this.preTick = profiler.registerFN(this.preTick, 'MineralHarvestingManager.preTick');
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
            let mineralType = myMineral.resource;
            if (mineralType == RESOURCE_HYDROGEN || mineralType == RESOURCE_OXYGEN || mineralType == RESOURCE_CATALYST) {
                targetAmount = Colony.reactionManager.requiredAmount * 10;
            }
            //console.log('MineralHarvestingManager.checkCreeps target: ' + targetAmount + ' value: ' + this.mainRoom.terminal.store[mineralType]);
            if (this.mainRoom.terminal.store[mineralType] == null || this.mainRoom.terminal.store[mineralType] < targetAmount) {

                let harvesters = _.filter(this.harvesterCreeps, c => c.memory.mineralId == myMineral.id);

                //console.log('MineralHarvestingManager.checkCreeps - 3');
                if (harvesters.length == 0) {
                    //      console.log('MineralHarvestingManager.checkCreeps - 4');
                    let definition = MineralHarvesterDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, myMineral, this.mainRoom.managers.labManager.availablePublishResources);
                    this.mainRoom.spawnManager.addToQueue(definition.body.getBody(), { role: 'mineralHarvester', mineralId: myMineral.id }, definition.count);
                }

                let carriers = _.filter(this.carrierCreeps, c => c.memory.mineralId == myMineral.id);

                //        console.log('MineralHarvestingManager.checkCreeps - 5');
                //let pathLength = PathFinder.search(this.mainRoom.extractor.pos, { pos: this.mainRoom.terminal.pos, range: 2 }).path.length;
                let pathLength = (myMineral.pathLengthToDropOff + 10) * 1.1;
                let requiredCapacity = Math.ceil(pathLength * 2 * 10 * (['O', 'H'].indexOf(myMineral.resource) >= 0 ? 2 : 1) / (myMineral.hasKeeper ? 2 : 1));
                //console.log('Mineral Carrier: required capacits' + requiredCapacity);
                let definition = SourceCarrierDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, requiredCapacity, this.mainRoom.managers.labManager.availablePublishResources);
                //console.log('Mineral Carrier: ' + definition.count);
                //console.log('Mineral Carrier: body size ' + definition.body.getBody().length);
                this.mainRoom.spawnManager.addToQueue(definition.body.getBody(), { role: 'mineralCarrier', mineralId: myMineral.id }, definition.count - carriers.length);
            }
        }
    }

    public tick() {
        //let startCpu = Game.cpu.getUsed();
        this.harvesterCreeps.forEach((c) => { try { new MineralHarvester(c, this.mainRoom).tick() } catch (e) { c.say('ERROR'); Memory['error'] = e; console.log(e.stack); } });
        //console.log('Harvesters ' + this.mainRoom.name + ' [' + this.harvesterCreeps.length + ']: ' + (Game.cpu.getUsed() - startCpu).toFixed(2) + ' CPU');
        //startCpu = Game.cpu.getUsed();
        this.carrierCreeps.forEach((c) => { try { new MineralCarrier(c, this.mainRoom).tick() } catch (e) { c.say('ERROR'); Memory['error'] = e; console.log(e.stack); } });
        //console.log('SourceCarriers ' + this.mainRoom.name + ' [' + this.harvesterCreeps.length + ']: ' + (Game.cpu.getUsed() - startCpu).toFixed(2) + ' CPU');
    }
}