/// <reference path="../MyCreep.ts" />

class LinkFiller extends MyCreep<CreepMemory> {


    constructor(public name: string, public mainRoom: MainRoomInterface) {
        super(name);
        if (myMemory['profilerActive']) {
            this.myTick = profiler.registerFN(this.myTick, 'Builder.tick');
        }
    }

    public myTick() {
        let storage = this.mainRoom.room.storage;

        if (this.creep.ticksToLive <= 10) {
            if (this.creep.carry.energy == 0)
                this.creep.suicide();
            else {
                if (this.creep.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(storage);
            }
            return;
        }

        if (this.creep.carry.energy < this.creep.carryCapacity && _.filter(this.mainRoom.myRoom.resourceDrops, x => x.resourceType == RESOURCE_ENERGY).length>0) {
            let energy = _.filter(this.mainRoom.myRoom.resourceDrops, x => x.resourceType == RESOURCE_ENERGY && x.pos.inRangeTo(this.mainRoom.mainContainer.pos, 2))[0];
            if (energy) {
                if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(energy);
                return;
            }
        }

        let myLink = _.filter(this.mainRoom.links, x => x.nextToStorage)[0];
        if (!myLink)
            return;
        let link = Game.getObjectById<Link>(myLink.id);

        if (storage == null || link == null)
            return;

        if (link.energy < myLink.minLevel) {
            if (this.creep.carry.energy == 0 && storage.store.energy > this.mainRoom.maxSpawnEnergy*2) {
                if (storage.transfer(this.creep, RESOURCE_ENERGY))
                    this.creep.moveTo(storage);
            }
            else {
                if (this.creep.transfer(link, RESOURCE_ENERGY, Math.min(this.creep.carry.energy, myLink.minLevel - link.energy)) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(link);
            }

        }
        else if (link.energy > myLink.maxLevel) {
            if (this.creep.carry.energy == this.creep.carryCapacity) {
                if (this.creep.transfer(storage, RESOURCE_ENERGY))
                    this.creep.moveTo(storage);
            }
            else {
                if (link.transferEnergy(this.creep, Math.min(link.energy - myLink.minLevel, this.creep.carryCapacity - this.creep.carry.energy)) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(link);
            }
        }
        else {
            if (this.creep.carry.energy > 100) {
                if (this.creep.transfer(storage, RESOURCE_ENERGY, this.creep.carry.energy - 100) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(storage);

            }
            else if (this.creep.carry.energy > 100) {
                if (storage.transfer(this.creep, RESOURCE_ENERGY, 100 - this.creep.carry.energy) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(storage);
            }

        }

    }

}
