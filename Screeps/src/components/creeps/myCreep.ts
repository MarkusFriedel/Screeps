

abstract class MyCreep<TMemoryType extends CreepMemory> {

    static song = "Im Frühtau zu Berge wir geh´n, fallera, es grünen die Wälder, die Höhn, fallera. Wir wandern ohne Sorgen singend in den Morgen noch ehe im Tale die Hähne kräh´n";

    static songArray: string[];
    static getSongLine() {
        if (MyCreep.songArray == null)
            MyCreep.songArray = MyCreep.song.split(' ');
        return MyCreep.songArray[Game.time % MyCreep.songArray.length];
    }

    public get autoFlee() {
        return this.memory.af;
    }

    public set autoFlee(value: boolean) {
        this.memory.af = value;
    }

    private _creep: { time: number, creep: Creep }
    public get creep() {
        if (this._creep == null || this._creep.time < Game.time)
            this._creep = { time: Game.time, creep: Game.creeps[this.name] };
        return this._creep.creep;
    }
    private _memory: { time: number, memory: TMemoryType };
    public get memory(): TMemoryType {
        if (this._memory == null || this._memory.time < Game.time)
            this._memory = { time: Game.time, memory: this.creep.memory };
        return this._memory.memory;
    }

    private _myRoom: { time: number, myRoom: MyRoomInterface }
    public get myRoom() {
        if (this._myRoom == null || this._myRoom.time < Game.time) {
            this._myRoom = { time: Game.time, myRoom: Colony.getRoom(this.creep.room.name) }
        }
        return this._myRoom.myRoom;
    }

    private _body: { time: number, body: BodyInterface };
    public get body() {
        if (this._body == null || this._body.time < Game.time)
            this._body = { time: Game.time, body: Body.getFromCreep(this.creep) };
        return this._body.body;
    }

    private createPath(target: { pos: RoomPosition, range?: number }, opts?: PathFinderOpts): PathMovement {
        let startCPU = Game.cpu.getUsed();
        let path = PathFinder.search(this.creep.pos, { pos: target.pos, range: target.range!=null ? target.range : 1 }, { roomCallback: (opts && opts.roomCallback) ? opts.roomCallback : Colony.getTravelMatrix, plainCost: (opts && opts.plainCost) ? opts.plainCost : 2, swampCost: (opts && opts.swampCost) ? opts.swampCost : 10, maxOps: (opts && opts.maxOps) ? opts.maxOps : 10000 });
        path.path.unshift(this.creep.pos);
        let pathMovement: PathMovement = {
            target: {
                pos: target.pos,
                range: target.range != null ? target.range : 1
            },
            path: path.path,
            ops: path.ops
        };


        //console.log('Create path: ops: ' + pathMovement.ops + ', Role: ' + this.memory.role + ', state: ' + this.memory['st'] + ', pos: ' + this.creep.pos.x + ':' + this.creep.pos.y + ':' + this.creep.pos.roomName + ', Remaining length: ' + pathMovement.path.length);

        let lastPos = pathMovement.path[pathMovement.path.length - 1];
        let secondToLastPos = pathMovement.path[pathMovement.path.length - 2];
        if (lastPos && secondToLastPos && RoomPos.isOnEdge(lastPos) && lastPos.roomName == secondToLastPos.roomName) {
            pathMovement.path.pop();

        }
        let usedCPU = Game.cpu.getUsed() - startCPU;
        if (usedCPU > 5)
            console.log('Create path: cpu: ' + usedCPU.toFixed(2)+', ops: ' + pathMovement.ops + ', Role: ' + this.memory.role + ', state: ' + this.memory['st'] + ', pos: ' + this.creep.pos.x + ':' + this.creep.pos.y + ':' + this.creep.pos.roomName + ', Remaining length: ' + pathMovement.path.length);

        Colony.memory.createPathTime += usedCPU;

        return pathMovement;
    }

