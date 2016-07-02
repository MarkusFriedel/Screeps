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

    _room: { time: number, room: Room } = { time: -1, room: null };
    public get room(): Room {
        if (this._room.time < Game.time)
            this._room = {
                time: Game.time, room: Game.rooms[this.name]
            };
        return this._room.room;
    }

    _myContainers: {
        time: number,
        myContainers: { [id: string]: MyContainer; }
    } = { time: -101, myContainers: {} };

    public get myContainers(): { [id: string]: MyContainer; } {
        if (((this._myContainers.time + 100) < Game.time || this.memory.containers == null) && this.room) {
            let containers = _.map(this.room.find<Container>(FIND_STRUCTURES, { filter: (x: Structure) => x.structureType == STRUCTURE_CONTAINER }), x => new MyContainer(x.id, this));
            this._myContainers = {
                time: Game.time,
                myContainers: _.indexBy(containers, (x) => x.id)
            };
        }
        return this._myContainers.myContainers;
    }

    private _mySources: { time: number, mySources: { [id: string]: MySource; } } = null;

    public get mySources(): { [id: string]: MySource; } {
        //return _.indexBy(_.map(this.room.find<Source>(FIND_SOURCES), x => new MySource(x.id, this)), (x) => x.id);
        if (this._mySources == null) {
            if (this.memory.sources == null && this.room) {
                this._mySources = { time: Game.time, mySources: _.indexBy(_.map(this.room.find<Source>(FIND_SOURCES), x => new MySource(x.id, this)), (x) => x.id) };
            }
            else if (this.memory.sources != null) {
                this._mySources = { time: Game.time, mySources: _.indexBy(_.map(this.memory.sources, x => new MySource(x.id, this)), (x) => x.id) };
            }
        }
        if (this._mySources)
            return this._mySources.mySources;
        else return {};
    }

    public get useableSources() {
        return _.filter(this.mySources, x => !x.keeper);
    }

    private _mainRoom: MainRoom = null;
    public get mainRoom() {
        if (this._mainRoom == null)
            this._mainRoom = Colony.mainRooms[this.memory.mainRoomName];
        return this._mainRoom;
    }
    public set mainRoom(value: MainRoom) {
        this._mainRoom = value;
        this.memory.mainRoomName = value == null ? null : value.name;
    }

    accessMemory() {
        if (Colony.memory.rooms == null)
            Colony.memory.rooms = {};
        if (Colony.memory.rooms[this.name] == null)
            Colony.memory.rooms[this.name] = {
                name: this.name,
                containers: null,
                sources: null,
                hostiles: false,
                foreignOwner: null,
                foreignReserver: null,
                lastScanTime: null,
                mainRoomDistanceDescriptions: null,
                mainRoomName: null
            };
        return Colony.memory.rooms[this.name];
    }


    exitNames: Array<string>;
    exits: ExitDescription;



    constructor(public name: string) {
        this.memory.name = name;

        if (this.room != null)
            this.scan();
    }

    getClosestMainRoom() {
        if (this.memory.mainRoomDistanceDescriptions == null || _.size(this.memory.mainRoomDistanceDescriptions) == 0)
            return null;
        return Colony.mainRooms[_.min(this.memory.mainRoomDistanceDescriptions, x => x.distance).roomName];
    }

    public scan() {
        let room = this.room;

        if (this.exits == null) {
            this.exits = {};
            let exits = Game.map.describeExits(this.name);
            if (exits != null)
                for (let exitDirection in exits)
                    this.exits[exitDirection] = exits[exitDirection];
        }

        if (room == null)
            return;

        this.memory.foreignOwner = room.controller != null && room.controller.owner != null && room.controller.owner.username != Colony.myName;
        this.memory.foreignReserver = room.controller != null && room.controller.reservation != null && room.controller.reservation.username != Colony.myName;

        this.memory.lastScanTime = Game.time;
    }

    scanForHostiles() {
        if (this.room == null)
            return;
        this.memory.hostiles = this.room.find(FIND_HOSTILE_CREEPS, { filter: (c: Creep) => c.owner.username != 'Source Keeper' }).length > 0;
    }


    canHarvest() {
        return (this.mainRoom && this.name == this.mainRoom.name || !(this.memory.foreignOwner || this.memory.foreignReserver));
    }


}