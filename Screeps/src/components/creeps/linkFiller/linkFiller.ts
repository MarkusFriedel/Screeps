class LinkFiller {

    creep: Creep;
    mainRoom: MainRoom;

    constructor(creep: Creep, mainRoom: MainRoom) {
        this.creep = creep;
        this.mainRoom = mainRoom;
    }

    public tick() {
        let storage = this.mainRoom.room.storage;

        if (this.creep.ticksToLive <= 10) {
            if (this.creep.carry.energy == 0)
                this.creep.suicide();
            else {
                if (this.creep.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(storage);
            }
        }

        let myLink = _.filter(this.mainRoom.links, x => x.nextToStorage)[0];
        if (!myLink)
            return;
        let link = Game.getObjectById<Link>(myLink.id);

        if (storage == null || link == null)
            return;

        if (link.energy < myLink.minLevel) {
            if (this.creep.carry.energy == 0) {
                if (storage.transfer(this.creep, RESOURCE_ENERGY, 400))
                    this.creep.moveTo(storage);
            }
            else {
                if (this.creep.transfer(link, RESOURCE_ENERGY, Math.min(this.creep.carry.energy, myLink.minLevel - link.energy)) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(link);
            }

        }
        else if (link.energy > myLink.maxLevel) {
            if (this.creep.carry.energy == this.creep.carryCapacity) {
                if (this.creep.transfer(storage, RESOURCE_ENERGY, 400))
                    this.creep.moveTo(storage);
            }
            else {
                if (link.transferEnergy(this.creep, Math.min(link.energy - myLink.minLevel, this.creep.carryCapacity - this.creep.carry.energy)) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(link);
            }
        }
        else {
            if (this.creep.carry.energy > 400) {
                if (this.creep.transfer(storage, RESOURCE_ENERGY, this.creep.carry.energy - 400) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(storage);

            }
            else if (this.creep.carry.energy > 400) {
                if (storage.transfer(this.creep, RESOURCE_ENERGY, 400 - this.creep.carry.energy) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(storage);
            }

        }

    }

}
