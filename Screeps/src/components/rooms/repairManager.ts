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

    mainRoom: MainRoom;
    creeps: Array<Creep>;
    idleCreeps: Array<Creep>;
    maxCreeps = 2;

    constructor(mainRoom: MainRoom) {
        this.mainRoom = mainRoom;
        this.getData();
        if (this.memory.repairTargets == null || this.memory.emergencyTargets == null) {
            if (this.memory.repairTargets == null)
                this.memory.repairTargets = {};
            if (this.memory.emergencyTargets == null)
                this.memory.emergencyTargets = {};
            this.loadRepairTargets();
        }
    }

    removeFromTargetList(target: RepairTarget, hashMap: RepairTargetHashMap) {
        let list = hashMap[target.pos.roomName];
        if (list == null)
            return;
        /*hashMap[target.pos.roomName] =*/ list.splice(_.findIndex(list, x => x.id == target.id), 1);
    }
    removeFromTargetLists(target: RepairTarget) {
        this.removeFromTargetList(target, this.memory.emergencyTargets);
        this.removeFromTargetList(target, this.memory.repairTargets);
    }

    public forceStopRepairDelegate(s: RepairTarget): boolean {
        return (s.structureType == STRUCTURE_WALL || s.structureType == STRUCTURE_RAMPART) && s.hits > 500000 || (s.hits > 0.9 * s.hitsMax);
    }

    public targetDelegate(s: RepairTarget): boolean {
        return s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_WALL && s.hits < s.hitsMax || (s.structureType == STRUCTURE_RAMPART || s.structureType == STRUCTURE_WALL) && s.hits < 80000
    }

    public emergencyTargetDelegate(s: RepairTarget): boolean {
        return s.hits < s.hitsMax * 0.2 && (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_ROAD) || s.structureType == STRUCTURE_RAMPART && s.hits < 2000;
    }

    loadRepairTargets(force: boolean = false) {
        if (!force && (Game.time % 100) != 0)
            return;
        for (var idx in _.filter(this.mainRoom.allRooms, (x) => x.canHarvest())) {
            let myRoom = this.mainRoom.allRooms[idx];
            let room = Game.rooms[myRoom.name];
            //console.log('repair targets for myroom' + myRoom.name);
            if (room) {
                //console.log('repair targets for ' + room.name);
                this.memory.repairTargets[myRoom.name] = room.find<Structure>(FIND_STRUCTURES, { filter: this.targetDelegate });
                this.memory.emergencyTargets[myRoom.name] = _.filter(this.memory.repairTargets[myRoom.name], this.emergencyTargetDelegate);
            }
        }
    }

    existEmergencyRepairTargets() {
        for (let idx in this.memory.emergencyTargets) {
            let roomTargets = this.memory.emergencyTargets[idx];
            if (roomTargets.length > 0)
                return true;
        }
        return false;
    }

    findRepairTargetInList(pos: RoomPosition, repairTargets: RepairTargetHashMap) {
        let sameRoomTarget = this.getClosestSameRoomTargetFor(pos, repairTargets, false);
        if (sameRoomTarget)
            return sameRoomTarget;
        for (let roomName in repairTargets) {
            if (this.memory.emergencyTargets[roomName].length > 0)
                return this.memory.emergencyTargets[roomName][0];
        }
        return null;
    }

    findRepairTarget(pos: RoomPosition) {
        let target = this.findRepairTargetInList(pos, this.memory.emergencyTargets);
        if (target)
            return target;
        else
            return this.findRepairTargetInList(pos, this.memory.repairTargets);
    }


    getClosestSameRoomTargetFor(pos: RoomPosition, repairTargets: RepairTargetHashMap, pathSorting: boolean) {
        if (repairTargets == null || repairTargets[pos.roomName] == null)
            return null;
        if (repairTargets[pos.roomName].length == 0)
            return null;
        let position = new RoomPosition(pos.x, pos.y, pos.roomName);
        if (pathSorting)
            return position.findClosestByPath(repairTargets[pos.roomName]);
        else
            return position.findClosestByRange(repairTargets[pos.roomName]);
    }

    getData() {
        this.creeps = _.filter(this.mainRoom.creeps, (c) => c.memory.role == 'repairer');
        this.idleCreeps = _.filter(this.creeps, (c) => (<RepairerMemory>c.memory).repairTarget == null);
    }

    public checkCreeps() {
        if (!this.mainRoom.mainContainer)
            return;
        this.loadRepairTargets();

        this.getData();

        for (var idx in this.creeps) {
            var creep = this.creeps[idx];
            var targetMemory = <RepairerMemory>creep.memory;
            if (targetMemory.repairTarget == null)
                continue;
            var target = Game.getObjectById<Structure>(targetMemory.repairTarget.id);
            if (!target && Game.rooms[targetMemory.repairTarget.pos.roomName]) {
                this.removeFromTargetLists(targetMemory.repairTarget);
                targetMemory.repairTarget = null;
                this.idleCreeps.push(creep);
            }
            else if (target && !this.emergencyTargetDelegate(target) && !this.forceStopRepairDelegate(target)) {
                this.removeFromTargetList(targetMemory.repairTarget, this.memory.emergencyTargets);
            }
            else if (target && this.forceStopRepairDelegate(target)) {
                this.removeFromTargetLists(targetMemory.repairTarget);
                targetMemory.repairTarget = null;
                this.idleCreeps.push(creep);
            }
        }

        var maxCreeps = ~~_.sum(_.map(this.memory.emergencyTargets, x => x.length)) / 10;
        maxCreeps = maxCreeps < this.maxCreeps ? this.maxCreeps : maxCreeps;

        if ((this.creeps.length < this.maxCreeps || this.idleCreeps.length > 0)) {
            for (var idx in this.idleCreeps) {
                let creepMemory = <RepairerMemory>this.idleCreeps[idx].memory;
                let repairTarget = this.findRepairTarget(this.idleCreeps[idx].pos);
                creepMemory.repairTarget = repairTarget;
            }
            this.idleCreeps = [];
            this.mainRoom.spawnManager.AddToQueue(RepairerDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'repairer' }, this.maxCreeps * (this.existEmergencyRepairTargets() ? 2 : 1) - this.creeps.length);
        }
    }

    public tick() {
        this.getData();
        if (Game.time % 100 == 0)
            this.loadRepairTargets();
        this.creeps.forEach((c) => new Repairer(c, this.mainRoom).tick());
    }
}