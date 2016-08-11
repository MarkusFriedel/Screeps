/// <reference path="../myCreep.ts" />

class Scout extends MyCreep<ScoutMemory> {

    constructor(public name: string) {
        super(name);

        this.autoFlee = true;
        if (myMemory['profilerActive']) {
            this.myTick = profiler.registerFN(this.myTick, 'Scout.tick');
        }
    }

    public myTick() {
        try {
            //this.creep.say('SCOUT');

            this.memory = <ScoutMemory>this.creep.memory;
            if (this.memory.targetPosition) {
                this.moveTo({ pos: RoomPos.fromObj(this.memory.targetPosition), range: 20 });
            }

            if (this.memory.targetPosition && this.creep.pos.roomName == this.memory.targetPosition.roomName) {

                let myRoom = Colony.getRoom(this.creep.pos.roomName);
                if (myRoom.memory.lst < Game.time - 100)
                    myRoom.refresh();

            }

        }
        catch (e) {
            console.log(e.stack);
        }
    }

}