    public moveTo(target: { pos: RoomPosition, range?: number }, opts?: MyPathOpts) {
        if (target == null || target.pos == null)
            return ERR_INVALID_ARGS;
        let myTarget = { pos: target.pos, range: target.range != null ? target.range : 1 }



        if (opts && opts.resetPath || (this.memory.pathMovement == null || this.memory.pathMovement.path.length < 2 && (!this.creep.pos.inRangeTo(myTarget.pos, myTarget.range)) || !RoomPos.fromObj(this.memory.pathMovement.target.pos).isEqualTo(RoomPos.fromObj(myTarget.pos)) || this.memory.pathMovement.target.range != myTarget.range)) {
            this.memory.pathMovement = this.createPath(myTarget, opts);
        }

        if (this.memory.pathMovement == null)
            return;

        if (this.memory.pathMovement.path.length > 1) {
            this.moveByPath(this.memory.pathMovement.path);
        }
        else {
            this.creep.moveTo(myTarget.pos);
        }
    }

    public transferAny(target: Structure) {
        let resource = _.filter(_.keys(this.creep.carry), c => this.creep.carry[c] > 0)[0];
        if (resource) {
            return this.creep.transfer(target, resource);
        }
        return OK;
    }

    public recycle() {
        let mainRoom = this.myRoom.closestMainRoom;
        if (!mainRoom)
            this.creep.suicide();
        else if (_.sum(this.creep.carry) > 0 && mainRoom.mainContainer) {
            this.memory.recycle = true;
            let result = this.transferAny(mainRoom.mainContainer);
            if (result == ERR_NOT_IN_RANGE)
                this.moveTo({ pos: mainRoom.mainContainer.pos, range: 1 });
        }

        else {
            if (this.memory.recycle && (<{ spawnId: string }>this.memory.recycle).spawnId) {
                var spawn = Game.getObjectById<Spawn>((<{ spawnId: string }>this.memory.recycle).spawnId);
            }

            if (!spawn && this.myRoom.closestMainRoom) {
                spawn = this.myRoom.closestMainRoom.spawns[0];
            }

            if (spawn) {
                this.memory.recycle = { spawnId: spawn.id };
                if (spawn.recycleCreep(this.creep) == ERR_NOT_IN_RANGE)
                    this.moveTo({ pos: spawn.pos, range: 1 });
            }
        }
    }

    private getFlightDistance(c: CreepInfoInterface) {
        if (c.owner == 'Source Keeper')
            return this.memory.fleeing ? (c.bodyInfo.rangedAttackRate > 0 ? 4 : 3) : (c.bodyInfo.rangedAttackRate > 0 ? 3 : 2)
        else
            return this.memory.fleeing ? (c.bodyInfo.rangedAttackRate > 0 ? 7 : 4) : (c.bodyInfo.rangedAttackRate > 0 ? 6 : 4)

    }

