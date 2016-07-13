/// <reference path="../creeps/constructor/constructorDefinition.ts" />
/// <reference path="../creeps/constructor/constructor.ts" />

class ConstructionManager implements ConstructionManagerInterface {

    _creeps: { time: number, creeps: Array<Creep> } = { time: 0, creeps: null };
    public get creeps(): Array<Creep> {
        if (this._creeps.time < Game.time)
            this._creeps = {
                time: Game.time, creeps: _.filter(this.mainRoom.creeps, (c) => c.memory.role == 'constructor')
            };
        return this._creeps.creeps;
    }

    _idleCreeps: { time: number, creeps: Array<Creep> } = { time: 0, creeps: null };
    public get idleCreeps(): Array<Creep> {
        if (this._idleCreeps.time < Game.time)
            this._idleCreeps = {
                time: Game.time, creeps: _.filter(this.creeps, (c) => c.memory.targetId == null)
            };
        return this._creeps.creeps;
    }
    public set idleCreeps(value: Array<Creep>) {
        if (value == null)
            this._idleCreeps.creeps = [];
        else
            this._idleCreeps.creeps = value;
    }


    maxCreeps: number;


    constructor(public mainRoom: MainRoom) {
        this.maxCreeps = 2;
    }

    private _constructions: { time: number, constructions: ConstructionSite[] } = { time: -11, constructions: [] };
    public get constructions() {
        if (this._constructions.time + 10 < Game.time) {
            this._constructions.time = Game.time;
            var constructionSites = _.filter(Game.constructionSites, x => _.any(this.mainRoom.allRooms, y => x.pos.roomName == y.name));
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

    public checkCreeps() {
        //if (this.mainRoom.spawnManager.isBusy)
        //    return;
        if (this.idleCreeps.length == 0 && this.mainRoom.spawnManager.isBusy)
            return;

        if (this.constructions.length > 0 && (this.creeps.length < this.maxCreeps || this.idleCreeps.length > 0)) {
            for (var idx in this.idleCreeps) {
                var creep = this.idleCreeps[idx];
                let nearestConstruction = _.sortByAll(this.constructions, [x => x.pos.roomName == creep.room.name ? 0 : 1, x => (x.pos.x - creep.pos.x) ** 2 + ((x.pos.y - creep.pos.y) ** 2)])[0];
                creep.memory.targetId = nearestConstruction.id;
                creep.memory.targetPosition = nearestConstruction.pos;
            }
            this.idleCreeps = [];

            this.mainRoom.spawnManager.addToQueue(ConstructorDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'constructor', targetId: null, targetPosition: null }, Math.min(this.maxCreeps, _.size(this.mainRoom.sources)) - this.creeps.length);
        }
    }

    public tick() {
        this.creeps.forEach((c) => new Constructor(c, this.mainRoom).tick());
    }
}