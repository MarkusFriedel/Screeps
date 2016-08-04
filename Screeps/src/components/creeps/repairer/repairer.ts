/// <reference path="../myCreep.ts" />

class Repairer extends MyCreep {

    public get memory(): RepairerMemory { return this.creep.memory; }

    private _repairCost: number;
    public get repairCost() {
        if (this._repairCost == null)
            this._repairCost=this.repairPower * REPAIR_COST;
        return this._repairCost;
    }

    private _repairPower: number;
    public get repairPower() {
        if (this._repairPower==null)
            this._repairPower = this.creep.getActiveBodyparts(WORK) * REPAIR_POWER;
        return this._repairPower;
    }

    constructor(public creep: Creep, public mainRoom: MainRoom) {
        super(creep);
        this.memory.autoFlee = true;


        this.myTick = profiler.registerFN(this.myTick, 'Repairer.tick');
        this.pickUpEnergy = profiler.registerFN(this.pickUpEnergy, 'Repairer.pickupEnergy');
        this.getEmergencyTarget = profiler.registerFN(this.getEmergencyTarget, 'Repairer.getEmergencyTarget');
        this.getTarget = profiler.registerFN(this.getTarget, 'Repairer.getTarget');
    }

    getEmergencyTarget() {
        let myRoom = Colony.getRoom(this.creep.room.name);
        if (myRoom)
            var target = _.sortBy(myRoom.emergencyRepairStructures, x => x.hits)[0];
        return target;
    }

    pickUpEnergy(): boolean {
        let resources = _.filter(Colony.getRoom(this.creep.room.name).resourceDrops, r => r.resourceType == RESOURCE_ENERGY);
        let energy = _.sortBy(_.filter(resources, r => r.pos.inRangeTo(this.creep.pos, 4)), r => r.pos.getRangeTo(this.creep.pos))[0];
        if (energy != null) {
            if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(energy);
            return true;
        }
        return false;
    }




    private getTarget(myRoom: MyRoomInterface): RepairStructure {
        //if (this.memory.targetCheckTime != null && this.memory.targetCheckTime + 20 > Game.time) {
        //    return;
        //}
        //this.memory.targetCheckTime = Game.time;

        let nonWalls = _.filter(myRoom.repairStructures, s => s.hits < s.hitsMax);
        let repairStructures = _.values<RepairStructure>(nonWalls.length > 0 ? nonWalls : myRoom.repairWalls);

        let target = _.sortBy(_.filter(repairStructures, RepairManager.targetDelegate), x => x.hits)[0];
        if (target) {
            this.memory.targetId = target.id;
            this.memory.isEmergency = false;
        }
        else {
            target = _.sortBy(_.filter(repairStructures, s => !RepairManager.forceStopRepairDelegate(s) && (s.structureType == STRUCTURE_WALL || s.structureType == STRUCTURE_RAMPART)), x => x.hits)[0];
            if (target) {
                this.memory.targetId = target.id;
                this.memory.isEmergency = false;
            }
            else {
                target = repairStructures[0];
                if (target) {
                    this.memory.targetId = target.id;
                    this.memory.isEmergency = false;
                }
            }
        }
        return target;
    }

    private updateTarget() {
        let target = Game.getObjectById<Structure>(this.memory.targetId);
        if (target == null && Game.rooms[this.myRoom.name])
            delete this.myRoom.memory.repairStructures[this.memory.targetId];
        else if (target && this.myRoom.memory.repairStructures[target.id])
            this.myRoom.memory.repairStructures[target.id].hits = target.hits;
    }

