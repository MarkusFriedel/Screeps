class SpawnFiller {

    creep: Creep;
    mainRoom: MainRoomInterface;

    constructor(creep: Creep, mainRoom: MainRoomInterface) {
        this.creep = creep;
        this.mainRoom = mainRoom;
    }

    refill() {
        if (!this.mainRoom)
            return;
        
        let resources = _.filter(Colony.getRoom(this.creep.room.name).resourceDrops, r => r.resourceType == RESOURCE_ENERGY);
        let energy = _.filter(resources, r => (r.pos.x - this.creep.pos.x) ** 2 + (r.pos.y - this.creep.pos.y) ** 2 <= 16)[0];
        if (energy != null && this.creep.carry.energy < this.creep.carryCapacity) {
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
        }
    }

    public tick() {

        if (this.creep.carry.energy == 0) {
            this.refill();
        }

        else {
            var target = this.creep.pos.findClosestByPath<Spawn | Extension>(FIND_MY_STRUCTURES, { filter: (s: Spawn | Extension) => (s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_EXTENSION) && s.energy < s.energyCapacity });

            if (target == null)
                this.refill();
            else {
                if (this.creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(target);
            }


        }
    }

}
