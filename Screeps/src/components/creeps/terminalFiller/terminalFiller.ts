class TerminalFiller {

    private get mainContainer() {
        return this.mainRoom.mainContainer;
    }

    private get terminal() {
        return this.mainRoom.terminal;
    }

    public static staticTracer: Tracer;
    public tracer: Tracer;

    constructor(public creep: Creep, public mainRoom: MainRoomInterface) {
        if (TerminalFiller.staticTracer == null) {
            TerminalFiller.staticTracer = new Tracer('TerminalFiller');
            Colony.tracers.push(TerminalFiller.staticTracer);
        }
        this.tracer = TerminalFiller.staticTracer;
    }

    private saveBeforeDeath() {
        if (this.creep.transfer(this.terminal, _.filter(_.keys(this.creep.carry), r => this.creep.carry[r] > 0)[0]) == ERR_NOT_IN_RANGE)
            this.creep.moveTo(this.terminal);
    }

    private deliverCompounds(publishableCompounds: { [index: string]: string }) {

    }

    private transferCompounds(): boolean {
        let trace = this.tracer.start('transferCompounds()');
        let publishableCompounds = _.indexBy(Colony.reactionManager.publishableCompounds, x => x);

        if (_.sum(this.creep.carry) > this.creep.carry.energy) {
            let dropTrace = this.tracer.start('transferCompounds() - drop');
            for (let resource in this.creep.carry) {
                if (resource == RESOURCE_ENERGY)
                    continue;
                if (publishableCompounds[resource] && (this.mainContainer.store[resource] == null ||  this.mainContainer.store[resource] <= 5000)) {
                    if (this.creep.transfer(this.mainContainer, resource) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(this.mainContainer);
                }
                else {
                    if (this.creep.transfer(this.terminal, resource) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(this.terminal);
                }
                trace.stop();
                dropTrace.stop();
                return true;
            }
            dropTrace.stop();
        }
        else {
            let pickupTrace = this.tracer.start('transferCompounds() - pickup1');
            let resourceToTransfer = _.filter(Colony.reactionManager.publishableCompounds, c => (this.mainContainer.store[c] == null || this.mainContainer.store[c] < 5000) && this.terminal.store[c] > 0)[0];
            if (resourceToTransfer) {
                if (this.creep.withdraw(this.terminal, resourceToTransfer) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(this.terminal);
                trace.stop();
                pickupTrace.stop();
                return true;
            }
            pickupTrace.stop();
            pickupTrace = this.tracer.start('transferCompounds() - pickup2');
            resourceToTransfer = null;
            for (let resource in this.mainContainer.store) {
                if (resource == RESOURCE_ENERGY)
                    continue;
                if (!publishableCompounds[resource] && this.mainContainer.store[resource] > 0 || this.mainContainer.store[resource] > 5000 + this.creep.carryCapacity) {
                    if (this.creep.withdraw(this.mainContainer, resource) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(this.mainContainer);
                    trace.stop();
                    pickupTrace.stop();
                    return true;
                }
            }
            pickupTrace.stop();
        }
        trace.stop();
        return false;
    }

    private transferEnergy(): boolean {
        let trace = this.tracer.start('transferEnergy()');
        let pickUpStruct: Terminal | Container | Storage = null;
        let dropOffStruct: Terminal | Container | Storage = null;

        if (this.terminal.store.energy < 24000 && this.mainContainer.store.energy > this.mainRoom.maxSpawnEnergy * 2) {
            pickUpStruct = this.mainContainer;
            dropOffStruct = this.terminal;
        }
        else if (this.terminal.store.energy > 26000) {
            pickUpStruct = this.terminal;
            dropOffStruct = this.mainContainer;
        }

        if (pickUpStruct && dropOffStruct) {
            if (this.creep.carry.energy == 0) {
                if (this.creep.withdraw(pickUpStruct, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(pickUpStruct);
            }
            else {
                if (this.creep.transfer(dropOffStruct, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(dropOffStruct);
            }
            trace.stop();
            return true;
        }
        else {
            trace.stop();
            return false;
        }
    }

    public tick() {
        let trace = this.tracer.start('tick()');
        let store = this.mainRoom.mainContainer;
        let terminal = this.mainRoom.room.terminal;

        if (this.creep.ticksToLive <= 20 && _.sum(this.creep.carry) > 0) {
            this.saveBeforeDeath();
        }
        else {
            if (this.creep.carry.energy > 0)
                this.transferEnergy();
            else if (_.sum(this.creep.carry) > 0)
                this.transferCompounds();
            else {
                this.transferEnergy() || this.transferCompounds();
            }
        }
        trace.stop();



    }
}