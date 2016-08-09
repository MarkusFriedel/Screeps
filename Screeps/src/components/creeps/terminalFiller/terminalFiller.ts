/// <reference path="../myCreep.ts" />


class TerminalFiller extends MyCreep<TerminalFillerMemory> {

    private get mainContainer() {
        return this.mainRoom.mainContainer;
    }

    private get terminal() {
        return this.mainRoom.terminal;
    }



    constructor(public name: string, public mainRoom: MainRoomInterface) {
        super(name);
        if (myMemory['profilerActive']) {
            this.myTick = profiler.registerFN(this.myTick, 'TerminalFiller.tick');
        }
    }

    private saveBeforeDeath() {
        if (this.creep.transfer(this.terminal, _.filter(_.keys(this.creep.carry), r => this.creep.carry[r] > 0)[0]) == ERR_NOT_IN_RANGE)
            this.creep.moveTo(this.terminal);
    }

    private deliverCompounds(publishableCompounds: { [index: string]: string }) {

    }

    private transferCompounds(): boolean {
        let compounds = Colony.reactionManager.publishableCompounds;
        if (this.mainRoom.nuker)
            compounds.push(RESOURCE_GHODIUM);
        let publishableCompounds = _.indexBy(compounds, x => x);
        
            

        if (_.sum(this.creep.carry) > this.creep.carry.energy) {
            for (let resource in this.creep.carry) {
                if (resource == RESOURCE_ENERGY)
                    continue;
                if (publishableCompounds[resource] && (this.mainContainer.store[resource] == null || this.mainContainer.store[resource] <= 5000)) {
                    if (this.creep.transfer(this.mainContainer, resource) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(this.mainContainer);
                }
                else {
                    if (this.creep.transfer(this.terminal, resource) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(this.terminal);
                }
                return true;
            }
        }
        else {
            let resourceToTransfer = _.filter(Colony.reactionManager.publishableCompounds, c => (this.mainContainer.store[c] == null || this.mainContainer.store[c] < 5000) && this.terminal.store[c] > 0)[0];
            if (resourceToTransfer) {
                if (this.creep.withdraw(this.terminal, resourceToTransfer) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(this.terminal);
                return true;
            }
            resourceToTransfer = null;
            for (let resource in this.mainContainer.store) {
                if (resource == RESOURCE_ENERGY)
                    continue;
                if (!publishableCompounds[resource] && this.mainContainer.store[resource] > 0 || this.mainContainer.store[resource] > 5000 + this.creep.carryCapacity) {
                    if (this.creep.withdraw(this.mainContainer, resource) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(this.mainContainer);
                    return true;
                }
            }
        }
        return false;
    }

    private transferEnergy(): boolean {
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
            return true;
        }
        else {
            return false;
        }
    }

    public myTick() {
        let store = this.mainRoom.mainContainer;
        let terminal = this.mainRoom.room.terminal;

        if (this.creep.ticksToLive <= 20 && _.sum(this.creep.carry) > 0) {
            this.saveBeforeDeath();
        }

        else if (_.sum(this.creep.carry) < this.creep.carryCapacity && _.filter(this.mainRoom.myRoom.resourceDrops, x => x.resourceType == RESOURCE_ENERGY && x.pos.inRangeTo(this.mainRoom.mainContainer.pos, 10)).length>0) {
            let energy = _.filter(this.mainRoom.myRoom.resourceDrops, x => x.resourceType == RESOURCE_ENERGY && x.pos.inRangeTo(this.mainRoom.mainContainer.pos, 10))[0];
            if (energy) {
                if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(energy);

            }
        }

        else if (this.memory.idleUntil == null || this.memory.idleUntil <= Game.time) {
            if (this.creep.carry.energy > 0)
                this.transferEnergy();
            else if (_.sum(this.creep.carry) > 0)
                this.transferCompounds();
            else {
                if (!(this.transferEnergy() || this.transferCompounds())) {
                    this.memory.idleUntil = Game.time + 20;
                }
            }

        }



    }
}