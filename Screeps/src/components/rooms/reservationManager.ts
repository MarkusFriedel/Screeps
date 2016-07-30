/// <reference path="../creeps/reserver/reserver.ts" />
/// <reference path="./manager.ts" />

class ReservationManager extends Manager implements ReservationManagerInterface {
    _creeps: { time: number, creeps: Array<Creep> } = { time: 0, creeps: null };
    public get creeps(): Array<Creep> {
        if (this._creeps.time < Game.time)
            this._creeps = {
                time: Game.time, creeps: this.mainRoom.creepsByRole('reserver')
            };
        return this._creeps.creeps;
    }

    private static _staticTracer: Tracer;
    public static get staticTracer(): Tracer {
        if (ReservationManager._staticTracer == null) {
            ReservationManager._staticTracer = new Tracer('ReservationManager');
            Colony.tracers.push(ReservationManager._staticTracer);
        }
        return ReservationManager._staticTracer;
    }

    constructor(public mainRoom: MainRoom) {
        super(ReservationManager.staticTracer);
    }

    public _preTick() {
        let mainRoom = this.mainRoom;
        if (this.mainRoom.spawnManager.isBusy)
            return;

        if (Memory['verbose'] == true)
            console.log('ReservationManager.checkCreep');
        let rooms = _.filter(this.mainRoom.connectedRooms, (r) => r.canHarvest == true && r.hasController && r.controllerPosition);
        for (var idx in rooms) {
            let myRoom = rooms[idx];
            if (Memory['verbose'] == true)
                console.log('ReservationManager.checkCreep: 1 Room ' + myRoom.name);
            let room = myRoom.room;
            if (room && room.controller.reservation != null && (room.controller.reservation.ticksToEnd > 4500 || this.mainRoom.room.controller.level <= 3 && room.controller.reservation.ticksToEnd>500))
                continue;
            if (Memory['verbose'] == true)
                console.log('ReservationManager.checkCreep: 2 Room ' + myRoom.name);
            if (this.mainRoom.maxSpawnEnergy < 650)
                return;
            let requiredCount =this.mainRoom.maxSpawnEnergy < 1300 ? 2 : 1;

            if (_.filter(this.creeps, (x) => (<ReserverMemory>x.memory).targetRoomName == myRoom.name).length < requiredCount) {
                    this.mainRoom.spawnManager.addToQueue(requiredCount > 1 ? [CLAIM,MOVE] :[CLAIM, CLAIM, MOVE, MOVE], { role: 'reserver', targetRoomName: myRoom.name }, 1, false);
            }
        }
    }

    public _tick() {
        this.creeps.forEach((c) => new Reserver(c, this.mainRoom).tick());
    }
}