/// <reference path="../myCreep.ts" />

class KeeperBuster extends MyCreep {

    public get memory(): KeeperBusterMemory { return this.creep.memory; }

    constructor(public mainRoom: MainRoom, public creep: Creep) {
        super(creep);
    }

    public myTick() {
        if (this.creep.hits < this.creep.hitsMax)
            this.creep.heal(this.creep);

        if (this.memory.roomName != this.creep.room.name) {
            this.creep.moveTo(new RoomPosition(25, 25, this.memory.roomName));
            return;
        }

        if (this.memory.targetId != null) {
            var keeper = Game.getObjectById<Creep>(this.memory.targetId);
            if (keeper == null || keeper.hits<=100)
                this.memory.targetId = null;
        }
        if (keeper == null) {
            let keepers = _.filter(this.myRoom.hostileScan.creeps, c => c.owner == 'Invader');
            if (keepers.length == 0)
                keepers = _.map(this.myRoom.hostileScan.keepers, x => x);
            let keeperInfo = _.sortBy(keepers, x => this.creep.pos.findPathTo(x.pos).length)[0];
            if (keeperInfo) {
                keeper = keeperInfo.creep;
                this.memory.targetId = keeperInfo.id;
            }
        }
        if (keeper) {
            if (this.creep.rangedAttack(keeper) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(keeper);
        }

        else {
            let keepers = _.map(this.myRoom.hostileScan.keepers, k => k.creep);
            let keeperCreep = _.filter(keepers, k => k.ticksToLive > 200 && _.any(keepers, k2 => k2.ticksToLive > 200 && k2 != k && k.ticksToLive > k2.ticksToLive - 100 && k.ticksToLive < k2.ticksToLive + 100))[0];
            if (keeperCreep) {
                let closestByTime = _.sortBy(_.filter(keepers, k => k != keeperCreep), k => Math.abs(keeperCreep.ticksToLive - k.ticksToLive))[0];
                if (!this.creep.pos.inRangeTo(keeperCreep.pos, 3))
                    this.creep.moveTo(keeperCreep);
                this.creep.say('WAIT');
                if (closestByTime.ticksToLive == 200)
                    this.creep.rangedAttack(keeperCreep);
            }

            else if (_.size(this.myRoom.hostileScan.creeps) > 0) {
                let creep = _.sortBy(_.map(this.myRoom.hostileScan.creeps, x => x.creep), x => (x.pos.x - this.creep.pos.x) ** 2 + (x.pos.y - this.creep.pos.y) ** 2)[0];
                if (this.creep.rangedAttack(creep) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(creep);
            }
            else {
                let nextKeeperLair = _.sortBy(this.myRoom.room.find<KeeperLair>(FIND_HOSTILE_STRUCTURES, {
                    filter: (x: Structure) => x.structureType == STRUCTURE_KEEPER_LAIR
                }), lair => lair.ticksToSpawn)[0];
                if (nextKeeperLair && !this.creep.pos.inRangeTo(nextKeeperLair.pos, 3)) {
                    this.creep.moveTo(nextKeeperLair);
                }
            }
        }

    }
}
