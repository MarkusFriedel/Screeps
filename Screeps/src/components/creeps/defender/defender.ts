class Defender {

    memory: DefenderMemory;

    constructor(public creep: Creep, public mainRoom: MainRoomInterface) {
        this.creep = creep;
        this.mainRoom = mainRoom;
        this.memory = <DefenderMemory>this.creep.memory;

    }

    public tick() {
        this.memory = <DefenderMemory>this.creep.memory;
        let closestHostileCreep = this.creep.pos.findClosestByPath<Creep>(FIND_HOSTILE_CREEPS, { filter: (c: Creep) => c.owner.username != 'Source Keeper' });

        if (closestHostileCreep != null) {
            this.creep.moveTo(closestHostileCreep);
            this.creep.attack(closestHostileCreep);
            this.creep.rangedAttack(closestHostileCreep);
        }
        else {
            let otherRoom = _.filter(this.mainRoom.allRooms, (r) => r.name != this.creep.room.name && r.requiresDefense && r.canHarvest)[0];
            if (otherRoom != null)
                this.creep.moveTo(new RoomPosition(25, 25, otherRoom.name));
            else if (this.creep.pos.x == 0 || this.creep.pos.x == 49 || this.creep.pos.y == 0 || this.creep.pos.y == 49)
                this.creep.moveTo(new RoomPosition(25, 25, this.creep.room.name));
            else {
                this.creep.moveTo(this.mainRoom.mainPosition);
            }
        }
    }
}
