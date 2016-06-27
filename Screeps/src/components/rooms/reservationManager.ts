import {MainRoom} from "./mainRoom";
import {Reserver} from "../creeps/reserver/reserver";

export class ReservationManager {
    mainRoom: MainRoom;
        creeps: Array<Creep>;

    constructor(mainRoom: MainRoom) {
        this.mainRoom = mainRoom;
        this.getData();
    }

    public checkCreeps() {
        if (Memory['verbose'] == true)
            console.log('ReservationManager.checkCreep');
        if (this.mainRoom.maxSpawnEnergy < 1300) {
            if (Memory['verbose'] == true)
                console.log('ReservationManager.checkCreep: Max Energy too low, ' + this.mainRoom.maxSpawnEnergy);
            return;
        }
        this.getData();
        for (var idx in _.filter(this.mainRoom.connectedRooms, (r) => r.canHarvest()==true && !r.memory.hostiles)) {
            let myRoom = this.mainRoom.connectedRooms[idx];
            let room = Game.rooms[myRoom.name];
            if (room && room.controller.reservation != null && room.controller.reservation.ticksToEnd > 1000)
                continue;
            if (Memory['verbose'] == true)
                console.log('ReservationManager.checkCreep: Room ' + myRoom.name);
            if (_.filter(this.creeps, (x) => (<ReserverMemory>x.memory).targetRoomName == myRoom.name).length == 0) {
                this.mainRoom.spawnManager.AddToQueue([CLAIM, CLAIM, MOVE, MOVE], { role: 'reserver', targetRoomName:myRoom.name });
            }
        }
    }

    public tick() {
        this.getData();
        this.creeps.forEach((c) => new Reserver(c, this.mainRoom).tick());
    }

    getData() {
        this.creeps = _.filter(this.mainRoom.creeps, (c) => c.memory.role == 'reserver');
    }
}