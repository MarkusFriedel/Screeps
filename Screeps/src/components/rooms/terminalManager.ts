/// <reference path="../creeps/terminalFiller/terminalFillerDefinition.ts" />

class TerminalManager implements TerminalManagerInterface {

    _creeps: { time: number, creeps: Array<Creep> } = { time: 0, creeps: null };
    public get creeps(): Array<Creep> {
        if (this._creeps.time < Game.time)
            this._creeps = {
                time: Game.time, creeps: _.filter(this.mainRoom.creeps, (c) => c.memory.role == 'terminalManager')
            };
        return this._creeps.creeps;
    }

    maxCreeps = 1;

    constructor(public mainRoom: MainRoom) {

    }

    public checkCreeps() {
        if (!this.mainRoom.room || !this.mainRoom.mainContainer || !this.mainRoom.room.terminal || !this.mainRoom.room.terminal.isActive() || this.mainRoom.spawnManager.isBusy)
            return;
        if (this.mainRoom.room.terminal.store.energy < 24000 || this.mainRoom.room.terminal.store.energy > 40000 && this.creeps.length == 0) {
            this.mainRoom.spawnManager.addToQueue(TerminalFillerDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'terminalManager' }, this.maxCreeps - this.creeps.length);
        }
    }

    public tick() {
        if (!this.mainRoom.room || !this.mainRoom.mainContainer || !this.mainRoom.room.terminal || !this.mainRoom.room.terminal.isActive())
            return;
        _.forEach(this.creeps, x => this.handleCreep(x));
        this.handleTerminal(this.mainRoom.room.terminal);
    }

    handleTerminal(terminal: Terminal) {
        if (this.mainRoom.mainContainer.store.energy > 450000 && terminal.store.energy > 1000) {
            let targetMainRoom = _.sortByAll(_.filter(Colony.mainRooms, x => x.mainContainer && x.room && x.room.terminal && x.room.terminal.isActive() && x.mainContainer.store.energy < 350000 && Game.map.getRoomLinearDistance(this.mainRoom.name, x.name) <= 3), [x => Game.map.getRoomLinearDistance(this.mainRoom.name, x.name), x => x.mainContainer.store.energy])[0];
            if (targetMainRoom) {

                let amountToTransfer = Math.min(this.mainRoom.mainContainer.store.energy - 400000, 400000 - targetMainRoom.mainContainer.store.energy, terminal.store.energy, targetMainRoom.room.terminal.storeCapacity - targetMainRoom.room.terminal.store.energy);

                let distance = Game.map.getRoomLinearDistance(this.mainRoom.name, targetMainRoom.name);

                let tax = Math.ceil(0.1 * amountToTransfer * distance);

                amountToTransfer -= tax;

                console.log('Terminal send ' + amountToTransfer + '  from ' + this.mainRoom.name + ' to ' + targetMainRoom.name + ': ' + terminal.send(RESOURCE_ENERGY, amountToTransfer, targetMainRoom.name));

            }
        }
        else if (this.mainRoom.mainContainer.store.energy + terminal.store.energy < 50000) {
            let amount = 10000;
            let supplierRoom = _.sortBy(_.filter(Colony.mainRooms, x => x.terminal && x.terminal.store.energy > amount && x.mainContainer && x.mainContainer.store.energy > 200000), x => x.myRoom.memory.mainRoomDistanceDescriptions[this.mainRoom.name].distance)[0];
            if (supplierRoom) {
                let distance = Game.map.getRoomLinearDistance(this.mainRoom.name, supplierRoom.name);

                let tax = Math.ceil(0.1 * amount * distance);

                amount -= tax;
                supplierRoom.terminal.send(RESOURCE_ENERGY, amount, this.mainRoom.name);
            }
        }
    }

    handleCreep(creep: Creep) {
        let store = this.mainRoom.mainContainer;
        let terminal = this.mainRoom.room.terminal;

        if (creep.ticksToLive <= 10) {
            if (creep.transfer(store, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                creep.moveTo(store);
        }
        else {
            let pickUpStruct: Terminal | Container | Storage = null;
            let dropOffStruct: Terminal | Container | Storage = null;

            if (terminal.store.energy < 24000 && store.store.energy > this.mainRoom.maxSpawnEnergy * 2) {
                pickUpStruct = store;
                dropOffStruct = terminal;
            }
            else if (terminal.store.energy > 26000) {
                pickUpStruct = terminal;
                dropOffStruct = store;
            }

            if (pickUpStruct && dropOffStruct) {
                if (creep.carry.energy == 0) {
                    if (pickUpStruct.transfer(creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                        creep.moveTo(pickUpStruct);
                }
                else {
                    if (creep.transfer(dropOffStruct, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                        creep.moveTo(dropOffStruct);
                }
            }
        }


    }

}