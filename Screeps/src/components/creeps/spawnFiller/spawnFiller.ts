/// <reference path="../MyCreep.ts" />

class SpawnFiller extends MyCreep<SpawnFillerMemory> {

    constructor(public name: string, public mainRoom: MainRoomInterface) {
        super(name);
        if (myMemory['profilerActive']) {
            this.myTick = profiler.registerFN(this.myTick, 'SpawnFiller.tick');
        }
    }

    refill() {
        if (!this.mainRoom)
            return;

        //let resources = _.filter(Colony.getRoom(this.creep.room.name).resourceDrops, r => r.resourceType == RESOURCE_ENERGY);
        //let energy = _.filter(resources, r => (r.pos.x - this.creep.pos.x) ** 2 + (r.pos.y - this.creep.pos.y) ** 2 <= 16)[0];
        //if (energy != null && this.creep.carry.energy < this.creep.carryCapacity) {
        //    if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
        //        this.creep.moveTo(energy);
        //}
        //else {
        let energy = _.filter(this.myRoom.resourceDrops, r => r.resourceType == RESOURCE_ENERGY && _.any(this.mainRoom.spawns, s => s.pos.isNearTo(r.pos)))[0];
        if (energy) {
            if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(energy);
        }
        else {
            let mainContainer = this.mainRoom.mainContainer;
            if (mainContainer != null && mainContainer.store.energy > 0) {
                if (mainContainer.transfer(this.creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(mainContainer);
            }
            else if (this.mainRoom.room.terminal && this.mainRoom.room.terminal.store.energy > 0) {
                if (this.mainRoom.room.terminal.transfer(this.creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(this.mainRoom.room.terminal);
            }
            else {
                let link = _.filter(this.mainRoom.links, l => l.nextToStorage)[0];
                if (link && link.link && link.link.energy > 0 && this.creep.withdraw(link.link, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(link.link);
            }
        }

        //}
    }

    private getTarget(currentTarget?: Spawn | Extension) {
        if (currentTarget)
            this.memory.targetStructureId = null;
        if (this.memory.targetStructureId) {
            var target = Game.getObjectById<Spawn | Extension>(this.memory.targetStructureId);
            if (target != null && target.energy == target.energyCapacity)
                target = null;
        }
        let targets = this.creep.room.find<Spawn | Extension>(FIND_MY_STRUCTURES, { filter: (s: Spawn | Extension) => (!currentTarget || currentTarget.id != s.id) && (s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_EXTENSION) && s.energy < s.energyCapacity && !_.any(this.mainRoom.managers.spawnFillManager.creeps, c => c.name != this.creep.name && c.memory.targetStructureId && c.memory.targetStructureId == s.id) });
        if (target == null)
            target = _.filter(targets, t => t.pos.inRangeTo(this.creep.pos, 1))[0];

        if (target == null)
            target = _.sortBy(targets, t => t.pos.getRangeTo(this.creep.pos))[0];

        if (target == null) {
            this.memory.targetStructureId = null;
            this.refill();
        }
        else
            this.memory.targetStructureId = target.id;

        return target;
    }

    public myTick() {

        if (this.creep.ticksToLive <= 20) {
            if (this.creep.carry.energy > 0) {
                if (this.creep.transfer(this.mainRoom.energyDropOffStructure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(this.mainRoom.energyDropOffStructure);
            }
            else {
                if (this.mainRoom.spawns[0].recycleCreep(this.creep))
                    this.creep.moveTo(this.mainRoom.spawns[0]);
            }
        }
        else if (this.creep.carry.energy < this.creep.carryCapacity && _.filter(this.mainRoom.myRoom.resourceDrops, r => r.resourceType == RESOURCE_ENERGY && r.pos.isNearTo(this.creep.pos)).length > 0) {
            let energy = _.filter(this.mainRoom.myRoom.resourceDrops, r => r.resourceType == RESOURCE_ENERGY && r.pos.isNearTo(this.creep.pos))[0];
            if (energy) {
                this.creep.pickup(energy);

            }
        }
        else {


            if (this.creep.carry.energy == 0 || this.creep.room.energyAvailable == this.creep.room.energyCapacityAvailable) {
                this.memory.targetStructureId = null;
                this.refill();
            }

            else {
                if (this.mainRoom.mainContainer && this.creep.carry.energy < this.creep.carryCapacity && this.mainRoom.mainContainer.store.energy > 0 && this.creep.pos.isNearTo(this.mainRoom.mainContainer.pos)) {
                    this.creep.withdraw(this.mainRoom.mainContainer, RESOURCE_ENERGY);
                }

                if (this.mainRoom.room.energyAvailable < this.mainRoom.room.energyCapacityAvailable) {
                    let target = this.getTarget();
                    let result = this.creep.transfer(target, RESOURCE_ENERGY);
                    if (result == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(target);
                    else if (result == OK && target.energyCapacity - target.energy < this.creep.carry.energy) {
                        target = this.getTarget(target);
                        if (!this.creep.pos.isNearTo(target))
                            this.creep.moveTo(target);
                    }
                }
                else if (this.creep.carry.energy < this.creep.carryCapacity) {
                    this.refill();
                }

            }
        }
    }

}
