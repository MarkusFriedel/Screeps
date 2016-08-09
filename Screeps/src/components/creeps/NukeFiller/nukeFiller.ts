/// <reference path="../myCreep.ts" />
class NukeFiller extends MyCreep<CreepMemory> {

    public get nuker() {
        return this.mainRoom.nuker;
    }

    constructor(public name: string, public mainRoom: MainRoomInterface) {
        super(name);
    }

    public myTick() {
        this.creep.say('Nuker');

        if (this.mainRoom.managers.nukeManager.isReady || this.creep.ticksToLive < 50 || this.mainRoom.mainContainer == null || this.nuker==null)
            this.recycle();

        else if (this.creep.carry.energy > 0) {
            let target = (this.nuker.energy < this.nuker.energyCapacity) ? this.nuker : this.mainRoom.mainContainer;

            if (this.creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(target);
        }
        else if (this.creep.carry[RESOURCE_GHODIUM] > 0) {
            let target = (this.nuker.ghodium < this.nuker.ghodiumCapacity) ? this.nuker : this.mainRoom.mainContainer;

            if (this.creep.transfer(target, RESOURCE_GHODIUM) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(target);
        }
        else if (_.sum(this.creep.carry) > 0) {
            if (this.creep.transfer(this.mainRoom.mainContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                this.moveTo({ pos: this.mainRoom.mainContainer.pos, range: 1 });
        }
        else if (this.nuker.energy < this.nuker.energyCapacity && this.mainRoom.mainContainer.store.energy>50000) {
            if (this.creep.withdraw(this.mainRoom.mainContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.mainRoom.mainContainer);
        }
        else if (this.nuker.ghodium < this.nuker.ghodiumCapacity) {
            if (this.creep.withdraw(this.mainRoom.mainContainer, RESOURCE_GHODIUM) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.mainRoom.mainContainer.pos);
        }
    }

}
