import {SpawnRoomHandler} from "./spawnRoomHandler";
export class RepairManager {

    spawnRoomHandler: SpawnRoomHandler;
    creeps: Array<Creep>;
    idleCreeps: Array<Creep>;
    repairTargets: Array<Structure>;

    constructor(spawnRoomHandler: SpawnRoomHandler) {
        this.spawnRoomHandler = spawnRoomHandler;
        this.creeps = _.filter(spawnRoomHandler.creeps, (c) => c.memory.role == 'repairer');
        this.idleCreeps = _.filter(this.creeps, (c) => c.memory.targetId == null);
    }

    getRepairTargets() {

    }

    public checkCreeps() {

    }

    public tick() {

    }
}