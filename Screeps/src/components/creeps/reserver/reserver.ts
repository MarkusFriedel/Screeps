/// <reference path="../myCreep.ts" />

class Reserver extends MyCreep {

    creep: Creep;
    mainRoom: MainRoom;
    memory: ReserverMemory;

    constructor(creep: Creep, mainRoom: MainRoom) {
        super(creep);
        this.creep = creep;
        this.mainRoom = mainRoom;
        this.memory = <ReserverMemory>creep.memory;
        this.memory.autoFlee = true;
        this.myTick = profiler.registerFN(this.myTick, 'Reserver.tick');
    }

    public myTick() {
        this.memory = <ReserverMemory>this.creep.memory;

        let myRoom = Colony.getRoom(this.memory.targetRoomName);

        if (this.creep.room.name != this.memory.targetRoomName && (this.memory.path == null || this.memory.path.path.length <= 2)) {
            this.memory.path = PathFinder.search(this.creep.pos, { pos: myRoom.controllerPosition, range: 3 }, { roomCallback: Colony.getTravelMatrix, plainCost: 1, swampCost: 5, maxOps:5000 });
            this.memory.path.path.unshift(this.creep.pos);
        }

        if (this.memory.path && this.memory.path.path.length > 2)
            this.moveByPath();
        else {
            if (this.creep.reserveController(this.creep.room.controller) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.creep.room.controller);
        }

    }

}
