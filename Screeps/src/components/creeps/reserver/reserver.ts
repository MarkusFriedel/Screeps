/// <reference path="../myCreep.ts" />

class Reserver extends MyCreep<ReserverMemory> {

    constructor(public name: string, public mainRoom: MainRoomInterface) {
        super(name);
        this.autoFlee = true;
        if (myMemory['profilerActive']) {
            this.myTick = profiler.registerFN(this.myTick, 'Reserver.tick');
        }
    }

    public myTick() {
        this.memory = <ReserverMemory>this.creep.memory;

        let myRoom = Colony.getRoom(this.memory.targetRoomName);

        if (!this.creep.pos.isNearTo(myRoom.controllerPosition))
            this.moveTo({ pos: myRoom.controllerPosition, range: 1 }, { swampCost: 5, plainCost: 1 });
        else
            this.creep.reserveController(this.creep.room.controller);


    }

}
