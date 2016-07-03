import {MySource} from "../../sources/mySource";
import {MainRoom} from "../../rooms/mainRoom";
import {Colony}from "../../../colony/colony";

export class SourceCarrier {
    public get memory(): SourceCarrierMemory { return this.creep.memory; }

    _source: { time: number, source: Source } = { time: 0, source: null };
    public get source(): Source {
        if (this._source.time < Game.time)
            this._source = {
                time: Game.time, source: Game.getObjectById<Source>(this.memory.sourceId)
            };
        return this._source.source;
    }

    _mySource: { time: number, mySource: MySource } = { time: 0, mySource: null };
    public get mySource(): MySource {
        if (this._mySource.time < Game.time)
            this._mySource = {
                time: Game.time, mySource: this.mainRoom.sources[this.memory.sourceId]
            };
        return this._mySource.mySource;
    }


    constructor(public creep: Creep, public mainRoom: MainRoom) {
    }

    pickUp() {
        if (this.mySource == null) {
            this.creep.say('NoMySource');
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
        if (!this.mySource.sourceDropOffContainer)
            return;

        let energy = this.creep.pos.findInRange<Resource>(FIND_DROPPED_RESOURCES, 4)[0];
        if (energy != null) {
            if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(energy);
        }
        else {

            if (this.mySource.sourceDropOffContainer.pos.roomName != this.creep.pos.roomName)
                this.creep.moveTo(this.mySource.sourceDropOffContainer, { reusePath: 20 });
            else {
                if (this.mySource.sourceDropOffContainer && (<Container | Storage>this.mySource.sourceDropOffContainer).transfer(this.creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(this.mySource.sourceDropOffContainer);
            }
        }
    }

    deliver() {
        if (this.creep.room.name == this.mainRoom.name) {
            let tower = this.creep.room.find<Tower>(FIND_STRUCTURES, { filter: (x: Tower) => x.structureType == STRUCTURE_TOWER && x.energy < (_.filter(this.mainRoom.links, y => y.nextToTower).length > 0 ? 150 : 700) });
            if (tower.length > 0) {
                if (this.creep.transfer(tower[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(tower[0]);
                return;
            }
        }
        let energy = null;
        if (Game.time % 5 == 0)
            energy = this.creep.pos.findInRange<Resource>(FIND_DROPPED_RESOURCES, 3)[0];

        if (energy != null && this.creep.carry.energy < this.creep.carryCapacity) {
            if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(energy);
        }
        else {

            let mainContainer = this.mainRoom.mainContainer;
            if (mainContainer != null && mainContainer.store.energy < mainContainer.storeCapacity && this.mainRoom.creepManagers.spawnFillManager.creeps.length > 0) {

                if (this.creep.room.name != mainContainer.room.name)
                    this.creep.moveTo(mainContainer, { reusePath: 20 });

                if (this.creep.transfer(mainContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(mainContainer);
            }
            else {
                if (this.creep.room.name != this.mainRoom.name)
                    this.creep.moveTo(this.mainRoom.mainPosition);
                else {

                    var target = this.creep.pos.findClosestByPath<Spawn | Extension>(FIND_MY_STRUCTURES, { filter: (s: Spawn | Extension) => (s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_EXTENSION) && s.energy < s.energyCapacity });
                    if (this.creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(target);
                }
            }
        }
    }

    public tick() {
        if (this.creep.carry.energy < this.creep.carryCapacity && !(this.creep.carry.energy > this.creep.carryCapacity / 2 && this.creep.room.name == this.mainRoom.name))
            this.pickUp();
        else
            this.deliver();


    }
}
