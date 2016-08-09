/// <reference path="../myCreep.ts" />

class Upgrader extends MyCreep<CreepMemory> {


    constructor(public name: string, public mainRoom: MainRoomInterface) {
        super(name);
        if (myMemory['profilerActive']) {
            this.myTick = profiler.registerFN(this.myTick, 'Upgrader.tick');
        }
    }

    upgrade() {
        let result = this.creep.upgradeController(this.creep.room.controller);
        //this.creep.say(result.toString());
        if (result == ERR_NOT_IN_RANGE) {
            this.creep.moveTo(this.creep.room.controller);
        }
    }

    refill() {
        let link = _.map(_.filter(this.mainRoom.links, x => x.nearController == true), x => x.link)[0];

        if (link) {
            if (link.transferEnergy(this.creep) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(link);
        }
        else {
            var mainContainer = this.mainRoom.mainContainer;
            if (mainContainer != null) {
                if (mainContainer.store.energy > this.mainRoom.maxSpawnEnergy * 2 || this.mainRoom.room.controller.ticksToDowngrade<2000)
                    if (this.creep.withdraw(mainContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(mainContainer);
            }
            else {
                if (this.mainRoom.spawnManager.isIdle || this.mainRoom.room.controller.ticksToDowngrade < 2000) {
                    for (var spawnName in Game.spawns) {
                        var spawn = Game.spawns[spawnName];
                    }

                    if (spawn.transferEnergy(this.creep) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(spawn);
                }
            }
        }
    }

    public myTick() {

        if (this.creep.carry.energy >= _.sum(this.creep.body, x => x.type == WORK ? 1 : 0)) {
            this.upgrade();
        }
        else if (!this.mainRoom.mainContainer || this.mainRoom.mainContainer.structureType != STRUCTURE_STORAGE || this.mainRoom.mainContainer.store.energy > 10000 || this.mainRoom.room.controller.ticksToDowngrade <= 5000) {
            if (!this.mainRoom)
                return;
            
            let resources = _.filter(Colony.getRoom(this.creep.room.name).resourceDrops, r => r.resourceType == RESOURCE_ENERGY);
            let energy = _.filter(resources, r => r.pos.isNearTo(this.creep.pos))[0];
            if (energy != null && this.creep.carry.energy < this.creep.carryCapacity) {
                this.creep.pickup(energy);
            }
            else {

                this.refill();
            }
        }
    }

}