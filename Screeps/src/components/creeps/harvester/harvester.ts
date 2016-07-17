/// <reference path="../../../colony/colony.ts" />


class Harvester {
    public get memory(): HarvesterMemory { return this.creep.memory; }

    _source: { time: number, source: Source } = { time: -1, source: null };
    public get source(): Source {
        if (this._source.time < Game.time)
            this._source = {
                time: Game.time, source: Game.getObjectById<Source>(this.memory.sourceId)
            };
        return this._source.source;
    }

    _mySource: { time: number, mySource: MySourceInterface } = { time: -1, mySource: null };
    public get mySource(): MySourceInterface {
        if (this._mySource.time < Game.time)
            this._mySource = {
                time: Game.time, mySource: this.mainRoom.sources[this.memory.sourceId]
            };
        return this._mySource.mySource;
    }

    constructor(public creep: Creep, public mainRoom: MainRoomInterface) {
    }


    deliver(dontMove: boolean = false) {
        if (this.mySource == null)
            return;
        if (this.mySource.dropOffStructure == null)
            return;
        if (this.creep.room.name == this.mySource.dropOffStructure.pos.roomName) {
            if (this.creep.transfer(<Structure>this.mySource.dropOffStructure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE && !dontMove)
                this.creep.moveTo(this.mySource.dropOffStructure);
        }
        else
            this.creep.moveTo(this.mySource.dropOffStructure);
    }

    harvest() {
        if (this.mySource == null) {
            let myRoom = _.filter(Colony.rooms, x => _.any(x.mySources, y => y.id == this.memory.sourceId))[0];
            if (myRoom != null && myRoom.mainRoom != null) {
                this.mainRoom = myRoom.mainRoom;
                this.memory.mainRoomName = this.mainRoom.name;
                this._mySource.time = -1;
            }
            else {
                this.creep.say('NoMySource');
                this.creep.suicide();
                return;
            }
        }
        if (this.source == null) {
            this.creep.moveTo(this.mySource);
        }
        else {
            if (this.creep.harvest(this.source) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.source);
            else if (!this.mySource.nearByConstructionSite && !this.shouldRepair() && Game.time % 10 == 0 && (this.mySource.dropOffStructure && this.mySource.dropOffStructure.pos.getRangeTo(this.creep.pos) < 4 || this.creep.carry.energy == this.creep.carryCapacity))
                this.deliver(true);
        }

    }

    construct() {
        if (!this.mySource.nearByConstructionSite)
            return;

        if (this.creep.build(this.mySource.nearByConstructionSite) == ERR_NOT_IN_RANGE)
            this.creep.moveTo(this.mySource.nearByConstructionSite);
    }

    repair() {
        let target = <Structure>this.mySource.sourceDropOffContainer;
        if (target == null)
            return;

        if (this.creep.repair(target) != OK)
            this.memory.state == HarvesterState.Delivering;
    }

    shouldRepair() {
        return this.mySource.dropOffStructure && this.mySource.dropOffStructure.pos.inRangeTo(this.creep.pos, 4) && (<Structure>this.mySource.dropOffStructure).hits < (<Structure>this.mySource.dropOffStructure).hitsMax;
    }

    public tick() {


        if (this.memory.state == null || this.creep.memory.state == 'harvesting')
            this.memory.state = HarvesterState.Harvesting;
        if (this.creep.memory.state == 'delivering')
            this.memory.state = HarvesterState.Delivering;

        if (this.memory.state == HarvesterState.Harvesting && this.creep.carry.energy < this.creep.carryCapacity)
            this.harvest();

        else if (this.memory.state == HarvesterState.Harvesting && this.creep.carry.energy == this.creep.carryCapacity) {
            if (this.shouldRepair)
                this.memory.state = HarvesterState.Repairing;
            else
                this.memory.state = HarvesterState.Delivering;
        }
        else if (this.memory.state == HarvesterState.Repairing && (this.creep.carry.energy ==0 || !this.mySource.sourceDropOffContainer || (<Structure>this.mySource.sourceDropOffContainer).hits == (<Structure>this.mySource.sourceDropOffContainer).hitsMax))
            this.memory.state = HarvesterState.Delivering;

        if (this.memory.state == HarvesterState.Delivering && this.creep.carry.energy > 0) {
            if (this.source && this.mySource.nearByConstructionSite && this.creep.pos.getRangeTo(this.mySource.nearByConstructionSite)<=4 && this.mainRoom.mainContainer && this.mainRoom.mainContainer.store.energy >= this.mainRoom.maxSpawnEnergy)
                this.construct();
            else
                this.deliver();
        }
        else if (this.memory.state == HarvesterState.Repairing)
            this.repair();
        else if (this.memory.state == HarvesterState.Delivering && this.creep.carry.energy == 0)
            this.memory.state = HarvesterState.Harvesting;

    }
}