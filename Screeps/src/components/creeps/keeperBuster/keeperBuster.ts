/// <reference path="../myCreep.ts" />

class KeeperBuster extends MyCreep {

    public get memory(): KeeperBusterMemory { return this.creep.memory; }

    constructor(public mainRoom: MainRoom, public creep: Creep) {
        super(creep);
    }

    public myTick() {
        if (this.creep.hits < this.creep.hitsMax)
            this.creep.heal(this.creep);

        let keeper = _.sortBy(_.flatten(_.map(this.mainRoom.allRooms, r => _.filter(r.hostileScan.keepers, k => k.hits > 100))), k => k.pos.roomName == this.creep.room.name ? 0 : 1)[0];


        if (keeper)
            if (this.creep.rangedAttack(keeper.creep) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(keeper.creep);
    }
}
