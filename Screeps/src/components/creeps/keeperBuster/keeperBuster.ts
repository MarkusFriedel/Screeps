/// <reference path="../myCreep.ts" />

class KeeperBuster extends MyCreep<KeeperBusterMemory> {

    public get harvestingSitesToDefend() {
        return _.filter(_.values<HarvestingSiteInterface>(this.myRoom.mySources).concat(this.myRoom.myMineral), s => s.usable && s.keeper);
    }

    public get keeperCreeps() {
        return _.map(_.filter(this.harvestingSitesToDefend, s => s.keeper.creep), s => s.keeper.creep);
    }

    public get keeperLairs() {
        return _.map(this.harvestingSitesToDefend, s => s.keeper.lair);
    }

    constructor(public name: string, public mainRoom: MainRoomInterface) {
        super(name);
        if (myMemory['profilerActive']) {
            this.myTick = profiler.registerFN(this.myTick, 'KeeperBuster.tick');
        }
    }

    public myTick() {
        if (this.creep.hits < this.creep.hitsMax)
            this.creep.heal(this.creep);

        if (this.memory.roomName != this.creep.room.name) {
            this.creep.moveTo(new RoomPosition(25, 25, this.memory.roomName));
            return;
        }

        if (_.size(this.myRoom.hostileScan.creeps) > 0) {
            let creep = _.sortBy(_.map(this.myRoom.hostileScan.creeps, x => x.creep), x => (x.pos.x - this.creep.pos.x) ** 2 + (x.pos.y - this.creep.pos.y) ** 2)[0];
            if (this.creep.rangedAttack(creep) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(creep);
            return;
        }

        if (this.memory.targetId != null) {
            var keeper = Game.getObjectById<Creep>(this.memory.targetId);
            if (keeper == null || keeper.hits <= 100) {
                this.memory.targetId = null;
                keeper = null;
            }
        }
        if (keeper == null) {
            let keepers = _.map(_.filter(this.myRoom.hostileScan.creeps, c => c.owner == 'Invader'), c => c.creep);
            if (keepers.length == 0)
                keepers = _.filter(this.keeperCreeps, x => x.hits > 100);
            keeper = _.sortBy(keepers, x => this.creep.pos.findPathTo(x.pos).length)[0];

            if (keeper) {
                this.memory.targetId = keeper.id;
            }
        }
        if (keeper) {
            if (this.creep.rangedAttack(keeper) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(keeper);
        }

        else {
            let keeperCreep = _.filter(this.keeperCreeps, k => k.ticksToLive < this.creep.ticksToLive - 50 && _.any(this.keeperCreeps, k2 => k2.id != k.id && k2.ticksToLive >= k.ticksToLive && k2.ticksToLive < k.ticksToLive + 200))[0];
            if (keeperCreep) {
                let closestByTime = _.sortBy(_.filter(this.keeperCreeps, k => k.id != keeperCreep.id && keeperCreep.ticksToLive <= k.ticksToLive), k => k.ticksToLive)[0];
                if (!this.creep.pos.inRangeTo(keeperCreep.pos, 3))
                    this.creep.moveTo(keeperCreep);
                this.creep.say('WAIT');
                if (closestByTime.ticksToLive == 200)
                    this.creep.rangedAttack(keeperCreep);
            }

            


            else {
                let ticksUntilNextKeeperAttack = _.min(_.map(this.harvestingSitesToDefend, x => x.keeper.creep ? x.keeper.creep.ticksToLive + 300 : 0 + x.keeper.lair.ticksToSpawn));

                if (ticksUntilNextKeeperAttack>500 || ticksUntilNextKeeperAttack + 200 > this.creep.ticksToLive) {
                    this.recycle();
                }
                else {
                    let nextKeeperLair = _.sortBy(this.keeperLairs, lair => lair.ticksToSpawn)[0];
                    if (nextKeeperLair && !this.creep.pos.inRangeTo(nextKeeperLair.pos, 5)) {
                        this.creep.moveTo(nextKeeperLair);
                    }
                    //}
                }
            }

        }
    }
}