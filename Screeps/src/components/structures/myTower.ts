import {Config} from "./../../config/config";
import {MainRoom} from "../rooms/mainRoom";
import {RepairManager} from "../rooms/repairManager";
import {Body} from "../creeps/body";

export class MyTower {

    tower: Tower;
    mainRoom: MainRoom;

    constructor(tower: Tower, mainRoom: MainRoom) {
        this.tower = tower;
        this.mainRoom = mainRoom;
    }

    public tick() {
        var closestHostile = this.tower.pos.findClosestByRange<Creep>(FIND_HOSTILE_CREEPS, { filter: (e: Creep) => e.owner.username !== 'Source Keeper' && Body.getFromCreep(e).isMilitary() });

        if (closestHostile != null) {
            this.tower.attack(closestHostile);
            return;
        }

        var healTarget = this.tower.pos.findClosestByRange<Creep>(FIND_MY_CREEPS, { filter: (c) => c.hits < c.hitsMax });
        if (healTarget != null) {
            this.tower.heal(healTarget);
            return;
        }

        var repairTarget = this.tower.room.find<Structure>(FIND_STRUCTURES, { filter: (x: Structure) => RepairManager.emergencyTargetDelegate(x) })[0];

        if (repairTarget != null && this.tower.energy > this.tower.energyCapacity / 2) {
            this.tower.repair(repairTarget);
            return;
        }


        
    }

}