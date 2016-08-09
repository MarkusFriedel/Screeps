var Body = (function () {
    function Body() {
        this.boosts = {};
        this.move = 0;
        this.work = 0;
        this.attack = 0;
        this.carry = 0;
        this.heal = 0;
        this.ranged_attack = 0;
        this.tough = 0;
        this.claim = 0;
        if (myMemory['profilerActive']) {
            this.getHarvestingRate = profiler.registerFN(this.getHarvestingRate, 'Body.getHarvestingRate');
        }
    }
    Body.getFromBodyArray = function (parts) {
        var body = new Body();
        var _loop_1 = function(part) {
            body[BODYPARTS_ALL[part]] = _.filter(parts, function (x) { return x.type == BODYPARTS_ALL[part]; }).length;
        };
        for (var part in BODYPARTS_ALL) {
            _loop_1(part);
        }
        return body;
    };
    Body.getFromCreep = function (creep) {
        return Body.getFromBodyArray(creep.body);
    };
    Object.defineProperty(Body.prototype, "costs", {
        get: function () {
            var costs = 0;
            costs += this.move * BODYPART_COST[MOVE];
            costs += this.work * BODYPART_COST[WORK];
            costs += this.attack * BODYPART_COST[ATTACK];
            costs += this.carry * BODYPART_COST[CARRY];
            costs += this.heal * BODYPART_COST[HEAL];
            costs += this.ranged_attack * BODYPART_COST[RANGED_ATTACK];
            costs += this.tough * BODYPART_COST[TOUGH];
            costs += this.claim * BODYPART_COST[CLAIM];
            return costs;
        },
        enumerable: true,
        configurable: true
    });
    Body.prototype.getHarvestingRate = function (resource) {
        if (resource == RESOURCE_ENERGY)
            return this.energyHarvestingRate;
        else
            return this.mineralHarvestingRate;
    };
    Object.defineProperty(Body.prototype, "energyHarvestingRate", {
        get: function () {
            var rate = this.work * HARVEST_POWER;
            _.forEach(this.boosts, function (b) {
                if (BOOSTS.work[b.compound] && BOOSTS.work[b.compound].harvest)
                    rate += HARVEST_POWER * (BOOSTS.work[b.compound].harvest - 1) * b.amount;
            });
            return rate;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Body.prototype, "healRate", {
        get: function () {
            var rate = this.heal * HEAL_POWER;
            _.forEach(this.boosts, function (b) {
                if (BOOSTS.heal[b.compound] && BOOSTS.work[b.compound].heal)
                    rate += HEAL_POWER * (BOOSTS.work[b.compound].heal - 1) * b.amount;
            });
            return rate;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Body.prototype, "mineralHarvestingRate", {
        get: function () {
            return this.energyHarvestingRate / 2;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Body.prototype, "isMilitaryDefender", {
        get: function () {
            return (this.heal + this.ranged_attack + this.attack) > 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Body.prototype, "isMilitaryAttacker", {
        get: function () {
            return (this.heal + this.ranged_attack + this.attack + this.work) > 0;
        },
        enumerable: true,
        configurable: true
    });
    Body.prototype.getBody = function () {
        var body = [];
        for (var i = 0; i < this.tough; i++)
            body.push(TOUGH);
        for (var i = 0; i < this.claim; i++)
            body.push(CLAIM);
        for (var i = 0; i < this.ranged_attack; i++)
            body.push(RANGED_ATTACK);
        for (var i = 0; i < this.attack; i++)
            body.push(ATTACK);
        for (var i = 0; i < this.work; i++)
            body.push(WORK);
        for (var i = 0; i < this.heal; i++)
            body.push(HEAL);
        var combinedCarryMoveCount = Math.min(this.carry, this.move);
        for (var i = 0; i < this.carry - combinedCarryMoveCount; i++)
            body.push(CARRY);
        for (var i = 0; i < combinedCarryMoveCount; i++) {
            body.push(CARRY);
            body.push(MOVE);
        }
        for (var i = 0; i < this.move - combinedCarryMoveCount; i++)
            body.push(MOVE);
        return body;
    };
    return Body;
}());
var MyCreep = (function () {
    function MyCreep(name) {
        this.name = name;
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
    MyCreep.getSongLine = function () {
        if (MyCreep.songArray == null)
            MyCreep.songArray = MyCreep.song.split(' ');
        return MyCreep.songArray[Game.time % MyCreep.songArray.length];
    };
    Object.defineProperty(MyCreep.prototype, "autoFlee", {
        get: function () {
            return this.memory.af;
        },
        set: function (value) {
            this.memory.af = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyCreep.prototype, "creep", {
        get: function () {
            if (this._creep == null || this._creep.time < Game.time)
                this._creep = { time: Game.time, creep: Game.creeps[this.name] };
            return this._creep.creep;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyCreep.prototype, "memory", {
        get: function () {
            if (this._memory == null || this._memory.time < Game.time)
                this._memory = { time: Game.time, memory: this.creep.memory };
            return this._memory.memory;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyCreep.prototype, "myRoom", {
        get: function () {
            if (this._myRoom == null || this._myRoom.time < Game.time) {
                this._myRoom = { time: Game.time, myRoom: Colony.getRoom(this.creep.room.name) };
            }
            return this._myRoom.myRoom;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyCreep.prototype, "body", {
        get: function () {
            if (this._body == null || this._body.time < Game.time)
                this._body = { time: Game.time, body: Body.getFromCreep(this.creep) };
            return this._body.body;
        },
        enumerable: true,
        configurable: true
    });
    MyCreep.prototype.createPath = function (target, opts) {
        var startCPU = Game.cpu.getUsed();
        var path = PathFinder.search(this.creep.pos, { pos: target.pos, range: target.range ? target.range : 1 }, { roomCallback: (opts && opts.roomCallback) ? opts.roomCallback : Colony.getTravelMatrix, plainCost: (opts && opts.plainCost) ? opts.plainCost : 2, swampCost: (opts && opts.swampCost) ? opts.swampCost : 10, maxOps: (opts && opts.maxOps) ? opts.maxOps : 10000 });
        path.path.unshift(this.creep.pos);
        var pathMovement = {
            target: {
                pos: target.pos,
                range: target.range != null ? target.range : 1
            },
            path: path.path,
            ops: path.ops
        };
        //console.log('Create path: ops: ' + pathMovement.ops + ', Role: ' + this.memory.role + ', state: ' + this.memory['st'] + ', pos: ' + this.creep.pos.x + ':' + this.creep.pos.y + ':' + this.creep.pos.roomName + ', Remaining length: ' + pathMovement.path.length);
        var lastPos = pathMovement.path[pathMovement.path.length - 1];
        var secondToLastPos = pathMovement.path[pathMovement.path.length - 2];
        if (lastPos && secondToLastPos && RoomPos.isOnEdge(lastPos) && lastPos.roomName == secondToLastPos.roomName) {
            pathMovement.path.pop();
        }
        var usedCPU = Game.cpu.getUsed() - startCPU;
        if (usedCPU > 5)
            console.log('Create path: cpu: ' + usedCPU.toFixed(2) + ', ops: ' + pathMovement.ops + ', Role: ' + this.memory.role + ', state: ' + this.memory['st'] + ', pos: ' + this.creep.pos.x + ':' + this.creep.pos.y + ':' + this.creep.pos.roomName + ', Remaining length: ' + pathMovement.path.length);
        Colony.memory.createPathTime += usedCPU;
        return pathMovement;
    };
    MyCreep.prototype.moveTo = function (target, opts) {
        if (target == null || target.pos == null)
            return ERR_INVALID_ARGS;
        var myTarget = { pos: target.pos, range: target.range != null ? target.range : 1 };
        if ((this.memory.pathMovement == null || this.memory.pathMovement.path.length < 2 && (!this.creep.pos.inRangeTo(myTarget.pos, myTarget.range)) || !RoomPos.fromObj(this.memory.pathMovement.target.pos).isEqualTo(RoomPos.fromObj(myTarget.pos)) || this.memory.pathMovement.target.range != myTarget.range)) {
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
    };
    MyCreep.prototype.transferAny = function (target) {
        var _this = this;
        var resource = _.filter(_.keys(this.creep.carry), function (c) { return _this.creep.carry[c] > 0; })[0];
        if (resource) {
            return this.creep.transfer(target, resource);
        }
        return OK;
    };
    MyCreep.prototype.recycle = function () {
        //this.creep.say('Recycle');
        var mainRoom = this.myRoom.closestMainRoom;
        if (!mainRoom)
            this.creep.suicide();
        else if (_.sum(this.creep.carry) > 0 && mainRoom.mainContainer) {
            this.memory.recycle = true;
            var result = this.transferAny(mainRoom.mainContainer);
            if (result == ERR_NOT_IN_RANGE)
                this.moveTo({ pos: mainRoom.mainContainer.pos, range: 1 });
        }
        else {
            if (this.memory.recycle && this.memory.recycle.spawnId) {
                var spawn = Game.getObjectById(this.memory.recycle.spawnId);
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
    };
    MyCreep.prototype.getFlightDistance = function (c) {
        if (c.owner == 'Source Keeper')
            return this.memory.fleeing ? (c.bodyInfo.rangedAttackRate > 0 ? 4 : 3) : (c.bodyInfo.rangedAttackRate > 0 ? 3 : 2);
        else
            return this.memory.fleeing ? (c.bodyInfo.rangedAttackRate > 0 ? 7 : 4) : (c.bodyInfo.rangedAttackRate > 0 ? 6 : 4);
    };
    MyCreep.prototype.haveToFlee = function () {
        var _this = this;
        var hostileCreeps = _.filter(this.myRoom.hostileScan.allCreeps, function (creep) { return creep.bodyInfo.totalAttackRate > 10; });
        var result = hostileCreeps.length > 0 && _.any(hostileCreeps, function (c) { return c.bodyInfo.totalAttackRate > 10 && new BodyInfo(_this.creep.body).healRate < c.bodyInfo.totalAttackRate && _this.creep.pos.inRangeTo(c.pos, _this.getFlightDistance(c)); });
        return result;
    };
    MyCreep.prototype.pickUpEnergy = function (range) {
        var _this = this;
        if (range === void 0) { range = 1; }
        if (_.sum(this.creep.carry) == this.creep.carryCapacity)
            return false;
        var resources = _.filter(Colony.getRoom(this.creep.room.name).resourceDrops, function (r) { return r.resourceType == RESOURCE_ENERGY; });
        var energy = _.filter(resources, function (r) { return r.pos.inRangeTo(_this.creep.pos, range); })[0];
        if (energy && this.myRoom && this.myRoom.mainRoom && this.myRoom.mainRoom.mainContainer && this.creep.pos.roomName == this.myRoom.mainRoom.name && this.myRoom.mainRoom.mainContainer.pos.isNearTo(energy.pos))
            return false;
        if (energy != null) {
            if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(energy);
            return true;
        }
        return false;
    };
    Object.defineProperty(MyCreep.prototype, "isOnEdge", {
        get: function () {
            return RoomPos.isOnEdge(this.creep.pos);
        },
        enumerable: true,
        configurable: true
    });
    MyCreep.prototype.moveFromEdge = function () {
    };
    MyCreep.prototype.moveByPath = function (customPath) {
        if (customPath === void 0) { customPath = null; }
        if (this.creep.memory.myPathMovement == null)
            this.creep.memory.myPathMovement = { movementBlockedCount: 0, lastPos: this.creep.pos };
        var path = customPath || this.memory.path.path;
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
                var direction = this.creep.pos.getDirectionTo(path[1].x, path[1].y);
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
    };
    MyCreep.prototype.flee = function () {
        var _this = this;
        if (this.creep.spawning || _.size(this.myRoom.hostileScan.allCreeps) == 0)
            return;
        var path = PathFinder.search(this.creep.pos, _.map(_.filter(this.myRoom.hostileScan.allCreeps, function (c) { return _this.creep.pos.inRangeTo(c.pos, 6) && c.bodyInfo.totalAttackRate > 10; }), function (c) {
            return {
                pos: c.pos,
                range: c.bodyInfo.rangedAttackRate > 0 ? 6 : 4
            };
        }), { flee: true, roomCallback: Colony.getCreepAvoidanceMatrix });
        path.path.unshift(this.creep.pos);
        this.moveByPath(path.path);
        if (_.sum(this.creep.carry) > 0) {
            this.creep.drop(_.first(_.filter(_.keys(this.creep.carry), function (x) { return _this.creep.carry[x] > 0; })));
        }
        if (_.filter(this.creep.body, function (b) { return b.type == HEAL; }).length > 0)
            this.creep.heal(this.creep);
    };
    MyCreep.prototype.tick = function () {
        if (this.creep == null || this.creep.spawning)
            return;
        if (this.memory.recycle) {
            this.recycle();
        }
        else if (this.myRoom.mainRoom && this.memory.requiredBoosts != null && _.size(this.memory.requiredBoosts) > 0) {
            var _loop_2 = function(resource) {
                this_1.creep.say(resource);
                var boost = this_1.memory.requiredBoosts[resource];
                var lab = _.filter(this_1.myRoom.mainRoom.managers.labManager.myLabs, function (l) { return l.memory.resource == boost.compound && l.memory.mode & 4 /* publish */ && l.lab.mineralType == boost.compound && l.lab.mineralAmount >= boost.amount * LAB_BOOST_MINERAL && l.lab.energy >= boost.amount * LAB_BOOST_ENERGY; })[0];
                if (lab) {
                    var result = lab.lab.boostCreep(this_1.creep, boost.amount);
                    this_1.creep.say(result.toString());
                    if (result == ERR_NOT_IN_RANGE)
                        this_1.creep.moveTo(lab.lab);
                    else if (result == OK) {
                        delete this_1.memory.requiredBoosts[boost.compound];
                    }
                    return "break";
                }
            };
            var this_1 = this;
            for (var resource in this.memory.requiredBoosts) {
                var state_2 = _loop_2(resource);
                if (state_2 === "break") break;
            }
        }
        else {
            this.memory.fleeing = false;
            this.myTick();
        }
    };
    MyCreep.song = "Im Frühtau zu Berge wir geh´n, fallera, es grünen die Wälder, die Höhn, fallera. Wir wandern ohne Sorgen singend in den Morgen noch ehe im Tale die Hähne kräh´n";
    return MyCreep;
}());
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path="../myCreep.ts" />
var SpawnConstructor = (function (_super) {
    __extends(SpawnConstructor, _super);
    function SpawnConstructor(name) {
        _super.call(this, name);
        this.name = name;
        if (myMemory['profilerActive']) {
            this.myTick = profiler.registerFN(this.myTick, 'SpawnConstructor.tick');
        }
    }
    SpawnConstructor.prototype.myTick = function () {
        if (this.memory.state == null) {
            this.memory.state = 0 /* moving */;
        }
        if (this.memory.state == 0 /* moving */ && this.memory.path == null)
            this.memory.path = PathFinder.search(this.creep.pos, { pos: this.memory.targetPosition, range: 2 }, {
                roomCallback: Colony.getTravelMatrix, plainCost: 2, swampCost: 10
            });
        if (this.creep.room.name != this.memory.targetPosition.roomName) {
            if (this.memory.path != null && this.memory.path.path.length > 2)
                this.moveByPath();
            else
                this.creep.moveTo(new RoomPosition(this.memory.targetPosition.x, this.memory.targetPosition.y, this.memory.targetPosition.roomName));
        }
        else {
            if (this.memory.state == 0 /* moving */) {
                this.creep.moveTo(new RoomPosition(this.memory.targetPosition.x, this.memory.targetPosition.y, this.memory.targetPosition.roomName));
                this.memory.state = 1 /* harvesting */;
            }
            else if (this.creep.carry.energy == this.creep.carryCapacity && this.memory.state == 1 /* harvesting */)
                this.memory.state = 2 /* constructing */;
            else if (this.creep.carry.energy == 0 && this.memory.state == 2 /* constructing */)
                this.memory.state = 1 /* harvesting */;
            if (this.memory.state == 1 /* harvesting */) {
                var source = Game.getObjectById(this.memory.sourceId);
                var energy = this.creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1, { filter: function (x) { return x.resourceType == RESOURCE_ENERGY; } })[0];
                if (energy)
                    this.creep.pickup(energy);
                var container = this.creep.pos.findInRange(FIND_STRUCTURES, 1, { filter: function (x) { return x.structureType == STRUCTURE_CONTAINER && x.store.energy > 0; } })[0];
                if (container)
                    this.creep.withdraw(container, RESOURCE_ENERGY);
                if (this.creep.harvest(source) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(source);
            }
            else if (this.memory.state == 2 /* constructing */) {
                var construction = this.creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES, { filter: function (x) { return x.structureType == STRUCTURE_SPAWN; } });
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
    };
    return SpawnConstructor;
}(MyCreep));
var MyLink = (function () {
    function MyLink(link, mainRoom) {
        this.mainRoom = mainRoom;
        this._link = { time: 0, link: null };
        this.id = link.id;
        if (myMemory['profilerActive'])
            this.tick = profiler.registerFN(this.tick, 'MyLink.tick');
        var surroundingStructures = mainRoom.room.lookForAtArea(LOOK_STRUCTURES, link.pos.y - 2, link.pos.x - 2, link.pos.y + 2, link.pos.x + 2, true);
        this.nextToStorage = _.any(surroundingStructures, function (x) { return x.structure.structureType == STRUCTURE_STORAGE; });
        this.nextToTower = _.any(surroundingStructures, function (x) { return x.structure.structureType == STRUCTURE_TOWER; });
        this.nearSource = link.pos.findInRange(FIND_SOURCES, 4).length > 0;
        this.nearController = link.pos.inRangeTo(mainRoom.room.controller.pos, 4);
        this.drain = this.nearSource || this.nextToStorage;
        this.fill = this.nextToStorage || this.nextToTower || this.nearController;
    }
    Object.defineProperty(MyLink.prototype, "link", {
        get: function () {
            if (this._link.time < Game.time)
                this._link = {
                    time: Game.time, link: Game.getObjectById(this.id)
                };
            return this._link.link;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyLink.prototype, "minLevel", {
        get: function () {
            var _this = this;
            if (this.nextToStorage) {
                if (_.any(this.mainRoom.links, function (x) { return x.id != _this.id && !x.nextToStorage && !x.nearSource && x.link && x.link.energy < x.minLevel; })) {
                    return this.link.energyCapacity;
                }
                else
                    return 0;
            }
            else if (this.drain && this.fill)
                return 400;
            else if (this.drain)
                return 0;
            else if (this.fill)
                return this.link.energyCapacity - 100;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyLink.prototype, "maxLevel", {
        get: function () {
            var _this = this;
            if (this.nextToStorage) {
                if (_.any(this.mainRoom.links, function (x) { return x.id != _this.id && !x.nextToStorage && !x.nearSource && x.link && x.link.energy < x.minLevel; })) {
                    return this.link.energyCapacity;
                }
                else
                    return 0;
            }
            else if (this.drain && this.fill)
                return 400;
            else if (this.drain)
                return 0;
            else if (this.fill)
                return this.link.energyCapacity;
        },
        enumerable: true,
        configurable: true
    });
    MyLink.prototype.tick = function () {
        if (this.nextToStorage) {
            var myLinkToFill = _.sortBy(_.filter(this.mainRoom.links, function (x) { return x.minLevel > x.link.energy; }), function (x) { return 800 - (x.minLevel - x.link.energy); })[0];
            if (myLinkToFill) {
                this.link.transferEnergy(myLinkToFill.link, Math.min(myLinkToFill.maxLevel - myLinkToFill.link.energy, this.link.energy));
            }
        }
        else {
            if (this.link.energy > this.maxLevel) {
                var myLinkToFill = _.sortBy(_.filter(this.mainRoom.links, function (x) { return !x.nextToStorage && x.minLevel > x.link.energy; }), function (x) { return 800 - (x.minLevel - x.link.energy); })[0];
                if (myLinkToFill) {
                    this.link.transferEnergy(myLinkToFill.link, Math.min(myLinkToFill.maxLevel - myLinkToFill.link.energy, this.link.energy - this.maxLevel));
                }
                else {
                    myLinkToFill = _.filter(this.mainRoom.links, function (x) { return x.nextToStorage; })[0];
                    if (myLinkToFill) {
                        this.link.transferEnergy(myLinkToFill.link, Math.min(myLinkToFill.link.energyCapacity - myLinkToFill.link.energy, this.link.energy - this.maxLevel));
                    }
                }
            }
        }
    };
    return MyLink;
}());
var SpawnManager = (function () {
    function SpawnManager(mainRoom, memory) {
        this.mainRoom = mainRoom;
        this._spawns = { time: 0, spawns: null };
        this.queue = [];
        this.mainRoom = mainRoom;
        if (myMemory['profilerActive']) {
            this.spawn = profiler.registerFN(this.spawn, 'SpawnManager.spawn');
        }
    }
    Object.defineProperty(SpawnManager.prototype, "memory", {
        get: function () {
            return this.accessMemory();
        },
        enumerable: true,
        configurable: true
    });
    SpawnManager.prototype.accessMemory = function () {
        if (this.mainRoom.memory.spawnManager == null)
            this.mainRoom.memory.spawnManager = {
                debug: false,
                verbose: false,
                queue: null
            };
        return this.mainRoom.memory.spawnManager;
    };
    Object.defineProperty(SpawnManager.prototype, "canSpawn", {
        get: function () {
            return _.any(this.spawns, function (x) { return x.spawning == null; });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpawnManager.prototype, "isBusy", {
        get: function () {
            //return false;
            return this.queue.length >= 3 || _.filter(this.spawns, function (x) { return x.spawning == null; }).length <= this.queue.length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpawnManager.prototype, "spawns", {
        get: function () {
            var _this = this;
            if (this._spawns.time < Game.time)
                this._spawns = {
                    time: Game.time, spawns: _.filter(Game.spawns, function (x) { return x.room.name == _this.mainRoom.name; })
                };
            return this._spawns.spawns;
        },
        enumerable: true,
        configurable: true
    });
    SpawnManager.prototype.addToQueue = function (body, memory, count, priority) {
        if (count === void 0) { count = 1; }
        if (priority === void 0) { priority = false; }
        for (var i = 0; i < count; i++) {
            if (priority)
                this.queue.unshift({ body: body, memory: memory });
            else
                this.queue.push({ body: body, memory: memory });
        }
    };
    SpawnManager.prototype.spawn = function () {
        if (!this.canSpawn) {
            this.queue = [];
            return;
        }
        if (this.memory.debug)
            this.memory.queue = JSON.parse(JSON.stringify(this.queue));
        if (this.queue.length == 0) {
            this.isIdle = true;
            this.memory.sleepingUntil = Game.time + 10;
            return;
        }
        for (var idx in this.spawns) {
            var spawn = this.spawns[idx];
            if (this.queue.length == 0) {
                break;
            }
            var queueItem = this.queue[0];
            // TODO not only try the last queue item
            if (spawn.spawning == null) {
                var creepMemory = queueItem.memory;
                if (!creepMemory.mainRoomName)
                    creepMemory.mainRoomName = this.mainRoom.name;
                if (!Colony.memory.creepIdx)
                    Colony.memory.creepIdx = 0;
                if (Body.getFromBodyArray(_.map(queueItem.body, function (b) { return { boost: null, type: b, hits: 100 }; })).costs > this.mainRoom.room.energyCapacityAvailable) {
                    console.log('SpawnERROR: Creep larger than maxSpawnEnergy');
                    console.log('SpawnERROR: Role: ' + creepMemory.role);
                }
                var result = spawn.createCreep(queueItem.body, (++Colony.memory.creepIdx).toString(), creepMemory);
                if (_.isString(result))
                    this.queue.shift();
            }
            else {
            }
        }
        this.queue = [];
    };
    return SpawnManager;
}());
/// <reference path="../body.ts" />
var ConstructorDefinition;
(function (ConstructorDefinition) {
    function getDefinition(maxEnergy) {
        var body = new Body();
        body.work = 1;
        body.carry = 2;
        body.move = 2;
        var remainingEnergy = Math.min(maxEnergy, maxEnergy);
        var remaining = remainingEnergy - 300;
        if (remaining >= 50) {
            body.carry++;
            remaining -= 50;
        }
        while (remaining >= 150 && body.getBody().length < (50 - 3)) {
            if (remaining >= 350 && body.getBody().length < (50 - 6)) {
                body.work++;
                body.carry++;
                body.carry++;
                body.carry++;
                body.move++;
                body.move++;
                remaining -= 350;
            }
            else if (remaining >= 150 && body.getBody().length < (50 - 3)) {
                body.carry++;
                body.carry++;
                body.move++;
                remaining -= 150;
            }
            else
                break;
        }
        return body;
    }
    ConstructorDefinition.getDefinition = getDefinition;
})(ConstructorDefinition || (ConstructorDefinition = {}));
/// <reference path="../myCreep.ts" />
var Builder = (function (_super) {
    __extends(Builder, _super);
    function Builder(name, mainRoom) {
        _super.call(this, name);
        this.name = name;
        this.mainRoom = mainRoom;
        this.autoFlee = true;
        if (myMemory['profilerActive']) {
            this.myTick = profiler.registerFN(this.myTick, 'Builder.tick');
            this.construct = profiler.registerFN(this.construct, 'Builder.construct');
            this.upgrade = profiler.registerFN(this.upgrade, 'Builder.upgrade');
            this.fillUp = profiler.registerFN(this.fillUp, 'Builder.fillUp');
        }
        this.target = Game.getObjectById(this.memory.targetId);
        if (this.target != null) {
            this.targetPosition = this.target.pos;
            this.memory.targetPosition = this.targetPosition;
        }
        else if (this.creep.memory.targetPosition != null) {
            this.targetPosition = new RoomPosition(this.memory.targetPosition.x, this.memory.targetPosition.y, this.memory.targetPosition.roomName);
            if (Game.rooms[this.targetPosition.roomName] != null) {
                var rampart = _.filter(this.targetPosition.lookFor(LOOK_STRUCTURES), function (s) { return s.structureType == STRUCTURE_RAMPART && s.hits == 1; })[0];
                if (rampart) {
                    this.creep.say('RAMPART');
                    Colony.getRoom(this.targetPosition.roomName).repairStructures[rampart.id] = { id: rampart.id, pos: this.targetPosition, hits: rampart.hits, hitsMax: 1000000, sT: rampart.structureType };
                }
                this.targetPosition = null;
                this.target = null;
                this.memory.targetId = null;
                this.memory.targetPosition = null;
                this.memory.path = null;
            }
        }
    }
    Builder.prototype.construct = function () {
        if (this.targetPosition && !this.creep.pos.inRangeTo(this.targetPosition, 3)) {
            this.moveTo({ pos: this.targetPosition, range: 3 });
        }
        else {
            var result = this.creep.build(this.target);
            if (result == ERR_RCL_NOT_ENOUGH)
                this.target.remove();
        }
    };
    Builder.prototype.upgrade = function () {
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
        if (this.mainRoom.managers.constructionManager.constructions.length == 0)
            this.recycle();
    };
    Builder.prototype.fillUp = function () {
        var _this = this;
        if (!this.pickUpEnergy(3)) {
            if (!this.mainRoom.mainContainer)
                this.memory.fillupContainerId = this.mainRoom.spawns[0].id;
            if (!this.memory.fillupContainerId) {
                if (this.creep.room.name == this.mainRoom.name)
                    var container = this.mainRoom.mainContainer;
                else {
                    var possbibleContainers = _.map(_.filter(this.myRoom.mySources, function (s) { return (s.hasKeeper == false || !s.keeper.lair || s.keeper.lair.ticksToSpawn > 100 || s.keeper.creep && s.keeper.creep.hits <= 100) && s.container; }), function (s) { return s.container; });
                    container = _.sortBy(possbibleContainers, function (x) { return x.pos.getRangeTo(_this.creep.pos); })[0];
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
                    var container_1 = Game.getObjectById(this.memory.fillupContainerId);
                    if (this.creep.withdraw(container_1, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(container_1);
                }
            }
            else if (this.creep.room.name != this.mainRoom.name || this.isOnEdge) {
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
    };
    Builder.prototype.myTick = function () {
        this.creep.carry.energy == this.creep.carryCapacity || !this.pickUpEnergy(1) && (this.creep.carry.energy < this.body.work * BUILD_POWER || !this.pickUpEnergy());
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
    };
    return Builder;
}(MyCreep));
var Manager = (function () {
    function Manager() {
    }
    Manager.prototype.preTick = function () {
        this._preTick();
    };
    Manager.prototype._preTick = function () {
    };
    Manager.prototype.tick = function () {
        this._tick();
    };
    Manager.prototype._tick = function () {
    };
    Manager.prototype.postTick = function () {
        this._postTick();
    };
    Manager.prototype._postTick = function () {
    };
    return Manager;
}());
/// <reference path="../creeps/constructor/constructorDefinition.ts" />
/// <reference path="../creeps/constructor/builder.ts" />
/// <reference path="./manager.ts" />
var ConstructionManager = (function () {
    function ConstructionManager(mainRoom) {
        this.mainRoom = mainRoom;
        this._constructions = { time: -11, constructions: [] };
        if (myMemory['profilerActive']) {
            this.preTick = profiler.registerFN(this.preTick, 'ConstructionManager.preTick');
            this.tick = profiler.registerFN(this.tick, 'ConstructionManager.tick');
        }
        this.maxCreeps = 2;
    }
    Object.defineProperty(ConstructionManager.prototype, "creeps", {
        get: function () {
            if (this._creeps == null || this._creeps.time < Game.time) {
                this._creeps = {
                    time: Game.time, creeps: this.mainRoom.creepsByRole('builder')
                };
            }
            //console.log('Constructor length: ' + _.size(this._creeps.creeps));
            //console.log('Constructor[0]: ' + this._creeps.creeps);
            return this._creeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConstructionManager.prototype, "idleCreeps", {
        get: function () {
            if (this._idleCreeps == null || this._idleCreeps.time < Game.time)
                this._idleCreeps = {
                    time: Game.time, creeps: _.filter(this.creeps, function (c) { return c.memory.targetPosition == null && c.carry.energy > 0; })
                };
            return this._idleCreeps.creeps;
        },
        set: function (value) {
            if (this._idleCreeps)
                if (value == null)
                    this._idleCreeps.creeps = [];
                else
                    this._idleCreeps.creeps = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConstructionManager.prototype, "constructions", {
        get: function () {
            if (this._constructions.time < Game.time) {
                this._constructions.time = Game.time;
                var myRoomNames_1 = _.map(this.mainRoom.allRooms, function (x) { return x.name; });
                var constructionSites = _.filter(Game.constructionSites, function (x) { return myRoomNames_1.indexOf(x.pos.roomName) >= 0; });
                var extensions = _.filter(constructionSites, function (c) { return c.structureType == STRUCTURE_EXTENSION; });
                if (extensions.length > 0) {
                    this._constructions.constructions = extensions;
                }
                else {
                    var everythingButRoads = _.filter(constructionSites, function (c) { return c.structureType != STRUCTURE_ROAD; });
                    if (everythingButRoads.length > 0)
                        this._constructions.constructions = everythingButRoads;
                    else
                        this._constructions.constructions = constructionSites;
                }
            }
            return this._constructions.constructions;
        },
        enumerable: true,
        configurable: true
    });
    ConstructionManager.prototype.preTick = function () {
        //if (this.mainRoom.spawnManager.isBusy)
        //    return;
        //console.log('Construction Manager ' + this.mainRoom.name + ' IdleCreeps: ' + this.idleCreeps.length);
        if (this.idleCreeps.length == 0 && this.mainRoom.spawnManager.isBusy)
            return;
        if (this.constructions.length > 0 && (this.creeps.length < this.maxCreeps || this.idleCreeps.length > 0)) {
            for (var idx in this.idleCreeps) {
                var creep = this.idleCreeps[idx];
                var nearestConstruction = _.sortByAll(this.constructions, [function (x) { return x.pos.roomName == creep.room.name ? 0 : 1; }, function (x) { return Game.map.findRoute(x.pos.roomName, creep.room); }, function (x) { return Math.pow((x.pos.x - creep.pos.x), 2) + (Math.pow((x.pos.y - creep.pos.y), 2)); }])[0];
                creep.memory.targetId = nearestConstruction.id;
                creep.memory.targetPosition = nearestConstruction.pos;
            }
            this.idleCreeps = [];
            if (this.mainRoom.mainContainer == null && this.mainRoom.room.energyAvailable == this.mainRoom.room.energyCapacityAvailable && this.mainRoom.spawnManager.queue.length < 1)
                var maxCreeps = Math.min(this.creeps.length + 1, 2);
            else
                maxCreeps = this.maxCreeps;
            this.mainRoom.spawnManager.addToQueue(ConstructorDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'builder', targetId: null, targetPosition: null }, Math.min(maxCreeps, _.size(_.filter(this.mainRoom.sources, function (x) { return !x.hasKeeper; }))) - this.creeps.length);
        }
    };
    ConstructionManager.prototype.tick = function () {
        var _this = this;
        try {
            this.creeps.forEach(function (c) { return new Builder(c.name, _this.mainRoom).tick(); });
        }
        catch (e) {
            console.log(e.stack);
        }
        ;
    };
    return ConstructionManager;
}());
var RepairerDefinition;
(function (RepairerDefinition) {
    function getDefinition(maxEnergy) {
        var body = new Body();
        var remainingEnergy = Math.min(maxEnergy, 3500);
        if (remainingEnergy < 350) {
            body.work = 1;
            body.carry = 2;
            body.move = 2;
        }
        else {
            var basicModulesCount = ~~(remainingEnergy / 350); //work,carry,carry,move,move
            if (basicModulesCount > 8)
                basicModulesCount = 8;
            body.work = 1 * basicModulesCount;
            body.carry = 3 * basicModulesCount;
            body.move = 2 * basicModulesCount;
            var remaining = remainingEnergy - 350 * basicModulesCount;
            remaining = Math.min(remaining, 300);
        }
        return body;
    }
    RepairerDefinition.getDefinition = getDefinition;
})(RepairerDefinition || (RepairerDefinition = {}));
/// <reference path="../myCreep.ts" />
var Repairer = (function (_super) {
    __extends(Repairer, _super);
    function Repairer(name, mainRoom) {
        _super.call(this, name);
        this.name = name;
        this.mainRoom = mainRoom;
        this.autoFlee = true;
        if (myMemory['profilerActive']) {
            this.myTick = profiler.registerFN(this.myTick, 'Repairer.tick');
            this.pickUpEnergy = profiler.registerFN(this.pickUpEnergy, 'Repairer.pickupEnergy');
            this.getEmergencyTarget = profiler.registerFN(this.getEmergencyTarget, 'Repairer.getEmergencyTarget');
            this.getTarget = profiler.registerFN(this.getTarget, 'Repairer.getTarget');
            this.updateTarget = profiler.registerFN(this.updateTarget, 'Repairer.updateTarget');
            this.repair = profiler.registerFN(this.repair, 'Repairer.repair');
            this.refill = profiler.registerFN(this.refill, 'Repairer.refill');
            this.roadWork = profiler.registerFN(this.roadWork, 'Repairer.roadWork');
        }
    }
    Object.defineProperty(Repairer.prototype, "repairCost", {
        get: function () {
            if (this._repairCost == null)
                this._repairCost = this.repairPower * REPAIR_COST;
            return this._repairCost;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Repairer.prototype, "repairPower", {
        get: function () {
            if (this._repairPower == null)
                this._repairPower = this.creep.getActiveBodyparts(WORK) * REPAIR_POWER;
            return this._repairPower;
        },
        enumerable: true,
        configurable: true
    });
    Repairer.prototype.getEmergencyTarget = function () {
        var myRoom = Colony.getRoom(this.creep.room.name);
        if (myRoom)
            var target = _.sortBy(myRoom.emergencyRepairStructures, function (x) { return x.hits; })[0];
        return target;
    };
    Repairer.prototype.pickUpEnergy = function () {
        var _this = this;
        var resources = _.filter(Colony.getRoom(this.creep.room.name).resourceDrops, function (r) { return r.resourceType == RESOURCE_ENERGY; });
        var energy = _.sortBy(_.filter(resources, function (r) { return r.pos.inRangeTo(_this.creep.pos, 4); }), function (r) { return r.pos.getRangeTo(_this.creep.pos); })[0];
        if (energy != null) {
            if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(energy);
            return true;
        }
        return false;
    };
    Repairer.prototype.getTarget = function (myRoom) {
        //if (this.memory.targetCheckTime != null && this.memory.targetCheckTime + 20 > Game.time) {
        //    return;
        //}
        //this.memory.targetCheckTime = Game.time;
        var nonWalls = _.filter(myRoom.repairStructures, function (s) { return s.hits < s.hitsMax; });
        var repairStructures = _.values(nonWalls.length > 0 ? nonWalls : myRoom.repairWalls);
        var target = _.sortBy(_.filter(repairStructures, RepairManager.targetDelegate), function (x) { return x.hits; })[0];
        if (target) {
            this.memory.targetId = target.id;
            this.memory.isEmergency = false;
        }
        else {
            target = _.sortBy(_.filter(repairStructures, function (s) { return !RepairManager.forceStopRepairDelegate(s) && (s.sT == STRUCTURE_WALL || s.sT == STRUCTURE_RAMPART); }), function (x) { return x.hits; })[0];
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
    };
    Repairer.prototype.updateTarget = function () {
        var target = Game.getObjectById(this.memory.targetId);
        if (target == null && Game.rooms[this.myRoom.name])
            delete this.myRoom.memory.rs[this.memory.targetId];
        else if (target && this.myRoom.memory.rs[target.id])
            this.myRoom.memory.rs[target.id].hits = target.hits;
    };
    Repairer.prototype.repair = function () {
        var myRoom = Colony.getRoom(this.creep.room.name);
        if (this.creep.room.name != this.memory.roomName || this.isOnEdge) {
            this.moveTo({ pos: new RoomPosition(25, 25, this.memory.roomName), range: 20 });
        }
        else {
            if (this.creep.room.name == this.memory.roomName && this.memory.targetId == null) {
                var target = this.getEmergencyTarget();
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
                var structure = Game.getObjectById(this.memory.targetId);
                if (structure == null) {
                    this.memory.targetId = null;
                }
                else {
                    if (!this.creep.pos.inRangeTo(structure.pos, 3))
                        this.moveTo({ pos: structure.pos, range: 3 });
                    this.creep.repair(structure);
                    if (structure.hitsMax - structure.hits <= this.repairPower) {
                        delete this.myRoom.memory.rs[structure.id];
                        delete this.myRoom.memory.rw[structure.id];
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
            else if (this.memory.roomName != this.mainRoom.name)
                this.recycle();
        }
    };
    Repairer.prototype.roadWork = function () {
        var _this = this;
        var roadDummy = _.filter(this.myRoom.repairStructures, function (r) { return _this.creep.pos.inRangeTo(RoomPos.fromObj(r.pos), 3) && r.sT == STRUCTURE_ROAD && r.hits < r.hitsMax; })[0];
        if (roadDummy) {
            var road = Game.getObjectById(roadDummy.id);
            if (road) {
                this.creep.say('RoadWork', true);
                this.creep.repair(road);
                if (road.hitsMax - road.hits <= this.repairPower)
                    delete this.myRoom.repairStructures[road.id];
                return true;
            }
        }
        return false;
    };
    Repairer.prototype.refill = function () {
        var _this = this;
        this.memory.targetId = null;
        if (!this.memory.fillupContainerId && this.myRoom.name != this.mainRoom.name) {
            var possbibleContainers = _.map(_.filter(this.myRoom.mySources, function (s) { return (s.hasKeeper == false || !s.keeper || !s.keeper.lair || s.keeper.lair.ticksToSpawn > 100 || s.keeper.creep && s.keeper.creep.hits <= 100) && s.container; }), function (s) { return s.container; });
            var container = _.sortBy(possbibleContainers, function (x) { return x.pos.getRangeTo(_this.creep.pos); })[0];
            if (container)
                this.memory.fillupContainerId = container.id;
        }
        if (this.memory.fillupContainerId) {
            var container = Game.getObjectById(this.memory.fillupContainerId);
            if (!container)
                this.memory.fillupContainerId = null;
            if (container && this.creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                this.moveTo({ pos: container.pos, range: 3 });
        }
        else {
            var closestMainRoom = Colony.mainRooms[_.min(this.myRoom.memory.mrd, function (d) { return d.d; }).n];
            if (!closestMainRoom && !closestMainRoom.mainContainer)
                closestMainRoom = this.mainRoom;
            if (closestMainRoom && closestMainRoom.mainContainer) {
                this.memory.fillupContainerId = closestMainRoom.mainContainer.id;
            }
        }
    };
    Repairer.prototype.myTick = function () {
        var myRoom = Colony.getRoom(this.creep.room.name);
        if (this.creep.ticksToLive == 1499 && Colony.getRoom(this.memory.roomName)) {
            Colony.getRoom(this.memory.roomName).reloadRepairStructures(0.75);
        }
        if (this.memory.targetId)
            this.updateTarget();
        if (this.creep.carry.energy >= this.repairCost) {
            if (this.roadWork())
                return;
        }
        if (this.repairPower == 0)
            this.recycle();
        if (this.memory.state == 1 /* Repairing */ && this.creep.carry.energy == 0) {
            this.memory.state = 0 /* Refilling */;
            this.memory.fillupContainerId = null;
            this.memory.targetId = null;
        }
        else if (this.memory.state == 0 /* Refilling */ && this.creep.carry.energy > 0.5 * this.creep.carryCapacity) {
            this.memory.state = 1 /* Repairing */;
        }
        if (this.memory.state == 1 /* Repairing */) {
            this.repair();
        }
        else if (this.memory.state == 0 /* Refilling */) {
            this.refill();
        }
    };
    return Repairer;
}(MyCreep));
/// <reference path="../creeps/repairer/repairerDefinition.ts" />
/// <reference path="../creeps/repairer/repairer.ts" />
/// <reference path="./manager.ts" />
var RepairManager = (function () {
    function RepairManager(mainRoom) {
        this.mainRoom = mainRoom;
        this._creeps = { time: 0, creeps: null };
        this._idleCreeps = { time: 0, creeps: null };
        if (myMemory['profilerActive']) {
            this.preTick = profiler.registerFN(this.preTick, 'RepairManager.preTick');
            this.tick = profiler.registerFN(this.tick, 'RepairManager.tick');
        }
    }
    Object.defineProperty(RepairManager.prototype, "memory", {
        get: function () {
            return this.accessMemory();
        },
        enumerable: true,
        configurable: true
    });
    RepairManager.prototype.accessMemory = function () {
        if (this.mainRoom.memory.repairManager == null)
            this.mainRoom.memory.repairManager = {
                emergencyTargets: {},
                repairTargets: {}
            };
        return this.mainRoom.memory.repairManager;
    };
    Object.defineProperty(RepairManager.prototype, "creeps", {
        get: function () {
            if (this._creeps.time < Game.time)
                this._creeps = {
                    time: Game.time, creeps: this.mainRoom.creepsByRole('repairer')
                };
            return this._creeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RepairManager.prototype, "idleCreeps", {
        get: function () {
            if (this._idleCreeps.time < Game.time)
                this._idleCreeps = {
                    time: Game.time, creeps: _.filter(this.creeps, function (c) { return c.memory.targetId == null; })
                };
            return this._creeps.creeps;
        },
        set: function (value) {
            if (value == null)
                this._idleCreeps.creeps = [];
            else
                this._idleCreeps.creeps = value;
        },
        enumerable: true,
        configurable: true
    });
    RepairManager.forceStopRepairDelegate = function (s) {
        return s.hits >= s.hitsMax; // || s.hits > 2000000;
        //return (s.structureType == STRUCTURE_WALL || s.structureType == STRUCTURE_RAMPART) && s.hits > 600000 || (s.hits >= s.hitsMax);
    };
    RepairManager.targetDelegate = function (s) {
        return (s.structureType != STRUCTURE_RAMPART && s.sT != STRUCTURE_RAMPART && s.structureType != STRUCTURE_WALL && s.sT != STRUCTURE_WALL && s.hits < s.hitsMax || (s.structureType == STRUCTURE_RAMPART || s.sT == STRUCTURE_RAMPART || s.structureType == STRUCTURE_WALL || s.sT == STRUCTURE_WALL) && s.hits < 100000) && s.hits < s.hitsMax;
    };
    RepairManager.emergencyTargetDelegate = function (s) {
        return (s.hits < s.hitsMax * 0.2 && (s.structureType == STRUCTURE_CONTAINER || s.sT == STRUCTURE_CONTAINER) || s.hits < 1000 && (s.structureType == STRUCTURE_ROAD || s.structureType == STRUCTURE_RAMPART || s.sT == STRUCTURE_ROAD || s.sT == STRUCTURE_RAMPART) && s.hits < 5000) && s.hits < s.hitsMax;
    };
    RepairManager.emergencyStopDelegate = function (s) {
        return ((s.structureType == STRUCTURE_WALL || s.structureType == STRUCTURE_RAMPART || s.sT == STRUCTURE_WALL || s.sT == STRUCTURE_RAMPART) && s.hits > 20000 || s.hits >= s.hitsMax && (s.structureType == STRUCTURE_ROAD || s.sT == STRUCTURE_ROAD) || s.hits > 0.5 * s.hitsMax && (s.structureType == STRUCTURE_CONTAINER || s.sT == STRUCTURE_CONTAINER)) || s.hits >= s.hitsMax;
    };
    RepairManager.prototype.preTick = function (myRoom) {
        if (this.mainRoom.spawnManager.isBusy || !this.mainRoom.mainContainer)
            return;
        if (myRoom.name == myRoom.mainRoom.name && myRoom.room.controller.level >= 3 || myRoom.room && _.size(myRoom.repairStructures) > 0) {
            var maxMainRoomCreeps = 1 + Math.max(0, this.mainRoom.room.controller.level - 8);
            var roomCreeps = _.filter(this.creeps, function (x) { return x.memory.roomName == myRoom.name; });
            if (roomCreeps.length < (myRoom.name == this.mainRoom.name ? maxMainRoomCreeps : 1)) {
                var definition = RepairerDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody();
                this.mainRoom.spawnManager.addToQueue(definition, { role: 'repairer', roomName: myRoom.name, state: 0 /* Refilling */ }, 1);
            }
        }
    };
    RepairManager.prototype.tick = function () {
        var _this = this;
        this.creeps.forEach(function (c) { return new Repairer(c.name, _this.mainRoom).tick(); });
    };
    return RepairManager;
}());
var UpgraderDefinition;
(function (UpgraderDefinition) {
    function getDefinition(maxEnergy, minCarry, maxWorkParts, resources) {
        if (minCarry === void 0) { minCarry = false; }
        if (maxWorkParts === void 0) { maxWorkParts = 50; }
        var body = new Body();
        var remainingEnergy = maxEnergy; // Math.min(maxEnergy, 1500);
        var basicModuleCount = ~~(remainingEnergy / 300);
        if (basicModuleCount * 2 > maxWorkParts)
            basicModuleCount = Math.floor(maxWorkParts / 2);
        if (basicModuleCount * 4 > 50) {
            basicModuleCount = Math.floor(50 / 4);
        }
        body.work = basicModuleCount * 2;
        body.carry = basicModuleCount * 1;
        body.move = basicModuleCount * 1;
        var remaining = maxEnergy - basicModuleCount * 300;
        while (remaining >= 100 && body.getBody().length <= 45 && body.work < maxWorkParts) {
            if (remaining >= 300) {
                body.work++;
                body.carry++;
                body.carry++;
                body.carry++;
                body.move++;
                remaining -= 300;
            }
            else if (remaining >= 150) {
                body.work++;
                body.move++;
                remaining -= 150;
            }
            else if (remaining >= 50) {
                body.carry++;
                remaining -= 50;
            }
            else
                break;
        }
        if (minCarry)
            body.carry = Math.min(Math.floor(body.getBody().length / 5), body.carry);
        if (resources) {
            var boostCompound = _.filter(_.sortByOrder(ReactionManager.BOOSTPOWERS['upgradeController'].resources, [function (r) { return r.resource; }], ['desc']), function (r) { return resources[r.resource] >= body.work * LAB_BOOST_MINERAL; })[0];
            if (boostCompound) {
                body.boosts[boostCompound.resource] = { compound: boostCompound.resource, amount: body.work };
            }
        }
        return body;
    }
    UpgraderDefinition.getDefinition = getDefinition;
})(UpgraderDefinition || (UpgraderDefinition = {}));
/// <reference path="../myCreep.ts" />
var Upgrader = (function (_super) {
    __extends(Upgrader, _super);
    function Upgrader(name, mainRoom) {
        _super.call(this, name);
        this.name = name;
        this.mainRoom = mainRoom;
        if (myMemory['profilerActive']) {
            this.myTick = profiler.registerFN(this.myTick, 'Upgrader.tick');
        }
    }
    Upgrader.prototype.upgrade = function () {
        var result = this.creep.upgradeController(this.creep.room.controller);
        //this.creep.say(result.toString());
        if (result == ERR_NOT_IN_RANGE) {
            this.creep.moveTo(this.creep.room.controller);
        }
    };
    Upgrader.prototype.refill = function () {
        var link = _.map(_.filter(this.mainRoom.links, function (x) { return x.nearController == true; }), function (x) { return x.link; })[0];
        if (link) {
            if (link.transferEnergy(this.creep) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(link);
        }
        else {
            var mainContainer = this.mainRoom.mainContainer;
            if (mainContainer != null) {
                if (mainContainer.store.energy > this.mainRoom.maxSpawnEnergy * 2 || this.mainRoom.room.controller.ticksToDowngrade < 2000)
                    if (this.creep.withdraw(mainContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(mainContainer);
            }
            else {
                if (this.mainRoom.spawnManager.isIdle || this.mainRoom.room.controller.ticksToDowngrade < 2000) {
                    for (var spawnName in Game.spawns) {
                        var spawn = Game.spawns[spawnName];
                    }
                    if (spawn.transferEnergy(this.creep) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(spawn);
                }
            }
        }
    };
    Upgrader.prototype.myTick = function () {
        var _this = this;
        if (this.creep.carry.energy >= _.sum(this.creep.body, function (x) { return x.type == WORK ? 1 : 0; })) {
            this.upgrade();
        }
        else if (!this.mainRoom.mainContainer || this.mainRoom.mainContainer.structureType != STRUCTURE_STORAGE || this.mainRoom.mainContainer.store.energy > 10000 || this.mainRoom.room.controller.ticksToDowngrade <= 5000) {
            if (!this.mainRoom)
                return;
            var resources = _.filter(Colony.getRoom(this.creep.room.name).resourceDrops, function (r) { return r.resourceType == RESOURCE_ENERGY; });
            var energy = _.filter(resources, function (r) { return r.pos.isNearTo(_this.creep.pos); })[0];
            if (energy != null && this.creep.carry.energy < this.creep.carryCapacity) {
                this.creep.pickup(energy);
            }
            else {
                this.refill();
            }
        }
    };
    return Upgrader;
}(MyCreep));
/// <reference path="../creeps/upgrader/upgraderDefinition.ts" />
/// <reference path="../creeps/upgrader/upgrader.ts" />
/// <reference path="./manager.ts" />
var UpgradeManager = (function () {
    function UpgradeManager(mainRoom) {
        this.mainRoom = mainRoom;
        this._creeps = { time: 0, creeps: null };
        if (myMemory['profilerActive']) {
            this.preTick = profiler.registerFN(this.preTick, 'UpgradeManager.preTick');
            this.tick = profiler.registerFN(this.tick, 'UpgradeManager.tick');
        }
    }
    Object.defineProperty(UpgradeManager.prototype, "creeps", {
        get: function () {
            if (this._creeps.time < Game.time)
                this._creeps = {
                    time: Game.time, creeps: this.mainRoom.creepsByRole('upgrader')
                };
            return this._creeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    UpgradeManager.prototype.preTick = function () {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if ((this.mainRoom.room.controller.ticksToDowngrade < 2000 || this.mainRoom.mainContainer != null && this.mainRoom.room.energyAvailable == this.mainRoom.room.energyCapacityAvailable) && (this.creeps.length == 0 && (this.mainRoom.mainContainer.structureType != STRUCTURE_STORAGE || this.mainRoom.mainContainer.store.energy >= 10000) || (_.sum(this.mainRoom.mainContainer.store) == this.mainRoom.mainContainer.storeCapacity || this.mainRoom.mainContainer.store.energy > 150000 || this.mainRoom.mainContainer.store.energy > 100000 && this.mainRoom.room.controller.level < 6 || this.mainRoom.mainContainer.store.energy > 15000 && this.mainRoom.room.controller.level < 5) && this.creeps.length < 5 && this.mainRoom.room.controller.level < 8)) {
            var definition = UpgraderDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, _.any(this.mainRoom.links, function (x) { return x.nearController; }), this.mainRoom.room.controller.level == 8 ? 15 : 50, this.mainRoom.managers.labManager.availablePublishResources);
            this.mainRoom.spawnManager.addToQueue(definition.getBody(), { role: 'upgrader', requiredBoosts: definition.boosts }, 1);
        }
    };
    UpgradeManager.prototype.tick = function () {
        var _this = this;
        this.creeps.forEach(function (c) { return new Upgrader(c.name, _this.mainRoom).tick(); });
    };
    return UpgradeManager;
}());
var SpawnFillerDefinition;
(function (SpawnFillerDefinition) {
    function getDefinition(maxEnergy) {
        var body = new Body();
        var remainingEnergy = Math.min(maxEnergy, 150 * 12);
        var basicModuleCount = ~~(remainingEnergy / 150);
        //basicModuleCount = (basicModuleCount > 8) ? 8 : basicModuleCount;
        body.carry = 2 * basicModuleCount;
        body.move = 1 * basicModuleCount;
        return body;
    }
    SpawnFillerDefinition.getDefinition = getDefinition;
})(SpawnFillerDefinition || (SpawnFillerDefinition = {}));
/// <reference path="../MyCreep.ts" />
var SpawnFiller = (function (_super) {
    __extends(SpawnFiller, _super);
    function SpawnFiller(name, mainRoom) {
        _super.call(this, name);
        this.name = name;
        this.mainRoom = mainRoom;
        if (myMemory['profilerActive']) {
            this.myTick = profiler.registerFN(this.myTick, 'SpawnFiller.tick');
        }
    }
    SpawnFiller.prototype.refill = function () {
        var _this = this;
        if (!this.mainRoom)
            return;
        //let resources = _.filter(Colony.getRoom(this.creep.room.name).resourceDrops, r => r.resourceType == RESOURCE_ENERGY);
        //let energy = _.filter(resources, r => (r.pos.x - this.creep.pos.x) ** 2 + (r.pos.y - this.creep.pos.y) ** 2 <= 16)[0];
        //if (energy != null && this.creep.carry.energy < this.creep.carryCapacity) {
        //    if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
        //        this.creep.moveTo(energy);
        //}
        //else {
        var energy = _.filter(this.myRoom.resourceDrops, function (r) { return r.resourceType == RESOURCE_ENERGY && _.any(_this.mainRoom.spawns, function (s) { return s.pos.isNearTo(r.pos); }); })[0];
        if (energy) {
            if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(energy);
        }
        else {
            var mainContainer = this.mainRoom.mainContainer;
            if (mainContainer != null && mainContainer.store.energy > 0) {
                if (mainContainer.transfer(this.creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(mainContainer);
            }
            else if (this.mainRoom.room.terminal && this.mainRoom.room.terminal.store.energy > 0) {
                if (this.mainRoom.room.terminal.transfer(this.creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(this.mainRoom.room.terminal);
            }
            else {
                var link = _.filter(this.mainRoom.links, function (l) { return l.nextToStorage; })[0];
                if (link && link.link && link.link.energy > 0 && this.creep.withdraw(link.link, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(link.link);
            }
        }
        //}
    };
    SpawnFiller.prototype.getTarget = function (currentTarget) {
        var _this = this;
        if (currentTarget)
            this.memory.targetStructureId = null;
        if (this.memory.targetStructureId) {
            var target = Game.getObjectById(this.memory.targetStructureId);
            if (target != null && target.energy == target.energyCapacity)
                target = null;
        }
        var targets = this.creep.room.find(FIND_MY_STRUCTURES, { filter: function (s) { return (!currentTarget || currentTarget.id != s.id) && (s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_EXTENSION) && s.energy < s.energyCapacity && !_.any(_this.mainRoom.managers.spawnFillManager.creeps, function (c) { return c.name != _this.creep.name && c.memory.targetStructureId && c.memory.targetStructureId == s.id; }); } });
        if (target == null)
            target = _.filter(targets, function (t) { return t.pos.inRangeTo(_this.creep.pos, 1); })[0];
        if (target == null)
            target = _.sortBy(targets, function (t) { return t.pos.getRangeTo(_this.creep.pos); })[0];
        if (target == null) {
            this.memory.targetStructureId = null;
            this.refill();
        }
        else
            this.memory.targetStructureId = target.id;
        return target;
    };
    SpawnFiller.prototype.myTick = function () {
        var _this = this;
        if (this.creep.ticksToLive <= 20) {
            if (this.creep.carry.energy > 0) {
                if (this.creep.transfer(this.mainRoom.energyDropOffStructure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(this.mainRoom.energyDropOffStructure);
            }
            else {
                if (this.mainRoom.spawns[0].recycleCreep(this.creep))
                    this.creep.moveTo(this.mainRoom.spawns[0]);
            }
        }
        else if (this.creep.carry.energy < this.creep.carryCapacity && _.filter(this.mainRoom.myRoom.resourceDrops, function (r) { return r.resourceType == RESOURCE_ENERGY && r.pos.isNearTo(_this.creep.pos); }).length > 0) {
            var energy = _.filter(this.mainRoom.myRoom.resourceDrops, function (r) { return r.resourceType == RESOURCE_ENERGY && r.pos.isNearTo(_this.creep.pos); })[0];
            if (energy) {
                this.creep.pickup(energy);
            }
        }
        else {
            if (this.creep.carry.energy == 0 || this.creep.room.energyAvailable == this.creep.room.energyCapacityAvailable) {
                this.memory.targetStructureId = null;
                this.refill();
            }
            else {
                if (this.mainRoom.mainContainer && this.creep.carry.energy < this.creep.carryCapacity && this.mainRoom.mainContainer.store.energy > 0 && this.creep.pos.isNearTo(this.mainRoom.mainContainer.pos)) {
                    this.creep.withdraw(this.mainRoom.mainContainer, RESOURCE_ENERGY);
                }
                if (this.mainRoom.room.energyAvailable < this.mainRoom.room.energyCapacityAvailable) {
                    var target = this.getTarget();
                    var result = this.creep.transfer(target, RESOURCE_ENERGY);
                    if (result == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(target);
                    else if (result == OK && target.energyCapacity - target.energy < this.creep.carry.energy) {
                        target = this.getTarget(target);
                        if (!this.creep.pos.isNearTo(target))
                            this.creep.moveTo(target);
                    }
                }
                else if (this.creep.carry.energy < this.creep.carryCapacity) {
                    this.refill();
                }
            }
        }
    };
    return SpawnFiller;
}(MyCreep));
/// <reference path="../creeps/spawnFiller/spawnFillerDefinition.ts" />
/// <reference path="../creeps/spawnFiller/spawnFiller.ts" />
/// <reference path="./manager.ts" />
var SpawnFillManager = (function () {
    function SpawnFillManager(mainRoom) {
        this.mainRoom = mainRoom;
        this._creeps = { time: 0, creeps: null };
        if (myMemory['profilerActive']) {
            this.preTick = profiler.registerFN(this.preTick, 'SpawnFillManager.preTick');
            this.tick = profiler.registerFN(this.tick, 'SpawnFillManager.tick');
        }
    }
    Object.defineProperty(SpawnFillManager.prototype, "creeps", {
        get: function () {
            if (this._creeps.time < Game.time)
                this._creeps = {
                    time: Game.time, creeps: this.mainRoom.creepsByRole('spawnFiller')
                };
            return this._creeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    SpawnFillManager.prototype.preTick = function () {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if (this.mainRoom.mainContainer != null && _.size(_.filter(this.mainRoom.creeps, function (c) { return c.memory.role == 'spawnFiller' && (c.ticksToLive > 70 || c.ticksToLive === undefined); })) < 2) {
            this.mainRoom.spawnManager.addToQueue(SpawnFillerDefinition.getDefinition(this.creeps.length == 0 ? this.mainRoom.room.energyAvailable : this.mainRoom.maxSpawnEnergy).getBody(), { role: 'spawnFiller' }, 1, true);
        }
    };
    SpawnFillManager.prototype.tick = function () {
        var _this = this;
        this.creeps.forEach(function (c) { return new SpawnFiller(c.name, _this.mainRoom).tick(); });
    };
    return SpawnFillManager;
}());
var EnergyHarvesterDefinition;
(function (EnergyHarvesterDefinition) {
    function getHarvesterDefinition(maxEnergy, mySource) {
        var body = new Body();
        body.work = mySource.rate / HARVEST_POWER;
        body.carry = body.work;
        body.move = body.work;
        var count = 1;
        if (body.costs > maxEnergy) {
            count = Math.ceil(body.costs / maxEnergy);
            body.work = Math.floor(body.work / count);
            body.carry = Math.floor(body.carry / count);
            body.move = Math.floor(body.move / count);
        }
        if (body.costs + BODYPART_COST.carry + BODYPART_COST.move <= maxEnergy) {
            body.move++;
            body.carry++;
        }
        count = Math.ceil(mySource.rate / body.energyHarvestingRate);
        return { count: Math.min(mySource.maxHarvestingSpots, count), body: body };
    }
    function getMinerDefinition(maxEnergy, mySource, resources) {
        var baseBody = new Body();
        if (maxEnergy == 300) {
            baseBody.work = 2;
            baseBody.move = 2;
            return {
                body: baseBody, count: mySource.rate / baseBody.energyHarvestingRate
            };
        }
        if (mySource.link || !mySource.hasKeeper && !mySource.containerPosition)
            baseBody.carry = 2;
        if (mySource.hasKeeper) {
            baseBody.heal = 2;
            baseBody.move = 1;
        }
        var remainingEnergy = maxEnergy - baseBody.costs;
        if (remainingEnergy < BODYPART_COST.work + BODYPART_COST.move)
            return { count: 0, body: baseBody };
        var workBody = new Body();
        workBody.work = mySource.rate / HARVEST_POWER;
        if (mySource.hasKeeper)
            workBody.work *= 2;
        if (resources) {
            var boostCompound = _.filter(_.sortByOrder(ReactionManager.BOOSTPOWERS['harvest'].resources, [function (r) { return r.resource; }], ['desc']), function (r) { return resources[r.resource] >= Math.ceil(workBody.work / r.factor) * LAB_BOOST_MINERAL; })[0];
            if (boostCompound) {
                workBody.work = Math.ceil(workBody.work / boostCompound.factor);
                workBody.boosts[boostCompound.resource] = { compound: boostCompound.resource, amount: workBody.work };
            }
        }
        workBody.move = Math.ceil(workBody.work / 2);
        var count = 1;
        if (workBody.costs > remainingEnergy) {
            count = Math.ceil(workBody.costs / maxEnergy);
            workBody.work = Math.floor(workBody.work / count);
            workBody.move = Math.floor(workBody.work / 2);
            _.forEach(workBody.boosts, function (b) { return b.amount = Math.min(b.amount, workBody.work); });
        }
        workBody.move += baseBody.move;
        workBody.heal += baseBody.heal;
        workBody.carry += baseBody.carry;
        count = Math.ceil(mySource.rate / workBody.energyHarvestingRate);
        return { count: Math.min(count, mySource.maxHarvestingSpots), body: workBody };
    }
    function getDefinition(maxEnergy, mySource, needsToDeliver, resources) {
        if (needsToDeliver === void 0) { needsToDeliver = false; }
        if (needsToDeliver)
            return getHarvesterDefinition(maxEnergy, mySource);
        else
            return getMinerDefinition(maxEnergy, mySource, resources);
    }
    EnergyHarvesterDefinition.getDefinition = getDefinition;
})(EnergyHarvesterDefinition || (EnergyHarvesterDefinition = {}));
/// <reference path="../../../colony/colony.ts" />
/// <reference path="../myCreep.ts" />
var EnergyHarvester = (function (_super) {
    __extends(EnergyHarvester, _super);
    function EnergyHarvester(name, mainRoom) {
        _super.call(this, name);
        this.name = name;
        this.mainRoom = mainRoom;
        this._source = { time: -1, source: null };
        //tryRepair(): boolean {
        //    let structures = Colony.getRoom(this.creep.room.name).repairStructures;
        //    let target = _.filter(structures, s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_WALL && (s.pos.x - this.creep.pos.x) ** 2 + (s.pos.y - this.creep.pos.y) ** 2 <= 9)[0];
        //    if (target) {
        //        this.creep.repair(target);
        //        return true;
        //    }
        //    return false;
        //}
        //tryBuild(): boolean {
        //    let target = _.filter(Game.constructionSites, c => c.pos.roomName == this.creep.room.name && (c.pos.x - this.creep.pos.x) ** 2 + (c.pos.y - this.creep.pos.y) ** 2 <= 9)[0];
        //    if (target) {
        //        this.creep.build(target);
        //        return true;
        //    }
        //    return false;
        //}
        this.healed = false;
        this.autoFlee = true;
        if (myMemory['profilerActive']) {
            this.myTick = profiler.registerFN(this.myTick, 'EnergyHarvester.tick');
            this.construct = profiler.registerFN(this.construct, 'EnergyHarvester.construct');
            this.repair = profiler.registerFN(this.repair, 'EnergyHarvester.repair');
            this.harvest = profiler.registerFN(this.harvest, 'EnergyHarvester.harvest');
            this.tryMoveNearSource = profiler.registerFN(this.tryMoveNearSource, 'EnergyHarvester.tryMoveNearSource');
            this.tryMoveOnContainer = profiler.registerFN(this.tryMoveOnContainer, 'EnergyHarvester.tryMoveOnContainer');
            this.tryTransfer = profiler.registerFN(this.tryTransfer, 'EnergyHarvester.tryTransfer');
        }
    }
    Object.defineProperty(EnergyHarvester.prototype, "source", {
        get: function () {
            if (this._source.time < Game.time)
                this._source = {
                    time: Game.time, source: Game.getObjectById(this.memory.sourceId)
                };
            return this._source.source;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EnergyHarvester.prototype, "mySource", {
        get: function () {
            if (this._mySource == null || this._mySource.time < Game.time)
                this._mySource = {
                    time: Game.time, mySource: this.mainRoom.sources[this.memory.sourceId]
                };
            return this._mySource.mySource;
        },
        enumerable: true,
        configurable: true
    });
    EnergyHarvester.prototype.reassignMainRoom = function () {
        var _this = this;
        var mainRoom = _.filter(Colony.mainRooms, function (r) { return _.any(r.sources, function (s) { return s.id == _this.memory.sourceId; }); })[0];
        if (mainRoom) {
            this.memory.mainRoomName = mainRoom.name;
            this.mainRoom = mainRoom;
            this._mySource = null;
        }
    };
    EnergyHarvester.prototype.createHarvestPath = function () {
        this.memory.path = PathFinder.search(this.creep.pos, { pos: this.mySource.pos, range: 1 }, { roomCallback: Colony.getTravelMatrix, plainCost: 2, swampCost: 10, maxOps: 10000 });
        this.memory.path.path.unshift(this.creep.pos);
    };
    EnergyHarvester.prototype.repair = function () {
        if (Game.time % 5 != 0)
            return;
        var repairPower = _.filter(this.creep.body, function (b) { return b.type == WORK; }).length * REPAIR_POWER;
        var repairCost = REPAIR_POWER * REPAIR_COST;
        if (this.mySource.container && RepairManager.emergencyTargetDelegate(this.mySource.container) && this.creep.carry.energy >= repairCost && this.mySource.container.hits < this.mySource.container.hitsMax - repairPower) {
            if (this.creep.repair(this.mySource.container) == OK) {
                var container = Game.getObjectById(this.mySource.container.id);
                if (container && this.myRoom.repairStructures[container.id]) {
                    if (container.hits == container.hitsMax)
                        delete this.myRoom.repairStructures[container.id];
                    else
                        this.myRoom.repairStructures[container.id].hits = container.hits;
                }
            }
            //this.creep.say('Repair');
            return true;
        }
        return false;
    };
    EnergyHarvester.prototype.construct = function () {
        if (this.mySource.container || this.mySource.link || this.mySource.hasKeeper)
            return false;
        else if (this.creep.carry.energy >= _.filter(this.creep.body, function (b) { return b.type == WORK; }).length * BUILD_POWER) {
            var pos = this.mySource.pos;
            //let constructions = <LookAtResultWithPos[]>this.mySource.room.lookForAtArea(LOOK_CONSTRUCTION_SITES, pos.y - 1, pos.x - 1, pos.y + 1, pos.x + 1, true);
            //console.log(JSON.stringify(constructions));
            var construction = this.mySource.pos.findInRange(FIND_CONSTRUCTION_SITES, 1)[0];
            if (construction) {
                this.creep.build(construction);
                //this.creep.say('Build');
                return true;
            }
            else {
                this.creep.pos.createConstructionSite(STRUCTURE_CONTAINER);
            }
        }
        return false;
    };
    EnergyHarvester.prototype.tryMoveOnContainer = function () {
        if (this.mySource.container && !this.creep.pos.isEqualTo(this.mySource.container.pos) && this.mySource.container.pos.lookFor(LOOK_CREEPS).length == 0) {
            this.moveTo({ pos: this.mySource.container.pos, range: 1 }, {
                roomCallback: Colony.getCustomMatrix({ ignoreKeeperSourceId: this.mySource.id })
            });
            return true;
        }
        return false;
    };
    EnergyHarvester.prototype.tryMoveNearSource = function () {
        if (!this.creep.pos.isNearTo(this.mySource.pos)) {
            this.moveTo({ pos: this.mySource.pos, range: 1 }, {
                roomCallback: Colony.getCustomMatrix({ ignoreKeeperSourceId: this.mySource.id })
            });
            return true;
        }
        return false;
    };
    EnergyHarvester.prototype.tryTransfer = function () {
        if (this.mySource.link && this.creep.carry.energy > this.creep.carryCapacity - 2 * Body.getFromCreep(this.creep).energyHarvestingRate) {
            //this.creep.say('Link');
            if (this.creep.transfer(this.mySource.link, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.mySource.link);
            return true;
        }
        return false;
    };
    EnergyHarvester.prototype.harvest = function () {
        if (!this.healed && !this.repair() && !this.construct()) {
            this.tryMoveOnContainer() || this.tryMoveNearSource() || this.creep.harvest(this.mySource.source);
            this.tryTransfer();
        }
    };
    EnergyHarvester.prototype.deliver = function () {
        if (this.creep.transfer(this.mainRoom.energyDropOffStructure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
            this.moveTo({ pos: this.mainRoom.energyDropOffStructure.pos, range: 1 });
    };
    EnergyHarvester.prototype.myTick = function () {
        //this.creep.say('Tick');
        this.healed = false;
        if (this.mySource == null) {
            //this.creep.say('Reassign');
            this.reassignMainRoom();
        }
        if (!this.mySource) {
            //this.creep.say('No Source');
            return;
        }
        if (_.filter(this.creep.body, function (b) { return b.type == HEAL; }).length > 0 && this.creep.hits + _.filter(this.creep.body, function (b) { return b.type == HEAL; }).length * HEAL_POWER <= this.creep.hitsMax) {
            this.creep.heal(this.creep);
            //this.creep.say('Heal');
            this.healed = true;
        }
        //else if (this.creep.getActiveBodyparts(HEAL) > 0) {
        //    let surroundingCreep = this.creep.pos.findInRange<Creep>(FIND_MY_CREEPS, 1, { filter: (c: Creep) => this.creep.hits + this.creep.getActiveBodyparts(HEAL) * HEAL_POWER <= c.hitsMax })[0];
        //    if (surroundingCreep) {
        //        this.creep.heal(surroundingCreep);
        //        this.healed = true;
        //    }
        //}
        if (this.memory.state == null || this.memory.path == null || this.memory.state == 1 /* Delivering */ && this.creep.carry.energy == 0) {
            this.memory.state = 0 /* Harvesting */;
        }
        else if (this.memory.state == 0 /* Harvesting */ && _.sum(this.creep.carry) == this.creep.carryCapacity && !this.mySource.link && this.mainRoom.harvestersShouldDeliver) {
            if (!this.mainRoom.energyDropOffStructure) {
                return;
            }
            this.memory.state = 1 /* Delivering */;
        }
        if (this.memory.state == 0 /* Harvesting */) {
            //this.creep.say('State 1');
            this.harvest();
        }
        else if (this.memory.state == 1 /* Delivering */) {
            //this.creep.say('State 2');
            this.deliver();
        }
        else {
        }
    };
    return EnergyHarvester;
}(MyCreep));
var SourceCarrierDefinition;
(function (SourceCarrierDefinition) {
    function getDefinition(maxEnergy, requiredAmount, resources) {
        var body = new Body();
        body.carry = (requiredAmount / CARRY_CAPACITY);
        if (body.carry % 2 == 1)
            body.carry++;
        body.move = Math.ceil(body.carry / 2);
        var partDivider = Math.ceil((body.carry + body.move) / 50);
        var energyDivider = Math.ceil(body.costs / maxEnergy);
        var count = Math.max(partDivider, energyDivider);
        if (count > 1) {
            body.carry = Math.floor(body.carry / count);
            body.move = Math.ceil(body.carry / 2);
        }
        return { count: count, body: body };
    }
    SourceCarrierDefinition.getDefinition = getDefinition;
})(SourceCarrierDefinition || (SourceCarrierDefinition = {}));
/// <reference path="../myCreep.ts" />
/// <reference path="../../../colony/colony.ts" />
var SourceCarrier = (function (_super) {
    __extends(SourceCarrier, _super);
    function SourceCarrier(name, mainRoom) {
        _super.call(this, name);
        this.name = name;
        this.mainRoom = mainRoom;
        this.autoFlee = true;
        if (myMemory['profilerActive']) {
            this.myTick = profiler.registerFN(this.myTick, 'SourceCarrier.tick');
            this.pickup = profiler.registerFN(this.pickup, 'SourceCarrier.pickup');
        }
    }
    Object.defineProperty(SourceCarrier.prototype, "source", {
        get: function () {
            if (this._source == null || this._source.time < Game.time)
                this._source = {
                    time: Game.time, source: Game.getObjectById(this.memory.sourceId)
                };
            return this._source.source;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SourceCarrier.prototype, "mySource", {
        get: function () {
            if (this._mySource == null || this._mySource.time < Game.time)
                this._mySource = {
                    time: Game.time, mySource: this.mainRoom.sources[this.memory.sourceId]
                };
            return this._mySource.mySource;
        },
        enumerable: true,
        configurable: true
    });
    SourceCarrier.prototype.reassignMainRoom = function () {
        var _this = this;
        var mainRoom = _.filter(Colony.mainRooms, function (r) { return _.any(r.sources, function (s) { return s.id == _this.memory.sourceId; }); })[0];
        if (mainRoom) {
            this.memory.mainRoomName = mainRoom.name;
            this.mainRoom = mainRoom;
            this._mySource = null;
        }
    };
    SourceCarrier.prototype.pickup = function () {
        var _this = this;
        this.creep.say('1');
        if (this.memory.energyId && Game.getObjectById(this.memory.energyId) && Game.getObjectById(this.memory.energyId).pos.inRangeTo(this.creep.pos, 4)) {
            this.creep.say('2');
            var energy = Game.getObjectById(this.memory.energyId);
            if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
                this.moveTo({ pos: energy.pos, range: 1 }, {
                    roomCallback: Colony.getCustomMatrix({ ignoreAllKeepers: true })
                });
        }
        else {
            this.creep.say('3');
            delete this.memory.energyId;
            if (!this.creep.pos.inRangeTo(this.mySource.pos, 2) && !this.pickUpEnergy()) {
                this.creep.say('4');
                if (this.mySource.container && !this.creep.pos.inRangeTo(this.mySource.container.pos, 1) || !this.mySource.container && !this.creep.pos.inRangeTo(this.mySource.pos, 2)) {
                    this.creep.say('5');
                    if (this.mySource.container)
                        this.moveTo({ pos: this.mySource.container.pos, range: 1 }, {
                            roomCallback: Colony.getCustomMatrix({ ignoreKeeperSourceId: this.mySource.id })
                        });
                    else
                        this.moveTo({ pos: this.mySource.pos, range: 2 }, {
                            roomCallback: Colony.getCustomMatrix({ ignoreKeeperSourceId: this.mySource.id })
                        });
                }
            }
            else if (this.mySource.container) {
                this.creep.say('6');
                if (this.creep.withdraw(this.mySource.container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.moveTo({ pos: this.mySource.container.pos, range: 1 }, {
                        roomCallback: Colony.getCustomMatrix({ ignoreKeeperSourceId: this.mySource.id })
                    });
                var energy = _.filter(this.myRoom.resourceDrops, function (r) { return r.resourceType == RESOURCE_ENERGY && r.pos.inRangeTo(_this.creep.pos, 1); })[0];
                if (energy)
                    this.creep.pickup(energy);
            }
            else {
                this.creep.say('7');
                var energy = _.filter(this.myRoom.resourceDrops, function (r) { return r.resourceType == RESOURCE_ENERGY && _this.creep.pos.inRangeTo(r.pos, 3); })[0];
                if (energy) {
                    this.creep.say('8');
                    this.memory.energyId = energy.id;
                }
            }
        }
        //else {
        //    let harvesters = _.filter(this.mainRoom.creepManagers.harvestingManager.harvesterCreeps, c => c.memory.sourceId == this.mySource.id && c.memory.state==HarvesterState.Harvesting);
        //    if (harvesters.length>0 && !harvesters[0].pos.isNearTo(this.creep.pos))
        //        this.creep.moveTo(harvesters[0]);
        //}
    };
    SourceCarrier.prototype.deliver = function () {
        if (!this.mainRoom) {
            return;
        }
        if (!this.mainRoom.energyDropOffStructure) {
            return;
        }
        else {
            this.pickUpEnergy(1);
            var result = this.creep.transfer(this.mainRoom.energyDropOffStructure, RESOURCE_ENERGY);
            if (result == ERR_NOT_IN_RANGE)
                this.moveTo({ pos: this.mainRoom.energyDropOffStructure.pos, range: 3 }, {
                    roomCallback: Colony.getCustomMatrix({ ignoreKeeperSourceId: this.mySource.id }),
                    plainCost: 2,
                    swampCost: 5
                });
            else if (result == ERR_FULL)
                this.creep.drop(RESOURCE_ENERGY);
        }
    };
    SourceCarrier.prototype.myTick = function () {
        if (this.creep.spawning) {
            return;
        }
        if (!this.mySource)
            this.reassignMainRoom();
        if (!this.mySource) {
            return;
        }
        if (this.memory.state == null || this.memory.state == 1 /* Deliver */ && this.creep.carry.energy == 0 && this.creep.carryCapacity > 0 && !(this.mainRoom.name == this.creep.room.name && this.creep.hits < this.creep.hitsMax)) {
            this.memory.state = 0 /* Pickup */;
            if (this.creep.ticksToLive < 3 * this.mySource.pathLengthToDropOff)
                this.recycle();
        }
        else if (this.memory.state == 0 /* Pickup */ && (_.sum(this.creep.carry) >= (this.creep.hits == this.creep.hitsMax ? 1 : 0.5) * this.creep.carryCapacity || this.creep.ticksToLive < 1.5 * this.mySource.pathLengthToDropOff)) {
            this.memory.state = 1 /* Deliver */;
        }
        if (this.memory.state == 0 /* Pickup */) {
            this.pickup();
        }
        else if (this.memory.state == 1 /* Deliver */) {
            this.deliver();
        }
    };
    return SourceCarrier;
}(MyCreep));
/// <reference path="../myCreep.ts" />
var Harvester = (function (_super) {
    __extends(Harvester, _super);
    function Harvester(name, mainRoom) {
        _super.call(this, name);
        this.name = name;
        this.mainRoom = mainRoom;
        this.healed = false;
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
    Object.defineProperty(Harvester.prototype, "state", {
        get: function () {
            return this.memory.st;
        },
        set: function (value) {
            this.memory.st = value;
        },
        enumerable: true,
        configurable: true
    });
    Harvester.prototype.tryHeal = function () {
        if (this.creep.hits <= this.creep.hitsMax - 20) {
            this.creep.heal(this.creep);
            this.creep.say('heal');
            return true;
        }
        return false;
    };
    Harvester.prototype.moveToHarvestingSite = function () {
        if (this.creep.fatigue > 0)
            return;
        if (this.harvestingSite.hasKeeper)
            var initialDistance = 5;
        else
            initialDistance = 2;
        if (this.harvestingSite.containerPosition)
            var target = { pos: this.harvestingSite.containerPosition, range: 0 };
        else
            target = { pos: this.harvestingSite.pos, range: 1 };
        var minDistanceToSourceAndLair = this.creep.pos.getRangeTo(this.harvestingSite.pos);
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
                this.moveTo(target, { roomCallback: Colony.getCustomMatrix({ ignoreAllKeepers: true, avoidCreeps: true }), maxOps: 50 });
            }
            else if (minDistanceToSourceAndLair < initialDistance && this.harvestingSite.keeperIsAlive) {
                delete this.memory.pathMovement;
                var fleePath = PathFinder.search(this.creep.pos, [{ pos: this.harvestingSite.pos, range: initialDistance }, { pos: this.harvestingSite.keeper.lair.pos, range: initialDistance }], { flee: true, roomCallback: Colony.getCustomMatrix({ avoidCreeps: true }), plainCost: 2, swampCost: 10, maxOps: 100 });
                if (fleePath.path.length > 0) {
                    this.creep.say('Flee' + fleePath.ops);
                    this.creep.move(this.creep.pos.getDirectionTo(fleePath.path[0]));
                }
            }
        }
        return;
    };
    Harvester.prototype.tryConstruct = function () {
        if (Game.time % 10 == 0 && this.mainRoom.room.controller.level >= 3) {
            if (!this.harvestingSite.hasKeeper && !this.harvestingSite.link && !this.mainRoom.harvestersShouldDeliver && this.harvestingSite.room && this.creep.pos.isNearTo(this.harvestingSite.pos) && !this.harvestingSite.container) {
                var constructionSiteLook = _.filter(this.harvestingSite.room.lookForAtArea(LOOK_CONSTRUCTION_SITES, this.harvestingSite.pos.y - 1, this.harvestingSite.pos.x - 1, this.harvestingSite.pos.y + 1, this.harvestingSite.pos.x + 1, true), function (s) { return s.constructionSite.structureType == STRUCTURE_CONTAINER; })[0];
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
    };
    Harvester.prototype.tryRepair = function () {
        return false;
    };
    Harvester.prototype.stateHarvest = function () {
        if (this.tryConstruct() || this.tryHeal())
            return;
        if (!this.harvestingSite)
            return;
        if (!this.healed && this.creep.pos.isNearTo(this.harvestingSite.pos))
            this.creep.harvest(this.harvestingSite.site);
        var haveToDeliver = this.creep.carryCapacity > 0 && (this.harvestingSite.link || this.mainRoom.harvestersShouldDeliver) && _.sum(this.creep.carry) >= this.creep.carryCapacity - 2 * this.body.getHarvestingRate(this.harvestingSite.resourceType);
        if (haveToDeliver) {
            if (this.harvestingSite.link) {
                if (this.transferAny(this.harvestingSite.link) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(this.harvestingSite.link);
            }
            else if (this.mainRoom.harvestersShouldDeliver)
                this.state == 1 /* deliver */;
        }
        else if (this.creep.fatigue == 0 && ((!this.harvestingSite.containerPosition && !this.creep.pos.isNearTo(this.harvestingSite.pos) || this.harvestingSite.containerPosition && !this.creep.pos.isEqualTo(this.harvestingSite.containerPosition)) || this.harvestingSite.keeperIsAlive)) {
            this.moveToHarvestingSite();
        }
    };
    Harvester.prototype.stateDeliver = function () {
        if (this.creep.carry.energy > 0) {
            if (!this.creep.pos.isNearTo(this.mainRoom.energyDropOffStructure))
                this.moveTo(this.mainRoom.energyDropOffStructure, { plainCost: 2, swampCost: 10, roomCallback: Colony.getCustomMatrix({ ignoreKeeperSourceId: this.harvestingSite.id }) });
            else
                this.creep.transfer(this.mainRoom.energyDropOffStructure, RESOURCE_ENERGY);
        }
        else if ((this.mainRoom.terminal || this.mainRoom.mainContainer) && _.sum(this.creep.carry) > 0) {
            var target = this.mainRoom.terminal || this.mainRoom.mainContainer;
            if (this.transferAny(target) == ERR_NOT_IN_RANGE)
                this.moveTo(target, { plainCost: 2, swampCost: 10, roomCallback: Colony.getCustomMatrix({ ignoreKeeperSourceId: this.harvestingSite.id }) });
        }
    };
    Harvester.prototype.myTick = function () {
        this.healed = this.tryHeal();
        if (!this.state || this.state == 1 /* deliver */ && _.sum(this.creep.carry) == 0)
            this.state = 0 /* harvest */;
        if (this.state == 0 /* harvest */)
            this.stateHarvest();
        else
            this.stateDeliver();
    };
    return Harvester;
}(MyCreep));
/// <reference path="../myCreep.ts" />
var HarvestingCarrier = (function (_super) {
    __extends(HarvestingCarrier, _super);
    function HarvestingCarrier(name, mainRoom) {
        _super.call(this, name);
        this.name = name;
        this.mainRoom = mainRoom;
        this.harvestingSite = this.mainRoom.harvestingSites[this.memory.sId];
        this.autoFlee = true;
        if (myMemory['profilerActive']) {
            this.stateDeliver = profiler.registerFN(this.stateDeliver, 'HarvestingCarrier.stateDeliver');
            this.statePickup = profiler.registerFN(this.statePickup, 'HarvestingCarrier.statePickup');
            this.myTick = profiler.registerFN(this.myTick, 'HarvestingCarrier.tick');
        }
    }
    Object.defineProperty(HarvestingCarrier.prototype, "state", {
        get: function () {
            return this.memory.st;
        },
        set: function (value) {
            this.memory.st = value;
        },
        enumerable: true,
        configurable: true
    });
    HarvestingCarrier.prototype.statePickup = function () {
        var _this = this;
        if (!this.harvestingSite)
            return;
        if (this.creep.fatigue > 0)
            return;
        var resource = _.filter(this.myRoom.resourceDrops, function (r) { return _this.creep.pos.inRangeTo(r.pos, 1); })[0];
        if (resource)
            this.creep.pickup(resource);
        if (this.creep.fatigue > 0)
            return;
        if (this.harvestingSite.containerPosition)
            var target = { pos: this.harvestingSite.containerPosition, range: 1 };
        else
            target = { pos: this.harvestingSite.pos, range: 2 };
        if (this.harvestingSite.hasKeeper)
            var initialDistance = 6;
        else
            initialDistance = 3;
        var minDistanceToSourceAndLair = this.creep.pos.getRangeTo(this.harvestingSite.pos);
        if (this.harvestingSite.lairPosition)
            minDistanceToSourceAndLair = Math.min(minDistanceToSourceAndLair, this.creep.pos.getRangeTo(this.harvestingSite.lairPosition));
        if (minDistanceToSourceAndLair > initialDistance) {
            this.moveTo(target, { roomCallback: Colony.getCustomMatrix({ ignoreKeeperSourceId: this.harvestingSite.id }), plainCost: 2, swampCost: 10 });
            return;
        }
        else {
            var energy = _.filter(this.myRoom.resourceDrops, function (r) { return _this.harvestingSite.pos.inRangeTo(r.pos, 2) && (_this.harvestingSite.amount == 0 || _this.harvestingSite.container || r.amount > 1000 || r.amount >= _this.creep.carryCapacity - _.sum(_this.creep.carry)); })[0];
            if ((!this.harvestingSite.hasKeeper || energy || this.harvestingSite.container) && !this.harvestingSite.keeperIsAlive) {
                if (energy)
                    if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
                        this.moveTo({ pos: energy.pos, range: 1 }, { roomCallback: Colony.getCustomMatrix({ ignoreAllKeepers: true, avoidCreeps: true }), maxOps: 100 });
                    else
                        this.moveTo(target, { roomCallback: Colony.getCustomMatrix({ ignoreAllKeepers: true, avoidCreeps: true }), maxOps: 100 });
                else if (this.harvestingSite.container) {
                    if (this.creep.withdraw(this.harvestingSite.container, this.harvestingSite.resourceType) == ERR_NOT_IN_RANGE)
                        this.moveTo({ pos: this.harvestingSite.container.pos, range: 1 }, { roomCallback: Colony.getCustomMatrix({ ignoreAllKeepers: true, avoidCreeps: true }), maxOps: 100 });
                }
                return;
            }
            else if (minDistanceToSourceAndLair < initialDistance && this.harvestingSite.keeperIsAlive) {
                this.creep.say('Uh Oh');
                delete this.memory.pathMovement;
                var fleePath = PathFinder.search(this.creep.pos, [{ pos: this.harvestingSite.pos, range: initialDistance + 1 }, { pos: this.harvestingSite.keeper.lair.pos, range: initialDistance + 1 }], { flee: true, roomCallback: Colony.getCustomMatrix({ avoidCreeps: true }), plainCost: 2, swampCost: 10, maxOps: 100 });
                if (fleePath.path.length > 0) {
                    this.creep.say('Flee' + fleePath.ops);
                    this.creep.move(this.creep.pos.getDirectionTo(fleePath.path[0]));
                }
                return;
            }
        }
    };
    HarvestingCarrier.prototype.stateDeliver = function () {
        if (this.creep.fatigue > 0)
            return;
        if (this.creep.carry.energy > 0) {
            if (!this.creep.pos.isNearTo(this.mainRoom.energyDropOffStructure))
                this.moveTo({ pos: this.mainRoom.energyDropOffStructure.pos, range: 1 }, { plainCost: 2, swampCost: 10, roomCallback: Colony.getCustomMatrix({ ignoreKeeperSourceId: this.harvestingSite.id }) });
            else
                this.creep.transfer(this.mainRoom.energyDropOffStructure, RESOURCE_ENERGY);
        }
        else if ((this.mainRoom.terminal || this.mainRoom.mainContainer) && _.sum(this.creep.carry) > 0) {
            var target = this.mainRoom.terminal || this.mainRoom.mainContainer;
            if (this.transferAny(target) == ERR_NOT_IN_RANGE)
                this.moveTo({ pos: target.pos, range: 1 }, { plainCost: 2, swampCost: 10, roomCallback: Colony.getCustomMatrix({ ignoreKeeperSourceId: this.harvestingSite.id }) });
        }
    };
    HarvestingCarrier.prototype.myTick = function () {
        if (this.state == null || this.state == 1 /* deliver */ && _.sum(this.creep.carry) == 0) {
            if (this.creep.ticksToLive < 3 * this.harvestingSite.pathLengthToDropOff)
                this.recycle();
            else
                this.state = 0 /* pickup */;
        }
        else if (this.state == 0 /* pickup */ && _.sum(this.creep.carry) == this.creep.carryCapacity || this.creep.ticksToLive < 1.5 * this.harvestingSite.pathLengthToDropOff && _.sum(this.creep.carry) > 0) {
            if (this.creep.ticksToLive < 1.5 * this.harvestingSite.pathLengthToDropOff) {
                this.recycle();
                return;
            }
            else
                this.state = 1 /* deliver */;
        }
        if (this.state == 0 /* pickup */)
            this.statePickup();
        else
            this.stateDeliver();
    };
    return HarvestingCarrier;
}(MyCreep));
/// <reference path="../creeps/energyHarvester/energyHarvesterDefinition.ts" />
/// <reference path="../creeps/energyHarvester/energyHarvester.ts" />
/// <reference path="../creeps/sourceCarrier/sourceCarrierDefinition.ts" />
/// <reference path="../creeps/sourceCarrier/sourceCarrier.ts" />
/// <reference path="./manager.ts" />
/// <reference path="../creeps/harvesting/harvester.ts" />
/// <reference path="../creeps/harvesting/harvestingCarrier.ts" />
var EnergyHarvestingManager = (function () {
    function EnergyHarvestingManager(mainRoom) {
        this.mainRoom = mainRoom;
        if (myMemory['profilerActive']) {
            this.preTick = profiler.registerFN(this.preTick, 'EnergyHarvestingManager.preTick');
            this.tick = profiler.registerFN(this.tick, 'EnergyHarvestingManager.tick');
        }
    }
    Object.defineProperty(EnergyHarvestingManager.prototype, "memory", {
        get: function () {
            return this.accessMemory();
        },
        enumerable: true,
        configurable: true
    });
    EnergyHarvestingManager.prototype.accessMemory = function () {
        if (this.mainRoom.memory.energyHarvestingManager == null)
            this.mainRoom.memory.energyHarvestingManager = {
                debug: false,
                verbose: false
            };
        return this.mainRoom.memory.energyHarvestingManager;
    };
    Object.defineProperty(EnergyHarvestingManager.prototype, "harvesters", {
        get: function () {
            var _this = this;
            if (this._harvesters == null)
                this._harvesters = { time: Game.time, harvesters: _.indexBy(_.map(this.harvesterCreeps, function (c) { return new Harvester(c.name, _this.mainRoom); }), function (x) { return x.name; }) };
            else if (this._harvesters.time < Game.time) {
                _.forEach(this.harvesterCreeps, function (c) {
                    if (!_this._harvesters.harvesters[c.name])
                        _this._harvesters.harvesters[c.name] = new Harvester(c.name, _this.mainRoom);
                });
            }
            return this._harvesters.harvesters;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EnergyHarvestingManager.prototype, "sourceCarriers", {
        get: function () {
            var _this = this;
            if (this._sourceCarriers == null)
                this._sourceCarriers = { time: Game.time, sourceCarriers: _.indexBy(_.map(this.sourceCarrierCreeps, function (c) { return new HarvestingCarrier(c.name, _this.mainRoom); }), function (x) { return x.name; }) };
            else if (this._sourceCarriers.time < Game.time) {
                _.forEach(this.sourceCarrierCreeps, function (c) {
                    if (!_this._sourceCarriers.sourceCarriers[c.name])
                        _this._sourceCarriers.sourceCarriers[c.name] = new HarvestingCarrier(c.name, _this.mainRoom);
                });
            }
            return this._sourceCarriers.sourceCarriers;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EnergyHarvestingManager.prototype, "harvesterCreeps", {
        get: function () {
            var _this = this;
            if (this._harvesterCreeps == null || this._harvesterCreeps.time < Game.time)
                this._harvesterCreeps = {
                    time: Game.time, creeps: _.filter(this.mainRoom.creepsByRole('harvester'), function (c) { return _this.mainRoom.sources[c.memory.sId]; })
                };
            return this._harvesterCreeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EnergyHarvestingManager.prototype, "sourceCarrierCreeps", {
        get: function () {
            var _this = this;
            if (this._sourceCarrierCreeps == null || this._sourceCarrierCreeps.time < Game.time)
                this._sourceCarrierCreeps = {
                    time: Game.time, creeps: _.filter(this.mainRoom.creepsByRole('harvestingCarrier'), function (c) { return _this.mainRoom.sources[c.memory.sId]; })
                };
            return this._sourceCarrierCreeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EnergyHarvestingManager.prototype, "harvestersBySource", {
        get: function () {
            if (this._harvestersBySource == null || this._harvestersBySource.time < Game.time)
                this._harvestersBySource = {
                    time: Game.time, harvesters: _.groupBy(this.harvesterCreeps, function (x) { return x.memory.sId; })
                };
            return this._harvestersBySource.harvesters;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EnergyHarvestingManager.prototype, "carriersBySource", {
        get: function () {
            if (this._carriersBySource == null || this._carriersBySource.time < Game.time)
                this._carriersBySource = {
                    time: Game.time, carriers: _.groupBy(this.sourceCarrierCreeps, function (x) { return x.memory.sId; })
                };
            return this._carriersBySource.carriers;
        },
        enumerable: true,
        configurable: true
    });
    EnergyHarvestingManager.prototype.getHarvesterBodyAndCount = function (sourceInfo, noLocalRestriction) {
        if (noLocalRestriction === void 0) { noLocalRestriction = false; }
        var maxSpawnEnergy = noLocalRestriction ? _.max(_.values(Colony.mainRooms), function (x) { return x.maxSpawnEnergy; }).maxSpawnEnergy : this.mainRoom.maxSpawnEnergy;
        var result = EnergyHarvesterDefinition.getDefinition(maxSpawnEnergy, sourceInfo, this.mainRoom.harvestersShouldDeliver, this.mainRoom.managers.labManager.availablePublishResources);
        return result;
    };
    EnergyHarvestingManager.prototype.getSourceCarrierBodyAndCount = function (sourceInfo, maxMiningRate) {
        var useRoads = (this.mainRoom.mainContainer && sourceInfo.roadBuiltToRoom == this.mainRoom.name);
        var pathLengh = (sourceInfo.pathLengthToDropOff + 10) * 1.1;
        if (pathLengh == null)
            pathLengh = 50;
        var sourceRate = sourceInfo.capacity / ENERGY_REGEN_TIME;
        var energyPerTick = maxMiningRate == null ? sourceRate : Math.min(maxMiningRate, sourceRate);
        var requiredCapacity = energyPerTick * pathLengh * (useRoads ? 2 : 3);
        return SourceCarrierDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, requiredCapacity, this.mainRoom.managers.labManager.availablePublishResources);
    };
    EnergyHarvestingManager.prototype.createCreep = function (sourceInfo, spawnManager) {
        //var harvesters = _.filter(this.harvesterCreeps, (c) => (<EnergyHarvesterMemory>c.memory).sourceId == sourceInfo.id);
        {
            var carrierCount_1 = this.carriersBySource[sourceInfo.id] ? this.carriersBySource[sourceInfo.id].length : 0;
            var harvesterCount_1 = this.harvestersBySource[sourceInfo.id] ? this.harvestersBySource[sourceInfo.id].length : 0;
            var requiredHarvesters = this.memory.creepCounts && this.memory.creepCounts[sourceInfo.id] && this.memory.creepCounts[sourceInfo.id].harvesterRequirements ? this.memory.creepCounts[sourceInfo.id].harvesterRequirements : 0;
            var requiredCarriers = this.memory.creepCounts && this.memory.creepCounts[sourceInfo.id] && this.memory.creepCounts[sourceInfo.id].carrierRequirements ? this.memory.creepCounts[sourceInfo.id].carrierRequirements : 0;
            if (harvesterCount_1 != 0 && (carrierCount_1 != 0 || sourceInfo.link) && harvesterCount_1 >= requiredHarvesters && (carrierCount_1 >= requiredCarriers || sourceInfo.link)) {
                if (!this.memory.sleepUntil)
                    this.memory.sleepUntil = {};
                this.memory.sleepUntil[sourceInfo.id] = Game.time + 10;
                return;
            }
        }
        var harvesters = this.harvestersBySource[sourceInfo.id];
        var harvesterRequirements = this.getHarvesterBodyAndCount(sourceInfo);
        if (harvesterRequirements.count > 0) {
            var requestedCreep = false;
            //if (!sourceInfo.hasKeeper && harvesterRequirements.body.energyHarvestingRate * harvesterRequirements.count < sourceInfo.capacity / ENERGY_REGEN_TIME) {
            //    let requestHarvesterRequirements = this.getHarvesterBodyAndCount(sourceInfo, true);
            //    console.log('MainRoom ' + this.mainRoom.name + ' requests harvester: ' + requestHarvesterRequirements.count);
            //    requestedCreep = Colony.spawnCreep(this.mainRoom.myRoom, requestHarvesterRequirements.body, { role: 'harvester', state: EnergyHarvesterState.Harvesting, sourceId: sourceInfo.id, mainRoomName: this.mainRoom.name, requiredBoosts: requestHarvesterRequirements.body.boosts, }, requestHarvesterRequirements.count - (harvesters ? harvesters.length : 0));
            //}
            if (!requestedCreep) {
                var livingHarvesters = _.filter(harvesters, function (x) { return ((x.ticksToLive > sourceInfo.pathLengthToDropOff + harvesterRequirements.body.getBody().length * 3) || x.spawning); });
                var harvesterCount = harvesterRequirements.count - livingHarvesters.length;
                spawnManager.addToQueue(harvesterRequirements.body.getBody(), { role: 'harvester', st: 0 /* harvest */, sId: sourceInfo.id, mainRoomName: this.mainRoom.name, requiredBoosts: harvesterRequirements.body.boosts }, harvesterCount);
            }
            if (sourceInfo.link == null && this.mainRoom.mainContainer) {
                var miningRate = Math.min(Math.ceil(harvesterRequirements.body.energyHarvestingRate * harvesterRequirements.count / (sourceInfo.hasKeeper ? 2 : 1)), Math.ceil(sourceInfo.capacity / 300) * 1) * (sourceInfo.hasKeeper ? 1.1 : 1);
                //var sourceCarriers = _.filter(this.sourceCarrierCreeps, (c) => (<SourceCarrierMemory>c.memory).sourceId == sourceInfo.id);
                var sourceCarriers = this.carriersBySource[sourceInfo.id];
                var carrierRequirements = this.getSourceCarrierBodyAndCount(sourceInfo, miningRate);
                var carrierCount = carrierRequirements.count - (sourceCarriers ? sourceCarriers.length : 0);
                spawnManager.addToQueue(carrierRequirements.body.getBody(), { role: 'harvestingCarrier', sId: sourceInfo.id, mainRoomName: this.mainRoom.name }, carrierCount);
            }
        }
        if (!this.memory.creepCounts)
            this.memory.creepCounts = {};
        this.memory.creepCounts[sourceInfo.id] = {
            carriers: this.carriersBySource[sourceInfo.id] ? this.carriersBySource[sourceInfo.id].length : 0,
            harvesters: this.harvestersBySource[sourceInfo.id] ? this.harvestersBySource[sourceInfo.id].length : 0,
            carrierRequirements: carrierRequirements ? carrierRequirements.count : 0,
            harvesterRequirements: harvesterRequirements ? harvesterRequirements.count : 0
        };
        if (harvesterRequirements.count == 0 || harvesterCount == 0 && carrierCount == 0) {
            if (!this.memory.sleepUntil)
                this.memory.sleepUntil = {};
            this.memory.sleepUntil[sourceInfo.id] = Game.time + 10;
        }
    };
    EnergyHarvestingManager.prototype.preTick = function (myRoom) {
        var _this = this;
        if (this.mainRoom.spawnManager.isBusy || !myRoom.canHarvest || _.any(myRoom.hostileScan.creeps, function (c) { return c.bodyInfo.totalAttackRate > 0; }))
            return;
        if (this.memory.sleepUntil && this.memory.sleepUntil.sleepUntil > Game.time)
            return;
        var spawnManager = null;
        if (this.mainRoom.mainContainer && this.mainRoom.mainContainer.store.energy >= 800000)
            this.mainRoom.harvestingActive = false;
        else if (!this.mainRoom.mainContainer || this.mainRoom.mainContainer.store.energy < 300000)
            this.mainRoom.harvestingActive = true;
        //if (this.mainRoom.spawnManager.isBusy) {
        //    let mainRoom = _.sortBy(_.filter(Colony.mainRooms, r => !r.spawnManager.isBusy && r.maxSpawnEnergy >= this.mainRoom.maxSpawnEnergy && r.myRoom.memory.mainRoomDistanceDescriptions[this.mainRoom.name].distance <= 3), x => x.myRoom.memory.mainRoomDistanceDescriptions[this.mainRoom.name].distance)[0];
        //    if (mainRoom)
        //        spawnManager = mainRoom.spawnManager;
        //}
        //else
        spawnManager = this.mainRoom.spawnManager;
        if (spawnManager == null || spawnManager.isBusy)
            return;
        var sources = _.filter(myRoom.mySources, function (s) { return s.usable && (!_this.memory.sleepUntil || !_this.memory.sleepUntil[s.id] || _this.memory.sleepUntil[s.id] < Game.time) && (_this.mainRoom.harvestingActive || s.myRoom.name == _this.mainRoom.name); });
        if (sources.length == 0) {
            if (!this.memory.sleepUntil)
                this.memory.sleepUntil = {};
            this.memory.sleepUntil.sleepUntil = Game.time + 10;
        }
        for (var idx in sources) {
            if (spawnManager.isBusy)
                break;
            this.createCreep(sources[idx], spawnManager);
        }
    };
    EnergyHarvestingManager.prototype.tick = function () {
        _.forEach(this.harvesters, function (h) { return h.tick(); });
        _.forEach(this.sourceCarriers, function (s) { return s.tick(); });
        //this.harvesterCreeps.forEach((c) => { new EnergyHarvester(c.name, this.mainRoom).tick() });
        //this.sourceCarrierCreeps.forEach((c) => { new SourceCarrier(c.name, this.mainRoom).tick() });
    };
    return EnergyHarvestingManager;
}());
var DefenderDefinition;
(function (DefenderDefinition) {
    function getDefinition(maxEnergy) {
        var body = new Body();
        var remainingEnergy = Math.min(maxEnergy, 700);
        var basicModulesCount = ~~(remainingEnergy / 190); //work,carry,move
        body.attack = basicModulesCount;
        body.tough = basicModulesCount;
        body.move = 2 * basicModulesCount;
        remainingEnergy = remainingEnergy - 190 * basicModulesCount;
        while (remainingEnergy >= (BODYPART_COST.attack + BODYPART_COST.move) && body.getBody().length <= 48) {
            body.attack++;
            body.move++;
            remainingEnergy -= (BODYPART_COST.attack + BODYPART_COST.move);
        }
        while (remainingEnergy >= (BODYPART_COST.tough + BODYPART_COST.move) && body.getBody().length <= 48) {
            body.tough++;
            body.move++;
            remainingEnergy -= (BODYPART_COST.tough + BODYPART_COST.move);
        }
        return body;
    }
    DefenderDefinition.getDefinition = getDefinition;
})(DefenderDefinition || (DefenderDefinition = {}));
/// <reference path="../myCreep.ts" />
var Defender = (function (_super) {
    __extends(Defender, _super);
    function Defender(name, mainRoom) {
        _super.call(this, name);
        this.name = name;
        this.mainRoom = mainRoom;
        if (myMemory['profilerActive']) {
            this.myTick = profiler.registerFN(this.myTick, 'Defender.tick');
        }
    }
    Object.defineProperty(Defender.prototype, "memory", {
        get: function () { return this.creep.memory; },
        enumerable: true,
        configurable: true
    });
    Defender.prototype.myTick = function () {
        var _this = this;
        this.memory = this.creep.memory;
        var closestHostileCreep = this.creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS, { filter: function (c) { return c.owner.username != 'Source Keeper'; } });
        if (closestHostileCreep != null) {
            this.memory.path = null;
            this.creep.moveTo(closestHostileCreep);
            this.creep.attack(closestHostileCreep);
            this.creep.rangedAttack(closestHostileCreep);
        }
        else {
            var otherRoom = _.filter(this.mainRoom.allRooms, function (r) { return r.name != _this.creep.room.name && r.requiresDefense && r.canHarvest; })[0];
            if (otherRoom != null) {
                if (this.memory.path == null || this.memory.path.path.length <= 2) {
                    this.memory.path = PathFinder.search(this.creep.pos, { pos: new RoomPosition(25, 25, otherRoom.name), range: 20 }, { roomCallback: Colony.getTravelMatrix, plainCost: 1, swampCost: 5, maxOps: 5000 });
                    this.memory.path.path.unshift(this.creep.pos);
                }
                this.moveByPath();
            }
            else {
                this.recycle();
            }
        }
    };
    return Defender;
}(MyCreep));
/// <reference path="../creeps/defender/defenderDefinition.ts" />
/// <reference path="../creeps/defender/defender.ts" />
/// <reference path="./manager.ts" />
var DefenseManager = (function () {
    function DefenseManager(mainRoom) {
        this.mainRoom = mainRoom;
        this._creeps = { time: 0, creeps: null };
        this.maxCreeps = 1;
        if (myMemory['profilerActive']) {
            this.preTick = profiler.registerFN(this.preTick, 'DefenseManager.preTick');
            this.tick = profiler.registerFN(this.tick, 'DefenseManager.tick');
        }
    }
    Object.defineProperty(DefenseManager.prototype, "creeps", {
        get: function () {
            if (this._creeps.time < Game.time)
                this._creeps = {
                    time: Game.time, creeps: this.mainRoom.creepsByRole('defender')
                };
            return this._creeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    DefenseManager.prototype.preTick = function () {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        var defenderRequired = _.any(this.mainRoom.allRooms, function (r) { return !r.memory.fO && !r.memory.fR && r.requiresDefense && r.canHarvest; });
        if (defenderRequired)
            _.forEach(this.creeps, function (c) { return delete c.memory.recycle; });
        if (defenderRequired && this.creeps.length < this.maxCreeps) {
            this.mainRoom.spawnManager.addToQueue(DefenderDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'defender' }, this.maxCreeps - this.creeps.length, true);
        }
    };
    DefenseManager.prototype.tick = function () {
        var _this = this;
        this.creeps.forEach(function (c) { return new Defender(c.name, _this.mainRoom).tick(); });
    };
    return DefenseManager;
}());
/// <reference path="../myCreep.ts" />
var Reserver = (function (_super) {
    __extends(Reserver, _super);
    function Reserver(name, mainRoom) {
        _super.call(this, name);
        this.name = name;
        this.mainRoom = mainRoom;
        this.autoFlee = true;
        if (myMemory['profilerActive']) {
            this.myTick = profiler.registerFN(this.myTick, 'Reserver.tick');
        }
    }
    Reserver.prototype.myTick = function () {
        this.memory = this.creep.memory;
        var myRoom = Colony.getRoom(this.memory.targetRoomName);
        if (!this.creep.pos.isNearTo(myRoom.controllerPosition))
            this.moveTo({ pos: myRoom.controllerPosition, range: 1 }, { swampCost: 5, plainCost: 1 });
        else
            this.creep.reserveController(this.creep.room.controller);
    };
    return Reserver;
}(MyCreep));
/// <reference path="../creeps/reserver/reserver.ts" />
/// <reference path="./manager.ts" />
var ReservationManager = (function () {
    function ReservationManager(mainRoom) {
        this.mainRoom = mainRoom;
        this._creeps = { time: 0, creeps: null };
        if (myMemory['profilerActive']) {
            this.preTick = profiler.registerFN(this.preTick, 'ReservationManager.preTick');
            this.tick = profiler.registerFN(this.tick, 'ReservationManager.tick');
        }
    }
    Object.defineProperty(ReservationManager.prototype, "creeps", {
        get: function () {
            if (this._creeps.time < Game.time)
                this._creeps = {
                    time: Game.time, creeps: this.mainRoom.creepsByRole('reserver')
                };
            return this._creeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    ReservationManager.prototype.preTick = function (myRoom) {
        var mainRoom = this.mainRoom;
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if (mainRoom.room.controller.level <= 3)
            return;
        if (mainRoom.maxSpawnEnergy < 1300)
            return;
        if (!myRoom.canHarvest || !myRoom.hasController || !myRoom.controllerPosition || myRoom.name == this.mainRoom.name)
            return;
        var room = myRoom.room;
        if (room && room.controller.reservation != null && (room.controller.reservation.ticksToEnd > 4500 || this.mainRoom.room.controller.level <= 3 && room.controller.reservation.ticksToEnd >= 500))
            return;
        if (this.mainRoom.maxSpawnEnergy < 650)
            return;
        var requiredCount = this.mainRoom.maxSpawnEnergy < 1300 ? 2 : 1;
        if (_.filter(this.creeps, function (x) { return x.memory.targetRoomName == myRoom.name; }).length < requiredCount) {
            this.mainRoom.spawnManager.addToQueue(requiredCount > 1 ? [CLAIM, MOVE] : [CLAIM, CLAIM, MOVE, MOVE], { role: 'reserver', targetRoomName: myRoom.name }, 1, false);
        }
    };
    ReservationManager.prototype.tick = function () {
        var _this = this;
        this.creeps.forEach(function (c) { return new Reserver(c.name, _this.mainRoom).tick(); });
    };
    return ReservationManager;
}());
var LinkFillerDefinition;
(function (LinkFillerDefinition) {
    function getDefinition() {
        var body = new Body();
        body.carry = 4;
        body.move = 1;
        return body;
    }
    LinkFillerDefinition.getDefinition = getDefinition;
})(LinkFillerDefinition || (LinkFillerDefinition = {}));
/// <reference path="../MyCreep.ts" />
var LinkFiller = (function (_super) {
    __extends(LinkFiller, _super);
    function LinkFiller(name, mainRoom) {
        _super.call(this, name);
        this.name = name;
        this.mainRoom = mainRoom;
        if (myMemory['profilerActive']) {
            this.myTick = profiler.registerFN(this.myTick, 'Builder.tick');
        }
    }
    LinkFiller.prototype.myTick = function () {
        var _this = this;
        var storage = this.mainRoom.room.storage;
        if (this.creep.ticksToLive <= 10) {
            if (this.creep.carry.energy == 0)
                this.creep.suicide();
            else {
                if (this.creep.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(storage);
            }
            return;
        }
        if (this.creep.carry.energy < this.creep.carryCapacity && _.filter(this.mainRoom.myRoom.resourceDrops, function (x) { return x.resourceType == RESOURCE_ENERGY; }).length > 0) {
            var energy = _.filter(this.mainRoom.myRoom.resourceDrops, function (x) { return x.resourceType == RESOURCE_ENERGY && x.pos.inRangeTo(_this.mainRoom.mainContainer.pos, 2); })[0];
            if (energy) {
                if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(energy);
                return;
            }
        }
        var myLink = _.filter(this.mainRoom.links, function (x) { return x.nextToStorage; })[0];
        if (!myLink)
            return;
        var link = Game.getObjectById(myLink.id);
        if (storage == null || link == null)
            return;
        if (link.energy < myLink.minLevel) {
            if (this.creep.carry.energy == 0 && storage.store.energy > this.mainRoom.maxSpawnEnergy * 2) {
                if (storage.transfer(this.creep, RESOURCE_ENERGY))
                    this.creep.moveTo(storage);
            }
            else {
                if (this.creep.transfer(link, RESOURCE_ENERGY, Math.min(this.creep.carry.energy, myLink.minLevel - link.energy)) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(link);
            }
        }
        else if (link.energy > myLink.maxLevel) {
            if (this.creep.carry.energy == this.creep.carryCapacity) {
                if (this.creep.transfer(storage, RESOURCE_ENERGY))
                    this.creep.moveTo(storage);
            }
            else {
                if (link.transferEnergy(this.creep, Math.min(link.energy - myLink.minLevel, this.creep.carryCapacity - this.creep.carry.energy)) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(link);
            }
        }
        else {
            if (this.creep.carry.energy > 100) {
                if (this.creep.transfer(storage, RESOURCE_ENERGY, this.creep.carry.energy - 100) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(storage);
            }
            else if (this.creep.carry.energy > 100) {
                if (storage.transfer(this.creep, RESOURCE_ENERGY, 100 - this.creep.carry.energy) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(storage);
            }
        }
    };
    return LinkFiller;
}(MyCreep));
/// <reference path="../creeps/linkFiller/linkFillerDefinition.ts" />
/// <reference path="../creeps/linkFiller/linkFiller.ts" />
/// <reference path="./manager.ts" />
var LinkFillerManager = (function () {
    function LinkFillerManager(mainRoom) {
        this.mainRoom = mainRoom;
        this._creeps = { time: 0, creeps: null };
        if (myMemory['profilerActive']) {
            this.preTick = profiler.registerFN(this.preTick, 'LinkFillerManager.preTick');
            this.tick = profiler.registerFN(this.tick, 'LinkFillerManager.tick');
        }
    }
    Object.defineProperty(LinkFillerManager.prototype, "creeps", {
        get: function () {
            if (this._creeps.time < Game.time)
                this._creeps = {
                    time: Game.time, creeps: this.mainRoom.creepsByRole('linkFiller')
                };
            return this._creeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    LinkFillerManager.prototype.preTick = function () {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if (this.creeps.length == 0 && this.mainRoom.links.length > 0) {
            this.mainRoom.spawnManager.addToQueue(LinkFillerDefinition.getDefinition().getBody(), { role: 'linkFiller' });
        }
    };
    LinkFillerManager.prototype.tick = function () {
        var _this = this;
        this.creeps.forEach(function (c) { return new LinkFiller(c.name, _this.mainRoom).tick(); });
    };
    return LinkFillerManager;
}());
/// <reference path="./manager.ts" />
var RoadConstructionManager = (function () {
    function RoadConstructionManager(mainRoom) {
        this.mainRoom = mainRoom;
        if (myMemory['profilerActive']) {
            this.tick = profiler.registerFN(this.tick, 'RoadConstructionManager.tick');
        }
    }
    Object.defineProperty(RoadConstructionManager.prototype, "memory", {
        get: function () {
            return this.accessMemory();
        },
        enumerable: true,
        configurable: true
    });
    RoadConstructionManager.prototype.accessMemory = function () {
        if (this.mainRoom.memory.roadConstructionManager == null)
            this.mainRoom.memory.roadConstructionManager = {
                remainingPath: []
            };
        return this.mainRoom.memory.roadConstructionManager;
    };
    RoadConstructionManager.prototype.buildExtensionRoads = function () {
        var extensions = this.mainRoom.room.find(FIND_MY_STRUCTURES, {
            filter: function (s) { return s.structureType == STRUCTURE_EXTENSION; }
        });
        for (var idx in extensions) {
            var extension = extensions[idx];
            var roomName = this.mainRoom.name;
            new RoomPosition(extension.pos.x - 1, extension.pos.y, roomName).createConstructionSite(STRUCTURE_ROAD);
            new RoomPosition(extension.pos.x + 1, extension.pos.y, roomName).createConstructionSite(STRUCTURE_ROAD);
            new RoomPosition(extension.pos.x, extension.pos.y - 1, roomName).createConstructionSite(STRUCTURE_ROAD);
            new RoomPosition(extension.pos.x, extension.pos.y + 1, roomName).createConstructionSite(STRUCTURE_ROAD);
        }
    };
    RoadConstructionManager.prototype.constructRoad = function (path, startIdx, endIdx) {
        if (startIdx === void 0) { startIdx = 0; }
        if (endIdx === void 0) { endIdx = null; }
        if (endIdx == null)
            var end = path.length - 1;
        else
            end = endIdx;
        for (var pathIdx = startIdx; pathIdx <= end; pathIdx++) {
            var result = RoomPos.fromObj(path[pathIdx]).createConstructionSite(STRUCTURE_ROAD);
            if (result == ERR_FULL) {
                if (this.memory.remainingPath == null)
                    this.memory.remainingPath = path.slice(pathIdx);
                else
                    this.memory.remainingPath = this.memory.remainingPath.concat(path.slice(pathIdx));
                break;
            }
        }
    };
    RoadConstructionManager.prototype.buildHarvestPaths = function () {
        var _this = this;
        if (_.filter(Game.constructionSites, function (x) { return x.structureType == STRUCTURE_ROAD; }).length > 50)
            return;
        if (!this.mainRoom.mainContainer)
            return;
        var sources = _.filter(this.mainRoom.sources, function (x) { return (!x.hasKeeper || x.maxHarvestingSpots > 1) && (x.roadBuiltToRoom != _this.mainRoom.name || (Game.time % 500 == 0) && x.myRoom.canHarvest); });
        for (var sourceIdx = 0; sourceIdx < sources.length; sourceIdx++) {
            if (_.size(Game.constructionSites) == 100)
                return;
            var mySource = sources[sourceIdx];
            _.forEach(this.mainRoom.allRooms, function (room) { return room.recreateCostMatrix(); });
            var path = PathFinder.search(this.mainRoom.mainContainer.pos, { pos: mySource.pos, range: 1 }, { plainCost: 2, swampCost: 3, roomCallback: Colony.getTravelMatrix, maxOps: 10000 });
            this.constructRoad(path.path, 0);
            mySource.roadBuiltToRoom = this.mainRoom.name;
        }
        _.forEach(_.filter(this.mainRoom.minerals, function (m) { return m.roadBuiltToRoom != _this.mainRoom.name; }), function (myMineral) {
            if (_.size(Game.constructionSites) == 100)
                return;
            if (_this.mainRoom.terminal) {
                _.forEach(_this.mainRoom.allRooms, function (room) { return room.recreateCostMatrix(); });
                var path = PathFinder.search(_this.mainRoom.terminal.pos, { pos: myMineral.pos, range: 1 }, { plainCost: 2, swampCost: 3, roomCallback: Colony.getTravelMatrix, maxOps: 10000 });
                _this.constructRoad(path.path, 0);
                myMineral.roadBuiltToRoom = _this.mainRoom.name;
            }
            ;
        });
        //if (this.mainRoom.terminal && this.mainRoom.extractorContainer) {
        //    let path = PathFinder.search(this.mainRoom.extractorContainer.pos, { pos: this.mainRoom.terminal.pos, range: 1 }, { plainCost: 2, swampCost: 3, roomCallback: Colony.getTravelMatrix });
        //    this.constructRoad(path.path, 0);
        //}
    };
    RoadConstructionManager.prototype.buildControllerRoad = function () {
        if (_.filter(Game.constructionSites, function (x) { return x.structureType == STRUCTURE_ROAD; }).length > 0)
            return;
        if (!this.mainRoom.mainContainer)
            return;
        var path = PathFinder.search(this.mainRoom.mainContainer.pos, { pos: this.mainRoom.room.controller.pos, range: 1 }, { plainCost: 2, swampCost: 3, roomCallback: Colony.getTravelMatrix });
        this.constructRoad(path.path, 0);
    };
    RoadConstructionManager.prototype.tick = function () {
        try {
            //if (Game.cpu.bucket < 2000)
            //    return;
            if (this.memory.remainingPath && this.memory.remainingPath.length > 0) {
                var remainingPath = this.memory.remainingPath;
                this.memory.remainingPath = null;
                this.constructRoad(remainingPath);
            }
            else if (Game.time % 50 == 0 && !(Game.time % 100 == 0)) {
            }
            else if (Game.time % 100 == 0 && !(Game.time % 200 == 0)) {
                this.buildHarvestPaths();
            }
            else if (Game.time % 200 == 0) {
                this.buildControllerRoad();
            }
        }
        catch (e) {
            console.log(e.stack);
        }
    };
    return RoadConstructionManager;
}());
/// <reference path="../body.ts" />
var TowerFillerDefinition;
(function (TowerFillerDefinition) {
    function getDefinition(maxEnergy, towerCount) {
        if (towerCount === void 0) { towerCount = 1; }
        var body = new Body();
        body.carry = 4 * Math.min(towerCount, 5);
        body.move = 2 * Math.min(towerCount, 5);
        return body;
    }
    TowerFillerDefinition.getDefinition = getDefinition;
})(TowerFillerDefinition || (TowerFillerDefinition = {}));
/// <reference path="../myCreep.ts" />
var TowerFiller = (function (_super) {
    __extends(TowerFiller, _super);
    function TowerFiller(name, mainRoom) {
        _super.call(this, name);
        this.name = name;
        this.mainRoom = mainRoom;
        if (myMemory['profilerActive']) {
            this.myTick = profiler.registerFN(this.myTick, 'TowerFiller.tick');
        }
    }
    TowerFiller.prototype.myTick = function () {
        if (this.mainRoom.towers.length == 0)
            return;
        if (this.creep.carry.energy == 0) {
            var links = _.filter(this.mainRoom.links, function (x) { return x.nextToTower == true; });
            if (links.length > 0 && links[0].link) {
                var link = links[0].link;
                if (link.transferEnergy(this.creep) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(link);
            }
            else {
                var container = this.mainRoom.mainContainer;
                if (container) {
                    if (container.transfer(this.creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(container);
                }
            }
        }
        else {
            var tower = _.min(this.mainRoom.towers, function (t) { return t.energy; });
            if (tower) {
                if (this.creep.transfer(tower, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(tower);
            }
        }
    };
    return TowerFiller;
}(MyCreep));
/// <reference path="../creeps/towerFiller/towerFillerDefinition.ts" />
/// <reference path="../creeps/towerFiller/towerFiller.ts" />
/// <reference path="./manager.ts" />
var TowerManager = (function () {
    function TowerManager(mainRoom) {
        this.mainRoom = mainRoom;
        this._creeps = { time: -1, creeps: null };
        if (myMemory['profilerActive']) {
            this.preTick = profiler.registerFN(this.preTick, 'TowerManager.preTick');
            this.tick = profiler.registerFN(this.tick, 'TowerManager.tick');
        }
    }
    Object.defineProperty(TowerManager.prototype, "memory", {
        get: function () {
            return this.accessMemory();
        },
        enumerable: true,
        configurable: true
    });
    TowerManager.prototype.accessMemory = function () {
        if (this.mainRoom.memory.towerManager == null)
            this.mainRoom.memory.towerManager = {
                debug: false,
                verbose: false
            };
        return this.mainRoom.memory.towerManager;
    };
    Object.defineProperty(TowerManager.prototype, "creeps", {
        get: function () {
            if (this._creeps.time < Game.time)
                this._creeps = {
                    time: Game.time, creeps: this.mainRoom.creepsByRole('towerFiller')
                };
            return this._creeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    TowerManager.prototype.preTick = function () {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if ((this.mainRoom.towers.length == 0 || this.mainRoom.mainContainer == null) || (_.all(this.mainRoom.towers, function (x) { return x.energy > 0.5 * x.energyCapacity; }) && _.size(this.mainRoom.myRoom.hostileScan.creeps) == 0))
            return;
        if (this.creeps.length < 1) {
            this.mainRoom.spawnManager.addToQueue(TowerFillerDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, this.mainRoom.towers.length).getBody(), { role: 'towerFiller' }, 1);
        }
    };
    TowerManager.prototype.tick = function () {
        var _this = this;
        this.creeps.forEach(function (c) { return new TowerFiller(c.name, _this.mainRoom).tick(); });
    };
    return TowerManager;
}());
var MineralHarvesterDefinition;
(function (MineralHarvesterDefinition) {
    function getDefinition(maxEnergy, myMineral, resources) {
        var baseBody = new Body();
        //baseBody.carry = 2;
        if (myMineral.hasKeeper) {
            baseBody.heal = 2;
            baseBody.move = 1;
        }
        var remainingEnergy = maxEnergy - baseBody.costs;
        if (remainingEnergy < BODYPART_COST.work + BODYPART_COST.move)
            return { count: 0, body: baseBody };
        var workBody = new Body();
        workBody.work = ['H', 'O', 'X'].indexOf(myMineral.resourceType) >= 0 ? 20 : 10;
        if (myMineral.hasKeeper)
            workBody.work *= 1;
        workBody.move = Math.ceil(workBody.work / 2);
        if (resources) {
            var boostCompound = _.filter(_.sortByOrder(ReactionManager.BOOSTPOWERS['harvest'].resources, [function (r) { return r.resource; }], ['desc']), function (r) { return resources[r.resource] >= Math.ceil(workBody.work / r.factor) * LAB_BOOST_MINERAL; })[0];
            if (boostCompound) {
                workBody.work = Math.ceil(workBody.work / boostCompound.factor);
                workBody.boosts[boostCompound.resource] = { compound: boostCompound.resource, amount: workBody.work };
            }
        }
        var count = 1;
        if (workBody.costs > remainingEnergy) {
            count = Math.ceil(workBody.costs / maxEnergy);
            workBody.work = Math.ceil(workBody.work / count);
            workBody.move = Math.ceil(workBody.work / 2);
            _.forEach(workBody.boosts, function (b) { return b.amount = Math.min(b.amount, workBody.work); });
        }
        workBody.move += baseBody.move;
        workBody.heal += baseBody.heal;
        workBody.carry += baseBody.carry;
        return { count: Math.min(count, myMineral.maxHarvestingSpots - (myMineral.hasKeeper ? 1 : 0)), body: workBody };
    }
    MineralHarvesterDefinition.getDefinition = getDefinition;
})(MineralHarvesterDefinition || (MineralHarvesterDefinition = {}));
/// <reference path="../myCreep.ts" />
var MineralHarvester = (function (_super) {
    __extends(MineralHarvester, _super);
    function MineralHarvester(name, mainRoom) {
        _super.call(this, name);
        this.name = name;
        this.mainRoom = mainRoom;
        this.healed = false;
        this.autoFlee = true;
        if (myMemory['profilerActive']) {
            this.myTick = profiler.registerFN(this.myTick, 'MineralHarvester.tick');
        }
    }
    Object.defineProperty(MineralHarvester.prototype, "mineral", {
        get: function () {
            if (this.mineral == null || this._mineral.time < Game.time)
                this._mineral = {
                    time: Game.time, mineral: Game.getObjectById(this.memory.mineralId)
                };
            return this._mineral.mineral;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MineralHarvester.prototype, "myMineral", {
        get: function () {
            if (this._myMineral == null || this._myMineral.time < Game.time)
                this._myMineral = {
                    time: Game.time, myMineral: this.mainRoom.minerals[this.memory.mineralId]
                };
            return this._myMineral.myMineral;
        },
        enumerable: true,
        configurable: true
    });
    MineralHarvester.prototype.myTick = function () {
        if (this.creep.spawning) {
            return;
        }
        if (this.myMineral.amount == 0 && this.myMineral.refreshTime > Game.time + this.creep.ticksToLive) {
            this.recycle();
            return;
        }
        this.healed = false;
        if (this.creep.getActiveBodyparts(HEAL) > 0 && this.creep.hits + this.creep.getActiveBodyparts(HEAL) * HEAL_POWER <= this.creep.hitsMax) {
            this.creep.heal(this.creep);
            this.healed = true;
        }
        if (this.myMineral == null) {
            this.creep.say('NoMineral');
            return;
        }
        if (!this.creep.pos.isNearTo(this.myMineral.pos))
            this.moveTo({
                pos: this.myMineral.pos, range: 1
            }, {
                plainCost: 2,
                swampCost: 5,
                roomCallback: Colony.getCustomMatrix({
                    ignoreKeeperSourceId: this.myMineral.id
                })
            });
        else
            this.creep.harvest(this.myMineral.mineral);
    };
    return MineralHarvester;
}(MyCreep));
/// <reference path="../myCreep.ts" />
var MineralCarrier = (function (_super) {
    __extends(MineralCarrier, _super);
    function MineralCarrier(name, mainRoom) {
        _super.call(this, name);
        this.name = name;
        this.mainRoom = mainRoom;
        this.autoFlee = true;
        if (myMemory['profilerActive']) {
            this.myTick = profiler.registerFN(this.myTick, 'MineralCarrier.tick');
        }
    }
    Object.defineProperty(MineralCarrier.prototype, "mineral", {
        get: function () {
            if (this.mineral == null || this._mineral.time < Game.time)
                this._mineral = {
                    time: Game.time, mineral: Game.getObjectById(this.memory.mineralId)
                };
            return this._mineral.mineral;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MineralCarrier.prototype, "myMineral", {
        get: function () {
            if (this._myMineral == null || this._myMineral.time < Game.time)
                this._myMineral = {
                    time: Game.time, myMineral: this.mainRoom.minerals[this.memory.mineralId]
                };
            return this._myMineral.myMineral;
        },
        enumerable: true,
        configurable: true
    });
    MineralCarrier.prototype.pickUpMineral = function () {
        var _this = this;
        var resources = _.filter(Colony.getRoom(this.creep.room.name).resourceDrops, function (r) { return r.resourceType == _this.myMineral.resourceType; });
        var resource = _.filter(resources, function (r) { return (Math.pow((r.pos.x - _this.creep.pos.x), 2) + Math.pow((r.pos.y - _this.creep.pos.y), 2)) <= 16; })[0];
        if (resource != null) {
            if (this.creep.pickup(resource) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(resource);
            return true;
        }
        else if (resource == null && this.myMineral.amount == 0 && this.myMineral.refreshTime > Game.time + this.creep.ticksToLive)
            this.recycle();
        return false;
    };
    MineralCarrier.prototype.myTick = function () {
        if (this.creep.spawning) {
            return;
        }
        if (!this.myMineral) {
            this.creep.say('NoMineral');
            return;
        }
        if (this.memory.state == null || this.memory.state == 1 /* Deliver */ && (this.creep.carry[this.myMineral.resourceType] == null || this.creep.carry[this.myMineral.resourceType] == 0)) {
            this.memory.path = PathFinder.search(this.creep.pos, { pos: this.myMineral.pos, range: 6 }, { roomCallback: Colony.getTravelMatrix, plainCost: 1, swampCost: 1 });
            this.memory.path.path.unshift(this.creep.pos);
            this.memory.state = 0 /* Pickup */;
        }
        else if (this.memory.state == 0 /* Pickup */ && _.sum(this.creep.carry) >= 0.5 * this.creep.carryCapacity) {
            if (this.mainRoom.terminal == null) {
                this.creep.say('NoTerm');
                return;
            }
            this.memory.path = PathFinder.search(this.creep.pos, { pos: this.mainRoom.terminal.pos, range: 3 }, { roomCallback: Colony.getTravelMatrix, plainCost: 2, swampCost: 10 });
            this.memory.path.path.unshift(this.creep.pos);
            this.memory.state = 1 /* Deliver */;
        }
        if (this.memory.state == 0 /* Pickup */) {
            if (!this.pickUpMineral()) {
                if (this.memory.path.path.length > 2) {
                    this.moveByPath();
                }
                else {
                    if (this.creep.room.name != this.myMineral.pos.roomName || !this.creep.pos.inRangeTo(this.myMineral.pos, 2))
                        this.creep.moveTo(this.myMineral.pos);
                }
            }
        }
        else if (this.memory.state == 1 /* Deliver */) {
            if (!this.mainRoom || !this.mainRoom.terminal) {
                return;
            }
            if (this.memory.path.path.length > 2) {
                this.moveByPath();
            }
            else {
                if (this.creep.transfer(this.mainRoom.terminal, this.myMineral.resourceType) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(this.mainRoom.terminal);
            }
        }
    };
    return MineralCarrier;
}(MyCreep));
/// <reference path="../creeps/minerals/mineralHarvesterDefinition.ts" />
/// <reference path="../creeps/minerals/mineralHarvester.ts" />
/// <reference path="../creeps/sourceCarrier/sourceCarrierDefinition.ts" />
/// <reference path="../creeps/minerals/mineralCarrier.ts" />
/// <reference path="./manager.ts" />
var MineralHarvestingManager = (function () {
    function MineralHarvestingManager(mainRoom) {
        this.mainRoom = mainRoom;
        if (myMemory['profilerActive']) {
            this.preTick = profiler.registerFN(this.preTick, 'MineralHarvestingManager.preTick');
            this.tick = profiler.registerFN(this.tick, 'MineralHarvestingManager.tick');
        }
    }
    Object.defineProperty(MineralHarvestingManager.prototype, "harvesters", {
        get: function () {
            var _this = this;
            if (this._harvesters == null)
                this._harvesters = { time: Game.time, harvesters: _.indexBy(_.map(this.harvesterCreeps, function (c) { return new Harvester(c.name, _this.mainRoom); }), function (x) { return x.name; }) };
            else if (this._harvesters.time < Game.time) {
                _.forEach(this.harvesterCreeps, function (c) {
                    if (!_this._harvesters.harvesters[c.name])
                        _this._harvesters.harvesters[c.name] = new Harvester(c.name, _this.mainRoom);
                });
            }
            return this._harvesters.harvesters;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MineralHarvestingManager.prototype, "sourceCarriers", {
        get: function () {
            var _this = this;
            if (this._sourceCarriers == null)
                this._sourceCarriers = { time: Game.time, sourceCarriers: _.indexBy(_.map(this.carrierCreeps, function (c) { return new HarvestingCarrier(c.name, _this.mainRoom); }), function (x) { return x.name; }) };
            else if (this._sourceCarriers.time < Game.time) {
                _.forEach(this.carrierCreeps, function (c) {
                    if (!_this._sourceCarriers.sourceCarriers[c.name])
                        _this._sourceCarriers.sourceCarriers[c.name] = new HarvestingCarrier(c.name, _this.mainRoom);
                });
            }
            return this._sourceCarriers.sourceCarriers;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MineralHarvestingManager.prototype, "harvesterCreeps", {
        get: function () {
            var _this = this;
            if (this._harvesterCreeps == null || this._harvesterCreeps.time < Game.time)
                this._harvesterCreeps = {
                    time: Game.time, creeps: _.filter(this.mainRoom.creepsByRole('mineralHarvester'), function (c) { return _this.mainRoom.minerals[c.memory.sId]; })
                };
            return this._harvesterCreeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MineralHarvestingManager.prototype, "carrierCreeps", {
        get: function () {
            var _this = this;
            if (this._carrierCreeps == null || this._carrierCreeps.time < Game.time)
                this._carrierCreeps = {
                    time: Game.time, creeps: _.filter(this.mainRoom.creepsByRole('mineralCarrier'), function (c) { return _this.mainRoom.minerals[c.memory.sId]; })
                };
            return this._carrierCreeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MineralHarvestingManager.prototype, "harvestersByMineral", {
        get: function () {
            if (this._harvestersByMineral == null || this._harvestersByMineral.time < Game.time)
                this._harvestersByMineral = {
                    time: Game.time, harvesters: _.groupBy(this.harvesterCreeps, function (x) { return x.memory.sId; })
                };
            return this._harvestersByMineral.harvesters;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MineralHarvestingManager.prototype, "carriersByMineral", {
        get: function () {
            if (this._carriersByMineral == null || this._carriersByMineral.time < Game.time)
                this._carriersByMineral = {
                    time: Game.time, carriers: _.groupBy(this.carrierCreeps, function (x) { return x.memory.sId; })
                };
            return this._carriersByMineral.carriers;
        },
        enumerable: true,
        configurable: true
    });
    MineralHarvestingManager.prototype.preTick = function (myRoom) {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if (_.size(this.mainRoom.managers.labManager.myLabs) == 0)
            return;
        var myMineral = myRoom.myMineral;
        if (myMineral == null || (myMineral.hasKeeper && _.size(this.mainRoom.managers.labManager.myLabs) == 0) || !myMineral.hasExtractor)
            return;
        if (myMineral.myRoom && _.any(myMineral.myRoom.hostileScan.creeps, function (c) { return c.bodyInfo.totalAttackRate > 0; }))
            return;
        //console.log('MineralHarvestingManager.checkCreeps()');
        if ((!myMineral.hasKeeper || _.size(this.mainRoom.managers.labManager.myLabs) > 0 && myMineral.maxHarvestingSpots > 1) && this.mainRoom.terminal && myMineral.hasExtractor && (myMineral.amount > 0 || myMineral.refreshTime <= Game.time)) {
            //  console.log('MineralHarvestingManager.checkCreeps - 2');
            var targetAmount = Colony.reactionManager.requiredAmount * 5;
            var mineralType = myMineral.resourceType;
            if (mineralType == RESOURCE_HYDROGEN || mineralType == RESOURCE_OXYGEN || mineralType == RESOURCE_CATALYST) {
                targetAmount = Colony.reactionManager.requiredAmount * 10;
            }
            //console.log('MineralHarvestingManager.checkCreeps target: ' + targetAmount + ' value: ' + this.mainRoom.terminal.store[mineralType]);
            if (this.mainRoom.terminal.store[mineralType] == null || this.mainRoom.terminal.store[mineralType] < targetAmount) {
                var harvesters = this.harvestersByMineral[myMineral.id];
                var harvesterCount = harvesters ? harvesters.length : 0;
                //console.log('MineralHarvestingManager.checkCreeps - 3');
                if (harvesterCount == 0) {
                    //      console.log('MineralHarvestingManager.checkCreeps - 4');
                    var definition_1 = MineralHarvesterDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, myMineral, this.mainRoom.managers.labManager.availablePublishResources);
                    this.mainRoom.spawnManager.addToQueue(definition_1.body.getBody(), { role: 'mineralHarvester', sId: myMineral.id }, definition_1.count);
                }
                var carriers = this.carriersByMineral[myMineral.id];
                var carrierCount = carriers ? carriers.length : 0;
                //        console.log('MineralHarvestingManager.checkCreeps - 5');
                //let pathLength = PathFinder.search(this.mainRoom.extractor.pos, { pos: this.mainRoom.terminal.pos, range: 2 }).path.length;
                var pathLength = (myMineral.pathLengthToDropOff + 10) * 1.1;
                var requiredCapacity = Math.ceil(pathLength * 2 * 10 * (['O', 'H'].indexOf(myMineral.resourceType) >= 0 ? 2 : 1) / (myMineral.hasKeeper ? 2 : 1));
                //console.log('Mineral Carrier: required capacits' + requiredCapacity);
                var definition = SourceCarrierDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, requiredCapacity, this.mainRoom.managers.labManager.availablePublishResources);
                //console.log('Mineral Carrier: ' + definition.count);
                //console.log('Mineral Carrier: body size ' + definition.body.getBody().length);
                this.mainRoom.spawnManager.addToQueue(definition.body.getBody(), { role: 'mineralCarrier', sId: myMineral.id }, definition.count - carrierCount);
            }
        }
    };
    MineralHarvestingManager.prototype.tick = function () {
        //let startCpu = Game.cpu.getUsed();
        //this.harvesterCreeps.forEach((c) => { try { new MineralHarvester(c.name, this.mainRoom).tick() } catch (e) { c.say('ERROR'); console.log(e.stack); } });
        _.forEach(this.harvesters, function (h) { return h.tick(); });
        //console.log('Harvesters ' + this.mainRoom.name + ' [' + this.harvesterCreeps.length + ']: ' + (Game.cpu.getUsed() - startCpu).toFixed(2) + ' CPU');
        //startCpu = Game.cpu.getUsed();
        _.forEach(this.sourceCarriers, function (c) { return c.tick(); });
        //this.carrierCreeps.forEach((c) => { try { new MineralCarrier(c.name, this.mainRoom).tick() } catch (e) { c.say('ERROR'); console.log(e.stack); } });
        //console.log('SourceCarriers ' + this.mainRoom.name + ' [' + this.harvesterCreeps.length + ']: ' + (Game.cpu.getUsed() - startCpu).toFixed(2) + ' CPU');
    };
    return MineralHarvestingManager;
}());
/// <reference path="../body.ts" />
var TerminalFillerDefinition;
(function (TerminalFillerDefinition) {
    function getDefinition(maxEnergy) {
        var body = new Body();
        body.carry = 9;
        body.move = 3;
        return body;
    }
    TerminalFillerDefinition.getDefinition = getDefinition;
})(TerminalFillerDefinition || (TerminalFillerDefinition = {}));
/// <reference path="../myCreep.ts" />
var TerminalFiller = (function (_super) {
    __extends(TerminalFiller, _super);
    function TerminalFiller(name, mainRoom) {
        _super.call(this, name);
        this.name = name;
        this.mainRoom = mainRoom;
        if (myMemory['profilerActive']) {
            this.myTick = profiler.registerFN(this.myTick, 'TerminalFiller.tick');
        }
    }
    Object.defineProperty(TerminalFiller.prototype, "mainContainer", {
        get: function () {
            return this.mainRoom.mainContainer;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TerminalFiller.prototype, "terminal", {
        get: function () {
            return this.mainRoom.terminal;
        },
        enumerable: true,
        configurable: true
    });
    TerminalFiller.prototype.saveBeforeDeath = function () {
        var _this = this;
        if (this.creep.transfer(this.terminal, _.filter(_.keys(this.creep.carry), function (r) { return _this.creep.carry[r] > 0; })[0]) == ERR_NOT_IN_RANGE)
            this.creep.moveTo(this.terminal);
    };
    TerminalFiller.prototype.deliverCompounds = function (publishableCompounds) {
    };
    TerminalFiller.prototype.transferCompounds = function () {
        var _this = this;
        var compounds = Colony.reactionManager.publishableCompounds;
        if (this.mainRoom.nuker)
            compounds.push(RESOURCE_GHODIUM);
        var publishableCompounds = _.indexBy(compounds, function (x) { return x; });
        if (_.sum(this.creep.carry) > this.creep.carry.energy) {
            for (var resource in this.creep.carry) {
                if (resource == RESOURCE_ENERGY)
                    continue;
                if (publishableCompounds[resource] && (this.mainContainer.store[resource] == null || this.mainContainer.store[resource] <= 5000)) {
                    if (this.creep.transfer(this.mainContainer, resource) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(this.mainContainer);
                }
                else {
                    if (this.creep.transfer(this.terminal, resource) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(this.terminal);
                }
                return true;
            }
        }
        else {
            var resourceToTransfer = _.filter(Colony.reactionManager.publishableCompounds, function (c) { return (_this.mainContainer.store[c] == null || _this.mainContainer.store[c] < 5000) && _this.terminal.store[c] > 0; })[0];
            if (resourceToTransfer) {
                if (this.creep.withdraw(this.terminal, resourceToTransfer) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(this.terminal);
                return true;
            }
            resourceToTransfer = null;
            for (var resource in this.mainContainer.store) {
                if (resource == RESOURCE_ENERGY)
                    continue;
                if (!publishableCompounds[resource] && this.mainContainer.store[resource] > 0 || this.mainContainer.store[resource] > 5000 + this.creep.carryCapacity) {
                    if (this.creep.withdraw(this.mainContainer, resource) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(this.mainContainer);
                    return true;
                }
            }
        }
        return false;
    };
    TerminalFiller.prototype.transferEnergy = function () {
        var pickUpStruct = null;
        var dropOffStruct = null;
        if (this.terminal.store.energy < 24000 && this.mainContainer.store.energy > this.mainRoom.maxSpawnEnergy * 2) {
            pickUpStruct = this.mainContainer;
            dropOffStruct = this.terminal;
        }
        else if (this.terminal.store.energy > 26000) {
            pickUpStruct = this.terminal;
            dropOffStruct = this.mainContainer;
        }
        if (pickUpStruct && dropOffStruct) {
            if (this.creep.carry.energy == 0) {
                if (this.creep.withdraw(pickUpStruct, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(pickUpStruct);
            }
            else {
                if (this.creep.transfer(dropOffStruct, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(dropOffStruct);
            }
            return true;
        }
        else {
            return false;
        }
    };
    TerminalFiller.prototype.myTick = function () {
        var _this = this;
        var store = this.mainRoom.mainContainer;
        var terminal = this.mainRoom.room.terminal;
        if (this.creep.ticksToLive <= 20 && _.sum(this.creep.carry) > 0) {
            this.saveBeforeDeath();
        }
        else if (_.sum(this.creep.carry) < this.creep.carryCapacity && _.filter(this.mainRoom.myRoom.resourceDrops, function (x) { return x.resourceType == RESOURCE_ENERGY && x.pos.inRangeTo(_this.mainRoom.mainContainer.pos, 10); }).length > 0) {
            var energy = _.filter(this.mainRoom.myRoom.resourceDrops, function (x) { return x.resourceType == RESOURCE_ENERGY && x.pos.inRangeTo(_this.mainRoom.mainContainer.pos, 10); })[0];
            if (energy) {
                if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(energy);
            }
        }
        else if (this.memory.idleUntil == null || this.memory.idleUntil <= Game.time) {
            if (this.creep.carry.energy > 0)
                this.transferEnergy();
            else if (_.sum(this.creep.carry) > 0)
                this.transferCompounds();
            else {
                if (!(this.transferEnergy() || this.transferCompounds())) {
                    this.memory.idleUntil = Game.time + 20;
                }
            }
        }
    };
    return TerminalFiller;
}(MyCreep));
/// <reference path="../creeps/terminalFiller/terminalFillerDefinition.ts" />
/// <reference path="../creeps/terminalFiller/terminalFiller.ts" />
var TerminalManager = (function () {
    function TerminalManager(mainRoom) {
        this.mainRoom = mainRoom;
        this._creeps = { time: 0, creeps: null };
        this.maxCreeps = 1;
        if (myMemory['profilerActive']) {
            this.preTick = profiler.registerFN(this.preTick, 'TerminalManager.preTick');
            this.tick = profiler.registerFN(this.tick, 'TerminalManager.tick');
        }
    }
    Object.defineProperty(TerminalManager.prototype, "memory", {
        get: function () {
            return this.accessMemory();
        },
        enumerable: true,
        configurable: true
    });
    TerminalManager.prototype.accessMemory = function () {
        if (this.mainRoom.memory.terminalManager == null)
            this.mainRoom.memory.terminalManager = {
                tradeAgreements: [],
                transactionCheckTime: -1
            };
        return this.mainRoom.memory.terminalManager;
    };
    Object.defineProperty(TerminalManager.prototype, "creeps", {
        get: function () {
            if (this._creeps.time < Game.time)
                this._creeps = {
                    time: Game.time, creeps: this.mainRoom.creepsByRole('terminalManager')
                };
            return this._creeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    TerminalManager.prototype.preTick = function () {
        if (!this.mainRoom.room || !this.mainRoom.mainContainer || !this.mainRoom.room.terminal || !this.mainRoom.room.terminal.isActive() || this.mainRoom.spawnManager.isBusy)
            return;
        if (this.creeps.length == 0) {
            this.mainRoom.spawnManager.addToQueue(TerminalFillerDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'terminalManager' }, this.maxCreeps - this.creeps.length);
        }
    };
    TerminalManager.prototype.tick = function () {
        var _this = this;
        if (!this.mainRoom.room || !this.mainRoom.mainContainer || !this.mainRoom.room.terminal || !this.mainRoom.room.terminal.isActive()) {
            return;
        }
        _.forEach(this.creeps, function (x) { return new TerminalFiller(x.name, _this.mainRoom).tick(); });
        this.handleTerminal(this.mainRoom.room.terminal);
    };
    TerminalManager.prototype.handleTradeAgreements = function (terminal) {
        var _this = this;
        var incomingTransactions = _.filter(Game.market.incomingTransactions, function (transaction) { return transaction.time >= _this.memory.transactionCheckTime && transaction.to == _this.mainRoom.name; });
        _.forEach(incomingTransactions, function (transaction) {
            var tradeAgreements = _.filter(_this.memory.tradeAgreements, function (ta) { return ta.partnerName == transaction.sender.username && ta.receivingResource == transaction.resourceType && Game.map.getRoomLinearDistance(_this.mainRoom.room.name, transaction.from) <= ta.maxDistance; });
            _.forEach(tradeAgreements, function (tradeAgreement) {
                tradeAgreement.openPaymentResource += transaction.amount * tradeAgreement.paymentFactor;
                if (tradeAgreement.returnTax) {
                    tradeAgreement.openPaymentTax += 0.1 * transaction.amount * Math.min(Game.map.getRoomLinearDistance(_this.mainRoom.room.name, transaction.from), tradeAgreement.maxDistance);
                }
            });
        });
        var outgoingTransactions = _.filter(Game.market.outgoingTransactions, function (transaction) { return transaction.time >= _this.memory.transactionCheckTime && transaction.from == _this.mainRoom.name && (transaction.description == "Payment Tax" || transaction.description == "Payment Resource"); });
        _.forEach(outgoingTransactions, function (transaction) {
            var tradeAgreement = _.filter(_this.memory.tradeAgreements, function (ta) { return (transaction.description == 'Payment Tax' && ta.openPaymentTax >= transaction.amount || transaction.description == 'Payment Resource' && ta.openPaymentResource >= transaction.amount && ta.paymentResource == transaction.resourceType) && ta.partnerName == transaction.recipient.username && ta.paymentRoomName == transaction.to; })[0];
            if (tradeAgreement) {
                if (transaction.description == 'Payment Tax')
                    tradeAgreement.openPaymentTax -= transaction.amount;
                else if (transaction.description == 'Payment Resource')
                    tradeAgreement.openPaymentResource -= transaction.amount;
            }
        });
        this.memory.transactionCheckTime = Game.time;
        if (this.resourceSentOn < Game.time) {
            var openPayment = _.filter(this.memory.tradeAgreements, function (tradeAgreement) { return tradeAgreement.openPaymentResource >= 10 && terminal.store[tradeAgreement.paymentResource] >= 1000 || tradeAgreement.openPaymentTax >= 10; })[0];
            if (openPayment) {
                if (openPayment.openPaymentTax) {
                    var maxAmount = ~~(terminal.store.energy / (1 + 0.1 * Game.map.getRoomLinearDistance(this.mainRoom.room.name, openPayment.paymentRoomName)));
                    var amount = Math.min(maxAmount, openPayment.openPaymentTax);
                    this.send(RESOURCE_ENERGY, amount, openPayment.paymentRoomName, 'Payment Tax');
                }
                else if (openPayment.openPaymentResource) {
                    var maxAmount = Math.min(terminal.store[openPayment.paymentResource], ~~(terminal.store.energy * (0.1 * Game.map.getRoomLinearDistance(this.mainRoom.room.name, openPayment.paymentRoomName))));
                    var amount = Math.min(maxAmount, openPayment.openPaymentResource);
                    this.send(openPayment.paymentResource, amount, openPayment.paymentRoomName, 'Payment Resource');
                }
            }
        }
    };
    TerminalManager.prototype.handleEnergyBalance = function (terminal) {
        //if ((this.resourceSentOn == null || this.resourceSentOn < Game.time) && this.mainRoom.mainContainer.store.energy > 450000 && terminal.store.energy > 1000) {
        //    let targetMainRoom = _.sortByAll(_.filter(Colony.mainRooms, x => x.mainContainer && x.room && x.room.terminal && x.room.terminal.isActive() && x.mainContainer.store.energy < 350000 && Game.map.getRoomLinearDistance(this.mainRoom.name, x.name) <= 3), [x => Game.map.getRoomLinearDistance(this.mainRoom.name, x.name), x => x.mainContainer.store.energy])[0];
        //    if (targetMainRoom) {
        var _this = this;
        //        let amountToTransfer = Math.min(this.mainRoom.mainContainer.store.energy - 400000, 400000 - targetMainRoom.mainContainer.store.energy, terminal.store.energy, targetMainRoom.room.terminal.storeCapacity - targetMainRoom.room.terminal.store.energy);
        //        let distance = Game.map.getRoomLinearDistance(this.mainRoom.name, targetMainRoom.name);
        //        let tax = Math.ceil(0.1 * amountToTransfer * distance);
        //        amountToTransfer -= tax;
        //        console.log('Terminal send ' + amountToTransfer + '  from ' + this.mainRoom.name + ' to ' + targetMainRoom.name + ': ' + terminal.send(RESOURCE_ENERGY, amountToTransfer, targetMainRoom.name));
        //    }
        //}
        if ((this.resourceSentOn == null || this.resourceSentOn < Game.time) && this.mainRoom.mainContainer.store.energy + terminal.store.energy < 50000) {
            var amount_1 = 10000;
            var supplierRoom = _.sortBy(_.filter(Colony.mainRooms, function (x) { return x.terminal && x.managers.terminalManager && (x.managers.terminalManager.resourceSentOn == null || x.managers.terminalManager.resourceSentOn < Game.time) && x.terminal.store.energy > amount_1 && x.mainContainer && x.mainContainer.store.energy > 100000; }), function (x) { return Game.map.getRoomLinearDistance(x.name, _this.mainRoom.name); })[0];
            if (supplierRoom) {
                var distance = Game.map.getRoomLinearDistance(this.mainRoom.name, supplierRoom.name);
                var tax = Math.ceil(0.1 * amount_1 * distance);
                amount_1 -= tax;
                supplierRoom.managers.terminalManager.send(RESOURCE_ENERGY, amount_1, this.mainRoom.name);
            }
        }
    };
    TerminalManager.prototype.handleMineralBalance = function (terminal) {
        var _this = this;
        var resources = _.filter(_.uniq(Colony.reactionManager.highestPowerCompounds.concat(this.mainRoom.managers.labManager.imports)), function (x) { return x != RESOURCE_ENERGY && _this.mainRoom.getResourceAmount(x) <= 5000; });
        if (this.mainRoom.nuker)
            resources.push(RESOURCE_GHODIUM);
        _.forEach(resources, function (resource) {
            if (_this.mainRoom.mainContainer && _this.mainRoom.mainContainer.structureType == STRUCTURE_STORAGE && _.size(_this.mainRoom.managers.labManager.myLabs) > 0) {
                var requiredAmount = 5000 - _this.mainRoom.getResourceAmount(resource);
                if (requiredAmount > 0) {
                    var sender = _.sortBy(_.filter(Colony.mainRooms, function (mainRoom) { return mainRoom.name != _this.mainRoom.name && mainRoom.terminal && mainRoom.terminal.store[resource] > 0 && (mainRoom.managers.terminalManager.resourceSentOn == null || mainRoom.managers.terminalManager.resourceSentOn < Game.time) && mainRoom.getResourceAmount(resource) > ((Colony.reactionManager.highestPowerCompounds.indexOf(resource) >= 0 || mainRoom.managers.labManager && mainRoom.managers.labManager.imports.indexOf(resource) >= 0) ? 5000 : 0); }), function (x) { return Game.map.getRoomLinearDistance(_this.mainRoom.name, x.name); })[0];
                    if (sender) {
                        var possibleAmount = sender.getResourceAmount(resource) - ((Colony.reactionManager.highestPowerCompounds.indexOf(resource) >= 0 || sender.managers.labManager && sender.managers.labManager.imports.indexOf(resource) >= 0) ? 5000 : 0);
                        var amountInForeignTerminal = sender.terminal.store[resource] != null ? sender.terminal.store[resource] : 0;
                        var amount = Math.min(requiredAmount, possibleAmount, amountInForeignTerminal);
                        if (amount > 0) {
                            sender.managers.terminalManager.send(resource, amount, _this.mainRoom.name);
                        }
                    }
                }
            }
        });
    };
    TerminalManager.prototype.send = function (resource, amount, destination, description) {
        if ((this.resourceSentOn == null || this.resourceSentOn < Game.time) && this.mainRoom.terminal) {
            var result = this.mainRoom.terminal.send(resource, amount, destination, description) == OK;
            if (OK)
                this.resourceSentOn = Game.time;
            return result;
        }
    };
    TerminalManager.prototype.handleTerminal = function (terminal) {
        //this.handleTradeAgreements(this.mainRoom.room.terminal);
        if (Game.time % 15 == 0 && Game.time % 30 != 0)
            this.handleEnergyBalance(terminal);
        if (Game.time % 30 == 0)
            this.handleMineralBalance(terminal);
    };
    return TerminalManager;
}());
var MyLab = (function () {
    function MyLab(labManager, id) {
        this.labManager = labManager;
        this.id = id;
        this._connectedLabs = null;
        this._lab = null;
        if (myMemory['profilerActive'])
            this.tick = profiler.registerFN(this.tick, 'MyLab.tick');
    }
    Object.defineProperty(MyLab.prototype, "memory", {
        get: function () {
            return this.accessMemory();
        },
        enumerable: true,
        configurable: true
    });
    MyLab.prototype.accessMemory = function () {
        if (this.labManager.memory.labs[this.id] == null)
            this.labManager.memory.labs[this.id] = {
                resource: null,
                mode: null,
                reactionLabIds: null,
                backup: null,
                publishBackup: null
            };
        return this.labManager.memory.labs[this.id];
    };
    Object.defineProperty(MyLab.prototype, "connectedLabs", {
        get: function () {
            var _this = this;
            if (this._connectedLabs == null) {
                this._connectedLabs = _.filter(this.labManager.myLabs, function (l) { return l.id != _this.id && _this.lab.pos.inRangeTo(l.lab.pos, 2); });
            }
            return this._connectedLabs;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyLab.prototype, "lab", {
        get: function () {
            if (this._lab == null || this._lab.time < Game.time)
                this._lab = { time: Game.time, lab: Game.getObjectById(this.id) };
            return this._lab.lab;
        },
        enumerable: true,
        configurable: true
    });
    MyLab.prototype.backup = function () {
        var backup = {
            mode: this.memory.mode,
            resource: this.memory.resource,
            reactionLabIds: _.clone(this.memory.reactionLabIds)
        };
        this.memory.backup = backup;
    };
    MyLab.prototype.restore = function () {
        if (this.memory.backup) {
            this.memory.mode = this.memory.backup.mode;
            this.memory.resource = this.memory.backup.resource;
            this.memory.reactionLabIds = _.clone(this.memory.backup.reactionLabIds);
        }
    };
    MyLab.prototype.backupPublish = function () {
        var backup = {
            mode: this.memory.mode,
            resource: this.memory.resource,
            reactionLabIds: _.clone(this.memory.reactionLabIds)
        };
        this.memory.publishBackup = backup;
    };
    MyLab.prototype.restorePublish = function () {
        if (this.memory.publishBackup) {
            this.memory.mode = this.memory.publishBackup.mode;
            this.memory.resource = this.memory.publishBackup.resource;
            this.memory.reactionLabIds = _.clone(this.memory.publishBackup.reactionLabIds);
        }
    };
    MyLab.prototype.setUpReaction = function (resource) {
        var _this = this;
        console.log('Reaction Manager: Trying to setup ' + resource);
        if (this.memory.resource != null && this.memory.resource != resource || this.memory.mode & 2 /* reaction */)
            return null;
        this.memory.reactionLabIds = [];
        var ingredients = Colony.reactionManager.ingredients[resource];
        this.memory.resource = resource;
        this.memory.mode &= ~1 /* import */;
        this.memory.mode |= 2 /* reaction */;
        var affectedLabs = [this];
        _.forEach(ingredients, function (ing) {
            var lab = _.filter(_this.connectedLabs, function (x) { return x.memory.resource == ing && x.memory.mode & 1 /* import */; })[0] || _.filter(_this.connectedLabs, function (x) { return x.memory.mode == 0 /* available */; })[0];
            if (lab) {
                _this.memory.reactionLabIds.push(lab.id);
                if (lab.memory.mode == 0 /* available */) {
                    lab.memory.resource = ing;
                    lab.memory.mode = 1 /* import */;
                    affectedLabs.push(lab);
                }
            }
        });
        return affectedLabs;
    };
    MyLab.prototype.reset = function () {
        this.memory.mode = 0 /* available */;
        this.memory.reactionLabIds = [];
        this.memory.resource = null;
    };
    MyLab.prototype.requiredLabsForReaction = function (resource) {
        var _this = this;
        if (this.memory.resource != null && this.memory.resource != resource || this.memory.mode & 2 /* reaction */)
            return null;
        var ingredients = Colony.reactionManager.ingredients[resource];
        var requiredLabs = 2;
        _.forEach(ingredients, function (ing) {
            if (_.any(_this.connectedLabs, function (x) { return x.memory.resource == ing && x.memory.mode & 1 /* import */; }))
                requiredLabs--;
        });
        var availableLabs = _.filter(this.connectedLabs, function (x) { return x.memory.mode == 0 /* available */; }).length;
        if (availableLabs < requiredLabs)
            return null;
        else
            return requiredLabs + (this.memory.mode == 0 /* available */ ? 1 : 0);
    };
    MyLab.prototype.tick = function () {
        var _this = this;
        //console.log('myLab.tick try room: ' + this.labManager.mainRoom.name);
        if (Game.time % LAB_COOLDOWN == 0) {
            try {
                if (this.memory.mode & 2 /* reaction */ && this.lab && this.lab.cooldown == 0 && this.memory.reactionLabIds.length == 2 && (this.lab.mineralType == this.memory.resource || this.lab.mineralAmount == 0)) {
                    if (_.all(this.memory.reactionLabIds, function (x) { return _this.labManager.myLabs[x].lab != null && _this.labManager.myLabs[x].lab.mineralType == _this.labManager.myLabs[x].memory.resource && _this.labManager.myLabs[x].lab.mineralAmount >= LAB_COOLDOWN; })) {
                        this.lab.runReaction(this.labManager.myLabs[this.memory.reactionLabIds[0]].lab, this.labManager.myLabs[this.memory.reactionLabIds[1]].lab);
                    }
                }
            }
            catch (e) {
                console.log(e.stack);
            }
        }
    };
    return MyLab;
}());
/// <reference path="../body.ts" />
var LabCarrierDefinition;
(function (LabCarrierDefinition) {
    function getDefinition(maxEnergy) {
        var body = new Body();
        body.carry = 20;
        body.move = 10;
        return body;
    }
    LabCarrierDefinition.getDefinition = getDefinition;
})(LabCarrierDefinition || (LabCarrierDefinition = {}));
/// <reference path="../myCreep.ts" />
var LabCarrier = (function (_super) {
    __extends(LabCarrier, _super);
    function LabCarrier(name, labManager) {
        _super.call(this, name);
        this.name = name;
        this.labManager = labManager;
        if (myMemory['profilerActive']) {
            this.myTick = profiler.registerFN(this.myTick, 'LabCarrier.tick');
        }
    }
    LabCarrier.prototype.dropOffEnergy = function () {
        var _this = this;
        var myLab = _.filter(this.labManager.myLabs, function (lab) { return lab.memory.mode & 4 /* publish */ && lab.lab.energy <= lab.lab.energyCapacity - _this.creep.carry.energy; })[0];
        var dropOffStructure = myLab ? myLab.lab : null;
        if (dropOffStructure == null) {
            var mainContainer = this.labManager.mainRoom.mainContainer;
            if (_.sum(mainContainer.store) <= mainContainer.storeCapacity - this.creep.carry.energy)
                dropOffStructure = mainContainer;
        }
        if (dropOffStructure) {
            if (this.creep.transfer(dropOffStructure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(dropOffStructure);
        }
        else
            this.creep.drop(RESOURCE_ENERGY);
    };
    LabCarrier.prototype.dropOffResource = function () {
        var _this = this;
        var foundTarget = false;
        //let resource =  _.keys(this.creep.carry)[0];
        //let myLab = _.filter(this.labManager.myLabs, lab => lab.memory.mode & LabMode.import && lab.memory.resource == && lab.lab.
        var _loop_3 = function(resource) {
            if (this_2.creep.carry[resource] > 0) {
                var myLab = _.filter(this_2.labManager.myLabs, function (lab) { return lab.memory.mode & 1 /* import */ && lab.memory.resource == resource && lab.lab && (lab.lab.mineralType == resource || lab.lab.mineralAmount == 0) && lab.lab.mineralAmount <= lab.lab.mineralCapacity - _this.creep.carry[resource]; })[0];
                if (myLab) {
                    if (this_2.creep.transfer(myLab.lab, resource) == ERR_NOT_IN_RANGE)
                        this_2.creep.moveTo(myLab.lab);
                    foundTarget = true;
                    return "break";
                }
            }
        };
        var this_2 = this;
        for (var resource in this.creep.carry) {
            var state_3 = _loop_3(resource);
            if (state_3 === "break") break;
        }
        if (!foundTarget && this.labManager.mainRoom.terminal) {
            for (var resource in this.creep.carry) {
                if (this.creep.carry[resource] > 0 && _.sum(this.labManager.mainRoom.terminal.store) <= this.labManager.mainRoom.terminal.storeCapacity - this.creep.carry[resource]) {
                    if (this.creep.transfer(this.labManager.mainRoom.terminal, resource) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(this.labManager.mainRoom.terminal);
                    foundTarget = true;
                    break;
                }
            }
        }
        if (!foundTarget) {
            for (var resource in this.creep.carry) {
                this.creep.drop(resource);
                break;
            }
        }
    };
    LabCarrier.prototype.pickUp = function () {
        var _this = this;
        var wrongResourceLab = _.filter(this.labManager.myLabs, function (lab) { return lab.lab && lab.memory.mode != 0 /* available */ && lab.lab.mineralAmount > 0 && lab.memory.resource != lab.lab.mineralType; })[0];
        if (wrongResourceLab) {
            //this.creep.say('A');
            if (this.creep.withdraw(wrongResourceLab.lab, wrongResourceLab.lab.mineralType) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(wrongResourceLab.lab);
            return true;
        }
        else {
            var publishLab = _.filter(this.labManager.myLabs, function (lab) { return lab.memory.mode & 4 /* publish */ && lab.lab && lab.lab.energy <= lab.lab.energyCapacity - _this.creep.carryCapacity; })[0];
            if (publishLab && this.labManager.mainRoom.mainContainer && this.labManager.mainRoom.mainContainer.store.energy > 0) {
                //this.creep.say('B');
                if (this.creep.withdraw(this.labManager.mainRoom.mainContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(this.labManager.mainRoom.mainContainer);
                return true;
            }
            else {
                var outputLab = _.filter(this.labManager.myLabs, function (lab) { return lab.memory.mode & 2 /* reaction */ && lab.lab && (lab.lab.mineralAmount >= 1000 + _this.creep.carryCapacity && !(lab.memory.mode & 4 /* publish */) || lab.lab.mineralAmount - _this.creep.carryCapacity >= lab.lab.mineralCapacity / 2); })[0];
                if (outputLab && this.labManager.mainRoom.terminal && _.sum(this.labManager.mainRoom.terminal.store) <= this.labManager.mainRoom.terminal.storeCapacity - this.creep.carryCapacity) {
                    //this.creep.say('C');
                    if (this.creep.withdraw(outputLab.lab, outputLab.lab.mineralType) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(outputLab.lab);
                    return true;
                }
                else if (this.labManager.mainRoom.terminal || this.labManager.mainRoom.mainContainer) {
                    var inputLab = null;
                    var source = null;
                    if (this.labManager.mainRoom.terminal) {
                        inputLab = _.sortByAll(_.filter(this.labManager.myLabs, function (lab) { return lab.memory.mode & 1 /* import */ && lab.lab && (lab.lab.mineralAmount == 0 || lab.lab.mineralType == lab.memory.resource && lab.lab.mineralAmount <= 2000 - _this.creep.carryCapacity) && _this.labManager.mainRoom.terminal.store[lab.memory.resource] >= 0; }), [function (x) { return (x.memory.mode & 4 /* publish */) ? 0 : 1; }, function (x) { return x.lab.mineralAmount ? x.lab.mineralAmount : 0; }])[0];
                        source = this.labManager.mainRoom.terminal;
                    }
                    if (inputLab == null && this.labManager.mainRoom.mainContainer) {
                        inputLab = _.sortByAll(_.filter(this.labManager.myLabs, function (lab) { return lab.memory.mode & 1 /* import */ && lab.lab && (lab.lab.mineralAmount == 0 || lab.lab.mineralType == lab.memory.resource && lab.lab.mineralAmount <= 2000 - _this.creep.carryCapacity) && _this.labManager.mainRoom.mainContainer.store[lab.memory.resource] >= 0; }), [function (x) { return (x.memory.mode & 4 /* publish */) ? 0 : 1; }, function (x) { return x.lab.mineralAmount ? x.lab.mineralAmount : 0; }])[0];
                        source = this.labManager.mainRoom.mainContainer;
                    }
                    if (inputLab) {
                        //this.creep.say('D');
                        if (this.creep.withdraw(source, inputLab.memory.resource) == ERR_NOT_IN_RANGE)
                            this.creep.moveTo(source);
                        return true;
                    }
                    else {
                        var drop = _.sortBy(_.filter(this.myRoom.resourceDrops, function (x) { return x.resourceType != RESOURCE_ENERGY; }), function (x) { return x.pos.getRangeTo(_this.creep.pos); })[0];
                        if (drop) {
                            if (this.creep.pickup(drop) == ERR_NOT_IN_RANGE)
                                this.creep.moveTo(drop);
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    };
    LabCarrier.prototype.saveBeforeDeath = function () {
        var _this = this;
        if (this.labManager.mainRoom.terminal && this.creep.transfer(this.labManager.mainRoom.terminal, _.filter(_.keys(this.creep.carry), function (r) { return _this.creep.carry[r] > 0; })[0]) == ERR_NOT_IN_RANGE)
            this.creep.moveTo(this.labManager.mainRoom.terminal);
    };
    LabCarrier.prototype.myTick = function () {
        if (this.creep.ticksToLive <= 50) {
            this.saveBeforeDeath();
            if (_.sum(this.creep.carry) == 0)
                this.creep.suicide();
        }
        else if (this.memory.idleUntil == null || this.memory.idleUntil <= Game.time || _.filter(this.labManager.myLabs, function (l) { return l.memory.mode & 4 /* publish */; }).length > 0) {
            if (this.creep.carry.energy > 0) {
                this.dropOffEnergy();
            }
            else if (_.sum(this.creep.carry) > 0) {
                this.dropOffResource();
            }
            else {
                if (!this.pickUp())
                    this.memory.idleUntil = Game.time + 10;
            }
        }
    };
    return LabCarrier;
}(MyCreep));
/// <reference path="../structures/myLab.ts" />
/// <reference path="../creeps/labCarrier/labCarrierDefinition.ts" />
/// <reference path="../creeps/labCarrier/labCarrier.ts" />
/// <reference path="./manager.ts" />
var LabManager = (function () {
    function LabManager(mainRoom) {
        this.mainRoom = mainRoom;
        this._creeps = { time: -1, creeps: null };
        this._publish = null;
        Colony.reactionManager.registerLabManager(this);
        if (myMemory['profilerActive']) {
            this.preTick = profiler.registerFN(this.preTick, 'LabManager.preTick');
            this.tick = profiler.registerFN(this.tick, 'LabManager.tick');
        }
    }
    Object.defineProperty(LabManager.prototype, "memory", {
        get: function () {
            return this.accessMemory();
        },
        enumerable: true,
        configurable: true
    });
    LabManager.prototype.accessMemory = function () {
        if (this.mainRoom.memory.labManager == null)
            this.mainRoom.memory.labManager = {
                labs: {}
            };
        return this.mainRoom.memory.labManager;
    };
    Object.defineProperty(LabManager.prototype, "creeps", {
        get: function () {
            if (this._creeps.time < Game.time)
                this._creeps = {
                    time: Game.time, creeps: this.mainRoom.creepsByRole('labCarrier')
                };
            return this._creeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LabManager.prototype, "availablePublishResources", {
        get: function () {
            if (this._availablePublishResources == null || this._availablePublishResources.time < Game.time) {
                var resources_1 = {};
                if (this.mainRoom.mainContainer) {
                    for (var resource in this.mainRoom.mainContainer.store) {
                        if (resources_1[resource] == null)
                            resources_1[resource] = 0;
                        resources_1[resource] += this.mainRoom.mainContainer.store[resource];
                    }
                }
                _.forEach(_.filter(this.myLabs, function (l) { return l.memory.mode & 4 /* publish */ && l.lab.mineralAmount && l.lab.mineralType == l.memory.resource; }), function (l) {
                    if (resources_1[l.memory.resource] == null)
                        resources_1[l.memory.resource] = 0;
                    resources_1[l.memory.resource] += l.lab.mineralAmount;
                });
                this._availablePublishResources = { time: Game.time, resources: resources_1 };
            }
            return this._availablePublishResources.resources;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LabManager.prototype, "myLabs", {
        get: function () {
            var _this = this;
            //let trace = this.tracer.start("Property mylabs");
            if (this._myLabs == null || this._myLabs.time + 500 < Game.time) {
                var labs = this.mainRoom.room.find(FIND_MY_STRUCTURES, { filter: function (s) { return s.structureType == STRUCTURE_LAB; } });
                this._myLabs = { time: Game.time, myLabs: _.indexBy(_.map(labs, function (l) { return new MyLab(_this, l.id); }), function (x) { return x.id; }) };
            }
            //trace.stop();
            return this._myLabs.myLabs;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LabManager.prototype, "freeLabs", {
        get: function () {
            return _.filter(this.myLabs, function (l) { return l.memory.mode == 0 /* available */; });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LabManager.prototype, "imports", {
        get: function () {
            return _.map(_.filter(this.myLabs, function (l) { return l.memory.mode & 1 /* import */; }), function (x) { return x.memory.resource; });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LabManager.prototype, "publishs", {
        get: function () {
            return _.map(_.filter(this.myLabs, function (l) { return l.memory.mode & 4 /* publish */; }), function (x) { return x.memory.resource; });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LabManager.prototype, "reactions", {
        get: function () {
            return _.map(_.filter(this.myLabs, function (l) { return l.memory.mode & 2 /* reaction */; }), function (x) { return x.memory.resource; });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LabManager.prototype, "publish", {
        get: function () {
            var _this = this;
            if (this._publish == null || this._publish.time < Game.time) {
                this._publish = { time: Game.time, publish: _.flatten(_.map(_.filter(Game.flags, function (flag) { return flag.pos.roomName == _this.mainRoom.name && flag.memory.labSettings && flag.memory.labSettings.publish; }), function (flag) { return flag.memory.labSettings.publish; })) };
            }
            return this._publish.publish;
        },
        enumerable: true,
        configurable: true
    });
    LabManager.prototype.bestLabForReaction = function (resource) {
        console.log('LabManager.bestLabForReaction');
        var labRequirements = _.map(this.myLabs, function (x) { return { lab: x, requiredLabs: x.requiredLabsForReaction(resource) }; });
        var bestLab = _.sortBy(_.filter(labRequirements, function (x) { return x.requiredLabs != null; }), function (x) { return x.requiredLabs; })[0];
        return bestLab;
    };
    LabManager.prototype.requiredLabsForReaction = function (resource) {
        var bestLab = this.bestLabForReaction(resource);
        return bestLab ? bestLab.requiredLabs : null;
    };
    LabManager.prototype.reset = function () {
        _.forEach(this.myLabs, function (x) { return x.reset(); });
    };
    LabManager.prototype.addReaction = function (resource) {
        var bestLab = this.bestLabForReaction(resource);
        if (bestLab) {
            console.log('Add reaction: found best lab');
            return bestLab.lab.setUpReaction(resource);
        }
        return null;
    };
    LabManager.prototype.backup = function () {
        _.forEach(this.myLabs, function (l) { return l.backup(); });
    };
    LabManager.prototype.restore = function () {
        _.forEach(this.myLabs, function (l) { return l.restore(); });
    };
    LabManager.prototype.preTick = function () {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if (_.any(this.myLabs, function (x) { return x.memory.mode != 0 /* available */; }) && this.creeps.length == 0) {
            var body = LabCarrierDefinition.getDefinition(this.mainRoom.maxSpawnEnergy);
            this.mainRoom.spawnManager.addToQueue(body.getBody(), { role: 'labCarrier' });
        }
    };
    LabManager.prototype.tick = function () {
        var _this = this;
        this.requiredPublishs = [];
        _.forEach(_.map(_.filter(this.mainRoom.creeps, function (c) { return c.memory.requiredBoosts && _.size(c.memory.requiredBoosts) > 0; }), function (c) { return c.memory.requiredBoosts; }), function (c) {
            for (var resource in c) {
                if (c[resource].amount > 0 && _this.requiredPublishs.indexOf(resource) < 0)
                    _this.requiredPublishs.push(resource);
            }
        });
        this.setupPublishs();
        this.restorePublishs();
        _.forEach(this.creeps, function (x) { return new LabCarrier(x.name, _this).tick(); });
        _.forEach(this.myLabs, function (x) { return x.tick(); });
    };
    LabManager.prototype.setupPublishs = function () {
        var _this = this;
        var _loop_4 = function(resource) {
            if (_.any(this_3.myLabs, function (l) { return l.memory.mode & 4 /* publish */ && l.memory.resource == resource; }))
                return "continue";
            var lab = _.filter(this_3.myLabs, function (l) { return l.memory.mode & 2 /* reaction */ && l.memory.resource == resource; })[0];
            if (lab) {
                lab.backupPublish();
                lab.memory.mode |= 1 /* import */ | 4 /* publish */;
                return "continue";
            }
            lab = _.sortBy(_.filter(this_3.myLabs, function (l) { return l.memory.mode == 0 /* available */; }), function (l) { return l.lab.mineralType == resource ? 0 : 1; })[0];
            if (lab) {
                lab.backupPublish();
                lab.memory.mode = 1 /* import */ | 4 /* publish */;
                lab.memory.resource = resource;
                return "continue";
            }
            lab = _.filter(this_3.myLabs, function (l) { return !(l.memory.mode & 4 /* publish */) && _.all(_this.myLabs, function (other) { return other.id != l.id && (!other.memory.reactionLabIds || other.memory.reactionLabIds.indexOf(l.id) < 0); }); })[0];
            if (lab) {
                lab.backupPublish();
                lab.memory.mode = 1 /* import */ | 4 /* publish */;
                lab.memory.resource = resource;
                lab.memory.reactionLabIds = [];
                return "continue";
            }
            lab = _.sortBy(_.filter(this_3.myLabs, function (l) { return !(l.memory.mode & 4 /* publish */); }), function (l) { return l.lab.mineralAmount; })[0];
            if (lab) {
                lab.backupPublish();
                lab.memory.mode = 1 /* import */ | 4 /* publish */;
                lab.memory.resource = resource;
                lab.memory.reactionLabIds = [];
                return "continue";
            }
        };
        var this_3 = this;
        for (var _i = 0, _a = this.requiredPublishs; _i < _a.length; _i++) {
            var resource = _a[_i];
            var state_4 = _loop_4(resource);
            if (state_4 === "continue") continue;
        }
    };
    LabManager.prototype.restorePublishs = function () {
        var _this = this;
        _.forEach(_.filter(this.myLabs, function (l) { return l.memory.mode & 4 /* publish */ && _this.requiredPublishs.indexOf(l.memory.resource) < 0; }), function (l) {
            l.restorePublish();
        });
    };
    return LabManager;
}());
/// <reference path="../myCreep.ts" />
var KeeperBuster = (function (_super) {
    __extends(KeeperBuster, _super);
    function KeeperBuster(name, mainRoom) {
        _super.call(this, name);
        this.name = name;
        this.mainRoom = mainRoom;
        if (myMemory['profilerActive']) {
            this.myTick = profiler.registerFN(this.myTick, 'KeeperBuster.tick');
        }
    }
    Object.defineProperty(KeeperBuster.prototype, "harvestingSitesToDefend", {
        get: function () {
            return _.filter(_.values(this.myRoom.mySources).concat(this.myRoom.myMineral), function (s) { return s.usable && s.keeper; });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(KeeperBuster.prototype, "keeperCreeps", {
        get: function () {
            return _.map(_.filter(this.harvestingSitesToDefend, function (s) { return s.keeper.creep; }), function (s) { return s.keeper.creep; });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(KeeperBuster.prototype, "keeperLairs", {
        get: function () {
            return _.map(this.harvestingSitesToDefend, function (s) { return s.keeper.lair; });
        },
        enumerable: true,
        configurable: true
    });
    KeeperBuster.prototype.myTick = function () {
        var _this = this;
        if (this.creep.hits < this.creep.hitsMax)
            this.creep.heal(this.creep);
        if (this.memory.roomName != this.creep.room.name) {
            this.creep.moveTo(new RoomPosition(25, 25, this.memory.roomName));
            return;
        }
        if (_.size(this.myRoom.hostileScan.creeps) > 0) {
            var creep = _.sortBy(_.map(this.myRoom.hostileScan.creeps, function (x) { return x.creep; }), function (x) { return Math.pow((x.pos.x - _this.creep.pos.x), 2) + Math.pow((x.pos.y - _this.creep.pos.y), 2); })[0];
            if (this.creep.rangedAttack(creep) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(creep);
            return;
        }
        if (this.memory.targetId != null) {
            var keeper = Game.getObjectById(this.memory.targetId);
            if (keeper == null || keeper.hits <= 100) {
                this.memory.targetId = null;
                keeper = null;
            }
        }
        if (keeper == null) {
            var keepers = _.map(_.filter(this.myRoom.hostileScan.creeps, function (c) { return c.owner == 'Invader'; }), function (c) { return c.creep; });
            if (keepers.length == 0)
                keepers = _.filter(this.keeperCreeps, function (x) { return x.hits > 100; });
            keeper = _.sortBy(keepers, function (x) { return _this.creep.pos.findPathTo(x.pos).length; })[0];
            if (keeper) {
                this.memory.targetId = keeper.id;
            }
        }
        if (keeper) {
            if (this.creep.rangedAttack(keeper) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(keeper);
        }
        else {
            var keeperCreep_1 = _.filter(this.keeperCreeps, function (k) { return k.ticksToLive < _this.creep.ticksToLive - 50 && _.any(_this.keeperCreeps, function (k2) { return k2.id != k.id && k2.ticksToLive >= k.ticksToLive && k2.ticksToLive < k.ticksToLive + 200; }); })[0];
            if (keeperCreep_1) {
                var closestByTime = _.sortBy(_.filter(this.keeperCreeps, function (k) { return k.id != keeperCreep_1.id && keeperCreep_1.ticksToLive <= k.ticksToLive; }), function (k) { return k.ticksToLive; })[0];
                if (!this.creep.pos.inRangeTo(keeperCreep_1.pos, 3))
                    this.creep.moveTo(keeperCreep_1);
                this.creep.say('WAIT');
                if (closestByTime.ticksToLive == 200)
                    this.creep.rangedAttack(keeperCreep_1);
            }
            else {
                var ticksUntilNextKeeperAttack = _.min(_.map(this.harvestingSitesToDefend, function (x) { return x.keeper.creep ? x.keeper.creep.ticksToLive + 300 : 0 + x.keeper.lair.ticksToSpawn; }));
                if (ticksUntilNextKeeperAttack > 500 || ticksUntilNextKeeperAttack + 200 > this.creep.ticksToLive) {
                    this.recycle();
                }
                else {
                    var nextKeeperLair = _.sortBy(this.keeperLairs, function (lair) { return lair.ticksToSpawn; })[0];
                    if (nextKeeperLair && !this.creep.pos.inRangeTo(nextKeeperLair.pos, 5)) {
                        this.creep.moveTo(nextKeeperLair);
                    }
                }
            }
        }
    };
    return KeeperBuster;
}(MyCreep));
/// <reference path="../body.ts" />
var KeeperBusterDefinition;
(function (KeeperBusterDefinition) {
    function getDefinition(maxEnergy, resources) {
        var body = new Body();
        body.tough = 1;
        var requiredHealAmount = 8 * RANGED_ATTACK_POWER;
        var requiredHealModules = requiredHealAmount / HEAL_POWER;
        var boostCompound = _.filter(_.sortByOrder(ReactionManager.BOOSTPOWERS['heal'].resources, [function (r) { return r.resource; }], ['desc']), function (r) { return resources[r.resource] >= Math.ceil(requiredHealModules / r.factor) * LAB_BOOST_MINERAL; })[0];
        if (boostCompound) {
            requiredHealModules = Math.ceil(requiredHealModules / boostCompound.factor);
            body.boosts[boostCompound.resource] = { compound: boostCompound.resource, amount: requiredHealModules };
        }
        body.heal = requiredHealModules;
        var rangedAttackModules = 12;
        boostCompound = _.filter(_.sortByOrder(ReactionManager.BOOSTPOWERS['rangedAttack'].resources, [function (r) { return r.resource; }], ['desc']), function (r) { return resources[r.resource] >= Math.ceil(rangedAttackModules / r.factor) * LAB_BOOST_MINERAL; })[0];
        if (boostCompound) {
            rangedAttackModules = Math.floor(rangedAttackModules / boostCompound.factor);
            body.boosts[boostCompound.resource] = { compound: boostCompound.resource, amount: rangedAttackModules };
        }
        body.ranged_attack = rangedAttackModules;
        body.move = body.tough + body.heal + body.ranged_attack;
        if (body.costs > maxEnergy)
            return null;
        return body;
    }
    KeeperBusterDefinition.getDefinition = getDefinition;
})(KeeperBusterDefinition || (KeeperBusterDefinition = {}));
/// <reference path="../creeps/keeperBuster/keeperBuster.ts" />
/// <reference path="../creeps/keeperBuster/keeperBusterDefinition.ts" />
/// <reference path="./manager.ts" />
var SourceKeeperManager = (function () {
    function SourceKeeperManager(mainRoom) {
        this.mainRoom = mainRoom;
        if (myMemory['profilerActive']) {
            this.preTick = profiler.registerFN(this.preTick, 'SourceKeeperManager.preTick');
            this.tick = profiler.registerFN(this.tick, 'SourceKeeperManager.tick');
        }
    }
    Object.defineProperty(SourceKeeperManager.prototype, "memory", {
        get: function () {
            return this.accessMemory();
        },
        enumerable: true,
        configurable: true
    });
    SourceKeeperManager.prototype.accessMemory = function () {
        if (this.mainRoom.memory.sourceKeeperManager == null)
            this.mainRoom.memory.sourceKeeperManager = {};
        return this.mainRoom.memory.sourceKeeperManager;
    };
    Object.defineProperty(SourceKeeperManager.prototype, "creeps", {
        get: function () {
            if (this._creeps == null || this._creeps.time < Game.time)
                this._creeps = {
                    time: Game.time, creeps: this.mainRoom.creepsByRole('keeperBuster')
                };
            return this._creeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    SourceKeeperManager.prototype.sleep = function (myRoom) {
        if (!this.memory.sleepUntil)
            this.memory.sleepUntil = {};
        this.memory.sleepUntil[myRoom.name] = Game.time + 10;
    };
    SourceKeeperManager.prototype.preTick = function (myRoom) {
        if (this.mainRoom.spawnManager.isBusy || (this.memory.sleepUntil && this.memory.sleepUntil[myRoom.name] > Game.time)) {
            return;
        }
        if (!(myRoom.myMineral.usable && myRoom.myMineral.hasKeeper && myRoom.myMineral.keeper && (!myRoom.myMineral.keeper.creep || myRoom.myMineral.keeper.creep.hits > 100) || _.any(myRoom.mySources, function (s) { return s.usable && s.hasKeeper && s.keeper && (!s.keeper.creep || s.keeper.creep.hits > 100); }))) {
            this.sleep(myRoom);
            return;
        }
        var definition = KeeperBusterDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, this.mainRoom.managers.labManager.availablePublishResources);
        if (definition == null) {
            console.log('NO KEEPERBUSTER definition');
            this.sleep(myRoom);
            return;
        }
        if (_.filter(this.creeps, function (c) { return c.memory.roomName == myRoom.name && !c.memory.recycle && (c.spawning || (c.ticksToLive != null && c.ticksToLive > _.min(myRoom.mySources, function (x) { return x.pathLengthToDropOff; }).pathLengthToDropOff + 50 + definition.getBody().length * 3)); }).length == 0) {
            if (definition != null) {
                var memory = {
                    role: 'keeperBuster',
                    requiredBoosts: definition.boosts,
                    mainRoomName: this.mainRoom.name,
                    roomName: myRoom.name,
                };
                console.log('Trying to build KeeperBuster');
                this.mainRoom.spawnManager.addToQueue(definition.getBody(), memory);
            }
        }
    };
    SourceKeeperManager.prototype.tick = function () {
        var _this = this;
        _.forEach(this.creeps, function (c) { return new KeeperBuster(c.name, _this.mainRoom).tick(); });
    };
    return SourceKeeperManager;
}());
var MyTower = (function () {
    function MyTower(tower, mainRoom) {
        this.tower = tower;
        this.mainRoom = mainRoom;
        if (myMemory['profilerActive']) {
            this.tick = profiler.registerFN(this.tick, 'MyTower.tick');
            this.handleHostiles = profiler.registerFN(this.handleHostiles, 'MyTower.handleHostiles');
            this.handleWounded = profiler.registerFN(this.handleWounded, 'MyTower.handleWounded');
            this.repairEmergencies = profiler.registerFN(this.repairEmergencies, 'MyTower.repairEmergencies');
        }
    }
    MyTower.prototype.handleHostiles = function () {
        var _this = this;
        if (this.mainRoom.myRoom.requiresDefense) {
            var closestHostile = _.sortBy(_.filter(this.mainRoom.myRoom.hostileScan.creeps, function (e) { return e.owner !== 'Source Keeper'; }), function (x) { return Math.pow((x.pos.x - _this.tower.pos.x), 2) + Math.pow((x.pos.y - _this.tower.pos.y), 2); })[0];
            //var closestHostile = this.tower.pos.findClosestByRange<Creep>(FIND_HOSTILE_CREEPS, { filter: (e: Creep) => e.owner.username !== 'Source Keeper' && Body.getFromCreep(e).heal > 0 });
            if (closestHostile == null)
                closestHostile = _.sortBy(_.filter(this.mainRoom.myRoom.hostileScan.creeps, function (e) { return e.owner !== 'Source Keeper' && e.bodyInfo.totalAttackRate > 0; }), function (x) { return Math.pow((x.pos.x - _this.tower.pos.x), 2) + Math.pow((x.pos.y - _this.tower.pos.y), 2); })[0];
            if (closestHostile == null)
                closestHostile = _.sortBy(_.filter(this.mainRoom.myRoom.hostileScan.creeps, function (e) { return e.owner !== 'Source Keeper'; }), function (x) { return Math.pow((x.pos.x - _this.tower.pos.x), 2) + Math.pow((x.pos.y - _this.tower.pos.y), 2); })[0];
            if (closestHostile != null) {
                this.tower.attack(closestHostile.creep);
                return true;
            }
        }
        return false;
    };
    MyTower.prototype.handleWounded = function () {
        var healTarget = this.mainRoom.room.find(FIND_MY_CREEPS, { filter: function (c) { return c.hits < c.hitsMax; } })[0];
        if (healTarget != null) {
            this.tower.heal(healTarget);
            return true;
        }
        return false;
    };
    MyTower.prototype.repairEmergencies = function () {
        if (this.tower.energy < this.tower.energyCapacity / 2)
            return false;
        var repairTargets = this.mainRoom.myRoom.emergencyRepairStructures;
        var repairTarget = _.sortBy(repairTargets, function (x) { return x.hits; })[0];
        console.log('Tower: Repair ' + repairTargets.length + ' repair targets');
        if (repairTarget != null) {
            var structure = Game.getObjectById(repairTarget.id);
            if (structure) {
                this.tower.repair(structure);
                if (this.mainRoom.myRoom.repairStructures[repairTarget.id])
                    this.mainRoom.myRoom.repairStructures[repairTarget.id].hits = structure.hits;
                return true;
            }
            else {
                delete this.mainRoom.myRoom.memory.rs[repairTarget.id];
            }
        }
        return false;
    };
    MyTower.prototype.tick = function () {
        this.handleHostiles() || this.handleWounded() || this.repairEmergencies();
    };
    return MyTower;
}());
var MyObserver = (function () {
    function MyObserver(mainRoom) {
        this.mainRoom = mainRoom;
        if (myMemory['profilerActive'])
            this.tick = profiler.registerFN(this.tick, 'MyObserver.tick');
    }
    Object.defineProperty(MyObserver.prototype, "memory", {
        get: function () {
            return this.accessMemory();
        },
        enumerable: true,
        configurable: true
    });
    MyObserver.prototype.accessMemory = function () {
        if (this.mainRoom.memory.myObserver == null)
            this.mainRoom.memory.myObserver = {
                scannedX: null,
                scannedY: null,
                scanTime: 0
            };
        return this.mainRoom.memory.myObserver;
    };
    Object.defineProperty(MyObserver.prototype, "observer", {
        get: function () {
            if (this._observer == null || this._observer.time < Game.time) {
                if (this._observerId == null || this._observerId.time + 100 < Game.time) {
                    this._observerId = {
                        time: Game.time, id: _.map(this.mainRoom.room.find(FIND_MY_STRUCTURES, {
                            filter: function (s) { return s.structureType == STRUCTURE_OBSERVER; }
                        }), function (x) { return x.id; })[0]
                    };
                }
                this._observer = {
                    time: Game.time,
                    observer: Game.getObjectById(this._observerId.id)
                };
            }
            return this._observer.observer;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyObserver.prototype, "roomIndex", {
        get: function () {
            if (this._roomIndex == null) {
                var indexGroups = this.mainRoom.name.match(/([EW])(\d+)([SN])(\d+)/);
                this._roomIndex = {
                    x: indexGroups[1] == 'E' ? Number(indexGroups[2]) : -(Number(indexGroups[2]) + 1),
                    y: indexGroups[3] == 'S' ? Number(indexGroups[4]) : -(Number(indexGroups[4]) + 1),
                };
            }
            return this._roomIndex;
        },
        enumerable: true,
        configurable: true
    });
    MyObserver.prototype.getRoomName = function (x, y) {
        return (x < 0 ? 'W' + (-x - 1) : 'E' + x) + (y < 0 ? 'N' + (-y - 1) : 'S' + y);
    };
    MyObserver.prototype.shouldScanRoom = function (roomName) {
        if (Colony.memory.rooms[roomName] && Colony.memory.rooms[roomName].mrn || _.any(Game.flags, function (f) { return f.pos.roomName == roomName; })) {
            return true;
        }
        if (Colony.memory.exits == null)
            Colony.memory.exits = {};
        if (!Colony.memory.exits[roomName]) {
            Colony.memory.exits[roomName] = {};
            for (var direction in Game.map.describeExits(roomName))
                Colony.memory.exits[roomName][direction] = Game.map.describeExits(roomName)[direction];
        }
        var parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
        var isHighway = (parsed[1] % 10 === 0) || (parsed[2] % 10 === 0);
        if (isHighway)
            return true;
        for (var direction in Colony.memory.exits[roomName]) {
            var exit = Colony.memory.exits[roomName][direction];
            if (Colony.memory.rooms[exit] && Colony.memory.rooms[exit].mrn) {
                return true;
            }
        }
        return false;
    };
    MyObserver.prototype.tick = function () {
        if (!this.observer)
            return;
        if (this.memory.scanTime == Game.time - 1) {
            var roomName = this.getRoomName(this.roomIndex.x + this.memory.scannedX, this.roomIndex.y + this.memory.scannedY);
            var myRoom = Colony.getRoom(roomName);
            if (myRoom && myRoom.memory.lst + 100 < Game.time) {
                myRoom.refresh();
            }
        }
        if (Game.time % 1 == 0) {
            if (this.memory.scannedX == null || this.memory.scannedY == null) {
                this.memory.scannedX = -5;
                this.memory.scannedY = -5;
            }
            else {
                this.memory.scannedX++;
                if (this.memory.scannedX > 5) {
                    this.memory.scannedX = -5;
                    this.memory.scannedY++;
                    if (this.memory.scannedY > 5)
                        this.memory.scannedY = -5;
                }
            }
            var roomName = this.getRoomName(this.roomIndex.x + this.memory.scannedX, this.roomIndex.y + this.memory.scannedY);
            if (this.shouldScanRoom(roomName)) {
                this.memory.scanTime = Game.time;
                console.log('Scanning ' + roomName);
                this.observer.observeRoom(roomName);
            }
            else if (Colony.memory.rooms[roomName])
                delete Colony.memory.rooms[roomName];
        }
    };
    return MyObserver;
}());
/// <reference path="../myCreep.ts" />
var Carrier = (function (_super) {
    __extends(Carrier, _super);
    function Carrier(name) {
        _super.call(this, name);
        this.name = name;
        this.autoFlee = true;
        if (myMemory['profilerActive']) {
            this.myTick = profiler.registerFN(this.myTick, 'Carrier.tick');
        }
    }
    Carrier.prototype.pickupEnergy = function () {
        var _this = this;
        if (this.myRoom.resourceDrops.length > 0) {
            var energy = _.filter(this.myRoom.resourceDrops, function (r) { return r.amount >= 100 && r.resourceType == RESOURCE_ENERGY && r.pos.inRangeTo(_this.creep.pos, 1); })[0];
            if (energy) {
                if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
                    return true;
            }
        }
        return false;
    };
    Carrier.prototype.myTick = function () {
        var pickupRoom = Colony.mainRooms[this.memory.sourceRoomName];
        var targetRoom = Colony.mainRooms[this.memory.targetRoomName];
        if (pickupRoom == null || pickupRoom.mainContainer == null || targetRoom == null || targetRoom.mainContainer == null)
            return;
        if (this.memory.state == null || this.memory.state == 2 /* Delivery */ && this.creep.carry.energy == 0) {
            if (this.creep.ticksToLive < 700)
                this.recycle();
            this.memory.state = 1 /* Pickup */;
        }
        else if (this.memory.state == 1 /* Pickup */ && _.sum(this.creep.carry) >= this.creep.carryCapacity / 2) {
            this.memory.state = 2 /* Delivery */;
        }
        if (this.pickUpEnergy(2))
            return;
        if (this.memory.state == 1 /* Pickup */) {
            if (!this.creep.pos.isNearTo(pickupRoom.mainContainer))
                this.moveTo({ pos: pickupRoom.mainContainer.pos, range: 1 }, { roomCallback: Colony.getTravelMatrix, maxOps: 50000 });
            else
                this.creep.withdraw(pickupRoom.mainContainer, RESOURCE_ENERGY);
        }
        else if (this.memory.state == 2 /* Delivery */) {
            if (!this.creep.pos.isNearTo(targetRoom.mainContainer))
                this.moveTo({ pos: targetRoom.mainContainer.pos, range: 1 }, { roomCallback: Colony.getTravelMatrix, maxOps: 50000 });
            else
                this.creep.transfer(targetRoom.mainContainer, RESOURCE_ENERGY);
        }
    };
    return Carrier;
}(MyCreep));
/// <reference path="../creeps/sourceCarrier/sourceCarrierDefinition.ts" />
/// <reference path="../creeps/carrier/carrier.ts" />
/// <reference path="./manager.ts" />
var CarrierManager = (function () {
    function CarrierManager(mainRoom) {
        this.mainRoom = mainRoom;
        this._carrierCreeps = { time: -1, creeps: null };
        if (myMemory['profilerActive']) {
            this.preTick = profiler.registerFN(this.preTick, 'CarrierManager.preTick');
            this.tick = profiler.registerFN(this.tick, 'CarrierManager.tick');
        }
    }
    Object.defineProperty(CarrierManager.prototype, "carrierCreeps", {
        get: function () {
            if (this._carrierCreeps.time < Game.time)
                this._carrierCreeps = {
                    time: Game.time, creeps: this.mainRoom.creepsByRole('carrier')
                };
            return this._carrierCreeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    CarrierManager.prototype.preTick = function () {
        var _this = this;
        if (this.mainRoom.terminal || !this.mainRoom.mainContainer || this.mainRoom.mainContainer.store.energy > 2 * this.mainRoom.maxSpawnEnergy)
            return;
        if (_.any(this.carrierCreeps, function (c) { return c.pos.isNearTo(_this.mainRoom.mainContainer); }))
            return;
        var closestMainRoomName = _.min(_.filter(this.mainRoom.myRoom.memory.mrd, function (d) { return d.d != 0 && Colony.mainRooms[d.n].mainContainer && Colony.mainRooms[d.n].mainContainer.store.energy >= 5 * Colony.mainRooms[d.n].maxSpawnEnergy; }), function (d) { return d.d; }).n;
        if (!closestMainRoomName)
            return;
        var closestMainRoom = Colony.mainRooms[closestMainRoomName];
        if (closestMainRoom.spawnManager.isBusy)
            return;
        var memory = {
            targetRoomName: this.mainRoom.name,
            sourceRoomName: closestMainRoomName,
            role: 'carrier',
            state: 1 /* Pickup */,
            mainRoomName: this.mainRoom.name
        };
        var definition = SourceCarrierDefinition.getDefinition(closestMainRoom.maxSpawnEnergy, 2 * this.mainRoom.maxSpawnEnergy * this.mainRoom.myRoom.memory.mrd[closestMainRoomName].d);
        console.log('Carriers required: ' + definition.count);
        console.log('Carriers existing: ' + this.carrierCreeps.length);
        console.log('Carriers size: ' + definition.body.getBody().length);
        console.log('Carriers costs: ' + definition.body.costs);
        console.log('Carriers spawn room: ' + closestMainRoom.name);
        if (definition.count - this.carrierCreeps.length > 0)
            closestMainRoom.spawnManager.addToQueue(definition.body.getBody(), memory, definition.count - this.carrierCreeps.length);
    };
    CarrierManager.prototype.tick = function () {
        _.forEach(this.carrierCreeps, function (c) { return new Carrier(c.name).tick(); });
    };
    return CarrierManager;
}());
var MyPowerBank = (function () {
    function MyPowerBank(id, mainRoom) {
        this.id = id;
        this.mainRoom = mainRoom;
    }
    Object.defineProperty(MyPowerBank.prototype, "memory", {
        get: function () {
            return this.accessMemory();
        },
        enumerable: true,
        configurable: true
    });
    MyPowerBank.prototype.accessMemory = function () {
        if (this.mainRoom.memory.powerBanks == null)
            this.mainRoom.memory.powerBanks = {};
        if (this.mainRoom.memory.powerBanks[this.id] == null && Game.getObjectById(this.id)) {
            var powerBank = Game.getObjectById(this.id);
            this.mainRoom.memory.powerBanks[this.id] = { id: this.id, pos: powerBank.pos, decaysAt: powerBank.ticksToDecay + Game.time, power: powerBank.power };
        }
        return this.mainRoom.memory.powerBanks[this.id];
    };
    return MyPowerBank;
}());
var PowerHarvester = (function () {
    function PowerHarvester() {
    }
    return PowerHarvester;
}());
/// <reference path="../structures/myPowerBank.ts" />
/// <reference path="../creeps/powerHarvester/powerHarvester.ts" />
var PowerManager = (function () {
    function PowerManager(mainRoom) {
        this.mainRoom = mainRoom;
    }
    Object.defineProperty(PowerManager.prototype, "myPowerBank", {
        get: function () {
            if (this._myPowerBank == null || this._myPowerBank.time < Game.time) {
            }
            return this._myPowerBank.myPowerBank;
        },
        enumerable: true,
        configurable: true
    });
    return PowerManager;
}());
/// <reference path="../myCreep.ts" />
var NukeFiller = (function (_super) {
    __extends(NukeFiller, _super);
    function NukeFiller(name, mainRoom) {
        _super.call(this, name);
        this.name = name;
        this.mainRoom = mainRoom;
    }
    Object.defineProperty(NukeFiller.prototype, "nuker", {
        get: function () {
            return this.mainRoom.nuker;
        },
        enumerable: true,
        configurable: true
    });
    NukeFiller.prototype.myTick = function () {
        this.creep.say('Nuker');
        if (this.mainRoom.managers.nukeManager.isReady || this.creep.ticksToLive < 50 || this.mainRoom.mainContainer == null || this.nuker == null)
            this.recycle();
        else if (this.creep.carry.energy > 0) {
            var target = (this.nuker.energy < this.nuker.energyCapacity) ? this.nuker : this.mainRoom.mainContainer;
            if (this.creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(target);
        }
        else if (this.creep.carry[RESOURCE_GHODIUM] > 0) {
            var target = (this.nuker.ghodium < this.nuker.ghodiumCapacity) ? this.nuker : this.mainRoom.mainContainer;
            if (this.creep.transfer(target, RESOURCE_GHODIUM) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(target);
        }
        else if (_.sum(this.creep.carry) > 0) {
            if (this.creep.transfer(this.mainRoom.mainContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                this.moveTo({ pos: this.mainRoom.mainContainer.pos, range: 1 });
        }
        else if (this.nuker.energy < this.nuker.energyCapacity && this.mainRoom.mainContainer.store.energy > 50000) {
            if (this.creep.withdraw(this.mainRoom.mainContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.mainRoom.mainContainer);
        }
        else if (this.nuker.ghodium < this.nuker.ghodiumCapacity) {
            if (this.creep.withdraw(this.mainRoom.mainContainer, RESOURCE_GHODIUM) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.mainRoom.mainContainer.pos);
        }
    };
    return NukeFiller;
}(MyCreep));
/// <reference path="../creeps/nukeFiller/nukeFiller.ts" />
var NukeManager = (function () {
    function NukeManager(mainRoom) {
        this.mainRoom = mainRoom;
    }
    Object.defineProperty(NukeManager.prototype, "nuker", {
        get: function () {
            return this.mainRoom.nuker;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(NukeManager.prototype, "isReady", {
        get: function () {
            return this.nuker.energyCapacity == this.nuker.energy && this.nuker.ghodiumCapacity == this.nuker.ghodium;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(NukeManager.prototype, "nukeFillers", {
        get: function () {
            var _this = this;
            if (this._nukeFillers == null)
                this._nukeFillers = { time: Game.time, nukeFillers: _.indexBy(_.map(this.nukeFillerCreeps, function (c) { return new NukeFiller(c.name, _this.mainRoom); }), function (x) { return x.name; }) };
            else if (this._nukeFillers.time < Game.time) {
                _.forEach(this.nukeFillerCreeps, function (c) {
                    if (!_this._nukeFillers.nukeFillers[c.name])
                        _this._nukeFillers.nukeFillers[c.name] = new NukeFiller(c.name, _this.mainRoom);
                });
            }
            return this._nukeFillers.nukeFillers;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(NukeManager.prototype, "nukeFillerCreeps", {
        get: function () {
            if (this._nukeFillerCreeps == null || this._nukeFillerCreeps.time < Game.time)
                this._nukeFillerCreeps = {
                    time: Game.time, creeps: this.mainRoom.creepsByRole('nukeFiller')
                };
            return this._nukeFillerCreeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    NukeManager.prototype.preTick = function () {
        if (this.mainRoom.spawnManager.isBusy || this.nukeFillerCreeps.length > 0 || !this.nuker || this.isReady)
            return;
        var memory = {
            mainRoomName: this.mainRoom.name,
            role: 'nukeFiller'
        };
        var body = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE];
        this.mainRoom.spawnManager.addToQueue(body, memory);
    };
    NukeManager.prototype.tick = function () {
        _.forEach(this.nukeFillers, function (nf) { return nf.tick(); });
    };
    return NukeManager;
}());
/// <reference path="../structures/myLink.ts" />
/// <reference path="./spawnManager.ts" />
/// <reference path="./constructionManager.ts" />
/// <reference path="./repairManager.ts" />
/// <reference path="./upgradeManager.ts" />
/// <reference path="./spawnFillManager.ts" />
/// <reference path="./energyHarvestingManager.ts" />
/// <reference path="./defenseManager.ts" />
/// <reference path="./reservationManager.ts" />
/// <reference path="./linkFillerManager.ts" />
/// <reference path="./roadConstructionManager.ts" />
/// <reference path="./towerManager.ts" />
/// <reference path="./mineralHarvestingManager.ts" />
/// <reference path="./terminalManager.ts" />
/// <reference path="./labManager.ts" />
/// <reference path="./sourceKeeperManager.ts" />
/// <reference path="../structures/myTower.ts" />
/// <reference path="../structures/myObserver.ts" />
/// <reference path="./carrierManager.ts" />
/// <reference path="./powerManager.ts" />
/// <reference path="./nukeManager.ts" />
var MainRoom = (function () {
    function MainRoom(roomName) {
        var _this = this;
        this._maxSpawnEnergy = { time: -101, maxSpawnEnergy: 300 };
        this._spawns = { time: -1, spawns: null };
        if (myMemory['profilerActive']) {
            this.creepsByRole = profiler.registerFN(this.creepsByRole, 'MainRoom.creepsByRole');
            this.tick = profiler.registerFN(this.tick, 'MainRoom.tick');
            this.tickCreeps = profiler.registerFN(this.tickCreeps, 'MainRoom.tickCreeps');
            this.checkCreeps = profiler.registerFN(this.checkCreeps, 'MainRoom.checkCreeps');
            this._creeps_get = profiler.registerFN(this._creeps_get, 'MainRoom._creeps_get');
            this._loadHarvestersShouldDeliver = profiler.registerFN(this._loadHarvestersShouldDeliver, 'MainRoom.harvestersShouldDeliver');
        }
        this.name = roomName;
        this.myRoom = Colony.getRoom(roomName);
        this.myRoom.mainRoom = this;
        if (this.myRoom.memory.mrd == null)
            this.myRoom.memory.mrd = {};
        this.myRoom.memory.mrd[this.name] = { n: this.name, d: 0 };
        //this.spawnNames = _.map(_.filter(Game.spawns, (s) => s.room.name == roomName), (s) => s.name);
        this.links = _.map(this.room.find(FIND_MY_STRUCTURES, { filter: function (x) { return x.structureType == STRUCTURE_LINK; } }), function (x) { return new MyLink(x, _this); });
        this.myObserver = new MyObserver(this);
        if (this.memory.mainPosition == null) {
            this.memory.mainPosition = this.spawns[0].pos;
        }
        //if (!this.memory.spawnManager) this.memory.spawnManager = {  }
        //if (!this.memory.constructionManager) this.memory.constructionManager = {}
        //if (!this.memory.repairManager) this.memory.repairManager = { emergencyTargets: {}, repairTargets: {} }
        //if (!this.memory.upgradeManager) this.memory.upgradeManager = {}
        //if (!this.memory.spawnFillManager) this.memory.spawnFillManager = {}
        //if (!this.memory.harvestingManager) this.memory.harvestingManager = {}
        //if (!this.memory.defenseManager) this.memory.defenseManager = {}
        //if (!this.memory.reservationManager) this.memory.reservationManager = {}
        this.spawnManager = new SpawnManager(this, this.memory.spawnManager);
        this.managers = {
            constructionManager: new ConstructionManager(this),
            repairManager: new RepairManager(this),
            upgradeManager: new UpgradeManager(this),
            spawnFillManager: new SpawnFillManager(this),
            energyHarvestingManager: new EnergyHarvestingManager(this),
            defenseManager: new DefenseManager(this),
            reservationManager: new ReservationManager(this),
            linkFillerManager: new LinkFillerManager(this),
            towerManager: new TowerManager(this),
            terminalManager: new TerminalManager(this),
            mineralHarvestingManager: new MineralHarvestingManager(this),
            sourceKeeperManager: new SourceKeeperManager(this),
            labManager: new LabManager(this),
            carrierManager: new CarrierManager(this),
            powerManager: new PowerManager(this),
            nukeManager: new NukeManager(this)
        };
        if (!this.memory.roadConstructionManager)
            this.memory.roadConstructionManager = null;
        this.roadConstructionManager = new RoadConstructionManager(this);
    }
    Object.defineProperty(MainRoom.prototype, "memory", {
        get: function () {
            return this.accessMemory();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MainRoom.prototype, "room", {
        get: function () {
            //let trace = this.tracer.start('Property room');
            if (this._room == null || this._room.time < Game.time)
                this._room = {
                    time: Game.time, room: Game.rooms[this.name]
                };
            //trace.stop();
            return this._room.room;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MainRoom.prototype, "connectedRooms", {
        get: function () {
            var _this = this;
            if (this._connectedRooms == null || this._connectedRooms.time < Game.time)
                if (this.memory.connectedRooms == null)
                    this.memory.connectedRooms = _.map(_.filter(Colony.memory.rooms, function (r) { return r.mrn == _this.name; }), function (r) { return r.name; });
            //}
            //this._connectedRooms = { time: Game.time, rooms: _.map(this.memory.connectedRooms, r => Colony.getRoom(r)) }
            //this._connectedRooms = { time: Game.time, rooms: _.filter(_.map(Colony.memory.rooms, r => Colony.getRoom(r.name)), (r) => r.name != this.name && r.mainRoom && r.mainRoom.name == this.name) }
            this._connectedRooms = { time: Game.time, rooms: _.map(_.filter(Colony.memory.rooms, function (r) { return r.name != _this.name && r.mrn == _this.name; }), function (r) { return Colony.getRoom(r.name); }) };
            return this._connectedRooms.rooms;
        },
        enumerable: true,
        configurable: true
    });
    MainRoom.prototype._loadHarvestersShouldDeliver = function () {
        if (this._harvestersShouldDeliver == null || this._harvestersShouldDeliver.time + 10 < Game.time)
            this._harvestersShouldDeliver = {
                time: Game.time,
                value: !this.mainContainer || (this.managers.energyHarvestingManager.sourceCarrierCreeps.length == 0 && this.mainContainer.store.energy < this.maxSpawnEnergy) || (this.managers.spawnFillManager.creeps.length == 0 && this.room.energyAvailable < 500)
            };
    };
    Object.defineProperty(MainRoom.prototype, "harvestersShouldDeliver", {
        get: function () {
            this._loadHarvestersShouldDeliver();
            return this._harvestersShouldDeliver.value;
        },
        enumerable: true,
        configurable: true
    });
    MainRoom.prototype.getDropOffStructure = function (resource) {
        if (this._dropOffStructure == null || this._dropOffStructure.time < Game.time)
            this._dropOffStructure = { time: Game.time, structures: {} };
        if (!this._dropOffStructure.structures[resource])
            this._dropOffStructure.structures[resource] = resource == RESOURCE_ENERGY ? this.mainContainer || this.spawns[0] : this.terminal;
        return this._dropOffStructure.structures[resource];
    };
    Object.defineProperty(MainRoom.prototype, "energyDropOffStructure", {
        get: function () {
            if (this._energyDropOffStructure == null || this._energyDropOffStructure.time < Game.time) {
                var structure = null;
                if (this.mainContainer && this.managers.spawnFillManager.creeps.length > 0)
                    structure = this.mainContainer;
                else
                    structure = _.sortBy(this.spawns, function (s) { return s.energy; })[0];
                this._energyDropOffStructure = { time: Game.time, structure: structure };
            }
            return this._energyDropOffStructure.structure;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MainRoom.prototype, "allRooms", {
        get: function () {
            return this.connectedRooms.concat(this.myRoom);
        },
        enumerable: true,
        configurable: true
    });
    MainRoom.prototype.getResourceAmount = function (resource) {
        var value = 0;
        if (this.mainContainer && this.mainContainer.store[resource])
            value += this.mainContainer.store[resource];
        if (this.terminal && this.terminal.store[resource])
            value += this.terminal.store[resource];
        return value;
    };
    Object.defineProperty(MainRoom.prototype, "harvestingActive", {
        get: function () {
            if (this.memory.harvestingActive == null)
                this.memory.harvestingActive = true;
            return this.memory.harvestingActive;
        },
        set: function (value) {
            this.memory.harvestingActive = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MainRoom.prototype, "harvestingSites", {
        get: function () {
            if (this._harvestingSites == null)
                this._harvestingSites = _.indexBy(_.values(this.minerals).concat(_.values(this.sources)), function (harvestingSite) { return harvestingSite.id; });
            return this._harvestingSites;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MainRoom.prototype, "minerals", {
        get: function () {
            if (this._minerals == null)
                this._minerals = _.indexBy(_.map(_.filter(this.allRooms, function (room) { return room.myMineral; }), function (room) { return room.myMineral; }), function (myMineral) { return myMineral.id; });
            return this._minerals;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MainRoom.prototype, "sources", {
        get: function () {
            if (this._sources == null) {
                var sources = _.indexBy(_.map(this.myRoom.mySources, function (x) { return x; }), function (x) { return x.id; });
                var rooms = _.filter(this.connectedRooms, function (x) { return x.canHarvest; });
                for (var roomIdx in rooms)
                    for (var sourceIdx in this.connectedRooms[roomIdx].mySources)
                        sources[this.connectedRooms[roomIdx].mySources[sourceIdx].id] = this.connectedRooms[roomIdx].mySources[sourceIdx];
                this._sources = sources;
            }
            return this._sources;
        },
        enumerable: true,
        configurable: true
    });
    MainRoom.prototype.invalidateSources = function () {
        this._sources = null;
    };
    Object.defineProperty(MainRoom.prototype, "terminal", {
        get: function () {
            return this.room.terminal;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MainRoom.prototype, "maxSpawnEnergy", {
        get: function () {
            if (this.mainContainer == null || this.managers.spawnFillManager.creeps.length == 0 || this.mainContainer.store.energy == 0 && this.managers.energyHarvestingManager.harvesterCreeps.length == 0) {
                return 300;
            }
            return this.room.energyCapacityAvailable;
        },
        enumerable: true,
        configurable: true
    });
    MainRoom.prototype._creeps_get = function () {
        if (this._creeps == null || this._creeps.time < Game.time)
            this._creeps = {
                time: Game.time, creeps: Colony.getCreeps(this.name)
            };
        return this._creeps.creeps;
    };
    Object.defineProperty(MainRoom.prototype, "creeps", {
        get: function () {
            return this._creeps_get();
        },
        enumerable: true,
        configurable: true
    });
    MainRoom.prototype.creepsByRole = function (role) {
        if (this._creepsByRole == null || this._creepsByRole.time < Game.time) {
            this._creepsByRole = { time: Game.time, creeps: _.groupBy(this.creeps, function (c) { return c.memory.role; }) };
        }
        return this._creepsByRole.creeps[role] || [];
    };
    Object.defineProperty(MainRoom.prototype, "mainContainerId", {
        get: function () {
            //let trace = this.tracer.start('Property mainContainerId');
            if (this.memory.mainContainerId == null || this.memory.mainContainerId.time + 100 > Game.time) {
                var container = this.checkAndPlaceStorage();
                this.memory.mainContainerId = { time: Game.time, id: container ? container.id : null };
            }
            //trace.stop();
            return this.memory.mainContainerId.id;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MainRoom.prototype, "mainContainer", {
        get: function () {
            if (this.room && this.room.storage)
                return this.room.storage;
            //let trace = this.tracer.start('Property mainContainer');
            if (this._mainContainer == null || this._mainContainer.time < Game.time)
                this._mainContainer = { time: Game.time, mainContainer: Game.getObjectById(this.mainContainerId) };
            //trace.stop();
            return this._mainContainer.mainContainer;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MainRoom.prototype, "spawns", {
        get: function () {
            var _this = this;
            //let trace = this.tracer.start('Property spawns');
            if (this._spawns.time < Game.time)
                this._spawns = {
                    time: Game.time, spawns: _.filter(Game.spawns, function (x) { return x.room.name == _this.name; })
                };
            //trace.stop();
            return this._spawns.spawns;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MainRoom.prototype, "towers", {
        get: function () {
            var _this = this;
            //let trace = this.tracer.start('Property towers');
            if (this._towerIds == null || this._towerIds.time + 100 < Game.time)
                this._towerIds = {
                    time: Game.time, ids: _.map(_.filter(this.room.find(FIND_MY_STRUCTURES, { filter: function (x) { return x.structureType == STRUCTURE_TOWER; } })), function (t) { return t.id; })
                };
            if (this._towers == null || this._towers.time < Game.time) {
                this._towers = {
                    time: Game.time, towers: []
                };
                _.forEach(this._towerIds.ids, function (id) {
                    var tower = Game.getObjectById(id);
                    if (tower)
                        _this._towers.towers.push(tower);
                });
            }
            //trace.stop();
            return this._towers.towers;
        },
        enumerable: true,
        configurable: true
    });
    MainRoom.prototype.accessMemory = function () {
        if (Colony.memory.mainRooms == null)
            Colony.memory.mainRooms = {};
        if (Colony.memory.mainRooms[this.name] == null)
            Colony.memory.mainRooms[this.name] = {
                name: this.name,
            };
        return Colony.memory.mainRooms[this.name];
    };
    Object.defineProperty(MainRoom.prototype, "mainPosition", {
        get: function () {
            return RoomPos.fromObj(this.memory.mainPosition);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MainRoom.prototype, "nuker", {
        get: function () {
            if (this._nuker == null || this._nuker.time < Game.time) {
                if (this.memory.nukerId && this.memory.nukerId.id) {
                    var nuker = Game.getObjectById(this.memory.nukerId.id);
                    if (!nuker)
                        this.memory.nukerId = { time: Game.time, id: null };
                }
                else if (!this.memory.nukerId || this.memory.nukerId.time + 100 < Game.time) {
                    nuker = this.room.find(FIND_MY_STRUCTURES, { filter: function (s) { return s.structureType == STRUCTURE_NUKER; } })[0];
                    this.memory.nukerId = { time: Game.time, id: nuker ? nuker.id : null };
                }
                this._nuker = { time: Game.time, nuker: nuker };
            }
            return this._nuker.nuker;
        },
        enumerable: true,
        configurable: true
    });
    MainRoom.prototype.placeMainContainer = function () {
        var closestSource = this.mainPosition.findClosestByPath(FIND_SOURCES);
        var targetPos = null;
        if (!closestSource)
            targetPos = new RoomPosition(this.mainPosition.x + 4, this.mainPosition.y + 4, this.name);
        else {
            targetPos = new RoomPosition(this.mainPosition.x, this.mainPosition.y, this.name);
            var direction = this.mainPosition.getDirectionTo(this.room.controller);
            switch (direction) {
                case TOP:
                    targetPos.y -= 4;
                    break;
                case TOP_RIGHT:
                    targetPos.y -= 4;
                    targetPos.x += 4;
                    break;
                case RIGHT:
                    targetPos.x += 4;
                    break;
                case BOTTOM_RIGHT:
                    targetPos.y += 4;
                    targetPos.x += 4;
                    break;
                case BOTTOM:
                    targetPos.y += 4;
                    break;
                case BOTTOM_LEFT:
                    targetPos.y += 4;
                    targetPos.x -= 4;
                    break;
                case LEFT:
                    targetPos.x -= 4;
                    break;
                case TOP_LEFT:
                    targetPos.y += 4;
                    break;
            }
        }
        targetPos.createConstructionSite(STRUCTURE_CONTAINER);
    };
    MainRoom.prototype.placeStorage = function () {
        var _this = this;
        var targetPos = null;
        var storageFlag = _.filter(Game.flags, function (x) { return x.pos.roomName == _this.name && x.memory.storage == true; })[0];
        if (storageFlag)
            targetPos = storageFlag.pos;
        else {
            var closestSource = this.mainPosition.findClosestByPath(FIND_SOURCES);
            if (!closestSource)
                targetPos = new RoomPosition(this.mainPosition.x + 2, this.mainPosition.y + 2, this.name);
            else {
                targetPos = new RoomPosition(this.mainPosition.x, this.mainPosition.y, this.name);
                var direction = this.mainPosition.getDirectionTo(this.room.controller);
                switch (direction) {
                    case TOP:
                        targetPos.y -= 2;
                        break;
                    case TOP_RIGHT:
                        targetPos.y -= 2;
                        targetPos.x += 2;
                        break;
                    case RIGHT:
                        targetPos.x += 2;
                        break;
                    case BOTTOM_RIGHT:
                        targetPos.y += 2;
                        targetPos.x += 2;
                        break;
                    case BOTTOM:
                        targetPos.y += 2;
                        break;
                    case BOTTOM_LEFT:
                        targetPos.y += 2;
                        targetPos.x -= 2;
                        break;
                    case LEFT:
                        targetPos.x -= 2;
                        break;
                    case TOP_LEFT:
                        targetPos.y += 2;
                        break;
                }
            }
        }
        targetPos.createConstructionSite(STRUCTURE_STORAGE);
    };
    MainRoom.prototype.checkAndPlaceMainContainer = function () {
        var mainContainer = null;
        this.memory.mainContainerId && (mainContainer = Game.getObjectById(this.memory.mainContainerId.id));
        if (mainContainer == null) {
            var candidates = this.mainPosition.findInRange(FIND_STRUCTURES, 4, {
                filter: function (s) { return s.structureType == STRUCTURE_CONTAINER; }
            });
            if (candidates.length > 0) {
                return candidates[0];
            }
            else {
                var constructionCandidates = this.mainPosition.findInRange(FIND_CONSTRUCTION_SITES, 4, {
                    filter: function (s) { return s.structureType == STRUCTURE_CONTAINER; }
                });
                if (constructionCandidates.length == 0) {
                    this.placeMainContainer();
                }
            }
        }
        else
            return mainContainer;
    };
    MainRoom.prototype.checkAndPlaceStorage = function () {
        if (this.room.storage != null) {
            return this.room.storage;
        }
        else if (CONTROLLER_STRUCTURES.storage[this.room.controller.level] > 0) {
            this.placeStorage();
        }
        return this.checkAndPlaceMainContainer();
    };
    MainRoom.prototype.checkCreeps = function () {
        var _this = this;
        if (this.myRoom.requiresDefense && this.room.controller.level < 3)
            return;
        if (this.room.controller.ticksToDowngrade < 2000)
            this.managers.upgradeManager.preTick();
        if (this.managers.spawnFillManager.creeps.length == 0 && this.mainContainer && this.mainContainer.store.energy >= this.maxSpawnEnergy * 2) {
            this.managers.spawnFillManager.preTick();
        }
        else if (this.managers.energyHarvestingManager.harvesterCreeps.length == 0 && this.managers.energyHarvestingManager.sourceCarrierCreeps.length == 0)
            this.managers.energyHarvestingManager.preTick(this.myRoom);
        else {
            this.managers.spawnFillManager.preTick();
            this.managers.linkFillerManager.preTick();
            this.managers.terminalManager.preTick();
            this.managers.towerManager.preTick();
            this.managers.labManager.preTick();
            this.managers.defenseManager.preTick();
            if (this.mainContainer && (this.mainContainer.store.energy > 10000 || this.mainContainer.structureType != STRUCTURE_STORAGE && _.sum(this.mainContainer.store) == this.mainContainer.storeCapacity) && this.managers.upgradeManager.creeps.length == 0)
                this.managers.upgradeManager.preTick();
            if (!this.myRoom.requiresDefense)
                _.forEach(_.sortByOrder(_.filter(this.allRooms, function (r) { return !r.requiresDefense; }), [function (r) { return _.any(r.mySources, function (s) { return s.hasKeeper ? 1 : 0; }); }, function (r) { return r.memory.mrd[_this.name].d; }, function (r) { return _.size(r.mySources); }], ['asc', 'asc', 'desc']), function (myRoom) {
                    _this.managers.reservationManager.preTick(myRoom);
                    if (_this.mainContainer && _this.mainContainer.store.energy > 50000)
                        try {
                            _this.managers.repairManager.preTick(myRoom);
                        }
                        catch (e) {
                            console.log(e.stack);
                        }
                    _this.managers.sourceKeeperManager.preTick(myRoom);
                    _this.managers.energyHarvestingManager.preTick(myRoom);
                    _this.managers.mineralHarvestingManager.preTick(myRoom);
                    if (_this.mainContainer && _this.mainContainer.store.energy <= 50000)
                        try {
                            _this.managers.repairManager.preTick(myRoom);
                        }
                        catch (e) {
                            console.log(e.stack);
                        }
                });
        }
        this.managers.constructionManager.preTick();
        if (this.managers.upgradeManager.creeps.length > 0)
            this.managers.upgradeManager.preTick();
        this.managers.carrierManager.preTick();
        this.managers.nukeManager.preTick();
    };
    MainRoom.prototype.tickCreeps = function () {
        this.managers.energyHarvestingManager.tick();
        this.managers.repairManager.tick();
        this.managers.constructionManager.tick();
        this.managers.sourceKeeperManager.tick();
        this.managers.reservationManager.tick();
        this.managers.spawnFillManager.tick();
        this.managers.linkFillerManager.tick();
        this.managers.upgradeManager.tick();
        this.managers.defenseManager.tick();
        this.managers.towerManager.tick();
        this.managers.terminalManager.tick();
        this.managers.mineralHarvestingManager.tick();
        try {
            this.managers.labManager.tick();
        }
        catch (e) {
            console.log(e.stack);
        }
        this.managers.carrierManager.tick();
        this.managers.nukeManager.tick();
    };
    MainRoom.prototype.tick = function () {
        var _this = this;
        var startCpu = Game.cpu.getUsed();
        console.log();
        console.log('MainRoom ' + this.name + ': ' + this.creeps.length + ' creeps');
        //_.forEach(this.allRooms, r => console.log('&nbsp;Room: ' + r.name + ': RepairTargets: ' + _.size(r.repairStructures)));
        if (this.room == null) {
            return;
        }
        try {
            this.links.forEach(function (x) { return x.tick(); });
        }
        catch (e) {
            console.log(e.stack);
        }
        if (this.mainContainer)
            this.roadConstructionManager.tick();
        if (this.creeps.length > 0)
            this.checkCreeps();
        else
            this.managers.energyHarvestingManager.preTick(this.myRoom);
        this.spawnManager.spawn();
        //this.room.find<Tower>(FIND_MY_STRUCTURES, { filter: (x: Structure) => x.structureType == STRUCTURE_TOWER }).forEach(x => new MyTower(x, this).tick());
        if (_.size(this.myRoom.hostileScan.creeps) > 0)
            _.forEach(this.towers, function (t) { return new MyTower(t, _this).tick(); });
        else if (this.towers.length > 0)
            new MyTower(this.towers[0], this).tick();
        this.tickCreeps();
        this.myObserver.tick();
        console.log('MainRoom ' + this.name + ' finished: ' + (Game.cpu.getUsed() - startCpu).toFixed(2) + ' cpu used, ' + Game.cpu.getUsed().toFixed() + ' cpu used total');
    };
    return MainRoom;
}());
var METRICSOURCEDISTANCE = 1;
var METRICSOURCE = 0.5;
var METRICROOM = 0;
var MAXMETRIC = 9;
var MAXDISTANCE = 2;
var RoomAssignment = (function () {
    function RoomAssignment(mainRoom) {
        this.mainRoom = mainRoom;
        this.assignedRooms = [];
    }
    Object.defineProperty(RoomAssignment.prototype, "metric", {
        get: function () {
            var _this = this;
            var value = _.sum(this.assignedRooms, function (x) { return _this.calculateMetricFor(x); }); // + this.calculateMetricFor(this.mainRoom.myRoom);
            //console.log('Current metric for ' + this.mainRoom.name + ': ' + value.toString());
            return value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RoomAssignment.prototype, "maxMetric", {
        get: function () {
            //if (this.mainRoom.room.controller.level < 4)
            //    return 8;
            ////console.log('MaxMetric for ' + this.mainRoom.name + ': ' + this.mainRoom.spawns.length * MAXMETRIC);
            //else
            return this.mainRoom.spawns.length * MAXMETRIC;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RoomAssignment.prototype, "freeMetric", {
        get: function () {
            return this.maxMetric - this.metric;
        },
        enumerable: true,
        configurable: true
    });
    RoomAssignment.prototype.canAssignRoom = function (myRoom) {
        return (!_.any(this.assignedRooms, function (x) { return x.name == myRoom.name; })) && (this.metric + this.calculateMetricFor(myRoom)) <= this.maxMetric;
    };
    RoomAssignment.prototype.tryAddRoom = function (myRoom) {
        if (this.canAssignRoom(myRoom)) {
            this.assignedRooms.push(myRoom);
            return true;
        }
        else
            return false;
    };
    RoomAssignment.prototype.calculateMetricFor = function (myRoom) {
        var value = METRICROOM + (_.size(myRoom.mySources) * ((myRoom.memory.mrd[this.mainRoom.name].d * METRICSOURCEDISTANCE) + METRICSOURCE));
        //if (myRoom.name == this.mainRoom.name) {
        //console.log('Metric for ' + this.mainRoom.name + '=>' + myRoom.name + ': ' + value);
        //console.log('MetricRoom: ' + METRICROOM);
        //console.log('Usable Sources: ' + _.size(myRoom.useableSources));
        //console.log(_.map(myRoom.useableSources, x => x.id).join(', '));
        //console.log('distance: ' + myRoom.memory.mainRoomDistanceDescriptions[this.mainRoom.name].distance);
        //console.log('Metric source distance: ' + METRICSOURCEDISTANCE);
        //console.log('Metric source: ' + METRICSOURCE);
        //}
        return value;
    };
    return RoomAssignment;
}());
var RoomAssignmentHandler = (function () {
    function RoomAssignmentHandler() {
        var _this = this;
        this.forbidden = Colony.memory.forbiddenRooms || [];
        this.assignments = {};
        this.roomsToAssign = {};
        this.rooms = Colony.getAllRooms();
        this.mainRooms = Colony.mainRooms;
        _.forEach(this.mainRooms, function (x) { return _this.assignments[x.name] = new RoomAssignment(x); });
        _.forEach(_.filter(this.rooms, this.roomFilter.bind(this)), function (x) { return _this.roomsToAssign[x.name] = x; });
    }
    RoomAssignmentHandler.prototype.roomFilter = function (myRoom) {
        return _.every(this.forbidden, function (x) { return x != myRoom.name; }) && (!_.any(myRoom.mySources, function (s) { return s.hasKeeper; }) || Colony.memory.harvestKeeperRooms) && !Game.map.isRoomProtected(myRoom.name) && _.size(myRoom.mySources) > 0 && !myRoom.memory.fO && !myRoom.memory.fR && _.min(myRoom.memory.mrd, function (x) { return x.d; }).d <= MAXDISTANCE;
    };
    RoomAssignmentHandler.prototype.assignRoomsByMinDistance = function () {
        var _this = this;
        var avaiableResources = RESOURCES_ALL; //_.map(Colony.mainRooms, mainRoom => mainRoom.myRoom.myMineral.resource);
        var sortedRooms = _.sortByOrder(_.values(this.roomsToAssign), [
            function (x) { return _.min(x.memory.mrd, function (y) { return y.d; }).d == 0 ? 0 : 1; },
            function (x) { return _.min(x.memory.mrd, function (y) { return y.d; }).d; },
            function (x) { return x.useableSources.length; },
            function (x) { return (x.myMineral && x.myMineral.hasExtractor && avaiableResources.indexOf(x.myMineral.resourceType) < 0) ? 0 : 1; },
            function (x) { return _.size(x.mySources); }
        ], ['asc', 'asc', 'desc', 'asc', 'desc']);
        console.log('Assigning MyRooms: ' + _.map(sortedRooms, function (x) { return x.name; }).join(', '));
        _.forEach(sortedRooms, function (myRoom) {
            var possibleMainRooms = _.filter(myRoom.memory.mrd, function (x) { return x.d <= MAXDISTANCE && (myRoom.useableSources.length > 0 || Colony.mainRooms[x.n].room.controller.level >= 6) && _this.assignments[x.n].canAssignRoom(myRoom); });
            console.log('Room: [' + myRoom.name + '] Distances to MainRooms [' + _.map(possibleMainRooms, function (x) { return x.n + ' ' + x.d; }).join(', ') + ']');
            console.log('Room: [' + myRoom.name + '] Possible MainRooms [' + _.map(possibleMainRooms, function (x) { return x.n; }).join(', ') + ']');
            var sorted = _.sortBy(possibleMainRooms, function (x) { return x.d; });
            if ((sorted.length == 1 || sorted.length >= 1 && sorted[0].d < sorted[1].d) && myRoom.memory.mrd[sorted[0].n].d == _.min(myRoom.memory.mrd, function (x) { return x.d; }).d) {
                console.log('Assigning: ' + sorted[0].n);
                console.log('Trying to add room [' + myRoom.name + '] to mainRoom [' + sorted[0].n + ']');
                if (_this.assignments[sorted[0].n].tryAddRoom(myRoom))
                    delete _this.roomsToAssign[myRoom.name];
            }
        });
    };
    RoomAssignmentHandler.prototype.getMainRoomCandidates = function () {
        var _this = this;
        var mainRoomCandidates = {};
        _.forEach(this.roomsToAssign, function (myRoom) {
            _.forEach(myRoom.memory.mrd, function (distanceDescription) {
                if (distanceDescription.d <= MAXDISTANCE && (Colony.mainRooms[distanceDescription.n].room.controller.level >= 6 || myRoom.useableSources.length > 0) && _this.assignments[distanceDescription.n].canAssignRoom(myRoom)) {
                    if (mainRoomCandidates[distanceDescription.n] == null)
                        mainRoomCandidates[distanceDescription.n] = {
                            mainRoom: _this.mainRooms[distanceDescription.n],
                            myRooms: {}
                        };
                    mainRoomCandidates[distanceDescription.n].myRooms[myRoom.name] = myRoom;
                }
            });
        });
        return mainRoomCandidates;
    };
    RoomAssignmentHandler.prototype.assignCollisions = function () {
        var _this = this;
        var avaiableResources = RESOURCES_ALL; //_.map(Colony.mainRooms, mainRoom => mainRoom.myRoom.myMineral.resource);
        var mainRoomCandidates = this.getMainRoomCandidates();
        myMemory['MainRoomCandidates'] = _.map(mainRoomCandidates, function (x) {
            return { mainRoom: x.mainRoom.name, myRooms: _.map(x.myRooms, function (y) { return y.name; }) };
        });
        var _loop_5 = function() {
            var candidate = _.sortByAll(_.filter(mainRoomCandidates, function (x) { return x; }), [function (x) { return _.size(x.mainRoom.connectedRooms); }, function (x) { return _.size(x.myRooms); }, function (x) { return _this.assignments[x.mainRoom.name].freeMetric; }])[0];
            var rooms = _.sortByAll(_.values(candidate.myRooms), [function (x) { return (candidate.mainRoom.room.controller.level >= 6 && x.myMineral && x.myMineral.hasKeeper && avaiableResources.indexOf(x.myMineral.resourceType) < 0) ? 0 : 1; }, function (x) { return 10 - (candidate.mainRoom.room.controller.level >= 6 ? _.size(x.mySources) : _.size(x.useableSources)); }, function (x) { return x.name; }]);
            console.log('Candidate: ' + candidate.mainRoom.name + ' Rooms: ' + _.map(rooms, function (x) { return x.name; }).join(', '));
            this_4.assignments[candidate.mainRoom.name].tryAddRoom(rooms[0]);
            delete this_4.roomsToAssign[rooms[0].name];
            mainRoomCandidates = this_4.getMainRoomCandidates();
        };
        var this_4 = this;
        while (_.size(mainRoomCandidates) > 0) {
            _loop_5();
        }
    };
    RoomAssignmentHandler.prototype.getAssignments = function () {
        this.assignRoomsByMinDistance();
        this.assignCollisions();
        return _.indexBy(_.map(this.assignments, function (x) {
            return {
                mainRoom: x.mainRoom,
                metric: x.metric,
                myRooms: x.assignedRooms
            };
        }), function (x) { return x.mainRoom.name; });
    };
    RoomAssignmentHandler.prototype.applySolution = function () {
        if (Colony.memory.roomAssignment == null) {
            console.log('No RoomAssignments found. Execute "createRoomAssignments()" to create');
            return;
        }
        _.forEach(this.rooms, function (x) { return x.mainRoom = null; });
        _.forEach(Colony.memory.roomAssignment, function (assignment) { return _.forEach(_.map(assignment.rooms, function (r) { return Colony.getRoom(r); }), function (myRoom) { return myRoom.mainRoom = Colony.mainRooms[assignment.mainRoomName]; }); });
        console.log('RoomAssignment successfull');
    };
    RoomAssignmentHandler.prototype.createSolution = function () {
        try {
            var assignments = this.getAssignments();
            var result = _.indexBy(_.map(assignments, function (a) {
                return {
                    rooms: _.map(a.myRooms, function (y) { return y.name; }),
                    mainRoomName: a.mainRoom.name,
                    metric: a.metric
                };
            }), function (x) { return x.mainRoomName; });
            Colony.memory.roomAssignment = result;
            console.log('Created RoomAssignmentSolution');
        }
        catch (e) {
            console.log('ERRROR: ROOMASSIGNMENT ' + e.stack);
            myMemory['RoomAssignmentError'] = JSON.parse(JSON.stringify(e));
        }
    };
    return RoomAssignmentHandler;
}());
/// <reference path="../components/creeps/body.ts" />
/// <reference path="../components/creeps/spawnConstructor/spawnConstructor.ts" />
/// <reference path="../components/rooms/mainRoom.ts" />
/// <reference path="./roomAssignment.ts" />
var ClaimingManager = (function () {
    function ClaimingManager(targetPosition) {
        this.targetPosition = targetPosition;
        this.roomName = targetPosition.roomName;
    }
    Object.defineProperty(ClaimingManager.prototype, "memory", {
        get: function () {
            return this.accessMemory();
        },
        enumerable: true,
        configurable: true
    });
    ClaimingManager.prototype.accessMemory = function () {
        if (Colony.memory.claimingManagers == null)
            Colony.memory.claimingManagers = {};
        if (Colony.memory.claimingManagers[this.roomName] == null)
            Colony.memory.claimingManagers[this.roomName] = {
                targetPosition: this.targetPosition,
                verbose: false
            };
        return Colony.memory.claimingManagers[this.roomName];
    };
    ClaimingManager.prototype.tickSpawnConstructors = function (creep) {
        new SpawnConstructor(creep.name).tick();
    };
    ClaimingManager.prototype.tickClaimer = function (creep) {
        if (creep.room.name != creep.memory.targetPosition.roomName) {
            console.log(creep.moveTo(new RoomPosition(creep.memory.targetPosition.x, creep.memory.targetPosition.y, creep.memory.targetPosition.roomName)));
        }
        else {
            var controller = Game.rooms[creep.memory.targetPosition.roomName].controller;
            if (creep.claimController(controller) == ERR_NOT_IN_RANGE)
                creep.moveTo(controller);
        }
    };
    ClaimingManager.prototype.checkScouts = function (myRoom) {
        var _this = this;
        if (myRoom == null || myRoom.memory.lst < Game.time - 500) {
            if (this.scouts.length == 0) {
                var mainRoom = null;
                if (myRoom == null)
                    mainRoom = _.sortBy(_.values(Colony.mainRooms), function (x) { return Game.map.getRoomLinearDistance(x.name, _this.targetPosition.roomName); })[0];
                else
                    mainRoom = myRoom.closestMainRoom;
                if (mainRoom)
                    mainRoom.spawnManager.addToQueue(['move'], { handledByColony: true, claimingManager: this.roomName, role: 'scout', targetPosition: this.targetPosition });
            }
            return false;
        }
        else
            return true;
    };
    ClaimingManager.prototype.checkClaimer = function (myRoom) {
        if (this.claimers.length == 0) {
            var body = new Body();
            body.claim = 1;
            body.move = 1;
            Colony.spawnCreep(myRoom, body, { handledByColony: true, claimingManager: this.roomName, role: 'claimer', targetPosition: this.targetPosition });
            return false;
        }
        return true;
    };
    ClaimingManager.prototype.checkSpawnConstructors = function (myRoom) {
        if (myRoom == null)
            return false;
        var mainRoom = myRoom.closestMainRoom;
        if (mainRoom == null)
            return false;
        var needCreeps = false;
        var sources = _.filter(myRoom.mySources, function (x) { return x.hasKeeper == false; });
        var _loop_6 = function(idx) {
            var mySource = sources[idx];
            var creepCount = _.filter(this_5.spawnConstructors, function (x) { return x.memory.sourceId == mySource.id; }).length;
            if (creepCount < 2) {
                mainRoom.spawnManager.addToQueue(['work', 'work', 'work', 'work', 'work', 'carry', 'carry', 'carry', 'carry', 'carry', 'carry', 'carry', 'carry', 'carry', 'carry', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move'], { handledByColony: true, claimingManager: this_5.roomName, role: 'spawnConstructor', targetPosition: this_5.targetPosition, sourceId: mySource.id }, 2 - creepCount);
                needCreeps = true;
            }
        };
        var this_5 = this;
        for (var idx in sources) {
            _loop_6(idx);
        }
        return !needCreeps;
    };
    ClaimingManager.prototype.finishClaimingManager = function () {
        var mainRoom = new MainRoom(this.roomName);
        Colony.mainRooms[this.roomName] = mainRoom;
        var myRoom = Colony.getRoom(this.roomName);
        myRoom.mainRoom = mainRoom;
        myRoom.memory.mrn = this.roomName;
        myRoom.memory.mrd[this.roomName] = { n: this.roomName, d: 0 };
        for (var idx in this.scouts)
            this.scouts[idx].suicide();
        for (var idx in this.claimers)
            this.claimers[idx].suicide();
        var sourceArray = _.values(myRoom.mySources);
        for (var idx = 0; idx < this.spawnConstructors.length; idx++) {
            var creep = this.spawnConstructors[idx];
            creep.memory.role = 'harvester';
            creep.memory.sId = creep.memory.sourceId;
            creep.memory.doConstructions = true;
            creep.memory.handledByColony = false;
            creep.memory.mainRoomName = this.roomName;
            creep.memory.state = 0 /* Harvesting */;
            creep.memory.sourceId = sourceArray[idx % sourceArray.length].id;
        }
        delete Colony.memory.claimingManagers[this.roomName];
        delete Colony.claimingManagers[this.roomName];
        //new RoomAssignmentHandler().assignRooms();
    };
    ClaimingManager.prototype.tick = function () {
        var _this = this;
        var room = Game.rooms[this.roomName];
        if (Colony.getRoom(this.roomName))
            Colony.getRoom(this.roomName).mainRoom = null;
        this.creeps = _.filter(Game.creeps, function (x) { return x.memory.handledByColony == true && x.memory.claimingManager == _this.roomName; });
        this.scouts = _.filter(this.creeps, function (x) { return x.memory.targetPosition.roomName == _this.targetPosition.roomName && x.memory.role == 'scout'; });
        this.spawnConstructors = _.filter(this.creeps, function (x) { return x.memory.role == 'spawnConstructor'; });
        this.claimers = _.filter(this.creeps, function (x) { return x.memory.role == 'claimer'; });
        if (room && _.size(room.find(FIND_MY_SPAWNS)) > 0) {
            this.finishClaimingManager();
            return;
        }
        var owning = false;
        if (room != null) {
            if (room.controller.owner != null && room.controller.owner.username == Colony.myName) {
                owning = true;
                //this.spawnConstructionSite = room.find<ConstructionSite>(FIND_MY_CONSTRUCTION_SITES, { filter: (x: ConstructionSite) => x.structureType == STRUCTURE_SPAWN })[0];
                var pos = this.memory.targetPosition;
                if (_.filter(Game.constructionSites, function (x) { return x.structureType == STRUCTURE_SPAWN && x.room.name == room.name; }).length == 0)
                    new RoomPosition(pos.x, pos.y, pos.roomName).createConstructionSite(STRUCTURE_SPAWN);
            }
        }
        var myRoom = Colony.getRoom(this.roomName);
        if (owning == false && this.checkScouts(myRoom) && this.checkSpawnConstructors(myRoom) && this.checkClaimer(myRoom)) {
            this.claimers.forEach(function (x) { return _this.tickClaimer(x); });
            this.spawnConstructors.forEach(function (x) { return _this.tickSpawnConstructors(x); });
        }
        else if (owning == true) {
            this.checkSpawnConstructors(myRoom);
            this.spawnConstructors.forEach(function (x) { return _this.tickSpawnConstructors(x); });
        }
        return;
    };
    return ClaimingManager;
}());
var SetupProcessResult;
(function (SetupProcessResult) {
    SetupProcessResult[SetupProcessResult["Failed"] = 1] = "Failed";
    SetupProcessResult[SetupProcessResult["FromStorage"] = 2] = "FromStorage";
    SetupProcessResult[SetupProcessResult["Reaction"] = 4] = "Reaction";
})(SetupProcessResult || (SetupProcessResult = {}));
var ReactionManager = (function () {
    function ReactionManager() {
        this.forbiddenCompounds = [RESOURCE_CATALYZED_KEANIUM_ACID, RESOURCE_CATALYZED_LEMERGIUM_ACID, RESOURCE_CATALYZED_UTRIUM_ALKALIDE, RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE];
        this._ingredients = null;
        this.requiredResources = {};
        //public canProduce(resource: string) {
        //    if (this.ingredients[resource] == null)
        //        return _.any(Colony.mainRooms, mainRoom => mainRoom.mineral.mineralType == resource && mainRoom.room.controller.level>=6) || this.getAvailableResourceAmount(resource) > 2000;
        //    else {
        //        return this.canProduce(this.ingredients[resource][0]) && this.canProduce(this.ingredients[resource][1]);
        //    }
        //}
        this._availableResources = {};
        this.labManagers = {};
        this.totalStorage = Colony.profiler.registerFN(this.totalStorage, 'ReactionManager.totalStorage');
        this.canProvide = Colony.profiler.registerFN(this.canProvide, 'ReactionManager.canProvide');
        this.getAvailableResourceAmount = Colony.profiler.registerFN(this.getAvailableResourceAmount, 'ReactionManager.getAvailableResourceAmount');
        this.setupProcess = Colony.profiler.registerFN(this.setupProcess, 'ReactionManager.setupProcess');
        this.setupProcessChain = Colony.profiler.registerFN(this.setupProcessChain, 'ReactionManager.setupProcessChain');
        this.setup = Colony.profiler.registerFN(this.setup, 'ReactionManager.setup');
        this.tick = Colony.profiler.registerFN(this.tick, 'ReactionManager.tick');
    }
    Object.defineProperty(ReactionManager.prototype, "memory", {
        get: function () {
            return this.accessMemory();
        },
        enumerable: true,
        configurable: true
    });
    ReactionManager.prototype.accessMemory = function () {
        if (Colony.memory.reactionManager == null)
            Colony.memory.reactionManager = {
                setupTime: null,
                highestPowerCompounds: null,
                publishableCompounds: null
            };
        return Colony.memory.reactionManager;
    };
    Object.defineProperty(ReactionManager.prototype, "labRooms", {
        get: function () {
            return _.filter(Colony.mainRooms, function (mainRoom) { return _.size(mainRoom.managers.labManager.myLabs) >= 1; });
        },
        enumerable: true,
        configurable: true
    });
    ReactionManager.prototype.totalStorage = function (resource) {
        //let mainContainers = _.map(_.filter(Colony.mainRooms, mainRoom => mainRoom.mainContainer), mainRoom => mainRoom.mainContainer);
        var terminals = _.map(_.filter(Colony.mainRooms, function (mainRoom) { return mainRoom.terminal && mainRoom.terminal.store[resource]; }), function (mainRoom) { return mainRoom.terminal; });
        //return _.sum(mainContainers, x => x.store[resource]) + _.sum(terminals, x => x.store[resource]);
        return _.sum(terminals, function (x) { return x.store[resource]; });
    };
    Object.defineProperty(ReactionManager.prototype, "requiredAmount", {
        get: function () {
            //return this.labRooms.length * 5500 + 5000;
            return 7500;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ReactionManager.prototype, "publishableCompounds", {
        get: function () {
            var _this = this;
            if (this.memory.publishableCompounds == null || this.highestPowerCompounds == null || this.memory.publishableCompounds.time + 500 < this.memory.highestPowerCompounds.time) {
                var compounds = _.uniq(this.highestPowerCompounds.concat(_.filter(RESOURCES_ALL, function (r) { return _this.ingredients[r] && _this.ingredients[r].indexOf(RESOURCE_CATALYST) >= 0; })));
                this.memory.publishableCompounds = { time: this.memory.highestPowerCompounds.time, compounds: compounds };
            }
            return this.memory.publishableCompounds.compounds;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ReactionManager.prototype, "highestPowerCompounds", {
        get: function () {
            var _this = this;
            if (this.memory.highestPowerCompounds == null || this.memory.highestPowerCompounds.time + 500 < Game.time) {
                this.memory.highestPowerCompounds = { time: Game.time, compounds: [] };
                _.forEach(ReactionManager.powerPriority, function (power) {
                    var resources = _.sortBy(_.filter(ReactionManager.BOOSTPOWERS[power].resources, function (r) { return _this.forbiddenCompounds.indexOf(r.resource) < 0; }), function (r) { return r.factor > 1 ? 100 - r.factor : r.factor; });
                    for (var resource in resources) {
                        if (_this.canProvide(resources[resource].resource)) {
                            _this.memory.highestPowerCompounds.compounds.push(resources[resource].resource);
                            break;
                        }
                    }
                });
            }
            return this.memory.highestPowerCompounds.compounds;
        },
        enumerable: true,
        configurable: true
    });
    ReactionManager.prototype.canProvide = function (resource, amount) {
        if (amount === void 0) { amount = null; }
        var requiredAmount = this.requiredAmount;
        if (amount != null)
            requiredAmount = amount;
        if (this.ingredients[resource] == null)
            return _.any(Colony.mainRooms, function (mainRoom) { return _.any(mainRoom.minerals, function (m) { return m.resourceType == resource; }) && mainRoom.room.controller.level >= 6; }) || this.getAvailableResourceAmount(resource) > requiredAmount;
        else if (this.totalStorage(resource) >= requiredAmount)
            return true;
        else
            return this.canProvide(this.ingredients[resource][0], amount - this.totalStorage(this.ingredients[resource][0])) && this.canProvide(this.ingredients[resource][1], amount - this.totalStorage(this.ingredients[resource][1]));
    };
    Object.defineProperty(ReactionManager, "BOOSTPOWERS", {
        //private static _BOOSTPOWERS: { [power: string]: { bodyPart: string, resources: Array<{ resource: string, factor: number }> } };
        get: function () {
            if (!Colony.memory.boostPowers) {
                Colony.memory.boostPowers = {};
                for (var bodyPart in BOOSTS) {
                    for (var resource in BOOSTS[bodyPart]) {
                        for (var power in BOOSTS[bodyPart][resource]) {
                            if (Colony.memory.boostPowers[power] == null)
                                Colony.memory.boostPowers[power] = { bodyPart: bodyPart, resources: [] };
                            Colony.memory.boostPowers[power].resources.push({ resource: resource, factor: BOOSTS[bodyPart][resource][power] });
                        }
                    }
                }
            }
            return Colony.memory.boostPowers;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ReactionManager.prototype, "ingredients", {
        get: function () {
            if (this._ingredients == null) {
                this._ingredients = {};
                for (var ing1 in REACTIONS) {
                    for (var ing2 in REACTIONS[ing1]) {
                        this._ingredients[REACTIONS[ing1][ing2]] = [ing1, ing2];
                    }
                }
            }
            return this._ingredients;
        },
        enumerable: true,
        configurable: true
    });
    ReactionManager.prototype.getAvailableResourceAmount = function (resource) {
        if (this._availableResources[resource] == null || this._availableResources[resource].time + 100 < Game.time)
            this._availableResources[resource] = {
                time: Game.time,
                amount: _.sum(this.labManagers, function (lm) { return lm.mainRoom.terminal ? lm.mainRoom.terminal.store[resource] : 0; })
            };
        return this._availableResources[resource].amount;
    };
    ReactionManager.prototype.registerLabManager = function (labManager) {
        this.labManagers[labManager.mainRoom.name] = labManager;
    };
    ReactionManager.prototype.setupPublishs = function () {
        //_.forEach(this.labManagers, lm => lm.setupPublishs());
    };
    Object.defineProperty(ReactionManager.prototype, "importCounts", {
        get: function () {
            return _.indexBy(_.map(_.groupBy(_.flatten(_.map(this.labManagers, function (lm) { return lm.imports; }))), function (x) { return { resource: x[0], count: x.length }; }), function (x) { return x.resource; });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ReactionManager.prototype, "publishCounts", {
        get: function () {
            return _.indexBy(_.map(_.groupBy(_.flatten(_.map(this.labManagers, function (lm) { return lm.publishs; }))), function (x) { return { resource: x[0], count: x.length }; }), function (x) { return x.resource; });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ReactionManager.prototype, "imports", {
        get: function () {
            return _.uniq(_.flatten(_.map(this.labManagers, function (l) { return l.imports; })));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ReactionManager.prototype, "reactions", {
        get: function () {
            return _.uniq(_.flatten(_.map(this.labManagers, function (l) { return l.reactions; })));
        },
        enumerable: true,
        configurable: true
    });
    ReactionManager.prototype.setupProcess = function (resource) {
        var _this = this;
        if (this.totalStorage(resource) >= this.requiredAmount)
            return SetupProcessResult.FromStorage;
        else if (this.ingredients[resource] == null)
            return SetupProcessResult.Failed;
        var bestManager = _.sortByAll(_.filter(_.map(this.labManagers, function (x) {
            return { manager: x, requiredLabs: x.requiredLabsForReaction(resource) };
        }), function (x) { return x.requiredLabs != null; }), [function (x) { return x.requiredLabs; }, function (x) { return CONTROLLER_STRUCTURES.lab[8] - x.manager.freeLabs.length; }])[0];
        if (bestManager) {
            bestManager.manager.addReaction(resource);
            var result = _.map(this.ingredients[resource], function (r) { return _this.setupProcess(r); });
            if (_.any(result, function (r) { return r == SetupProcessResult.Failed; }))
                return SetupProcessResult.Failed;
            else
                return SetupProcessResult.Reaction;
        }
        return SetupProcessResult.Failed;
    };
    ReactionManager.prototype.setupProcessChain = function (resource) {
        var _this = this;
        console.log('Reaction Manager: Setup process chain ' + resource);
        this.backup();
        var result = this.setupProcess(resource);
        if (result & SetupProcessResult.Failed) {
            this.restore();
            var cascadeResult = _.map(this.ingredients[resource], function (r) { return _this.setupProcessChain(r); });
            return (cascadeResult[0] | cascadeResult[1]);
        }
        return result;
    };
    ReactionManager.prototype.backup = function () {
        _.forEach(this.labManagers, function (lm) { return lm.backup(); });
    };
    ReactionManager.prototype.restore = function () {
        _.forEach(this.labManagers, function (lm) { return lm.restore(); });
    };
    ReactionManager.prototype.setup = function () {
        var _this = this;
        if (this.memory.setupTime == null || this.memory.setupTime + 1000 < Game.time) {
            _.forEach(this.labManagers, function (x) { return x.reset(); });
            this.memory.setupTime = Game.time;
            this.requiredResources = {};
            var compoundsToProduce_1 = [];
            if (this.canProvide(RESOURCE_GHODIUM))
                compoundsToProduce_1.push(RESOURCE_GHODIUM);
            _.forEach(this.highestPowerCompounds, function (c) { return compoundsToProduce_1.push(c); });
            while (compoundsToProduce_1.length > 0) {
                console.log();
                console.log('Reaction Manager: Compounds to produce: ' + compoundsToProduce_1.join(','));
                var loopCompounds = _.clone(compoundsToProduce_1);
                compoundsToProduce_1 = [];
                _.forEach(loopCompounds, function (c) {
                    var result = _this.setupProcessChain(c);
                    if (!(result & SetupProcessResult.Failed))
                        console.log('Reaction Manager: Succcessfully setup ' + c);
                    console.log('Reaction Manager ' + c + ' result: ' + result);
                    if (result & SetupProcessResult.Reaction) {
                        compoundsToProduce_1.push(c);
                    }
                });
            }
        }
    };
    ReactionManager.prototype.tick = function () {
        this.setup();
        //this.sendResourcesUsingTerminals();
    };
    ReactionManager.prototype.sendResourcesUsingTerminals = function () {
        if ((Game.time + 25) % 100 == 0) {
            console.log('reactionManager.sendResourcesUsingTerminals');
            _.forEach(_.filter(this.labManagers, function (x) { return x.imports.length > 0 && x.mainRoom && x.mainRoom.terminal; }), function (labManager) {
                console.log('reactionManager.sendResourcesUsingTerminals  LabManager: ' + labManager.mainRoom.name);
                console.log('reactionManager.sendResourcesUsingTerminals  LabManager: ' + labManager.mainRoom.name + ', imports: ' + labManager.imports.join(','));
                _.forEach(_.filter(labManager.imports, function (x) { return !labManager.mainRoom.terminal.store[x] || labManager.mainRoom.terminal.store[x] < 2000; }), function (resource) {
                    console.log('reactionManager.sendResourcesUsingTerminals  Resource: ' + resource);
                    var otherRoom = _.sortBy(_.filter(Colony.mainRooms, function (mainRoom) { return mainRoom.terminal && (mainRoom.terminal.store[resource] >= 4000 || (!mainRoom.managers.labManager || !(resource in mainRoom.managers.labManager.imports)) && mainRoom.terminal.store[resource] >= 2000); }), function (x) { return labManager.mainRoom.myRoom.memory.mrd[x.name]; })[0];
                    if (otherRoom) {
                        console.log('reactionManager.sendResourcesUsingTerminals  otherRoom: ' + otherRoom.name);
                        otherRoom.terminal.send(resource, 2000, labManager.mainRoom.name);
                    }
                });
            });
        }
    };
    ReactionManager.basicCompounds = [RESOURCE_HYDROXIDE, RESOURCE_ZYNTHIUM_KEANITE, RESOURCE_UTRIUM_LEMERGITE, RESOURCE_GHODIUM];
    ReactionManager.powerPriority = [
        'harvest',
        'heal',
        'rangedAttack',
        'damage',
        'attack',
        'fatigue',
        'upgradeController',
        'dismantle',
        'capacity',
        'build',
    ];
    return ReactionManager;
}());
var MemoryObject = (function () {
    function MemoryObject() {
    }
    return MemoryObject;
}());
var RoomPos = (function () {
    function RoomPos() {
    }
    RoomPos.fromObj = function (obj) {
        if (obj == null)
            return null;
        else
            return new RoomPosition(obj.x, obj.y, obj.roomName);
    };
    RoomPos.equals = function (pos1, pos2) {
        return pos1.x == pos2.x && pos1.y == pos2.y && pos1.roomName == pos2.roomName;
    };
    RoomPos.isOnEdge = function (pos) {
        return pos.x == 0 || pos.x == 49 || pos.y == 0 || pos.y == 49;
    };
    return RoomPos;
}());
var MyCostMatrix = (function () {
    function MyCostMatrix() {
    }
    MyCostMatrix.compress = function (costMatrix) {
        var serializedCostMatrix = costMatrix.serialize();
        var result = { matrix: [] };
        for (var i = 0; i < serializedCostMatrix.length; i++) {
            if (serializedCostMatrix[i] != 0) {
                result.matrix.push({
                    i: i, v: serializedCostMatrix[i]
                });
            }
        }
        return result;
    };
    MyCostMatrix.decompress = function (compressedCostMatrix) {
        var result = [625];
        _.fill(result, 0);
        for (var i = 0; i < compressedCostMatrix.matrix.length; i++) {
            result[compressedCostMatrix.matrix[i].i] = compressedCostMatrix.matrix[i].v;
        }
        return PathFinder.CostMatrix.deserialize(result);
    };
    return MyCostMatrix;
}());
/// <reference path="../../memoryObject.ts" />
/// <reference path="../../helpers.ts" />
var MySource = (function () {
    function MySource(id, myRoom) {
        //this.accessMemory();
        this.id = id;
        this.myRoom = myRoom;
        this.memoryInitialized = false;
        this._room = { time: -1, room: null };
        this.resourceType = RESOURCE_ENERGY;
        var oldMemory = this.memory;
        var memory = this.memory;
        if (oldMemory.linkId)
            delete oldMemory.linkId;
        if (oldMemory.energyCapacity)
            delete oldMemory.energyCapacity;
        //if (oldMemory.capacity) memory.c = oldMemory.capacity;
        //if (oldMemory.harvestingSpots) memory.hs = oldMemory.harvestingSpots;
        //if (oldMemory.pathLengthToMainContainer) memory.pl = oldMemory.pathLengthToMainContainer;
        //if (oldMemory.roadBuiltToRoom) memory.rbtr = oldMemory.roadBuiltToRoom;
        //delete oldMemory.capacity;
        //delete oldMemory.harvestingSpots;
        //delete oldMemory.pathLengthToMainContainer;
        //delete oldMemory.roadBuiltToRoom;
        this.hasKeeper;
        this.maxHarvestingSpots;
        if (myMemory['profilerActive']) {
            this._loadLink = profiler.registerFN(this._loadLink, 'MySource.link');
            this.getHarvestingSpots = profiler.registerFN(this.getHarvestingSpots, 'MySource.getHarvestingSpots');
        }
    }
    Object.defineProperty(MySource.prototype, "memory", {
        get: function () {
            return this.accessMemory();
        },
        enumerable: true,
        configurable: true
    });
    MySource.prototype.accessMemory = function () {
        if (this.myRoom.memory.srcs == null)
            this.myRoom.memory.srcs = {};
        if (this.myRoom.memory.srcs[this.id] == null) {
            this.myRoom.memory.srcs[this.id] = {
                id: this.id,
                pos: this.source.pos
            };
        }
        return this.myRoom.memory.srcs[this.id];
    };
    Object.defineProperty(MySource.prototype, "room", {
        get: function () {
            //let trace = this.tracer.start('Property room');
            if (this._room.time < Game.time)
                this._room = {
                    time: Game.time, room: Game.rooms[this.pos.roomName]
                };
            //trace.stop();
            return this._room.room;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "keeperIsAlive", {
        get: function () {
            if (!this.hasKeeper)
                return false;
            if (this._keeperIsAlive == null || this._keeperIsAlive.time < Game.time) {
                this._keeperIsAlive = { time: Game.time, isAlive: this.keeper && (this.keeper.lair.ticksToSpawn < 20 || this.keeper.creep && this.keeper.creep.hits > 100) };
            }
            return this._keeperIsAlive.isAlive;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "source", {
        get: function () {
            //let trace = this.tracer.start('Property source');
            if (this._source == null || this._source.time < Game.time)
                this._source = { time: Game.time, source: Game.getObjectById(this.id) };
            //trace.stop();
            return this._source.source;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "containerPosition", {
        get: function () {
            if (this.container) {
                this.memory.cPos = this.container.pos;
                return this.memory.cPos;
            }
            else
                return RoomPos.fromObj(this.memory.cPos);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "container", {
        get: function () {
            if (this.link || this.hasKeeper)
                return null;
            if ((this._container == null || this._container.time < Game.time) && this.room) {
                if (this.memory.cId) {
                    var container = Game.getObjectById(this.memory.cId);
                    if (container == null)
                        this.memory.cId = null;
                    this._container = { time: Game.time, container: container };
                }
                if (this.memory.cId == null && !this.link && !this.hasKeeper) {
                    var containerLook = _.filter(this.source.room.lookForAtArea(LOOK_STRUCTURES, this.pos.y - 1, this.pos.x - 1, this.pos.y + 1, this.pos.x + 1, true), function (s) { return s.structure.structureType == STRUCTURE_CONTAINER; })[0];
                    if (containerLook) {
                        this.memory.cId = containerLook.structure.id;
                        this._container = { time: Game.time, container: containerLook.structure };
                    }
                }
            }
            if (this._container && this.room)
                return this._container.container;
            else
                return null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "pos", {
        //private _sourceDropOffContainer: { time: number, sourceDropOffContainer: { id: string, pos: RoomPosition } };
        //public get sourceDropOffContainer(): { id: string, pos: RoomPosition } {
        //    let trace = this.tracer.start('Property sourceDropOffContainer');
        //    if (this._sourceDropOffContainer!=null &&  this._sourceDropOffContainer.time == Game.time)
        //        return this._sourceDropOffContainer.sourceDropOffContainer;
        //    if (this.source && (!this.memory.sourceDropOffContainer || (this.memory.sourceDropOffContainer.time + 200) < Game.time)) {
        //        let structure = this.getSourceDropOffContainer();
        //        this._sourceDropOffContainer = { time: Game.time, sourceDropOffContainer: structure };
        //        this.memory.sourceDropOffContainer = { time: Game.time, value: structure ? { id: structure.id, pos: structure ? structure.pos : null } : null }
        //        trace.stop();
        //        return structure;
        //    }
        //    else {
        //        let structure: { id: string, pos: RoomPosition } = null;
        //        if (this.memory.sourceDropOffContainer.value)
        //            structure = Game.getObjectById<Structure>(this.memory.sourceDropOffContainer.value.id);
        //        if (structure == null && this.memory.sourceDropOffContainer && this.memory.sourceDropOffContainer.value != null)
        //            structure = {
        //                id: this.memory.sourceDropOffContainer.value.id,
        //                pos: RoomPos.fromObj(this.memory.sourceDropOffContainer.value.pos)
        //            };
        //        this._sourceDropOffContainer = { time: Game.time, sourceDropOffContainer: structure };
        //        trace.stop();
        //        return structure ? structure : null;
        //    }
        //}
        //private _dropOffStructre: { time: number, dropOffStructure: Structure } = { time: -1, dropOffStructure: null }
        //public get dropOffStructure(): { id: string, pos: RoomPosition } {
        //    let trace = this.tracer.start('Property dropOffStructure');
        //    if (this._dropOffStructre.time == Game.time) {
        //        trace.stop();
        //        return this._dropOffStructre.dropOffStructure;
        //    }
        //    if (this.source && (!this.memory.dropOffStructure || this.memory.dropOffStructure.time + 200 < Game.time)) {
        //        let structure = this.getDropOffStructure();
        //        this.memory.dropOffStructure = { time: Game.time, value: structure ? { id: structure.id, pos: structure.pos } : null }
        //        trace.stop();
        //        return structure;
        //    }
        //    else {
        //        let structure = Game.getObjectById<Structure>(this.memory.dropOffStructure.value.id);
        //        this._dropOffStructre = { time: Game.time, dropOffStructure: structure };
        //        trace.stop();
        //        return structure ? structure : (this.memory.dropOffStructure ? { id: this.memory.dropOffStructure.value.id, pos: RoomPos.fromObj(this.memory.dropOffStructure.value.pos) } : null);
        //    }
        //}
        //private _nearByConstructionSite: { time: number, constructionSite: ConstructionSite } = { time: -1, constructionSite: null };
        //public get nearByConstructionSite(): ConstructionSite {
        //    let trace = this.tracer.start('Property nearByConstruction');
        //    if (this._nearByConstructionSite.time + 50 < Game.time) {
        //        this._nearByConstructionSite = {
        //            time: Game.time, constructionSite: _.filter(RoomPos.fromObj(this.memory.pos).findInRange<ConstructionSite>(FIND_CONSTRUCTION_SITES, 4))[0]
        //        };
        //    }
        //    trace.stop();
        //    return this._nearByConstructionSite.constructionSite;
        //}
        get: function () {
            //let trace = this.tracer.start('Property pos');
            //trace.stop();
            return this.source != null ? this.source.pos : RoomPos.fromObj(this.memory.pos);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "maxHarvestingSpots", {
        get: function () {
            //let trace = this.tracer.start('Property maxHarvestingSpots');
            if (this.memory.hs != null || this.source == null) {
                //trace.stop();
                return this.memory.hs;
            }
            else {
                var pos = this.source.pos;
                var spots = _.filter(this.source.room.lookForAtArea(LOOK_TERRAIN, pos.y - 1, pos.x - 1, pos.y + 1, pos.x + 1, true), function (x) { return x.terrain == 'swamp' || x.terrain == 'plain'; }).length;
                this.memory.hs = spots;
                //trace.stop();
                return spots;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "site", {
        get: function () {
            if (this._site == null || this._site.time < Game.time)
                this._site = { time: Game.time, site: Game.getObjectById(this.id) };
            return this._site.site;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "usable", {
        get: function () {
            return !this.hasKeeper || this.maxHarvestingSpots > 1 && _.size(this.myRoom.mainRoom.managers.labManager.myLabs) > 1;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "lairPosition", {
        get: function () {
            if (!this.memory.lairPos && this.keeper && this.keeper.lair)
                this.memory.lairPos = this.keeper.lair.pos;
            return RoomPos.fromObj(this.memory.lairPos);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "keeper", {
        get: function () {
            var _this = this;
            if (!this.hasKeeper || !this.room)
                return null;
            if (this.room && (this._keeper == null || this._keeper.time < Game.time)) {
                if (this.memory.lairId)
                    var lair = Game.getObjectById(this.memory.lairId);
                if (!lair) {
                    lair = this.pos.findInRange(FIND_HOSTILE_STRUCTURES, 5, { filter: function (s) { return s.structureType == STRUCTURE_KEEPER_LAIR; } })[0];
                    if (lair) {
                        this.memory.lairId = lair.id;
                        this.memory.lairPos = lair.pos;
                    }
                }
                var creepInfo = _.filter(this.myRoom.hostileScan.keepers, function (k) { return k.pos.inRangeTo(_this.pos, 5); })[0];
                this._keeper = {
                    time: Game.time,
                    keeper: {
                        lair: lair,
                        creep: creepInfo ? creepInfo.creep : null
                    }
                };
            }
            if (this._keeper)
                return this._keeper.keeper;
            else
                return null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "hasKeeper", {
        get: function () {
            if (this.memory.keeper != null || !this.room) {
                return this.memory.keeper;
            }
            else {
                this.memory.keeper = this.source.pos.findInRange(FIND_STRUCTURES, 5, { filter: function (s) { return s.structureType == STRUCTURE_KEEPER_LAIR; } }).length > 0;
                return this.memory.keeper;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "amount", {
        get: function () {
            if (this.source)
                this.memory.a = this.source.energy;
            return this.memory.a;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "rate", {
        get: function () {
            return this.capacity / ENERGY_REGEN_TIME;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "roadBuiltToRoom", {
        get: function () {
            return this.memory.rbtr;
        },
        set: function (value) {
            this.memory.rbtr = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "pathLengthToDropOff", {
        get: function () {
            if ((this._pathLengthToMainContainer == null || this._pathLengthToMainContainer.time + 1500 < Game.time) && this.source)
                if (this.memory.pl && this.memory.pl.time + 1500 < Game.time) {
                    this._pathLengthToMainContainer = this.memory.pl;
                }
                else {
                    this._pathLengthToMainContainer = {
                        time: Game.time,
                        length: PathFinder.search(this.myRoom.mainRoom.spawns[0].pos, { pos: this.source.pos, range: 1 }, { roomCallback: Colony.getCustomMatrix({ ignoreKeeperSourceId: this.id }), plainCost: 2, swampCost: 10, maxOps: 20000 }).path.length
                    };
                    this.memory.pl = this._pathLengthToMainContainer;
                }
            if (this._pathLengthToMainContainer == null)
                return 50;
            else
                return this._pathLengthToMainContainer.length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "capacity", {
        get: function () {
            //let trace = this.tracer.start('Property energyCapacity');
            if (this.source && (this._capacityLastFresh == null || this._capacityLastFresh + 50 < Game.time)) {
                this.memory.c = this.source.energyCapacity;
                this._capacityLastFresh = Game.time;
            }
            //trace.stop();
            return this.memory.c;
        },
        enumerable: true,
        configurable: true
    });
    MySource.prototype._loadLink = function () {
        if (!this.myRoom.mainRoom || this.myRoom.name != this.myRoom.mainRoom.name) {
            if (this.memory.lId)
                delete this.memory.lId;
            return null;
        }
        if (this._link == null || this._link.time < Game.time) {
            if (this.memory.lId) {
                var link = Game.getObjectById(this.memory.lId.id);
                if (link)
                    this._link = { time: Game.time, link: link };
                else
                    this.memory.lId = null;
            }
            if (this.memory.lId == null || this.memory.lId.time + 100 < Game.time) {
                var link = this.source.pos.findInRange(FIND_MY_STRUCTURES, 4, { filter: function (x) { return x.structureType == STRUCTURE_LINK; } })[0];
                if (link) {
                    this._link = { time: Game.time, link: link };
                    this.memory.lId = { time: Game.time, id: link.id };
                }
                else
                    this.memory.lId = { time: Game.time, id: null };
            }
        }
    };
    Object.defineProperty(MySource.prototype, "link", {
        get: function () {
            this._loadLink();
            if (this._link)
                return this._link.link;
            else
                return null;
        },
        enumerable: true,
        configurable: true
    });
    MySource.prototype.getHarvestingSpots = function (source) {
        var surroundingTerrain = source.room.lookForAtArea('terrain', source.pos.y - 1, source.pos.x - 1, source.pos.y + 1, source.pos.x + 1);
        var walls = 0;
        for (var y = source.pos.y - 1; y <= source.pos.y + 1; y++)
            for (var x = source.pos.x - 1; x <= source.pos.x + 1; x++) {
                var row = surroundingTerrain[y][x];
                if (_.some(row, function (r) { return r == 'wall'; }))
                    walls++;
            }
        return 9 - walls;
    };
    return MySource;
}());
var MyMineral = (function () {
    function MyMineral(myRoom, id) {
        this.myRoom = myRoom;
        this.id = id;
        this.link = null;
        this.accessMemory();
        //let oldMemory = <MyMineralMemoryOld>this.memory;
        //let memory = this.memory;
        //if (oldMemory.harvestingSpots) memory.hs = oldMemory.harvestingSpots;
        //if (oldMemory.pathLengthToTerminal) memory.pl = oldMemory.pathLengthToTerminal;
        //if (oldMemory.terminalRoadBuiltTo) memory.rbtr = oldMemory.terminalRoadBuiltTo;
        //if (oldMemory.refreshTime) memory.rti = oldMemory.refreshTime;
        //if (oldMemory.hasExtractor) memory.e = oldMemory.hasExtractor;
        //if (oldMemory.amount) memory.a = oldMemory.amount;
        //delete oldMemory.containerId;
        //delete oldMemory.harvestingSpots;
        //delete oldMemory.pathLengthToTerminal;
        //delete oldMemory.terminalRoadBuiltTo;
        //delete oldMemory.refreshTime;
        //delete oldMemory.hasExtractor;
    }
    Object.defineProperty(MyMineral.prototype, "memory", {
        get: function () {
            return this.accessMemory();
        },
        enumerable: true,
        configurable: true
    });
    MyMineral.prototype.accessMemory = function () {
        if (this.myRoom.memory.min == null) {
            var mineral = Game.getObjectById(this.id);
            if (mineral)
                this.myRoom.memory.min = {
                    id: this.id,
                    a: mineral.mineralAmount,
                    rti: mineral.ticksToRegeneration ? mineral.ticksToRegeneration + Game.time : undefined,
                    pos: mineral.pos,
                    rt: mineral.mineralType,
                };
            else {
                this.myRoom.memory.min = {
                    id: this.id
                };
            }
        }
        return this.myRoom.memory.min;
    };
    Object.defineProperty(MyMineral.prototype, "room", {
        get: function () {
            return this.myRoom.room;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyMineral.prototype, "mineral", {
        get: function () {
            var mineral = Game.getObjectById(this.id);
            return mineral;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyMineral.prototype, "pos", {
        get: function () {
            if (this._pos == null || this._pos.time < Game.time)
                this._pos = { time: Game.time, pos: RoomPos.fromObj(this.memory.pos) };
            return this._pos.pos;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyMineral.prototype, "usable", {
        get: function () {
            return !this.hasKeeper || this.maxHarvestingSpots > 1 && _.size(this.myRoom.mainRoom.managers.labManager.myLabs) > 1;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyMineral.prototype, "site", {
        get: function () {
            if (this._site == null || this._site.time < Game.time)
                this._site = { time: Game.time, site: Game.getObjectById(this.id) };
            return this._site.site;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyMineral.prototype, "keeper", {
        get: function () {
            var _this = this;
            if (!this.hasKeeper)
                return null;
            if (this.room && (this._keeper == null || this._keeper.time < Game.time)) {
                if (this.memory.lairId)
                    var lair = Game.getObjectById(this.memory.lairId);
                if (!lair) {
                    lair = this.pos.findInRange(FIND_HOSTILE_STRUCTURES, 5, { filter: function (s) { return s.structureType == STRUCTURE_KEEPER_LAIR; } })[0];
                    if (lair) {
                        this.memory.lairId = lair.id;
                        this.memory.lairPos = lair.pos;
                    }
                }
                var creepInfo = _.filter(this.myRoom.hostileScan.keepers, function (k) { return k.pos.inRangeTo(_this.pos, 5); })[0];
                this._keeper = {
                    time: Game.time,
                    keeper: {
                        lair: lair,
                        creep: creepInfo ? creepInfo.creep : null
                    }
                };
            }
            if (this._keeper)
                return this._keeper.keeper;
            else
                return null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyMineral.prototype, "hasKeeper", {
        get: function () {
            if (this.memory.keeper == null && this.room) {
                this.memory.keeper = this.pos.findInRange(FIND_HOSTILE_STRUCTURES, 5, { filter: function (x) { return x.structureType == STRUCTURE_KEEPER_LAIR; } }).length > 0;
            }
            if (this.memory.keeper != null)
                return this.memory.keeper;
            else
                return true;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyMineral.prototype, "roadBuiltToRoom", {
        get: function () {
            return this.memory.rbtr;
        },
        set: function (value) {
            this.memory.rbtr = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyMineral.prototype, "maxHarvestingSpots", {
        get: function () {
            //let trace = this.tracer.start('Property maxHarvestingSpots');
            if (this.memory.hs != null || this.mineral == null) {
                //trace.stop();
                return this.memory.hs;
            }
            else {
                var pos = this.mineral.pos;
                var spots = _.filter(this.mineral.room.lookForAtArea(LOOK_TERRAIN, pos.y - 1, pos.x - 1, pos.y + 1, pos.x + 1, true), function (x) { return x.terrain == 'swamp' || x.terrain == 'plain'; }).length;
                this.memory.hs = spots;
                //trace.stop();
                return spots;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyMineral.prototype, "keeperIsAlive", {
        get: function () {
            if (!this.hasKeeper)
                return false;
            if (this._keeperIsAlive == null || this._keeperIsAlive.time < Game.time) {
                this._keeperIsAlive = { time: Game.time, isAlive: this.keeper && (this.keeper.lair.ticksToSpawn < 20 || this.keeper.creep && this.keeper.creep.hits > 100) };
            }
            return this._keeperIsAlive.isAlive;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyMineral.prototype, "pathLengthToDropOff", {
        get: function () {
            if ((this._pathLengthToTerminal == null || this._pathLengthToTerminal.time + 1500 < Game.time) && this.mineral)
                if (this.memory.pl && this.memory.pl.time + 1500 < Game.time) {
                    this._pathLengthToTerminal = this.memory.pl;
                }
                else {
                    this._pathLengthToTerminal = {
                        time: Game.time,
                        length: PathFinder.search(this.myRoom.mainRoom.spawns[0].pos, { pos: this.mineral.pos, range: 1 }, { roomCallback: Colony.getCustomMatrix({ ignoreKeeperSourceId: this.id }), plainCost: 2, swampCost: 10, maxOps: 20000 }).path.length
                    };
                    this.memory.pl = this._pathLengthToTerminal;
                }
            if (this._pathLengthToTerminal == null)
                return 50;
            else
                return this._pathLengthToTerminal.length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyMineral.prototype, "lairPosition", {
        get: function () {
            if (!this.memory.lairPos && this.keeper && this.keeper.lair)
                this.memory.lairPos = this.keeper.lair.pos;
            return RoomPos.fromObj(this.memory.lairPos);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyMineral.prototype, "amount", {
        get: function () {
            if (this.mineral)
                this.memory.a = this.mineral.mineralAmount;
            return this.memory.a;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyMineral.prototype, "refreshTime", {
        get: function () {
            if (this.mineral)
                this.memory.rti = this.mineral.ticksToRegeneration != null ? this.mineral.ticksToRegeneration + Game.time : null;
            return this.memory.rti;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyMineral.prototype, "hasExtractor", {
        //public get containerId() {
        //    if (this.memory.containerId && this.memory.containerId.time == Game.time)
        //        return this.memory.containerId.id;
        //    let trace = this.tracer.start('Property containerId');
        //    if (this.room && this.memory.containerId != null && this.memory.containerId.time < Game.time && this.memory.containerId.id != null) {
        //        let container = Game.getObjectById<Container>(this.memory.containerId.id);
        //        if (container)
        //            this.memory.containerId = { time: Game.time, id: container.id };
        //        else
        //            this.memory.containerId = null;
        //    }
        //    if (this.room && this.memory.containerId == null || this.memory.containerId.time + 100 < Game.time) {
        //        let container = this.pos.findInRange<Container>(FIND_STRUCTURES, 2, { filter: (x: Structure) => x.structureType == STRUCTURE_CONTAINER })[0];
        //        if (container) {
        //            this.memory.containerId = { time: Game.time, id: container.id };
        //        }
        //        else {
        //            if (this.myRoom.mainRoom && this.myRoom.mainRoom.terminal && this.pos.findInRange<ConstructionSite>(FIND_CONSTRUCTION_SITES, 2, { filter: (x: ConstructionSite) => x.structureType == STRUCTURE_CONTAINER }).length == 0) {
        //                let path = PathFinder.search(this.pos, { pos: this.myRoom.mainRoom.terminal.pos, range: 3 }, { plainCost: 2, swampCost: 5, roomCallback: Colony.getTravelMatrix }).path;
        //                path[0].createConstructionSite(STRUCTURE_CONTAINER);
        //            }
        //        }
        //    }
        //    trace.stop();
        //    if (this.memory.containerId)
        //        return this.memory.containerId.id;
        //    else
        //        return null;
        //}
        //private _container: { time: number, container: Container };
        //public get container() {
        //    if (this._container == null || this._container.time < Game.time)
        //        this._container = { time: Game.time, container: Game.getObjectById<Container>(this.containerId) };
        //    return this._container.container;
        //}
        get: function () {
            if ((this.memory.e == null || this.memory.e.time + 100 < Game.time) && this.room) {
                var extractor = _.filter(this.pos.lookFor(LOOK_STRUCTURES), function (s) { return s.structureType == STRUCTURE_EXTRACTOR && (s.my && s.isActive() || s.owner == null); })[0];
                this.memory.e = { time: Game.time, hasExtractor: extractor != null };
            }
            if (this.memory.e)
                return this.memory.e.hasExtractor;
            else
                return false;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyMineral.prototype, "containerPosition", {
        get: function () {
            if (this.container) {
                this.memory.cPos = this.container.pos;
                return this.memory.cPos;
            }
            else
                return RoomPos.fromObj(this.memory.cPos);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyMineral.prototype, "container", {
        get: function () {
            if (this.link || this.hasKeeper)
                return null;
            if ((this._container == null || this._container.time < Game.time) && this.room) {
                if (this.memory.cId) {
                    var container = Game.getObjectById(this.memory.cId);
                    if (container == null)
                        this.memory.cId = null;
                    this._container = { time: Game.time, container: container };
                }
                if (this.memory.cId == null) {
                    var container = this.mineral.pos.findInRange(FIND_STRUCTURES, 1, { filter: function (s) { return s.structureType == STRUCTURE_CONTAINER; } })[0];
                    if (container) {
                        this.memory.cId = container.id;
                        this._container = { time: Game.time, container: container };
                    }
                }
            }
            if (this._container && this.room)
                return this._container.container;
            else
                return null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyMineral.prototype, "resourceType", {
        get: function () {
            return this.memory.rt;
        },
        enumerable: true,
        configurable: true
    });
    return MyMineral;
}());
var BodyInfo = (function () {
    function BodyInfo(parts) {
        this.parts = parts;
    }
    Object.defineProperty(BodyInfo.prototype, "attackRate", {
        get: function () {
            if (this._attackRate == null || this._attackRate.time < Game.time) {
                this._attackRate = {
                    time: Game.time,
                    rate: _.sum(_.filter(this.parts, function (part) { return part.type == ATTACK && part.hits > 0; }), function (part) { return ATTACK_POWER * (BOOSTS.attack[part.boost] ? BOOSTS.attack[part.boost].attack : 1); })
                };
            }
            return this._attackRate.rate;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BodyInfo.prototype, "rangedAttackRate", {
        get: function () {
            if (this._rangedAttackRate == null || this._rangedAttackRate.time < Game.time) {
                this._rangedAttackRate = {
                    time: Game.time,
                    rate: _.sum(_.filter(this.parts, function (part) { return part.type == RANGED_ATTACK && part.hits > 0; }), function (part) { return RANGED_ATTACK_POWER * (BOOSTS.ranged_attack[part.boost] ? BOOSTS.ranged_attack[part.boost].rangedAttack : 1); })
                };
            }
            return this._rangedAttackRate.rate;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BodyInfo.prototype, "totalAttackRate", {
        get: function () {
            return this.attackRate + this.rangedAttackRate;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BodyInfo.prototype, "healRate", {
        get: function () {
            if (this._healRate == null || this._healRate.time < Game.time) {
                this._healRate = {
                    time: Game.time,
                    rate: _.sum(_.filter(this.parts, function (part) { return part.type == HEAL && part.hits > 0; }), function (part) { return HEAL_POWER * (BOOSTS.heal[part.boost] ? BOOSTS.heal[part.boost].heal : 1); })
                };
            }
            return this._healRate.rate;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BodyInfo.prototype, "damageRate", {
        get: function () {
            if (this._damageRate == null || this._damageRate.time < Game.time) {
                this._damageRate = {
                    time: Game.time,
                    rate: _.min(_.map(_.filter(this.parts, function (part) { return part.type == TOUGH && part.hits > 0; }), function (part) { return (BOOSTS.tough[part.boost] ? BOOSTS.tough[part.boost].damage : 1); })) || 1
                };
            }
            return this._damageRate.rate;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BodyInfo.prototype, "toughAmount", {
        get: function () {
            if (this._toughAmount == null || this._toughAmount.time < Game.time) {
                this._toughAmount = {
                    time: Game.time,
                    amount: _.sum(_.filter(this.parts, function (part) { return part.type == TOUGH && part.hits > 0; }), function (x) { return x.hits; })
                };
            }
            return this._toughAmount.amount;
        },
        enumerable: true,
        configurable: true
    });
    return BodyInfo;
}());
/// <reference path="./bodyInfo.ts" />
var CreepInfo = (function () {
    function CreepInfo(id, hostileScan) {
        this.id = id;
        this.hostileScan = hostileScan;
        this._roomPosition = null;
        this.accessMemory();
    }
    Object.defineProperty(CreepInfo.prototype, "memory", {
        get: function () {
            return this.accessMemory();
        },
        enumerable: true,
        configurable: true
    });
    CreepInfo.prototype.accessMemory = function () {
        if (this.hostileScan.memory.creeps.creeps == null)
            this.hostileScan.memory.creeps.creeps = {};
        if (this.hostileScan.memory.creeps.creeps[this.id] == null) {
            var creep = Game.getObjectById(this.id);
            if (creep)
                this.hostileScan.memory.creeps.creeps[this.id] = {
                    id: this.id,
                    body: creep.body,
                    hits: creep.hits,
                    hitsMax: creep.hitsMax,
                    my: creep.my,
                    owner: creep.owner ? creep.owner.username : null,
                    pos: creep.pos,
                    ticksToLive: creep.ticksToLive,
                };
        }
        return this.hostileScan.memory.creeps.creeps[this.id];
    };
    Object.defineProperty(CreepInfo.prototype, "bodyParts", {
        get: function () {
            return this.memory.body;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CreepInfo.prototype, "creep", {
        get: function () {
            if (this._creep == null || this._creep.time < Game.time)
                this._creep = { time: Game.time, creep: Game.getObjectById(this.id) };
            return this._creep.creep;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CreepInfo.prototype, "bodyInfo", {
        get: function () {
            if (this._bodyInfo == null || this._bodyInfo.time < Game.time)
                this._bodyInfo = { time: Game.time, bodyInfo: new BodyInfo(this.bodyParts) };
            return this._bodyInfo.bodyInfo;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CreepInfo.prototype, "hits", {
        get: function () {
            return this.memory.hits;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CreepInfo.prototype, "hitsMax", {
        get: function () {
            return this.memory.hitsMax;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CreepInfo.prototype, "my", {
        get: function () {
            return this.memory.my;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CreepInfo.prototype, "owner", {
        get: function () {
            return this.memory.owner;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CreepInfo.prototype, "pos", {
        get: function () {
            if (this._roomPosition == null || this._roomPosition.time < Game.time)
                this._roomPosition = { time: Game.time, pos: RoomPos.fromObj(this.memory.pos) };
            return this._roomPosition.pos;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CreepInfo.prototype, "ticksToLive", {
        get: function () {
            return this.memory.ticksToLive;
        },
        enumerable: true,
        configurable: true
    });
    return CreepInfo;
}());
/// <reference path="../../components/creeps/creepInfo.ts" />
var HostileScan = (function () {
    function HostileScan(myRoom) {
        this.myRoom = myRoom;
        if (myMemory['profilerActive'])
            this.creeps_get = profiler.registerFN(this.creeps_get, 'HostileScan.creeps');
        if (this._allCreeps && this._allCreeps.time + 500 < Game.time)
            this._allCreeps = null;
    }
    Object.defineProperty(HostileScan.prototype, "memory", {
        get: function () {
            return this.accessMemory();
        },
        enumerable: true,
        configurable: true
    });
    HostileScan.prototype.accessMemory = function () {
        if (this.myRoom.memory.hs == null)
            this.myRoom.memory.hs = {
                creeps: null,
                scanTime: null
            };
        return this.myRoom.memory.hs;
    };
    Object.defineProperty(HostileScan.prototype, "scanTime", {
        get: function () {
            return this.memory.scanTime;
        },
        enumerable: true,
        configurable: true
    });
    HostileScan.prototype.creeps_get = function () {
        if (this.allCreeps == null)
            return null;
        if (this._creeps == null || this._creeps.time < Game.time)
            this._creeps = { time: Game.time, creeps: _.indexBy(_.filter(this.allCreeps, function (c) { return c.owner != 'Source Keeper'; }), function (c) { return c.id; }) };
        return this._creeps.creeps;
    };
    Object.defineProperty(HostileScan.prototype, "creeps", {
        get: function () {
            return this.creeps_get();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(HostileScan.prototype, "keepers", {
        get: function () {
            if (this.allCreeps == null)
                return null;
            if (this._keepers == null || this._keepers.time < Game.time)
                this._keepers = { time: Game.time, creeps: _.indexBy(_.filter(this.allCreeps, function (c) { return c.owner == 'Source Keeper'; }), function (c) { return c.id; }) };
            return this._keepers.creeps;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(HostileScan.prototype, "allCreeps", {
        get: function () {
            var _this = this;
            if (this.myRoom.room && (this._allCreeps == null || this._allCreeps.time + 10 < Game.time)) {
                this.refreshCreeps();
            }
            else if (this.memory.creeps) {
                this._allCreeps = { time: this.memory.creeps.time, creeps: {} };
                this._allCreeps.creeps = _.indexBy(_.map(this.memory.creeps.creeps, function (creep) { return new CreepInfo(creep.id, _this); }), function (x) { return x.id; });
            }
            else
                return null;
            if (this._allCreeps)
                return this._allCreeps.creeps;
            else
                return null;
        },
        enumerable: true,
        configurable: true
    });
    HostileScan.prototype.refreshCreeps = function () {
        var _this = this;
        if (this.myRoom.room) {
            this._allCreeps = { time: Game.time, creeps: {} };
            this.memory.creeps = { time: Game.time, creeps: {} };
            this._allCreeps.creeps = _.indexBy(_.map(this.myRoom.room.find(FIND_HOSTILE_CREEPS, { filter: function (c) { return !c.owner || c.owner.username != 'MarkusF'; } }), function (creep) { return new CreepInfo(creep.id, _this); }), function (x) { return x.id; });
        }
    };
    return HostileScan;
}());
/// <reference path="../sources/mySource.ts" />
/// <reference path="../sources/myMineral.ts" />
/// <reference path="./hostileScan.ts" />
var MyRoom = (function () {
    function MyRoom(name) {
        this.name = name;
        this._room = { time: -1, room: null };
        this._mySources = null;
        if (myMemory['profilerActive']) {
            this.getCustomMatrix = profiler.registerFN(this.getCustomMatrix, 'MyRoom.getCustomMatrix');
            this.createCostMatrix = profiler.registerFN(this.createCostMatrix, 'MyRoom.createCostMatrix');
            this.createKeeperMatrix = profiler.registerFN(this.createKeeperMatrix, 'MyRoom.createKeeperMatrix');
            this.refresh = profiler.registerFN(this.refresh, 'MyRoom.refresh');
        }
        //this.accessMemory();
        //let oldMemory = <MyRoomMemoryOld>this.memory;
        //let memory = this.memory;
        //delete oldMemory.containers;
        //delete oldMemory.hasController;
        //if (oldMemory.avoidKeeperMatrix) memory.aKM = oldMemory.avoidKeeperMatrix;
        //delete oldMemory.avoidKeeperMatrix;
        //if (oldMemory.compressedCostMatrix) memory.ccm = oldMemory.compressedCostMatrix;
        //delete oldMemory.compressedCostMatrix;
        //if (oldMemory.controllerPosition) memory.ctrlPos = oldMemory.controllerPosition;
        //delete oldMemory.controllerPosition;
        //if (oldMemory.costMatrix) memory.cm = oldMemory.costMatrix;
        //delete oldMemory.costMatrix;
        //if (oldMemory.emergencyRepairStructures) memory.ers = oldMemory.emergencyRepairStructures;
        //delete oldMemory.emergencyRepairStructures;
        //if (oldMemory.foreignOwner) memory.fO = oldMemory.foreignOwner;
        //delete oldMemory.foreignOwner;
        //if (oldMemory.foreignReserver) memory.fR = oldMemory.foreignReserver;
        //delete oldMemory.foreignReserver;
        //if (oldMemory.hostileScan) memory.hs = oldMemory.hostileScan;
        //delete oldMemory.hostileScan;
        //if (oldMemory.lastScanTime) memory.lst = oldMemory.lastScanTime;
        //delete oldMemory.lastScanTime;
        //if (oldMemory.mainRoomDistanceDescriptions) memory.mrd = oldMemory.mainRoomDistanceDescriptions;
        //delete oldMemory.mainRoomDistanceDescriptions;
        //if (oldMemory.mainRoomName) memory.mrn = oldMemory.mainRoomName;
        //delete oldMemory.mainRoomName;
        //if (oldMemory.myMineral) memory.min = oldMemory.myMineral;
        //delete oldMemory.myMineral;
        //if (oldMemory.repairStructures) memory.rs = oldMemory.repairStructures;
        //delete oldMemory.repairStructures;
        //if (oldMemory.repairWalls) memory.rs = oldMemory.repairWalls;
        //delete oldMemory.repairWalls;
        //if (oldMemory.sources) memory.srcs = oldMemory.sources;
        //delete oldMemory.sources;
        //if (memory.mrd) {
        //    _.forEach(memory.mrd, (distanceDescription: DistanceDescriptionOld) => {
        //        if (distanceDescription.distance) distanceDescription.d = distanceDescription.distance;
        //        delete distanceDescription.distance;
        //        if (distanceDescription.roomName) distanceDescription.n = distanceDescription.roomName;
        //        delete distanceDescription.roomName;
        //    });
        //}
        this.memory.name = name;
        this.hostileScan = new HostileScan(this);
        this.refresh(true);
    }
    Object.defineProperty(MyRoom.prototype, "memory", {
        get: function () {
            return this.accessMemory();
        },
        enumerable: true,
        configurable: true
    });
    MyRoom.prototype.accessMemory = function () {
        if (Colony.memory.rooms == null)
            Colony.memory.rooms = {};
        if (Colony.memory.rooms[this.name] == null)
            Colony.memory.rooms[this.name] = {
                name: this.name
            };
        return Colony.memory.rooms[this.name];
    };
    Object.defineProperty(MyRoom.prototype, "controllerPosition", {
        get: function () {
            if (this.memory.ctrlPos)
                return RoomPos.fromObj(this.memory.ctrlPos);
            else
                return null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyRoom.prototype, "repairWalls", {
        get: function () {
            if (this.memory.rw == null || this.memory.rw.time + 1450 < Game.time) {
                this.reloadRepairStructures(0.5);
            }
            if (this.memory.rw)
                return this.memory.rw.structures;
            else
                return {};
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyRoom.prototype, "repairStructures", {
        get: function () {
            var _this = this;
            if (this.memory.rs == null || this.memory.rs.time + 1450 < Game.time) {
                this.reloadRepairStructures(0.5);
            }
            else if (this.memory.rsUT < Game.time) {
                this.memory.rsUT = Game.time;
                _.forEach(this.memory.rs.structures, function (s) {
                    var structure = Game.getObjectById(s.id);
                    if (structure == null || structure.hits >= structure.hitsMax)
                        delete _this.memory.rs[s.id];
                    else {
                        s.hits = structure.hits;
                        s.hitsMax = structure.hitsMax;
                    }
                });
            }
            if (this.memory.rs)
                return this.memory.rs.structures;
            else
                return {};
        },
        enumerable: true,
        configurable: true
    });
    MyRoom.prototype.reloadRepairStructures = function (hitsFactor) {
        var _this = this;
        if (this.room) {
            var structures = _.map(this.room.find(FIND_STRUCTURES, { filter: function (s) { return s.hits < s.hitsMax && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_CONTAINER || s.hits < hitsFactor * s.hitsMax && s.hits <= s.hitsMax - 500 && (s.structureType != STRUCTURE_CONTAINER || !_.any(_this.mySources, function (x) { return x.hasKeeper; })); } }), function (s) { return { id: s.id, hits: s.hits, hitsMax: s.hitsMax, pos: s.pos, sT: s.structureType }; });
            var nonWalls = _.indexBy(_.filter(structures, function (s) { return s.sT != STRUCTURE_WALL && s.sT != STRUCTURE_RAMPART || s.hits < 10000; }), function (x) { return x.id; });
            var walls = _.indexBy(_.filter(structures, function (s) { return s.sT == STRUCTURE_WALL || s.sT == STRUCTURE_RAMPART; }), function (x) { return x.id; });
            this.memory.rs = { time: Game.time, structures: nonWalls };
            this.memory.rw = { time: Game.time, structures: walls };
        }
    };
    Object.defineProperty(MyRoom.prototype, "emergencyRepairStructures", {
        get: function () {
            if (this._emergencyRepairStructures == null || this._emergencyRepairStructures.time + 10 < Game.time) {
                var structures = _.filter(this.repairStructures, RepairManager.emergencyTargetDelegate);
                if (structures.length == 0)
                    structures = _.filter(this.repairWalls, RepairManager.emergencyTargetDelegate);
                this._emergencyRepairStructures = { time: Game.time, structures: structures };
            }
            return this._emergencyRepairStructures.structures;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyRoom.prototype, "resourceDrops", {
        get: function () {
            if (this._resourceDrops == null || this._resourceDrops.time < Game.time) {
                if (this.room)
                    this._resourceDrops = { time: Game.time, resources: this.room.find(FIND_DROPPED_RESOURCES) };
                else
                    this._resourceDrops = { time: Game.time, resources: [] };
            }
            return this._resourceDrops.resources;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyRoom.prototype, "room", {
        get: function () {
            //let trace = this.tracer.start('Property room');
            if (this._room.time < Game.time)
                this._room = {
                    time: Game.time, room: Game.rooms[this.name]
                };
            //trace.stop();
            return this._room.room;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyRoom.prototype, "hasController", {
        get: function () {
            return this.memory.ctrlPos != null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyRoom.prototype, "canHarvest", {
        get: function () {
            //let trace = this.tracer.start('Property canHarvest');
            var result = (this.mainRoom && this.name == this.mainRoom.name || !(this.memory.fO || this.memory.fR));
            //trace.stop();
            return result;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyRoom.prototype, "mySources", {
        get: function () {
            var _this = this;
            //let trace = this.tracer.start('Property mySources');
            if (this._mySources == null) {
                if (this.memory.srcs == null && this.room) {
                    this._mySources = { time: Game.time, mySources: _.indexBy(_.map(this.room.find(FIND_SOURCES), function (x) { return new MySource(x.id, _this); }), function (x) { return x.id; }) };
                }
                else if (this.memory.srcs != null) {
                    this._mySources = { time: Game.time, mySources: _.indexBy(_.map(this.memory.srcs, function (x) { return new MySource(x.id, _this); }), function (x) { return x.id; }) };
                }
            }
            //trace.stop();
            if (this._mySources)
                return this._mySources.mySources;
            else
                return {};
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyRoom.prototype, "useableSources", {
        get: function () {
            //let trace = this.tracer.start('Property useableSources');
            var result = _.filter(this.mySources, function (x) { return !x.hasKeeper; });
            //trace.stop();
            return result;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyRoom.prototype, "mainRoom", {
        get: function () {
            //let trace = this.tracer.start('Property mainRoom');
            if (this._mainRoom == null || this._mainRoom.time < Game.time)
                this._mainRoom = { time: Game.time, mainRoom: Colony.mainRooms[this.memory.mrn] };
            //trace.stop();
            return this._mainRoom.mainRoom;
        },
        set: function (value) {
            if (value != null && (this.mainRoom == null || this.mainRoom.name != value.name))
                value.invalidateSources();
            //if (this._mainRoom && this._mainRoom.memory.connectedRooms)
            //    this.mainRoom.memory.connectedRooms.splice(this.mainRoom.memory.connectedRooms.indexOf(this.name), 1);
            this._mainRoom = { time: Game.time, mainRoom: value };
            //if (this._mainRoom) {
            //    if (!this.mainRoom.memory.connectedRooms)
            //        this.mainRoom.memory.connectedRooms = [];
            //    this._mainRoom.memory.connectedRooms.push(this.name);
            //}
            this.memory.mrn = (value == null ? undefined : value.name);
        },
        enumerable: true,
        configurable: true
    });
    MyRoom.prototype.costMatrixSetArea = function (costMatrix, pos, range, value) {
        for (var x = -range; x <= range; x++) {
            for (var y = -range; y <= range; y++) {
                if (Game.map.getTerrainAt(pos.x + x, pos.y + y, this.name) != 'wall' && costMatrix.get(pos.x + x, pos.y + x) < 255) {
                    if (value < 255) {
                        var currentCosts = costMatrix.get(pos.x + x, pos.y + y);
                        if (currentCosts > 0)
                            var terrainValue = currentCosts;
                        else if (Game.map.getTerrainAt(pos.x + x, pos.y + y, pos.roomName) == 'plain')
                            terrainValue = 2;
                        else
                            terrainValue = 10;
                        costMatrix.set(pos.x + x, pos.y + y, Math.min(value * terrainValue, 254));
                    }
                    else
                        costMatrix.set(pos.x + x, pos.y + y, 255);
                }
            }
        }
    };
    Object.defineProperty(MyRoom.prototype, "costMatrix", {
        get: function () {
            if (this.memory.fO && this.memory.cm || this.memory.ccm) {
                delete this.memory.cm;
                delete this.memory.ccm;
                return false;
            }
            if (Colony.memory.useCompressedCostMatrix && this.memory.cm)
                delete this.memory.cm;
            else if (this.memory.ccm)
                delete this.memory.ccm;
            if (this._costMatrix == null || this._costMatrix.time + 500 < Game.time) {
                if (Colony.memory.useCompressedCostMatrix) {
                    if ((this.memory.ccm == null || this.memory.ccm.time + 500 < Game.time) && this.room) {
                        this.recreateCostMatrix();
                    }
                    else if (this.memory.ccm != null) {
                        this._costMatrix = { time: this.memory.ccm.time, matrix: MyCostMatrix.decompress(this.memory.ccm.matrix) };
                    }
                }
                else {
                    if ((this.memory.cm == null || this.memory.cm.time + 500 < Game.time) && this.room) {
                        this.recreateCostMatrix();
                    }
                    else if (this.memory.cm != null) {
                        this._costMatrix = { time: this.memory.cm.time, matrix: PathFinder.CostMatrix.deserialize(this.memory.cm.matrix) };
                    }
                }
            }
            if (this._costMatrix)
                return this._costMatrix.matrix;
            else
                return new PathFinder.CostMatrix();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyRoom.prototype, "creepAvoidanceMatrix", {
        get: function () {
            if (this.costMatrix === false)
                return false;
            if (!this.room)
                return this.costMatrix;
            if ((this._creepAvoidanceMatrix == null || this._creepAvoidanceMatrix.time < Game.time) && this.room) {
                var matrix_1 = this.costMatrix.clone();
                _.forEach(this.room.find(FIND_CREEPS), function (c) { return matrix_1.set(c.pos.x, c.pos.y, 255); });
                this._creepAvoidanceMatrix = { time: Game.time, matrix: matrix_1 };
            }
            return this._creepAvoidanceMatrix.matrix;
        },
        enumerable: true,
        configurable: true
    });
    MyRoom.prototype.createKeeperMatrix = function (opts, customMatrix, baseMatrix) {
        var _this = this;
        if (!customMatrix)
            customMatrix = baseMatrix.clone();
        console.log(this.name + ':Creating KeeperMatrix ' + ((opts && opts.ignoreKeeperSourceId) ? opts.ignoreKeeperSourceId : ''));
        var sourcesToAvoid = _.filter(this.mySources, function (s) { return !opts || !opts.ignoreKeeperSourceId || s.id != opts.ignoreKeeperSourceId; });
        //console.log('Sources to avoid: ' + _.map(sourcesToAvoid, s => s.id).join(', '));
        var sourcePositions = _.map(sourcesToAvoid, function (s) { return s.pos; });
        var lairPositions = _.map(_.filter(sourcesToAvoid, function (s) { return s.lairPosition; }), function (s) { return s.lairPosition; });
        if (this.myMineral && this.myMineral.hasKeeper && (!opts || !opts.ignoreKeeperSourceId || this.myMineral.id != opts.ignoreKeeperSourceId)) {
            sourcePositions.push(this.myMineral.pos);
            if (this.myMineral.lairPosition)
                lairPositions.push(this.myMineral.lairPosition);
        }
        var protectedPositions = sourcePositions.concat(lairPositions);
        var ignoreSourcePositions = _.map(_.filter(sourcesToAvoid, function (s) { return opts && s.id == opts.ignoreKeeperSourceId; }), function (s) { return s.pos; });
        var ignoreLairPositions = _.map(_.filter(sourcesToAvoid, function (s) { return opts && s.id == opts.ignoreKeeperSourceId && s.lairPosition; }), function (s) { return s.lairPosition; });
        _.forEach(protectedPositions, function (pos) { _this.costMatrixSetArea(customMatrix, pos, 4, 10); });
        _.forEach(ignoreSourcePositions, function (pos) {
            _this.costMatrixSetArea(customMatrix, pos, 2, 0);
        });
        //_.forEach(ignoreSourcePositions, pos => { this.costMatrixSetArea(customMatrix, pos, 5, 10) });
        //_.forEach(ignoreLairPositions, pos => { this.costMatrixSetArea(customMatrix, pos, 5, 5) });
        if (!opts || !opts.ignoreKeeperSourceId && !opts.avoidCreeps) {
            this._avoidKeeperMatrix = { time: Game.time, matrix: customMatrix.clone() };
            this.memory.aKM = { time: Game.time, matrix: this._avoidKeeperMatrix.matrix.serialize() };
        }
        return customMatrix;
    };
    MyRoom.prototype.getCustomMatrix = function (opts) {
        if (this.memory.fO)
            return false;
        var costMatrix = (opts && opts.avoidCreeps) ? this.creepAvoidanceMatrix : this.costMatrix;
        var customMatrix = null;
        if (Colony.memory.useKeeperMatrix) {
            if (_.any(this.mySources, function (s) { return s.hasKeeper; }) && (!opts || !opts.ignoreAllKeepers)) {
                if ((!opts || !opts.ignoreKeeperSourceId && (!opts.avoidCreeps || !this.mySources[opts.ignoreKeeperSourceId] && (!this.myMineral || this.myMineral.id != opts.ignoreKeeperSourceId))) && (this._avoidKeeperMatrix && !(this._avoidKeeperMatrix.time + 200 < Game.time) || this.memory.aKM && !(this.memory.aKM.time + 200 < Game.time))) {
                    if (!this._avoidKeeperMatrix || this._avoidKeeperMatrix.time + 500 < Game.time) {
                        this._avoidKeeperMatrix = { time: Game.time, matrix: PathFinder.CostMatrix.deserialize(this.memory.aKM.matrix) };
                        console.log(this.name + ': Deserializing KeeperMatrix');
                    }
                    customMatrix = this._avoidKeeperMatrix.matrix;
                    console.log(this.name + ': Returning cached KeeperMatrix');
                }
                else {
                    customMatrix = this.createKeeperMatrix(opts, customMatrix, costMatrix);
                }
            }
        }
        return customMatrix || costMatrix;
    };
    MyRoom.prototype.recreateCostMatrix = function () {
        if (!this.room)
            return;
        var costMatrix = this.createCostMatrix();
        if (Colony.memory.useCompressedCostMatrix)
            this.memory.ccm = { time: Game.time, matrix: MyCostMatrix.compress(costMatrix) };
        else
            this.memory.cm = { time: Game.time, matrix: costMatrix.serialize() };
        //this.memory.compressedTravelMatrix = { time: Game.time, matrix: MyCostMatrix.compress(this._travelMatrix.matrix) };
        this._costMatrix = { time: Game.time, matrix: costMatrix };
    };
    MyRoom.prototype.createCostMatrix = function () {
        var _this = this;
        var costMatrix = new PathFinder.CostMatrix();
        _.forEach(this.room.find(FIND_STRUCTURES, { filter: function (s) { return s.structureType == STRUCTURE_ROAD; } }), function (structure) {
            costMatrix.set(structure.pos.x, structure.pos.y, 1);
        });
        _.forEach(this.room.find(FIND_CONSTRUCTION_SITES, { filter: function (s) { return s.structureType == STRUCTURE_ROAD; } }), function (structure) {
            costMatrix.set(structure.pos.x, structure.pos.y, 1);
        });
        if (!Colony.memory.useKeeperMatrix) {
            if (_.any(this.mySources, function (s) { return s.hasKeeper; })) {
                var sourcesToAvoid = this.mySources;
                //console.log('Sources to avoid: ' + _.map(sourcesToAvoid, s => s.id).join(', '));
                var sourcePositions = _.map(sourcesToAvoid, function (s) { return s.pos; });
                var lairPositions = _.map(_.filter(sourcesToAvoid, function (s) { return s.lairPosition; }), function (s) { return s.lairPosition; });
                if (this.myMineral && this.myMineral.hasKeeper) {
                    sourcePositions.push(this.myMineral.pos);
                    if (this.myMineral.lairPosition)
                        lairPositions.push(this.myMineral.lairPosition);
                }
                var protectedPositions = sourcePositions.concat(lairPositions);
                _.forEach(protectedPositions, function (pos) { _this.costMatrixSetArea(costMatrix, pos, 4, 10); });
            }
        }
        var obstaclePositions = _.uniq(this.room.find(FIND_STRUCTURES, {
            filter: function (s) { return (OBSTACLE_OBJECT_TYPES.indexOf(s.structureType) >= 0) || s.structureType == STRUCTURE_PORTAL || (s.structureType == STRUCTURE_RAMPART && s.isPublic == false && s.my == false); }
        }).concat(this.room.find(FIND_CONSTRUCTION_SITES, {
            filter: function (s) { return OBSTACLE_OBJECT_TYPES.indexOf(s.structureType) >= 0 || s.structureType == STRUCTURE_CONTROLLER; }
        })));
        _.forEach(obstaclePositions, function (structure) {
            if (structure.structureType != STRUCTURE_WALL && structure.structureType != STRUCTURE_RAMPART)
                _this.costMatrixSetArea(costMatrix, structure.pos, 1, 3);
            costMatrix.set(structure.pos.x, structure.pos.y, 255);
        });
        if (this.myMineral)
            var positions = _.map(this.mySources, function (s) { return s.pos; }).concat(this.myMineral.pos);
        else
            positions = _.map(this.mySources, function (s) { return s.pos; });
        _.forEach(positions, function (pos) {
            _this.costMatrixSetArea(costMatrix, pos, 2, 2);
        });
        return costMatrix;
    };
    Object.defineProperty(MyRoom.prototype, "requiresDefense", {
        get: function () {
            return (this.mainRoom && _.size(this.hostileScan.creeps) > 0);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyRoom.prototype, "closestMainRoom", {
        get: function () {
            //let trace = this.tracer.start('Property closestMainRoom');
            if (this.memory.mrd == null || _.size(this.memory.mrd) == 0) {
                //trace.stop();
                return null;
            }
            var result = Colony.mainRooms[_.min(this.memory.mrd, function (x) { return x.d; }).n];
            //trace.stop();
            return result;
        },
        enumerable: true,
        configurable: true
    });
    MyRoom.prototype.refresh = function (force) {
        if (force === void 0) { force = false; }
        var room = this.room;
        if (this.memory.lst == null || this.memory.lst + 100 < Game.time || force) {
            if (this.memory.min == null && room) {
                var mineral = room.find(FIND_MINERALS)[0];
                if (mineral)
                    this.myMineral = new MyMineral(this, mineral.id);
            }
            else if (this.memory.min != null)
                this.myMineral = new MyMineral(this, this.memory.min.id);
            if (room == null)
                return;
            this.memory.fO = (room.controller != null && room.controller.owner != null && !room.controller.my) ? true : undefined;
            this.memory.fR = (room.controller != null && room.controller.reservation != null && room.controller.reservation.username != Colony.myName) ? true : undefined;
            this.memory.lst = Game.time;
            if (this.room.controller)
                this.memory.ctrlPos = this.room.controller.pos;
            this.mySources;
            if (this.myMineral && this.myMineral.resourceType == null)
                delete this.memory.min;
            this.myMineral;
            //this.costMatrix;
            if (this.memory.cm && this.memory.cm.time < Game.time - 5000) {
                delete this.memory.cm;
            }
            if (this.memory.aKM && this.memory.aKM.time < Game.time - 5000) {
                delete this.memory.aKM;
            }
            if (this.memory.ccm && this.memory.ccm.time < Game.time - 5000) {
                delete this.memory.ccm;
            }
        }
    };
    return MyRoom;
}());
/// <reference path="../myCreep.ts" />
var Scout = (function (_super) {
    __extends(Scout, _super);
    function Scout(name) {
        _super.call(this, name);
        this.name = name;
        this.autoFlee = true;
        if (myMemory['profilerActive']) {
            this.myTick = profiler.registerFN(this.myTick, 'Scout.tick');
        }
    }
    Scout.prototype.myTick = function () {
        try {
            //this.creep.say('SCOUT');
            this.memory = this.creep.memory;
            if (!this.memory.path) {
                var path = PathFinder.search(this.creep.pos, { pos: RoomPos.fromObj(this.memory.targetPosition), range: 10 }, { roomCallback: Colony.getTravelMatrix, plainCost: 1, swampCost: 1 });
                path.path.unshift(this.creep.pos);
                this.memory.path = path;
            }
            if (this.moveByPath() == ERR_INVALID_ARGS)
                this.memory.path = null;
            //let pos = this.creep.pos;
            //if (this.memory.targetPosition!=null && (pos.roomName != this.memory.targetPosition.roomName || pos.x < 3 || pos.x > 46 || pos.y < 3 || pos.y > 46)) {
            //    //let path = this.creep.pos.findPathTo(new RoomPosition(25, 25, this.memory.targetRoomName), { ignoreDestructibleStructures: true });
            //    let result = this.creep.moveTo(new RoomPosition(25, 25, this.memory.targetPosition.roomName), { reusePath: 50 });
            //    if (result == ERR_NO_PATH)
            //        this.creep.suicide();
            //}
            if (this.memory.targetPosition && this.creep.pos.roomName == this.memory.targetPosition.roomName) {
                var myRoom = Colony.getRoom(this.creep.pos.roomName);
                if (myRoom.memory.lst < Game.time - 100)
                    myRoom.refresh();
            }
        }
        catch (e) {
            console.log(e.stack);
        }
    };
    return Scout;
}(MyCreep));
/// <reference path="../myCreep.ts" />
var ArmyCreep = (function (_super) {
    __extends(ArmyCreep, _super);
    function ArmyCreep(name, army) {
        _super.call(this, name);
        this.name = name;
    }
    return ArmyCreep;
}(MyCreep));
/// <reference path="./armyCreep.ts" />
var Army = (function () {
    function Army(armyManager, id) {
        this.armyManager = armyManager;
        this.id = id;
    }
    Object.defineProperty(Army.prototype, "memory", {
        get: function () {
            return this.accessMemory();
        },
        enumerable: true,
        configurable: true
    });
    Army.prototype.accessMemory = function () {
        if (this.armyManager.memory.armies == null)
            this.armyManager.memory.armies = {};
        if (this.armyManager.memory.armies[this.id] == null)
            this.armyManager.memory.armies[this.id] = {
                id: this.id,
                state: 1 /* Rally */,
                mission: 0 /* None */,
                rallyPoint: null
            };
        return this.armyManager.memory.armies[this.id];
    };
    Object.defineProperty(Army.prototype, "creeps", {
        get: function () {
            var _this = this;
            return _.filter(Game.creeps, function (c) { return c.memory.armyId == _this.id; });
        },
        enumerable: true,
        configurable: true
    });
    return Army;
}());
/// <reference path="../../components/creeps/military/army.ts" />
var ArmyManager = (function () {
    function ArmyManager() {
    }
    Object.defineProperty(ArmyManager.prototype, "memory", {
        get: function () {
            return this.accessMemory();
        },
        enumerable: true,
        configurable: true
    });
    ArmyManager.prototype.accessMemory = function () {
        if (Colony.memory.armyManager == null)
            Colony.memory.armyManager = {
                nextId: 0,
                armies: {}
            };
        return Colony.memory.armyManager;
    };
    Object.defineProperty(ArmyManager.prototype, "armies", {
        get: function () {
            if (this._armies == null || this._armies.time < Game.time) {
            }
            return this._armies.armies;
        },
        enumerable: true,
        configurable: true
    });
    return ArmyManager;
}());
/// <reference path="./claimingManager.ts" />
/// <reference path="./roomAssignment.ts" />
/// <reference path="./reactionManager.ts" />
/// <reference path="../components/rooms/mainRoom.ts" />
/// <reference path="../components/rooms/myRoom.ts" />
/// <reference path="../components/creeps/scout/scout.ts" />
/// <reference path="./military/armyManager.ts" />
/// <reference path="../helpers.ts" />
var Colony;
(function (Colony) {
    Colony.profiler = require('screeps-profiler');
    Colony.mainRooms = {};
    var rooms = {};
    Colony.claimingManagers = {};
    Colony.invasionManagers = {};
    Colony.reactionManager = new ReactionManager();
    function getRoom(roomName) {
        var room = rooms[roomName];
        if (room) {
            return room;
        }
        if (!Colony.memory.rooms[roomName] && !Game.rooms[roomName]) {
            return null;
        }
        else {
            var myRoom = new MyRoom(roomName);
            rooms[roomName] = myRoom;
            if (myRoom.memory.mrd == null)
                calculateDistances(myRoom);
            return rooms[roomName];
        }
    }
    Colony.getRoom = getRoom;
    var _creepsByMainRoomName;
    function getCreeps(mainRoomName) {
        if (_creepsByMainRoomName == null || _creepsByMainRoomName.time < Game.time)
            _creepsByMainRoomName = { time: Game.time, creeps: _.groupBy(_.filter(Game.creeps, function (c) { return !c.memory.handledByColony; }), function (c) { return c.memory.mainRoomName; }) };
        if (_creepsByMainRoomName.creeps[mainRoomName])
            return _creepsByMainRoomName.creeps[mainRoomName];
        else
            return [];
    }
    Colony.getCreeps = getCreeps;
    var allRoomsLoaded = false;
    function getAllRooms() {
        if (!allRoomsLoaded) {
            _.forEach(Colony.memory.rooms, function (room) { return getRoom(room.name); });
            allRoomsLoaded = true;
        }
        return rooms;
    }
    Colony.getAllRooms = getAllRooms;
    var forbidden = [];
    var tickCount = 0;
    function getCreepAvoidanceMatrix(roomName) {
        var room = getRoom(roomName);
        if (room) {
            return room.creepAvoidanceMatrix;
        }
    }
    Colony.getCreepAvoidanceMatrix = getCreepAvoidanceMatrix;
    function getTravelMatrix(roomName) {
        var room = getRoom(roomName);
        if (room) {
            return room.getCustomMatrix();
        }
        else
            return new PathFinder.CostMatrix();
    }
    Colony.getTravelMatrix = getTravelMatrix;
    function getCustomMatrix(opts) {
        return function (roomName) {
            var room = getRoom(roomName);
            if (room) {
                var matrix = room.getCustomMatrix(opts);
                if (room.name == 'E14S23')
                    console.log('Room E14S23 matrix: ' + matrix);
                return matrix;
            }
            else
                return new PathFinder.CostMatrix();
        };
    }
    Colony.getCustomMatrix = getCustomMatrix;
    function assignMainRoom(room) {
        calculateDistances(room);
        return room.mainRoom;
    }
    Colony.assignMainRoom = assignMainRoom;
    function shouldSendScout(roomName) {
        var myRoom = getRoom(roomName);
        var result = (myRoom == null
            || (!myRoom.mainRoom && !myRoom.memory.fO && !myRoom.memory.fR && (!myRoom.memory.lst || myRoom.memory.lst + 500 < Game.time))
            || (!Game.map.isRoomProtected(roomName)
                || !_.any(forbidden, function (x) { return x == roomName; }))
                && ((myRoom == null || !myRoom.requiresDefense && !myRoom.memory.fO && !myRoom.memory.fR)
                    || (Game.time % 2000) == 0));
        return result;
    }
    function spawnCreep(requestRoom, body, memory, count) {
        if (count === void 0) { count = 1; }
        if (count <= 0)
            return true;
        console.log('Colony.spawnCreep costs: ' + body.costs);
        console.log('Body: ' + body.getBody().join(', '));
        console.log('MainRoom: ' + memory.mainRoomName);
        console.log('Role: ' + memory.role);
        console.log('SourceId: ' + memory.sourceId);
        console.log('Count: ' + count);
        var mainRoom = _.sortBy(_.filter(_.filter(Colony.mainRooms, function (mainRoom) { return !mainRoom.spawnManager.isBusy; }), function (x) { return x.maxSpawnEnergy > body.costs; }), function (x) { return requestRoom.memory.mrd[x.name].d; })[0];
        if (mainRoom) {
            mainRoom.spawnManager.addToQueue(body.getBody(), memory, count);
            console.log('Spawn request success: ' + mainRoom.name);
            return true;
        }
        else
            return false;
    }
    Colony.spawnCreep = spawnCreep;
    function createScouts() {
        var scouts = _.filter(Game.creeps, function (c) { return c.memory.role == 'scout' && c.memory.handledByColony == true && c.memory.targetPosition != null; });
        var roomNames = _.map(_.filter(Colony.memory.rooms, function (x) { return x.mrn != null && Colony.mainRooms[x.mrn] && !Colony.mainRooms[x.mrn].spawnManager.isBusy && !Game.map.isRoomProtected(x.name); }), function (x) { return x.name; });
        for (var _i = 0, roomNames_1 = roomNames; _i < roomNames_1.length; _i++) {
            var roomName = roomNames_1[_i];
            var myRoom = Colony.getRoom(roomName);
            if (!myRoom || !myRoom.mainRoom)
                continue;
            if (Colony.memory.exits == null)
                Colony.memory.exits = {};
            if (!Colony.memory.exits[roomName]) {
                Colony.memory.exits[roomName] = {};
                for (var direction in Game.map.describeExits(roomName))
                    Colony.memory.exits[roomName][direction] = Game.map.describeExits(roomName)[direction];
            }
            var _loop_7 = function(direction) {
                var exit = Colony.memory.exits[roomName][direction];
                if (Colony.memory.rooms[exit] && Colony.memory.rooms[exit].mrn)
                    return { value: void 0 };
                if (_.filter(scouts, function (c) { return c.memory.targetPosition.roomName == exit; }).length == 0 && shouldSendScout(exit)) {
                    myRoom.mainRoom.spawnManager.addToQueue(['move'], { handledByColony: true, role: 'scout', mainRoomName: null, targetPosition: { x: 25, y: 25, roomName: exit } });
                }
            };
            for (var direction in Colony.memory.exits[roomName]) {
                var state_7 = _loop_7(direction);
                if (typeof state_7 === "object") return state_7.value;
            }
        }
    }
    Colony.createScouts = createScouts;
    function requestCreep() {
    }
    Colony.requestCreep = requestCreep;
    function initialize(memory) {
        if (myMemory['profilerActive']) {
            Colony.createScouts = Colony.profiler.registerFN(Colony.createScouts, 'Colony.createScouts');
            Colony.getRoom = Colony.profiler.registerFN(Colony.getRoom, 'Colony.getRoom');
            Colony.requestCreep = Colony.profiler.registerFN(Colony.requestCreep, 'Colony.requestCreep');
            Colony.spawnCreep = Colony.profiler.registerFN(Colony.spawnCreep, 'Colony.spawnCreep');
            Colony.tick = Colony.profiler.registerFN(Colony.tick, 'Colony.tick');
            Colony.calculateDistances = Colony.profiler.registerFN(Colony.calculateDistances, 'Colony.calculateDistances');
            Colony.getRoom = Colony.profiler.registerFN(Colony.getRoom, 'Colony.getRoom');
            MyCostMatrix.compress = Colony.profiler.registerFN(MyCostMatrix.compress, 'MyCostMatrix.compress');
            MyCostMatrix.decompress = Colony.profiler.registerFN(MyCostMatrix.decompress, 'MyCostMatrix.decompress');
        }
        global.createRoomAssignments = function () { new RoomAssignmentHandler().createSolution(); };
        global.applyRoomAssignments = function () { new RoomAssignmentHandler().applySolution(); };
        _.forEach(myMemory.creeps, function (c) {
            if (c.role == 'sourceCarrier') {
                var newC = c;
                newC.role = 'harvestingCarrier';
                newC.sId = c.sourceId;
            }
        });
        Colony.memory = myMemory['colony'];
        loadRooms();
        Colony.myName = _.map(Game.spawns, function (s) { return s; })[0].owner.username;
        if (memory.rooms == null)
            memory.rooms = {};
        if (memory.mainRooms == null)
            memory.mainRooms = {};
        for (var spawnName in Game.spawns) {
            var spawn = Game.spawns[spawnName];
            break;
        }
        if (spawn != null) {
            var creeps = _.filter(Game.creeps, function (c) { return c.memory.mainRoomName == null && !c.memory.handledByColony; });
            for (var idx in creeps)
                creeps[idx].memory.mainRoomName = spawn.room.name;
        }
        if (!memory.mainRooms)
            memory.mainRooms = {};
        var mainRoomNames = _.uniq(_.map(_.filter(Game.spawns, function (s) { return s.my; }), function (s) { return s.room.name; }));
        for (var idx in mainRoomNames) {
            if (!Colony.claimingManagers[mainRoomNames[idx]]) {
                Colony.mainRooms[mainRoomNames[idx]] = new MainRoom(mainRoomNames[idx]);
            }
        }
        if (memory.claimingManagers != null) {
            for (var idx in memory.claimingManagers) {
                Colony.claimingManagers[memory.claimingManagers[idx].targetPosition.roomName] = new ClaimingManager(memory.claimingManagers[idx].targetPosition);
            }
        }
    }
    Colony.initialize = initialize;
    function calculateDistances(myRoom) {
        if (myRoom == null) {
            if (Game.time % 10 == 0 && Game.cpu.bucket > 2000) {
                var roomNames = _.map(Colony.memory.rooms, function (x) { return x.name; });
                var idx = ~~((Game.time % (roomNames.length * 10)) / 10);
                var myRoom_1 = getRoom(roomNames[idx]);
                calculateDistances(myRoom_1);
            }
        }
        else {
            for (var mainIdx in Colony.mainRooms) {
                var mainRoom = Colony.mainRooms[mainIdx];
                var routeResult = Game.map.findRoute(myRoom.name, mainRoom.name, {
                    routeCallback: function (roomName, fromRoomName) {
                        var myRoom = getRoom(roomName);
                        if (myRoom == null)
                            return 2;
                        else if (myRoom.memory.fR)
                            return 2;
                        else if (myRoom.memory.fO)
                            return Infinity;
                        else
                            return 1;
                    }
                });
                if (routeResult === ERR_NO_PATH)
                    var distance = 9999;
                else
                    var distance = routeResult.length;
                if (myRoom.memory.mrd == null)
                    myRoom.memory.mrd = {};
                myRoom.memory.mrd[mainRoom.name] = { n: mainRoom.name, d: distance };
            }
            var mainRoomCandidates = _.sortBy(_.map(_.filter(myRoom.memory.mrd, function (x) { return x.d <= 1; }), function (y) { return { distance: y.d, mainRoom: Colony.mainRooms[y.n] }; }), function (z) { return [z.distance.toString(), (10 - z.mainRoom.room.controller.level).toString()].join('_'); });
        }
    }
    Colony.calculateDistances = calculateDistances;
    function handleClaimingManagers() {
        var flags = _.filter(Game.flags, function (x) { return x.memory.claim == true && !Colony.mainRooms[x.pos.roomName]; });
        //console.log("Claiming Manager: Found " + flags.length + " flags");
        for (var idx in flags) {
            console.log('Claiming Manager: GCL: ' + Game.gcl.level);
            console.log('Claiming Manager: MainRooms: ' + _.size(Colony.mainRooms));
            console.log('Claiming Manager: ClaimingManagers: ' + _.size(Colony.claimingManagers));
            if (Game.gcl.level > _.size(Colony.mainRooms) + _.size(Colony.claimingManagers)) {
                Colony.claimingManagers[flags[idx].pos.roomName] = new ClaimingManager(flags[idx].pos);
            }
        }
        for (var idx in Colony.claimingManagers) {
            Colony.claimingManagers[idx].tick();
        }
    }
    function loadRooms() {
        //_.forEach(memory.rooms, r => getRoom(r.name));
    }
    Colony.loadRooms = loadRooms;
    function tick() {
        console.log('Colony loop start: ' + Game.cpu.getUsed().toFixed(2));
        console.log('Tick: ' + (++tickCount));
        Colony.memory = myMemory['colony'];
        Colony.memory.createPathTime = 0;
        Colony.memory.pathSliceTime = 0;
        if (Colony.memory.traceThreshold == null)
            Colony.memory.traceThreshold = 2;
        console.log('Colony calculate distances start: ' + Game.cpu.getUsed().toFixed(2));
        calculateDistances();
        handleClaimingManagers();
        console.log('Colony create scouts start: ' + Game.cpu.getUsed().toFixed(2));
        createScouts();
        console.log('Colony main rooms start: ' + Game.cpu.getUsed().toFixed(2));
        _.forEach(_.sortByOrder(_.values(Colony.mainRooms), [function (mainRoom) { return _.any(mainRoom.connectedRooms, function (myRoom) { return _.any(myRoom.mySources, function (s) { return s.hasKeeper; }); }) ? 0 : 1; }, function (mainRoom) { return mainRoom.room.controller.level; }], ['asc', 'desc']), function (mainRoom) {
            //_.forEach(mainRooms, mainRoom=> {
            if (Game.cpu.bucket - Game.cpu.getUsed() > 500)
                mainRoom.tick();
        });
        var creeps = _.filter(Game.creeps, function (c) { return c.memory.handledByColony; });
        for (var idx in creeps) {
            var creep = creeps[idx];
            if (creep.memory.role == 'scout')
                new Scout(creep.name).tick();
        }
        //if ((Game.time % 2000 == 0) && Game.cpu.bucket > 9000 || myMemory['forceReassignment'] == true || myMemory['forceReassignment'] == 'true') {
        //    new RoomAssignmentHandler().createSolution();
        //    myMemory['forceReassignment'] = false;
        //}
        var reserveFlags = _.filter(Game.flags, function (x) { return x.memory.reserve == true; });
        reserveFlags.forEach(function (flag) {
            var myRoom = Colony.getRoom(flag.pos.roomName);
            //console.log('Reserve flag found: ' + flag.name);
            if (myRoom != null && myRoom.mainRoom == null) {
                //console.log('Reserve flag MyRoom: ' + myRoom.name);
                var mainRoom = myRoom.closestMainRoom;
                if (mainRoom) {
                    //console.log('Reserve flag MainRoom: ' + mainRoom.name);
                    if (_.filter(Game.creeps, function (x) { return x.memory.role == 'reserver' && x.memory.targetRoomName == myRoom.name; }).length == 0) {
                        mainRoom.spawnManager.addToQueue(['claim', 'claim', 'move', 'move'], { role: 'reserver', targetRoomName: myRoom.name, mainRoomName: mainRoom.name });
                    }
                }
            }
        });
        var dismantleFlags = _.filter(Game.flags, function (x) { return x.memory.dismantle == true; });
        dismantleFlags.forEach(function (flag) {
            var myRoom = Colony.getRoom(flag.pos.roomName);
            //console.log('Dismantle flag found: ' + flag.name);
            if (myRoom != null) {
                //console.log('Dismantle flag MyRoom: ' + myRoom.name);
                var mainRoom = myRoom.closestMainRoom;
                if (mainRoom) {
                    //console.log('Dismantle flag MainRoom: ' + mainRoom.name);
                    if (_.filter(Game.creeps, function (x) { return x.memory.role == 'dismantler' && x.memory.targetRoomName == myRoom.name; }).length == 0) {
                        mainRoom.spawnManager.addToQueue([WORK, WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], { role: 'dismantler', targetRoomName: myRoom.name, mainRoomName: mainRoom.name });
                    }
                }
            }
            else if (!_.any(Game.creeps, function (c) { return c.memory.role == 'scout' && c.memory.targetPosition && c.memory.targetPosition.roomName == flag.pos.roomName; })) {
                var mainRoom = _.min(Colony.mainRooms, function (mr) { return Game.map.getRoomLinearDistance(flag.pos.roomName, mr.name); });
                mainRoom.spawnManager.addToQueue(['move'], { handledByColony: true, role: 'scout', mainRoomName: null, targetPosition: flag.pos });
            }
        });
        var dismantlers = _.filter(Game.creeps, function (x) { return x.memory.role == 'dismantler'; });
        dismantlers.forEach(function (creep) {
            if (creep.room.name != creep.memory.targetRoomName)
                creep.moveTo(new RoomPosition(25, 25, creep.memory.targetRoomName));
            else {
                var structure = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: function (x) { return x.structureType != STRUCTURE_CONTAINER && x.structureType != STRUCTURE_CONTROLLER && x.structureType != STRUCTURE_KEEPER_LAIR && x.structureType != STRUCTURE_POWER_SPAWN && x.structureType != STRUCTURE_CONTAINER && x.structureType != STRUCTURE_ROAD; } });
                if (structure) {
                    if (!creep.pos.isNearTo(structure))
                        creep.moveTo(structure);
                    else
                        creep.dismantle(structure);
                }
                else {
                    var dismantleFlags_1 = _.filter(Game.flags, function (x) { return x.memory.dismantle == true && x.pos.roomName == creep.memory.targetRoomName; });
                    dismantleFlags_1.forEach(function (x) {
                        x.memory.dismantle = false;
                    });
                }
            }
        });
        try {
            //if (Game.cpu.bucket > 5000)
            Colony.reactionManager.tick();
        }
        catch (e) {
            console.log(e.stack);
        }
        console.log('Create Path time: ' + Colony.memory.createPathTime.toFixed(2) + ', PathSliceTime: ' + Colony.memory.pathSliceTime.toFixed(2));
    }
    Colony.tick = tick;
})(Colony || (Colony = {}));
/// <reference path="./colony/colony.ts" />
/**
 * Singleton object.
 * Since singleton classes are considered anti-pattern in Typescript, we can effectively use namespaces.
 * Namespace's are like internal modules in your Typescript application. Since GameManager doesn't need multiple instances
 * we can use it as singleton.
 */
var GameManager;
(function (GameManager) {
    function globalBootstrap() {
        // Set up your global objects.
        // This method is executed only when Screeps system instantiated new "global".
        // Use this bootstrap wisely. You can cache some of your stuff to save CPU
        // You should extend prototypes before game loop in here.
        console.log('Global reset');
        var startCpu = Game.cpu.getUsed();
        if (!myMemory['colony'])
            myMemory['colony'] = {};
        var colonyMemory = myMemory.colony;
        Colony.initialize(colonyMemory);
        var endCpu = Game.cpu.getUsed();
        console.log('Booting: ' + (endCpu.toFixed(2)));
        console.log();
        console.log('Boot tracers :');
        //for (let idx in Colony.tracers) {
        //    Colony.tracers[idx].print();
        //}
    }
    GameManager.globalBootstrap = globalBootstrap;
    function loop() {
        // Loop code starts here
        // This is executed every tick
        //var a = 1;
        //if (a == 1)
        //    return;
        console.log('Game manager loop start: ' + Game.cpu.getUsed().toFixed(2));
        var startCpu = Game.cpu.getUsed();
        if (Game.time % 100 == 0)
            for (var name in myMemory.creeps) {
                if (!Game.creeps[name]) {
                    delete myMemory.creeps[name];
                }
            }
        if (myMemory['verbose'])
            console.log('MainLoop');
        Colony.tick();
        console.log();
        console.log('Loop tracers :');
        //for (let idx in Colony.tracers) {
        //    Colony.tracers[idx].print();
        //    Colony.tracers[idx].reset();
        //}
        var endCpu = Game.cpu.getUsed();
        console.log('Time: ' + Game.time + ' Measured CPU: ' + (endCpu - startCpu).toFixed(2) + ', CPU: ' + endCpu.toFixed(2) + ' Bucket: ' + Game.cpu.bucket);
        if (myMemory['cpuStat'] == null)
            myMemory['cpuStat'] = [];
        myMemory['cpuStat'].push(endCpu);
        if (myMemory['cpuStat'].length > 100)
            myMemory['cpuStat'].shift();
        console.log('100Avg: ' + (_.sum(myMemory['cpuStat']) / myMemory['cpuStat'].length).toFixed(2) + ' CPU');
    }
    GameManager.loop = loop;
})(GameManager || (GameManager = {}));
/// <reference path="../game-manager.ts" />
var myMemory = Memory;
if (myMemory['profilerActive'])
    var profiler = require('screeps-profiler');
//Object.prototype.getName = function () {
//    var funcNameRegex = /function (.{1,})\(/;
//    var results = (funcNameRegex).exec((this).constructor.toString());
//    return (results && results.length > 1) ? results[1] : "";
//};
/*
* Singleton object. Since GameManager doesn't need multiple instances we can use it as singleton object.
*/
// Any modules that you use that modify the game's prototypes should be require'd 
// before you require the profiler. 
//var myMemory = JSON.parse(RawMemory.get());
try {
    // This line monkey patches the global prototypes. 
    if (myMemory['profilerActive'] == true)
        profiler.enable();
    GameManager.globalBootstrap();
}
catch (e) {
    console.log(e ? e.stack : '');
}
//RawMemory.set(JSON.stringify(myMemory));
// This doesn't look really nice, but Screeps' system expects this method in main.js to run the application.
// If we have this line, we can make sure that globals bootstrap and game loop work.
// http://support.screeps.com/hc/en-us/articles/204825672-New-main-loop-architecture
module.exports.loop = function () {
    var startCPU = Game.cpu.getUsed();
    console.log();
    console.log();
    console.log('Tick Start CPU:' + startCPU.toFixed(2));
    //myMemory = JSON.parse(RawMemory.get());
    myMemory = Memory;
    console.log('Deserialize memory: ' + (Game.cpu.getUsed() - startCPU).toFixed(2));
    if (!myMemory['colony'].active) {
        return;
    }
    try {
        if (myMemory['profilerActive'] == true) {
            profiler.wrap(function () {
                console.log();
                GameManager.loop();
            });
        }
        else {
            console.log();
            GameManager.loop();
        }
    }
    catch (e) {
        console.log(e ? e.stack : '');
    }
    //RawMemory.set(JSON.stringify(myMemory));
};
