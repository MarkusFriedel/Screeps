import {Config} from "./../../config/config";
import {MyRoom} from "../rooms/myRoom";
//import {ObjectWithMemory} from "../../objectWithMemory";

export class MyContainer {

    public get memory(): MyContainerMemory {
        return this.accessMemory();
    }

    accessMemory() {
        if (this.myRoom.memory.containers == null)
            this.myRoom.memory.containers = {};
        if (this.myRoom.memory.containers[this.id] == null)
            this.myRoom.memory.containers[this.id] = {
                id: this.id,
                pos: null,
                lastScanTime:null
            }
        return this.myRoom.memory.containers[this.id];
    }

    id: string;
    pos: RoomPosition;
    myRoom: MyRoom;

    constructor(id: string, myRoom: MyRoom) {
        this.id = id;
        this.memory.id = id;
        if (this.memory.lastScanTime == null)
            this.scan();

        if (this.memory.pos!=null)
            this.pos = new RoomPosition(this.memory.pos.x, this.memory.pos.y, this.memory.pos.roomName);
        
    }

    public scan(container?: Container) {
        let cont = container;
        if (!cont)
            cont = <Container>Game.getObjectById(this.id);
        if (cont) {
            this.pos = cont.pos;
            this.memory.pos = this.pos;
            this.memory.lastScanTime = Game.time;
            return true;
        }
        return false;
    }
}