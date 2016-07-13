/// <reference path="../creeps/harvester/harvesterDefinition.ts" />
/// <reference path="../creeps/minerals/mineralHarvester.ts" />
/// <reference path="../creeps/sourceCarrier/sourceCarrierDefinition.ts" />
/// <reference path="../creeps/minerals/mineralCarrier.ts" />

class MineralHarvestingManager {

    _harvesterCreeps: { time: number, creeps: Array<Creep> } = { time: -1, creeps: null };
    public get harvesterCreeps(): Array<Creep> {
        if (this._harvesterCreeps.time < Game.time)
            this._harvesterCreeps = {
                time: Game.time, creeps: _.filter(this.mainRoom.creeps, (c) => c.memory.role == 'mineralHarvester')
            };
        return this._harvesterCreeps.creeps;
    }

    _carrierCreeps: { time: number, creeps: Array<Creep> } = { time: -1, creeps: null };
    public get carrierCreeps(): Array<Creep> {
        if (this._carrierCreeps.time < Game.time)
            this._carrierCreeps = {
                time: Game.time, creeps: _.filter(this.mainRoom.creeps, (c) => c.memory.role == 'mineralCarrier')
            };
        return this._carrierCreeps.creeps;
    }

    constructor(public mainRoom: MainRoomInterface) {
    }

    public checkCreeps() {
        //console.log('MineralHarvestingManager.checkCreeps()');
        if (this.mainRoom.terminal && this.mainRoom.extractor && this.mainRoom.extractorContainer && this.mainRoom.mineral && this.mainRoom.mineral.mineralAmount > 0) {
          //  console.log('MineralHarvestingManager.checkCreeps - 2');
            let targetAmount = 25000;
            let mineralType = this.mainRoom.mineral.mineralType;
            if (mineralType == RESOURCE_HYDROGEN || mineralType == RESOURCE_OXYGEN || mineralType == RESOURCE_CATALYST) {
                targetAmount = 50000;
            }
            //console.log('MineralHarvestingManager.checkCreeps target: ' + targetAmount + ' value: ' + this.mainRoom.terminal.store[mineralType]);
            if (this.mainRoom.terminal.store[mineralType]==null || this.mainRoom.terminal.store[mineralType]<targetAmount) {
                //console.log('MineralHarvestingManager.checkCreeps - 3');
                if (this.harvesterCreeps.length == 0) {
              //      console.log('MineralHarvestingManager.checkCreeps - 4');
                    let definition = HarvesterDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, true, 5);
                    this.mainRoom.spawnManager.addToQueue(definition.getBody(), { role: 'mineralHarvester' });
                }

                if (this.carrierCreeps.length == 0) {
            //        console.log('MineralHarvestingManager.checkCreeps - 5');
                    let pathLength = PathFinder.search(this.mainRoom.extractor.pos, { pos: this.mainRoom.terminal.pos, range: 2 }).path.length;
                    let requiredCarryModules = Math.ceil(pathLength * 1 * 10 / 50) + 1;
                    let definition = SourceCarrierDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, requiredCarryModules);
                    this.mainRoom.spawnManager.addToQueue(definition.getBody(), { role: 'mineralCarrier' });
                }
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