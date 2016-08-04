

abstract class MyCreep {

    public get memory(): CreepMemory { return this.creep.memory; }

    private _myRoom: { time: number, myRoom: MyRoomInterface }
    public get myRoom() {
        if (this._myRoom == null || this._myRoom.time < Game.time) {
            this._myRoom = { time: Game.time, myRoom: Colony.getRoom(this.creep.room.name) }
        }
        return this._myRoom.myRoom;
    }

    private createPath(target: { pos: RoomPosition, range?: number }, opts?: PathFinderOps): PathMovement {
        let path = PathFinder.search(this.creep.pos, { pos: target.pos, range: target.range ? target.range : 1 }, { roomCallback: (opts && opts.roomCallback) ? opts.roomCallback : Colony.getTravelMatrix, plainCost: (opts && opts.plainCost) ? opts.plainCost : 1, swampCost: (opts && opts.swampCost) ? opts.swampCost : 5, maxOps: 10000 });
        path.path.unshift(this.creep.pos);
        let pathMovement: PathMovement = {
            target: {
                pos: target.pos,
                range: target.range ? target.range : 1
            },
            path: path.path,
            ops: path.ops
        };

        return pathMovement;
    }

    public moveTo(target: { pos: RoomPosition, range?: number }, opts?: PathFinderOps) {

        if (target == null || target.pos == null)
            return ERR_INVALID_ARGS;
        if (this.memory.pathMovement == null || !RoomPos.fromObj(this.memory.pathMovement.target.pos).isEqualTo(RoomPos.fromObj(target.pos)) || this.memory.pathMovement.target.range != (target.range ? target.range : 1)) {
            this.memory.pathMovement = this.createPath(target, opts);
        }

        if (this.memory.pathMovement == null)
            return;

        if (this.memory.pathMovement.path.length < 2 && (!this.creep.pos.inRangeTo(target.pos, target.range)))
            this.memory.pathMovement = this.createPath(target);

        if (this.memory.pathMovement.path.length > 1) {
            this.moveByPath(this.memory.pathMovement.path);
        }
        else {
            this.creep.moveTo(target.pos);
        }
    }

    private transferAny(target: Structure) {
        let resource = _.filter(_.keys(this.creep.carry), c => this.creep.carry[c] > 0)[0];
        if (resource) {
            let result = this.creep.transfer(target, resource);
            if (result == ERR_NOT_IN_RANGE)
                this.moveTo({ pos: target.pos, range: 3 });
            else if (result == ERR_FULL)
                this.creep.drop(resource);
        }
    }

    public recycle() {
        //this.creep.say('Recycle');

        let mainRoom = this.myRoom.closestMainRoom;
        if (!mainRoom)
            this.creep.suicide();
        else if (_.sum(this.creep.carry) > 0 && mainRoom.mainContainer) {
            this.transferAny(mainRoom.mainContainer);
        }
        else if (this.memory.recycle && this.memory.recycle.spawnId) {
            var spawn = Game.getObjectById<Spawn>(this.memory.recycle.spawnId);
        }

        if (!spawn && this.myRoom.closestMainRoom) {
            spawn = this.myRoom.closestMainRoom.spawns[0];
        }

        if (spawn) {
            this.memory.recycle = { spawnId: spawn.id };
            if (spawn.recycleCreep(this.creep) == ERR_NOT_IN_RANGE)
                this.moveTo({ pos: spawn.pos, range: 4 });
        }
    }



    public get haveToFlee() {
        let hostileCreeps = _.filter(this.myRoom.hostileScan.allCreeps, creep => creep.bodyInfo.totalAttackRate > 0);
        let result = hostileCreeps.length > 0 && _.any(hostileCreeps, c => c.bodyInfo.totalAttackRate > 10 && new BodyInfo(this.creep.body).healRate < c.bodyInfo.totalAttackRate && this.creep.pos.inRangeTo(c.pos, this.memory.fleeing ? (c.bodyInfo.rangedAttackRate > 0 ? 5 : 3) : (c.bodyInfo.rangedAttackRate > 0 ? 4 : 2)));
        return result;
    }

    public pickUpEnergy(range = 1): boolean {
        if (_.sum(this.creep.carry) == this.creep.carryCapacity)
            return false;
        let resources = _.filter(Colony.getRoom(this.creep.room.name).resourceDrops, r => r.resourceType == RESOURCE_ENERGY);
        let energy = _.filter(resources, r => r.pos.inRangeTo(this.creep.pos, range))[0];
        if (energy && this.myRoom && this.myRoom.mainRoom && this.myRoom.mainRoom.mainContainer && this.creep.pos.roomName == this.myRoom.mainRoom.name && this.myRoom.mainRoom.mainContainer.pos.isNearTo(energy.pos))
            return false;
        if (energy != null) {
            if (!this.creep.pos.inRangeTo(energy.pos, range))
                this.moveTo(energy);
            else if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
                this.moveTo(energy);
            return true;
        }
        return false;
    }

    constructor(public creep: Creep) {
        this.createPath = profiler.registerFN(this.createPath, 'MyCreep.createPath');
        this.tick = profiler.registerFN(this.tick, 'MyCreep.tick');
    }

