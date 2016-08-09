/// <reference path="../myCreep.ts" />

class Carrier extends MyCreep<CarrierMemory> {

    constructor(public name: string) {
        super(name);
        this.autoFlee = true;
        if (myMemory['profilerActive']) {
            this.myTick = profiler.registerFN(this.myTick, 'Carrier.tick');
        }
    }

    pickupEnergy() {
        if (this.myRoom.resourceDrops.length > 0) {
            let energy = _.filter(this.myRoom.resourceDrops, r => r.amount >= 100 && r.resourceType == RESOURCE_ENERGY && r.pos.inRangeTo(this.creep.pos, 1))[0];
            if (energy) {
                if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
                    return true;
            }
        }
        return false;
    }

    myTick() {
        let pickupRoom = Colony.mainRooms[this.memory.sourceRoomName];
        let targetRoom = Colony.mainRooms[this.memory.targetRoomName];

        if (pickupRoom == null || pickupRoom.mainContainer == null || targetRoom == null || targetRoom.mainContainer == null)
            return;

        if (this.memory.state == null || this.memory.state == CarrierState.Delivery && this.creep.carry.energy == 0) {

            if (this.creep.ticksToLive <700)
                this.recycle();
            this.memory.state = CarrierState.Pickup;

        }
        else if (this.memory.state == CarrierState.Pickup && _.sum(this.creep.carry) >= this.creep.carryCapacity / 2) {

            this.memory.state = CarrierState.Delivery;
        }

        if (this.pickUpEnergy(2))
            return;

        if (this.memory.state == CarrierState.Pickup) {
            if (!this.creep.pos.isNearTo(pickupRoom.mainContainer))
                this.moveTo({ pos: pickupRoom.mainContainer.pos, range: 1 }, { roomCallback: Colony.getTravelMatrix, maxOps: 50000 });
            else
                this.creep.withdraw(pickupRoom.mainContainer, RESOURCE_ENERGY);
        }
        else if (this.memory.state == CarrierState.Delivery) {
            if (!this.creep.pos.isNearTo(targetRoom.mainContainer))
                this.moveTo({ pos: targetRoom.mainContainer.pos, range: 1 }, { roomCallback: Colony.getTravelMatrix, maxOps: 50000 });
            else
                this.creep.transfer(targetRoom.mainContainer, RESOURCE_ENERGY);
        }
    }

}