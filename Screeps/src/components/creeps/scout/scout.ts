class Scout {

    creep: Creep;
    memory: ScoutMemory;

    constructor(creep: Creep) {
        this.creep = creep;
        this.memory = <ScoutMemory>creep.memory;
    }

    public tick() {
        this.creep.say('SCOUT');

        this.memory = <ScoutMemory>this.creep.memory;
        
        let pos = this.creep.pos;
        if (this.memory.targetPosition!=null && (pos.roomName != this.memory.targetPosition.roomName || pos.x < 10 || pos.x > 40 || pos.y < 10 || pos.y > 40)) {
            //let path = this.creep.pos.findPathTo(new RoomPosition(25, 25, this.memory.targetRoomName), { ignoreDestructibleStructures: true });
            let result = this.creep.moveTo(new RoomPosition(25, 25, this.memory.targetPosition.roomName), { reusePath: 50 });
            if (result == ERR_NO_PATH)
                this.creep.suicide();
        }

        if (this.memory.targetPosition && pos.roomName == this.memory.targetPosition.roomName) {

            let myRoom = Colony.getRoom(pos.roomName);
            if (myRoom.memory.lastScanTime < Game.time - 100)
                myRoom.scan();
            
        }
        
    }

}

