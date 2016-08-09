/// <reference path="../creeps/constructor/constructorDefinition.ts" />
/// <reference path="../creeps/constructor/builder.ts" />
/// <reference path="./manager.ts" />

class ConstructionManager implements ConstructionManagerInterface {

    private _creeps: { time: number, creeps: Array<Creep> };
    public get creeps(): Array<Creep> {
        if (this._creeps == null || this._creeps.time < Game.time) {
            this._creeps = {
                time: Game.time, creeps: this.mainRoom.creepsByRole('builder')
            };
        }
        //console.log('Constructor length: ' + _.size(this._creeps.creeps));
        //console.log('Constructor[0]: ' + this._creeps.creeps);
        return this._creeps.creeps;
    }

    _idleCreeps: { time: number, creeps: Array<Creep> };
    public get idleCreeps(): Array<Creep> {
        if (this._idleCreeps == null || this._idleCreeps.time < Game.time)
            this._idleCreeps = {
                time: Game.time, creeps: _.filter(this.creeps, (c) => (<ConstructorMemory>c.memory).targetPosition == null && c.carry.energy > 0)
            };
        return this._idleCreeps.creeps;
    }
    public set idleCreeps(value: Array<Creep>) {
        if (this._idleCreeps)
            if (value == null)
                this._idleCreeps.creeps = [];
            else
                this._idleCreeps.creeps = value;
    }


    maxCreeps: number;


    

    constructor(public mainRoom: MainRoom) {
        if (myMemory['profilerActive']) {
            this.preTick = profiler.registerFN(this.preTick, 'ConstructionManager.preTick');
            this.tick = profiler.registerFN(this.tick, 'ConstructionManager.tick');
        }
        this.maxCreeps = 2;
    }

    private _constructions: { time: number, constructions: ConstructionSite[] } = { time: -11, constructions: [] };
    public get constructions() {
        if (this._constructions.time < Game.time) {
            this._constructions.time = Game.time;
            let myRoomNames = _.map(this.mainRoom.allRooms, x => x.name);
            var constructionSites = _.filter(Game.constructionSites, x => myRoomNames.indexOf(x.pos.roomName) >= 0);
            var extensions = _.filter(constructionSites, (c) => c.structureType == STRUCTURE_EXTENSION);
            if (extensions.length > 0) {
                this._constructions.constructions = extensions;
            }
            else {
                let everythingButRoads = _.filter(constructionSites, c => c.structureType != STRUCTURE_ROAD);
                if (everythingButRoads.length > 0)
                    this._constructions.constructions = everythingButRoads;
                else
                    this._constructions.constructions = constructionSites;
            }
        }
        return this._constructions.constructions;
    }

    public preTick() {
        //if (this.mainRoom.spawnManager.isBusy)
        //    return;

        //console.log('Construction Manager ' + this.mainRoom.name + ' IdleCreeps: ' + this.idleCreeps.length);

        if (this.idleCreeps.length == 0 && this.mainRoom.spawnManager.isBusy)
            return;

       

        if (this.constructions.length > 0 && (this.creeps.length < this.maxCreeps || this.idleCreeps.length > 0)) {
            for (var idx in this.idleCreeps) {
                var creep = this.idleCreeps[idx];
                let nearestConstruction = _.sortByAll(this.constructions, [x => x.pos.roomName == creep.room.name ? 0 : 1, x => Game.map.findRoute(x.pos.roomName, creep.room), x => (x.pos.x - creep.pos.x) ** 2 + ((x.pos.y - creep.pos.y) ** 2)])[0];
                creep.memory.targetId = nearestConstruction.id;
                creep.memory.targetPosition = nearestConstruction.pos;
            }
            this.idleCreeps = [];

            if (this.mainRoom.mainContainer == null && this.mainRoom.room.energyAvailable == this.mainRoom.room.energyCapacityAvailable && this.mainRoom.spawnManager.queue.length < 1)
                var maxCreeps = Math.min(this.creeps.length + 1, 2);
            else
                maxCreeps = this.maxCreeps;

            this.mainRoom.spawnManager.addToQueue(ConstructorDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'builder', targetId: null, targetPosition: null }, Math.min(maxCreeps, _.size(_.filter(this.mainRoom.sources, x => !x.hasKeeper))) - this.creeps.length);
        }
    }

    public tick() {
        try { this.creeps.forEach((c) => new Builder(c.name, this.mainRoom).tick()) } catch (e) { console.log(e.stack); };
    }
}