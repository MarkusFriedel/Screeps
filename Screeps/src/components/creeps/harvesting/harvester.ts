/// <reference path="../myCreep.ts" />

class Harvester extends MyCreep<HarvesterMemory> {

    private harvestingSite: HarvestingSiteInterface;

    public get state() {
        return this.memory.st;
    }

    public set state(value: HarvesterState) {
        this.memory.st = value;
    }

    constructor(public name: string, public mainRoom: MainRoomInterface) {
        super(name);

        this.harvestingSite = this.mainRoom.harvestingSites[this.memory.sId];
        this.autoFlee = true;

        if (myMemory['profilerActive']) {
            this.moveToHarvestingSite = profiler.registerFN(this.moveToHarvestingSite, 'Harvester.moveToHarvestingSite');
            this.stateDeliver = profiler.registerFN(this.stateDeliver, 'Harvester.stateDeliver');
            this.stateHarvest = profiler.registerFN(this.stateHarvest, 'Harvester.stateHarvest');
            this.tryHeal = profiler.registerFN(this.tryHeal, 'Harvester.tryHeal');
            this.myTick = profiler.registerFN(this.myTick, 'Harvester.tick');
            this.tryConstruct = profiler.registerFN(this.tryConstruct, 'Harvester.tryConstruct');
            this.tryRepair = profiler.registerFN(this.tryRepair, 'Harvester.tryRepair');
        }
    }

    healed = false;

    private tryHeal() {
        if (this.creep.hits <= this.creep.hitsMax - 20) {
            this.creep.heal(this.creep);
            this.creep.say('heal');
            return true;
        }
        return false;
    }

    private moveToHarvestingSite() {
        if (this.creep.fatigue > 0)
            return;

        if (this.harvestingSite.hasKeeper)
            var initialDistance = 5;
        else
            initialDistance = 2;

        if (this.harvestingSite.containerPosition)
            var target = { pos: this.harvestingSite.containerPosition, range: 0 };
        else
            target = { pos: this.harvestingSite.pos, range: 1 }

        let minDistanceToSourceAndLair = this.creep.pos.getRangeTo(this.harvestingSite.pos);
        if (this.harvestingSite.lairPosition)
            minDistanceToSourceAndLair = Math.min(minDistanceToSourceAndLair, this.creep.pos.getRangeTo(this.harvestingSite.lairPosition));

        if (minDistanceToSourceAndLair > initialDistance) {
            this.moveTo(target, { roomCallback: Colony.getCustomMatrix({ ignoreKeeperSourceId: this.harvestingSite.id }) });
        }
        else {
            if (this.harvestingSite.containerPosition && !this.harvestingSite.hasKeeper && !this.harvestingSite.link && this.harvestingSite.containerPosition.lookFor(LOOK_CREEPS).length > 0) {
                target.range = 1; // Set range to 1 if container is blocked
                target.pos = this.harvestingSite.pos;
            }
            if (!this.harvestingSite.keeperIsAlive && !this.creep.pos.inRangeTo(target.pos, target.range)) {
                this.moveTo(target, { roomCallback: Colony.getCustomMatrix({ ignoreAllKeepers: true, avoidCreeps: true }), maxOps:50 });
            }
            else if (minDistanceToSourceAndLair < initialDistance && this.harvestingSite.keeperIsAlive) {
                delete this.memory.pathMovement;
                let fleePath = PathFinder.search(this.creep.pos, [{ pos: this.harvestingSite.pos, range: initialDistance }, { pos: this.harvestingSite.keeper.lair.pos, range: initialDistance }], { flee: true, roomCallback: Colony.getCustomMatrix({ avoidCreeps:true }), plainCost: 2, swampCost: 10, maxOps: 100 });
                if (fleePath.path.length > 0) {
                    this.creep.say('Flee' + fleePath.ops);
                    this.creep.move(this.creep.pos.getDirectionTo(fleePath.path[0]));
                }
            }
        }
        return;
    }

    private tryConstruct() {
        if (Game.time % 10 == 0) {
            if (!this.harvestingSite.hasKeeper && !this.harvestingSite.link && !this.mainRoom.harvestersShouldDeliver && this.harvestingSite.room && this.creep.pos.isNearTo(this.harvestingSite.pos) && !this.harvestingSite.container) {
                let constructionSiteLook = _.filter(<LookAtResultWithPos[]>this.harvestingSite.room.lookForAtArea(LOOK_CONSTRUCTION_SITES, this.harvestingSite.pos.y - 1, this.harvestingSite.pos.x - 1, this.harvestingSite.pos.y + 1, this.harvestingSite.pos.x + 1, true), s => s.constructionSite.structureType == STRUCTURE_CONTAINER)[0];
                if (!constructionSiteLook) {
                    this.creep.pos.createConstructionSite(STRUCTURE_CONTAINER);
                }
                else if (this.creep.carryCapacity > 0 && this.creep.carry.energy >= this.body.work * BUILD_POWER) {
                    this.creep.build(constructionSiteLook.constructionSite);
                    return true;
                }
            }
        }
        return false;
    }
    private tryRepair() {
        return false;
    }

    private stateHarvest() {
        if (this.tryConstruct() || this.tryHeal())
            return;

        if (!this.healed && this.creep.pos.isNearTo(this.harvestingSite.pos))
            this.creep.harvest(this.harvestingSite.site);

        let haveToDeliver = this.creep.carryCapacity > 0 && (this.harvestingSite.link || this.mainRoom.harvestersShouldDeliver) && _.sum(this.creep.carry) >= this.creep.carryCapacity - 2 * this.body.getHarvestingRate(this.harvestingSite.resourceType);

        if (haveToDeliver) {
            if (this.harvestingSite.link) {
                if (this.transferAny(this.harvestingSite.link) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(this.harvestingSite.link);
            }
            else if (this.mainRoom.harvestersShouldDeliver)
                this.state == HarvesterState.deliver;

        }
        else if (this.creep.fatigue == 0 && ((!this.harvestingSite.containerPosition && !this.creep.pos.isNearTo(this.harvestingSite.pos) || this.harvestingSite.containerPosition && !this.creep.pos.isEqualTo(this.harvestingSite.containerPosition)) || this.harvestingSite.keeperIsAlive)) {
            this.moveToHarvestingSite();
        }
    }

    private stateDeliver() {
        if (this.creep.carry.energy > 0) {
            if (!this.creep.pos.isNearTo(this.mainRoom.energyDropOffStructure))
                this.moveTo(this.mainRoom.energyDropOffStructure, { plainCost: 2, swampCost: 10, roomCallback: Colony.getCustomMatrix({ ignoreKeeperSourceId: this.harvestingSite.id }) });
            else
                this.creep.transfer(this.mainRoom.energyDropOffStructure, RESOURCE_ENERGY);
        }
        else if ((this.mainRoom.terminal || this.mainRoom.mainContainer) && _.sum(this.creep.carry) > 0) {
            let target = this.mainRoom.terminal || this.mainRoom.mainContainer;
            if (this.transferAny(target) == ERR_NOT_IN_RANGE)
                this.moveTo(target, { plainCost: 2, swampCost: 10, roomCallback: Colony.getCustomMatrix({ ignoreKeeperSourceId: this.harvestingSite.id }) });
        }
    }

    protected myTick() {
        this.healed = this.tryHeal();

        if (!this.state || this.state == HarvesterState.deliver && _.sum(this.creep.carry) == 0)
            this.state = HarvesterState.harvest;

        if (this.state == HarvesterState.harvest)
            this.stateHarvest();
        else
            this.stateDeliver();
    }
}