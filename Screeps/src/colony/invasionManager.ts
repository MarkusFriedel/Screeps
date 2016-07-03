/// <reference path="../components/creeps/invader/invader.ts" />

class InvasionManager implements InvasionManagerInterface {

    public get memory(): InvasionManagerMemory {
        return this.accessMemory();
    }

    accessMemory() {
        if (Colony.memory.invasionManagers == null)
            Colony.memory.invasionManagers = {};
        if (Colony.memory.invasionManagers[this.roomName] == null)
            Colony.memory.invasionManagers[this.roomName] = {
                targetRoomName: this.roomName,
                verbose:false
            }
        return Colony.memory.invasionManagers[this.roomName];
    }

    creeps: Array<Creep>;
    scouts: Array<Creep>;
    invaders: Array<Creep>;
    dismantlers: Array<Creep>;


    constructor(public roomName) {
        this.memory.targetRoomName = roomName;
    }

    checkScouts(myRoom: MyRoomInterface) {
        if (myRoom == null || myRoom.memory.lastScanTime < Game.time - 500) {
            if (this.scouts.length == 0) {

                if (myRoom && myRoom.closestMainRoom) {
                    let mainRoom = myRoom.closestMainRoom;

                    mainRoom.spawnManager.addToQueue(['move', 'work'], { handledByColony: true, invasionManager: this.roomName, role: 'scout', targetPosition: new RoomPosition(25, 25, this.roomName) }, 1, true);
                }
                else {
                    let mainRoom = _.sortBy(_.values<MainRoomInterface>(Colony.mainRooms), x => Game.map.getRoomLinearDistance(x.name, this.roomName))[0];
                    mainRoom.spawnManager.addToQueue(['move', 'work'], { handledByColony: true, invasionManager: this.roomName, role: 'scout', targetPosition: new RoomPosition(25, 25, this.roomName) }, 1);
                }
            }
            return false;
        }
        else
            return true;
    }

    checkInvaders(myRoom: MyRoomInterface, rallyFlag: Flag) {
        if (myRoom == null)
            return false;
        let creepsRequired = 5;
        console.log('check invaders');

        if (this.invaders.length < creepsRequired) {
            let mainRoom = myRoom.closestMainRoom;
            if (mainRoom == null)
                return false;

            let idleInvaders = _.filter(Game.creeps, x => x.memory.handledByColony && x.memory.role == 'invader' && x.memory.subRole == 'attacker' && x.memory.invasionManager == null);
            idleInvaders.forEach(x => x.memory = { handledByColony: true, invasionManager: this.roomName, targetRoomName: this.roomName, role: 'invader', state: 'rally', subRole: 'attacker', rallyPoint: rallyFlag.pos });
            if (idleInvaders.length == 0)
                mainRoom.spawnManager.addToQueue(DefenderDefinition.getDefinition(mainRoom.maxSpawnEnergy).getBody(), { handledByColony: true, invasionManager: this.roomName, targetRoomName: this.roomName, role: 'invader', state: 'rally', subRole: 'attacker', rallyPoint: rallyFlag.pos }, creepsRequired - this.invaders.length);
            return false;
        }
        else return true;
    }

    checkDismantlers(myRoom: MyRoomInterface, rallyFlag: Flag) {
        if (myRoom == null)
            return false;
        let creepsRequired = 5;

        if (this.dismantlers.length < creepsRequired) {
            let mainRoom = myRoom.closestMainRoom;
            if (mainRoom == null)
                return false;
            let idleInvaders = _.filter(Game.creeps, x => x.memory.handledByColony && x.memory.role == 'invader' && x.memory.subRole == 'dismantler' && x.memory.invasionManager == null);
            idleInvaders.forEach(x => x.memory = { handledByColony: true, invasionManager: this.roomName, targetRoomName: this.roomName, role: 'invader', state: 'rally', subRole: 'dismantler', rallyPoint: rallyFlag.pos });

            if (idleInvaders.length == 0) {
                let moduleCount = Math.floor(mainRoom.maxSpawnEnergy / 150);
                moduleCount = Math.min(moduleCount, 25);
                let body = new Body();
                body.work = moduleCount;
                body.move = moduleCount;
                mainRoom.spawnManager.addToQueue(body.getBody(), { handledByColony: true, invasionManager: this.roomName, targetRoomName: this.roomName, role: 'invader', state: 'rally', subRole: 'dismantler', rallyPoint: rallyFlag.pos }, creepsRequired - this.dismantlers.length);
            }
            return false;
        }
        else
            return true;
    }

    public endInvasion(rallyFlag: Flag) {

        console.log('END INVASION. ' + this.roomName);

        this.creeps.forEach(x => { x.memory = { role: x.memory.role, subRole: x.memory.subRole, handledByColony: true } });
        if (Colony.memory.invasionManagers != null)
            delete Colony.memory.invasionManagers[this.roomName];
        delete Colony.invasionManagers[this.roomName];
        let invasionFlag = _.filter(Game.flags, x => x.memory.invasion == true && x.pos.roomName == this.roomName)[0];
        if (invasionFlag != null)
            invasionFlag.remove();
        if (rallyFlag != null)
            delete rallyFlag.memory.invasionRoomName;
    }

    public tick() {

        let rallyFlag = _.filter(Game.flags, x => x.memory.rally == true && x.memory.invasionRoomName == this.roomName)[0];

        this.creeps = _.filter(Game.creeps, (x) => x.memory.handledByColony == true && x.memory.invasionManager == this.roomName);

        this.scouts = _.filter(this.creeps, (x) => x.memory.targetPosition != null && x.memory.targetPosition.roomName == this.roomName && x.memory.role == 'scout');
        this.invaders = _.filter(this.creeps, (x) => x.memory.role == 'invader' && x.memory.subRole == 'attacker');

        this.dismantlers = _.filter(this.creeps, (x) => x.memory.role == 'invader' && x.memory.subRole == 'dismantler');

        let room = Game.rooms[this.roomName];

        if (room != null && room.find(FIND_HOSTILE_STRUCTURES, { filter: (x: Structure) => x.structureType != STRUCTURE_CONTROLLER }).length == 0 && room.find(FIND_HOSTILE_CREEPS).length == 0) {
            this.endInvasion(rallyFlag);
            return;
        }


        let myRoom = Colony.getRoom(this.roomName);

        if (rallyFlag && this.checkScouts(myRoom) && this.checkDismantlers(myRoom, rallyFlag) && this.checkInvaders(myRoom, rallyFlag)) {
            console.log(rallyFlag.pos.roomName);
            if (_.every(this.invaders, (x) => { return x.pos.inRangeTo(rallyFlag.pos, 5) }) && _.every(this.dismantlers, (x) => { return x.pos.inRangeTo(rallyFlag.pos, 5) })) {
                this.creeps.forEach(x => x.memory.state = 'attack');
            }
        }
        this.invaders.forEach(x => new Invader(x).tick());
        this.dismantlers.forEach(x => new Invader(x).tick());
    }
}