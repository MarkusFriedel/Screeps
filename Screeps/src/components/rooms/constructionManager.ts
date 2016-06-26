import {MainRoom} from "./mainRoom";
import {Constructor} from "../creeps/constructor/constructor";
import {ConstructorDefinition} from "../creeps/constructor/constructorDefinition";

export class ConstructionManager {

    mainRoom: MainRoom;

    creeps: Array<Creep>;
    idleCreeps: Array<Creep>;

    maxCreeps: number;
    

    constructor(mainRoom: MainRoom) {
        this.mainRoom = mainRoom;
        this.maxCreeps = 2;
        this.getData();
    }

    public getConstruction() {
        var constructionSites = Game.constructionSites;
        var extensions = _.filter(constructionSites, (c) => c.structureType == STRUCTURE_EXTENSION);
        if (extensions.length > 0) {
            return extensions[0];
        }
        for (var idx in constructionSites) {
            return constructionSites[idx];
        }
    }

    getData() {
        this.creeps = _.filter(this.mainRoom.creeps, (c) => c.memory.role == 'constructor');
        this.idleCreeps = _.filter(this.creeps, (c) => c.memory.targetId == null);
    }

    public checkCreeps() {
        this.getData();
        //console.log('idle creeps: ' + this.idleCreeps.length);
        //console.log('active creeps: ' + this.creeps.length);
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
        this.getData();
        this.creeps.forEach((c) => new Constructor(c, this.mainRoom).tick());
    }
}