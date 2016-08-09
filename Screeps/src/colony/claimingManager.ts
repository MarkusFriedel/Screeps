/// <reference path="../components/creeps/body.ts" />
/// <reference path="../components/creeps/spawnConstructor/spawnConstructor.ts" />
/// <reference path="../components/rooms/mainRoom.ts" />
/// <reference path="./roomAssignment.ts" />

class ClaimingManager implements ClaimingManagerInterface {

    public get memory(): ClaimingManagerMemory {
        return this.accessMemory();
    }

    accessMemory() {
        if (Colony.memory.claimingManagers == null)
            Colony.memory.claimingManagers = {};
        if (Colony.memory.claimingManagers[this.roomName] == null)
            Colony.memory.claimingManagers[this.roomName] = {
                targetPosition: this.targetPosition,
                verbose: false
            }
        return Colony.memory.claimingManagers[this.roomName];
    }

    creeps: Array<Creep>;
    scouts: Array<Creep>;
    spawnConstructors: Array<Creep>;
    claimers: Array<Creep>;
    roomName: string;
    spawnConstructionSite: ConstructionSite;


    constructor(public targetPosition: RoomPosition) {
        this.roomName = targetPosition.roomName;
    }

    tickSpawnConstructors(creep: Creep) {
        new SpawnConstructor(creep.name).tick();
    }

    tickClaimer(creep: Creep) {
        if (creep.room.name != creep.memory.targetPosition.roomName) {
            console.log(creep.moveTo(new RoomPosition(creep.memory.targetPosition.x, creep.memory.targetPosition.y, creep.memory.targetPosition.roomName)));
        } else {
            let controller = Game.rooms[creep.memory.targetPosition.roomName].controller;

            if (creep.claimController(controller) == ERR_NOT_IN_RANGE)
                creep.moveTo(controller);
        }
    }

    checkScouts(myRoom: MyRoomInterface) {
        if (myRoom == null || myRoom.memory.lst < Game.time - 500) {
            if (this.scouts.length == 0) {
                let mainRoom: MainRoomInterface = null;
                if (myRoom == null)
                    mainRoom= _.sortBy(_.values<MainRoomInterface>(Colony.mainRooms), x => Game.map.getRoomLinearDistance(x.name, this.targetPosition.roomName))[0];
                else
                    mainRoom = myRoom.closestMainRoom;
                if (mainRoom)
                    mainRoom.spawnManager.addToQueue(['move'], { handledByColony: true, claimingManager: this.roomName, role: 'scout', targetPosition: this.targetPosition });
            }
            return false;
        }
        else
            return true;
    }

    checkClaimer(myRoom: MyRoomInterface) {
        if (this.claimers.length == 0) {
            let body = new Body();
            body.claim = 1;
            body.move = 1;
            Colony.spawnCreep(myRoom,body, { handledByColony: true, claimingManager: this.roomName, role: 'claimer', targetPosition: this.targetPosition });
            return false;
        }
        return true;
    }

    checkSpawnConstructors(myRoom: MyRoomInterface) {
        if (myRoom == null)
            return false;
        let mainRoom = myRoom.closestMainRoom;
        if (mainRoom == null)
            return false;

        let needCreeps = false;
        let sources = _.filter(myRoom.mySources, x => x.hasKeeper == false);
        for (let idx in sources) {
            let mySource = sources[idx];
            let creepCount = _.filter(this.spawnConstructors, (x) => x.memory.sourceId == mySource.id).length;
            if (creepCount < 2) {
                mainRoom.spawnManager.addToQueue(['work', 'work', 'work', 'work', 'work', 'carry', 'carry', 'carry', 'carry', 'carry', 'carry', 'carry', 'carry', 'carry', 'carry', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move'], { handledByColony: true, claimingManager: this.roomName, role: 'spawnConstructor', targetPosition: this.targetPosition, sourceId: mySource.id }, 2 - creepCount);
                needCreeps = true;
            }
        }
        return !needCreeps;
    }

    finishClaimingManager() {
        let mainRoom = new MainRoom(this.roomName);
        Colony.mainRooms[this.roomName] = mainRoom;
        let myRoom = Colony.getRoom(this.roomName);
        myRoom.mainRoom = mainRoom;
        myRoom.memory.mrn = this.roomName;
        myRoom.memory.mrd[this.roomName] = { n: this.roomName, d: 0 };

        for (let idx in this.scouts)
            this.scouts[idx].suicide();

        for (let idx in this.claimers)
            this.claimers[idx].suicide();

        let sourceArray = _.values<MySourceInterface>(myRoom.mySources);

        for (let idx = 0; idx < this.spawnConstructors.length; idx++) {
            let creep = this.spawnConstructors[idx];
            creep.memory.role = 'harvester';
            creep.memory.doConstructions = true;
            creep.memory.handledByColony = false;
            creep.memory.mainRoomName = this.roomName;
            (<EnergyHarvesterMemory>creep.memory).state = EnergyHarvesterState.Harvesting;

            (<EnergyHarvesterMemory>creep.memory).sourceId = sourceArray[idx % sourceArray.length].id;
        }
       
        


        delete Colony.memory.claimingManagers[this.roomName];
        delete Colony.claimingManagers[this.roomName];

        //new RoomAssignmentHandler().assignRooms();
    }

    public tick() {
        let room = Game.rooms[this.roomName];
        if (Colony.getRoom(this.roomName))
            Colony.getRoom(this.roomName).mainRoom = null;

        this.creeps = _.filter(Game.creeps, (x) => x.memory.handledByColony == true && x.memory.claimingManager == this.roomName);

        this.scouts = _.filter(this.creeps, (x) => x.memory.targetPosition.roomName == this.targetPosition.roomName && x.memory.role == 'scout');
        this.spawnConstructors = _.filter(this.creeps, (x) => x.memory.role == 'spawnConstructor');
        this.claimers = _.filter(this.creeps, (x) => x.memory.role == 'claimer');


        if (room && _.size(room.find(FIND_MY_SPAWNS)) > 0) {
            this.finishClaimingManager();
            return;
        }

        let owning = false;

        if (room != null) {
            if (room.controller.owner != null && room.controller.owner.username == Colony.myName) {
                owning = true;
                //this.spawnConstructionSite = room.find<ConstructionSite>(FIND_MY_CONSTRUCTION_SITES, { filter: (x: ConstructionSite) => x.structureType == STRUCTURE_SPAWN })[0];
                let pos = this.memory.targetPosition;
                if (_.filter(Game.constructionSites, (x) => x.structureType == STRUCTURE_SPAWN && x.room.name == room.name).length == 0)
                    new RoomPosition(pos.x, pos.y, pos.roomName).createConstructionSite(STRUCTURE_SPAWN);
            }
        }

        let myRoom = Colony.getRoom(this.roomName);

        if (owning == false && this.checkScouts(myRoom) && this.checkSpawnConstructors(myRoom) && this.checkClaimer(myRoom)) {
            this.claimers.forEach(x => this.tickClaimer(x));
            this.spawnConstructors.forEach(x => this.tickSpawnConstructors(x));
        }
        else if (owning == true) {
            this.checkSpawnConstructors(myRoom);
            this.spawnConstructors.forEach(x => this.tickSpawnConstructors(x));
        }

        return;
    }
}