class Reserver {

    creep: Creep;
    mainRoom: MainRoom;
    memory: ReserverMemory;

    constructor(creep: Creep, mainRoom: MainRoom) {
        this.creep = creep;
        this.mainRoom = mainRoom;
        this.memory = <ReserverMemory>creep.memory;
    }

    public tick() {
        this.memory = <ReserverMemory>this.creep.memory;
        if (this.memory.targetRoomName != this.creep.room.name)
            this.creep.moveTo(new RoomPosition(25, 25, this.memory.targetRoomName));
        else
            if (this.creep.reserveController(this.creep.room.controller) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.creep.room.controller);

    }

}
