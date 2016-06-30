import {MySource} from "../../sources/mySource";
import {MainRoom} from "../../rooms/mainRoom";
import {Colony}from "../../../colony/colony";

export enum HarvesterState {
    Harvesting,
    Delivering
}

export class Harvester {
    public get memory(): HarvesterMemory { return this.creep.memory; }

    _source: { time: number, source: Source } = { time: -1, source: null };
    public get source(): Source {
        if (this._source.time < Game.time)
            this._source = {
                time: Game.time, source: Game.getObjectById<Source>(this.memory.sourceId)
            };
        return this._source.source;
    }

    _mySource: { time: number, mySource: MySource } = { time: -1, mySource: null };
    public get mySource(): MySource {
        if (this._mySource.time < Game.time)
            this._mySource = {
                time: Game.time, mySource: this.mainRoom.sources[this.memory.sourceId]
            };
        return this._mySource.mySource;
    }

    constructor(public creep: Creep, public mainRoom: MainRoom) {
    }


    deliver(dontMove: boolean = false) {

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
        
        if (this.source == null) {
            this.creep.moveTo(this.mySource);
        }
        else {
            if (this.creep.harvest(this.source) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.source);
            else if (!this.mySource.nearByConstructionSite)
                this.deliver(true);
        }

    }

    construct() {
        if (!this.mySource.nearByConstructionSite)
            return;

        if (this.creep.build(this.mySource.nearByConstructionSite) == ERR_NOT_IN_RANGE)
            this.creep.moveTo(this.mySource.nearByConstructionSite);
    }

    public tick() {
        if (this.mySource == null) {
            this.creep.say('NoMySource');
            return;
        }

        if (this.memory.state == null)
            this.memory.state = HarvesterState.Harvesting;
        if (this.memory.state == HarvesterState.Harvesting && this.creep.carry.energy < this.creep.carryCapacity)
            this.harvest();
        else if (this.memory.state == HarvesterState.Harvesting && this.creep.carry.energy == this.creep.carryCapacity)
            this.memory.state = HarvesterState.Delivering;

        if (this.memory.state == HarvesterState.Delivering && this.creep.carry.energy > 0) {
            if (this.source && this.mySource.nearByConstructionSite && this.mainRoom.mainContainer)
                this.construct();
            else
                this.deliver();
        }
        else if (this.memory.state == HarvesterState.Delivering && this.creep.carry.energy == 0)
            this.memory.state = HarvesterState.Harvesting;

    }
}