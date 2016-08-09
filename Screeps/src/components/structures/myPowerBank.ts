class MyPowerBank implements MyPowerBankInterface {
    public get memory(): MyPowerBankMemory {
        return this.accessMemory();
    }

    accessMemory() {
        if (this.mainRoom.memory.powerBanks == null)
            this.mainRoom.memory.powerBanks = {};
        if (this.mainRoom.memory.powerBanks[this.id] == null && Game.getObjectById(this.id)) {
            let powerBank = Game.getObjectById<PowerBank>(this.id);
            this.mainRoom.memory.powerBanks[this.id] = { id: this.id, pos: powerBank.pos, decaysAt: powerBank.ticksToDecay + Game.time, power: powerBank.power }
        }
        return this.mainRoom.memory.powerBanks[this.id];
    }

    constructor(public id: string, public mainRoom: MainRoomInterface) {

    }

}