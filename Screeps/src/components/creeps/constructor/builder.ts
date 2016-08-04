/// <reference path="../myCreep.ts" />

class Builder extends MyCreep {
    public get memory(): ConstructorMemory { return this.creep.memory; }
    target: ConstructionSite;
    targetPosition: RoomPosition;



    constructor(public creep: Creep, public mainRoom: MainRoomInterface) {
        super(creep);
        this.memory.autoFlee = true;
        this.myTick = profiler.registerFN(this.myTick, 'Builder.tick');
        this.construct = profiler.registerFN(this.construct, 'Builder.construct');
        this.upgrade = profiler.registerFN(this.upgrade, 'Builder.upgrade');
        this.fillUp = profiler.registerFN(this.fillUp, 'Builder.fillUp');

        this.target = Game.getObjectById<ConstructionSite>(this.memory.targetId);
        if (this.target != null) {
            this.targetPosition = this.target.pos;
            this.memory.targetPosition = this.targetPosition;
        }
        else if (this.creep.memory.targetPosition != null) {
            this.targetPosition = new RoomPosition(this.memory.targetPosition.x, this.memory.targetPosition.y, this.memory.targetPosition.roomName);
            if (Game.rooms[this.targetPosition.roomName] != null) {
                let rampart = _.filter(this.targetPosition.lookFor<Structure>(LOOK_STRUCTURES), s => s.structureType == STRUCTURE_RAMPART && s.hits == 1)[0];
                if (rampart) {
                    this.creep.say('RAMPART');
                    Colony.getRoom(this.targetPosition.roomName).repairStructures[rampart.id] = { id: rampart.id, pos: this.targetPosition, hits: rampart.hits, hitsMax: 1000000, structureType: rampart.structureType };
                }
                this.targetPosition = null;
                this.target = null;
                this.memory.targetId = null;
                this.memory.targetPosition = null;
                this.memory.path = null;
            }
        }

    }

    construct() {
        if ((this.creep.room.name != this.targetPosition.roomName || !this.creep.pos.inRangeTo(this.target.pos,3)) && (this.memory.path == null || this.memory.path.path.length <= 2)) {
            let path = PathFinder.search(this.creep.pos, { pos: this.targetPosition, range: 3 },
                {
                    plainCost: 2,
                    swampCost: 10,
                    roomCallback: Colony.getTravelMatrix
                });
        }
        if (this.memory.path && this.memory.path.path.length > 2) {
            this.moveByPath();
        }
        else if (this.target != null) {
            let result = this.creep.build(this.target);
            if (result == ERR_RCL_NOT_ENOUGH)
                this.target.remove();
            else if (result == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.target);
            else if (result == OK) {

            }
        }
        else {
            this.creep.moveTo(this.targetPosition);
        }
    }

    upgrade() {
        //if ((this.creep.room.name != this.mainRoom.name || !this.creep.pos.inRangeTo(this.mainRoom.room.controller.pos, 3)) && (this.memory.path == null || this.memory.path.path.length <= 2)) {
        //    let path = PathFinder.search(this.creep.pos, { pos: this.mainRoom.room.controller.pos, range: 3 },
        //        {
        //            plainCost: 2,
        //            swampCost: 10,
        //            roomCallback: Colony.getTravelMatrix
        //        });
        //}
        //if (this.memory.path && this.memory.path.path.length > 2) {
        //    this.moveByPath();
        //}
        //else if (this.mainRoom.room.controller.level == 8) {
        //    if (this.mainRoom.spawns[0].recycleCreep(this.creep) == ERR_NOT_IN_RANGE)
        //        this.creep.moveTo(this.mainRoom.spawns[0]);
        //}
        //else {
        //    if (this.creep.upgradeController(this.mainRoom.room.controller) == ERR_NOT_IN_RANGE)
        //        this.creep.moveTo(this.mainRoom.room.controller);
        //}
        //else if 
        if (this.mainRoom.managers.constructionManager.constructions.length==0)
            this.recycle();

    }

    private fillUp() {
        if (!this.memory.fillupContainerId) {
            if (this.creep.room.name == this.mainRoom.name)
                var container = this.mainRoom.mainContainer;
            else {
                let possbibleContainers = _.map(_.filter(this.myRoom.mySources, s => (s.hasKeeper == false || s.keeper.lair.ticksToSpawn > 100 || s.keeper.creep && s.keeper.creep.hits <= 100) && s.container), s => s.container);
                container = _.sortBy(possbibleContainers, x => x.pos.getRangeTo(this.creep.pos))[0];
            }
            if (container) {
                this.memory.fillupContainerId = container.id;
                this.memory.path = PathFinder.search(this.creep.pos, { pos: container.pos, range: 3 }, { roomCallback: Colony.getTravelMatrix, plainCost: 1, swampCost: 5 });
                this.memory.path.path.unshift(this.creep.pos);
            }
        }
        if (this.memory.fillupContainerId) {
            if (this.memory.path && this.memory.path.path.length > 2)
                this.moveByPath();
            else {
                let container = Game.getObjectById<Container>(this.memory.fillupContainerId);
                if (this.creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(container);
            }

        } else if (this.creep.room.name != this.mainRoom.name || this.isOnEdge) {
            if (this.memory.path == null || this.memory.path.path.length <= 2) {
                this.memory.path = PathFinder.search(this.creep.pos, { pos: this.mainRoom.mainContainer.pos, range: 3 }, { roomCallback: Colony.getTravelMatrix, plainCost: 1, swampCost: 5 });
                this.memory.path.path.unshift(this.creep.pos);
            }
            this.moveByPath();
        }
        else if (this.mainRoom.mainContainer.store.energy > this.mainRoom.maxSpawnEnergy) {
            this.memory.path = null;
            if (this.creep.withdraw(this.mainRoom.mainContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.mainRoom.mainContainer);
        }
    }

    public myTick() {

        if (this.creep.carry.energy == this.creep.carryCapacity || !this.pickUpEnergy()) {

            if (this.creep.carry.energy > 0) {
                this.memory.fillupContainerId = null;
                if (this.targetPosition != null && this.mainRoom.room.controller.ticksToDowngrade >= 1000)
                    this.construct();
                else
                    this.upgrade();
            }
            else {
                this.fillUp();
            }
        }
    }

}