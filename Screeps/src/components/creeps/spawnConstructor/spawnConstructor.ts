/// <reference path="../myCreep.ts" />
class SpawnConstructor extends MyCreep {

    public get memory(): SpawnConstructorMemory { return this.creep.memory; }

    constructor(creep: Creep) {
        super(creep);
        this.myTick = profiler.registerFN(this.myTick, 'SpawnConstructor.tick');
    }

    myTick() {
        if (this.memory.state == null) {
            this.memory.state = SpawnConstructorState.moving;
        }

        if (this.memory.state == SpawnConstructorState.moving && this.memory.path == null)
            this.memory.path = PathFinder.search(this.creep.pos, { pos: this.memory.targetPosition, range: 2 }, {
                roomCallback: Colony.getTravelMatrix, plainCost:2, swampCost:10
            });
        if (this.creep.room.name != this.memory.targetPosition.roomName) {
            if (this.memory.path != null && this.memory.path.path.length > 2)
                this.moveByPath();
            else
                this.creep.moveTo(new RoomPosition(this.memory.targetPosition.x, this.memory.targetPosition.y, this.memory.targetPosition.roomName));
        } else {
            if (this.memory.state == SpawnConstructorState.moving) {
                this.creep.moveTo(new RoomPosition(this.memory.targetPosition.x, this.memory.targetPosition.y, this.memory.targetPosition.roomName));
                this.memory.state = SpawnConstructorState.harvesting;
            }
            else if (this.creep.carry.energy == this.creep.carryCapacity && this.memory.state == SpawnConstructorState.harvesting)
                this.memory.state = SpawnConstructorState.constructing;
            else if (this.creep.carry.energy == 0 && this.memory.state == SpawnConstructorState.constructing)
                this.memory.state = SpawnConstructorState.harvesting;

            if (this.memory.state == SpawnConstructorState.harvesting) {
                let source = Game.getObjectById<Source>(this.memory.sourceId);

                let energy = this.creep.pos.findInRange<Resource>(FIND_DROPPED_RESOURCES, 1, { filter: (x: Resource) => x.resourceType == RESOURCE_ENERGY })[0];
                if (energy)
                    this.creep.pickup(energy);

                let container = this.creep.pos.findInRange<Container>(FIND_STRUCTURES, 1, { filter: (x: Container) => x.structureType == STRUCTURE_CONTAINER && x.store.energy > 0 })[0];
                if (container)
                    this.creep.withdraw(container, RESOURCE_ENERGY);

                if (this.creep.harvest(source) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(source);
            }
            else if (this.memory.state == SpawnConstructorState.constructing) {
                let construction = this.creep.pos.findClosestByRange<ConstructionSite>(FIND_MY_CONSTRUCTION_SITES, { filter: (x: ConstructionSite) => x.structureType == STRUCTURE_SPAWN });
                if (construction != null) {
                    if (this.creep.build(construction) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(construction);
                }
                else {
                    if (this.creep.upgradeController(this.creep.room.controller) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(this.creep.room.controller);
                }
            }
        }
    }

}