    public get isOnEdge() {
        return RoomPos.isOnEdge(this.creep.pos);
    }

    public moveFromEdge() {

    }

    moveByPath(customPath: RoomPosition[] = null) {
        if (this.creep.memory.myPathMovement == null)
            this.creep.memory.myPathMovement = { movementBlockedCount: 0, lastPos: this.creep.pos };

        let path = customPath || this.memory.path.path;
        if (path.length < 2)
            return;

        if (path.length > 2 && RoomPos.isOnEdge(path[0]) && this.creep.pos.isEqualTo(RoomPos.fromObj(path[2]))) {
            path.shift();
        }

        if (RoomPos.equals(this.creep.pos, path[1]))
            path.shift();

        if (this.creep.pos.isEqualTo(RoomPos.fromObj(path[0])) && this.creep.fatigue == 0) {
            if (RoomPos.fromObj(this.creep.memory.myPathMovement.lastPos).isEqualTo(this.creep.pos) && this.creep.memory.myPathMovement.lastTick == Game.time - 1) {
                this.creep.memory.myPathMovement.movementBlockedCount++;
                if (this.memory.pathMovement && this.memory.pathMovement.target && this.creep.pos.inRangeTo(this.memory.pathMovement.target.pos, this.memory.pathMovement.target.range + 2)) {
                    this.creep.memory.myPathMovement.movementBlockedCount = 0;
                    this.creep.memory.myPathMovement.lastTick = null;
                    console.log('Navigating around creeps');
                    let target = this.memory.pathMovement.target;
                    this.memory.pathMovement = null;
                    this.moveTo(target, { roomCallback: Colony.getCreepAvoidanceMatrix });
                    return;
                }
            }
            else if (this.creep.memory.myPathMovement.lastTick == Game.time - 1)
                this.creep.memory.myPathMovement.movementBlockedCount = 0;

            if (this.creep.memory.myPathMovement.movementBlockedCount >= 3) {
                this.creep.memory.myPathMovement.movementBlockedCount = 0;
                this.creep.say('shift');
                path.shift();
            }

            else if (path.length > 1) {

                let direction = this.creep.pos.getDirectionTo(path[1].x, path[1].y);
                this.creep.move(direction);
                this.creep.say('path');
                this.creep.memory.myPathMovement.lastPos = this.creep.pos;
                this.creep.memory.myPathMovement.lastTick = Game.time;
                return OK;
            }
        }

        else if (!this.creep.pos.isEqualTo(RoomPos.fromObj(path[0])) && this.creep.fatigue == 0) {
            this.creep.say('REDIR');
            this.creep.moveTo(RoomPos.fromObj(path[0]), { reusePath: 0 });

            if (RoomPos.equals(RoomPos.fromObj(this.creep.memory.myPathMovement.lastPos), this.creep.pos) && !RoomPos.isOnEdge(this.creep.pos) && path.length > 1)
                path.shift();
            this.creep.memory.myPathMovement.lastPos = this.creep.pos;
            this.creep.memory.myPathMovement.lastTick = Game.time;
        }
    }

    flee() {
        if (this.creep.spawning || _.size(this.myRoom.hostileScan.allCreeps) == 0)
            return;
        let path = PathFinder.search(this.creep.pos, _.map(_.filter(this.myRoom.hostileScan.allCreeps, c => c.bodyInfo.totalAttackRate > 0), c => {
            return {
                pos: c.pos,
                range: c.bodyInfo.rangedAttackRate > 0 ? 6 : 4
            }
        }), { flee: true, roomCallback: Colony.getCreepAvoidanceMatrix });
        path.path.unshift(this.creep.pos);
        this.moveByPath(path.path);

        if (_.sum(this.creep.carry) > 0) {
            this.creep.drop(_.first(_.filter(_.keys(this.creep.carry), x => this.creep.carry[x] > 0)));
        }

        if (_.filter(this.creep.body, b => b.type == HEAL).length > 0)
            this.creep.heal(this.creep);

    }

    public tick() {
        if (this.creep.spawning)
            return;

        if (this.memory.recycle) {
            this.recycle();
        }
        else if (this.myRoom.mainRoom && this.memory.requiredBoosts != null && _.size(this.memory.requiredBoosts) > 0) {
            for (let resource in this.memory.requiredBoosts) {
                //this.creep.say(resource);
                let boost = this.memory.requiredBoosts[resource];

                let lab = _.filter(this.myRoom.mainRoom.managers.labManager.myLabs, l => l.memory.resource == boost.compound && l.memory.mode & LabMode.publish && l.lab.mineralType == boost.compound && l.lab.mineralAmount >= boost.amount * LAB_BOOST_MINERAL && l.lab.energy >= boost.amount * LAB_BOOST_ENERGY)[0];
                if (lab) {
                    let result = lab.lab.boostCreep(this.creep, boost.amount);
                    //this.creep.say(result.toString());
                    if (result == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(lab.lab);
                    else if (result == OK) {
                        delete this.memory.requiredBoosts[boost.compound];
                    }
                    break;
                }
            }


        }
        else if (this.memory.autoFlee && this.haveToFlee) {
            this.creep.say('OH NO!', true);
            this.flee();
        }
        else
            this.myTick();
    }

    public abstract myTick();
}