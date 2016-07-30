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
        for (var i = 0; i < this.carry; i++)
            body.push(CARRY);
        for (var i = 0; i < this.move; i++)
            body.push(MOVE);
        return body;
    };
    return Body;
}());
var MyCreep = (function () {
    function MyCreep(creep) {
        this.creep = creep;
    }
    Object.defineProperty(MyCreep.prototype, "memory", {
        get: function () { return this.creep.memory; },
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
    Object.defineProperty(MyCreep.prototype, "haveToFlee", {
        get: function () {
            var _this = this;
            var hostileCreeps = _.filter(this.myRoom.hostileScan.allCreeps, function (creep) { return creep.bodyInfo.totalAttackRate > 0; });
            var result = hostileCreeps.length > 0 && _.any(hostileCreeps, function (c) { return c.bodyInfo.totalAttackRate > 20 && new BodyInfo(_this.creep.body).healRate < c.bodyInfo.totalAttackRate && _this.creep.pos.inRangeTo(c.pos, _this.memory.fleeing ? (c.bodyInfo.rangedAttackRate > 0 ? 5 : 3) : (c.bodyInfo.rangedAttackRate > 0 ? 4 : 2)); });
            return result;
        },
        enumerable: true,
        configurable: true
    });
    MyCreep.prototype.moveByPath = function (customPath) {
        if (customPath === void 0) { customPath = null; }
        if (this.creep.memory.myPathMovement == null)
            this.creep.memory.myPathMovement = { movementBlockedCount: 0, lastPos: this.creep.pos };
        var path = customPath || this.memory.path.path;
        if (path.length <= 2)
            return;
        if (RoomPos.isOnEdge(path[0]) && path.length >= 3 && RoomPos.equals(path[2], this.creep.pos)) {
            path.shift();
        }
        if (RoomPos.equals(this.creep.pos, path[1]))
            path.shift();
        if (RoomPos.equals(this.creep.pos, path[0]) && this.creep.fatigue == 0) {
            if (RoomPos.equals(this.creep.memory.myPathMovement.lastPos, this.creep.pos))
                this.creep.memory.myPathMovement.movementBlockedCount++;
            else
                this.creep.memory.myPathMovement.movementBlockedCount = 0;
            if (this.creep.memory.myPathMovement.movementBlockedCount >= 5) {
                this.creep.memory.myPathMovement.movementBlockedCount = 0;
                //this.creep.say('shift');
                path.shift();
            }
            else {
                var direction = this.creep.pos.getDirectionTo(path[1].x, path[1].y);
                this.creep.move(direction);
                this.creep.memory.myPathMovement.lastPos = this.creep.pos;
                return OK;
            }
        }
        else if (!RoomPos.equals(this.creep.pos, path[0]) && this.creep.fatigue == 0) {
            this.creep.moveTo(RoomPos.fromObj(path[0]), { reusePath: 0 });
            if (RoomPos.equals(this.creep.memory.myPathMovement.lastPos, this.creep.pos) && !RoomPos.isOnEdge(this.creep.pos))
                path.shift();
            this.creep.memory.myPathMovement.lastPos = this.creep.pos;
        }
    };
    MyCreep.prototype.flee = function () {
        var _this = this;
        if (this.creep.spawning || _.size(this.myRoom.hostileScan.allCreeps) == 0)
            return;
        var path = PathFinder.search(this.creep.pos, _.map(_.filter(this.myRoom.hostileScan.allCreeps, function (c) { return c.bodyInfo.totalAttackRate > 0; }), function (c) {
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
        if (this.creep.getActiveBodyparts(HEAL) > 0)
            this.creep.heal(this.creep);
    };
    MyCreep.prototype.tick = function () {
        if (this.creep.spawning)
            return;
        if (this.myRoom.mainRoom && this.memory.requiredBoosts != null && _.size(this.memory.requiredBoosts) > 0) {
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
        else if (this.memory.autoFlee && this.haveToFlee) {
            this.creep.say('OH NO!', true);
            this.flee();
        }
        else
            this.myTick();
    };
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
    function SpawnConstructor(creep) {
        _super.call(this, creep);
    }
    Object.defineProperty(SpawnConstructor.prototype, "memory", {
        get: function () { return this.creep.memory; },
        enumerable: true,
        configurable: true
    });
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
        if (MyLink.staticTracer == null) {
            MyLink.staticTracer = new Tracer('MyLink');
            Colony.tracers.push(MyLink.staticTracer);
        }
        //this.tracer = new Tracer('MySource ' + id);
        this.tracer = MyLink.staticTracer;
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
        var trace = this.tracer.start('tick()');
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
        trace.stop();
    };
    return MyLink;
}());
var SpawnManager = (function () {
    function SpawnManager(mainRoom, memory) {
        this.mainRoom = mainRoom;
        this._spawns = { time: 0, spawns: null };
        this.queue = [];
        this.mainRoom = mainRoom;
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
            return _.filter(this.spawns, function (x) { return x.spawning == null; }).length <= this.queue.length;
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
        if (Memory['verbose'] || this.memory.verbose && count > 0)
            console.log('[' + this.mainRoom.name + '] ' + 'SpawnManager.AddToQueue(): ' + memory['role'] + ': ' + count);
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
        if (Memory['verbose'] || this.memory.verbose)
            console.log('[' + this.mainRoom.name + '] ' + 'SpawnManager.spawn(): queue.length is ' + this.queue.length);
        if (Memory['debug'] || this.memory.debug)
            this.memory.queue = JSON.parse(JSON.stringify(this.queue));
        if (this.queue.length == 0) {
            this.isIdle = true;
            return;
        }
        for (var idx in this.spawns) {
            var spawn = this.spawns[idx];
            if (Memory['verbose'] || this.memory.verbose)
                console.log('[' + this.mainRoom.name + '] ' + 'SpawnManager.spawn(): Spawn: ' + spawn.name);
            if (this.queue.length == 0) {
                if (Memory['verbose'] || this.memory.verbose)
                    console.log('[' + this.mainRoom.name + '] ' + 'SpawnManager.spawn(): emptied the queue');
                break;
            }
            var queueItem = this.queue[0];
            if (Memory['verbose'] || this.memory.verbose)
                console.log('[' + this.mainRoom.name + '] ' + 'SpawnManager.spawn(): First item: ' + queueItem.memory['role'] + ': ' + queueItem.body.join(', '));
            // TODO not only try the last queue item
            if (spawn.spawning == null) {
                if (Memory['verbose'] || this.memory.verbose)
                    console.log('[' + this.mainRoom.name + '] ' + 'SpawnManager.spawn(): Spawn is not busy');
                var creepMemory = queueItem.memory;
                if (!creepMemory.mainRoomName)
                    creepMemory.mainRoomName = this.mainRoom.name;
                var result = spawn.createCreep(queueItem.body, null, creepMemory);
                if (Memory['verbose'] || this.memory.verbose)
                    console.log('[' + this.mainRoom.name + '] ' + 'SpawnManager.spawn(): Spawn result: ' + result);
                if (Memory['verbose'] || this.memory.verbose)
                    console.log('[' + this.mainRoom.name + '] ' + 'spawn.createCreepResult: ' + result);
                if (_.isString(result))
                    this.queue.shift();
            }
            else {
                if (Memory['verbose'] || this.memory.verbose)
                    console.log('[' + this.mainRoom.name + '] ' + 'SpawnManager.spawn(): Spawn is busy');
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
    function Builder(creep, mainRoom) {
        _super.call(this, creep);
        this.creep = creep;
        this.mainRoom = mainRoom;
        this.memory.autoFlee = true;
        this.target = Game.getObjectById(this.memory.targetId);
        if (this.target != null) {
            this.targetPosition = this.target.pos;
            this.memory.targetPosition = this.targetPosition;
        }
        else if (this.creep.memory.targetPosition != null) {
            this.targetPosition = new RoomPosition(this.memory.targetPosition.x, this.memory.targetPosition.y, this.memory.targetPosition.roomName);
            if (Game.rooms[this.targetPosition.roomName] != null) {
                this.targetPosition = null;
                this.target = null;
                this.memory.targetId = null;
                this.memory.targetPosition = null;
            }
        }
    }
    Object.defineProperty(Builder.prototype, "memory", {
        get: function () { return this.creep.memory; },
        enumerable: true,
        configurable: true
    });
    Builder.prototype.construct = function () {
        if (this.target != null) {
            if (this.creep.pos.x == 0 || this.creep.pos.x == 49 || this.creep.pos.y == 0 || this.creep.pos.y == 49)
                this.creep.moveTo(this.target);
            else {
                var result = this.creep.build(this.target);
                if (result == ERR_RCL_NOT_ENOUGH)
                    this.target.remove();
                else if (result == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(this.target);
            }
        }
        else {
            this.creep.moveTo(this.targetPosition);
        }
    };
    Builder.prototype.upgrade = function () {
        if (this.mainRoom.room.controller.level == 8) {
            if (this.mainRoom.spawns[0].recycleCreep(this.creep) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.mainRoom.spawns[0]);
        }
        else {
            if (this.creep.upgradeController(this.mainRoom.room.controller) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.mainRoom.room.controller);
        }
    };
    Builder.prototype.myTick = function () {
        var _this = this;
        if (this.creep.carry.energy > 0) {
            if (this.targetPosition != null && this.mainRoom.room.controller.ticksToDowngrade >= 1000)
                this.construct();
            else
                this.upgrade();
        }
        else {
            this.memory.targetId = null;
            this.memory.targetPosition = null;
            if (this.mainRoom == null)
                return;
            var mainContainer;
            if (Game.cpu.bucket > 5000)
                mainContainer = this.creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: function (x) { return (x.structureType == STRUCTURE_CONTAINER || x.structureType == STRUCTURE_STORAGE) && x.store.energy >= _this.creep.carryCapacity; } });
            if (mainContainer == null)
                mainContainer = this.mainRoom.mainContainer;
            if (mainContainer != null) {
                //this.creep.say('Main');
                if (!this.mainRoom.mainContainer || mainContainer.store.energy > this.mainRoom.maxSpawnEnergy || this.mainRoom.mainContainer && mainContainer.id != this.mainRoom.mainContainer.id)
                    if (mainContainer.transfer(this.creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(mainContainer);
            }
            else {
                //this.creep.say('NoMain');
                if (this.mainRoom.spawnManager.isIdle) {
                    var spawn = this.mainRoom.room.find(FIND_MY_SPAWNS)[0];
                    if (spawn.transferEnergy(this.creep) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(spawn);
                }
            }
        }
    };
    return Builder;
}(MyCreep));
var Manager = (function () {
    function Manager(tracer) {
        this.tracer = tracer;
    }
    Manager.prototype.preTick = function () {
        var trace = this.tracer.start('preTick()');
        this._preTick();
        trace.stop();
    };
    Manager.prototype._preTick = function () {
    };
    Manager.prototype.tick = function () {
        var trace = this.tracer.start('tick()');
        this._tick();
        trace.stop();
    };
    Manager.prototype._tick = function () {
    };
    Manager.prototype.postTick = function () {
        var trace = this.tracer.start('postTick()');
        this._postTick();
        trace.stop();
    };
    Manager.prototype._postTick = function () {
    };
    return Manager;
}());
/// <reference path="../creeps/constructor/constructorDefinition.ts" />
/// <reference path="../creeps/constructor/builder.ts" />
/// <reference path="./manager.ts" />
var ConstructionManager = (function (_super) {
    __extends(ConstructionManager, _super);
    function ConstructionManager(mainRoom) {
        _super.call(this, ConstructionManager.staticTracer);
        this.mainRoom = mainRoom;
        this._constructions = { time: -11, constructions: [] };
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
    Object.defineProperty(ConstructionManager, "staticTracer", {
        get: function () {
            if (ConstructionManager._staticTracer == null) {
                ConstructionManager._staticTracer = new Tracer('ConstructionManager');
                Colony.tracers.push(ConstructionManager._staticTracer);
            }
            return ConstructionManager._staticTracer;
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
    ConstructionManager.prototype._preTick = function () {
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
                var maxCreeps = Math.min(this.creeps.length + 1, 5);
            else
                maxCreeps = this.maxCreeps;
            this.mainRoom.spawnManager.addToQueue(ConstructorDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'builder', targetId: null, targetPosition: null }, Math.max(maxCreeps, _.size(_.filter(this.mainRoom.sources, function (x) { return !x.hasKeeper; }))) - this.creeps.length);
        }
    };
    ConstructionManager.prototype._tick = function () {
        var _this = this;
        try {
            this.creeps.forEach(function (c) { return new Builder(c, _this.mainRoom).tick(); });
        }
        catch (e) {
            console.log(e.stack);
        }
        ;
    };
    return ConstructionManager;
}(Manager));
var RepairerDefinition;
(function (RepairerDefinition) {
    function getDefinition(maxEnergy) {
        var body = new Body();
        var remainingEnergy = Math.min(maxEnergy, 800);
        if (remainingEnergy < 400) {
            body.work = 1;
            body.carry = 2;
            body.move = 2;
        }
        else {
            var basicModulesCount = ~~(remainingEnergy / 400); //work,carry,carry,move,move
            if (basicModulesCount > 5)
                basicModulesCount = 5;
            body.work = 2 * basicModulesCount;
            body.carry = 2 * basicModulesCount;
            body.move = 2 * basicModulesCount;
            var remaining = remainingEnergy - 400 * basicModulesCount;
            while (remaining >= 100) {
                if (remaining >= 200) {
                    body.work++;
                    body.carry++;
                    ;
                    body.move++;
                    ;
                    remaining -= 200;
                }
                else if (remaining >= 100) {
                    body.carry++;
                    body.move++;
                    remaining -= 100;
                }
                else
                    break;
            }
        }
        return body;
    }
    RepairerDefinition.getDefinition = getDefinition;
})(RepairerDefinition || (RepairerDefinition = {}));
/// <reference path="../myCreep.ts" />
var Repairer = (function (_super) {
    __extends(Repairer, _super);
    function Repairer(creep, mainRoom) {
        _super.call(this, creep);
        this.creep = creep;
        this.mainRoom = mainRoom;
        this.memory.autoFlee = true;
        if (Repairer.staticTracer == null) {
            Repairer.staticTracer = new Tracer('Repairer');
            Colony.tracers.push(Repairer.staticTracer);
        }
        this.tracer = Repairer.staticTracer;
    }
    Object.defineProperty(Repairer.prototype, "memory", {
        get: function () { return this.creep.memory; },
        enumerable: true,
        configurable: true
    });
    Repairer.prototype.getEmergencyTarget = function () {
        var _this = this;
        var myRoom = Colony.getRoom(this.creep.room.name);
        if (myRoom)
            var target = _.sortBy(myRoom.emergencyRepairStructures, function (x) { return Math.pow((x.pos.x - _this.creep.pos.x), 2) + Math.pow((x.pos.y - _this.creep.pos.y), 2); })[0];
        return target;
    };
    Repairer.prototype.pickUpEnergy = function () {
        var _this = this;
        var trace = this.tracer.start('pickupEnergy()');
        var resources = _.filter(Colony.getRoom(this.creep.room.name).resourceDrops, function (r) { return r.resourceType == RESOURCE_ENERGY; });
        var energy = _.sortBy(_.filter(resources, function (r) { return r.pos.inRangeTo(_this.creep.pos, 4); }), function (r) { return r.pos.getRangeTo(_this.creep.pos); })[0];
        if (energy != null) {
            if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(energy);
            trace.stop();
            return true;
        }
        trace.stop();
        return false;
    };
    Repairer.prototype.getTarget = function (myRoom) {
        var _this = this;
        if (this.memory.targetCheckTime != null && this.memory.targetCheckTime + 20 > Game.time) {
            return;
        }
        this.memory.targetCheckTime = Game.time;
        var trace = this.tracer.start('getTarget()');
        var sortedStructures = _.sortBy(myRoom.repairStructures, function (x) { return Math.pow((x.pos.x - _this.creep.pos.x), 2) + Math.pow((x.pos.y - _this.creep.pos.y), 2); });
        var target = _.filter(sortedStructures, RepairManager.targetDelegate)[0];
        //target = this.creep.pos.findClosestByRange<Structure>(FIND_STRUCTURES, { filter: RepairManager.targetDelegate });
        if (target) {
            this.memory.targetId = target.id;
            this.memory.isEmergency = false;
        }
        else {
            //target = this.creep.pos.findClosestByRange<Structure>(FIND_STRUCTURES, { filter: (x: Structure) => !RepairManager.forceStopRepairDelegate(x) && x.hits < x.hitsMax });
            target = _.sortBy(_.filter(myRoom.repairStructures, function (s) { return !RepairManager.forceStopRepairDelegate(s) && (s.structureType == STRUCTURE_WALL || s.structureType == STRUCTURE_RAMPART); }), function (x) { return x.hits; })[0];
            //target = _.sortBy(this.creep.room.find<Structure>(FIND_STRUCTURES, { filter: (x: Structure) => !RepairManager.forceStopRepairDelegate(x) && (x.structureType == STRUCTURE_WALL || x.structureType == STRUCTURE_RAMPART) }), x => x.hits)[0];
            if (target) {
                this.memory.targetId = target.id;
                this.memory.isEmergency = false;
            }
            else {
                target = sortedStructures[0];
                //target = this.creep.pos.findClosestByPath<Structure>(FIND_STRUCTURES, { filter: (x: Structure) => x.hits < x.hitsMax });
                if (target) {
                    this.memory.targetId = target.id;
                    this.memory.isEmergency = false;
                }
            }
        }
        trace.stop();
        return target;
    };
    Repairer.prototype.myTick = function () {
        var myRoom = Colony.getRoom(this.creep.room.name);
        if (this.creep.room.name == this.memory.roomName && (this.creep.pos.x == 0 || this.creep.pos.x == 49 || this.creep.pos.y == 0 || this.creep.pos.y == 49)) {
            if (this.creep.pos.x == 0)
                this.creep.move(RIGHT);
            else if (this.creep.pos.x == 49)
                this.creep.move(LEFT);
            else if (this.creep.pos.y == 0)
                this.creep.move(BOTTOM);
            else if (this.creep.pos.y == 49)
                this.creep.move(TOP);
        }
        else {
            if (this.memory.state == 1 /* Repairing */ && this.creep.carry.energy == 0) {
                this.memory.state = 0 /* Refilling */;
                this.memory.fillupContainerId = null;
                this.memory.targetId = null;
            }
            else if (this.memory.state == 0 /* Refilling */ && this.creep.carry.energy == this.creep.carryCapacity)
                this.memory.state = 1 /* Repairing */;
            if (this.memory.state == 1 /* Repairing */) {
                if (this.creep.room.name != this.memory.roomName) {
                    this.creep.moveTo(new RoomPosition(25, 25, this.memory.roomName));
                }
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
                        if (!this.creep.pos.isNearTo(structure))
                            this.creep.moveTo(structure);
                        this.creep.repair(structure);
                        if (this.memory.isEmergency && RepairManager.emergencyStopDelegate(structure))
                            this.memory.isEmergency = false;
                        if (RepairManager.forceStopRepairDelegate(structure) || this.memory.isEmergency == false && this.getEmergencyTarget() != null)
                            this.memory.targetId = null;
                    }
                }
            }
            else {
                if (this.memory.fillupContainerId == null) {
                    var container_1 = null;
                    container_1 = this.mainRoom.mainContainer;
                    if (container_1 != null) {
                        this.memory.fillupContainerId = container_1.id;
                    }
                }
                var container = Game.getObjectById(this.memory.fillupContainerId);
                if (container == null)
                    this.memory.fillupContainerId = null;
                else if (container.store.energy > 0) {
                    if (this.creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(container);
                }
            }
        }
    };
    return Repairer;
}(MyCreep));
/// <reference path="../creeps/repairer/repairerDefinition.ts" />
/// <reference path="../creeps/repairer/repairer.ts" />
/// <reference path="./manager.ts" />
var RepairManager = (function (_super) {
    __extends(RepairManager, _super);
    function RepairManager(mainRoom) {
        _super.call(this, RepairManager.staticTracer);
        this.mainRoom = mainRoom;
        this._creeps = { time: 0, creeps: null };
        this._idleCreeps = { time: 0, creeps: null };
        this.maxCreeps = 2;
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
        return s.hits >= s.hitsMax || s.hits > 2000000;
        //return (s.structureType == STRUCTURE_WALL || s.structureType == STRUCTURE_RAMPART) && s.hits > 600000 || (s.hits >= s.hitsMax);
    };
    RepairManager.targetDelegate = function (s) {
        return (s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_WALL && s.hits < 0.5 * s.hitsMax || (s.structureType == STRUCTURE_RAMPART || s.structureType == STRUCTURE_WALL) && s.hits < 500000) && s.hits < s.hitsMax;
    };
    RepairManager.emergencyTargetDelegate = function (s) {
        return (s.hits < s.hitsMax * 0.2 && s.structureType == STRUCTURE_CONTAINER || s.hits < 1000 && s.structureType == STRUCTURE_ROAD || s.structureType == STRUCTURE_RAMPART && s.hits < 5000) && s.hits < s.hitsMax;
    };
    RepairManager.emergencyStopDelegate = function (s) {
        return ((s.structureType == STRUCTURE_WALL || s.structureType == STRUCTURE_RAMPART) && s.hits > 20000 || s.hits >= s.hitsMax && s.structureType == STRUCTURE_ROAD || s.hits > 0.5 * s.hitsMax && s.structureType == STRUCTURE_CONTAINER) || s.hits >= s.hitsMax;
    };
    Object.defineProperty(RepairManager, "staticTracer", {
        get: function () {
            if (RepairManager._staticTracer == null) {
                RepairManager._staticTracer = new Tracer('RepairManager');
                Colony.tracers.push(RepairManager._staticTracer);
            }
            return RepairManager._staticTracer;
        },
        enumerable: true,
        configurable: true
    });
    RepairManager.prototype._preTick = function () {
        if (this.mainRoom.spawnManager.isBusy || !this.mainRoom.mainContainer)
            return;
        var _loop_3 = function(idx) {
            var myRoom = this_2.mainRoom.allRooms[idx];
            if (myRoom.name == myRoom.mainRoom.name || myRoom.room && _.filter(myRoom.repairStructures, function (s) { return RepairManager.targetDelegate(s); }).length > 0) {
                var roomCreeps = _.filter(this_2.creeps, function (x) { return x.memory.roomName == myRoom.name; });
                if (roomCreeps.length < (myRoom.name == this_2.mainRoom.name ? Math.min(1, _.size(this_2.mainRoom.sources)) : 1)) {
                    var definition = (myRoom.name == myRoom.mainRoom.name) ? RepairerDefinition.getDefinition(this_2.mainRoom.maxSpawnEnergy).getBody() : [WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
                    this_2.mainRoom.spawnManager.addToQueue(definition, { role: 'repairer', roomName: myRoom.name, state: 0 /* Refilling */ }, 1);
                }
            }
        };
        var this_2 = this;
        for (var idx in this.mainRoom.allRooms) {
            _loop_3(idx);
        }
    };
    RepairManager.prototype._tick = function () {
        var _this = this;
        this.creeps.forEach(function (c) { return new Repairer(c, _this.mainRoom).tick(); });
    };
    return RepairManager;
}(Manager));
var UpgraderDefinition;
(function (UpgraderDefinition) {
    function getDefinition(maxEnergy, minCarry, maxWorkParts) {
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
        return body;
    }
    UpgraderDefinition.getDefinition = getDefinition;
})(UpgraderDefinition || (UpgraderDefinition = {}));
var Upgrader = (function () {
    function Upgrader(creep, mainRoom) {
        this.creep = creep;
        this.mainRoom = mainRoom;
    }
    Upgrader.prototype.upgrade = function () {
        var result = this.creep.upgradeController(this.creep.room.controller);
        //this.creep.say(result.toString());
        if (result == ERR_NOT_IN_RANGE)
            this.creep.moveTo(this.creep.room.controller);
    };
    Upgrader.prototype.tick = function () {
        var _this = this;
        if (this.creep.carry.energy >= _.sum(this.creep.body, function (x) { return x.type == WORK ? 1 : 0; })) {
            this.upgrade();
        }
        else if (!this.mainRoom.mainContainer || this.mainRoom.mainContainer.structureType != STRUCTURE_STORAGE || this.mainRoom.mainContainer.store.energy > 10000 || this.mainRoom.room.controller.ticksToDowngrade <= 5000) {
            if (!this.mainRoom)
                return;
            var resources = _.filter(Colony.getRoom(this.creep.room.name).resourceDrops, function (r) { return r.resourceType == RESOURCE_ENERGY; });
            var energy = _.filter(resources, function (r) { return Math.pow((r.pos.x - _this.creep.pos.x), 2) + Math.pow((r.pos.y - _this.creep.pos.y), 2) <= 1; })[0];
            if (energy != null && this.creep.carry.energy < this.creep.carryCapacity) {
                this.creep.pickup(energy);
            }
            else {
                var link = _.map(_.filter(this.mainRoom.links, function (x) { return x.nearController == true; }), function (x) { return x.link; })[0];
                if (link) {
                    if (link.transferEnergy(this.creep) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(link);
                }
                else {
                    var mainContainer = this.mainRoom.mainContainer;
                    if (mainContainer != null) {
                        if (mainContainer.store.energy > this.mainRoom.maxSpawnEnergy * 2)
                            if (this.creep.withdraw(mainContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                                this.creep.moveTo(mainContainer);
                    }
                    else {
                        if (this.mainRoom.spawnManager.isIdle) {
                            for (var spawnName in Game.spawns) {
                                var spawn = Game.spawns[spawnName];
                            }
                            if (spawn.transferEnergy(this.creep) == ERR_NOT_IN_RANGE)
                                this.creep.moveTo(spawn);
                        }
                    }
                }
            }
        }
    };
    return Upgrader;
}());
/// <reference path="../creeps/upgrader/upgraderDefinition.ts" />
/// <reference path="../creeps/upgrader/upgrader.ts" />
/// <reference path="./manager.ts" />
var UpgradeManager = (function (_super) {
    __extends(UpgradeManager, _super);
    function UpgradeManager(mainRoom) {
        _super.call(this, UpgradeManager.staticTracer);
        this.mainRoom = mainRoom;
        this._creeps = { time: 0, creeps: null };
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
    Object.defineProperty(UpgradeManager, "staticTracer", {
        get: function () {
            if (UpgradeManager._staticTracer == null) {
                UpgradeManager._staticTracer = new Tracer('UpgradeManager');
                Colony.tracers.push(UpgradeManager._staticTracer);
            }
            return UpgradeManager._staticTracer;
        },
        enumerable: true,
        configurable: true
    });
    UpgradeManager.prototype._preTick = function () {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if (this.mainRoom.mainContainer != null && this.mainRoom.room.energyAvailable == this.mainRoom.room.energyCapacityAvailable && this.mainRoom.spawnManager.queue.length < 1 && (this.creeps.length < 1 || (this.mainRoom.mainContainer.store.energy == this.mainRoom.mainContainer.storeCapacity || this.mainRoom.mainContainer.store.energy > 300000 || this.mainRoom.mainContainer.store.energy > 50000 && this.mainRoom.room.controller.level < 6) && this.creeps.length < 5 && this.mainRoom.room.controller.level < 8)) {
            this.mainRoom.spawnManager.addToQueue(UpgraderDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, _.any(this.mainRoom.links, function (x) { return x.nearController; }), this.mainRoom.room.controller.level == 8 ? 15 : 50).getBody(), { role: 'upgrader' }, 1);
        }
    };
    UpgradeManager.prototype._tick = function () {
        var _this = this;
        this.creeps.forEach(function (c) { return new Upgrader(c, _this.mainRoom).tick(); });
    };
    return UpgradeManager;
}(Manager));
var SpawnFillerDefinition;
(function (SpawnFillerDefinition) {
    function getDefinition(maxEnergy) {
        var body = new Body();
        var remainingEnergy = Math.min(maxEnergy, 1200);
        var basicModuleCount = ~~(remainingEnergy / 150);
        basicModuleCount = (basicModuleCount > 8) ? 8 : basicModuleCount;
        body.carry = 2 * basicModuleCount;
        body.move = 1 * basicModuleCount;
        return body;
    }
    SpawnFillerDefinition.getDefinition = getDefinition;
})(SpawnFillerDefinition || (SpawnFillerDefinition = {}));
var SpawnFiller = (function () {
    function SpawnFiller(creep, mainRoom) {
        this.creep = creep;
        this.mainRoom = mainRoom;
    }
    SpawnFiller.prototype.refill = function () {
        if (!this.mainRoom)
            return;
        //let resources = _.filter(Colony.getRoom(this.creep.room.name).resourceDrops, r => r.resourceType == RESOURCE_ENERGY);
        //let energy = _.filter(resources, r => (r.pos.x - this.creep.pos.x) ** 2 + (r.pos.y - this.creep.pos.y) ** 2 <= 16)[0];
        //if (energy != null && this.creep.carry.energy < this.creep.carryCapacity) {
        //    if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
        //        this.creep.moveTo(energy);
        //}
        //else {
        var mainContainer = this.mainRoom.mainContainer;
        if (mainContainer != null && mainContainer.store.energy > 0) {
            if (mainContainer.transfer(this.creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(mainContainer);
        }
        else if (this.mainRoom.room.terminal && this.mainRoom.room.terminal.store.energy > 0) {
            if (this.mainRoom.room.terminal.transfer(this.creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.mainRoom.room.terminal);
        }
        //}
    };
    SpawnFiller.prototype.tick = function () {
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
        else {
            if (this.creep.carry.energy == 0) {
                this.refill();
            }
            else {
                var target = this.creep.pos.findClosestByPath(FIND_MY_STRUCTURES, { filter: function (s) { return (s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_EXTENSION) && s.energy < s.energyCapacity; } });
                if (target == null)
                    this.refill();
                else {
                    if (this.creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(target);
                }
            }
        }
    };
    return SpawnFiller;
}());
/// <reference path="../creeps/spawnFiller/spawnFillerDefinition.ts" />
/// <reference path="../creeps/spawnFiller/spawnFiller.ts" />
/// <reference path="./manager.ts" />
var SpawnFillManager = (function (_super) {
    __extends(SpawnFillManager, _super);
    function SpawnFillManager(mainRoom) {
        _super.call(this, SpawnFillManager.staticTracer);
        this.mainRoom = mainRoom;
        this._creeps = { time: 0, creeps: null };
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
    Object.defineProperty(SpawnFillManager, "staticTracer", {
        get: function () {
            if (SpawnFillManager._staticTracer == null) {
                SpawnFillManager._staticTracer = new Tracer('SpawnFillManager');
                Colony.tracers.push(SpawnFillManager._staticTracer);
            }
            return SpawnFillManager._staticTracer;
        },
        enumerable: true,
        configurable: true
    });
    SpawnFillManager.prototype._preTick = function () {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if (this.mainRoom.mainContainer != null && _.size(_.filter(this.mainRoom.creeps, function (c) { return c.memory.role == 'spawnFiller' && (c.ticksToLive > 70 || c.ticksToLive === undefined); })) < 2) {
            this.mainRoom.spawnManager.addToQueue(SpawnFillerDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'spawnFiller' }, 1, true);
        }
    };
    SpawnFillManager.prototype._tick = function () {
        var _this = this;
        this.creeps.forEach(function (c) { return new SpawnFiller(c, _this.mainRoom).tick(); });
    };
    return SpawnFillManager;
}(Manager));
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
            body.work = Math.ceil(body.work / count);
            body.carry = Math.ceil(body.carry / count);
            body.move = Math.ceil(body.move / count);
        }
        if (body.costs + BODYPART_COST.carry + BODYPART_COST.move <= maxEnergy) {
            body.move++;
            body.carry++;
        }
        return { count: Math.min(mySource.maxHarvestingSpots, count), body: body };
    }
    function getMinerDefinition(maxEnergy, mySource, resources) {
        var baseBody = new Body();
        if (mySource.link)
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
            workBody.work = Math.ceil(workBody.work / count);
            workBody.move = Math.ceil(workBody.work / 2);
            _.forEach(workBody.boosts, function (b) { return b.amount = Math.min(b.amount, workBody.work); });
        }
        workBody.move += baseBody.move;
        workBody.heal += baseBody.heal;
        workBody.carry += baseBody.carry;
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
    function EnergyHarvester(creep, mainRoom) {
        _super.call(this, creep);
        this.creep = creep;
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
        this.memory.autoFlee = true;
        if (EnergyHarvester.staticTracer == null) {
            EnergyHarvester.staticTracer = new Tracer('Harvester');
        }
        this.tracer = EnergyHarvester.staticTracer;
    }
    Object.defineProperty(EnergyHarvester.prototype, "memory", {
        get: function () { return this.creep.memory; },
        enumerable: true,
        configurable: true
    });
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
        this.memory.path = PathFinder.search(this.creep.pos, { pos: this.mySource.pos, range: 5 }, { roomCallback: Colony.getTravelMatrix, plainCost: 2, swampCost: 10 });
        this.memory.path.path.unshift(this.creep.pos);
    };
    EnergyHarvester.prototype.myTick = function () {
        var trace = this.tracer.start('tick()');
        this.healed = false;
        if (this.mySource == null)
            this.reassignMainRoom();
        if (!this.mySource) {
            trace.stop();
            return;
        }
        if (this.creep.getActiveBodyparts(HEAL) > 0 && this.creep.hits + this.creep.getActiveBodyparts(HEAL) * HEAL_POWER <= this.creep.hitsMax) {
            this.creep.heal(this.creep);
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
            this.createHarvestPath();
            this.memory.state = 0 /* Harvesting */;
        }
        else if (this.memory.state == 0 /* Harvesting */ && _.sum(this.creep.carry) == this.creep.carryCapacity && !this.mySource.link && this.mainRoom.harvestersShouldDeliver) {
            if (!this.mainRoom.energyDropOffStructure) {
                trace.stop();
                return;
            }
            this.memory.path = PathFinder.search(this.creep.pos, { pos: this.mainRoom.energyDropOffStructure.pos, range: 2 }, { roomCallback: Colony.getTravelMatrix, plainCost: 2, swampCost: 10 });
            this.memory.state = 1 /* Delivering */;
        }
        if (this.memory.state == 0 /* Harvesting */) {
            if (this.memory.path && this.memory.path.path.length > 2)
                this.moveByPath();
            else if (this.creep.room.name != this.mySource.myRoom.name) {
                this.createHarvestPath();
                this.moveByPath();
            }
            else if (!this.healed) {
                if (this.creep.harvest(this.mySource.source) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(this.mySource.source);
                if (this.creep.carry.energy > this.creep.carryCapacity - _.filter(this.creep.body, function (b) { return b.type == WORK; }).length * 2) {
                    if (this.mySource.link) {
                        if (this.creep.transfer(this.mySource.link, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                            this.creep.moveTo(this.mySource.link);
                    }
                    else if (this.mainRoom.harvestersShouldDeliver) {
                        if (this.memory.path == null) {
                            this.memory.path = PathFinder.search(this.creep.pos, { pos: this.mainRoom.mainContainer.pos, range: 5 }, { roomCallback: Colony.getTravelMatrix, plainCost: 2, swampCost: 10 });
                            this.memory.path.path.unshift(this.creep.pos);
                        }
                        if (this.memory.path && this.memory.path.path.length > 2)
                            this.moveByPath();
                        else if (this.creep.transfer(this.mainRoom.energyDropOffStructure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                            this.creep.moveTo(this.mainRoom.energyDropOffStructure);
                    }
                }
            }
            else if (this.healed && !this.mySource.pos.isNearTo(this.creep.pos))
                this.creep.moveTo(this.mySource.pos);
        }
        else if (this.memory.state == 1 /* Delivering */) {
            if (this.memory.path && this.memory.path.path.length > 2)
                this.moveByPath();
            else {
                if (this.creep.transfer(this.mainRoom.energyDropOffStructure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(this.mainRoom.energyDropOffStructure);
            }
        }
        trace.stop();
    };
    return EnergyHarvester;
}(MyCreep));
var SourceCarrierDefinition;
(function (SourceCarrierDefinition) {
    function getDefinition(maxEnergy, requiredAmount, resources) {
        var body = new Body();
        body.carry = requiredAmount / CARRY_CAPACITY;
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
    function SourceCarrier(creep, mainRoom) {
        _super.call(this, creep);
        this.creep = creep;
        this.mainRoom = mainRoom;
        this._source = { time: 0, source: null };
        this.memory.autoFlee = true;
        if (SourceCarrier.staticTracer == null) {
            SourceCarrier.staticTracer = new Tracer('SourceCarrier');
        }
        this.tracer = SourceCarrier.staticTracer;
    }
    Object.defineProperty(SourceCarrier.prototype, "memory", {
        get: function () { return this.creep.memory; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SourceCarrier.prototype, "source", {
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
    SourceCarrier.prototype.pickUpEnergy = function (range) {
        var _this = this;
        if (range === void 0) { range = 1; }
        var resources = _.filter(Colony.getRoom(this.creep.room.name).resourceDrops, function (r) { return r.resourceType == RESOURCE_ENERGY; });
        var energy = _.filter(resources, function (r) { return r.pos.inRangeTo(_this.creep.pos, range); })[0];
        if (energy != null) {
            if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(energy);
            return true;
        }
        return false;
    };
    SourceCarrier.prototype.myTick = function () {
        var trace = this.tracer.start('tick()');
        if (this.creep.spawning) {
            trace.stop();
            return;
        }
        if (!this.mySource)
            this.reassignMainRoom();
        if (!this.mySource) {
            trace.stop();
            return;
        }
        if (this.memory.state == null || this.memory.state == 1 /* Deliver */ && this.creep.carry.energy == 0) {
            this.memory.path = PathFinder.search(this.creep.pos, { pos: this.mySource.pos, range: 3 }, { roomCallback: Colony.getTravelMatrix, plainCost: 2, swampCost: 2 });
            this.memory.path.path.unshift(this.creep.pos);
            this.memory.state = 0 /* Pickup */;
        }
        else if (this.memory.state == 0 /* Pickup */ && _.sum(this.creep.carry) == this.creep.carryCapacity) {
            this.memory.path = PathFinder.search(this.creep.pos, { pos: this.mainRoom.energyDropOffStructure.pos, range: 3 }, { roomCallback: Colony.getTravelMatrix, plainCost: 2, swampCost: 10 });
            this.memory.path.path.unshift(this.creep.pos);
            this.memory.state = 1 /* Deliver */;
        }
        if (this.memory.state == 0 /* Pickup */) {
            if (!this.pickUpEnergy()) {
                if (this.memory.path.path.length > 2) {
                    this.moveByPath();
                }
                else if (this.creep.room.name != this.mySource.pos.roomName || !this.creep.pos.inRangeTo(this.mySource.pos, 2))
                    this.creep.moveTo(this.mySource.pos);
                else {
                    this.pickUpEnergy(4);
                }
            }
        }
        else if (this.memory.state == 1 /* Deliver */) {
            if (!this.mainRoom) {
                trace.stop();
                return;
            }
            if (!this.mainRoom.energyDropOffStructure) {
                trace.stop();
                return;
            }
            if (this.memory.path.path.length > 2) {
                this.moveByPath();
            }
            else {
                if (this.creep.transfer(this.mainRoom.energyDropOffStructure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(this.mainRoom.energyDropOffStructure);
            }
        }
        trace.stop();
        //if (this.creep.carry.energy < this.creep.carryCapacity && !(this.creep.carry.energy > this.creep.carryCapacity / 2 && this.creep.room.name == this.mainRoom.name))
        //    this.pickUpNew();
        //else
        //    this.deliverNew();
    };
    return SourceCarrier;
}(MyCreep));
/// <reference path="../creeps/energyHarvester/energyHarvesterDefinition.ts" />
/// <reference path="../creeps/energyHarvester/energyHarvester.ts" />
/// <reference path="../creeps/sourceCarrier/sourceCarrierDefinition.ts" />
/// <reference path="../creeps/sourceCarrier/sourceCarrier.ts" />
/// <reference path="./manager.ts" />
var EnergyHarvestingManager = (function (_super) {
    __extends(EnergyHarvestingManager, _super);
    function EnergyHarvestingManager(mainRoom) {
        _super.call(this, EnergyHarvestingManager.staticTracer);
        this.mainRoom = mainRoom;
        this._harvesterCreeps = { time: -1, creeps: null };
        this._sourceCarrierCreeps = { time: -1, creeps: null };
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
    Object.defineProperty(EnergyHarvestingManager.prototype, "harvesterCreeps", {
        get: function () {
            if (this._harvesterCreeps.time < Game.time)
                this._harvesterCreeps = {
                    time: Game.time, creeps: this.mainRoom.creepsByRole('harvester')
                };
            return this._harvesterCreeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EnergyHarvestingManager.prototype, "sourceCarrierCreeps", {
        get: function () {
            if (this._sourceCarrierCreeps.time < Game.time)
                this._sourceCarrierCreeps = {
                    time: Game.time, creeps: this.mainRoom.creepsByRole('sourceCarrier')
                };
            return this._sourceCarrierCreeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EnergyHarvestingManager, "staticTracer", {
        get: function () {
            if (EnergyHarvestingManager._staticTracer == null) {
                EnergyHarvestingManager._staticTracer = new Tracer('EnergyHarvestingManager');
                Colony.tracers.push(EnergyHarvestingManager._staticTracer);
            }
            return EnergyHarvestingManager._staticTracer;
        },
        enumerable: true,
        configurable: true
    });
    //public placeSourceContainers() {
    //    try {
    //        if (Game.time % 50 != 0)
    //            return;
    //        if (this.mainRoom.mainContainer)
    //            for (var idx in this.mainRoom.sources) {
    //                var sourceInfo = this.mainRoom.sources[idx];
    //                if (sourceInfo.hasKeeper || !sourceInfo.myRoom.canHarvest)
    //                    continue;
    //                if (!sourceInfo.hasKeeper && sourceInfo.containerMissing) {
    //                    var path = sourceInfo.pos.findPathTo(this.mainRoom.mainContainer.pos, { ignoreCreeps: true });
    //                    var containerPosition = new RoomPosition(path[0].x, path[0].y, sourceInfo.pos.roomName);
    //                    containerPosition.createConstructionSite(STRUCTURE_CONTAINER);
    //                }
    //            }
    //    }
    //    catch (e) {
    //        console.log(e.stack);
    //    }
    //}
    EnergyHarvestingManager.prototype.getHarvesterBodyAndCount = function (sourceInfo, noLocalRestriction) {
        if (noLocalRestriction === void 0) { noLocalRestriction = false; }
        var trace = this.tracer.start('getHarvesterBodyAndCount()');
        var maxSpawnEnergy = noLocalRestriction ? _.max(_.values(Colony.mainRooms), function (x) { return x.maxSpawnEnergy; }).maxSpawnEnergy : this.mainRoom.maxSpawnEnergy;
        var result = EnergyHarvesterDefinition.getDefinition(maxSpawnEnergy, sourceInfo, this.mainRoom.harvestersShouldDeliver, this.mainRoom.managers.labManager.availablePublishResources);
        return result;
    };
    EnergyHarvestingManager.prototype.getSourceCarrierBodyAndCount = function (sourceInfo, maxMiningRate) {
        var trace = this.tracer.start('getSourceCarrierBodyAndCount()');
        var useRoads = (this.mainRoom.mainContainer && sourceInfo.roadBuiltToRoom == this.mainRoom.name);
        var pathLengh = (sourceInfo.pathLengthToDropOff + 10) * 1;
        if (pathLengh == null)
            pathLengh = 50;
        var sourceRate = sourceInfo.capacity / ENERGY_REGEN_TIME;
        var energyPerTick = maxMiningRate == null ? sourceRate : Math.min(maxMiningRate, sourceRate);
        var requiredCapacity = energyPerTick * pathLengh * (useRoads ? 2 : 3);
        trace.stop();
        return SourceCarrierDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, requiredCapacity, this.mainRoom.managers.labManager.availablePublishResources);
    };
    EnergyHarvestingManager.prototype._preTick = function () {
        var _this = this;
        if (this.mainRoom.spawnManager.isBusy)
            return;
        var startCpu;
        var endCpu;
        var spawnManager = null;
        if (this.mainRoom.mainContainer && this.mainRoom.mainContainer.store.energy >= 800000)
            this.mainRoom.harvestingActive = false;
        else if (!this.mainRoom.mainContainer || this.mainRoom.mainContainer.store.energy < 500000)
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
        var harvestersBySource = _.groupBy(this.harvesterCreeps, function (x) { return x.memory.sourceId; });
        var carriersBySource = _.groupBy(this.sourceCarrierCreeps, function (x) { return x.memory.sourceId; });
        var sources = _.filter(this.mainRoom.sources, function (s) { return s.myRoom.name == _this.mainRoom.name || _this.mainRoom.harvestingActive; });
        var _loop_4 = function() {
            if (spawnManager.isBusy)
                return "break";
            sourceInfo = sources[idx];
            if (sourceInfo.myRoom && _.any(sourceInfo.myRoom.hostileScan.creeps, function (c) { return c.bodyInfo.totalAttackRate > 0; }))
                return { value: void 0 };
            if (!Colony.getRoom(sourceInfo.pos.roomName).canHarvest) {
                return "continue";
            }
            if (sourceInfo.hasKeeper && (_.size(this_3.mainRoom.managers.labManager.myLabs) == 0 || sourceInfo.maxHarvestingSpots == 1)) {
                return "continue";
            }
            //var harvesters = _.filter(this.harvesterCreeps, (c) => (<EnergyHarvesterMemory>c.memory).sourceId == sourceInfo.id);
            var harvesters = harvestersBySource[sourceInfo.id];
            var harvesterRequirements = this_3.getHarvesterBodyAndCount(sourceInfo);
            if (harvesterRequirements.count > 0) {
                var requestedCreep = false;
                //if (!sourceInfo.hasKeeper && harvesterRequirements.body.energyHarvestingRate * harvesterRequirements.count < sourceInfo.capacity / ENERGY_REGEN_TIME) {
                //    let requestHarvesterRequirements = this.getHarvesterBodyAndCount(sourceInfo, true);
                //    console.log('MainRoom ' + this.mainRoom.name + ' requests harvester: ' + requestHarvesterRequirements.count);
                //    requestedCreep = Colony.spawnCreep(this.mainRoom.myRoom, requestHarvesterRequirements.body, { role: 'harvester', state: EnergyHarvesterState.Harvesting, sourceId: sourceInfo.id, mainRoomName: this.mainRoom.name, requiredBoosts: requestHarvesterRequirements.body.boosts, }, requestHarvesterRequirements.count - (harvesters ? harvesters.length : 0));
                //}
                if (!requestedCreep) {
                    var livingHarvesters = _.filter(harvesters, function (x) { return ((x.ticksToLive > sourceInfo.pathLengthToDropOff + harvesterRequirements.body.getBody().length * 3) || x.spawning); });
                    spawnManager.addToQueue(harvesterRequirements.body.getBody(), { role: 'harvester', state: 0 /* Harvesting */, sourceId: sourceInfo.id, mainRoomName: this_3.mainRoom.name, requiredBoosts: harvesterRequirements.body.boosts }, harvesterRequirements.count - livingHarvesters.length);
                }
                if (sourceInfo.link == null && this_3.mainRoom.mainContainer) {
                    var miningRate = Math.min(Math.ceil(harvesterRequirements.body.energyHarvestingRate * harvesterRequirements.count / (sourceInfo.hasKeeper ? 2 : 1)), Math.ceil(sourceInfo.capacity / 300));
                    //var sourceCarriers = _.filter(this.sourceCarrierCreeps, (c) => (<SourceCarrierMemory>c.memory).sourceId == sourceInfo.id);
                    var sourceCarriers = carriersBySource[sourceInfo.id];
                    var requirements = this_3.getSourceCarrierBodyAndCount(sourceInfo, miningRate);
                    spawnManager.addToQueue(requirements.body.getBody(), { role: 'sourceCarrier', sourceId: sourceInfo.id, mainRoomName: this_3.mainRoom.name }, Math.min(requirements.count, 5) - (sourceCarriers ? sourceCarriers.length : 0));
                }
            }
        };
        var this_3 = this;
        var sourceInfo;
        for (var idx in sources) {
            var state_4 = _loop_4();
            if (typeof state_4 === "object") return state_4.value;
            if (state_4 === "break") break;
            if (state_4 === "continue") continue;
        }
    };
    EnergyHarvestingManager.prototype._tick = function () {
        var _this = this;
        this.harvesterCreeps.forEach(function (c) { new EnergyHarvester(c, _this.mainRoom).tick(); });
        this.sourceCarrierCreeps.forEach(function (c) { new SourceCarrier(c, _this.mainRoom).tick(); });
    };
    return EnergyHarvestingManager;
}(Manager));
var DefenderDefinition;
(function (DefenderDefinition) {
    function getDefinition(maxEnergy) {
        var body = new Body();
        var remainingEnergy = Math.min(maxEnergy, 1500);
        var basicModulesCount = ~~(remainingEnergy / 330); //work,carry,move
        body.attack = basicModulesCount;
        body.ranged_attack = basicModulesCount;
        body.move = 2 * basicModulesCount;
        remainingEnergy = remainingEnergy - 330 * basicModulesCount;
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
var Defender = (function () {
    function Defender(creep, mainRoom) {
        this.creep = creep;
        this.mainRoom = mainRoom;
        this.creep = creep;
        this.mainRoom = mainRoom;
        this.memory = this.creep.memory;
    }
    Defender.prototype.tick = function () {
        var _this = this;
        this.memory = this.creep.memory;
        var closestHostileCreep = this.creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS, { filter: function (c) { return c.owner.username != 'Source Keeper'; } });
        if (closestHostileCreep != null) {
            this.creep.moveTo(closestHostileCreep);
            this.creep.attack(closestHostileCreep);
            this.creep.rangedAttack(closestHostileCreep);
        }
        else {
            var otherRoom = _.filter(this.mainRoom.allRooms, function (r) { return r.name != _this.creep.room.name && r.requiresDefense && r.canHarvest; })[0];
            if (otherRoom != null)
                this.creep.moveTo(new RoomPosition(25, 25, otherRoom.name));
            else if (this.creep.pos.x == 0 || this.creep.pos.x == 49 || this.creep.pos.y == 0 || this.creep.pos.y == 49)
                this.creep.moveTo(new RoomPosition(25, 25, this.creep.room.name));
            else {
                if (this.mainRoom.spawns[0].recycleCreep(this.creep) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(this.mainRoom.spawns[0]);
            }
        }
    };
    return Defender;
}());
/// <reference path="../creeps/defender/defenderDefinition.ts" />
/// <reference path="../creeps/defender/defender.ts" />
/// <reference path="./manager.ts" />
var DefenseManager = (function (_super) {
    __extends(DefenseManager, _super);
    function DefenseManager(mainRoom) {
        _super.call(this, DefenseManager.staticTracer);
        this.mainRoom = mainRoom;
        this._creeps = { time: 0, creeps: null };
        this.maxCreeps = 1;
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
    Object.defineProperty(DefenseManager, "staticTracer", {
        get: function () {
            if (DefenseManager._staticTracer == null) {
                DefenseManager._staticTracer = new Tracer('DefenseManager');
                Colony.tracers.push(DefenseManager._staticTracer);
            }
            return DefenseManager._staticTracer;
        },
        enumerable: true,
        configurable: true
    });
    DefenseManager.prototype._preTick = function () {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if (_.filter(this.mainRoom.allRooms, function (r) { return !r.memory.foreignOwner && !r.memory.foreignReserver && r.requiresDefense && r.canHarvest; }).length > 0 && this.creeps.length < this.maxCreeps) {
            this.mainRoom.spawnManager.addToQueue(DefenderDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'defender' }, this.maxCreeps - this.creeps.length, true);
        }
    };
    DefenseManager.prototype._tick = function () {
        var _this = this;
        this.creeps.forEach(function (c) { return new Defender(c, _this.mainRoom).tick(); });
    };
    return DefenseManager;
}(Manager));
/// <reference path="../myCreep.ts" />
var Reserver = (function (_super) {
    __extends(Reserver, _super);
    function Reserver(creep, mainRoom) {
        _super.call(this, creep);
        this.creep = creep;
        this.mainRoom = mainRoom;
        this.memory = creep.memory;
        this.memory.autoFlee = true;
    }
    Reserver.prototype.myTick = function () {
        this.memory = this.creep.memory;
        var myRoom = Colony.getRoom(this.memory.targetRoomName);
        if (this.creep.room.name != this.memory.targetRoomName && (this.memory.path == null || this.memory.path.path.length <= 2)) {
            this.memory.path = PathFinder.search(this.creep.pos, { pos: myRoom.controllerPosition, range: 3 }, { roomCallback: Colony.getTravelMatrix, plainCost: 1, swampCost: 5 });
            this.memory.path.path.unshift(this.creep.pos);
        }
        if (this.memory.path && this.memory.path.path.length > 2)
            this.moveByPath();
        else {
            if (this.creep.reserveController(this.creep.room.controller) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.creep.room.controller);
        }
    };
    return Reserver;
}(MyCreep));
/// <reference path="../creeps/reserver/reserver.ts" />
/// <reference path="./manager.ts" />
var ReservationManager = (function (_super) {
    __extends(ReservationManager, _super);
    function ReservationManager(mainRoom) {
        _super.call(this, ReservationManager.staticTracer);
        this.mainRoom = mainRoom;
        this._creeps = { time: 0, creeps: null };
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
    Object.defineProperty(ReservationManager, "staticTracer", {
        get: function () {
            if (ReservationManager._staticTracer == null) {
                ReservationManager._staticTracer = new Tracer('ReservationManager');
                Colony.tracers.push(ReservationManager._staticTracer);
            }
            return ReservationManager._staticTracer;
        },
        enumerable: true,
        configurable: true
    });
    ReservationManager.prototype._preTick = function () {
        var mainRoom = this.mainRoom;
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if (Memory['verbose'] == true)
            console.log('ReservationManager.checkCreep');
        var rooms = _.filter(this.mainRoom.connectedRooms, function (r) { return r.canHarvest == true && r.hasController && r.controllerPosition; });
        var _loop_5 = function() {
            var myRoom = rooms[idx];
            if (Memory['verbose'] == true)
                console.log('ReservationManager.checkCreep: 1 Room ' + myRoom.name);
            var room = myRoom.room;
            if (room && room.controller.reservation != null && (room.controller.reservation.ticksToEnd > 4500 || this_4.mainRoom.room.controller.level <= 3 && room.controller.reservation.ticksToEnd > 500))
                return "continue";
            if (Memory['verbose'] == true)
                console.log('ReservationManager.checkCreep: 2 Room ' + myRoom.name);
            if (this_4.mainRoom.maxSpawnEnergy < 650)
                return { value: void 0 };
            var requiredCount = this_4.mainRoom.maxSpawnEnergy < 1300 ? 2 : 1;
            if (_.filter(this_4.creeps, function (x) { return x.memory.targetRoomName == myRoom.name; }).length < requiredCount) {
                this_4.mainRoom.spawnManager.addToQueue(requiredCount > 1 ? [CLAIM, MOVE] : [CLAIM, CLAIM, MOVE, MOVE], { role: 'reserver', targetRoomName: myRoom.name }, 1, false);
            }
        };
        var this_4 = this;
        for (var idx in rooms) {
            var state_5 = _loop_5();
            if (typeof state_5 === "object") return state_5.value;
            if (state_5 === "continue") continue;
        }
    };
    ReservationManager.prototype._tick = function () {
        var _this = this;
        this.creeps.forEach(function (c) { return new Reserver(c, _this.mainRoom).tick(); });
    };
    return ReservationManager;
}(Manager));
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
var LinkFiller = (function () {
    function LinkFiller(creep, mainRoom) {
        this.creep = creep;
        this.mainRoom = mainRoom;
    }
    LinkFiller.prototype.tick = function () {
        var storage = this.mainRoom.room.storage;
        if (this.creep.ticksToLive <= 10) {
            if (this.creep.carry.energy == 0)
                this.creep.suicide();
            else {
                if (this.creep.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(storage);
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
}());
/// <reference path="../creeps/linkFiller/linkFillerDefinition.ts" />
/// <reference path="../creeps/linkFiller/linkFiller.ts" />
/// <reference path="./manager.ts" />
var LinkFillerManager = (function (_super) {
    __extends(LinkFillerManager, _super);
    function LinkFillerManager(mainRoom) {
        _super.call(this, LinkFillerManager.staticTracer);
        this.mainRoom = mainRoom;
        this._creeps = { time: 0, creeps: null };
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
    Object.defineProperty(LinkFillerManager, "staticTracer", {
        get: function () {
            if (LinkFillerManager._staticTracer == null) {
                LinkFillerManager._staticTracer = new Tracer('LinkFillerManager');
                Colony.tracers.push(LinkFillerManager._staticTracer);
            }
            return LinkFillerManager._staticTracer;
        },
        enumerable: true,
        configurable: true
    });
    LinkFillerManager.prototype._preTick = function () {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if (this.creeps.length == 0 && this.mainRoom.links.length > 0) {
            this.mainRoom.spawnManager.addToQueue(LinkFillerDefinition.getDefinition().getBody(), { role: 'linkFiller' });
        }
    };
    LinkFillerManager.prototype._tick = function () {
        var _this = this;
        this.creeps.forEach(function (c) { return new LinkFiller(c, _this.mainRoom).tick(); });
    };
    return LinkFillerManager;
}(Manager));
/// <reference path="./manager.ts" />
var RoadConstructionManager = (function (_super) {
    __extends(RoadConstructionManager, _super);
    function RoadConstructionManager(mainRoom) {
        _super.call(this, RoadConstructionManager.staticTracer);
        this.mainRoom = mainRoom;
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
    Object.defineProperty(RoadConstructionManager, "staticTracer", {
        get: function () {
            if (RoadConstructionManager._staticTracer == null) {
                RoadConstructionManager._staticTracer = new Tracer('RoadConstructionManager');
                Colony.tracers.push(RoadConstructionManager._staticTracer);
            }
            return RoadConstructionManager._staticTracer;
        },
        enumerable: true,
        configurable: true
    });
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
            _.forEach(this.mainRoom.allRooms, function (room) { return room.recreateTravelMatrix(); });
            var path = PathFinder.search(this.mainRoom.mainContainer.pos, { pos: mySource.pos, range: 1 }, { plainCost: 2, swampCost: 3, roomCallback: Colony.getTravelMatrix, maxOps: 10000 });
            this.constructRoad(path.path, 0);
            mySource.roadBuiltToRoom = this.mainRoom.name;
        }
        _.forEach(_.filter(this.mainRoom.minerals, function (m) { return m.roadBuiltToRoom != _this.mainRoom.name; }), function (myMineral) {
            if (_.size(Game.constructionSites) == 100)
                return;
            if (_this.mainRoom.terminal) {
                _.forEach(_this.mainRoom.allRooms, function (room) { return room.recreateTravelMatrix(); });
                var path = PathFinder.search(myMineral.pos, { pos: _this.mainRoom.terminal.pos, range: 1 }, { plainCost: 2, swampCost: 3, roomCallback: Colony.getTravelMatrix, maxOps: 10000 });
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
    RoadConstructionManager.prototype._tick = function () {
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
}(Manager));
/// <reference path="../body.ts" />
var TowerFillerDefinition;
(function (TowerFillerDefinition) {
    function getDefinition(maxEnergy, towerCount) {
        if (towerCount === void 0) { towerCount = 1; }
        var body = new Body();
        body.carry = 4 * Math.max(towerCount, 5);
        body.move = 2 * Math.max(towerCount, 5);
        return body;
    }
    TowerFillerDefinition.getDefinition = getDefinition;
})(TowerFillerDefinition || (TowerFillerDefinition = {}));
var TowerFiller = (function () {
    function TowerFiller(creep, mainRoom) {
        this.creep = creep;
        this.mainRoom = mainRoom;
    }
    TowerFiller.prototype.tick = function () {
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
}());
/// <reference path="../creeps/towerFiller/towerFillerDefinition.ts" />
/// <reference path="../creeps/towerFiller/towerFiller.ts" />
/// <reference path="./manager.ts" />
var TowerManager = (function (_super) {
    __extends(TowerManager, _super);
    function TowerManager(mainRoom) {
        _super.call(this, TowerManager.staticTracer);
        this.mainRoom = mainRoom;
        this._creeps = { time: -1, creeps: null };
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
    Object.defineProperty(TowerManager, "staticTracer", {
        get: function () {
            if (TowerManager._staticTracer == null) {
                TowerManager._staticTracer = new Tracer('TowerManager');
                Colony.tracers.push(TowerManager._staticTracer);
            }
            return TowerManager._staticTracer;
        },
        enumerable: true,
        configurable: true
    });
    TowerManager.prototype._preTick = function () {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if ((this.mainRoom.towers.length == 0 || this.mainRoom.mainContainer == null) || (_.all(this.mainRoom.towers, function (x) { return x.energy >= 0.5 * x.energyCapacity; }) && _.size(this.mainRoom.myRoom.hostileScan.creeps) == 0))
            return;
        if (this.creeps.length < 1) {
            this.mainRoom.spawnManager.addToQueue(TowerFillerDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, this.mainRoom.towers.length).getBody(), { role: 'towerFiller' }, 1);
        }
    };
    TowerManager.prototype._tick = function () {
        var _this = this;
        this.creeps.forEach(function (c) { return new TowerFiller(c, _this.mainRoom).tick(); });
    };
    return TowerManager;
}(Manager));
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
        workBody.work = ['H', 'O', 'X'].indexOf(myMineral.resource) >= 0 ? 20 : 10;
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
    function MineralHarvester(creep, mainRoom) {
        _super.call(this, creep);
        this.creep = creep;
        this.mainRoom = mainRoom;
        this.healed = false;
        this.memory.autoFlee = true;
        if (MineralHarvester.staticTracer == null) {
            MineralHarvester.staticTracer = new Tracer('MineralHarvester');
            Colony.tracers.push(MineralHarvester.staticTracer);
        }
        this.tracer = MineralHarvester.staticTracer;
    }
    Object.defineProperty(MineralHarvester.prototype, "memory", {
        get: function () { return this.creep.memory; },
        enumerable: true,
        configurable: true
    });
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
        var trace = this.tracer.start('tick()');
        if (this.creep.spawning) {
            trace.stop();
            return;
        }
        this.healed = false;
        if (this.creep.getActiveBodyparts(HEAL) > 0 && this.creep.hits + this.creep.getActiveBodyparts(HEAL) * HEAL_POWER <= this.creep.hitsMax) {
            this.creep.heal(this.creep);
            this.healed = true;
        }
        if (this.myMineral == null) {
            this.creep.say('NoMineral');
            trace.stop();
            return;
        }
        if (this.memory.path == null) {
            this.memory.path = PathFinder.search(this.creep.pos, { pos: this.myMineral.pos, range: 6 }, { roomCallback: Colony.getTravelMatrix, plainCost: 2, swampCost: 10 });
            this.memory.path.path.unshift(this.creep.pos);
        }
        if (this.memory.path.path.length > 2)
            this.moveByPath();
        else {
            if (this.myMineral.pos.roomName != this.creep.room.name) {
                this.creep.moveTo(this.myMineral.pos);
            }
            else if (!this.healed) {
                if (this.creep.harvest(this.myMineral.mineral) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(this.myMineral.mineral);
            }
        }
        trace.stop();
    };
    return MineralHarvester;
}(MyCreep));
/// <reference path="../myCreep.ts" />
var MineralCarrier = (function (_super) {
    __extends(MineralCarrier, _super);
    function MineralCarrier(creep, mainRoom) {
        _super.call(this, creep);
        this.creep = creep;
        this.mainRoom = mainRoom;
        this.memory.autoFlee = true;
        if (MineralCarrier.staticTracer == null) {
            MineralCarrier.staticTracer = new Tracer('MineralCarrier');
            Colony.tracers.push(MineralCarrier.staticTracer);
        }
        this.tracer = MineralCarrier.staticTracer;
    }
    Object.defineProperty(MineralCarrier.prototype, "memory", {
        get: function () { return this.creep.memory; },
        enumerable: true,
        configurable: true
    });
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
        var resources = _.filter(Colony.getRoom(this.creep.room.name).resourceDrops, function (r) { return r.resourceType == _this.myMineral.resource; });
        var resource = _.filter(resources, function (r) { return (Math.pow((r.pos.x - _this.creep.pos.x), 2) + Math.pow((r.pos.y - _this.creep.pos.y), 2)) <= 16; })[0];
        if (resource != null) {
            if (this.creep.pickup(resource) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(resource);
            return true;
        }
        return false;
    };
    MineralCarrier.prototype.myTick = function () {
        var trace = this.tracer.start('tick()');
        if (this.creep.spawning) {
            trace.stop();
            return;
        }
        if (!this.myMineral) {
            this.creep.say('NoMineral');
            trace.stop();
            return;
        }
        if (this.memory.state == null || this.memory.state == 1 /* Deliver */ && (this.creep.carry[this.myMineral.resource] == null || this.creep.carry[this.myMineral.resource] == 0)) {
            this.memory.path = PathFinder.search(this.creep.pos, { pos: this.myMineral.pos, range: 6 }, { roomCallback: Colony.getTravelMatrix, plainCost: 1, swampCost: 1 });
            this.memory.path.path.unshift(this.creep.pos);
            this.memory.state = 0 /* Pickup */;
        }
        else if (this.memory.state == 0 /* Pickup */ && _.sum(this.creep.carry) == this.creep.carryCapacity) {
            if (this.mainRoom.terminal == null) {
                this.creep.say('NoTerm');
                trace.stop();
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
                trace.stop();
                return;
            }
            if (this.memory.path.path.length > 2) {
                this.moveByPath();
            }
            else {
                if (this.creep.transfer(this.mainRoom.terminal, this.myMineral.resource) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(this.mainRoom.terminal);
            }
        }
        trace.stop();
    };
    return MineralCarrier;
}(MyCreep));
/// <reference path="../creeps/minerals/mineralHarvesterDefinition.ts" />
/// <reference path="../creeps/minerals/mineralHarvester.ts" />
/// <reference path="../creeps/sourceCarrier/sourceCarrierDefinition.ts" />
/// <reference path="../creeps/minerals/mineralCarrier.ts" />
/// <reference path="./manager.ts" />
var MineralHarvestingManager = (function (_super) {
    __extends(MineralHarvestingManager, _super);
    function MineralHarvestingManager(mainRoom) {
        _super.call(this, MineralHarvestingManager.staticTracer);
        this.mainRoom = mainRoom;
        this._harvesterCreeps = { time: -1, creeps: null };
        this._carrierCreeps = { time: -1, creeps: null };
    }
    Object.defineProperty(MineralHarvestingManager.prototype, "harvesterCreeps", {
        get: function () {
            if (this._harvesterCreeps.time < Game.time)
                this._harvesterCreeps = {
                    time: Game.time, creeps: this.mainRoom.creepsByRole('mineralHarvester')
                };
            return this._harvesterCreeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MineralHarvestingManager.prototype, "carrierCreeps", {
        get: function () {
            if (this._carrierCreeps.time < Game.time)
                this._carrierCreeps = {
                    time: Game.time, creeps: this.mainRoom.creepsByRole('mineralCarrier')
                };
            return this._carrierCreeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MineralHarvestingManager, "staticTracer", {
        get: function () {
            if (MineralHarvestingManager._staticTracer == null) {
                MineralHarvestingManager._staticTracer = new Tracer('MineralHarvestingManager');
                Colony.tracers.push(MineralHarvestingManager._staticTracer);
            }
            return MineralHarvestingManager._staticTracer;
        },
        enumerable: true,
        configurable: true
    });
    MineralHarvestingManager.prototype._preTick = function () {
        var _this = this;
        if (this.mainRoom.spawnManager.isBusy)
            return;
        _.forEach(this.mainRoom.minerals, function (myMineral) {
            //console.log('MineralHarvestingManager.checkCreeps()');
            if ((!myMineral.hasKeeper || _.size(_this.mainRoom.managers.labManager.myLabs) > 0 && myMineral.maxHarvestingSpots > 1) && _this.mainRoom.terminal && myMineral.hasExtractor && (myMineral.amount > 0 || myMineral.refreshTime <= Game.time)) {
                //  console.log('MineralHarvestingManager.checkCreeps - 2');
                var targetAmount = Colony.reactionManager.requiredAmount * 5;
                var mineralType = myMineral.resource;
                if (mineralType == RESOURCE_HYDROGEN || mineralType == RESOURCE_OXYGEN || mineralType == RESOURCE_CATALYST) {
                    targetAmount = Colony.reactionManager.requiredAmount * 10;
                }
                //console.log('MineralHarvestingManager.checkCreeps target: ' + targetAmount + ' value: ' + this.mainRoom.terminal.store[mineralType]);
                if (_this.mainRoom.terminal.store[mineralType] == null || _this.mainRoom.terminal.store[mineralType] < targetAmount) {
                    var harvesters = _.filter(_this.harvesterCreeps, function (c) { return c.memory.mineralId == myMineral.id; });
                    //console.log('MineralHarvestingManager.checkCreeps - 3');
                    if (harvesters.length == 0) {
                        //      console.log('MineralHarvestingManager.checkCreeps - 4');
                        var definition = MineralHarvesterDefinition.getDefinition(_this.mainRoom.maxSpawnEnergy, myMineral);
                        _this.mainRoom.spawnManager.addToQueue(definition.body.getBody(), { role: 'mineralHarvester', mineralId: myMineral.id }, definition.count);
                    }
                    var carriers = _.filter(_this.carrierCreeps, function (c) { return c.memory.mineralId == myMineral.id; });
                    if (carriers.length == 0) {
                        //        console.log('MineralHarvestingManager.checkCreeps - 5');
                        //let pathLength = PathFinder.search(this.mainRoom.extractor.pos, { pos: this.mainRoom.terminal.pos, range: 2 }).path.length;
                        var pathLength = (myMineral.pathLengthToDropOff + 10) * 1.1;
                        var requiredCapacity = Math.ceil(pathLength * 2 * 10 * (['O', 'H'].indexOf(myMineral.resource) >= 0 ? 2 : 1) / (myMineral.hasKeeper ? 2 : 1));
                        var definition = SourceCarrierDefinition.getDefinition(_this.mainRoom.maxSpawnEnergy, requiredCapacity, _this.mainRoom.managers.labManager.availablePublishResources);
                        _this.mainRoom.spawnManager.addToQueue(definition.body.getBody(), { role: 'mineralCarrier', mineralId: myMineral.id }, definition.count - carriers.length);
                    }
                }
            }
        });
    };
    MineralHarvestingManager.prototype._tick = function () {
        var _this = this;
        //let startCpu = Game.cpu.getUsed();
        this.harvesterCreeps.forEach(function (c) { try {
            new MineralHarvester(c, _this.mainRoom).tick();
        }
        catch (e) {
            c.say('ERROR');
            Memory['error'] = e;
            console.log(e.stack);
        } });
        //console.log('Harvesters ' + this.mainRoom.name + ' [' + this.harvesterCreeps.length + ']: ' + (Game.cpu.getUsed() - startCpu).toFixed(2) + ' CPU');
        //startCpu = Game.cpu.getUsed();
        this.carrierCreeps.forEach(function (c) { try {
            new MineralCarrier(c, _this.mainRoom).tick();
        }
        catch (e) {
            c.say('ERROR');
            Memory['error'] = e;
            console.log(e.stack);
        } });
        //console.log('SourceCarriers ' + this.mainRoom.name + ' [' + this.harvesterCreeps.length + ']: ' + (Game.cpu.getUsed() - startCpu).toFixed(2) + ' CPU');
    };
    return MineralHarvestingManager;
}(Manager));
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
var TerminalFiller = (function () {
    function TerminalFiller(creep, mainRoom) {
        this.creep = creep;
        this.mainRoom = mainRoom;
        if (TerminalFiller.staticTracer == null) {
            TerminalFiller.staticTracer = new Tracer('TerminalFiller');
            Colony.tracers.push(TerminalFiller.staticTracer);
        }
        this.tracer = TerminalFiller.staticTracer;
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
        var trace = this.tracer.start('transferCompounds()');
        var publishableCompounds = _.indexBy(Colony.reactionManager.publishableCompounds, function (x) { return x; });
        if (_.sum(this.creep.carry) > this.creep.carry.energy) {
            var dropTrace = this.tracer.start('transferCompounds() - drop');
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
                trace.stop();
                dropTrace.stop();
                return true;
            }
            dropTrace.stop();
        }
        else {
            var pickupTrace = this.tracer.start('transferCompounds() - pickup1');
            var resourceToTransfer = _.filter(Colony.reactionManager.publishableCompounds, function (c) { return (_this.mainContainer.store[c] == null || _this.mainContainer.store[c] < 5000) && _this.terminal.store[c] > 0; })[0];
            if (resourceToTransfer) {
                if (this.creep.withdraw(this.terminal, resourceToTransfer) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(this.terminal);
                trace.stop();
                pickupTrace.stop();
                return true;
            }
            pickupTrace.stop();
            pickupTrace = this.tracer.start('transferCompounds() - pickup2');
            resourceToTransfer = null;
            for (var resource in this.mainContainer.store) {
                if (resource == RESOURCE_ENERGY)
                    continue;
                if (!publishableCompounds[resource] && this.mainContainer.store[resource] > 0 || this.mainContainer.store[resource] > 5000 + this.creep.carryCapacity) {
                    if (this.creep.withdraw(this.mainContainer, resource) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(this.mainContainer);
                    trace.stop();
                    pickupTrace.stop();
                    return true;
                }
            }
            pickupTrace.stop();
        }
        trace.stop();
        return false;
    };
    TerminalFiller.prototype.transferEnergy = function () {
        var trace = this.tracer.start('transferEnergy()');
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
            trace.stop();
            return true;
        }
        else {
            trace.stop();
            return false;
        }
    };
    TerminalFiller.prototype.tick = function () {
        var trace = this.tracer.start('tick()');
        var store = this.mainRoom.mainContainer;
        var terminal = this.mainRoom.room.terminal;
        if (this.creep.ticksToLive <= 20 && _.sum(this.creep.carry) > 0) {
            this.saveBeforeDeath();
        }
        else {
            if (this.creep.carry.energy > 0)
                this.transferEnergy();
            else if (_.sum(this.creep.carry) > 0)
                this.transferCompounds();
            else {
                this.transferEnergy() || this.transferCompounds();
            }
        }
        trace.stop();
    };
    return TerminalFiller;
}());
/// <reference path="../creeps/terminalFiller/terminalFillerDefinition.ts" />
/// <reference path="../creeps/terminalFiller/terminalFiller.ts" />
var TerminalManager = (function (_super) {
    __extends(TerminalManager, _super);
    function TerminalManager(mainRoom) {
        _super.call(this, TerminalManager.staticTracer);
        this.mainRoom = mainRoom;
        this._creeps = { time: 0, creeps: null };
        this.maxCreeps = 1;
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
    Object.defineProperty(TerminalManager, "staticTracer", {
        get: function () {
            if (TerminalManager._staticTracer == null) {
                TerminalManager._staticTracer = new Tracer('TerminalManager');
                Colony.tracers.push(TerminalManager._staticTracer);
            }
            return TerminalManager._staticTracer;
        },
        enumerable: true,
        configurable: true
    });
    TerminalManager.prototype._preTick = function () {
        if (!this.mainRoom.room || !this.mainRoom.mainContainer || !this.mainRoom.room.terminal || !this.mainRoom.room.terminal.isActive() || this.mainRoom.spawnManager.isBusy)
            return;
        if (this.creeps.length == 0) {
            this.mainRoom.spawnManager.addToQueue(TerminalFillerDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'terminalManager' }, this.maxCreeps - this.creeps.length);
        }
    };
    TerminalManager.prototype._tick = function () {
        var _this = this;
        if (!this.mainRoom.room || !this.mainRoom.mainContainer || !this.mainRoom.room.terminal || !this.mainRoom.room.terminal.isActive()) {
            return;
        }
        _.forEach(this.creeps, function (x) { return new TerminalFiller(x, _this.mainRoom).tick(); });
        this.handleTerminal(this.mainRoom.room.terminal);
    };
    TerminalManager.prototype.handleTradeAgreements = function (terminal) {
        var _this = this;
        var trace = this.tracer.start('handleTradeAgreements()');
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
        trace.stop();
    };
    TerminalManager.prototype.handleEnergyBalance = function (terminal) {
        var _this = this;
        var trace = this.tracer.start('handleEnergyBalance()');
        //if ((this.resourceSentOn == null || this.resourceSentOn < Game.time) && this.mainRoom.mainContainer.store.energy > 450000 && terminal.store.energy > 1000) {
        //    let targetMainRoom = _.sortByAll(_.filter(Colony.mainRooms, x => x.mainContainer && x.room && x.room.terminal && x.room.terminal.isActive() && x.mainContainer.store.energy < 350000 && Game.map.getRoomLinearDistance(this.mainRoom.name, x.name) <= 3), [x => Game.map.getRoomLinearDistance(this.mainRoom.name, x.name), x => x.mainContainer.store.energy])[0];
        //    if (targetMainRoom) {
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
        trace.stop();
    };
    TerminalManager.prototype.handleMineralBalance = function (terminal) {
        var _this = this;
        var trace = this.tracer.start('handleMineralBalance()');
        _.forEach(_.filter(_.uniq(Colony.reactionManager.highestPowerCompounds.concat(this.mainRoom.managers.labManager.imports)), function (x) { return x != RESOURCE_ENERGY && _this.mainRoom.getResourceAmount(x) <= 5000; }), function (resource) {
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
        trace.stop();
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
}(Manager));
var MyLab = (function () {
    function MyLab(labManager, id) {
        this.labManager = labManager;
        this.id = id;
        this._connectedLabs = null;
        this._lab = null;
        if (MyLab.staticTracer == null) {
            MyLab.staticTracer = new Tracer('MyLab');
            Colony.tracers.push(MyLab.staticTracer);
        }
        this.tracer = MyLab.staticTracer;
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
        var trace = this.tracer.start('tick()');
        //console.log('myLab.tick try room: ' + this.labManager.mainRoom.name);
        if (this.memory.mode & 2 /* reaction */ && this.lab && this.lab.cooldown == 0 && this.memory.reactionLabIds.length == 2 && (this.lab.mineralType == this.memory.resource || this.lab.mineralAmount == 0)) {
            if (_.all(this.memory.reactionLabIds, function (x) { return _this.labManager.myLabs[x].lab != null && _this.labManager.myLabs[x].lab.mineralType == _this.labManager.myLabs[x].memory.resource; })) {
                this.lab.runReaction(this.labManager.myLabs[this.memory.reactionLabIds[0]].lab, this.labManager.myLabs[this.memory.reactionLabIds[1]].lab);
            }
        }
        trace.stop();
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
var LabCarrier = (function () {
    function LabCarrier(creep, labManager) {
        this.creep = creep;
        this.labManager = labManager;
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
        var _loop_6 = function(resource) {
            if (this_5.creep.carry[resource] > 0) {
                var myLab = _.filter(this_5.labManager.myLabs, function (lab) { return lab.memory.mode & 1 /* import */ && lab.memory.resource == resource && lab.lab && (lab.lab.mineralType == resource || lab.lab.mineralAmount == 0) && lab.lab.mineralAmount <= lab.lab.mineralCapacity - _this.creep.carry[resource]; })[0];
                if (myLab) {
                    if (this_5.creep.transfer(myLab.lab, resource) == ERR_NOT_IN_RANGE)
                        this_5.creep.moveTo(myLab.lab);
                    foundTarget = true;
                    return "break";
                }
            }
        };
        var this_5 = this;
        for (var resource in this.creep.carry) {
            var state_6 = _loop_6(resource);
            if (state_6 === "break") break;
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
        }
        else {
            var publishLab = _.filter(this.labManager.myLabs, function (lab) { return lab.memory.mode & 4 /* publish */ && lab.lab && lab.lab.energy <= lab.lab.energyCapacity - _this.creep.carryCapacity; })[0];
            if (publishLab && this.labManager.mainRoom.mainContainer && this.labManager.mainRoom.mainContainer.store.energy >= this.labManager.mainRoom.maxSpawnEnergy * 2) {
                //this.creep.say('B');
                if (this.creep.withdraw(this.labManager.mainRoom.mainContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(this.labManager.mainRoom.mainContainer);
            }
            else {
                var outputLab = _.filter(this.labManager.myLabs, function (lab) { return lab.memory.mode & 2 /* reaction */ && lab.lab && (lab.lab.mineralAmount >= 1000 + _this.creep.carryCapacity && !(lab.memory.mode & 4 /* publish */) || lab.lab.mineralAmount - _this.creep.carryCapacity >= lab.lab.mineralCapacity / 2); })[0];
                if (outputLab && this.labManager.mainRoom.terminal && _.sum(this.labManager.mainRoom.terminal.store) <= this.labManager.mainRoom.terminal.storeCapacity - this.creep.carryCapacity) {
                    //this.creep.say('C');
                    if (this.creep.withdraw(outputLab.lab, outputLab.lab.mineralType) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(outputLab.lab);
                }
                else if (this.labManager.mainRoom.terminal || this.labManager.mainRoom.mainContainer) {
                    var inputLab = null;
                    var source = null;
                    if (this.labManager.mainRoom.terminal) {
                        inputLab = _.sortBy(_.filter(this.labManager.myLabs, function (lab) { return lab.memory.mode & 1 /* import */ && lab.lab && (lab.lab.mineralAmount == 0 || lab.lab.mineralType == lab.memory.resource && lab.lab.mineralAmount <= 2000 - _this.creep.carryCapacity) && _this.labManager.mainRoom.terminal.store[lab.memory.resource] >= 0; }), function (x) { return x.lab.mineralAmount ? x.lab.mineralAmount : 0; })[0];
                        source = this.labManager.mainRoom.terminal;
                    }
                    if (inputLab == null && this.labManager.mainRoom.mainContainer) {
                        inputLab = _.sortBy(_.filter(this.labManager.myLabs, function (lab) { return lab.memory.mode & 1 /* import */ && lab.lab && (lab.lab.mineralAmount == 0 || lab.lab.mineralType == lab.memory.resource && lab.lab.mineralAmount <= 2000 - _this.creep.carryCapacity) && _this.labManager.mainRoom.mainContainer.store[lab.memory.resource] >= 0; }), function (x) { return x.lab.mineralAmount ? x.lab.mineralAmount : 0; })[0];
                        source = this.labManager.mainRoom.mainContainer;
                    }
                    if (inputLab) {
                        //this.creep.say('D');
                        if (this.creep.withdraw(source, inputLab.memory.resource) == ERR_NOT_IN_RANGE)
                            this.creep.moveTo(source);
                    }
                }
            }
        }
    };
    LabCarrier.prototype.saveBeforeDeath = function () {
        var _this = this;
        if (this.labManager.mainRoom.terminal && this.creep.transfer(this.labManager.mainRoom.terminal, _.filter(_.keys(this.creep.carry), function (r) { return _this.creep.carry[r] > 0; })[0]) == ERR_NOT_IN_RANGE)
            this.creep.moveTo(this.labManager.mainRoom.terminal);
    };
    LabCarrier.prototype.tick = function () {
        if (this.creep.ticksToLive <= 20 && _.sum(this.creep.carry) > 0) {
            this.saveBeforeDeath();
        }
        if (this.creep.carry.energy > 0) {
            this.dropOffEnergy();
        }
        else if (_.sum(this.creep.carry) > 0) {
            this.dropOffResource();
        }
        else
            this.pickUp();
    };
    return LabCarrier;
}());
/// <reference path="../structures/myLab.ts" />
/// <reference path="../creeps/labCarrier/labCarrierDefinition.ts" />
/// <reference path="../creeps/labCarrier/labCarrier.ts" />
/// <reference path="./manager.ts" />
var LabManager = (function (_super) {
    __extends(LabManager, _super);
    function LabManager(mainRoom) {
        _super.call(this, LabManager.staticTracer);
        this.mainRoom = mainRoom;
        this._creeps = { time: -1, creeps: null };
        this._publish = null;
        Colony.reactionManager.registerLabManager(this);
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
                var labs = this.mainRoom.room.find(FIND_MY_STRUCTURES, { filter: function (s) { return s.structureType == STRUCTURE_LAB && s.isActive(); } });
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
    Object.defineProperty(LabManager, "staticTracer", {
        get: function () {
            if (LabManager._staticTracer == null) {
                LabManager._staticTracer = new Tracer('LabManager');
                Colony.tracers.push(LabManager._staticTracer);
            }
            return LabManager._staticTracer;
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
    LabManager.prototype._preTick = function () {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if (_.any(this.myLabs, function (x) { return x.memory.mode != 0 /* available */; }) && this.creeps.length == 0) {
            var body = LabCarrierDefinition.getDefinition(this.mainRoom.maxSpawnEnergy);
            this.mainRoom.spawnManager.addToQueue(body.getBody(), { role: 'labCarrier' });
        }
    };
    LabManager.prototype._tick = function () {
        var _this = this;
        _.forEach(this.myLabs, function (x) { return x.tick(); });
        this.requiredPublishs = [];
        _.forEach(_.map(_.filter(this.mainRoom.creeps, function (c) { return c.memory.requiredBoosts && _.size(c.memory.requiredBoosts) > 0; }), function (c) { return c.memory.requiredBoosts; }), function (c) {
            for (var resource in c) {
                if (c[resource].amount > 0 && _this.requiredPublishs.indexOf(resource) < 0)
                    _this.requiredPublishs.push(resource);
            }
        });
        this.setupPublishs();
        this.restorePublishs();
        _.forEach(this.creeps, function (x) { return new LabCarrier(x, _this).tick(); });
    };
    LabManager.prototype.setupPublishs = function () {
        var _this = this;
        var _loop_7 = function(resource) {
            if (_.any(this_6.myLabs, function (l) { return l.memory.mode & 4 /* publish */ && l.memory.resource == resource; }))
                return "continue";
            var lab = _.filter(this_6.myLabs, function (l) { return l.memory.mode & 2 /* reaction */ && l.memory.resource == resource; })[0];
            if (lab) {
                lab.backupPublish();
                lab.memory.mode |= 1 /* import */ | 4 /* publish */;
                return "continue";
            }
            lab = _.sortBy(_.filter(this_6.myLabs, function (l) { return l.memory.mode == 0 /* available */; }), function (l) { return l.lab.mineralType == resource ? 0 : 1; })[0];
            if (lab) {
                lab.backupPublish();
                lab.memory.mode = 1 /* import */ | 4 /* publish */;
                lab.memory.resource = resource;
                return "continue";
            }
            lab = _.filter(this_6.myLabs, function (l) { return _.all(_this.myLabs, function (other) { return other.memory.reactionLabIds.indexOf(l.id) < 0; }); })[0];
            if (lab) {
                lab.backupPublish();
                lab.memory.mode = 1 /* import */ | 4 /* publish */;
                lab.memory.resource = resource;
                lab.memory.reactionLabIds = [];
                return "continue";
            }
            lab = _.sortBy(_.filter(this_6.myLabs, function (l) { return ~(l.memory.mode & 4 /* publish */); }), function (l) { return l.lab.mineralAmount; })[0];
            if (lab) {
                lab.backupPublish();
                lab.memory.mode = 1 /* import */ | 4 /* publish */;
                lab.memory.resource = resource;
                lab.memory.reactionLabIds = [];
                return "continue";
            }
        };
        var this_6 = this;
        for (var _i = 0, _a = this.requiredPublishs; _i < _a.length; _i++) {
            var resource = _a[_i];
            var state_7 = _loop_7(resource);
            if (state_7 === "continue") continue;
        }
    };
    LabManager.prototype.restorePublishs = function () {
        var _this = this;
        _.forEach(_.filter(this.myLabs, function (l) { return l.memory.mode & 4 /* publish */ && _this.requiredPublishs.indexOf(l.memory.resource) < 0; }), function (l) {
            l.restorePublish();
        });
    };
    return LabManager;
}(Manager));
/// <reference path="../myCreep.ts" />
var KeeperBuster = (function (_super) {
    __extends(KeeperBuster, _super);
    function KeeperBuster(mainRoom, creep) {
        _super.call(this, creep);
        this.mainRoom = mainRoom;
        this.creep = creep;
    }
    Object.defineProperty(KeeperBuster.prototype, "memory", {
        get: function () { return this.creep.memory; },
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
        if (this.memory.targetId != null) {
            var keeper = Game.getObjectById(this.memory.targetId);
            if (keeper == null || keeper.hits <= 100)
                this.memory.targetId = null;
        }
        if (keeper == null) {
            var keepers = _.filter(this.myRoom.hostileScan.creeps, function (c) { return c.owner == 'Invader'; });
            if (keepers.length == 0)
                keepers = _.map(this.myRoom.hostileScan.keepers, function (x) { return x; });
            var keeperInfo = _.sortBy(keepers, function (x) { return _this.creep.pos.findPathTo(x.pos).length; })[0];
            if (keeperInfo) {
                keeper = keeperInfo.creep;
                this.memory.targetId = keeperInfo.id;
            }
        }
        if (keeper) {
            if (this.creep.rangedAttack(keeper) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(keeper);
        }
        else {
            var keepers_1 = _.map(this.myRoom.hostileScan.keepers, function (k) { return k.creep; });
            var keeperCreep_1 = _.filter(keepers_1, function (k) { return k.ticksToLive > 200 && _.any(keepers_1, function (k2) { return k2.ticksToLive > 200 && k2 != k && k.ticksToLive > k2.ticksToLive - 100 && k.ticksToLive < k2.ticksToLive + 100; }); })[0];
            if (keeperCreep_1) {
                var closestByTime = _.sortBy(_.filter(keepers_1, function (k) { return k != keeperCreep_1; }), function (k) { return Math.abs(keeperCreep_1.ticksToLive - k.ticksToLive); })[0];
                if (!this.creep.pos.inRangeTo(keeperCreep_1.pos, 3))
                    this.creep.moveTo(keeperCreep_1);
                this.creep.say('WAIT');
                if (closestByTime.ticksToLive == 200)
                    this.creep.rangedAttack(keeperCreep_1);
            }
            else if (_.size(this.myRoom.hostileScan.creeps) > 0) {
                var creep = _.sortBy(_.map(this.myRoom.hostileScan.creeps, function (x) { return x.creep; }), function (x) { return Math.pow((x.pos.x - _this.creep.pos.x), 2) + Math.pow((x.pos.y - _this.creep.pos.y), 2); })[0];
                if (this.creep.rangedAttack(creep) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(creep);
            }
            else {
                var nextKeeperLair = _.sortBy(this.myRoom.room.find(FIND_HOSTILE_STRUCTURES, {
                    filter: function (x) { return x.structureType == STRUCTURE_KEEPER_LAIR; }
                }), function (lair) { return lair.ticksToSpawn; })[0];
                if (nextKeeperLair && !this.creep.pos.inRangeTo(nextKeeperLair.pos, 3)) {
                    this.creep.moveTo(nextKeeperLair);
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
        var requiredHealAmount = 10 * RANGED_ATTACK_POWER;
        var requiredHealModules = requiredHealAmount / HEAL_POWER;
        for (var resource in resources) {
            console.log('Creating KeeperBuster: Resource ' + resource + ': ' + resources[resource]);
        }
        var boostCompound = _.filter(_.sortByOrder(ReactionManager.BOOSTPOWERS['heal'].resources, [function (r) { return r.resource; }], ['desc']), function (r) { return resources[r.resource] >= Math.ceil(requiredHealModules / r.factor) * LAB_BOOST_MINERAL; })[0];
        if (boostCompound) {
            requiredHealModules = Math.ceil(requiredHealModules / boostCompound.factor);
            body.boosts[boostCompound.resource] = { compound: boostCompound.resource, amount: requiredHealModules };
        }
        body.heal = requiredHealModules;
        var rangedAttackModules = 3;
        boostCompound = _.filter(_.sortByOrder(ReactionManager.BOOSTPOWERS['rangedAttack'].resources, [function (r) { return r.resource; }], ['desc']), function (r) { return resources[r.resource] >= Math.ceil(requiredHealModules / r.factor) * LAB_BOOST_MINERAL; })[0];
        if (boostCompound) {
            body.boosts[boostCompound.resource] = { compound: boostCompound.resource, amount: requiredHealModules };
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
var SourceKeeperManager = (function (_super) {
    __extends(SourceKeeperManager, _super);
    function SourceKeeperManager(mainRoom) {
        _super.call(this, SourceKeeperManager.staticTracer);
        this.mainRoom = mainRoom;
    }
    Object.defineProperty(SourceKeeperManager.prototype, "creeps", {
        get: function () {
            var trace = this.tracer.start('creeps()');
            if (this._creeps == null || this._creeps.time < Game.time)
                this._creeps = {
                    time: Game.time, creeps: this.mainRoom.creepsByRole('keeperBuster')
                };
            trace.stop();
            return this._creeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SourceKeeperManager, "staticTracer", {
        get: function () {
            if (SourceKeeperManager._staticTracer == null) {
                SourceKeeperManager._staticTracer = new Tracer('SourceKeeperManager');
                Colony.tracers.push(SourceKeeperManager._staticTracer);
            }
            return SourceKeeperManager._staticTracer;
        },
        enumerable: true,
        configurable: true
    });
    SourceKeeperManager.prototype._preTick = function () {
        var _this = this;
        if (this.mainRoom.spawnManager.isBusy) {
            return;
        }
        _.forEach(_.filter(this.mainRoom.allRooms, function (r) { return _.any(r.mySources, function (s) { return s.hasKeeper; }); }), function (myRoom) {
            if (_.filter(_this.creeps, function (c) { return c.memory.roomName == myRoom.name; }).length == 0) {
                var definition = KeeperBusterDefinition.getDefinition(_this.mainRoom.maxSpawnEnergy, _this.mainRoom.managers.labManager.availablePublishResources);
                if (definition != null) {
                    var memory = {
                        role: 'keeperBuster',
                        autoFlee: false,
                        requiredBoosts: definition.boosts,
                        handledByColony: false,
                        mainRoomName: _this.mainRoom.name,
                        roomName: myRoom.name,
                        path: null,
                        fleeing: null,
                        targetId: null
                    };
                    _this.mainRoom.spawnManager.addToQueue(definition.getBody(), memory);
                }
            }
        });
    };
    SourceKeeperManager.prototype._tick = function () {
        var _this = this;
        _.forEach(this.creeps, function (c) { return new KeeperBuster(_this.mainRoom, c).tick(); });
    };
    return SourceKeeperManager;
}(Manager));
var MyTower = (function () {
    function MyTower(tower, mainRoom) {
        this.tower = tower;
        this.mainRoom = mainRoom;
        if (MyTower.staticTracer == null) {
            MyTower.staticTracer = new Tracer('MyTower');
            Colony.tracers.push(MyTower.staticTracer);
        }
        this.tracer = MyTower.staticTracer;
    }
    MyTower.prototype.handleHostiles = function () {
        var _this = this;
        var trace = this.tracer.start('handleHostiles()');
        if (this.mainRoom.myRoom.requiresDefense) {
            var closestHostile = _.sortBy(_.filter(this.mainRoom.myRoom.hostileScan.creeps, function (e) { return e.owner !== 'Source Keeper'; }), function (x) { return Math.pow((x.pos.x - _this.tower.pos.x), 2) + Math.pow((x.pos.y - _this.tower.pos.y), 2); })[0];
            //var closestHostile = this.tower.pos.findClosestByRange<Creep>(FIND_HOSTILE_CREEPS, { filter: (e: Creep) => e.owner.username !== 'Source Keeper' && Body.getFromCreep(e).heal > 0 });
            if (closestHostile == null)
                closestHostile = _.sortBy(_.filter(this.mainRoom.myRoom.hostileScan.creeps, function (e) { return e.owner !== 'Source Keeper' && e.bodyInfo.totalAttackRate > 0; }), function (x) { return Math.pow((x.pos.x - _this.tower.pos.x), 2) + Math.pow((x.pos.y - _this.tower.pos.y), 2); })[0];
            if (closestHostile == null)
                closestHostile = _.sortBy(_.filter(this.mainRoom.myRoom.hostileScan.creeps, function (e) { return e.owner !== 'Source Keeper'; }), function (x) { return Math.pow((x.pos.x - _this.tower.pos.x), 2) + Math.pow((x.pos.y - _this.tower.pos.y), 2); })[0];
            if (closestHostile != null) {
                this.tower.attack(closestHostile.creep);
                trace.stop();
                return true;
            }
        }
        trace.stop();
        return false;
    };
    MyTower.prototype.handleWounded = function () {
        var trace = this.tracer.start('handleWounded()');
        var healTarget = this.mainRoom.room.find(FIND_MY_CREEPS, { filter: function (c) { return c.hits < c.hitsMax; } })[0];
        if (healTarget != null) {
            this.tower.heal(healTarget);
            trace.stop();
            return true;
        }
        trace.stop();
        return false;
    };
    MyTower.prototype.repairEmergencies = function () {
        if (Game.time % 20 != 0)
            return false;
        var trace = this.tracer.start('repairEmergencies()');
        if (this.tower.id != this.mainRoom.towers[0].id && !this.mainRoom.myRoom.requiresDefense) {
            trace.stop();
            return false;
        }
        var repairTarget = this.mainRoom.myRoom.emergencyRepairStructures[0];
        if (repairTarget != null && this.tower.energy > this.tower.energyCapacity / 2) {
            this.tower.repair(Game.getObjectById(repairTarget.id));
            trace.stop();
            return true;
        }
        trace.stop();
        return false;
    };
    MyTower.prototype.tick = function () {
        var trace = this.tracer.start('tick()');
        this.handleHostiles() || this.handleWounded() || this.repairEmergencies();
        trace.stop();
    };
    return MyTower;
}());
var MyObserver = (function () {
    function MyObserver(mainRoom) {
        this.mainRoom = mainRoom;
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
    MyObserver.prototype.tick = function () {
        if (!this.observer)
            return;
        if (this.memory.scanTime == Game.time - 1) {
            var roomName = this.getRoomName(this.roomIndex.x + this.memory.scannedX, this.roomIndex.y + this.memory.scannedY);
            var myRoom = Colony.getRoom(roomName);
            if (myRoom.memory.lastScanTime + 100 < Game.time) {
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
            this.memory.scanTime = Game.time;
            console.log('Scanning ' + this.getRoomName(this.roomIndex.x + this.memory.scannedX, this.roomIndex.y + this.memory.scannedY));
            this.observer.observeRoom(this.getRoomName(this.roomIndex.x + this.memory.scannedX, this.roomIndex.y + this.memory.scannedY));
        }
    };
    return MyObserver;
}());
var TraceResult = (function () {
    function TraceResult() {
        this.usedCpu = 0;
        this.startCPU = 0;
        this.count = 0;
    }
    TraceResult.prototype.stop = function () {
        this.usedCpu += (Game.cpu.getUsed() - this.startCPU);
        this.count++;
    };
    return TraceResult;
}());
var Tracer = (function () {
    function Tracer(name) {
        this.name = name;
        this.results = {};
    }
    ;
    Tracer.prototype.start = function (name) {
        var traceResult = this.results[name];
        if (traceResult == null) {
            traceResult = new TraceResult();
            traceResult.name = name;
            this.results[name] = traceResult;
        }
        traceResult.startCPU = Game.cpu.getUsed();
        return traceResult;
    };
    Tracer.prototype.print = function () {
        if (Memory['tracer'] == true || Memory['tracer'] == 'true') {
            console.log(this.name);
            for (var i in this.results) {
                var result = this.results[i];
                if (!Memory['traceThreshold'] || result.usedCpu >= Memory['traceThreshold'])
                    console.log('Trace CPU Used: ' + result.usedCpu.toFixed(2) + ' Count: ' + result.count + ': ' + this.name + ': ' + result.name);
            }
        }
    };
    Tracer.prototype.reset = function () {
        this.results = {};
    };
    return Tracer;
}());
/// <reference path="../structures/myLink.ts" />
/// <reference path="./spawnManager.ts" />
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
/// <reference path="../../tracer.ts" />
var MainRoom = (function () {
    function MainRoom(roomName) {
        var _this = this;
        //public get extractorContainerId() {
        //    if (this.room.controller.level < 6)
        //        return null;
        //    if (this.memory.extractorContainerId == null || this.memory.extractorContainerId.time + 100 < Game.time) {
        //        if (this.extractor != null && this.terminal != null) {
        //            let container = this.extractor.pos.findInRange<Container>(FIND_STRUCTURES, 2, { filter: (s: Structure) => s.structureType == STRUCTURE_CONTAINER })[0];
        //            if (container) {
        //                this._extractorContainer = {
        //                    time: Game.time, container: container
        //                };
        //                this.memory.extractorContainerId = {
        //                    time: Game.time, id: container.id
        //                }
        //            }
        //            else {
        //                let constructionSite = this.extractor.pos.findInRange<ConstructionSite>(FIND_CONSTRUCTION_SITES, 2, { filter: (s: ConstructionSite) => s.structureType == STRUCTURE_CONTAINER })[0];
        //                if (constructionSite == null) {
        //                    let pathToTerminal = PathFinder.search(this.extractor.pos, { pos: this.terminal.pos, range: 2 });
        //                    pathToTerminal.path[0].createConstructionSite(STRUCTURE_CONTAINER);
        //                }
        //            }
        //        }
        //    }
        //    if (this.memory.extractorContainerId)
        //        return this.memory.extractorContainerId.id;
        //    else return null;
        //}
        //private _extractorContainer: { time: number, container: Container };
        //public get extractorContainer() {
        //    let trace = this.tracer.start('Property extractorContainer');
        //    if ((this._extractorContainer == null || this._extractorContainer.time < Game.time) && this.extractorContainerId != null) {
        //        this._extractorContainer = { time: Game.time, container: Game.getObjectById<Container>(this.extractorContainerId) };
        //    }
        //    trace.stop();
        //    if (this._extractorContainer)
        //        return this._extractorContainer.container;
        //    else return null;
        //}
        this._maxSpawnEnergy = { time: -101, maxSpawnEnergy: 300 };
        this._spawns = { time: -1, spawns: null };
        if (MainRoom.staticTracer == null) {
            MainRoom.staticTracer = new Tracer('MainRoom');
            Colony.tracers.push(MainRoom.staticTracer);
        }
        //this.tracer = new Tracer('MySource ' + id);
        this.tracer = MainRoom.staticTracer;
        this.name = roomName;
        this.myRoom = Colony.getRoom(roomName);
        this.myRoom.mainRoom = this;
        if (this.myRoom.memory.mainRoomDistanceDescriptions == null)
            this.myRoom.memory.mainRoomDistanceDescriptions = {};
        this.myRoom.memory.mainRoomDistanceDescriptions[this.name] = { roomName: this.name, distance: 0 };
        //this.spawnNames = _.map(_.filter(Game.spawns, (s) => s.room.name == roomName), (s) => s.name);
        this.links = _.map(this.room.find(FIND_MY_STRUCTURES, { filter: function (x) { return x.structureType == STRUCTURE_LINK; } }), function (x) { return new MyLink(x, _this); });
        this.myObserver = new MyObserver(this);
        if (this.memory.mainPosition) {
            var pos = this.memory.mainPosition;
            this.mainPosition = new RoomPosition(pos.x, pos.y, roomName);
        }
        else {
            this.mainPosition = this.spawns[0].pos;
            this.memory.mainPosition = this.mainPosition;
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
                this._connectedRooms = { time: Game.time, rooms: _.filter(_.map(Colony.memory.rooms, function (r) { return Colony.getRoom(r.name); }), function (r) { return r.name != _this.name && r.mainRoom && r.mainRoom.name == _this.name; }) };
            return this._connectedRooms.rooms;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MainRoom.prototype, "harvestersShouldDeliver", {
        get: function () {
            if (this._harvestersShouldDeliver == null || this._harvestersShouldDeliver.time < Game.time)
                this._harvestersShouldDeliver = {
                    time: Game.time,
                    value: !this.mainContainer || (this.managers.energyHarvestingManager.sourceCarrierCreeps.length == 0 && this.mainContainer.store.energy < this.maxSpawnEnergy) || (this.managers.spawnFillManager.creeps.length == 0 && this.room.energyAvailable < 500)
                };
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
    Object.defineProperty(MainRoom.prototype, "minerals", {
        get: function () {
            var _this = this;
            if (this._minerals == null || this._minerals.time < Game.time) {
                this._minerals = { time: Game.time, minerals: _.indexBy(_.map(_.filter(this.allRooms, function (x) { return x.myMineral != null && (!x.myMineral.hasKeeper || _.size(_this.managers.labManager.myLabs) > 0) && x.myMineral.hasExtractor; }), function (x) { return x.myMineral; }), function (x) { return x.id; }) };
            }
            return this._minerals.minerals;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MainRoom.prototype, "terminal", {
        //_mineralId: string;
        //_mineral: { time: number, mineral: Mineral } = { time: -1, mineral: null }
        //public get mineral() {
        //    let trace = this.tracer.start('Property mineral');
        //    if (this._mineral.time < Game.time) {
        //        if (this._mineralId == null) {
        //            let mineral = this.room.find<Mineral>(FIND_MINERALS)[0];
        //            this._mineralId = mineral ? mineral.id : null;
        //        }
        //        this._mineral = { time: Game.time, mineral: Game.getObjectById<Mineral>(this._mineralId) };
        //    }
        //    trace.stop();
        //    return this._mineral.mineral;
        //}
        //private _extractor: { time: number, extractor: StructureExtractor } = { time: -1, extractor: null };
        //public get extractor() {
        //    let trace = this.tracer.start('Property extractor');
        //    if (this._extractor.time < Game.time) {
        //        if (this.mineral) {
        //            let extractor = this.mineral.pos.lookFor<StructureExtractor>(LOOK_STRUCTURES)[0];
        //            if (extractor == null && CONTROLLER_STRUCTURES.extractor[this.room.controller.level] > 0) {
        //                let construction = this.mineral.pos.lookFor<StructureExtractor>(LOOK_CONSTRUCTION_SITES)[0];
        //                if (construction == null)
        //                    this.mineral.pos.createConstructionSite(STRUCTURE_EXTRACTOR);
        //                this._extractor = { time: Game.time, extractor: null };
        //            }
        //            else
        //                this._extractor = { time: Game.time, extractor: extractor };
        //        }
        //        else
        //            this._extractor = { time: Game.time, extractor: null };
        //    }
        //    trace.stop();
        //    return this._extractor.extractor;
        //}
        get: function () {
            return this.room.terminal;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MainRoom.prototype, "maxSpawnEnergy", {
        get: function () {
            //let trace = this.tracer.start('Property maxSpawnEnergy');
            if (this.mainContainer == null || this.managers.spawnFillManager.creeps.length == 0 || this.mainContainer.store.energy == 0 && this.managers.energyHarvestingManager.harvesterCreeps.length == 0) {
                //trace.stop();
                return 300;
            }
            //if (this._maxSpawnEnergy.time + 100 < Game.time)
            //    this._maxSpawnEnergy = {
            //        //time: Game.time, maxSpawnEnergy: this.getMaxSpawnEnergy()
            //        time: Game.time, maxSpawnEnergy: this.room.energyCapacityAvailable
            //    };
            //trace.stop();
            return this.room.energyCapacityAvailable;
            //return this._maxSpawnEnergy.maxSpawnEnergy;
            //return 400;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MainRoom.prototype, "creeps", {
        get: function () {
            var _this = this;
            //let trace = this.tracer.start('Property creeps');
            if (this._creeps == null || this._creeps.time < Game.time)
                this._creeps = {
                    time: Game.time, creeps: _.filter(Game.creeps, function (c) { return c.memory.mainRoomName === _this.name && !c.memory.handledByColony; })
                };
            //trace.stop();
            return this._creeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    MainRoom.prototype.creepsByRole = function (role) {
        //let trace = this.tracer.start('Property creepsByRole');
        if (this._creepsByRole == null || this._creepsByRole.time < Game.time)
            this._creepsByRole = { time: Game.time, creeps: _.groupBy(this.creeps, function (c) { return c.memory.role; }) };
        //trace.stop(); 
        if (this._creepsByRole.creeps[role] != null) {
            //console.log(role + ': Exists [' + _.size(this._creepsByRole.creeps[role])+']');
            return this._creepsByRole.creeps[role];
        }
        else {
            //console.log(role + ': None');
            return [];
        }
        //return this._creepsByRole.creeps[role] ? _.clone(this._creepsByRole.creeps[role]) : new Array();
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
                mainPosition: null,
                spawnManager: null,
                constructionManager: null,
                repairManager: null,
                upgradeManager: null,
                spawnFillManager: null,
                energyHarvestingManager: null,
                defenseManager: null,
                reservationManager: null,
                roadConstructionManager: null,
                towerManager: null,
                mainContainerId: null,
                terminalManager: null,
                labManager: null,
                extractorContainerId: null,
                myObserver: null,
                harvestingActive: null
            };
        return Colony.memory.mainRooms[this.name];
    };
    MainRoom.prototype.placeMainContainer = function () {
        if (Memory['verbose'])
            console.log('SpawnRoomHandler.placeMainContainer');
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
        if (Memory['verbose'])
            console.log('SpawnRoomHandler.placeStorage');
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
        var trace = this.tracer.start('checkCreeps()');
        this.managers.towerManager.preTick();
        this.managers.labManager.preTick();
        this.managers.sourceKeeperManager.preTick();
        this.managers.reservationManager.preTick();
        this.managers.spawnFillManager.preTick();
        this.managers.linkFillerManager.preTick();
        this.managers.defenseManager.preTick();
        this.managers.energyHarvestingManager.preTick();
        this.managers.repairManager.preTick();
        this.managers.constructionManager.preTick();
        this.managers.terminalManager.preTick();
        this.managers.mineralHarvestingManager.preTick();
        this.managers.upgradeManager.preTick();
        trace.stop();
    };
    MainRoom.prototype.tickCreeps = function () {
        var trace = this.tracer.start('tickCreeps()');
        this.managers.spawnFillManager.tick();
        this.managers.linkFillerManager.tick();
        this.managers.repairManager.tick();
        this.managers.constructionManager.tick();
        this.managers.energyHarvestingManager.tick();
        this.managers.upgradeManager.tick();
        this.managers.defenseManager.tick();
        this.managers.reservationManager.tick();
        this.managers.towerManager.tick();
        this.managers.terminalManager.tick();
        this.managers.mineralHarvestingManager.tick();
        try {
            this.managers.labManager.tick();
        }
        catch (e) {
            console.log(e.stack);
        }
        this.managers.sourceKeeperManager.tick();
        trace.stop();
    };
    MainRoom.prototype.tick = function () {
        var _this = this;
        //console.log('Memory Test= ' + JSON.stringify(Memory['colony']['rooms']['E21S22']['test']));
        console.log();
        console.log('MainRoom ' + this.name + ': ' + this.creeps.length + ' creeps');
        if (Memory['verbose'])
            console.log('SpawnRoomHandler.tick');
        if (this.room == null)
            return;
        this.links.forEach(function (x) { return x.tick(); });
        //if (Memory['trace'])
        //    startCpu = Game.cpu.getUsed();
        //if (this.mainContainer && this.room.controller.level > 1)
        //    this.creepManagers.harvestingManager.placeSourceContainers();
        //if (Memory['trace']) {
        //    endCpu = Game.cpu.getUsed();
        //    if ((endCpu - startCpu) > Colony.memory.traceThreshold)
        //        console.log('HarvestingManager.placeSourceContainers: ' + (endCpu - startCpu).toFixed(2));
        //}
        if (this.mainContainer)
            this.roadConstructionManager.tick();
        //if (Memory['trace'])
        //    startCpu = Game.cpu.getUsed();
        //this.allRooms.forEach(r => r.scanForHostiles());
        //if (Memory['trace']) {
        //    endCpu = Game.cpu.getUsed();
        //    console.log('MainRoom.scanForHostiles: ' + (endCpu - startCpu).toFixed(2));
        //}
        if (this.creeps.length > 0)
            this.checkCreeps();
        else
            this.managers.energyHarvestingManager.preTick();
        this.spawnManager.spawn();
        this.room.find(FIND_MY_STRUCTURES, { filter: function (x) { return x.structureType == STRUCTURE_TOWER; } }).forEach(function (x) { return new MyTower(x, _this).tick(); });
        this.tickCreeps();
        this.myObserver.tick();
        if (Game.time % 100 == 0) {
            if (Memory['trace'])
                for (var idx in this.allRooms) {
                    var myRoom = this.allRooms[idx];
                    myRoom.refresh();
                }
        }
    };
    return MainRoom;
}());
var METRICSOURCEDISTANCE = 1;
var METRICSOURCE = 0.5;
var METRICROOM = 0;
var MAXMETRIC = 10;
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
        var value = METRICROOM + (_.size(myRoom.mySources) * ((myRoom.memory.mainRoomDistanceDescriptions[this.mainRoom.name].distance * METRICSOURCEDISTANCE) + METRICSOURCE));
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
        this.forbidden = [];
        this.assignments = {};
        this.roomsToAssign = {};
        this.rooms = Colony.getAllRooms();
        this.mainRooms = Colony.mainRooms;
        _.forEach(this.mainRooms, function (x) { return _this.assignments[x.name] = new RoomAssignment(x); });
        _.forEach(_.filter(this.rooms, this.roomFilter.bind(this)), function (x) { return _this.roomsToAssign[x.name] = x; });
    }
    RoomAssignmentHandler.prototype.roomFilter = function (myRoom) {
        return _.every(this.forbidden, function (x) { return x != myRoom.name; }) && !Game.map.isRoomProtected(myRoom.name) && _.size(myRoom.mySources) > 0 && !myRoom.memory.foreignOwner && !myRoom.memory.foreignReserver && _.min(myRoom.memory.mainRoomDistanceDescriptions, function (x) { return x.distance; }).distance <= MAXDISTANCE;
    };
    RoomAssignmentHandler.prototype.assignRoomsByMinDistance = function () {
        var _this = this;
        var avaiableResources = RESOURCES_ALL; //_.map(Colony.mainRooms, mainRoom => mainRoom.myRoom.myMineral.resource);
        var sortedRooms = _.sortByOrder(_.values(this.roomsToAssign), [
            function (x) { return _.min(x.memory.mainRoomDistanceDescriptions, function (y) { return y.distance; }).distance == 0 ? 0 : 1; },
            function (x) { return _.min(x.memory.mainRoomDistanceDescriptions, function (y) { return y.distance; }).distance; },
            function (x) { return x.useableSources.length; },
            function (x) { return (x.myMineral && x.myMineral.hasKeeper && avaiableResources.indexOf(x.myMineral.resource) < 0) ? 0 : 1; },
            function (x) { return _.size(x.mySources); }
        ], ['asc', 'desc', 'asc', 'asc', 'desc']);
        console.log('Assigning MyRooms: ' + _.map(sortedRooms, function (x) { return x.name; }).join(', '));
        _.forEach(sortedRooms, function (myRoom) {
            var possibleMainRooms = _.filter(myRoom.memory.mainRoomDistanceDescriptions, function (x) { return x.distance <= MAXDISTANCE && (myRoom.useableSources.length > 0 || Colony.mainRooms[x.roomName].room.controller.level >= 6) && _this.assignments[x.roomName].canAssignRoom(myRoom); });
            console.log('Room: [' + myRoom.name + '] Distances to MainRooms [' + _.map(possibleMainRooms, function (x) { return x.roomName + ' ' + x.distance; }).join(', ') + ']');
            console.log('Room: [' + myRoom.name + '] Possible MainRooms [' + _.map(possibleMainRooms, function (x) { return x.roomName; }).join(', ') + ']');
            var sorted = _.sortBy(possibleMainRooms, function (x) { return x.distance; });
            if ((sorted.length == 1 || sorted.length >= 1 && sorted[0].distance < sorted[1].distance) && myRoom.memory.mainRoomDistanceDescriptions[sorted[0].roomName].distance == _.min(myRoom.memory.mainRoomDistanceDescriptions, function (x) { return x.distance; }).distance) {
                console.log('Assigning: ' + sorted[0].roomName);
                console.log('Trying to add room [' + myRoom.name + '] to mainRoom [' + sorted[0].roomName + ']');
                if (_this.assignments[sorted[0].roomName].tryAddRoom(myRoom))
                    delete _this.roomsToAssign[myRoom.name];
            }
        });
    };
    RoomAssignmentHandler.prototype.getMainRoomCandidates = function () {
        var _this = this;
        var mainRoomCandidates = {};
        _.forEach(this.roomsToAssign, function (myRoom) {
            _.forEach(myRoom.memory.mainRoomDistanceDescriptions, function (distanceDescription) {
                if (distanceDescription.distance <= MAXDISTANCE && (Colony.mainRooms[distanceDescription.roomName].room.controller.level >= 6 || myRoom.useableSources.length > 0) && _this.assignments[distanceDescription.roomName].canAssignRoom(myRoom)) {
                    if (mainRoomCandidates[distanceDescription.roomName] == null)
                        mainRoomCandidates[distanceDescription.roomName] = {
                            mainRoom: _this.mainRooms[distanceDescription.roomName],
                            myRooms: {}
                        };
                    mainRoomCandidates[distanceDescription.roomName].myRooms[myRoom.name] = myRoom;
                }
            });
        });
        return mainRoomCandidates;
    };
    RoomAssignmentHandler.prototype.assignCollisions = function () {
        var _this = this;
        var avaiableResources = RESOURCES_ALL; //_.map(Colony.mainRooms, mainRoom => mainRoom.myRoom.myMineral.resource);
        var mainRoomCandidates = this.getMainRoomCandidates();
        Memory['MainRoomCandidates'] = _.map(mainRoomCandidates, function (x) {
            return { mainRoom: x.mainRoom.name, myRooms: _.map(x.myRooms, function (y) { return y.name; }) };
        });
        var _loop_8 = function() {
            var candidate = _.sortByAll(_.filter(mainRoomCandidates, function (x) { return x; }), [function (x) { return _.size(x.mainRoom.connectedRooms); }, function (x) { return _.size(x.myRooms); }, function (x) { return _this.assignments[x.mainRoom.name].freeMetric; }])[0];
            var rooms = _.sortByAll(_.values(candidate.myRooms), [function (x) { return (candidate.mainRoom.room.controller.level >= 6 && x.myMineral && x.myMineral.hasKeeper && avaiableResources.indexOf(x.myMineral.resource) < 0) ? 0 : 1; }, function (x) { return 10 - (candidate.mainRoom.room.controller.level >= 6 ? _.size(x.mySources) : _.size(x.useableSources)); }, function (x) { return x.name; }]);
            console.log('Candidate: ' + candidate.mainRoom.name + ' Rooms: ' + _.map(rooms, function (x) { return x.name; }).join(', '));
            this_7.assignments[candidate.mainRoom.name].tryAddRoom(rooms[0]);
            delete this_7.roomsToAssign[rooms[0].name];
            mainRoomCandidates = this_7.getMainRoomCandidates();
        };
        var this_7 = this;
        while (_.size(mainRoomCandidates) > 0) {
            _loop_8();
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
    RoomAssignmentHandler.prototype.assignRooms = function () {
        try {
            var assignments = this.getAssignments();
            var stringResult = _.map(assignments, function (x) {
                return {
                    mainRoom: x.mainRoom.name,
                    rooms: _.map(x.myRooms, function (y) { return y.name; }),
                    metric: x.metric
                };
            });
            console.log('Assigning Rooms');
            _.forEach(this.rooms, function (x) { return x.mainRoom = null; });
            _.forEach(assignments, function (assignment) { return _.forEach(assignment.myRooms, function (myRoom) { return myRoom.mainRoom = assignment.mainRoom; }); });
            //_.forEach(_.filter(this.rooms, room => room.mainRoom == null && _.any(room.memory.mainRoomDistanceDescriptions, x => x.distance == 1) && !room.memory.foreignOwner && !room.memory.foreignReserver), room => {
            //    let mainRoom = this.mainRooms[_.min(room.memory.mainRoomDistanceDescriptions, x => x.distance).roomName];
            //    room.mainRoom = mainRoom;
            //});
            Memory['RoomAssignment'] = stringResult;
        }
        catch (e) {
            console.log('ERRROR: ROOMASSIGNMENT ' + e.stack);
            Memory['RoomAssignmentError'] = JSON.parse(JSON.stringify(e));
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
        new SpawnConstructor(creep).tick();
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
        if (Memory['verbose'] || this.memory.verbose)
            console.log('Claiming Manager[' + this.roomName + '].checkScouts()');
        if (myRoom == null || myRoom.memory.lastScanTime < Game.time - 500) {
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
        if (Memory['verbose'] || this.memory.verbose)
            console.log('Claiming Manager[' + this.roomName + '].checkSpawnConstructors()');
        if (myRoom == null)
            return false;
        var mainRoom = myRoom.closestMainRoom;
        if (mainRoom == null)
            return false;
        var needCreeps = false;
        var sources = _.filter(myRoom.mySources, function (x) { return x.hasKeeper == false; });
        var _loop_9 = function(idx) {
            var mySource = sources[idx];
            var creepCount = _.filter(this_8.spawnConstructors, function (x) { return x.memory.sourceId == mySource.id; }).length;
            if (creepCount < 2) {
                mainRoom.spawnManager.addToQueue(['work', 'work', 'work', 'work', 'work', 'carry', 'carry', 'carry', 'carry', 'carry', 'carry', 'carry', 'carry', 'carry', 'carry', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move', 'move'], { handledByColony: true, claimingManager: this_8.roomName, role: 'spawnConstructor', targetPosition: this_8.targetPosition, sourceId: mySource.id }, 2 - creepCount);
                needCreeps = true;
            }
        };
        var this_8 = this;
        for (var idx in sources) {
            _loop_9(idx);
        }
        return !needCreeps;
    };
    ClaimingManager.prototype.finishClaimingManager = function () {
        var mainRoom = new MainRoom(this.roomName);
        Colony.mainRooms[this.roomName] = mainRoom;
        var myRoom = Colony.getRoom(this.roomName);
        myRoom.mainRoom = mainRoom;
        myRoom.memory.mainRoomName = this.roomName;
        myRoom.memory.mainRoomDistanceDescriptions[this.roomName] = { roomName: this.roomName, distance: 0 };
        for (var idx in this.scouts)
            this.scouts[idx].suicide();
        for (var idx in this.claimers)
            this.claimers[idx].suicide();
        var sourceArray = _.values(myRoom.mySources);
        for (var idx = 0; idx < this.spawnConstructors.length; idx++) {
            var creep = this.spawnConstructors[idx];
            creep.memory.role = 'harvester';
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
        if (Memory['verbose'] || this.memory.verbose)
            console.log('Claiming Manager[' + this.roomName + '].tick');
        this.creeps = _.filter(Game.creeps, function (x) { return x.memory.handledByColony == true && x.memory.claimingManager == _this.roomName; });
        this.scouts = _.filter(this.creeps, function (x) { return x.memory.targetPosition.roomName == _this.targetPosition.roomName && x.memory.role == 'scout'; });
        this.spawnConstructors = _.filter(this.creeps, function (x) { return x.memory.role == 'spawnConstructor'; });
        this.claimers = _.filter(this.creeps, function (x) { return x.memory.role == 'claimer'; });
        if (Memory['verbose'] || this.memory.verbose) {
            console.log('Claiming Manager[' + this.roomName + '] Scouts: ' + this.scouts.length);
            console.log('Claiming Manager[' + this.roomName + '] Spawn Constructors: ' + this.spawnConstructors.length);
            console.log('Claiming Manager[' + this.roomName + '] Claimers: ' + this.claimers.length);
        }
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
        if (ReactionManager.staticTracer == null) {
            ReactionManager.staticTracer = new Tracer('ReactionManager');
            Colony.tracers.push(ReactionManager.staticTracer);
        }
        //this.tracer = new Tracer('MySource ' + id);
        this.tracer = ReactionManager.staticTracer;
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
            var trace = this.tracer.start('Property publishableCompounds');
            if (this.memory.publishableCompounds == null || this.highestPowerCompounds == null || this.memory.publishableCompounds.time + 500 < this.memory.highestPowerCompounds.time) {
                var compounds = _.uniq(this.highestPowerCompounds.concat(_.filter(RESOURCES_ALL, function (r) { return _this.ingredients[r] && _this.ingredients[r].indexOf(RESOURCE_CATALYST) >= 0; })));
                this.memory.publishableCompounds = { time: this.memory.highestPowerCompounds.time, compounds: compounds };
            }
            trace.stop();
            return this.memory.publishableCompounds.compounds;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ReactionManager.prototype, "highestPowerCompounds", {
        get: function () {
            var _this = this;
            var trace = this.tracer.start('Property highestPowerCompounds');
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
            trace.stop();
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
            return _.any(Colony.mainRooms, function (mainRoom) { return _.any(mainRoom.minerals, function (m) { return m.resource == resource; }) && mainRoom.room.controller.level >= 6; }) || this.getAvailableResourceAmount(resource) > requiredAmount;
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
        if (this.ingredients[resource] == null || this.totalStorage(resource) >= this.requiredAmount)
            return true;
        var bestManager = _.sortByAll(_.filter(_.map(this.labManagers, function (x) {
            return { manager: x, requiredLabs: x.requiredLabsForReaction(resource) };
        }), function (x) { return x.requiredLabs != null; }), [function (x) { return x.requiredLabs; }, function (x) { return CONTROLLER_STRUCTURES.lab[8] - x.manager.freeLabs.length; }])[0];
        if (bestManager) {
            bestManager.manager.addReaction(resource);
            _.forEach(this.ingredients[resource], function (r) {
                if (!_this.setupProcess(r))
                    return false;
            });
            return true;
        }
        return false;
    };
    ReactionManager.prototype.setupProcessChain = function (resource) {
        var _this = this;
        console.log('Reaction Manager: Setup process chain ' + resource);
        this.backup();
        if (!this.setupProcess(resource)) {
            this.restore();
            _.forEach(this.ingredients[resource], function (r) {
                _this.setupProcessChain(r);
            });
        }
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
            console.log('Reaction Manager: Compounds to produce: ' + compoundsToProduce_1.join(','));
            _.forEach(compoundsToProduce_1, function (c) {
                var result = _this.setupProcessChain(c);
                if (result)
                    console.log('Reaction Manager: Succcessfully setup ' + c);
            });
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
                    var otherRoom = _.sortBy(_.filter(Colony.mainRooms, function (mainRoom) { return mainRoom.terminal && (mainRoom.terminal.store[resource] >= 4000 || (!mainRoom.managers.labManager || !(resource in mainRoom.managers.labManager.imports)) && mainRoom.terminal.store[resource] >= 2000); }), function (x) { return labManager.mainRoom.myRoom.memory.mainRoomDistanceDescriptions[x.name]; })[0];
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
/// <reference path="../../tracer.ts" />
/// <reference path="../../memoryObject.ts" />
/// <reference path="../../helpers.ts" />
var MySource = (function () {
    function MySource(id, myRoom) {
        this.id = id;
        this.myRoom = myRoom;
        this.memoryInitialized = false;
        this._room = { time: -1, room: null };
        this._source = { time: -1, source: null };
        if (MySource.staticTracer == null) {
            MySource.staticTracer = new Tracer('MySource');
            Colony.tracers.push(MySource.staticTracer);
        }
        //this.tracer = new Tracer('MySource ' + id);
        this.tracer = MySource.staticTracer;
        this.accessMemory();
    }
    Object.defineProperty(MySource.prototype, "memory", {
        get: function () {
            return this.accessMemory();
        },
        enumerable: true,
        configurable: true
    });
    MySource.prototype.accessMemory = function () {
        if (this.myRoom.memory.sources == null)
            this.myRoom.memory.sources = {};
        if (this.myRoom.memory.sources[this.id] == null) {
            this.myRoom.memory.sources[this.id] = {
                id: this.id,
                pos: this.source.pos,
                capacity: null,
                harvestingSpots: null,
                keeper: null,
                pathLengthToMainContainer: null,
                roadBuiltToRoom: null,
                linkId: null
            };
        }
        return this.myRoom.memory.sources[this.id];
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
    Object.defineProperty(MySource.prototype, "source", {
        get: function () {
            //let trace = this.tracer.start('Property source');
            if (this._source.time < Game.time)
                this._source = { time: Game.time, source: Game.getObjectById(this.id) };
            //trace.stop();
            return this._source.source;
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
            if (this.memory.harvestingSpots != null || this.source == null) {
                //trace.stop();
                return this.memory.harvestingSpots;
            }
            else {
                var pos = this.source.pos;
                var spots = _.filter(this.source.room.lookForAtArea(LOOK_TERRAIN, pos.y - 1, pos.x - 1, pos.y + 1, pos.x + 1, true), function (x) { return x.terrain == 'swamp' || x.terrain == 'plain'; }).length;
                this.memory.harvestingSpots = spots;
                //trace.stop();
                return spots;
            }
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
    Object.defineProperty(MySource.prototype, "hasKeeper", {
        get: function () {
            //let trace = this.tracer.start('Property keeper');
            if (this.memory.keeper != null || !this.room) {
                //trace.stop();
                return this.memory.keeper;
            }
            else {
                this.memory.keeper = this.source.pos.findInRange(FIND_STRUCTURES, 5, { filter: function (s) { return s.structureType == STRUCTURE_KEEPER_LAIR; } }).length > 0;
                //trace.stop();
                return this.memory.keeper;
            }
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
            return this.memory.roadBuiltToRoom;
        },
        set: function (value) {
            this.memory.roadBuiltToRoom = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "pathLengthToDropOff", {
        get: function () {
            var trace = this.tracer.start('Property pathLengthToMainContainer');
            if ((this._pathLengthToMainContainer == null || this._pathLengthToMainContainer.time + 500 < Game.time) && this.source)
                if (this.memory.pathLengthToMainContainer && this.memory.pathLengthToMainContainer.time + 500 < Game.time) {
                    this._pathLengthToMainContainer = this.memory.pathLengthToMainContainer;
                }
                else {
                    this._pathLengthToMainContainer = {
                        time: Game.time,
                        length: PathFinder.search(this.myRoom.mainRoom.spawns[0].pos, { pos: this.source.pos, range: 4 }, { roomCallback: Colony.getTravelMatrix }).path.length
                    };
                    this.memory.pathLengthToMainContainer = this._pathLengthToMainContainer;
                }
            trace.stop();
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
                this.memory.capacity = this.source.energyCapacity;
                this._capacityLastFresh = Game.time;
            }
            //trace.stop();
            return this.memory.capacity;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "link", {
        get: function () {
            //let trace = this.tracer.start('Property link');
            if (!this.myRoom.mainRoom || this.myRoom.name != this.myRoom.mainRoom.name)
                return null;
            if (this._link == null || this._link.time < Game.time) {
                if (this.memory.linkId) {
                    var link = Game.getObjectById(this.memory.linkId.id);
                    if (link)
                        this._link = { time: Game.time, link: link };
                    else
                        this.memory.linkId = null;
                }
                if (this.memory.linkId == null || this.memory.linkId.time + 100 < Game.time) {
                    var link = this.source.pos.findInRange(FIND_MY_STRUCTURES, 4, { filter: function (x) { return x.structureType == STRUCTURE_LINK; } })[0];
                    if (link) {
                        this._link = { time: Game.time, link: link };
                        this.memory.linkId = { time: Game.time, id: link.id };
                    }
                    else
                        this.memory.linkId = { time: Game.time, id: null };
                }
            }
            //trace.stop();
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
        if (MyMineral.staticTracer == null) {
            MyMineral.staticTracer = new Tracer('MyMineral');
            Colony.tracers.push(MyMineral.staticTracer);
        }
        //this.tracer = new Tracer('MySource ' + id);
        this.tracer = MyMineral.staticTracer;
    }
    Object.defineProperty(MyMineral.prototype, "memory", {
        get: function () {
            return this.accessMemory();
        },
        enumerable: true,
        configurable: true
    });
    MyMineral.prototype.accessMemory = function () {
        if (this.myRoom.memory.myMineral == null) {
            var mineral = Game.getObjectById(this.id);
            this.myRoom.memory.myMineral = {
                id: this.id,
                amount: mineral.mineralAmount,
                refreshTime: mineral.ticksToRegeneration ? mineral.ticksToRegeneration + Game.time : null,
                keeper: null,
                pathLengthToTerminal: null,
                pos: mineral.pos,
                terminalRoadBuiltTo: null,
                resource: mineral.mineralType,
                hasExtractor: null,
                harvestingSpots: null
            };
        }
        return this.myRoom.memory.myMineral;
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
            var trace = this.tracer.start('Property mineral');
            var mineral = Game.getObjectById(this.id);
            trace.stop();
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
            return this.memory.terminalRoadBuiltTo;
        },
        set: function (value) {
            this.memory.terminalRoadBuiltTo = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyMineral.prototype, "maxHarvestingSpots", {
        get: function () {
            //let trace = this.tracer.start('Property maxHarvestingSpots');
            if (this.memory.harvestingSpots != null || this.mineral == null) {
                //trace.stop();
                return this.memory.harvestingSpots;
            }
            else {
                var pos = this.mineral.pos;
                var spots = _.filter(this.mineral.room.lookForAtArea(LOOK_TERRAIN, pos.y - 1, pos.x - 1, pos.y + 1, pos.x + 1, true), function (x) { return x.terrain == 'swamp' || x.terrain == 'plain'; }).length;
                this.memory.harvestingSpots = spots;
                //trace.stop();
                return spots;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyMineral.prototype, "pathLengthToDropOff", {
        get: function () {
            var trace = this.tracer.start('Property pathLengthToMainContainer');
            if ((this._pathLengthToTerminal == null || this._pathLengthToTerminal.time + 500 < Game.time) && this.mineral)
                if (this.memory.pathLengthToTerminal && this.memory.pathLengthToTerminal.time + 500 < Game.time) {
                    this._pathLengthToTerminal = this.memory.pathLengthToTerminal;
                }
                else {
                    this._pathLengthToTerminal = {
                        time: Game.time,
                        length: PathFinder.search(this.myRoom.mainRoom.spawns[0].pos, { pos: this.mineral.pos, range: 4 }, { roomCallback: Colony.getTravelMatrix }).path.length
                    };
                    this.memory.pathLengthToTerminal = this._pathLengthToTerminal;
                }
            trace.stop();
            if (this._pathLengthToTerminal == null)
                return 50;
            else
                return this._pathLengthToTerminal.length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyMineral.prototype, "amount", {
        get: function () {
            if (this.mineral)
                this.memory.amount = this.mineral.mineralAmount;
            return this.memory.amount;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyMineral.prototype, "refreshTime", {
        get: function () {
            if (this.mineral)
                this.memory.refreshTime = this.mineral.ticksToRegeneration != null ? this.mineral.ticksToRegeneration + Game.time : null;
            return this.memory.refreshTime;
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
            if ((this.memory.hasExtractor == null || this.memory.hasExtractor.time + 100 < Game.time) && this.room) {
                var extractor = _.filter(this.pos.lookFor(LOOK_STRUCTURES), function (s) { return s.structureType == STRUCTURE_EXTRACTOR && (s.my && s.isActive() || s.owner == null); })[0];
                this.memory.hasExtractor = { time: Game.time, hasExtractor: extractor != null };
            }
            if (this.memory.hasExtractor)
                return this.memory.hasExtractor.hasExtractor;
            else
                return false;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyMineral.prototype, "resource", {
        get: function () {
            return this.memory.resource;
        },
        enumerable: true,
        configurable: true
    });
    return MyMineral;
}());
var MyContainer = (function () {
    function MyContainer(id, myRoom) {
        this.id = id;
        this.myRoom = myRoom;
    }
    Object.defineProperty(MyContainer.prototype, "memory", {
        get: function () {
            return this.accessMemory();
        },
        enumerable: true,
        configurable: true
    });
    MyContainer.prototype.accessMemory = function () {
        if (this.myRoom.memory.containers == null)
            this.myRoom.memory.containers = {};
        if (this.myRoom.memory.containers[this.id] == null)
            this.myRoom.memory.containers[this.id] = {
                id: this.id,
                pos: null,
                lastScanTime: null
            };
        return this.myRoom.memory.containers[this.id];
    };
    return MyContainer;
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
        //if (this.myRoom.room)
        //this.refreshCreeps();
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
        if (this.myRoom.memory.hostileScan == null)
            this.myRoom.memory.hostileScan = {
                creeps: null,
                scanTime: null
            };
        return this.myRoom.memory.hostileScan;
    };
    Object.defineProperty(HostileScan.prototype, "scanTime", {
        get: function () {
            return this.memory.scanTime;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(HostileScan.prototype, "creeps", {
        get: function () {
            if (this.allCreeps == null)
                return null;
            if (this._creeps == null || this._creeps.time < Game.time)
                this._creeps = { time: Game.time, creeps: _.indexBy(_.filter(this.allCreeps, function (c) { return c.owner != 'Source Keeper'; }), function (c) { return c.id; }) };
            return this._creeps.creeps;
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
            if (this.myRoom.room && (this._allCreeps == null || this._allCreeps.time < Game.time)) {
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
            this._allCreeps.creeps = _.indexBy(_.map(this.myRoom.room.find(FIND_HOSTILE_CREEPS), function (creep) { return new CreepInfo(creep.id, _this); }), function (x) { return x.id; });
        }
    };
    return HostileScan;
}());
/// <reference path="../sources/mySource.ts" />
/// <reference path="../sources/myMineral.ts" />
/// <reference path="../../tracer.ts" />
/// <reference path="../structures/myContainer.ts" />
/// <reference path="./hostileScan.ts" />
var MyRoom = (function () {
    function MyRoom(name) {
        this.name = name;
        this._room = { time: -1, room: null };
        this._mySources = null;
        this._mainRoom = null;
        this._exits = null;
        if (MyRoom.staticTracer == null) {
            MyRoom.staticTracer = new Tracer('MyRoom');
            Colony.tracers.push(MyRoom.staticTracer);
        }
        //this.tracer = new Tracer('MySource ' + id);
        this.tracer = MyRoom.staticTracer;
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
                name: this.name,
                containers: null,
                sources: null,
                hostileScan: null,
                foreignOwner: null,
                foreignReserver: null,
                lastScanTime: null,
                mainRoomDistanceDescriptions: null,
                mainRoomName: null,
                hasController: null,
                controllerPosition: null,
                travelMatrix: null,
                compressedTravelMatrix: null,
                myMineral: null,
                repairStructures: null,
                emergencyRepairStructures: null,
            };
        return Colony.memory.rooms[this.name];
    };
    Object.defineProperty(MyRoom.prototype, "controllerPosition", {
        get: function () {
            if (this.memory.controllerPosition)
                return RoomPos.fromObj(this.memory.controllerPosition);
            else
                return null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyRoom.prototype, "repairStructures", {
        //private _repairStructures: { time: number, structures: Structure[] };
        get: function () {
            var _this = this;
            if (this.memory.repairStructures == null || this.memory.repairStructures.time + 20 < Game.time) {
                if (this.room) {
                    var structures = _.take(_.sortBy(_.map(this.room.find(FIND_STRUCTURES, { filter: function (s) { return s.hits < s.hitsMax && (_this.name == _this.mainRoom.name || s.structureType != STRUCTURE_CONTAINER); } }), function (s) { return { id: s.id, hits: s.hits, hitsMax: s.hitsMax, pos: s.pos, structureType: s.structureType }; }), function (x) { return x.hits; }), 25);
                    this.memory.repairStructures = { time: Game.time, structures: structures };
                }
                else
                    this.memory.repairStructures = { time: Game.time, structures: [] };
            }
            return this.memory.repairStructures.structures;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyRoom.prototype, "emergencyRepairStructures", {
        //private _emergencyRepairs: { time: number, structures: Structure[] };
        get: function () {
            if (this.memory.emergencyRepairStructures == null || this.repairStructures == null || this.memory.emergencyRepairStructures.time < this.memory.repairStructures.time) {
                var structures = _.filter(this.repairStructures, RepairManager.emergencyTargetDelegate);
                this.memory.emergencyRepairStructures = { time: Game.time, structures: structures };
            }
            return this.memory.emergencyRepairStructures.structures;
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
            return this.memory.hasController;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyRoom.prototype, "canHarvest", {
        get: function () {
            //let trace = this.tracer.start('Property canHarvest');
            var result = (this.mainRoom && this.name == this.mainRoom.name || !(this.memory.foreignOwner || this.memory.foreignReserver));
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
                if (this.memory.sources == null && this.room) {
                    this._mySources = { time: Game.time, mySources: _.indexBy(_.map(this.room.find(FIND_SOURCES), function (x) { return new MySource(x.id, _this); }), function (x) { return x.id; }) };
                }
                else if (this.memory.sources != null) {
                    this._mySources = { time: Game.time, mySources: _.indexBy(_.map(this.memory.sources, function (x) { return new MySource(x.id, _this); }), function (x) { return x.id; }) };
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
            if (this._mainRoom == null)
                this._mainRoom = Colony.mainRooms[this.memory.mainRoomName];
            //trace.stop();
            return this._mainRoom;
        },
        set: function (value) {
            if (value != null && (this._mainRoom == null || this._mainRoom.name != value.name))
                value.invalidateSources();
            this._mainRoom = value;
            this.memory.mainRoomName = (value == null ? null : value.name);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyRoom.prototype, "exits", {
        get: function () {
            if (this._exits == null) {
                this._exits = {};
                var exits = Game.map.describeExits(this.name);
                if (exits != null)
                    for (var exitDirection in exits)
                        this._exits[exitDirection] = exits[exitDirection];
            }
            return this._exits;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyRoom.prototype, "creepAvoidanceMatrix", {
        get: function () {
            if (this.travelMatrix === false)
                return false;
            if (!this.room)
                return this.travelMatrix;
            if (this._creepAvoidanceMatrix == null || this._creepAvoidanceMatrix.time < Game.time && this.room) {
                var matrix_1 = this.travelMatrix.clone();
                _.forEach(this.room.find(FIND_CREEPS), function (c) { return matrix_1.set(c.pos.x, c.pos.y, 255); });
                this._creepAvoidanceMatrix = { time: Game.time, matrix: matrix_1 };
            }
            return this._creepAvoidanceMatrix.matrix;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyRoom.prototype, "travelMatrix", {
        get: function () {
            if (this.memory.foreignOwner)
                return false;
            if (this._travelMatrix == null || this._travelMatrix.time + 200 < Game.time && this.room) {
                if (this.memory.travelMatrix && (!this.room || this.memory.travelMatrix.time + 200 >= Game.time)) {
                    this._travelMatrix = { time: this.memory.travelMatrix.time, matrix: PathFinder.CostMatrix.deserialize(this.memory.travelMatrix.matrix) };
                }
                else if (this.room) {
                    this._travelMatrix = { time: Game.time, matrix: this.createTravelMatrix() };
                    this.memory.travelMatrix = { time: this._travelMatrix.time, matrix: this._travelMatrix.matrix.serialize() };
                    this.memory.compressedTravelMatrix = {
                        time: Game.time, matrix: MyCostMatrix.compress(this._travelMatrix.matrix)
                    };
                }
                else
                    return new PathFinder.CostMatrix();
            }
            return this._travelMatrix.matrix;
        },
        enumerable: true,
        configurable: true
    });
    MyRoom.prototype.recreateTravelMatrix = function () {
        this.memory.travelMatrix = { time: Game.time, matrix: this.createTravelMatrix().serialize() };
        this.memory.compressedTravelMatrix = { time: Game.time, matrix: MyCostMatrix.compress(this._travelMatrix.matrix) };
        this._travelMatrix = { time: Game.time, matrix: this.createTravelMatrix() };
    };
    MyRoom.prototype.createTravelMatrix = function () {
        var _this = this;
        var costMatrix = new PathFinder.CostMatrix();
        _.forEach(this.room.find(FIND_STRUCTURES, { filter: function (s) { return s.structureType == STRUCTURE_ROAD; } }), function (structure) {
            costMatrix.set(structure.pos.x, structure.pos.y, 1);
        });
        _.forEach(this.room.find(FIND_CONSTRUCTION_SITES, { filter: function (s) { return s.structureType == STRUCTURE_ROAD; } }), function (structure) {
            costMatrix.set(structure.pos.x, structure.pos.y, 1);
        });
        var keeperPositions = _.map(this.room.find(FIND_HOSTILE_STRUCTURES, { filter: function (s) { return s.structureType == STRUCTURE_KEEPER_LAIR; } }), function (x) { return x.pos; });
        var protectedPositions = keeperPositions.concat(_.map(_.flatten(_.map(keeperPositions, function (x) { return x.findInRange(FIND_SOURCES, 5).concat(x.findInRange(FIND_MINERALS, 4)); })), function (x) { return x.pos; }));
        _.forEach(protectedPositions, function (pos) {
            for (var x = -5; x <= 5; x++) {
                for (var y = -5; y <= 5; y++) {
                    if (Game.map.getTerrainAt(pos.x + x, pos.y + y, _this.name) != 'wall')
                        costMatrix.set(pos.x + x, pos.y + y, 200 - Math.abs(x * y));
                }
            }
        });
        _.forEach(this.room.find(FIND_STRUCTURES, {
            filter: function (s) { return (OBSTACLE_OBJECT_TYPES.indexOf(s.structureType) >= 0) || s.structureType == STRUCTURE_PORTAL || (s.structureType == STRUCTURE_RAMPART && s.isPublic == false && s.my == false); }
        }), function (structure) {
            costMatrix.set(structure.pos.x, structure.pos.y, 255);
            for (var x = -1; x <= 1; x++) {
                for (var y = -1; y <= 1; y++) {
                    if (Game.map.getTerrainAt(structure.pos.x + x, structure.pos.y + y, _this.name) != 'wall')
                        costMatrix.set(structure.pos.x + x, structure.pos.y + y, costMatrix.get(structure.pos.x + x, structure.pos.y + y) + 5);
                }
            }
        });
        _.forEach(this.room.find(FIND_CONSTRUCTION_SITES, {
            filter: function (s) { return OBSTACLE_OBJECT_TYPES.indexOf(s.structureType) >= 0 || s.structureType == STRUCTURE_CONTROLLER; }
        }), function (structure) {
            costMatrix.set(structure.pos.x, structure.pos.y, 255);
            for (var x = -1; x <= 1; x++) {
                for (var y = -1; y <= 1; y++) {
                    if (Game.map.getTerrainAt(structure.pos.x + x, structure.pos.y + y, _this.name) != 'wall')
                        costMatrix.set(structure.pos.x + x, structure.pos.y + y, costMatrix.get(structure.pos.x + x, structure.pos.y + y) + 5);
                }
            }
        });
        _.forEach(this.room.find(FIND_SOURCES), function (structure) {
            for (var x = -2; x <= 2; x++) {
                for (var y = -2; y <= 2; y++) {
                    if (Game.map.getTerrainAt(structure.pos.x + x, structure.pos.y + y, _this.name) != 'wall')
                        costMatrix.set(structure.pos.x + x, structure.pos.y + y, costMatrix.get(structure.pos.x + x, structure.pos.y + y) + 10);
                }
            }
        });
        _.forEach(this.room.find(FIND_MINERALS), function (structure) {
            for (var x = -2; x <= 2; x++) {
                for (var y = -2; y <= 2; y++) {
                    if (Game.map.getTerrainAt(structure.pos.x + x, structure.pos.y + y, _this.name) != 'wall')
                        costMatrix.set(structure.pos.x + x, structure.pos.y + y, costMatrix.get(structure.pos.x + x, structure.pos.y + y) + 10);
                }
            }
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
            if (this.memory.mainRoomDistanceDescriptions == null || _.size(this.memory.mainRoomDistanceDescriptions) == 0) {
                //trace.stop();
                return null;
            }
            var result = Colony.mainRooms[_.min(this.memory.mainRoomDistanceDescriptions, function (x) { return x.distance; }).roomName];
            //trace.stop();
            return result;
        },
        enumerable: true,
        configurable: true
    });
    MyRoom.prototype.refresh = function (force) {
        if (force === void 0) { force = false; }
        var room = this.room;
        if (this.memory.lastScanTime + 100 < Game.time || force) {
            if (this.memory.myMineral == null && room) {
                var mineral = room.find(FIND_MINERALS)[0];
                if (mineral)
                    this.myMineral = new MyMineral(this, mineral.id);
            }
            else if (this.memory.myMineral != null)
                this.myMineral = new MyMineral(this, this.memory.myMineral.id);
            if (room == null)
                return;
            this.memory.foreignOwner = room.controller != null && room.controller.owner != null && room.controller.owner.username != Colony.myName;
            this.memory.foreignReserver = room.controller != null && room.controller.reservation != null && room.controller.reservation.username != Colony.myName;
            this.memory.lastScanTime = Game.time;
            this.memory.hasController = this.room.controller != null;
            if (this.room.controller)
                this.memory.controllerPosition = this.room.controller.pos;
            this.mySources;
        }
    };
    return MyRoom;
}());
/// <reference path="../myCreep.ts" />
var Scout = (function (_super) {
    __extends(Scout, _super);
    function Scout(creep) {
        _super.call(this, creep);
        this.memory = creep.memory;
        this.memory.autoFlee = true;
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
                if (myRoom.memory.lastScanTime < Game.time - 100)
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
    function ArmyCreep(creep, army) {
        _super.call(this, creep);
        this.creep = creep;
    }
    return ArmyCreep;
}(MyCreep));
/// <reference path="../../components/creeps/military/armyCreep.ts" />
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
/// <reference path="./army.ts" />
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
/// <reference path="../tracer.ts" />
var Colony;
(function (Colony) {
    Colony.tracers = [];
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
            if (myRoom.memory.mainRoomDistanceDescriptions == null)
                calculateDistances(myRoom);
            return rooms[roomName];
        }
    }
    Colony.getRoom = getRoom;
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
            return room.travelMatrix;
        }
    }
    Colony.getTravelMatrix = getTravelMatrix;
    function assignMainRoom(room) {
        calculateDistances(room);
        return room.mainRoom;
    }
    Colony.assignMainRoom = assignMainRoom;
    function shouldSendScout(roomName) {
        var myRoom = getRoom(roomName);
        var result = (myRoom != null && myRoom.memory.lastScanTime + 500 < Game.time)
            && (!Game.map.isRoomProtected(roomName)
                && (myRoom == null || !myRoom.mainRoom)
                && !(_.any(forbidden, function (x) { return x == roomName; }))
                && (myRoom == null
                    || !myRoom.requiresDefense
                        && !myRoom.memory.foreignOwner
                        && !myRoom.memory.foreignReserver)
                || (Game.time % 2000) == 0);
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
        var mainRoom = _.sortBy(_.filter(_.filter(Colony.mainRooms, function (mainRoom) { return !mainRoom.spawnManager.isBusy; }), function (x) { return x.maxSpawnEnergy > body.costs; }), function (x) { return requestRoom.memory.mainRoomDistanceDescriptions[x.name].distance; })[0];
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
        var roomNames = _.map(_.uniq(_.filter(Colony.memory.rooms, function (x) { return x.mainRoomName != null && !Colony.mainRooms[x.mainRoomName].spawnManager.isBusy && !Game.map.isRoomProtected(x.name); })), function (x) { return x.name; });
        for (var _i = 0, roomNames_1 = roomNames; _i < roomNames_1.length; _i++) {
            var name_1 = roomNames_1[_i];
            var myRoom = getRoom(name_1);
            var exits = myRoom.exits;
            if (Memory['exits'] == null)
                Memory['exits'] = {};
            var _loop_10 = function(exitDirection) {
                Memory['exits'][myRoom.name] = exits;
                var targetRoomName = exits[exitDirection];
                if (_.filter(scouts, function (c) { return c.memory.targetPosition.roomName == targetRoomName; }).length == 0 && shouldSendScout(targetRoomName)) {
                    myRoom.mainRoom.spawnManager.addToQueue(['move'], { handledByColony: true, role: 'scout', mainRoomName: null, targetPosition: { x: 25, y: 25, roomName: targetRoomName } });
                }
            };
            for (var exitDirection in exits) {
                _loop_10(exitDirection);
            }
        }
    }
    Colony.createScouts = createScouts;
    function requestCreep() {
    }
    Colony.requestCreep = requestCreep;
    function initialize(memory) {
        Colony.memory = Memory['colony'];
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
        if (myRoom == null)
            return;
        for (var mainIdx in Colony.mainRooms) {
            var mainRoom = Colony.mainRooms[mainIdx];
            var routeResult = Game.map.findRoute(myRoom.name, mainRoom.name, {
                routeCallback: function (roomName, fromRoomName) {
                    var myRoom = getRoom(roomName);
                    if (myRoom == null)
                        return 2;
                    else if (myRoom.memory.foreignReserver)
                        return 2;
                    else if (myRoom.memory.foreignOwner)
                        return Infinity;
                    else
                        return 1;
                }
            });
            if (routeResult === ERR_NO_PATH)
                var distance = 9999;
            else
                var distance = routeResult.length;
            if (myRoom.memory.mainRoomDistanceDescriptions == null)
                myRoom.memory.mainRoomDistanceDescriptions = {};
            myRoom.memory.mainRoomDistanceDescriptions[mainRoom.name] = { roomName: mainRoom.name, distance: distance };
        }
        var mainRoomCandidates = _.sortBy(_.map(_.filter(myRoom.memory.mainRoomDistanceDescriptions, function (x) { return x.distance <= 1; }), function (y) { return { distance: y.distance, mainRoom: Colony.mainRooms[y.roomName] }; }), function (z) { return [z.distance.toString(), (10 - z.mainRoom.room.controller.level).toString()].join('_'); });
        //if (mainRoomCandidates.length > 0 && !myRoom.memory.foreignOwner && (mainRoomCandidates[0].distance <= 1 || mainRoomCandidates[0].mainRoom.room.controller.level >= 6)) {
        //    myRoom.mainRoom = mainRoomCandidates[0].mainRoom;
        //    myRoom.memory.mainRoomName = mainRoomCandidates[0].mainRoom.name;
        //}
        //else {
        //    myRoom.mainRoom = null;
        //}
    }
    function handleClaimingManagers() {
        if (Memory['trace'])
            var startCpu = Game.cpu.getUsed();
        var flags = _.filter(Game.flags, function (x) { return x.memory.claim == true && !Colony.mainRooms[x.pos.roomName]; });
        console.log("Claiming Manager: Found " + flags.length + " flags");
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
        if (Memory['trace']) {
            var endCpu = Game.cpu.getUsed();
            console.log('Colony: Handle ClaimingManagers ' + (endCpu - startCpu).toFixed(2));
        }
    }
    function loadRooms() {
    }
    Colony.loadRooms = loadRooms;
    function tick() {
        console.log('Tick: ' + (++tickCount));
        Colony.memory = Memory['colony'];
        if (Colony.memory.traceThreshold == null)
            Colony.memory.traceThreshold = 2;
        var startCpu;
        var endCpu;
        if (Memory['verbose'])
            console.log('ColonyHandler.tick');
        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        if (Game.time % 10 == 0 && Game.cpu.bucket > 2000) {
            var roomNames = _.map(Colony.memory.rooms, function (x) { return x.name; });
            var idx = ~~((Game.time % (roomNames.length * 10)) / 10);
            var myRoom = getRoom(roomNames[idx]);
            calculateDistances(myRoom);
        }
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            if ((endCpu - startCpu) > Colony.memory.traceThreshold)
                console.log('Colony.Calculate distances to MainRooms: ' + (endCpu - startCpu).toFixed(2));
        }
        //if (Memory['trace'])
        //    startCpu = Game.cpu.getUsed();
        //for (let roomName in Memory.rooms) {
        //    getRoom(roomName);
        //}
        //if (Memory['trace']) {
        //    endCpu = Game.cpu.getUsed();
        //    if ((endCpu - startCpu) > Colony.memory.traceThreshold)
        //        console.log('Colony: Query all rooms ' + (endCpu - startCpu).toFixed(2));
        //}
        handleClaimingManagers();
        if (Game.time % 100 == 0) {
            if (Memory['trace'])
                startCpu = Game.cpu.getUsed();
            createScouts();
            if (Memory['trace']) {
                endCpu = Game.cpu.getUsed();
                if ((endCpu - startCpu) > Colony.memory.traceThreshold)
                    console.log('Colony: Create Scouts ' + (endCpu - startCpu).toFixed(2));
            }
        }
        for (var roomName in Colony.mainRooms) {
            if (Memory['trace'])
                startCpu = Game.cpu.getUsed();
            Colony.mainRooms[roomName].tick();
            if (Memory['trace']) {
                endCpu = Game.cpu.getUsed();
                if ((endCpu - startCpu) > Colony.memory.traceThreshold)
                    console.log('Colony: MainRoom [' + Colony.mainRooms[roomName].name + '.tick() ' + (endCpu - startCpu).toFixed(2));
            }
        }
        var creeps = _.filter(Game.creeps, function (c) { return c.memory.handledByColony; });
        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        for (var idx in creeps) {
            var creep = creeps[idx];
            if (creep.memory.role == 'scout')
                new Scout(creep).tick();
        }
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            if ((endCpu - startCpu) > Colony.memory.traceThreshold)
                console.log('Colony: Handle scouts ' + (endCpu - startCpu).toFixed(2));
        }
        if ((Game.time % 2000 == 0) && Game.cpu.bucket > 9000 || Memory['forceReassignment'] == true || Memory['forceReassignment'] == 'true') {
            new RoomAssignmentHandler().assignRooms();
            Memory['forceReassignment'] = false;
        }
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
                        mainRoom.spawnManager.addToQueue(['work', 'move'], { role: 'dismantler', targetRoomName: myRoom.name, mainRoomName: mainRoom.name });
                    }
                }
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
        if (!Memory['colony'])
            Memory['colony'] = {};
        var colonyMemory = Memory['colony'];
        Colony.initialize(colonyMemory);
        var endCpu = Game.cpu.getUsed();
        console.log('Booting: ' + (endCpu.toFixed(2)));
        console.log();
        console.log('Boot tracers :');
        for (var idx in Colony.tracers) {
            Colony.tracers[idx].print();
        }
    }
    GameManager.globalBootstrap = globalBootstrap;
    function loop() {
        // Loop code starts here
        // This is executed every tick
        //var a = 1;
        //if (a == 1)
        //    return;
        var startCpu = Game.cpu.getUsed();
        for (var name in Memory.creeps) {
            if (!Game.creeps[name]) {
                delete Memory.creeps[name];
            }
        }
        if (Memory['verbose'])
            console.log('MainLoop');
        Colony.tick();
        console.log();
        console.log('Loop tracers :');
        for (var idx in Colony.tracers) {
            Colony.tracers[idx].print();
            Colony.tracers[idx].reset();
        }
        var endCpu = Game.cpu.getUsed();
        console.log('Time: ' + Game.time + ' Measured CPU: ' + (endCpu - startCpu).toFixed(2) + ', CPU: ' + endCpu.toFixed(2) + ' Bucket: ' + Game.cpu.bucket);
        if (Memory['cpuStat'] == null)
            Memory['cpuStat'] = [];
        Memory['cpuStat'].push(endCpu);
        if (Memory['cpuStat'].length > 100)
            Memory['cpuStat'].shift();
        console.log('100Avg: ' + (_.sum(Memory['cpuStat']) / Memory['cpuStat'].length).toFixed(2) + ' CPU');
    }
    GameManager.loop = loop;
})(GameManager || (GameManager = {}));
/// <reference path="../game-manager.ts" />
/*
* Singleton object. Since GameManager doesn't need multiple instances we can use it as singleton object.
*/
// Any modules that you use that modify the game's prototypes should be require'd 
// before you require the profiler. 
//var profiler = require('screeps-profiler');
// This line monkey patches the global prototypes. 
//profiler.enable();
GameManager.globalBootstrap();
// This doesn't look really nice, but Screeps' system expects this method in main.js to run the application.
// If we have this line, we can make sure that globals bootstrap and game loop work.
// http://support.screeps.com/hc/en-us/articles/204825672-New-main-loop-architecture
module.exports.loop = function () {
    if (!Memory['colony'].active) {
        console.log('CPU:' + Game.cpu.getUsed() + ' Bucket: ' + Game.cpu.bucket);
        return;
    }
    //profiler.wrap(function () {
    console.log();
    GameManager.loop();
    //});
};
