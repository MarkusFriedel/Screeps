import {Colony} from "../../../colony/colony";


export class Scout {

    creep: Creep;
    memory: ScoutMemory;

    constructor(creep: Creep) {
        this.creep = creep;
        this.memory = <ScoutMemory>creep.memory;
    }

    public tick() {
        this.memory = <ScoutMemory>this.creep.memory;
        let pos = this.creep.pos;
        if (this.memory.targetPosition!=null && (pos.roomName != this.memory.targetPosition.roomName || pos.x < 10 || pos.x > 40 || pos.y < 10 || pos.y > 40)) {
            //let path = this.creep.pos.findPathTo(new RoomPosition(25, 25, this.memory.targetRoomName), { ignoreDestructibleStructures: true });
            this.creep.moveTo(new RoomPosition(25, 25, this.memory.targetPosition.roomName));
        }

        if (pos.roomName == this.memory.targetPosition.roomName) {

            let myRoom = Colony.getRoom(pos.roomName);
            if (myRoom.memory.lastScanTime < Game.time - 100)
                myRoom.scan();
            if (myRoom.memory.foreignOwner)
                this.creep.suicide();
        }
        
    }

}

