import {MainRoom} from "./mainRoom";
import {Reserver} from "../creeps/reserver/reserver";

export class ReservationManager {
    _creeps: { time: number, creeps: Array<Creep> } = { time: 0, creeps: null };
    public get creeps(): Array<Creep> {
        if (this._creeps.time < Game.time)
            this._creeps = {
                time: Game.time, creeps: _.filter(this.mainRoom.creeps, (c) => c.memory.role == 'reserver')
            };
        return this._creeps.creeps;
    }

    constructor(public mainRoom: MainRoom) {
    }

    public checkCreeps() {
        if (this.mainRoom.spawnManager.isBusy ||  this.mainRoom.room.energyAvailable < 1300)
            return;
        if (Memory['verbose'] == true)
            console.log('ReservationManager.checkCreep');
        if (this.mainRoom.maxSpawnEnergy < 1300) {
            if (Memory['verbose'] == true)
                console.log('ReservationManager.checkCreep: Max Energy too low, ' + this.mainRoom.maxSpawnEnergy);
            return;
        }
        let rooms = _.filter(this.mainRoom.connectedRooms, (r) => r.canHarvest() == true && !r.memory.hostiles && (r.room != null && r.room.controller != null));
        for (var idx in rooms) {
            let myRoom = rooms[idx];
            if (Memory['verbose'] == true)
                console.log('ReservationManager.checkCreep: 1 Room ' + myRoom.name);
            if (myRoom.memory.mainRoomDistanceDescriptions[this.mainRoom.name].distance >= 2 && !_.any(myRoom.mySources, x => x.requiresCarrier))
                continue;
            let room = myRoom.room;
            if (room && room.controller.reservation != null && room.controller.reservation.ticksToEnd > 1000)
                continue;
            if (Memory['verbose'] == true)
                console.log('ReservationManager.checkCreep: 2 Room ' + myRoom.name);
            if (_.filter(this.creeps, (x) => (<ReserverMemory>x.memory).targetRoomName == myRoom.name).length == 0) {
                this.mainRoom.spawnManager.AddToQueue([CLAIM, CLAIM, MOVE, MOVE], { role: 'reserver', targetRoomName: myRoom.name });
            }
        }
    }

    public tick() {
        this.creeps.forEach((c) => new Reserver(c, this.mainRoom).tick());
    }
}