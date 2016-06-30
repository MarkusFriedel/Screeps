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

    constructor(public id: string,public myRoom: MyRoom) {

    }

}