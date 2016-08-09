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
            if (!this.memory.path) {
                let path = PathFinder.search(this.creep.pos, { pos: RoomPos.fromObj(this.memory.targetPosition), range: 10 }, { roomCallback: Colony.getTravelMatrix, plainCost: 1, swampCost: 1 });
                path.path.unshift(this.creep.pos);
                this.memory.path = path;
            }

            if (this.moveByPath() == ERR_INVALID_ARGS)
                this.memory.path = null;

            //let pos = this.creep.pos;
            //if (this.memory.targetPosition!=null && (pos.roomName != this.memory.targetPosition.roomName || pos.x < 3 || pos.x > 46 || pos.y < 3 || pos.y > 46)) {
            //    //let path = this.creep.pos.findPathTo(new RoomPosition(25, 25, this.memory.targetRoomName), { ignoreDestructibleStructures: true });

            //    let result = this.creep.moveTo(new RoomPosition(25, 25, this.memory.targetPosition.roomName), { reusePath: 50 });
            //    if (result == ERR_NO_PATH)
            //        this.creep.suicide();
            //}

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

