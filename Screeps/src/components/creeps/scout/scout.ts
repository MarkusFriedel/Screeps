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
        if (pos.roomName != this.memory.targetRoomName || pos.x < 10 || pos.x > 40 || pos.y < 10 || pos.y > 40) {
            //let path = this.creep.pos.findPathTo(new RoomPosition(25, 25, this.memory.targetRoomName), { ignoreDestructibleStructures: true });
            this.creep.moveTo(new RoomPosition(25, 25, this.memory.targetRoomName));
        }

        if (pos.x == 0 || pos.x == 49 || pos.y == 0 || pos.y == 49 || (Game.time % 10) == 0) {
            this.creep.say('Scanning');
            let myRoom = Colony.getRoom(pos.roomName);
            myRoom.scan();
        }

    }

}