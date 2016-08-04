class MyTower {

    tower: Tower;
    mainRoom: MainRoom;

   

    constructor(tower: Tower, mainRoom: MainRoom) {
        this.tower = tower;
        this.mainRoom = mainRoom;
        this.tick = profiler.registerFN(this.tick, 'MyTower.tick');
        this.handleHostiles = profiler.registerFN(this.handleHostiles, 'MyTower.handleHostiles');
        this.handleWounded = profiler.registerFN(this.handleWounded, 'MyTower.handleWounded');
        this.repairEmergencies = profiler.registerFN(this.repairEmergencies, 'MyTower.repairEmergencies');
    }

    private handleHostiles() {
        if (this.mainRoom.myRoom.requiresDefense) {

            var closestHostile = _.sortBy(_.filter(this.mainRoom.myRoom.hostileScan.creeps, e => e.owner !== 'Source Keeper'), x => (x.pos.x - this.tower.pos.x) ** 2 + (x.pos.y - this.tower.pos.y) ** 2)[0];
            //var closestHostile = this.tower.pos.findClosestByRange<Creep>(FIND_HOSTILE_CREEPS, { filter: (e: Creep) => e.owner.username !== 'Source Keeper' && Body.getFromCreep(e).heal > 0 });

            if (closestHostile == null)
                closestHostile = _.sortBy(_.filter(this.mainRoom.myRoom.hostileScan.creeps, e => e.owner !== 'Source Keeper' && e.bodyInfo.totalAttackRate > 0), x => (x.pos.x - this.tower.pos.x) ** 2 + (x.pos.y - this.tower.pos.y) ** 2)[0];

            if (closestHostile == null)
                closestHostile = _.sortBy(_.filter(this.mainRoom.myRoom.hostileScan.creeps, e => e.owner !== 'Source Keeper'), x => (x.pos.x - this.tower.pos.x) ** 2 + (x.pos.y - this.tower.pos.y) ** 2)[0];

            if (closestHostile != null) {
                this.tower.attack(closestHostile.creep);
                return true;
            }
        }
        return false;
    }

    private handleWounded() {
        var healTarget = this.mainRoom.room.find<Creep>(FIND_MY_CREEPS, { filter: (c) => c.hits < c.hitsMax })[0];
        if (healTarget != null) {
            this.tower.heal(healTarget);
            return true;
        }
        return false;
    }

    private repairEmergencies() {
        if (this.tower.energy < this.tower.energyCapacity / 2)
            return false;

        var repairTargets = this.mainRoom.myRoom.emergencyRepairStructures;
        var repairTarget = _.sortBy(repairTargets, x => x.hits)[0];

        console.log('Tower: Repair ' + repairTargets.length+' repair targets');

        if (repairTarget != null) {
            let structure = Game.getObjectById<Structure>(repairTarget.id);
            if (structure) {
                this.tower.repair(structure);
                if (this.mainRoom.myRoom.repairStructures[repairTarget.id])
                    this.mainRoom.myRoom.repairStructures[repairTarget.id].hits = structure.hits;
                return true;
            }
            else {
                delete this.mainRoom.myRoom.memory.repairStructures[repairTarget.id];
            }
        }
        return false;
    }

    public tick() {

        this.handleHostiles() || this.handleWounded() || this.repairEmergencies();


    }

}