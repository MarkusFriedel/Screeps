class MineralCarrier {
    public get memory(): MineralCarrierMemory { return this.creep.memory; }

    constructor(public creep: Creep, public mainRoom: MainRoomInterface) {

    }

    public tick() {
        if(!this.mainRoom.extractorContainer || !this.mainRoom.terminal)
            return;

        if (_.sum(<any>this.creep.carry) < this.creep.carryCapacity) {
            if (this.mainRoom.extractorContainer.transfer(this.creep, this.mainRoom.mineral.mineralType) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.mainRoom.extractorContainer);
        }
        else {
            if (this.creep.transfer(this.mainRoom.terminal, this.mainRoom.mineral.mineralType) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.mainRoom.terminal);
        }
    }
}