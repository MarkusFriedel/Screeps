class MineralHarvester {
    public get memory(): MineralHarvesterMemory { return this.creep.memory; }

    constructor(public creep: Creep, public mainRoom: MainRoomInterface) {

    }

    public tick() {
        if (!this.mainRoom.extractor || !this.mainRoom.extractorContainer)
            return;
        if (this.creep.harvest(this.mainRoom.mineral) == ERR_NOT_IN_RANGE)
            this.creep.moveTo(this.mainRoom.extractorContainer);
        if (Game.time % 20 == 0) {
            if (this.creep.transfer(this.mainRoom.extractorContainer, this.mainRoom.mineral.mineralType) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.mainRoom.extractorContainer);
        }
    }
}