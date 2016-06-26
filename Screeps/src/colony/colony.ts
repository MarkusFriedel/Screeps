import {MainRoom} from "../components/rooms/mainRoom";
import {MyRoom} from "../components/rooms/myRoom";
import {Scout} from "../components/creeps/scout/scout";

export namespace Colony {

    export var myName;

    export var mainRooms: {
        [roomName: string]: MainRoom;
    } = {};

    export var rooms: {
        [roomName: string]: MyRoom;
    } = {};

    export function getRoom(roomName: string) {
        let room = rooms[roomName];
        if (room) {
            return room;
        }

        if (!Colony.memory.rooms[roomName] && !Game.rooms[roomName]) {
            return null;
        }
        else {
            if (!Colony.memory.rooms[roomName]) {
                Colony.memory.rooms[roomName] = { containers: null, lastScanTime: null, mainRoomName: null, name: roomName, sources: null, foreignOwner: false, foreignReserver: false, hostiles: false, mainRoomDistanceDescriptions: {} };
                //for (var idx in mainRooms) {
                //    let mainRoom = mainRooms[idx];
                //    let routeResult = Game.map.findRoute(roomName, mainRoom.roomName);
                //    if (routeResult === ERR_NO_PATH)
                //        var distance = 9999;
                //    else
                //        var distance = (<[{ exit: string, room: string }]>routeResult).length;
                //    memory.rooms[roomName].mainRoomDistanceDescriptions[mainRooms[idx].roomName] = { roomName: mainRooms[idx].roomName, distance: distance };
                //}
            }
            rooms[roomName] = new MyRoom(roomName);
            return rooms[roomName];
        }
    }


    export var memory: ColonyMemory;

    export function initialize(memory: ColonyMemory) {
        Colony.memory = Memory['colony'];
        myName = _.map(Game.spawns, (s) => s)[0].owner.username;
        if (memory.rooms == null)
            memory.rooms = {};
        if (memory.mainRooms == null)
            memory.mainRooms = {};

        for (var spawnName in Game.spawns) {
            var spawn = Game.spawns[spawnName];
            break;
        }

        if (spawn != null) {
            var creeps = _.filter(Game.creeps, (c) => (<CreepMemory>c.memory).mainRoomName == null && !(<CreepMemory>c.memory).handledByColony);
            for (var idx in creeps)
                (<CreepMemory>creeps[idx].memory).mainRoomName = spawn.room.name;
        }

        if (!memory.mainRooms) memory.mainRooms = {};
        var mainRoomNames = _.uniq(_.map(Game.spawns, (s) => s.room.name));
        for (var idx in mainRoomNames) {
            mainRooms[mainRoomNames[idx]] = new MainRoom(mainRoomNames[idx]);
        }
    }

    export function assignMainRoom(room: MyRoom): MainRoom {
        // TODO Rewrite it for multiple MainRooms
        for (var idx in mainRooms)
            return mainRooms[idx];
    }

    function shouldSendScout(roomName): boolean {
        var myRoom = getRoom(roomName);
        var result =
            !Game.map.isRoomProtected(roomName)
            && (myRoom == null || !myRoom.memory.hostiles && !myRoom.memory.foreignOwner && !myRoom.memory.foreignReserver || (Game.time % 2000) == 0);

        return result;
    }

    export function createScouts() {
        for (let roomName in mainRooms) {
            if (!Game.map.isRoomProtected(roomName)) {
                let mainRoom = mainRooms[roomName];
                let exits = mainRoom.myRoom.exits;
                for (let exitDirection in exits) {
                    let targetRoomName = exits[exitDirection];
                    if (shouldSendScout(targetRoomName) && _.filter(Game.creeps, (c) => (<ScoutMemory>c.memory).role == 'scout' && (<ScoutMemory>c.memory).handledByColony == true && (<ScoutMemory>c.memory).targetRoomName == targetRoomName).length == 0) {
                        mainRoom.spawnManager.AddToQueue(['move'], <ScoutMemory>{ handledByColony: true, role: 'scout', mainRoomName: null, targetRoomName: targetRoomName });
                    }
                }
            }
        }
    }

    export function tick() {
        Colony.memory = Memory['colony'];
        var startCpu;
        var endCpu;

        if (Memory['verbose'])
            console.log('ColonyHandler.tick');

        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        if (Game.time % 10 == 0) {
            let roomArray: Array<MyRoom> = [];
            for (let x in rooms)
                roomArray.push(rooms[x]);

            let idx = ~~((Game.time % (roomArray.length * 10)) / 10);
            let room = roomArray[idx];
            for (let mainIdx in mainRooms) {
                let mainRoom = mainRooms[mainIdx];
                let routeResult = Game.map.findRoute(room.name, mainRoom.name);
                if (routeResult === ERR_NO_PATH)
                    var distance = 9999;
                else
                    var distance = (<[{ exit: string, room: string }]>routeResult).length;
                room.memory.mainRoomDistanceDescriptions[mainRoom.name] = { roomName: mainRoom.name, distance: distance };
                
            }
        }
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('Colony.Calculate destinations to MainRooms: ' + (endCpu - startCpu).toFixed(2));
        }



        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        for (var roomName in Game.rooms) {
            getRoom(roomName);
        }
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('Colony: Query all rooms ' + (endCpu - startCpu).toFixed(2));
        }

        createScouts();

        for (var roomName in mainRooms)
            mainRooms[roomName].tick();

        let creeps = _.filter(Game.creeps, (c) => c.memory.handledByColony);

        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        for (let idx in creeps) {
            let creep = creeps[idx];

            if (creep.memory.role == 'scout')
                new Scout(creep).tick();
        }
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('Colony: Handle scouts ' + (endCpu - startCpu).toFixed(2));
        }

        
    }

}