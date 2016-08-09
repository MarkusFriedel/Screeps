/// <reference path="../creeps/sourceCarrier/sourceCarrierDefinition.ts" />
/// <reference path="../creeps/carrier/carrier.ts" />
/// <reference path="./manager.ts" />

class CarrierManager {

    _carrierCreeps: { time: number, creeps: Array<Creep> } = { time: -1, creeps: null };
    public get carrierCreeps(): Array<Creep> {
        if (this._carrierCreeps.time < Game.time)
            this._carrierCreeps = {
                time: Game.time, creeps: this.mainRoom.creepsByRole('carrier')
            };
        return this._carrierCreeps.creeps;
    }

  

    constructor(public mainRoom: MainRoomInterface) {
        if (myMemory['profilerActive']) {
            this.preTick = profiler.registerFN(this.preTick, 'CarrierManager.preTick');
            this.tick = profiler.registerFN(this.tick, 'CarrierManager.tick');
        }
    }

    preTick() {
        if (this.mainRoom.terminal || !this.mainRoom.mainContainer || this.mainRoom.mainContainer.store.energy > 2 * this.mainRoom.maxSpawnEnergy)
            return;

        if (_.any(this.carrierCreeps, c => c.pos.isNearTo(this.mainRoom.mainContainer)))
            return;

        let closestMainRoomName = _.min(_.filter(this.mainRoom.myRoom.memory.mrd, d => d.d != 0 && Colony.mainRooms[d.n].mainContainer && Colony.mainRooms[d.n].mainContainer.store.energy >= 5 * Colony.mainRooms[d.n].maxSpawnEnergy), d => d.d).n;
        if (!closestMainRoomName)
            return;
        let closestMainRoom = Colony.mainRooms[closestMainRoomName];

        if (closestMainRoom.spawnManager.isBusy)
            return;

        let memory = <CarrierMemory>{
            targetRoomName: this.mainRoom.name,
            sourceRoomName: closestMainRoomName,
            role: 'carrier',
            state: CarrierState.Pickup,
            mainRoomName: this.mainRoom.name
        };

        let definition = SourceCarrierDefinition.getDefinition(closestMainRoom.maxSpawnEnergy, 2 * this.mainRoom.maxSpawnEnergy * this.mainRoom.myRoom.memory.mrd[closestMainRoomName].d);

        console.log('Carriers required: ' + definition.count);
        console.log('Carriers existing: ' + this.carrierCreeps.length);
        console.log('Carriers size: ' + definition.body.getBody().length);
        console.log('Carriers costs: ' + definition.body.costs);
        console.log('Carriers spawn room: ' + closestMainRoom.name);

        if (definition.count - this.carrierCreeps.length > 0)
            closestMainRoom.spawnManager.addToQueue(definition.body.getBody(), memory, definition.count - this.carrierCreeps.length);
    }

    tick() {
        _.forEach(this.carrierCreeps, c => new Carrier(c.name).tick());
    }

}