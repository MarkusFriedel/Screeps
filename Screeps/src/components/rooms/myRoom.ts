/// <reference path="../sources/mySource.ts" />
/// <reference path="../../tracer.ts" />
/// <reference path="../structures/myContainer.ts" />

class MyRoom implements MyRoomInterface {

    public get memory(): MyRoomMemory {
        return this.accessMemory();
    }

    public static staticTracer: Tracer;
    public tracer: Tracer;


    _room: { time: number, room: Room } = { time: -1, room: null };
    public get room(): Room {
        let trace = this.tracer.start('Property room');
        if (this._room.time < Game.time)
            this._room = {
                time: Game.time, room: Game.rooms[this.name]
            };
        trace.stop();
        return this._room.room;
    }

    _myContainers: {
        time: number,
        myContainers: { [id: string]: MyContainerInterface; }
    } = { time: -101, myContainers: {} };

    public get myContainers(): { [id: string]: MyContainerInterface; } {
        let trace = this.tracer.start('Property myContainers');
        if (((this._myContainers.time + 100) < Game.time || this.memory.containers == null) && this.room) {
            let containers = _.map(this.room.find<Container>(FIND_STRUCTURES, { filter: (x: Structure) => x.structureType == STRUCTURE_CONTAINER }), x => new MyContainer(x.id, this));
            this._myContainers = {
                time: Game.time,
                myContainers: _.indexBy(containers, (x) => x.id)
            };
        }
        trace.stop();
        return this._myContainers.myContainers;
    }

    public get canHarvest() {
        let trace = this.tracer.start('Property canHarvest');
        let result = (this.mainRoom && this.name == this.mainRoom.name || !(this.memory.foreignOwner || this.memory.foreignReserver));
        trace.stop();
        return result;
    }

    private _mySources: { time: number, mySources: { [id: string]: MySourceInterface; } } = null;

    public get mySources(): { [id: string]: MySourceInterface; } {
        let trace = this.tracer.start('Property mySources');
        if (this._mySources == null) {
            if (this.memory.sources == null && this.room) {
                this._mySources = { time: Game.time, mySources: _.indexBy(_.map(this.room.find<Source>(FIND_SOURCES), x => new MySource(x.id, this)), (x) => x.id) };
            }
            else if (this.memory.sources != null) {
                this._mySources = { time: Game.time, mySources: _.indexBy(_.map(this.memory.sources, x => new MySource(x.id, this)), (x) => x.id) };
            }
        }
        trace.stop();
        if (this._mySources)
            return this._mySources.mySources;
        else return {};
    }

    public get useableSources() {
        let trace = this.tracer.start('Property useableSources');
        let result = _.filter(this.mySources, x => !x.hasKeeper);
        trace.stop();
        return result;
    }

    private _mainRoom: MainRoomInterface = null;
    public get mainRoom() {
        let trace = this.tracer.start('Property mainRoom');
        if (this._mainRoom == null)
            this._mainRoom = Colony.mainRooms[this.memory.mainRoomName];
        trace.stop();
        return this._mainRoom;
    }
    public set mainRoom(value: MainRoomInterface) {
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
        if (MyRoom.staticTracer == null) {
            MyRoom.staticTracer = new Tracer('MyRoom');
            Colony.tracers.push(MyRoom.staticTracer);
        }
        //this.tracer = new Tracer('MySource ' + id);
        this.tracer = MyRoom.staticTracer;
        this.memory.name = name;

        if (this.room != null)
            this.scan();
    }

    public get closestMainRoom() {
        let trace = this.tracer.start('Property closestMainRoom');
        if (this.memory.mainRoomDistanceDescriptions == null || _.size(this.memory.mainRoomDistanceDescriptions) == 0) {
            trace.stop();
            return null;
        }
        let result = Colony.mainRooms[_.min(this.memory.mainRoomDistanceDescriptions, x => x.distance).roomName];
        trace.stop();
        return result;
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


    


}