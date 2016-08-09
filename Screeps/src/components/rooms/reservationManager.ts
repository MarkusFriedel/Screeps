/// <reference path="../creeps/reserver/reserver.ts" />
/// <reference path="./manager.ts" />

class ReservationManager implements ReservationManagerInterface {
    _creeps: { time: number, creeps: Array<Creep> } = { time: 0, creeps: null };
    public get creeps(): Array<Creep> {
        if (this._creeps.time < Game.time)
            this._creeps = {
                time: Game.time, creeps: this.mainRoom.creepsByRole('reserver')
            };
        return this._creeps.creeps;
    }



    constructor(public mainRoom: MainRoom) {
        if (myMemory['profilerActive']) {
            this.preTick = profiler.registerFN(this.preTick, 'ReservationManager.preTick');
            this.tick = profiler.registerFN(this.tick, 'ReservationManager.tick');
        }
    }

    public preTick(myRoom: MyRoomInterface) {
        let mainRoom = this.mainRoom;
        if (this.mainRoom.spawnManager.isBusy)
            return;

        if (mainRoom.room.controller.level <= 3)
            return;
        if (mainRoom.maxSpawnEnergy < 1300)
            return;

        if (!myRoom.canHarvest || !myRoom.hasController || !myRoom.controllerPosition || myRoom.name == this.mainRoom.name)
            return;

        let room = myRoom.room;
        if (room && room.controller.reservation != null && (room.controller.reservation.ticksToEnd > 4500 || this.mainRoom.room.controller.level <= 3 && room.controller.reservation.ticksToEnd >= 500))
            return;
        if (this.mainRoom.maxSpawnEnergy < 650)
            return;
        let requiredCount = this.mainRoom.maxSpawnEnergy < 1300 ? 2 : 1;

        if (_.filter(this.creeps, (x) => (<ReserverMemory>x.memory).targetRoomName == myRoom.name).length < requiredCount) {
            this.mainRoom.spawnManager.addToQueue(requiredCount > 1 ? [CLAIM, MOVE] : [CLAIM, CLAIM, MOVE, MOVE], { role: 'reserver', targetRoomName: myRoom.name }, 1, false);
        }
    }


    public tick() {
        this.creeps.forEach((c) => new Reserver(c.name, this.mainRoom).tick());
    }
}