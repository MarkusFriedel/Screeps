/// <reference path="../creeps/terminalFiller/terminalFillerDefinition.ts" />
/// <reference path="../creeps/terminalFiller/terminalFiller.ts" />

class TerminalManager implements TerminalManagerInterface {

    public get memory(): TerminalManagerMemory {
        return this.accessMemory();
    }

    accessMemory() {
        if (this.mainRoom.memory.terminalManager == null)
            this.mainRoom.memory.terminalManager = {
                tradeAgreements: [],
                transactionCheckTime: -1
            }
        return this.mainRoom.memory.terminalManager;
    }

    _creeps: { time: number, creeps: Array<Creep> } = { time: 0, creeps: null };
    public get creeps(): Array<Creep> {
        if (this._creeps.time < Game.time)
            this._creeps = {
                time: Game.time, creeps: this.mainRoom.creepsByRole('terminalManager')
            };
        return this._creeps.creeps;
    }

    maxCreeps = 1;

  

    constructor(public mainRoom: MainRoom) {
        this.preTick = profiler.registerFN(this.preTick, 'TerminalManager.preTick');
        this.tick = profiler.registerFN(this.tick, 'TerminalManager.tick');
    }

    public preTick() {
        if (!this.mainRoom.room || !this.mainRoom.mainContainer || !this.mainRoom.room.terminal || !this.mainRoom.room.terminal.isActive() || this.mainRoom.spawnManager.isBusy)
            return;
        if (this.creeps.length == 0) {
            this.mainRoom.spawnManager.addToQueue(TerminalFillerDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'terminalManager' }, this.maxCreeps - this.creeps.length);
        }
    }

    public tick() {
        if (!this.mainRoom.room || !this.mainRoom.mainContainer || !this.mainRoom.room.terminal || !this.mainRoom.room.terminal.isActive()) {
            return;
        }
        _.forEach(this.creeps, x => new TerminalFiller(x, this.mainRoom).tick());
        this.handleTerminal(this.mainRoom.room.terminal);
    }

    handleTradeAgreements(terminal: Terminal) {

        let incomingTransactions = _.filter(Game.market.incomingTransactions, transaction => transaction.time >= this.memory.transactionCheckTime && transaction.to == this.mainRoom.name);

        _.forEach(incomingTransactions, transaction => {
            let tradeAgreements = _.filter(this.memory.tradeAgreements, ta => ta.partnerName == transaction.sender.username && ta.receivingResource == transaction.resourceType && Game.map.getRoomLinearDistance(this.mainRoom.room.name, transaction.from) <= ta.maxDistance);
            _.forEach(tradeAgreements, tradeAgreement => {
                tradeAgreement.openPaymentResource += transaction.amount * tradeAgreement.paymentFactor;
                if (tradeAgreement.returnTax) {
                    tradeAgreement.openPaymentTax += 0.1 * transaction.amount * Math.min(Game.map.getRoomLinearDistance(this.mainRoom.room.name, transaction.from), tradeAgreement.maxDistance);
                }
            });
        });


        let outgoingTransactions = _.filter(Game.market.outgoingTransactions, transaction => transaction.time >= this.memory.transactionCheckTime && transaction.from == this.mainRoom.name && (transaction.description == "Payment Tax" || transaction.description == "Payment Resource"));
        _.forEach(outgoingTransactions, transaction => {
            let tradeAgreement = _.filter(this.memory.tradeAgreements, ta => (transaction.description == 'Payment Tax' && ta.openPaymentTax >= transaction.amount || transaction.description == 'Payment Resource' && ta.openPaymentResource >= transaction.amount && ta.paymentResource == transaction.resourceType) && ta.partnerName == transaction.recipient.username && ta.paymentRoomName == transaction.to)[0];

            if (tradeAgreement) {
                if (transaction.description == 'Payment Tax')
                    tradeAgreement.openPaymentTax -= transaction.amount;
                else if (transaction.description == 'Payment Resource')
                    tradeAgreement.openPaymentResource -= transaction.amount;
            }

        });

        this.memory.transactionCheckTime = Game.time;

        if (this.resourceSentOn < Game.time) {

            let openPayment = _.filter(this.memory.tradeAgreements, tradeAgreement => tradeAgreement.openPaymentResource >= 10 && terminal.store[tradeAgreement.paymentResource] >= 1000 || tradeAgreement.openPaymentTax >= 10)[0];

            if (openPayment) {
                if (openPayment.openPaymentTax) {
                    let maxAmount = ~~(terminal.store.energy / (1 + 0.1 * Game.map.getRoomLinearDistance(this.mainRoom.room.name, openPayment.paymentRoomName)));
                    let amount = Math.min(maxAmount, openPayment.openPaymentTax);
                    this.send(RESOURCE_ENERGY, amount, openPayment.paymentRoomName, 'Payment Tax');
                }
                else if (openPayment.openPaymentResource) {
                    let maxAmount = Math.min(terminal.store[openPayment.paymentResource], ~~(terminal.store.energy * (0.1 * Game.map.getRoomLinearDistance(this.mainRoom.room.name, openPayment.paymentRoomName))));
                    let amount = Math.min(maxAmount, openPayment.openPaymentResource);
                    this.send(openPayment.paymentResource, amount, openPayment.paymentRoomName, 'Payment Resource');
                }
            }
        }
    }

    handleEnergyBalance(terminal: Terminal) {
        //if ((this.resourceSentOn == null || this.resourceSentOn < Game.time) && this.mainRoom.mainContainer.store.energy > 450000 && terminal.store.energy > 1000) {
        //    let targetMainRoom = _.sortByAll(_.filter(Colony.mainRooms, x => x.mainContainer && x.room && x.room.terminal && x.room.terminal.isActive() && x.mainContainer.store.energy < 350000 && Game.map.getRoomLinearDistance(this.mainRoom.name, x.name) <= 3), [x => Game.map.getRoomLinearDistance(this.mainRoom.name, x.name), x => x.mainContainer.store.energy])[0];
        //    if (targetMainRoom) {

        //        let amountToTransfer = Math.min(this.mainRoom.mainContainer.store.energy - 400000, 400000 - targetMainRoom.mainContainer.store.energy, terminal.store.energy, targetMainRoom.room.terminal.storeCapacity - targetMainRoom.room.terminal.store.energy);

        //        let distance = Game.map.getRoomLinearDistance(this.mainRoom.name, targetMainRoom.name);

        //        let tax = Math.ceil(0.1 * amountToTransfer * distance);

        //        amountToTransfer -= tax;

        //        console.log('Terminal send ' + amountToTransfer + '  from ' + this.mainRoom.name + ' to ' + targetMainRoom.name + ': ' + terminal.send(RESOURCE_ENERGY, amountToTransfer, targetMainRoom.name));

        //    }
        //}
        if ((this.resourceSentOn == null || this.resourceSentOn < Game.time) && this.mainRoom.mainContainer.store.energy + terminal.store.energy < 50000) {
            let amount = 10000;
            let supplierRoom = _.sortBy(_.filter(Colony.mainRooms, x => x.terminal && x.managers.terminalManager && (x.managers.terminalManager.resourceSentOn == null || x.managers.terminalManager.resourceSentOn < Game.time) && x.terminal.store.energy > amount && x.mainContainer && x.mainContainer.store.energy > 100000), x => Game.map.getRoomLinearDistance(x.name, this.mainRoom.name))[0];
            if (supplierRoom) {
                let distance = Game.map.getRoomLinearDistance(this.mainRoom.name, supplierRoom.name);

                let tax = Math.ceil(0.1 * amount * distance);

                amount -= tax;
                supplierRoom.managers.terminalManager.send(RESOURCE_ENERGY, amount, this.mainRoom.name);
            }
        }
    }

    handleMineralBalance(terminal: Terminal) {
        _.forEach(_.filter(_.uniq(Colony.reactionManager.highestPowerCompounds.concat(this.mainRoom.managers.labManager.imports)), x => x != RESOURCE_ENERGY && this.mainRoom.getResourceAmount(x) <= 5000), resource => {
            if (this.mainRoom.mainContainer && this.mainRoom.mainContainer.structureType == STRUCTURE_STORAGE && _.size(this.mainRoom.managers.labManager.myLabs) > 0) {
  
                let requiredAmount = 5000 - this.mainRoom.getResourceAmount(resource);
                if (requiredAmount > 0) {


                    let sender = _.sortBy(_.filter(Colony.mainRooms, mainRoom => mainRoom.name != this.mainRoom.name && mainRoom.terminal && mainRoom.terminal.store[resource] > 0 && (mainRoom.managers.terminalManager.resourceSentOn == null || mainRoom.managers.terminalManager.resourceSentOn < Game.time) && mainRoom.getResourceAmount(resource) > ((Colony.reactionManager.highestPowerCompounds.indexOf(resource) >= 0 || mainRoom.managers.labManager && mainRoom.managers.labManager.imports.indexOf(resource) >= 0) ? 5000 : 0)), x => Game.map.getRoomLinearDistance(this.mainRoom.name, x.name))[0];



                    if (sender) {
                        let possibleAmount = sender.getResourceAmount(resource) - ((Colony.reactionManager.highestPowerCompounds.indexOf(resource) >= 0 || sender.managers.labManager && sender.managers.labManager.imports.indexOf(resource) >= 0) ? 5000 : 0);
                        let amountInForeignTerminal = sender.terminal.store[resource] != null ? sender.terminal.store[resource] : 0;
                        let amount = Math.min(requiredAmount, possibleAmount, amountInForeignTerminal);
                        if (amount > 0) {
                            sender.managers.terminalManager.send(resource, amount, this.mainRoom.name);
                        }
                    }
                }
            }
        });
    }

    send(resource: string, amount: number, destination: string, description?: string) {
        if ((this.resourceSentOn == null || this.resourceSentOn < Game.time) && this.mainRoom.terminal) {
            let result = this.mainRoom.terminal.send(resource, amount, destination, description) == OK
            if (OK)
                this.resourceSentOn = Game.time;
            return result;
        }
    }

    public resourceSentOn: number;


    handleTerminal(terminal: Terminal) {
        //this.handleTradeAgreements(this.mainRoom.room.terminal);
        if (Game.time % 15 == 0 && Game.time % 30 != 0)
            this.handleEnergyBalance(terminal);
        if (Game.time % 30 == 0)
            this.handleMineralBalance(terminal);
    }

}