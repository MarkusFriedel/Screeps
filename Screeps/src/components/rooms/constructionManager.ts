import {MainRoom} from "./mainRoom";
import {Constructor} from "../creeps/constructor/constructor";
import {ConstructorDefinition} from "../creeps/constructor/constructorDefinition";

export class ConstructionManager {

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

    public getConstruction() {
        var constructionSites = _.filter(Game.constructionSites, x => _.any(this.mainRoom.allRooms, y => x.pos.roomName == y.name));
        var extensions = _.filter(constructionSites, (c) => c.structureType == STRUCTURE_EXTENSION);
        if (extensions.length > 0) {
            return extensions[0];
        }
        return constructionSites[0];
    }

    public checkCreeps() {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        var constructionSite = this.getConstruction();
        if (constructionSite != null && (this.creeps.length < this.maxCreeps || this.idleCreeps.length>0)) {
            for (var idx in this.idleCreeps) {
                var creep = this.idleCreeps[idx];
                creep.memory.targetId = constructionSite.id;
                creep.memory.targetPosition = constructionSite.pos;
            }
            this.idleCreeps = [];
            this.mainRoom.spawnManager.AddToQueue(ConstructorDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'constructor', targetId: constructionSite.id, targetPosition: constructionSite.pos }, this.maxCreeps - this.creeps.length);
        }
    }

    public tick() {
        this.creeps.forEach((c) => new Constructor(c, this.mainRoom).tick());
    }
}