import {Config} from "./../../config/config";
import {MySource} from "../sources/mySource";
import {MyContainer} from "../structures/myContainer";
import {MainRoom} from "./mainRoom";
import {Colony} from "../../colony/colony";
//import {ObjectWithMemory} from "../../objectWithMemory";


export class MyRoom {

    public get memory(): MyRoomMemory {
        return this.accessMemory();
    }

    accessMemory() {
        if (Colony.memory.rooms == null)
            Colony.memory.rooms = {};
        if (Colony.memory.rooms[this.name] == null)
            Colony.memory.rooms[this.name] = {
                name: this.name,
                containers: {},
                sources: {},
                hostiles: false,
                foreignOwner: null,
                foreignReserver: null,
                lastScanTime: null,
                mainRoomDistanceDescriptions: {},
                mainRoomName: null
            };
        return Colony.memory.rooms[this.name];
    }

    name: string;

    sources: {
        [id: string]: MySource;
    };
    containers: {
        [id: string]: MyContainer;
    }

    exitNames: Array<string>;
    exits: ExitDescription;
    mainRoom: MainRoom;
    //memory: MyRoomMemory;

    constructor(name: string) {
        this.name = name;
        this.memory.name = name;
        if (this.memory.containers == null)
            this.memory.containers = {};
        if (this.memory.sources == null)
            this.memory.sources = {};

        this.sources = _.indexBy(_.map(this.memory.sources, (s) => new MySource(s.id, this)), (s) => s.id);
        this.containers = _.indexBy(_.map(this.memory.containers, (s) => new MyContainer(s.id, this)), (s) => s.id);
        this.mainRoom = Colony.mainRooms[this.memory.mainRoomName];

        //if (this.memory.mainRoomDistanceDescriptions == null)
        //    this.memory.mainRoomDistanceDescriptions = {};

        if (!this.mainRoom) {
            this.mainRoom = Colony.assignMainRoom(this);
            if (this.mainRoom)
                this.memory.mainRoomName = this.mainRoom.name;
        }


        if (Game.rooms[this.name] != null)
            this.scan();
    }

    scanSources(room: Room) {
        if (Object.keys(this.sources).length == 0) {
            this.sources = {};
            let sources = room.find<Source>(FIND_SOURCES);
            for (let idx in sources) {
                let source = sources[idx];
                this.sources[source.id] = new MySource(source.id, this);
            }
        }
        else {
            for (let sourceId in this.sources)
                this.sources[sourceId].scan();
        }
    }

    scanContainers(room: Room) {
        if (this.containers != null) {
            for (let idx in this.containers) {
                let container = <Container>Game.getObjectById(this.containers[idx].id);
                if (!container) {
                    delete this.containers[this.containers[idx].id];
                }
                else {
                    this.containers[this.containers[idx].id].scan(container);
                }
            }
        }
        let containers = room.find<Container>(FIND_STRUCTURES, { filter: (s: Structure) => s.structureType == STRUCTURE_CONTAINER });
        for (let idx in containers) {
            let container = containers[idx];
            if (!container) {
                if (this.memory.containers[container.id] == null)
                    this.memory.containers[container.id] = { id: container.id, pos: container.pos, lastScanTime: Game.time };
                this.containers[container.id] = new MyContainer(container.id, this);
            }

        }

    }

    public scan() {
        let room = <Room>Game.rooms[this.name];

        if (this.exits == null) {
            this.exits = {};
            let exits = Game.map.describeExits(this.name);
            if (exits != null)
                for (let exitDirection in exits)
                    this.exits[exitDirection] = exits[exitDirection];
        }

        if (room == null)
            return;

        this.memory.foreignOwner = room.controller.owner != null && room.controller.owner.username != Colony.myName;
        this.memory.foreignReserver = room.controller.reservation != null && room.controller.reservation.username != Colony.myName;

        this.memory.lastScanTime = Game.time;
        this.scanSources(room);
        this.scanContainers(room);


    }

    scanForHostiles() {
        let room = <Room>Game.rooms[this.name];
        if (room == null)
            return;
        this.memory.hostiles = room.find(FIND_HOSTILE_CREEPS, { filter: (c: Creep) => c.owner.username != 'Source Keeper' }).length > 0;
    }

    canHarvest() {
        return (this.name == this.mainRoom.name
            || (!this.memory.foreignOwner && !this.memory.foreignReserver && this.memory.mainRoomDistanceDescriptions[this.mainRoom.name] != null && this.memory.mainRoomDistanceDescriptions[this.mainRoom.name].distance <= 1));
    }
}