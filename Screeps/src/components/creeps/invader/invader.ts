class Invader {

    creep: Creep;
    memory: InvaderMemory;
    isWarrior: boolean;
    isWorker: boolean;

    constructor(creep: Creep) {
        this.creep = creep;
        this.memory = <InvaderMemory>this.creep.memory;
        let body = Body.getFromCreep(this.creep);
        this.isWarrior = (body.ranged_attack + body.attack) > 0;
        this.isWorker = body.work > 0;
        
    }

    attack(target) {
        if (target == null || !this.isWarrior)
            return false;

        if (this.creep.attack(target) == ERR_NOT_IN_RANGE)
            this.creep.moveTo(target);
        this.creep.rangedAttack(target);

        return true;
    }

    dismantle(target) {
        if (target == null)
            return false;
        else if (this.isWorker) {
            if (this.creep.dismantle(target) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(target);
            return true;
        }
        else if (this.isWarrior) {
            if (this.creep.attack(target) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(target);
            this.creep.rangedAttack(target);
            return true;
        }
        else return false;

    }

    public tick() {
        this.memory = <InvaderMemory>this.creep.memory;

        if (this.memory.state == 'rally') {
            if (!this.creep.pos.inRangeTo(new RoomPosition(this.memory.rallyPoint.x, this.memory.rallyPoint.y, this.memory.rallyPoint.roomName), 3))
                this.creep.moveTo(new RoomPosition(this.memory.rallyPoint.x, this.memory.rallyPoint.y, this.memory.rallyPoint.roomName));
        }
        else {
            if (this.creep.room.name != this.memory.targetRoomName) {
                this.creep.moveTo(new RoomPosition(25, 25, this.memory.targetRoomName));
            }
            else {
                //this.creep.moveTo(new RoomPosition(25, 25, this.memory.targetRoomName));
                this.attack(this.creep.pos.findClosestByPath<Creep>(FIND_HOSTILE_CREEPS, { filter: (c: Creep) => Body.getFromCreep(c).isMilitaryDefender }))
                    || this.dismantle(this.creep.pos.findClosestByPath<Tower>(FIND_HOSTILE_STRUCTURES, { filter: (x: Tower) => x.structureType == STRUCTURE_TOWER && x.energy > 0 }))
                    || this.dismantle(this.creep.pos.findClosestByPath<Spawn>(FIND_HOSTILE_SPAWNS))
                    || this.dismantle(this.creep.pos.findClosestByPath<Extension>(FIND_HOSTILE_STRUCTURES, { filter: (x: Structure) => x.structureType == STRUCTURE_EXTENSION }))
                    || this.attack(this.creep.pos.findClosestByPath<Creep>(FIND_HOSTILE_CREEPS))
                    || this.dismantle(this.creep.pos.findClosestByPath<Structure>(FIND_HOSTILE_STRUCTURES, { filter: (x: Structure) => x.structureType != STRUCTURE_CONTROLLER }));

            }
        }
    }
}