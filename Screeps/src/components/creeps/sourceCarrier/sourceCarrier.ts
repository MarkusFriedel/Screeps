import {MySource} from "../../sources/mySource";
import {MainRoom} from "../../rooms/mainRoom";

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
        if (!this.mySource.sourceDropOffContainer)
            return;
        if (this.mySource.sourceDropOffContainer.pos.roomName != this.creep.pos.roomName)
            this.creep.moveTo(this.mySource.sourceDropOffContainer);
        else {
            if (this.mySource.sourceDropOffContainer && (<Container|Storage>this.mySource.sourceDropOffContainer).transfer(this.creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.mySource.sourceDropOffContainer);
        }
    }

    deliver() {
        if (this.creep.room.name == this.mainRoom.name) {
            let tower = this.creep.room.find<Tower>(FIND_STRUCTURES, { filter: (x: Tower) => x.structureType == STRUCTURE_TOWER && x.energy < (_.filter(this.mainRoom.links, y => y.nextToTower).length >0 ? 150 : 700) });
            if (tower.length > 0) {
                if (this.creep.transfer(tower[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(tower[0]);
                return;
            }
        }

        let mainContainer = this.mainRoom.mainContainer;
        if (mainContainer != null && mainContainer.store.energy < mainContainer.storeCapacity && this.mainRoom.creepManagers.spawnFillManager.creeps.length > 0) {
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

    public tick() {
        if (this.mySource == null)
            return;
        if (this.creep.carry.energy == 0)
            this.pickUp();
        else
            this.deliver();


    }
}
