class MyTower {

    tower: Tower;
    mainRoom: MainRoom;

    public static staticTracer: Tracer;
    public tracer: Tracer;

    constructor(tower: Tower, mainRoom: MainRoom) {
        this.tower = tower;
        this.mainRoom = mainRoom;
        if (MyTower.staticTracer == null) {
            MyTower.staticTracer = new Tracer('MyTower');
            Colony.tracers.push(MyTower.staticTracer);
        }
        this.tracer = MyTower.staticTracer;
    }

    private handleHostiles() {
        let trace = this.tracer.start('handleHostiles()');
        if (this.mainRoom.myRoom.requiresDefense) {

            var closestHostile = _.sortBy(_.filter(this.mainRoom.myRoom.hostileScan.creeps, e => e.owner !== 'Source Keeper'), x => (x.pos.x - this.tower.pos.x) ** 2 + (x.pos.y - this.tower.pos.y) ** 2)[0];
            //var closestHostile = this.tower.pos.findClosestByRange<Creep>(FIND_HOSTILE_CREEPS, { filter: (e: Creep) => e.owner.username !== 'Source Keeper' && Body.getFromCreep(e).heal > 0 });

            if (closestHostile == null)
                closestHostile = _.sortBy(_.filter(this.mainRoom.myRoom.hostileScan.creeps, e => e.owner !== 'Source Keeper' && e.bodyInfo.totalAttackRate > 0), x => (x.pos.x - this.tower.pos.x) ** 2 + (x.pos.y - this.tower.pos.y) ** 2)[0];

            if (closestHostile == null)
                closestHostile = _.sortBy(_.filter(this.mainRoom.myRoom.hostileScan.creeps, e => e.owner !== 'Source Keeper'), x => (x.pos.x - this.tower.pos.x) ** 2 + (x.pos.y - this.tower.pos.y) ** 2)[0];

            if (closestHostile != null) {
                this.tower.attack(closestHostile.creep);
                trace.stop();
                return true;
            }
        }
        trace.stop();
        return false;
    }

    private handleWounded() {
        let trace = this.tracer.start('handleWounded()');
        var healTarget = this.mainRoom.room.find<Creep>(FIND_MY_CREEPS, { filter: (c) => c.hits < c.hitsMax })[0];
        if (healTarget != null) {
            this.tower.heal(healTarget);
            trace.stop();
            return true;
        }
        trace.stop();
        return false;
    }

    private repairEmergencies() {
        let trace = this.tracer.start('repairEmergencies()');
        var repairTarget = this.mainRoom.myRoom.emergencyRepairs[0];

        if (repairTarget != null && this.tower.energy > this.tower.energyCapacity / 2) {
            this.tower.repair(repairTarget);
            trace.stop();
            return true;
        }
        trace.stop();
        return false;
    }

    public tick() {
        let trace = this.tracer.start('tick()');

        this.handleHostiles() || this.handleWounded() || this.repairEmergencies();

        trace.stop();

    }

}