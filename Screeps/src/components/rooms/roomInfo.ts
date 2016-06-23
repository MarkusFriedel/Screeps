import {Config} from "./../../config/config";
import {SourceInfo} from "../sources/sourceInfo";
import {ContainerInfo} from "../structures/containerInfo";


export interface RoomInfoInterface {

    name: string;
    lastScanTime: number;
    sources: Array<SourceInfo>;
    containers: Array<ContainerInfo>;
    exitNames: Array<string>;
    scan();
}

export class RoomInfo implements RoomInfoInterface {

    name: string;
    lastScanTime: number;
    sources: Array<SourceInfo>;
    containers: Array<ContainerInfo>;
    exitNames: Array<string>;
    exits: Array<string>;


    constructor(name:string) {
        this.name = name;
        if (Game.rooms[this.name] != null && this.lastScanTime == null)
            this.scan();
        else {
            this.sources = _.map(<SourceInfo[]>Memory.rooms[name].sources, (r) => new SourceInfo(r.id));
            this.containers = _.map(<ContainerInfo[]>Memory.rooms[name].containers, (r) => new ContainerInfo(r.id));
        }
    }

    public scan() {
        let room = <Room>Game.rooms[this.name];
        
        if (room == null)
            return;

        var memoryData = {
            name: room.name,
            lastScanTime: Game.time,
            sources: _.map(room.find(FIND_SOURCES), (x: Source) => new SourceInfo(x.id)),
            containers: _.map(room.find(FIND_STRUCTURES, { filter: (s: Structure) => s.structureType == STRUCTURE_CONTAINER }), (c: Container) => new ContainerInfo(c.id))
        }

        room.memory = memoryData;

        this.lastScanTime = memoryData.lastScanTime;
        this.sources = memoryData.sources;
        this.containers = memoryData.containers;

    }


}