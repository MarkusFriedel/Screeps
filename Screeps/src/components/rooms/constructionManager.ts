import {SpawnRoomHandler} from "./spawnRoomHandler";
import {Constructor} from "../creeps/constructor/constructor";
import {ConstructorDefinition} from "../creeps/constructor/constructorDefinition";

export class ConstructionManager {

    spawnRoomHandler: SpawnRoomHandler;

    creeps: Array<Creep>;
    idleCreeps: Array<Creep>;

    maxCreeps: number;

    constructor(spawnRoomHandler: SpawnRoomHandler) {
        this.spawnRoomHandler = spawnRoomHandler;
        this.creeps = _.filter(spawnRoomHandler.creeps, (c) => c.memory.role == 'constructor');
        this.idleCreeps = _.filter(this.creeps, (c) => c.memory.targetId == null);
        this.maxCreeps = 2;
    }

    public getConstruction() {
        for (var idx in Game.constructionSites) {
            return Game.constructionSites[idx];
        }
    }

    public checkCreeps() {

        var constructionSite = this.getConstruction();
        if (constructionSite != null && (this.creeps.length < this.maxCreeps || this.idleCreeps.length>0)) {
            for (var idx in this.idleCreeps) {
                var creep = this.idleCreeps[idx];
                creep.memory.targetId = constructionSite.id;
                creep.memory.targetPosition = constructionSite.pos;
            }
            this.idleCreeps = [];

            this.spawnRoomHandler.spawnManager.AddToQueue(ConstructorDefinition.getDefinition(this.spawnRoomHandler.maxSpawnEnergy).getBody(), { role: 'constructor', targetId: constructionSite.id, targetPosition: constructionSite.pos, spawnRoomName: this.spawnRoomHandler.roomName }, this.maxCreeps - this.creeps.length);
        }
    }

    public tick() {
        this.creeps.forEach((c) => new Constructor(c, this.spawnRoomHandler).tick());
    }
}