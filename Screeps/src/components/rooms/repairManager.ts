import {MainRoom} from "./mainRoom";
import {Repairer} from "../creeps/repairer/repairer";
import {RepairerDefinition} from "../creeps/repairer/repairerDefinition";
//import {ObjectWithMemory} from "../../objectWithMemory";

export class RepairManager {

    public get memory(): RepairManagerMemory {
        return this.accessMemory();
    }

    accessMemory() {
        if (this.mainRoom.memory.repairManager == null)
            this.mainRoom.memory.repairManager = {
                emergencyTargets: {},
                repairTargets: {}
            }
        return this.mainRoom.memory.repairManager;
    }

    _creeps: { time: number, creeps: Array<Creep> } = { time: 0, creeps: null };
    public get creeps(): Array<Creep> {
        if (this._creeps.time < Game.time)
            this._creeps = {
                time: Game.time, creeps: _.filter(this.mainRoom.creeps, (c) => c.memory.role == 'repairer')
            };
        return this._creeps.creeps;
    }

    _idleCreeps: { time: number, creeps: Array<Creep> } = { time: 0, creeps: null };
    public get idleCreeps(): Array<Creep> {
        if (this._idleCreeps.time < Game.time)
            this._idleCreeps = {
                time: Game.time, creeps: _.filter(this.creeps, (c) => (<RepairerMemory>c.memory).targetId == null)
            };
        return this._creeps.creeps;
    }
    public set idleCreeps(value: Array<Creep>) {
        if (value == null)
            this._idleCreeps.creeps = [];
        else
            this._idleCreeps.creeps = value;
    }

    public static forceStopRepairDelegate(s: Structure): boolean {
        return (s.structureType == STRUCTURE_WALL || s.structureType == STRUCTURE_RAMPART) && s.hits > 600000 || (s.hits >= s.hitsMax);
    }

    public static targetDelegate(s: Structure): boolean {
        return (s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_WALL && s.hits < 0.5 * s.hitsMax || (s.structureType == STRUCTURE_RAMPART || s.structureType == STRUCTURE_WALL) && s.hits < 500000) && s.hits < s.hitsMax
    }

    public static emergencyTargetDelegate(s: Structure): boolean {
        return (s.hits < s.hitsMax * 0.2 && s.structureType == STRUCTURE_CONTAINER || s.hits < 1000 && s.structureType == STRUCTURE_ROAD || s.structureType == STRUCTURE_RAMPART && s.hits < 5000) && s.hits < s.hitsMax;
    }

    public static emergencyStopDelegate(s: Structure): boolean {
        return ((s.structureType == STRUCTURE_WALL || s.structureType == STRUCTURE_RAMPART) && s.hits > 20000 || s.hits >= s.hitsMax && s.structureType == STRUCTURE_ROAD || s.hits > 0.5 * s.hitsMax && s.structureType == STRUCTURE_CONTAINER) || s.hits >= s.hitsMax;
    }


    maxCreeps = 2;

    constructor(public mainRoom: MainRoom) {

    }

    public createNewRepairers() {
        if (this.mainRoom.spawnManager.isBusy || !this.mainRoom.mainContainer)
            return;
        for (let idx in this.mainRoom.allRooms) {
            let myRoom = this.mainRoom.allRooms[idx];

            if (myRoom.room && myRoom.room.find(FIND_STRUCTURES, { filter: RepairManager.targetDelegate }).length>0) {

                let roomCreeps = _.filter(this.creeps, x => x.memory.roomName == myRoom.name);
                if (roomCreeps.length < (myRoom.name == this.mainRoom.name ? Math.min(2, _.size(this.mainRoom.sources)) : 1)) {
                    this.mainRoom.spawnManager.AddToQueue(RepairerDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'repairer', roomName: myRoom.name, state: RepairerState.Refilling }, 1);
                }
            }

        }
    }

    public tick() {
        this.creeps.forEach((c) => new Repairer(c, this.mainRoom).tick());
    }
}