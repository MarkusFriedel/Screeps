/// <reference path="../creeps/energyHarvester/energyHarvesterDefinition.ts" />
/// <reference path="../creeps/minerals/mineralHarvester.ts" />
/// <reference path="../creeps/sourceCarrier/sourceCarrierDefinition.ts" />
/// <reference path="../creeps/minerals/mineralCarrier.ts" />
/// <reference path="./manager.ts" />

class MineralHarvestingManager extends Manager implements MineralHarvestingManagerInterface {

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

    private static _staticTracer: Tracer;
    public static get staticTracer(): Tracer {
        if (MineralHarvestingManager._staticTracer == null) {
            MineralHarvestingManager._staticTracer = new Tracer('MineralHarvestingManager');
            Colony.tracers.push(MineralHarvestingManager._staticTracer);
        }
        return MineralHarvestingManager._staticTracer;
    }

    constructor(public mainRoom: MainRoom) {
        super(MineralHarvestingManager.staticTracer);
    }

    public _preTick() {

        if (this.mainRoom.spawnManager.isBusy)
            return;

        _.forEach(this.mainRoom.minerals, myMineral => {


            //console.log('MineralHarvestingManager.checkCreeps()');
            if (!myMineral.hasKeeper && this.mainRoom.terminal && myMineral.hasExtractor && (myMineral.amount > 0 || myMineral.refreshTime <= Game.time)) {
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
                        let definition = EnergyHarvesterDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, true, 10 * (['O', 'H'].indexOf(myMineral.resource) >= 0 ? 2 : 1));
                        this.mainRoom.spawnManager.addToQueue(definition.getBody(), { role: 'mineralHarvester', mineralId: myMineral.id });
                    }

                    let carriers = _.filter(this.carrierCreeps, c => c.memory.mineralId == myMineral.id);

                    if (carriers.length == 0) {
                        //        console.log('MineralHarvestingManager.checkCreeps - 5');
                        //let pathLength = PathFinder.search(this.mainRoom.extractor.pos, { pos: this.mainRoom.terminal.pos, range: 2 }).path.length;
                        let pathLength = (myMineral.pathLengthToDropOff+10) * 1.1;
                        let requiredCarryModules = Math.ceil(pathLength * 2 * 10 * (['O','H'].indexOf(myMineral.resource)>=0 ? 2 : 1) / 50);
                        let definition = SourceCarrierDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, requiredCarryModules);
                        this.mainRoom.spawnManager.addToQueue(definition.getBody(), { role: 'mineralCarrier', mineralId: myMineral.id });
                    }
                }
            }
        });
    }

    public _tick() {
        //let startCpu = Game.cpu.getUsed();
        this.harvesterCreeps.forEach((c) => { try { new MineralHarvester(c, this.mainRoom).tick() } catch (e) { c.say('ERROR'); Memory['error'] = e; console.log(e.stack); } });
        //console.log('Harvesters ' + this.mainRoom.name + ' [' + this.harvesterCreeps.length + ']: ' + (Game.cpu.getUsed() - startCpu).toFixed(2) + ' CPU');
        //startCpu = Game.cpu.getUsed();
        this.carrierCreeps.forEach((c) => { try { new MineralCarrier(c, this.mainRoom).tick() } catch (e) { c.say('ERROR'); Memory['error'] = e; console.log(e.stack); } });
        //console.log('SourceCarriers ' + this.mainRoom.name + ' [' + this.harvesterCreeps.length + ']: ' + (Game.cpu.getUsed() - startCpu).toFixed(2) + ' CPU');
    }
}