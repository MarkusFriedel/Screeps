import {MainRoom} from "./mainRoom";
import {Reserver} from "../creeps/reserver/reserver";
import {Colony} from "../../colony/colony";
import {Body} from "../creeps/body";

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
        let mainRoom = this.mainRoom;
        if (this.mainRoom.spawnManager.isBusy)
            return;

        if (Memory['verbose'] == true)
            console.log('ReservationManager.checkCreep');
        let rooms = _.filter(this.mainRoom.connectedRooms, (r) => r.canHarvest() == true && !r.memory.hostiles && (r.room != null && r.room.controller != null && r.useableSources.length > 0));
        for (var idx in rooms) {
            let myRoom = rooms[idx];
            if (Memory['verbose'] == true)
                console.log('ReservationManager.checkCreep: 1 Room ' + myRoom.name);
            if (myRoom.memory.mainRoomDistanceDescriptions[this.mainRoom.name].distance >= 3 && !_.any(myRoom.mySources, x => x.requiresCarrier))
                continue;
            let room = myRoom.room;
            if (room && room.controller.reservation != null && room.controller.reservation.ticksToEnd > 4500)
                continue;
            if (Memory['verbose'] == true)
                console.log('ReservationManager.checkCreep: 2 Room ' + myRoom.name);
            if (this.mainRoom.maxSpawnEnergy < 650)
                return;
            let requiredCount =this.mainRoom.maxSpawnEnergy < 1300 ? 2 : 1;

            if (_.filter(this.creeps, (x) => (<ReserverMemory>x.memory).targetRoomName == myRoom.name).length < requiredCount) {
                    this.mainRoom.spawnManager.AddToQueue(requiredCount > 1 ? [CLAIM,MOVE] :[CLAIM, CLAIM, MOVE, MOVE], { role: 'reserver', targetRoomName: myRoom.name }, 1, true);
            }
        }
    }

    public tick() {
        this.creeps.forEach((c) => new Reserver(c, this.mainRoom).tick());
    }
}