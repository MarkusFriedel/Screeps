/// <reference path="../myCreep.ts" />

class HarvestingCarrier extends MyCreep<HarvestingCarrierMemory> {

    private harvestingSite: HarvestingSiteInterface;

    public get state() {
        return this.memory.st;
    }

    public set state(value: HarvestingCarrierState) {
        this.memory.st = value;
    }

    constructor(public name: string, public mainRoom: MainRoomInterface) {
        super(name);

        this.harvestingSite = this.mainRoom.harvestingSites[this.memory.sId];
        this.autoFlee = true;

        if (myMemory['profilerActive']) {
            this.stateDeliver = profiler.registerFN(this.stateDeliver, 'HarvestingCarrier.stateDeliver');
            this.statePickup = profiler.registerFN(this.statePickup, 'HarvestingCarrier.statePickup');
            this.myTick = profiler.registerFN(this.myTick, 'HarvestingCarrier.tick');
        }
    }

    private statePickup() {
        if (!this.harvestingSite)
            return;
        if (this.creep.fatigue > 0)
            return;
        let resource = _.filter(this.myRoom.resourceDrops, r => this.creep.pos.inRangeTo(r.pos, 1))[0];
        if (resource)
            this.creep.pickup(resource);
        if (this.creep.fatigue > 0)
            return;

        if (this.harvestingSite.containerPosition)
            var target = { pos: this.harvestingSite.containerPosition, range: 1 };
        else
            target = { pos: this.harvestingSite.pos, range: 2 }

        

        if (this.harvestingSite.hasKeeper)
            var initialDistance = 6;
        else
            initialDistance = 3;

        let minDistanceToSourceAndLair = this.creep.pos.getRangeTo(this.harvestingSite.pos);
        if (this.harvestingSite.lairPosition)
            minDistanceToSourceAndLair = Math.min(minDistanceToSourceAndLair, this.creep.pos.getRangeTo(this.harvestingSite.lairPosition));
        if (minDistanceToSourceAndLair > initialDistance) {
            this.moveTo(target, { roomCallback: Colony.getCustomMatrix({ ignoreKeeperSourceId: this.harvestingSite.id }), plainCost: 2, swampCost:10 });
            return;
        }
        else {
            let energy = _.filter(this.myRoom.resourceDrops, r => this.harvestingSite.pos.inRangeTo(r.pos, 2) && (this.harvestingSite.amount == 0 || this.harvestingSite.container || r.amount > 1000 || r.amount >= this.creep.carryCapacity - _.sum(this.creep.carry)))[0];
            if ((!this.harvestingSite.hasKeeper || energy || this.harvestingSite.container) && !this.harvestingSite.keeperIsAlive) {
                if (energy)
                    if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
                        this.moveTo({ pos: energy.pos, range: 1 }, { roomCallback: Colony.getCustomMatrix({ ignoreAllKeepers: true, avoidCreeps: true }), maxOps:100 });
                    else
                        this.moveTo(target, { roomCallback: Colony.getCustomMatrix({ ignoreAllKeepers: true, avoidCreeps: true }), maxOps:100 });
                else if (this.harvestingSite.container) {
                    if (this.creep.withdraw(this.harvestingSite.container, this.harvestingSite.resourceType) == ERR_NOT_IN_RANGE)
                        this.moveTo({ pos: this.harvestingSite.container.pos, range: 1 }, { roomCallback: Colony.getCustomMatrix({ ignoreAllKeepers: true, avoidCreeps: true }), maxOps:100 });
                }
                return;
            }
            else if (minDistanceToSourceAndLair < initialDistance && this.harvestingSite.keeperIsAlive) {
                this.creep.say('Uh Oh');
                delete this.memory.pathMovement;
                let fleePath = PathFinder.search(this.creep.pos, [{ pos: this.harvestingSite.pos, range: initialDistance + 1 }, { pos: this.harvestingSite.keeper.lair.pos, range: initialDistance + 1 }], { flee: true, roomCallback: Colony.getCustomMatrix({ avoidCreeps:true }), plainCost: 2, swampCost: 10, maxOps: 100 });
                if (fleePath.path.length > 0) {
                    this.creep.say('Flee' + fleePath.ops);
                    this.creep.move(this.creep.pos.getDirectionTo(fleePath.path[0]));
                }
                return;
            }
        }
    }

    private stateDeliver() {
        if (this.creep.fatigue > 0)
            return;
        if (this.creep.carry.energy > 0) {
            if (!this.creep.pos.isNearTo(this.mainRoom.energyDropOffStructure))
                this.moveTo({ pos: this.mainRoom.energyDropOffStructure.pos, range: 1 }, { plainCost: 2, swampCost: 10, roomCallback: Colony.getCustomMatrix({ ignoreKeeperSourceId: this.harvestingSite.id }) });
            else
                this.creep.transfer(this.mainRoom.energyDropOffStructure, RESOURCE_ENERGY);
        }
        else if ((this.mainRoom.terminal || this.mainRoom.mainContainer) && _.sum(this.creep.carry) > 0) {
            let target = this.mainRoom.terminal || this.mainRoom.mainContainer;
            if (this.transferAny(target) == ERR_NOT_IN_RANGE)
                this.moveTo({ pos: target.pos, range: 1 }, { plainCost: 2, swampCost: 10, roomCallback: Colony.getCustomMatrix({ ignoreKeeperSourceId: this.harvestingSite.id }) });
        }
    }


    protected myTick() {
        
        if (this.state == null || this.state == HarvestingCarrierState.deliver && _.sum(this.creep.carry) == 0) {
            if (this.creep.ticksToLive < 3 * this.harvestingSite.pathLengthToDropOff)
                this.recycle();
            else
                this.state = HarvestingCarrierState.pickup;
        }
        else if (this.state == HarvestingCarrierState.pickup && _.sum(this.creep.carry) == this.creep.carryCapacity || this.creep.ticksToLive < 1.5 * this.harvestingSite.pathLengthToDropOff && _.sum(this.creep.carry) > 0) {
            if (this.creep.ticksToLive < 1.5 * this.harvestingSite.pathLengthToDropOff) {
                this.recycle();
                return;
            }
            else
                this.state = HarvestingCarrierState.deliver;
        }

        if (this.state == HarvestingCarrierState.pickup)
            this.statePickup();
        else
            this.stateDeliver();
    }
}