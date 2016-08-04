/// <reference path="../myCreep.ts" />

class Carrier extends MyCreep {
    public get memory(): CarrierMemory { return this.creep.memory; }

    constructor(public creep: Creep) {
        super(creep);
        this.memory.autoFlee = true;
        this.myTick = profiler.registerFN(this.myTick, 'Carrier.tick');
    }

    createPickupPath(pickupRoom: MainRoomInterface) {
        this.memory.path = PathFinder.search(this.creep.pos, { pos: pickupRoom.mainContainer.pos, range: 3 }, { roomCallback: Colony.getTravelMatrix, plainCost: 2, swampCost: 2, maxOps: 5000 });
        this.memory.path.path.unshift(this.creep.pos);
    }

    createDeliveryPath(targetRoom: MainRoomInterface) {
        this.memory.path = PathFinder.search(this.creep.pos, { pos: targetRoom.mainContainer.pos, range: 3 }, { roomCallback: Colony.getTravelMatrix, plainCost: 2, swampCost: 10, maxOps: 5000 });
        this.memory.path.path.unshift(this.creep.pos);
    }

    pickupEnergy() {
        if (this.myRoom.resourceDrops.length > 0) {
            let energy = _.filter(this.myRoom.resourceDrops, r => r.amount>=100 && r.resourceType == RESOURCE_ENERGY && r.pos.inRangeTo(this.creep.pos, 3))[0];
            if (energy) {
                if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(energy);
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

            this.createPickupPath(pickupRoom);

            if (this.creep.ticksToLive < 4 * this.memory.path.path.length) {
                this.recycle();
                return;
            }

            this.memory.state = CarrierState.Pickup;

        }
        else if (this.memory.state == CarrierState.Pickup && _.sum(this.creep.carry) >= this.creep.carryCapacity/2) {

            this.createDeliveryPath(targetRoom);
            this.memory.state = CarrierState.Delivery;
        }

        else if (this.memory.state != CarrierState.Pickup || !this.pickupEnergy()) {




            if (this.memory.path && this.memory.path.path.length > 2) {
                this.creep.say('path');
                this.moveByPath();
            }
            else if (this.memory.state == CarrierState.Delivery && this.creep.room.name != this.memory.targetRoomName) {
                this.createDeliveryPath(targetRoom);
                this.moveByPath();
            }
            else if (this.memory.state == CarrierState.Pickup && this.creep.room.name != this.memory.sourceRoomName) {
                this.createPickupPath(pickupRoom);
                this.moveByPath();
            }
            else if (this.memory.state == CarrierState.Pickup) {
                if (this.creep.withdraw(pickupRoom.mainContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(pickupRoom.mainContainer);
            }
            else if (this.memory.state == CarrierState.Delivery) {
                if (!this.creep.pos.isNearTo(targetRoom.mainContainer))
                    this.creep.moveTo(targetRoom.mainContainer);
                else
                    this.creep.transfer(targetRoom.mainContainer, RESOURCE_ENERGY);
            }
        }
    }

}