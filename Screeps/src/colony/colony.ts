﻿import {MainRoom} from "../components/rooms/mainRoom";
import {MyRoom} from "../components/rooms/myRoom";
import {Scout} from "../components/creeps/scout/scout";

import {ClaimingManager} from "./claimingManager";

import {InvasionManager} from "./invasionManager";
import {Tracer} from "../tracer";
import {Body} from "../components/creeps/body";

import {RoomAssignmentHandler} from "./roomAssignment";

export namespace Colony {

    export var tracers: Array<Tracer> = [];

    export var myName;

    export var memory: ColonyMemory;

    export var mainRooms: {
        [roomName: string]: MainRoom;
    } = {};

    export var rooms: {
        [roomName: string]: MyRoom;
    } = {};

    export var claimingManagers: {
        [roomName: string]: ClaimingManager;
    } = {};

    export var invasionManagers: {
        [roomName: string]: InvasionManager;
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
            let myRoom = new MyRoom(roomName);
            rooms[roomName] = myRoom;
            if (myRoom.memory.mainRoomDistanceDescriptions == null)
                calculateDistances(myRoom);

            return rooms[roomName];
        }
    }






    export function assignMainRoom(room: MyRoom): MainRoom {
        calculateDistances(room);
        return room.mainRoom;
    }

    function shouldSendScout(roomName): boolean {
        var myRoom = getRoom(roomName);
        var result =
            !Game.map.isRoomProtected(roomName) && !(myRoom != null && myRoom.mainRoom)
            && (myRoom != null && !myRoom.memory.hostiles && !myRoom.memory.foreignOwner && !myRoom.memory.foreignReserver || (Game.time % 2000) == 0);

        return result;
    }


    export function spawnCreep(requestRoom: MyRoom, body: Body, memory, count = 1) {
        console.log('Colony.spawnCreep costs: ' + body.costs);
        let mainRoom = _.sortBy(_.filter(mainRooms, x => x.maxSpawnEnergy > body.costs), x => requestRoom.memory.mainRoomDistanceDescriptions[x.name].distance)[0];
        if (mainRoom) {
            mainRoom.spawnManager.AddToQueue(body.getBody(), memory, count);
            return true;
        }
        else
            return false;
    }

    export function createScouts() {
        let myRooms = _.filter(rooms, x => x.mainRoom != null);
        for (let idx in myRooms) {
            if (!Game.map.isRoomProtected(myRooms[idx].name)) {
                let myRoom = myRooms[idx];
                let exits = myRoom.exits;
                for (let exitDirection in exits) {
                    let targetRoomName = exits[exitDirection];
                    if (shouldSendScout(targetRoomName) && _.filter(Game.creeps, (c) => (<ScoutMemory>c.memory).role == 'scout' && (<ScoutMemory>c.memory).handledByColony == true && (<ScoutMemory>c.memory).targetPosition != null && (<ScoutMemory>c.memory).targetPosition.roomName == targetRoomName).length == 0) {
                        myRoom.mainRoom.spawnManager.AddToQueue(['move'], <ScoutMemory>{ handledByColony: true, role: 'scout', mainRoomName: null, targetPosition: new RoomPosition(25, 25, targetRoomName) });
                    }
                }
            }
        }
    }



    export function requestCreep() {

    }

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
            if (!claimingManagers[mainRoomNames[idx]]) {
                mainRooms[mainRoomNames[idx]] = new MainRoom(mainRoomNames[idx]);
            }
        }

        if (memory.claimingManagers != null) {
            for (var idx in memory.claimingManagers) {
                claimingManagers[memory.claimingManagers[idx].targetPosition.roomName] = new ClaimingManager(memory.claimingManagers[idx].targetPosition);
            }
        }

        if (memory.invasionManagers != null) {
            for (var idx in memory.invasionManagers) {
                invasionManagers[memory.invasionManagers[idx].targetRoomName] = new InvasionManager(memory.invasionManagers[idx].targetRoomName);
            }
        }
    }

    function calculateDistances(myRoom: MyRoom) {
        if (MyRoom == null)
            return;
        for (let mainIdx in mainRooms) {
            let mainRoom = mainRooms[mainIdx];
            let routeResult = Game.map.findRoute(myRoom.name, mainRoom.name);
            if (routeResult === ERR_NO_PATH)
                var distance = 9999;
            else
                var distance = (<[{ exit: string, room: string }]>routeResult).length;
            if (myRoom.memory.mainRoomDistanceDescriptions == null)
                myRoom.memory.mainRoomDistanceDescriptions = {};
            myRoom.memory.mainRoomDistanceDescriptions[mainRoom.name] = { roomName: mainRoom.name, distance: distance };
        }
        let mainRoomCandidates = _.sortBy(_.map(_.filter(myRoom.memory.mainRoomDistanceDescriptions, (x) => x.distance <= 1), function (y) { return { distance: y.distance, mainRoom: mainRooms[y.roomName] }; }), z => [z.distance.toString(), (10 - z.mainRoom.room.controller.level).toString()].join('_'));
        //if (mainRoomCandidates.length > 0 && !myRoom.memory.foreignOwner && (mainRoomCandidates[0].distance <= 1 || mainRoomCandidates[0].mainRoom.room.controller.level >= 6)) {
        //    myRoom.mainRoom = mainRoomCandidates[0].mainRoom;
        //    myRoom.memory.mainRoomName = mainRoomCandidates[0].mainRoom.name;
        //}
        //else {
        //    myRoom.mainRoom = null;
        //}
    }

    function handleClaimingManagers() {
        if (Memory['trace'])
            var startCpu = Game.cpu.getUsed();

        let flags = _.filter(Game.flags, (x) => x.memory.claim == true && !mainRooms[x.pos.roomName])

        console.log("Claiming Manager: Found " + flags.length + " flags");

        for (let idx in flags) {
            console.log('Claiming Manager: GCL: ' + Game.gcl.level);
            console.log('Claiming Manager: MainRooms: ' + _.size(mainRooms));
            console.log('Claiming Manager: ClaimingManagers: ' + _.size(claimingManagers));
            if (Game.gcl.level > _.size(mainRooms) + _.size(claimingManagers))
                claimingManagers[flags[idx].pos.roomName] = new ClaimingManager(flags[idx].pos);
        }

        for (let idx in claimingManagers) {
            claimingManagers[idx].tick();
        }



        if (Memory['trace']) {
            var endCpu = Game.cpu.getUsed();
            console.log('Colony: Handle ClaimingManagers ' + (endCpu - startCpu).toFixed(2));
        }
    }

    function handleInvasionManagers() {
        if (Memory['trace'])
            var startCpu = Game.cpu.getUsed();

        let flags = _.filter(Game.flags, (x) => x.memory.invasion == true && !invasionManagers[x.roomName]);

        flags.forEach(x => { invasionManagers[x.roomName] = new InvasionManager(x.pos.roomName) });

        _.values<InvasionManager>(invasionManagers).forEach(x => x.tick());


        let invasionsToDelete = _.filter(invasionManagers, x => !_.any(Game.flags, f => (f.memory.invasion == true || f.memory.invasion == 'true') && f.pos.roomName == x.roomName));

        if (Memory['trace']) {
            var endCpu = Game.cpu.getUsed();
            console.log('Colony: Handle InvasionManagers ' + (endCpu - startCpu).toFixed(2));
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
            let myRoom = roomArray[idx];
            calculateDistances(myRoom);


        }

        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('Colony.Calculate distances to MainRooms: ' + (endCpu - startCpu).toFixed(2));
        }



        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        for (let roomName in Game.rooms) {
            getRoom(roomName);
        }
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('Colony: Query all rooms ' + (endCpu - startCpu).toFixed(2));
        }


        handleClaimingManagers();
        handleInvasionManagers();

        createScouts();

        for (let roomName in mainRooms)
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


        if ((Game.time % 500 == 0) || Memory['forceReassignment'] == true || Memory['forceReassignment'] == 'true') {
            try {
                
                let result = new RoomAssignmentHandler(rooms, mainRooms).getAssignments();

                let stringResult = _.map(result, x => {
                    return {
                        mainRoom: x.mainRoom.name,
                        rooms: _.map(x.myRooms, y => y.name)
                    }
                });
                _.forEach(rooms, (x) => x.mainRoom = null);

                _.forEach(result, (x) => _.forEach(x.myRooms, (y) => y.mainRoom = x.mainRoom));

                Memory['RoomAssignment'] = stringResult;
                Memory['forceReassignment'] = false;
            }
            catch (e) {
                console.log('ERRROR: ROOMASSIGNMENT ' + e.stack);
                Memory['RoomAssignmentError'] = JSON.parse(JSON.stringify(e));
            }
        }

    }

}