    public haveToFlee() {
        let hostileCreeps = _.filter(this.myRoom.hostileScan.allCreeps, creep => creep.bodyInfo.totalAttackRate > 10);
        let result = hostileCreeps.length > 0 && _.any(hostileCreeps, c => c.bodyInfo.totalAttackRate > 10 && new BodyInfo(this.creep.body).healRate < c.bodyInfo.totalAttackRate && this.creep.pos.inRangeTo(c.pos, this.getFlightDistance(c)));
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
            if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(energy);
            return true;
        }
        return false;
    }

    constructor(public name: string) {
        if (myMemory['profilerActive']) {
            this.createPath = profiler.registerFN(this.createPath, 'MyCreep.createPath');
            this.tick = profiler.registerFN(this.tick, 'MyCreep.tick');
            this.myTick = profiler.registerFN(this.myTick, 'MyCreep.myTick');
            this.haveToFlee = profiler.registerFN(this.haveToFlee, 'MyCreep.haveToFlee');
            this.flee = profiler.registerFN(this.flee, 'MyCreep.flee');
            this.recycle = profiler.registerFN(this.recycle, 'MyCreep.recycle');
            this.moveTo = profiler.registerFN(this.moveTo, 'MyCreep.moveTo');
            this.moveByPath = profiler.registerFN(this.moveByPath, 'MyCreep.moveByPath');
            this.transferAny = profiler.registerFN(this.transferAny, 'MyCreep.transferAny');
        }
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

        if (RoomPos.equals(this.creep.pos, path[1])) {
            path.shift();
        }

        if (this.creep.pos.isEqualTo(RoomPos.fromObj(path[0])) && this.creep.fatigue == 0) {
            if (RoomPos.fromObj(this.creep.memory.myPathMovement.lastPos).isEqualTo(this.creep.pos) && this.creep.memory.myPathMovement.lastTick != null) {

                if (this.memory.pathMovement && this.creep.pos.inRangeTo(this.memory.pathMovement.target.pos, this.memory.pathMovement.target.range + 3)) {
                    this.memory.pathMovement = this.createPath(this.memory.pathMovement.target, { roomCallback: Colony.getCustomMatrix({ avoidCreeps: true, ignoreAllKeepers: true }), maxOps: 20 });
                    this.creep.say('RePath');
                }
                else
                    this.creep.memory.myPathMovement.movementBlockedCount++;
            }
            else if (this.creep.memory.myPathMovement.lastTick != null) {
                this.creep.memory.myPathMovement.movementBlockedCount = 0;
                this.creep.memory.myPathMovement.lastTick = null;
            }

            if (this.creep.memory.myPathMovement.movementBlockedCount >= 3) {
                this.creep.memory.myPathMovement.movementBlockedCount = 0;
                path.shift();
                this.creep.memory.myPathMovement.lastTick = null;
            }

            else if (path.length > 1) {

                let direction = this.creep.pos.getDirectionTo(path[1].x, path[1].y);
                this.creep.move(direction);
                this.creep.say(this.memory.pathMovement ? this.memory.pathMovement.ops.toString() : '');
                this.creep.memory.myPathMovement.lastPos = this.creep.pos;
                this.creep.memory.myPathMovement.lastTick = Game.time;
                return OK;
            }
        }

        else if (!this.creep.pos.isEqualTo(RoomPos.fromObj(path[0])) && this.creep.fatigue == 0) {
            this.creep.say('REDIR');
            //this.creep.say(MyCreep.getSongLine(), true);
            this.creep.moveTo(RoomPos.fromObj(path[0]), { reusePath: 0 });

            if (RoomPos.equals(RoomPos.fromObj(this.creep.memory.myPathMovement.lastPos), this.creep.pos) && !RoomPos.isOnEdge(this.creep.pos) && path.length > 1) {
                path.shift();
            }
            this.creep.memory.myPathMovement.lastPos = this.creep.pos;
            this.creep.memory.myPathMovement.lastTick = Game.time;
        }
    }

    flee() {
        if (this.creep.spawning || _.size(this.myRoom.hostileScan.allCreeps) == 0)
            return;
        let path = PathFinder.search(this.creep.pos, _.map(_.filter(this.myRoom.hostileScan.allCreeps, c => this.creep.pos.inRangeTo(c.pos, 6) && c.bodyInfo.totalAttackRate > 10), c => {
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
        if (this.creep == null || this.creep.spawning)
            return;

        if (this.memory.recycle) {
            this.recycle();
        }
        else if (this.myRoom.mainRoom && this.memory.requiredBoosts != null && _.size(this.memory.requiredBoosts) > 0) {
            for (let resource in this.memory.requiredBoosts) {
                this.creep.say(resource);
                let boost = this.memory.requiredBoosts[resource];

                let lab = _.filter(this.myRoom.mainRoom.managers.labManager.myLabs, l => l.memory.resource == boost.compound && l.memory.mode & LabMode.publish && l.lab.mineralType == boost.compound && l.lab.mineralAmount >= boost.amount * LAB_BOOST_MINERAL && l.lab.energy >= boost.amount * LAB_BOOST_ENERGY)[0];
                if (lab) {
                    let result = lab.lab.boostCreep(this.creep, boost.amount);
                    this.creep.say(result.toString());
                    if (result == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(lab.lab);
                    else if (result == OK) {
                        delete this.memory.requiredBoosts[boost.compound];
                    }
                    break;
                }
            }


        }
        //else if (this.autoFlee && this.haveToFlee()) {
        //    this.creep.say('OH NO!', true);
        //    this.flee();
        //}
        else {
            this.memory.fleeing = false;
            this.myTick();
        }
    }

    protected abstract myTick();
}