    public myTick() {
        let myRoom = Colony.getRoom(this.creep.room.name);

        if (this.creep.ticksToLive == 1499 && Colony.getRoom(this.memory.roomName)) {
            Colony.getRoom(this.memory.roomName).reloadRepairStructures(0.75);
        }

        if (this.memory.targetId)
            this.updateTarget();


        if (this.creep.carry.energy >= this.repairCost) {
            let roadDummy = _.filter(this.myRoom.repairStructures, r => this.creep.pos.inRangeTo(RoomPos.fromObj(r.pos), 3) && r.structureType == STRUCTURE_ROAD && r.hits < r.hitsMax)[0];
            if (roadDummy) {
                let road = Game.getObjectById<StructureRoad>(roadDummy.id);
                if (road) {
                    this.creep.say('Road Rep');
                    this.creep.repair(<Structure>road);
                    if (road.hitsMax - road.hits <= this.repairPower)
                        delete this.myRoom.repairStructures[road.id];
                    return;
                }
            }
        }



        if (this.repairPower == 0)
            this.recycle();

        if (this.memory.state == RepairerState.Repairing && this.creep.carry.energy == 0) {
            this.memory.state = RepairerState.Refilling;
            this.memory.fillupContainerId = null;
            this.memory.targetId = null;
        }
        else if (this.memory.state == RepairerState.Refilling && this.creep.carry.energy > 0.5 * this.creep.carryCapacity) {
            this.memory.state = RepairerState.Repairing;
        }


        if (this.memory.state == RepairerState.Repairing) {
            if (this.creep.hits < this.creep.hitsMax) { // Step away from keepers
                let keepers = _.filter(this.myRoom.hostileScan.keepers, k => k.pos.inRangeTo(this.creep.pos, 3));
                if (keepers.length > 0) {

                    let fleePath = PathFinder.search(this.creep.pos, _.map(keepers, k => {
                        return { pos: k.pos, range: 4 }
                    }), {
                            roomCallback: Colony.getCreepAvoidanceMatrix, flee: true, plainCost: 2, swampCost: 10
                        });

                    this.creep.say('StepAway');
                    this.creep.move(this.creep.pos.getDirectionTo(fleePath.path[0]));

                    return;
                }
            }

            if (this.creep.room.name != this.memory.roomName || this.isOnEdge) {
                this.moveTo({ pos: new RoomPosition(25, 25, this.memory.roomName), range: 20 });
            }
            else {
                if (this.creep.room.name == this.memory.roomName && this.memory.targetId == null) {
                    let target = this.getEmergencyTarget();

                    if (target) {
                        this.memory.targetId = target.id;
                        this.memory.isEmergency = true;
                    }
                    else {
                        target = this.getTarget(myRoom);
                        if (target) {
                            this.memory.targetId = target.id;
                            this.memory.isEmergency = false;
                        }
                    }
                }
                if (this.memory.targetId != null) {
                    let structure = Game.getObjectById<Structure>(this.memory.targetId);
                    if (structure == null) {
                        this.memory.targetId = null;
                    }
                    else {
                        if (!this.creep.pos.inRangeTo(structure.pos, 3))
                            this.moveTo({ pos: structure.pos, range: 3 });
                        this.creep.repair(structure);
                        if (structure.hitsMax - structure.hits <= this.repairPower) {
                            delete this.myRoom.memory.repairStructures[structure.id];
                            delete this.myRoom.memory.repairWalls[structure.id];
                        }
                        else {
                            if (this.myRoom.repairStructures[structure.id])
                                this.myRoom.repairStructures[structure.id].hits += this.repairPower;
                            if (this.myRoom.repairWalls[structure.id])
                                this.myRoom.repairWalls[structure.id].hits += this.repairPower;
                        }

                        if (this.memory.isEmergency && RepairManager.emergencyStopDelegate(structure))
                            this.memory.isEmergency = false;

                        if (RepairManager.forceStopRepairDelegate(structure) || this.memory.isEmergency == false && this.getEmergencyTarget() != null)
                            this.memory.targetId = null;
                    }
                }
                //else
                //    this.memory.recycle = true;
            }
        }
        else if (this.memory.state == RepairerState.Refilling) {
            this.memory.targetId = null;
            if (!this.memory.fillupContainerId && this.myRoom.name != this.mainRoom.name) {
                let possbibleContainers = _.map(_.filter(this.myRoom.mySources, s => (s.hasKeeper == false || s.keeper.lair.ticksToSpawn > 100 || s.keeper.creep && s.keeper.creep.hits <= 100) && s.container), s => s.container);
                let container = _.sortBy(possbibleContainers, x => x.pos.getRangeTo(this.creep.pos))[0];
                if (container)
                    this.memory.fillupContainerId = container.id;
            }
            if (this.memory.fillupContainerId) {
                let container = Game.getObjectById<Container>(this.memory.fillupContainerId);
                if (!container)
                    this.memory.fillupContainerId = null;
                if (container && this.creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.moveTo({ pos: container.pos, range: 3 });

            } else {
                let closestMainRoom = Colony.mainRooms[_.min(this.myRoom.memory.mainRoomDistanceDescriptions, d => d.distance).roomName];
                if (!closestMainRoom && !closestMainRoom.mainContainer)
                    closestMainRoom = this.mainRoom;
                if (closestMainRoom && closestMainRoom.mainContainer) {
                    this.memory.fillupContainerId = closestMainRoom.mainContainer.id;
                }
            }
        }

    }
}
