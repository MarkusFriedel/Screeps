class Defender {

    memory: DefenderMemory;

    constructor(public creep: Creep, public mainRoom: MainRoomInterface) {
        this.creep = creep;
        this.mainRoom = mainRoom;
        this.memory = <DefenderMemory>this.creep.memory;

    }

    public tick() {
        this.memory = <DefenderMemory>this.creep.memory;
        let closestHostileCreep = this.creep.pos.findClosestByPath<Creep>(FIND_HOSTILE_CREEPS);

        if (closestHostileCreep != null) {
            this.creep.moveTo(closestHostileCreep);
            this.creep.attack(closestHostileCreep);
            this.creep.rangedAttack(closestHostileCreep);
        }
        else {
            let otherRoom = _.filter(this.mainRoom.allRooms, (r) => r.name != this.creep.room.name && r.memory.hostiles && r.canHarvest)[0];
            if (otherRoom != null)
                this.creep.moveTo(new RoomPosition(25, 25, otherRoom.name));
            else {
                this.creep.moveTo(this.mainRoom.mainPosition);
            }
        }
    }
}
