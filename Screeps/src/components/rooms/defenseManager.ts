import {MainRoom} from "./mainRoom";
import {Defender} from "../creeps/defender/defender";
import {DefenderDefinition} from "../creeps/defender/defenderDefinition";

export class DefenseManager {
    mainRoom: MainRoom;
    creeps: Array<Creep>;
    maxCreeps = 2;

    constructor(mainRoom: MainRoom) {
        this.mainRoom = mainRoom;
    }

    public checkCreeps() {
        this.getData();
        if (_.filter(this.mainRoom.allRooms, (r) => r.memory.hostiles && r.canHarvest).length > 0 && this.creeps.length < this.maxCreeps) {
            this.mainRoom.spawnManager.AddToQueue(DefenderDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'defender' }, this.maxCreeps - this.creeps.length);
        }
    }

    public tick() {
        this.getData();
        this.creeps.forEach((c) => new Defender(c, this.mainRoom).tick());
    }

    getData() {
        this.creeps = _.filter(this.mainRoom.creeps, (c) => c.memory.role == 'defender');
    }
}