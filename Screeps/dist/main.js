var Body = (function () {
    function Body() {
        this.move = 0;
        this.work = 0;
        this.attack = 0;
        this.carry = 0;
        this.heal = 0;
        this.ranged_attack = 0;
        this.tough = 0;
        this.claim = 0;
    }
    Body.getFromCreep = function (creep) {
        var body = new Body();
        var _loop_1 = function(part) {
            body[BODYPARTS_ALL[part]] = _.filter(creep.body, function (x) { return x.type == BODYPARTS_ALL[part]; }).length;
        };
        for (var part in BODYPARTS_ALL) {
            _loop_1(part);
        }
        return body;
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
    Body.prototype.getHarvestingRate = function () {
        return this.work * 2;
    };
    Body.prototype.isMilitary = function () {
        return (this.heal + this.ranged_attack + this.attack) > 0;
    };
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
var MyLink = (function () {
    function MyLink(link, mainRoom) {
        this.mainRoom = mainRoom;
        this._link = { time: 0, link: null };
        this.id = link.id;
        var surroundingStructures = mainRoom.room.lookForAtArea(LOOK_STRUCTURES, link.pos.y - 1, link.pos.x - 1, link.pos.y + 1, link.pos.x + 1, true);
        this.nextToStorage = _.any(surroundingStructures, function (x) { return x.structure.structureType == STRUCTURE_STORAGE; });
        this.nextToTower = _.any(surroundingStructures, function (x) { return x.structure.structureType == STRUCTURE_TOWER; });
        this.nearSource = link.pos.findInRange(FIND_SOURCES, 4).length > 0;
        this.nearController = link.pos.inRangeTo(mainRoom.room.controller.pos, 4);
        var drain = this.nearSource || this.nextToStorage;
        var fill = this.nextToStorage || this.nextToTower || this.nearController;
        if (drain && fill) {
            this.maxLevel = 600;
            this.minLevel = 500;
        }
        else if (drain) {
            this.maxLevel = 0;
            this.minLevel = 0;
        }
        else if (fill) {
            this.maxLevel = link.energyCapacity;
            this.minLevel = link.energyCapacity - 100;
        }
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
    MyLink.prototype.tick = function () {
        if (this.nextToStorage) {
            var myLinkToFill = _.sortBy(_.filter(this.mainRoom.links, function (x) { return x.minLevel > x.link.energy; }), function (x) { return -(x.minLevel - x.link.energy); })[0];
            if (myLinkToFill) {
                this.link.transferEnergy(myLinkToFill.link, Math.min(myLinkToFill.maxLevel - myLinkToFill.link.energy, this.link.energy));
            }
        }
        else {
            if (this.link.energy > this.maxLevel) {
                var myLinkToFill = _.filter(this.mainRoom.links, function (x) { return x.nextToStorage; })[0];
                if (myLinkToFill) {
                    this.link.transferEnergy(myLinkToFill.link, Math.min(myLinkToFill.link.energyCapacity - myLinkToFill.link.energy, this.link.energy - this.maxLevel));
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
    Object.defineProperty(SpawnManager.prototype, "isBusy", {
        get: function () {
            //return false;
            return _.every(this.spawns, function (x) { return x.spawning; });
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
        if (this.isBusy)
            return;
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
        var remainingEnergy = Math.min(maxEnergy, 800);
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
var Constructor = (function () {
    function Constructor(creep, mainRoom) {
        this.creep = creep;
        this.mainRoom = mainRoom;
        this.target = Game.getObjectById(this.memory.targetId);
        if (this.target != null) {
            this.targetPosition = this.target.pos;
            this.memory.targetPosition = this.targetPosition;
        }
        else if (this.creep.memory.targetId != null) {
            this.targetPosition = new RoomPosition(this.memory.targetPosition.x, this.memory.targetPosition.y, this.memory.targetPosition.roomName);
            if (Game.rooms[this.targetPosition.roomName] != null) {
                this.targetPosition = null;
                this.target = null;
                this.memory.targetId = null;
                this.memory.targetId = null;
                this.memory.targetPosition = null;
            }
        }
    }
    Object.defineProperty(Constructor.prototype, "memory", {
        get: function () { return this.creep.memory; },
        enumerable: true,
        configurable: true
    });
    Constructor.prototype.construct = function () {
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
    Constructor.prototype.upgrade = function () {
        if (this.creep.upgradeController(this.mainRoom.room.controller) == ERR_NOT_IN_RANGE)
            this.creep.moveTo(this.mainRoom.room.controller);
    };
    Constructor.prototype.tick = function () {
        var _this = this;
        if (this.creep.carry.energy > 0) {
            if (this.targetPosition != null || this.mainRoom.room.controller.ticksToDowngrade < 1000)
                this.construct();
            else
                this.upgrade();
        }
        else {
            if (this.mainRoom == null)
                return;
            var mainContainer;
            mainContainer = this.creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: function (x) { return (x.structureType == STRUCTURE_CONTAINER || x.structureType == STRUCTURE_STORAGE) && x.store.energy >= _this.creep.carryCapacity; } });
            if (mainContainer == null)
                mainContainer = this.mainRoom.mainContainer;
            if (mainContainer != null) {
                if (mainContainer.store.energy > 100)
                    if (mainContainer.transfer(this.creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(mainContainer);
            }
            else {
                if (this.mainRoom.spawnManager.isIdle) {
                    var spawn = this.mainRoom.room.find(FIND_MY_SPAWNS)[0];
                    if (spawn.transferEnergy(this.creep) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(spawn);
                }
            }
        }
    };
    return Constructor;
}());
/// <reference path="../creeps/constructor/constructorDefinition.ts" />
/// <reference path="../creeps/constructor/constructor.ts" />
var ConstructionManager = (function () {
    function ConstructionManager(mainRoom) {
        this.mainRoom = mainRoom;
        this._creeps = { time: 0, creeps: null };
        this._idleCreeps = { time: 0, creeps: null };
        this.maxCreeps = 2;
    }
    Object.defineProperty(ConstructionManager.prototype, "creeps", {
        get: function () {
            if (this._creeps.time < Game.time)
                this._creeps = {
                    time: Game.time, creeps: _.filter(this.mainRoom.creeps, function (c) { return c.memory.role == 'constructor'; })
                };
            return this._creeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConstructionManager.prototype, "idleCreeps", {
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
    ConstructionManager.prototype.getConstruction = function () {
        var _this = this;
        var constructionSites = _.filter(Game.constructionSites, function (x) { return _.any(_this.mainRoom.allRooms, function (y) { return x.pos.roomName == y.name; }); });
        var extensions = _.filter(constructionSites, function (c) { return c.structureType == STRUCTURE_EXTENSION; });
        if (extensions.length > 0) {
            return extensions[0];
        }
        return constructionSites[0];
    };
    ConstructionManager.prototype.checkCreeps = function () {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        var constructionSite = this.getConstruction();
        if (constructionSite != null && (this.creeps.length < this.maxCreeps || this.idleCreeps.length > 0)) {
            for (var idx in this.idleCreeps) {
                var creep = this.idleCreeps[idx];
                creep.memory.targetId = constructionSite.id;
                creep.memory.targetPosition = constructionSite.pos;
            }
            this.idleCreeps = [];
            this.mainRoom.spawnManager.addToQueue(ConstructorDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'constructor', targetId: constructionSite.id, targetPosition: constructionSite.pos }, Math.min(this.maxCreeps, _.size(this.mainRoom.sources)) - this.creeps.length);
        }
    };
    ConstructionManager.prototype.tick = function () {
        var _this = this;
        this.creeps.forEach(function (c) { return new Constructor(c, _this.mainRoom).tick(); });
    };
    return ConstructionManager;
}());
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
var Repairer = (function () {
    function Repairer(creep, mainRoom) {
        this.creep = creep;
        this.mainRoom = mainRoom;
    }
    Object.defineProperty(Repairer.prototype, "memory", {
        get: function () { return this.creep.memory; },
        enumerable: true,
        configurable: true
    });
    Repairer.prototype.getEmergencyTarget = function () {
        return this.creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: RepairManager.emergencyTargetDelegate });
    };
    Repairer.prototype.tick = function () {
        if (this.creep.room.name == this.memory.roomName && (this.creep.pos.x == 0 || this.creep.pos.x == 49 || this.creep.pos.y == 0 || this.creep.pos.y == 49))
            this.creep.moveTo(new RoomPosition(25, 25, this.creep.room.name));
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
                    target = this.creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: RepairManager.targetDelegate });
                    if (target) {
                        this.memory.targetId = target.id;
                        this.memory.isEmergency = false;
                    }
                    else {
                        target = this.creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: function (x) { return !RepairManager.forceStopRepairDelegate(x) && x.hits < x.hitsMax; } });
                        if (target) {
                            this.memory.targetId = target.id;
                            this.memory.isEmergency = false;
                        }
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
                if (this.creep.room.name == this.mainRoom.name) {
                    container_1 = this.mainRoom.mainContainer;
                }
                else {
                    container_1 = this.creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: function (x) { return x.structureType == STRUCTURE_CONTAINER || x.structureType == STRUCTURE_STORAGE; } });
                }
                if (container_1 != null) {
                    this.memory.fillupContainerId = container_1.id;
                }
            }
            var container = Game.getObjectById(this.memory.fillupContainerId);
            if (container == null)
                this.memory.fillupContainerId = null;
            else if (container.store.energy > this.creep.carryCapacity) {
                if (container.transfer(this.creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(container);
            }
        }
    };
    return Repairer;
}());
/// <reference path="../creeps/repairer/repairerDefinition.ts" />
/// <reference path="../creeps/repairer/repairer.ts" />
var RepairManager = (function () {
    function RepairManager(mainRoom) {
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
                    time: Game.time, creeps: _.filter(this.mainRoom.creeps, function (c) { return c.memory.role == 'repairer'; })
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
        return (s.structureType == STRUCTURE_WALL || s.structureType == STRUCTURE_RAMPART) && s.hits > 600000 || (s.hits >= s.hitsMax);
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
    RepairManager.prototype.createNewRepairers = function () {
        if (this.mainRoom.spawnManager.isBusy || !this.mainRoom.mainContainer)
            return;
        var _loop_2 = function(idx) {
            var myRoom = this_1.mainRoom.allRooms[idx];
            if (myRoom.room && myRoom.room.find(FIND_STRUCTURES, { filter: RepairManager.targetDelegate }).length > 0) {
                var roomCreeps = _.filter(this_1.creeps, function (x) { return x.memory.roomName == myRoom.name; });
                if (roomCreeps.length < (myRoom.name == this_1.mainRoom.name ? Math.min(2, _.size(this_1.mainRoom.sources)) : 1)) {
                    this_1.mainRoom.spawnManager.addToQueue(RepairerDefinition.getDefinition(this_1.mainRoom.maxSpawnEnergy).getBody(), { role: 'repairer', roomName: myRoom.name, state: 0 /* Refilling */ }, 1);
                }
            }
        };
        var this_1 = this;
        for (var idx in this.mainRoom.allRooms) {
            _loop_2(idx);
        }
    };
    RepairManager.prototype.tick = function () {
        var _this = this;
        this.creeps.forEach(function (c) { return new Repairer(c, _this.mainRoom).tick(); });
    };
    return RepairManager;
}());
var UpgraderDefinition;
(function (UpgraderDefinition) {
    function getDefinition(maxEnergy, minCarry) {
        if (minCarry === void 0) { minCarry = false; }
        var body = new Body();
        var remainingEnergy = maxEnergy; // Math.min(maxEnergy, 1500);
        var basicModuleCount = ~~(remainingEnergy / 300);
        if (basicModuleCount * 4 > 50) {
            basicModuleCount = Math.floor(50 / 4);
        }
        body.work = basicModuleCount * 2;
        body.carry = basicModuleCount * 1;
        body.move = basicModuleCount * 1;
        var remaining = maxEnergy - basicModuleCount * 300;
        while (remaining >= 100 && body.getBody().length <= 45) {
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
        if (this.creep.upgradeController(this.creep.room.controller) == ERR_NOT_IN_RANGE)
            this.creep.moveTo(this.creep.room.controller);
    };
    Upgrader.prototype.tick = function () {
        if (this.creep.carry.energy > 0) {
            this.upgrade();
        }
        else {
            if (!this.mainRoom)
                return;
            var energy = this.creep.pos.findInRange(FIND_DROPPED_RESOURCES, 4)[0];
            if (energy != null && this.creep.carry.energy < this.creep.carryCapacity) {
                if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(energy);
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
                        if (mainContainer.store.energy > 200)
                            if (mainContainer.transfer(this.creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
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
var UpgradeManager = (function () {
    function UpgradeManager(mainRoom) {
        this.mainRoom = mainRoom;
        this._creeps = { time: 0, creeps: null };
    }
    Object.defineProperty(UpgradeManager.prototype, "creeps", {
        get: function () {
            if (this._creeps.time < Game.time)
                this._creeps = {
                    time: Game.time, creeps: _.filter(this.mainRoom.creeps, function (c) { return c.memory.role == 'upgrader'; })
                };
            return this._creeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    UpgradeManager.prototype.checkCreeps = function () {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if (this.mainRoom.mainContainer != null && this.mainRoom.room.energyAvailable == this.mainRoom.room.energyCapacityAvailable && this.mainRoom.spawnManager.queue.length < 1 && (this.creeps.length < 1 || this.mainRoom.mainContainer.store.energy == this.mainRoom.mainContainer.storeCapacity || this.mainRoom.mainContainer.store.energy > 300000)) {
            this.mainRoom.spawnManager.addToQueue(UpgraderDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, _.any(this.mainRoom.links, function (x) { return x.nearController; })).getBody(), { role: 'upgrader' }, 1);
        }
    };
    UpgradeManager.prototype.tick = function () {
        var _this = this;
        this.creeps.forEach(function (c) { return new Upgrader(c, _this.mainRoom).tick(); });
    };
    return UpgradeManager;
}());
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
        var energy = this.creep.pos.findInRange(FIND_DROPPED_RESOURCES, 4)[0];
        if (energy != null && this.creep.carry.energy < this.creep.carryCapacity) {
            if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(energy);
        }
        else {
            var mainContainer = this.mainRoom.mainContainer;
            if (mainContainer != null && mainContainer.store.energy > 0) {
                if (mainContainer.transfer(this.creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(mainContainer);
            }
        }
    };
    SpawnFiller.prototype.tick = function () {
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
    };
    return SpawnFiller;
}());
/// <reference path="../creeps/spawnFiller/spawnFillerDefinition.ts" />
/// <reference path="../creeps/spawnFiller/spawnFiller.ts" />
var SpawnFillManager = (function () {
    function SpawnFillManager(mainRoom) {
        this.mainRoom = mainRoom;
        this._creeps = { time: 0, creeps: null };
    }
    Object.defineProperty(SpawnFillManager.prototype, "creeps", {
        get: function () {
            if (this._creeps.time < Game.time)
                this._creeps = {
                    time: Game.time, creeps: _.filter(this.mainRoom.creeps, function (c) { return c.memory.role == 'spawnFiller'; })
                };
            return this._creeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    SpawnFillManager.prototype.checkCreeps = function () {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if (this.mainRoom.mainContainer != null && _.size(_.filter(this.mainRoom.creeps, function (c) { return c.memory.role == 'spawnFiller' && (c.ticksToLive > 70 || c.ticksToLive === undefined); })) < 2) {
            this.mainRoom.spawnManager.addToQueue(SpawnFillerDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'spawnFiller' }, 1, true);
        }
    };
    SpawnFillManager.prototype.tick = function () {
        var _this = this;
        this.creeps.forEach(function (c) { return new SpawnFiller(c, _this.mainRoom).tick(); });
    };
    return SpawnFillManager;
}());
var HarvesterDefinition;
(function (HarvesterDefinition) {
    function getHarvesterDefinition(maxEnergy, maxWorkParts) {
        var body = new Body();
        var remainingEnergy = Math.min(maxEnergy, 1500);
        var basicModulesCount = ~~(remainingEnergy / 200); //work,carry,move
        body.work = basicModulesCount;
        body.carry = basicModulesCount;
        body.move = basicModulesCount;
        var remaining = remainingEnergy - basicModulesCount * 200;
        while (remaining >= 100) {
            if (remaining >= 150) {
                body.carry++;
                body.carry++;
                body.move++;
                remaining -= 150;
            }
            else if (remaining >= 100) {
                body.carry++;
                body.move++;
                remaining -= 100;
            }
            else
                break;
        }
        return body;
    }
    function getMinerDefinition(maxEnergy, maxWorkParts) {
        var body = new Body();
        body.carry = 2;
        var remainingEnergy = maxEnergy - 2 * BODYPART_COST.carry;
        var basicModulesCount = Math.floor(remainingEnergy / (2 * BODYPART_COST.work + BODYPART_COST.move)); //work,carry,move
        body.move = basicModulesCount;
        body.work = 2 * basicModulesCount;
        remainingEnergy -= basicModulesCount * (2 * BODYPART_COST.work + BODYPART_COST.move);
        if (remainingEnergy >= (BODYPART_COST.work + BODYPART_COST.move)) {
            body.work++;
            body.move++;
        }
        if (body.work > maxWorkParts) {
            body.work = maxWorkParts;
            body.move = Math.ceil(body.work / 2);
        }
        return body;
    }
    function getDefinition(maxEnergy, hasSourceContainer, maxWorkParts) {
        if (hasSourceContainer === void 0) { hasSourceContainer = false; }
        if (maxWorkParts === void 0) { maxWorkParts = 50; }
        if (!hasSourceContainer)
            return getHarvesterDefinition(maxEnergy, maxWorkParts);
        else
            return getMinerDefinition(maxEnergy, maxWorkParts);
    }
    HarvesterDefinition.getDefinition = getDefinition;
})(HarvesterDefinition || (HarvesterDefinition = {}));
/// <reference path="../../../colony/colony.ts" />
var Harvester = (function () {
    function Harvester(creep, mainRoom) {
        this.creep = creep;
        this.mainRoom = mainRoom;
        this._source = { time: -1, source: null };
        this._mySource = { time: -1, mySource: null };
    }
    Object.defineProperty(Harvester.prototype, "memory", {
        get: function () { return this.creep.memory; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Harvester.prototype, "source", {
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
    Object.defineProperty(Harvester.prototype, "mySource", {
        get: function () {
            if (this._mySource.time < Game.time)
                this._mySource = {
                    time: Game.time, mySource: this.mainRoom.sources[this.memory.sourceId]
                };
            return this._mySource.mySource;
        },
        enumerable: true,
        configurable: true
    });
    Harvester.prototype.deliver = function (dontMove) {
        if (dontMove === void 0) { dontMove = false; }
        if (this.mySource.dropOffStructure == null)
            return;
        if (this.creep.room.name == this.mySource.dropOffStructure.pos.roomName) {
            if (this.creep.transfer(this.mySource.dropOffStructure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE && !dontMove)
                this.creep.moveTo(this.mySource.dropOffStructure);
        }
        else
            this.creep.moveTo(this.mySource.dropOffStructure);
    };
    Harvester.prototype.harvest = function () {
        var _this = this;
        if (this.mySource == null) {
            var myRoom = _.filter(Colony.rooms, function (x) { return _.any(x.mySources, function (y) { return y.id == _this.memory.sourceId; }); })[0];
            if (myRoom != null && myRoom.mainRoom != null) {
                this.mainRoom = myRoom.mainRoom;
                this.memory.mainRoomName = this.mainRoom.name;
                this._mySource.time = -1;
            }
            else {
                this.creep.say('NoMySource');
                this.creep.suicide();
                return;
            }
        }
        if (this.source == null) {
            this.creep.moveTo(this.mySource);
        }
        else {
            if (this.creep.harvest(this.source) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.source);
            else if (!this.mySource.nearByConstructionSite && !this.shouldRepair())
                this.deliver(true);
        }
    };
    Harvester.prototype.construct = function () {
        if (!this.mySource.nearByConstructionSite)
            return;
        if (this.creep.build(this.mySource.nearByConstructionSite) == ERR_NOT_IN_RANGE)
            this.creep.moveTo(this.mySource.nearByConstructionSite);
    };
    Harvester.prototype.repair = function () {
        var target = this.mySource.dropOffStructure;
        if (target == null)
            return;
        if (this.creep.repair(target) != OK)
            this.memory.state == 1 /* Delivering */;
    };
    Harvester.prototype.shouldRepair = function () {
        return this.mySource.dropOffStructure && this.mySource.dropOffStructure.pos.inRangeTo(this.creep.pos, 4) && this.mySource.dropOffStructure.hits < this.mySource.dropOffStructure.hitsMax;
    };
    Harvester.prototype.tick = function () {
        if (this.memory.state == null || this.creep.memory.state == 'harvesting')
            this.memory.state = 0 /* Harvesting */;
        if (this.creep.memory.state == 'delivering')
            this.memory.state = 1 /* Delivering */;
        if (this.memory.state == 0 /* Harvesting */ && this.creep.carry.energy < this.creep.carryCapacity)
            this.harvest();
        else if (this.memory.state == 0 /* Harvesting */ && this.creep.carry.energy == this.creep.carryCapacity) {
            if (this.shouldRepair)
                this.memory.state = 2 /* Repairing */;
            else
                this.memory.state = 1 /* Delivering */;
        }
        else if (this.memory.state == 2 /* Repairing */ && (this.creep.carry.energy < 10 || !this.mySource.sourceDropOffContainer || this.mySource.sourceDropOffContainer.hits == this.mySource.sourceDropOffContainer.hitsMax))
            this.memory.state = 1 /* Delivering */;
        if (this.memory.state == 1 /* Delivering */ && this.creep.carry.energy > 0) {
            if (this.source && this.mySource.nearByConstructionSite && this.mainRoom.mainContainer)
                this.construct();
            else
                this.deliver();
        }
        else if (this.memory.state == 2 /* Repairing */)
            this.repair();
        else if (this.memory.state == 1 /* Delivering */ && this.creep.carry.energy == 0)
            this.memory.state = 0 /* Harvesting */;
    };
    return Harvester;
}());
var SourceCarrierDefinition;
(function (SourceCarrierDefinition) {
    function getDefinition(maxEnergy, maxCarryParts) {
        if (maxCarryParts === void 0) { maxCarryParts = 50; }
        var body = new Body();
        var basicModuleCount = ~~(maxEnergy / 150);
        if (basicModuleCount * 3 > 50)
            basicModuleCount = ~~(50 / 3);
        if (basicModuleCount * 2 > maxCarryParts) {
            basicModuleCount = Math.ceil(maxCarryParts / 2);
        }
        body.carry = 2 * basicModuleCount;
        body.move = basicModuleCount;
        return body;
    }
    SourceCarrierDefinition.getDefinition = getDefinition;
})(SourceCarrierDefinition || (SourceCarrierDefinition = {}));
/// <reference path="../../../colony/colony.ts" />
var SourceCarrier = (function () {
    function SourceCarrier(creep, mainRoom) {
        this.creep = creep;
        this.mainRoom = mainRoom;
        this._source = { time: 0, source: null };
        this._mySource = { time: 0, mySource: null };
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
            if (this._mySource.time < Game.time)
                this._mySource = {
                    time: Game.time, mySource: this.mainRoom.sources[this.memory.sourceId]
                };
            return this._mySource.mySource;
        },
        enumerable: true,
        configurable: true
    });
    SourceCarrier.prototype.pickUp = function () {
        var _this = this;
        if (this.mySource == null) {
            this.creep.say('NoMySource');
            var myRoom = _.filter(Colony.rooms, function (x) { return _.any(x.mySources, function (y) { return y.id == _this.memory.sourceId; }); })[0];
            if (myRoom != null && myRoom.mainRoom != null) {
                this.mainRoom = myRoom.mainRoom;
                this.memory.mainRoomName = this.mainRoom.name;
                this._mySource.time = -1;
            }
            else {
                this.creep.say('NoMySource');
                this.creep.suicide();
                return;
            }
        }
        if (!this.mySource.sourceDropOffContainer)
            return;
        var energy = this.creep.pos.findInRange(FIND_DROPPED_RESOURCES, 4)[0];
        if (energy != null) {
            if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(energy);
        }
        else {
            if (this.mySource.sourceDropOffContainer.pos.roomName != this.creep.pos.roomName)
                this.creep.moveTo(this.mySource.sourceDropOffContainer, { reusePath: 20 });
            else {
                if (this.mySource.sourceDropOffContainer && this.mySource.sourceDropOffContainer.transfer(this.creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(this.mySource.sourceDropOffContainer);
            }
        }
    };
    SourceCarrier.prototype.deliver = function () {
        var _this = this;
        if (this.creep.room.name == this.mainRoom.name) {
            var tower = this.creep.room.find(FIND_STRUCTURES, { filter: function (x) { return x.structureType == STRUCTURE_TOWER && x.energy < (_.filter(_this.mainRoom.links, function (y) { return y.nextToTower; }).length > 0 ? 150 : 700); } });
            if (tower.length > 0) {
                if (this.creep.transfer(tower[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(tower[0]);
                return;
            }
        }
        var energy = null;
        if (Game.time % 5 == 0)
            energy = this.creep.pos.findInRange(FIND_DROPPED_RESOURCES, 3)[0];
        if (energy != null && this.creep.carry.energy < this.creep.carryCapacity) {
            if (this.creep.pickup(energy) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(energy);
        }
        else {
            var mainContainer = this.mainRoom.mainContainer;
            if (mainContainer != null && mainContainer.store.energy < mainContainer.storeCapacity && this.mainRoom.creepManagers.spawnFillManager.creeps.length > 0) {
                if (this.creep.room.name != mainContainer.room.name)
                    this.creep.moveTo(mainContainer, { reusePath: 20 });
                if (this.creep.transfer(mainContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(mainContainer);
            }
            else {
                if (this.creep.room.name != this.mainRoom.name)
                    this.creep.moveTo(this.mainRoom.mainPosition);
                else {
                    var target = this.creep.pos.findClosestByPath(FIND_MY_STRUCTURES, { filter: function (s) { return (s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_EXTENSION) && s.energy < s.energyCapacity; } });
                    if (this.creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(target);
                }
            }
        }
    };
    SourceCarrier.prototype.tick = function () {
        if (this.creep.carry.energy < this.creep.carryCapacity && !(this.creep.carry.energy > this.creep.carryCapacity / 2 && this.creep.room.name == this.mainRoom.name))
            this.pickUp();
        else
            this.deliver();
    };
    return SourceCarrier;
}());
var MemoryObject = (function () {
    function MemoryObject() {
    }
    return MemoryObject;
}());
/// <reference path="../creeps/harvester/harvesterDefinition.ts" />
/// <reference path="../creeps/harvester/harvester.ts" />
/// <reference path="../creeps/sourceCarrier/sourceCarrierDefinition.ts" />
/// <reference path="../creeps/sourceCarrier/sourceCarrier.ts" />
/// <reference path="../../memoryObject.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var HarvestingManager = (function (_super) {
    __extends(HarvestingManager, _super);
    function HarvestingManager(mainRoom) {
        _super.call(this);
        this.mainRoom = mainRoom;
        this._harvesterCreeps = { time: 0, creeps: null };
        this._sourceCarrierCreeps = { time: 0, creeps: null };
    }
    Object.defineProperty(HarvestingManager.prototype, "memory", {
        get: function () {
            return this.accessMemory();
        },
        enumerable: true,
        configurable: true
    });
    HarvestingManager.prototype.accessMemory = function () {
        if (this.mainRoom.memory.harvestingManager == null)
            this.mainRoom.memory.harvestingManager = {
                debug: false,
                verbose: false
            };
        return this.mainRoom.memory.harvestingManager;
    };
    Object.defineProperty(HarvestingManager.prototype, "harvesterCreeps", {
        get: function () {
            if (this._harvesterCreeps.time < Game.time)
                this._harvesterCreeps = {
                    time: Game.time, creeps: _.filter(this.mainRoom.creeps, function (c) { return c.memory.role == 'harvester'; })
                };
            return this._harvesterCreeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(HarvestingManager.prototype, "sourceCarrierCreeps", {
        get: function () {
            if (this._sourceCarrierCreeps.time < Game.time)
                this._sourceCarrierCreeps = {
                    time: Game.time, creeps: _.filter(this.mainRoom.creeps, function (c) { return c.memory.role == 'sourceCarrier'; })
                };
            return this._sourceCarrierCreeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    HarvestingManager.prototype.placeSourceContainers = function () {
        try {
            if (Game.time % 50 != 0)
                return;
            if (this.mainRoom.mainContainer)
                for (var idx in this.mainRoom.sources) {
                    var sourceInfo = this.mainRoom.sources[idx];
                    if (sourceInfo.hasKeeper || !sourceInfo.myRoom.canHarvest)
                        continue;
                    if (!sourceInfo.hasKeeper && sourceInfo.containerMissing) {
                        var path = sourceInfo.pos.findPathTo(this.mainRoom.mainContainer.pos, { ignoreCreeps: true });
                        var containerPosition = new RoomPosition(path[0].x, path[0].y, sourceInfo.pos.roomName);
                        containerPosition.createConstructionSite(STRUCTURE_CONTAINER);
                    }
                }
        }
        catch (e) {
            console.log(e.stack);
        }
    };
    HarvestingManager.prototype.getHarvesterBodyAndCount = function (sourceInfo, noLocalRestriction) {
        if (noLocalRestriction === void 0) { noLocalRestriction = false; }
        if (Memory['verbose'] || this.memory.verbose)
            console.log('MAX_ENERGY: ' + this.mainRoom.maxSpawnEnergy);
        var mainRoom = noLocalRestriction ? _.max(_.values(Colony.mainRooms), function (x) { return x.maxSpawnEnergy; }) : this.mainRoom;
        var partsRequired = Math.ceil((sourceInfo.energyCapacity / ENERGY_REGEN_TIME) / 2) + 1;
        var maxWorkParts = HarvesterDefinition.getDefinition(mainRoom.maxSpawnEnergy, sourceInfo.requiresCarrier).work;
        if (maxWorkParts >= partsRequired)
            return { body: HarvesterDefinition.getDefinition(mainRoom.maxSpawnEnergy, sourceInfo.requiresCarrier, partsRequired), count: 1 };
        else {
            var creepCount = Math.min(Math.ceil(partsRequired / maxWorkParts), sourceInfo.maxHarvestingSpots);
            partsRequired = Math.min(Math.ceil(partsRequired / creepCount), maxWorkParts);
            return { body: HarvesterDefinition.getDefinition(mainRoom.maxSpawnEnergy, sourceInfo.requiresCarrier, partsRequired), count: creepCount };
        }
    };
    HarvestingManager.prototype.getSourceCarrierBodyAndCount = function (sourceInfo, maxMiningRate) {
        var useRoads = (this.mainRoom.mainContainer && sourceInfo.roadBuiltToMainContainer == this.mainRoom.mainContainer.id);
        var pathLengh = sourceInfo.pathLengthToMainContainer;
        if (pathLengh == null) {
            return {
                body: SourceCarrierDefinition.getDefinition(500),
                count: 0
            };
        }
        var sourceRate = sourceInfo.energyCapacity / ENERGY_REGEN_TIME;
        var energyPerTick = maxMiningRate == null ? sourceRate : Math.min(maxMiningRate, sourceRate);
        var requiredCarryModules = Math.ceil(pathLengh * (useRoads ? 2 : 3) * energyPerTick / 50) + 1;
        var maxCarryParts = SourceCarrierDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, requiredCarryModules).carry;
        if (maxCarryParts >= requiredCarryModules)
            return { body: SourceCarrierDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, requiredCarryModules), count: 1 };
        else {
            var creepCount = Math.ceil(requiredCarryModules / maxCarryParts);
            requiredCarryModules = Math.ceil(requiredCarryModules / creepCount);
            return { body: SourceCarrierDefinition.getDefinition(this.mainRoom.maxSpawnEnergy, requiredCarryModules), count: creepCount };
        }
    };
    HarvestingManager.prototype.checkCreeps = function () {
        var startCpu;
        var endCpu;
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if (Memory['verbose'] || this.memory.verbose)
            console.log('HarvestingManager.checkCreeps()');
        for (var idx in this.mainRoom.sources) {
            var sourceInfo = this.mainRoom.sources[idx];
            //if (sourceInfo.myRoom.memory.mainRoomDistanceDescriptions[this.mainRoom.name].distance >= 2 && !sourceInfo.memory.containerId)
            //    continue;
            if (Memory['verbose'] || this.memory.verbose)
                console.log('HarvestingManager.checkCreeps(): Source [' + sourceInfo.id + ']');
            if (!Colony.getRoom(sourceInfo.pos.roomName).canHarvest) {
                if (Memory['verbose'] || this.memory.verbose)
                    console.log('HarvestingManager.checkCreeps(): We can\'t mine in this room');
                continue;
            }
            if (sourceInfo.hasKeeper) {
                if (Memory['verbose'] || this.memory.verbose)
                    console.log('HarvestingManager.checkCreeps(): Skipping the source keeper');
                continue;
            }
            var harvesters = _.filter(this.harvesterCreeps, function (c) { return c.memory.sourceId == sourceInfo.id; });
            if (Memory['verbose'] || this.memory.verbose)
                console.log('HarvestingManager.checkCreeps(): Harvesters: ' + harvesters.length + ', Harvesting spots: ' + sourceInfo.maxHarvestingSpots);
            //if (harvesters.length < sourceInfo.memory.harvestingSpots) {
            if (Memory['verbose'] || this.memory.verbose)
                console.log('HarvestingManager.checkCreeps(): Add harvester to queue');
            var harvesterRequirements = this.getHarvesterBodyAndCount(sourceInfo);
            var requestedCreep = false;
            if (harvesterRequirements.body.getHarvestingRate() * harvesterRequirements.count < sourceInfo.energyCapacity / ENERGY_REGEN_TIME) {
                var requestHarvesterRequirements = this.getHarvesterBodyAndCount(sourceInfo, true);
                requestedCreep = Colony.spawnCreep(this.mainRoom.myRoom, requestHarvesterRequirements.body, { role: 'harvester', state: 0 /* Harvesting */, sourceId: sourceInfo.id, mainRoomName: this.mainRoom.name }, requestHarvesterRequirements.count - harvesters.length + (!sourceInfo.requiresCarrier ? 0 : 0));
                if (Memory['verbose'] || this.memory.verbose)
                    console.log('HarvestingManager.checkCreeps(): Requested harvester: ' + (requestedCreep ? 'sucessfull' : 'failed'));
            }
            if (!requestedCreep) {
                if (Memory['verbose'] || this.memory.verbose)
                    console.log('HarvestingManager.checkCreeps(): Requirements-cound: ' + harvesterRequirements.count + ' Requirements- body: ' + JSON.stringify(harvesterRequirements.body));
                var livingHarvesters = _.filter(harvesters, function (x) { return (x.ticksToLive > sourceInfo.pathLengthToMainContainer || x.ticksToLive === undefined); });
                this.mainRoom.spawnManager.addToQueue(harvesterRequirements.body.getBody(), { role: 'harvester', state: 0 /* Harvesting */, sourceId: sourceInfo.id }, harvesterRequirements.count - livingHarvesters.length + (!sourceInfo.requiresCarrier ? 0 : 0));
            }
            //}
            //let miningRate = _.sum(_.map(harvesters, h => Body.getFromCreep(h).getHarvestingRate()));
            if (Memory['verbose'] || this.memory.verbose)
                console.log('Start checking source carriers');
            if (Memory['trace'])
                startCpu = Game.cpu.getUsed();
            if (Memory['verbose'] || this.memory.verbose) {
                console.log('Requires carrier: ' + sourceInfo.requiresCarrier);
                console.log('Has Link: ' + sourceInfo.hasLink);
            }
            if (sourceInfo.requiresCarrier && !sourceInfo.hasLink) {
                if (Memory['verbose'] || this.memory.verbose)
                    console.log('Checking source carriers for ' + sourceInfo.id);
                var miningRate = harvesterRequirements.body.work * 2 * harvesterRequirements.count;
                var sourceCarriers = _.filter(this.sourceCarrierCreeps, function (c) { return c.memory.sourceId == sourceInfo.id; });
                var requirements = this.getSourceCarrierBodyAndCount(sourceInfo, miningRate);
                this.mainRoom.spawnManager.addToQueue(requirements.body.getBody(), { role: 'sourceCarrier', sourceId: sourceInfo.id }, requirements.count - sourceCarriers.length);
            }
            if (Memory['trace']) {
                endCpu = Game.cpu.getUsed();
                console.log('HarvestingManagers checking SourceCarriers: ' + (endCpu - startCpu).toFixed(2));
            }
        }
    };
    HarvestingManager.prototype.tick = function () {
        var _this = this;
        this.harvesterCreeps.forEach(function (c) { try {
            new Harvester(c, _this.mainRoom).tick();
        }
        catch (e) {
            c.say('ERROR');
            Memory['error'] = e;
            console.log(e.stack);
        } });
        this.sourceCarrierCreeps.forEach(function (c) { try {
            new SourceCarrier(c, _this.mainRoom).tick();
        }
        catch (e) {
            c.say('ERROR');
            Memory['error'] = e;
            console.log(e.stack);
        } });
    };
    return HarvestingManager;
}(MemoryObject));
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
        while (remainingEnergy >= (BODYPART_COST.attack + BODYPART_COST.move)) {
            body.attack++;
            body.move++;
            remainingEnergy -= (BODYPART_COST.attack + BODYPART_COST.move);
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
        var closestHostileCreep = this.creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
        if (closestHostileCreep != null) {
            this.creep.moveTo(closestHostileCreep);
            this.creep.attack(closestHostileCreep);
            this.creep.rangedAttack(closestHostileCreep);
        }
        else {
            var otherRoom = _.filter(this.mainRoom.allRooms, function (r) { return r.name != _this.creep.room.name && r.memory.hostiles && r.canHarvest; })[0];
            if (otherRoom != null)
                this.creep.moveTo(new RoomPosition(25, 25, otherRoom.name));
            else {
                this.creep.moveTo(this.mainRoom.mainPosition);
            }
        }
    };
    return Defender;
}());
/// <reference path="../creeps/defender/defenderDefinition.ts" />
/// <reference path="../creeps/defender/defender.ts" />
var DefenseManager = (function () {
    function DefenseManager(mainRoom) {
        this.mainRoom = mainRoom;
        this._creeps = { time: 0, creeps: null };
        this.maxCreeps = 1;
    }
    Object.defineProperty(DefenseManager.prototype, "creeps", {
        get: function () {
            if (this._creeps.time < Game.time)
                this._creeps = {
                    time: Game.time, creeps: _.filter(this.mainRoom.creeps, function (c) { return c.memory.role == 'defender'; })
                };
            return this._creeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    DefenseManager.prototype.checkCreeps = function () {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if (_.filter(this.mainRoom.allRooms, function (r) { return !r.memory.foreignOwner && !r.memory.foreignReserver && r.memory.hostiles && r.canHarvest; }).length > 0 && this.creeps.length < this.maxCreeps) {
            this.mainRoom.spawnManager.addToQueue(DefenderDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'defender' }, this.maxCreeps - this.creeps.length);
        }
    };
    DefenseManager.prototype.tick = function () {
        var _this = this;
        this.creeps.forEach(function (c) { return new Defender(c, _this.mainRoom).tick(); });
    };
    return DefenseManager;
}());
var Reserver = (function () {
    function Reserver(creep, mainRoom) {
        this.creep = creep;
        this.mainRoom = mainRoom;
        this.memory = creep.memory;
    }
    Reserver.prototype.tick = function () {
        this.memory = this.creep.memory;
        if (this.memory.targetRoomName != this.creep.room.name)
            this.creep.moveTo(new RoomPosition(25, 25, this.memory.targetRoomName));
        else if (this.creep.reserveController(this.creep.room.controller) == ERR_NOT_IN_RANGE)
            this.creep.moveTo(this.creep.room.controller);
    };
    return Reserver;
}());
/// <reference path="../creeps/reserver/reserver.ts" />
var ReservationManager = (function () {
    function ReservationManager(mainRoom) {
        this.mainRoom = mainRoom;
        this._creeps = { time: 0, creeps: null };
    }
    Object.defineProperty(ReservationManager.prototype, "creeps", {
        get: function () {
            if (this._creeps.time < Game.time)
                this._creeps = {
                    time: Game.time, creeps: _.filter(this.mainRoom.creeps, function (c) { return c.memory.role == 'reserver'; })
                };
            return this._creeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    ReservationManager.prototype.checkCreeps = function () {
        var mainRoom = this.mainRoom;
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if (Memory['verbose'] == true)
            console.log('ReservationManager.checkCreep');
        var rooms = _.filter(this.mainRoom.connectedRooms, function (r) { return r.canHarvest == true && !r.memory.hostiles && (r.room != null && r.room.controller != null && r.useableSources.length > 0); });
        var _loop_3 = function() {
            var myRoom = rooms[idx];
            if (Memory['verbose'] == true)
                console.log('ReservationManager.checkCreep: 1 Room ' + myRoom.name);
            if (myRoom.memory.mainRoomDistanceDescriptions[this_2.mainRoom.name].distance >= 3 && !_.any(myRoom.mySources, function (x) { return x.requiresCarrier; }))
                return "continue";
            var room = myRoom.room;
            if (room && room.controller.reservation != null && room.controller.reservation.ticksToEnd > 4500)
                return "continue";
            if (Memory['verbose'] == true)
                console.log('ReservationManager.checkCreep: 2 Room ' + myRoom.name);
            if (this_2.mainRoom.maxSpawnEnergy < 650)
                return { value: void 0 };
            var requiredCount = this_2.mainRoom.maxSpawnEnergy < 1300 ? 2 : 1;
            if (_.filter(this_2.creeps, function (x) { return x.memory.targetRoomName == myRoom.name; }).length < requiredCount) {
                this_2.mainRoom.spawnManager.addToQueue(requiredCount > 1 ? [CLAIM, MOVE] : [CLAIM, CLAIM, MOVE, MOVE], { role: 'reserver', targetRoomName: myRoom.name }, 1, true);
            }
        };
        var this_2 = this;
        for (var idx in rooms) {
            var state_3 = _loop_3();
            if (typeof state_3 === "object") return state_3.value;
            if (state_3 === "continue") continue;
        }
    };
    ReservationManager.prototype.tick = function () {
        var _this = this;
        this.creeps.forEach(function (c) { return new Reserver(c, _this.mainRoom).tick(); });
    };
    return ReservationManager;
}());
var LinkFillerDefinition;
(function (LinkFillerDefinition) {
    function getDefinition() {
        var body = new Body();
        body.carry = 8;
        body.move = 2;
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
            if (this.creep.carry.energy == 0) {
                if (storage.transfer(this.creep, RESOURCE_ENERGY, 400))
                    this.creep.moveTo(storage);
            }
            else {
                if (this.creep.transfer(link, RESOURCE_ENERGY, Math.min(this.creep.carry.energy, myLink.minLevel - link.energy)) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(link);
            }
        }
        else if (link.energy > myLink.maxLevel) {
            if (this.creep.carry.energy == this.creep.carryCapacity) {
                if (this.creep.transfer(storage, RESOURCE_ENERGY, 400))
                    this.creep.moveTo(storage);
            }
            else {
                if (link.transferEnergy(this.creep, Math.min(link.energy - myLink.minLevel, this.creep.carryCapacity - this.creep.carry.energy)) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(link);
            }
        }
        else {
            if (this.creep.carry.energy > 400) {
                if (this.creep.transfer(storage, RESOURCE_ENERGY, this.creep.carry.energy - 400) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(storage);
            }
            else if (this.creep.carry.energy > 400) {
                if (storage.transfer(this.creep, RESOURCE_ENERGY, 400 - this.creep.carry.energy) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(storage);
            }
        }
    };
    return LinkFiller;
}());
/// <reference path="../creeps/linkFiller/linkFillerDefinition.ts" />
/// <reference path="../creeps/linkFiller/linkFiller.ts" />
var LinkFillerManager = (function () {
    function LinkFillerManager(mainRoom) {
        this.mainRoom = mainRoom;
        this._creeps = { time: 0, creeps: null };
    }
    Object.defineProperty(LinkFillerManager.prototype, "creeps", {
        get: function () {
            if (this._creeps.time < Game.time)
                this._creeps = {
                    time: Game.time, creeps: _.filter(this.mainRoom.creeps, function (c) { return c.memory.role == 'linkFiller'; })
                };
            return this._creeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    LinkFillerManager.prototype.checkCreeps = function () {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if (this.creeps.length == 0 && this.mainRoom.links.length > 0) {
            this.mainRoom.spawnManager.addToQueue(LinkFillerDefinition.getDefinition().getBody(), { role: 'linkFiller' });
        }
    };
    LinkFillerManager.prototype.tick = function () {
        var _this = this;
        this.creeps.forEach(function (c) { return new LinkFiller(c, _this.mainRoom).tick(); });
    };
    return LinkFillerManager;
}());
var RoadConstructionManager = (function () {
    function RoadConstructionManager(mainRoom) {
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
            var result = path[pathIdx].createConstructionSite(STRUCTURE_ROAD);
            if (result == ERR_FULL) {
                this.memory.remainingPath = path.slice(pathIdx);
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
        var sources = _.filter(this.mainRoom.sources, function (x) { return !x.hasKeeper && x.sourceDropOffContainer != null && (x.roadBuiltToMainContainer != _this.mainRoom.name || (Game.time % 500 == 0)) && x.myRoom.canHarvest; });
        for (var sourceIdx = 0; sourceIdx < sources.length; sourceIdx++) {
            var mySource = sources[sourceIdx];
            var path = PathFinder.search(this.mainRoom.mainContainer.pos, { pos: mySource.sourceDropOffContainer.pos, range: 1 }, { swampCost: 2 });
            this.constructRoad(path.path, 0);
            mySource.roadBuiltToMainContainer = this.mainRoom.name;
            break;
        }
    };
    RoadConstructionManager.prototype.buildControllerRoad = function () {
        if (_.filter(Game.constructionSites, function (x) { return x.structureType == STRUCTURE_ROAD; }).length > 0)
            return;
        if (!this.mainRoom.mainContainer)
            return;
        var path = PathFinder.search(this.mainRoom.mainContainer.pos, { pos: this.mainRoom.room.controller.pos, range: 1 }, { swampCost: 2 });
        this.constructRoad(path.path, 0);
    };
    RoadConstructionManager.prototype.tick = function () {
        if (this.memory.remainingPath && this.memory.remainingPath.length > 0) {
            var remainingPath = this.memory.remainingPath;
            this.memory.remainingPath = null;
            this.constructRoad(remainingPath);
        }
        else if (Game.time % 50 == 0 && !(Game.time % 100 == 0)) {
            this.buildExtensionRoads();
        }
        else if (Game.time % 100 == 0 && !(Game.time % 200 == 0)) {
            this.buildHarvestPaths();
        }
        else if (Game.time % 200 == 0) {
            this.buildControllerRoad();
        }
    };
    return RoadConstructionManager;
}());
var MyTower = (function () {
    function MyTower(tower, mainRoom) {
        this.tower = tower;
        this.mainRoom = mainRoom;
    }
    MyTower.prototype.tick = function () {
        var closestHostile = this.tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS, { filter: function (e) { return e.owner.username !== 'Source Keeper' && Body.getFromCreep(e).isMilitary(); } });
        if (closestHostile != null) {
            this.tower.attack(closestHostile);
            return;
        }
        var healTarget = this.tower.pos.findClosestByRange(FIND_MY_CREEPS, { filter: function (c) { return c.hits < c.hitsMax; } });
        if (healTarget != null) {
            this.tower.heal(healTarget);
            return;
        }
        var repairTarget = this.tower.room.find(FIND_STRUCTURES, { filter: function (x) { return RepairManager.emergencyTargetDelegate(x); } })[0];
        if (repairTarget != null && this.tower.energy > this.tower.energyCapacity / 2) {
            this.tower.repair(repairTarget);
            return;
        }
    };
    return MyTower;
}());
/// <reference path="../structures/myLink.ts" />
/// <reference path="./spawnManager.ts" />
/// <reference path="./spawnManager.ts" />
/// <reference path="./constructionManager.ts" />
/// <reference path="./repairManager.ts" />
/// <reference path="./upgradeManager.ts" />
/// <reference path="./spawnFillManager.ts" />
/// <reference path="./harvestingManager.ts" />
/// <reference path="./defenseManager.ts" />
/// <reference path="./reservationManager.ts" />
/// <reference path="./linkFillerManager.ts" />
/// <reference path="./roadConstructionManager.ts" />
/// <reference path="../structures/myTower.ts" />
var MainRoom = (function () {
    function MainRoom(roomName) {
        var _this = this;
        this._room = { time: -1, room: null };
        this._maxSpawnEnergy = { time: -1, maxSpawnEnergy: 300 };
        this._creeps = { time: -1, creeps: null };
        this._mainContainer = { time: -1, mainContainer: null };
        this._spawns = { time: -1, spawns: null };
        this.name = roomName;
        this.myRoom = Colony.getRoom(roomName);
        this.myRoom.mainRoom = this;
        if (this.myRoom.memory.mainRoomDistanceDescriptions == null)
            this.myRoom.memory.mainRoomDistanceDescriptions = {};
        this.myRoom.memory.mainRoomDistanceDescriptions[this.name] = { roomName: this.name, distance: 0 };
        //this.spawnNames = _.map(_.filter(Game.spawns, (s) => s.room.name == roomName), (s) => s.name);
        this.links = _.map(this.room.find(FIND_MY_STRUCTURES, { filter: function (x) { return x.structureType == STRUCTURE_LINK; } }), function (x) { return new MyLink(x, _this); });
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
        this.creepManagers = {
            constructionManager: new ConstructionManager(this),
            repairManager: new RepairManager(this),
            upgradeManager: new UpgradeManager(this),
            spawnFillManager: new SpawnFillManager(this),
            harvestingManager: new HarvestingManager(this),
            defenseManager: new DefenseManager(this),
            reservationManager: new ReservationManager(this),
            linkFillerManager: new LinkFillerManager(this)
        };
        this.update(true);
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
            if (this._room.time < Game.time)
                this._room = {
                    time: Game.time, room: Game.rooms[this.name]
                };
            return this._room.room;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MainRoom.prototype, "maxSpawnEnergy", {
        get: function () {
            if (this.creepManagers.spawnFillManager.creeps.length == 0)
                return 300;
            if (this._maxSpawnEnergy.time + 50 < Game.time)
                this._maxSpawnEnergy = {
                    time: Game.time, maxSpawnEnergy: this.getMaxSpawnEnergy()
                };
            return this._maxSpawnEnergy.maxSpawnEnergy;
            //return 400;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MainRoom.prototype, "creeps", {
        get: function () {
            var _this = this;
            if (this._creeps.time < Game.time)
                this._creeps = {
                    time: Game.time, creeps: _.filter(Game.creeps, function (c) { return c.memory.mainRoomName == _this.name && !c.memory.handledByColony; })
                };
            return this._creeps.creeps;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MainRoom.prototype, "mainContainer", {
        get: function () {
            if (this._mainContainer.time < Game.time) {
                if (this._mainContainer.time + 100 < Game.time || this._mainContainerId == null) {
                    this._mainContainer = {
                        time: Game.time, mainContainer: this.checkAndPlaceStorage()
                    };
                }
                else
                    this._mainContainer = { time: Game.time, mainContainer: Game.getObjectById(this._mainContainerId) };
            }
            return this._mainContainer.mainContainer;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MainRoom.prototype, "spawns", {
        get: function () {
            var _this = this;
            if (this._spawns.time < Game.time)
                this._spawns = {
                    time: Game.time, spawns: _.filter(Game.spawns, function (x) { return x.room.name == _this.name; })
                };
            return this._spawns.spawns;
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
                harvestingManager: null,
                defenseManager: null,
                reservationManager: null,
                roadConstructionManager: null,
                mainContainerId: null
            };
        return Colony.memory.mainRooms[this.name];
    };
    MainRoom.prototype.getMaxSpawnEnergy = function () {
        var maxSpawnEnergy = 0;
        this.extensionCount = this.room.find(FIND_MY_STRUCTURES, { filter: function (s) { return s.structureType == STRUCTURE_EXTENSION && s.isActive(); } }).length;
        if (this.extensionCount > CONTROLLER_STRUCTURES.extension[this.room.controller.level])
            this.extensionCount = CONTROLLER_STRUCTURES.extension[this.room.controller.level];
        if (this.room.controller.level == 8)
            maxSpawnEnergy = this.extensionCount * 200;
        else if (this.room.controller.level == 7)
            maxSpawnEnergy = this.extensionCount * 100;
        else
            maxSpawnEnergy = this.extensionCount * 50;
        maxSpawnEnergy += 300;
        //console.log('MAXENERGYCONDITION :' + this.name + ' creeps.length: ' + this.creeps.length + ', harverster length: ' + this.creepManagers.harvestingManager.harvesterCreeps.length);
        if (this.creeps.length == 0 || !this.mainContainer /*|| (this.mainContainer.store.energy == 0 && this.creepManagers.harvestingManager.harvesterCreeps.length == 0)*/)
            maxSpawnEnergy = Math.max(this.room.energyAvailable, 300);
        return maxSpawnEnergy;
    };
    MainRoom.prototype.getAllSources = function () {
        var sources = _.indexBy(_.map(this.myRoom.mySources, function (x) { return x; }), function (x) { return x.id; });
        for (var roomIdx in _.filter(this.connectedRooms, function (x) { return x.canHarvest; }))
            for (var sourceIdx in this.connectedRooms[roomIdx].mySources)
                sources[this.connectedRooms[roomIdx].mySources[sourceIdx].id] = this.connectedRooms[roomIdx].mySources[sourceIdx];
        return sources;
    };
    MainRoom.prototype.update = function (runAll) {
        var _this = this;
        if (runAll === void 0) { runAll = true; }
        if (runAll || (Game.time % 1) == 0) {
            this.connectedRooms = _.filter(Colony.rooms, function (r) { return r.name != _this.name && r.mainRoom && r.mainRoom.name == _this.name; });
            this.allRooms = this.connectedRooms.concat(this.myRoom);
        }
        this.sources = this.getAllSources();
        //this.sources = _this.myRoom.sources.concat(_.flatten(_.map(this.connectedRooms, (r) => _.values<MySource>(r.sources))));
        //this.sources = _.values<MySource>(this.myRoom.sources).concat(_.flatten(_.map(this.connectedRooms, (r) => _.values<MySource>(r.sources))));
    };
    MainRoom.prototype.placeExtensions = function () {
        //if (Game.time % 100 != 0)
        //    return;
        //var maxExtensions = CONTROLLER_STRUCTURES.extension[this.room.controller.level];
        //for (var i = maxExtensions - 1; i >= 0; i--) {
        //    var idiv5 = ~~(i / 5);
        //    var x = Math.ceil(idiv5 / 2);
        //    if (idiv5 % 2 == 1)
        //        x = -x;
        //    x += this.mainPosition.x;
        //    var y = this.mainPosition.y + 3 + (i % 5) * 2;//-(~~(i/5)%2)
        //    if ((idiv5 + 3) % 4 > 1)
        //        y--;
        //    var targetPos = new RoomPosition(x, y, this.name);
        //    if (targetPos.createConstructionSite(STRUCTURE_EXTENSION) == ERR_RCL_NOT_ENOUGH)
        //        break;
        //}
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
        if (Memory['verbose'])
            console.log('SpawnRoomHandler.placeStorage');
        var closestSource = this.mainPosition.findClosestByPath(FIND_SOURCES);
        var targetPos = null;
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
        targetPos.createConstructionSite(STRUCTURE_STORAGE);
    };
    MainRoom.prototype.checkAndPlaceMainContainer = function () {
        var mainContainer = null;
        this.memory.mainContainerId && (mainContainer = Game.getObjectById(this.memory.mainContainerId));
        if (mainContainer == null) {
            var candidates = this.mainPosition.findInRange(FIND_STRUCTURES, 4, {
                filter: function (s) { return s.structureType == STRUCTURE_CONTAINER; }
            });
            if (candidates.length > 0) {
                this.memory.mainContainerId = candidates[0].id;
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
        var startCpu;
        var endCpu;
        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        this.creepManagers.reservationManager.checkCreeps();
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('ReservationManager.checkCreeps: ' + (endCpu - startCpu).toFixed(2));
        }
        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        this.creepManagers.spawnFillManager.checkCreeps();
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('SpawnFillManager.checkCreeps: ' + (endCpu - startCpu).toFixed(2));
        }
        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        this.creepManagers.linkFillerManager.checkCreeps();
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('LinkFiller.checkCreeps: ' + (endCpu - startCpu).toFixed(2));
        }
        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        this.creepManagers.defenseManager.checkCreeps();
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('DefenseManager.checkCreeps: ' + (endCpu - startCpu).toFixed(2));
        }
        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        this.creepManagers.harvestingManager.checkCreeps();
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('HarvestingManager.checkCreeps: ' + (endCpu - startCpu).toFixed(2));
        }
        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        this.creepManagers.repairManager.createNewRepairers();
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('RepairManager.checkCreeps: ' + (endCpu - startCpu).toFixed(2));
        }
        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        this.creepManagers.constructionManager.checkCreeps();
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('ConstructionManager.checkCreeps: ' + (endCpu - startCpu).toFixed(2));
        }
        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        this.creepManagers.upgradeManager.checkCreeps();
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('UpgradeManager.checkCreeps: ' + (endCpu - startCpu).toFixed(2));
        }
    };
    MainRoom.prototype.tickCreeps = function () {
        var startCpu;
        var endCpu;
        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        this.creepManagers.spawnFillManager.tick();
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('SpawnFillManager.tick: ' + (endCpu - startCpu).toFixed(2));
        }
        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        this.creepManagers.linkFillerManager.tick();
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('LinkFillerManager.tick: ' + (endCpu - startCpu).toFixed(2));
        }
        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        this.creepManagers.harvestingManager.tick();
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('HarvestingManager.tick: ' + (endCpu - startCpu).toFixed(2));
        }
        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        this.creepManagers.repairManager.tick();
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('RepairManager.tick: ' + (endCpu - startCpu).toFixed(2));
        }
        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        this.creepManagers.constructionManager.tick();
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('ConstructionManager.tick: ' + (endCpu - startCpu).toFixed(2));
        }
        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        this.creepManagers.upgradeManager.tick();
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('UpgradeManager.tick: ' + (endCpu - startCpu).toFixed(2));
        }
        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        this.creepManagers.defenseManager.tick();
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('DefenseManager.tick: ' + (endCpu - startCpu).toFixed(2));
        }
        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        this.creepManagers.reservationManager.tick();
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('ReservationManager.tick: ' + (endCpu - startCpu).toFixed(2));
        }
    };
    MainRoom.prototype.tick = function () {
        var _this = this;
        //console.log('Memory Test= ' + JSON.stringify(Memory['colony']['rooms']['E21S22']['test']));
        var startCpu;
        var endCpu;
        console.log('MainRoom ' + this.name + ': ' + this.creeps.length + ' creeps');
        if (Memory['verbose'])
            console.log('SpawnRoomHandler.tick');
        if (this.room == null)
            return;
        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        this.update();
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('MainRoom.update: ' + (endCpu - startCpu).toFixed(2));
        }
        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        this.links.forEach(function (x) { return x.tick(); });
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('MainRoom.links.tick: ' + (endCpu - startCpu).toFixed(2));
        }
        //if (Memory['trace'])
        //    startCpu = Game.cpu.getUsed();
        //this.checkAndPlaceStorage();
        //if (Memory['trace']) {
        //    endCpu = Game.cpu.getUsed();
        //    console.log('MainRoom.checAndPlaceStorage: ' + (endCpu - startCpu).toFixed(2));
        //}
        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        this.placeExtensions();
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('MainRoom.placeExtensions: ' + (endCpu - startCpu).toFixed(2));
        }
        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        if (this.mainContainer && this.room.controller.level > 1)
            this.creepManagers.harvestingManager.placeSourceContainers();
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('HarvestingManager.placeSourceContainers: ' + (endCpu - startCpu).toFixed(2));
        }
        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        if (this.mainContainer)
            this.roadConstructionManager.tick();
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('RoadConstructionManager.tick: ' + (endCpu - startCpu).toFixed(2));
        }
        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        this.allRooms.forEach(function (r) { return r.scanForHostiles(); });
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('MainRoom.scanForHostiles: ' + (endCpu - startCpu).toFixed(2));
        }
        if (this.creeps.length > 0)
            this.checkCreeps();
        else
            this.creepManagers.harvestingManager.checkCreeps();
        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        this.spawnManager.spawn();
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('MainRoom.spawnManager.spawn: ' + (endCpu - startCpu).toFixed(2));
        }
        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        this.room.find(FIND_MY_STRUCTURES, { filter: function (x) { return x.structureType == STRUCTURE_TOWER; } }).forEach(function (x) { return new MyTower(x, _this).tick(); });
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('Tower.tick: ' + (endCpu - startCpu).toFixed(2));
        }
        this.tickCreeps();
        if (Game.time % 100 == 0)
            for (var idx in this.allRooms) {
                var myRoom = this.allRooms[idx];
                myRoom.scan();
            }
    };
    return MainRoom;
}());
/// <reference path="../components/creeps/body.ts" />
/// <reference path="../components/rooms/mainRoom.ts" />
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
        if (creep.memory.state == null)
            creep.memory.state = 'moving';
        if (creep.room.name != creep.memory.targetPosition.roomName) {
            creep.moveTo(new RoomPosition(creep.memory.targetPosition.x, creep.memory.targetPosition.y, creep.memory.targetPosition.roomName));
        }
        else {
            if (creep.memory.state == 'moving') {
                creep.moveTo(new RoomPosition(creep.memory.targetPosition.x, creep.memory.targetPosition.y, creep.memory.targetPosition.roomName));
                creep.memory.state = 'harvesting';
            }
            else if (creep.carry.energy == creep.carryCapacity && creep.memory.state == 'harvesting')
                creep.memory.state = 'constructing';
            else if (creep.carry.energy == 0 && creep.memory.state == 'constructing')
                creep.memory.state = 'harvesting';
            if (creep.memory.state == 'harvesting') {
                var source = Game.getObjectById(creep.memory.sourceId);
                if (creep.harvest(source) == ERR_NOT_IN_RANGE)
                    creep.moveTo(source);
            }
            else if (creep.memory.state == 'constructing') {
                var construction = creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES, { filter: function (x) { return x.structureType == STRUCTURE_SPAWN; } });
                if (construction != null) {
                    if (creep.build(construction) == ERR_NOT_IN_RANGE)
                        creep.moveTo(construction);
                }
                else {
                    if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE)
                        creep.moveTo(creep.room.controller);
                }
            }
        }
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
        var _loop_4 = function(idx) {
            var mySource = sources[idx];
            var creepCount = _.filter(this_3.spawnConstructors, function (x) { return x.memory.sourceId == mySource.id; }).length;
            if (creepCount < 1) {
                mainRoom.spawnManager.addToQueue(['work', 'work', 'work', 'work', 'work', 'carry', 'carry', 'carry', 'carry', 'carry', 'carry', 'carry', 'carry', 'carry', 'carry', 'move', 'move', 'move', 'move', 'move'], { handledByColony: true, claimingManager: this_3.roomName, role: 'spawnConstructor', targetPosition: this_3.targetPosition, sourceId: mySource.id }, 2 - creepCount);
                needCreeps = true;
            }
        };
        var this_3 = this;
        for (var idx in sources) {
            _loop_4(idx);
        }
        return !needCreeps;
    };
    ClaimingManager.prototype.finishClaimingManager = function () {
        var mainRoom = new MainRoom(this.roomName);
        Colony.mainRooms[this.roomName] = mainRoom;
        var myRoom = Colony.rooms[this.roomName];
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
    };
    ClaimingManager.prototype.tick = function () {
        var _this = this;
        var room = Game.rooms[this.roomName];
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
var Invader = (function () {
    function Invader(creep) {
        this.creep = creep;
        this.memory = this.creep.memory;
        var body = Body.getFromCreep(this.creep);
        this.isWarrior = (body.ranged_attack + body.attack) > 0;
        this.isWorker = body.work > 0;
    }
    Invader.prototype.attack = function (target) {
        if (target == null || !this.isWarrior)
            return false;
        if (this.creep.attack(target) == ERR_NOT_IN_RANGE)
            this.creep.moveTo(target);
        this.creep.rangedAttack(target);
        return true;
    };
    Invader.prototype.dismantle = function (target) {
        if (target == null)
            return false;
        else if (this.isWorker) {
            if (this.creep.dismantle(target) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(target);
            return true;
        }
        else if (this.isWarrior) {
            if (this.creep.attack(target) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(target);
            this.creep.rangedAttack(target);
            return true;
        }
        else
            return false;
    };
    Invader.prototype.tick = function () {
        this.memory = this.creep.memory;
        if (this.memory.state == 'rally') {
            if (!this.creep.pos.inRangeTo(new RoomPosition(this.memory.rallyPoint.x, this.memory.rallyPoint.y, this.memory.rallyPoint.roomName), 3))
                this.creep.moveTo(new RoomPosition(this.memory.rallyPoint.x, this.memory.rallyPoint.y, this.memory.rallyPoint.roomName));
        }
        else {
            if (this.creep.room.name != this.memory.targetRoomName) {
                this.creep.moveTo(new RoomPosition(25, 25, this.memory.targetRoomName));
            }
            else {
                //this.creep.moveTo(new RoomPosition(25, 25, this.memory.targetRoomName));
                this.attack(this.creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS, { filter: function (c) { return Body.getFromCreep(c).isMilitary(); } }))
                    || this.dismantle(this.creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, { filter: function (x) { return x.structureType == STRUCTURE_TOWER && x.energy > 0; } }))
                    || this.dismantle(this.creep.pos.findClosestByPath(FIND_HOSTILE_SPAWNS))
                    || this.dismantle(this.creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, { filter: function (x) { return x.structureType == STRUCTURE_EXTENSION; } }))
                    || this.attack(this.creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS))
                    || this.dismantle(this.creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, { filter: function (x) { return x.structureType != STRUCTURE_CONTROLLER; } }));
            }
        }
    };
    return Invader;
}());
/// <reference path="../components/creeps/invader/invader.ts" />
var InvasionManager = (function () {
    function InvasionManager(roomName) {
        this.roomName = roomName;
        this.memory.targetRoomName = roomName;
    }
    Object.defineProperty(InvasionManager.prototype, "memory", {
        get: function () {
            return this.accessMemory();
        },
        enumerable: true,
        configurable: true
    });
    InvasionManager.prototype.accessMemory = function () {
        if (Colony.memory.invasionManagers == null)
            Colony.memory.invasionManagers = {};
        if (Colony.memory.invasionManagers[this.roomName] == null)
            Colony.memory.invasionManagers[this.roomName] = {
                targetRoomName: this.roomName,
                verbose: false
            };
        return Colony.memory.invasionManagers[this.roomName];
    };
    InvasionManager.prototype.checkScouts = function (myRoom) {
        var _this = this;
        if (myRoom == null || myRoom.memory.lastScanTime < Game.time - 500) {
            if (this.scouts.length == 0) {
                if (myRoom && myRoom.closestMainRoom) {
                    var mainRoom = myRoom.closestMainRoom;
                    mainRoom.spawnManager.addToQueue(['move', 'work'], { handledByColony: true, invasionManager: this.roomName, role: 'scout', targetPosition: new RoomPosition(25, 25, this.roomName) }, 1, true);
                }
                else {
                    var mainRoom = _.sortBy(_.values(Colony.mainRooms), function (x) { return Game.map.getRoomLinearDistance(x.name, _this.roomName); })[0];
                    mainRoom.spawnManager.addToQueue(['move', 'work'], { handledByColony: true, invasionManager: this.roomName, role: 'scout', targetPosition: new RoomPosition(25, 25, this.roomName) }, 1);
                }
            }
            return false;
        }
        else
            return true;
    };
    InvasionManager.prototype.checkInvaders = function (myRoom, rallyFlag) {
        var _this = this;
        if (myRoom == null)
            return false;
        var creepsRequired = 5;
        console.log('check invaders');
        if (this.invaders.length < creepsRequired) {
            var mainRoom = myRoom.closestMainRoom;
            if (mainRoom == null)
                return false;
            var idleInvaders = _.filter(Game.creeps, function (x) { return x.memory.handledByColony && x.memory.role == 'invader' && x.memory.subRole == 'attacker' && x.memory.invasionManager == null; });
            idleInvaders.forEach(function (x) { return x.memory = { handledByColony: true, invasionManager: _this.roomName, targetRoomName: _this.roomName, role: 'invader', state: 'rally', subRole: 'attacker', rallyPoint: rallyFlag.pos }; });
            if (idleInvaders.length == 0)
                mainRoom.spawnManager.addToQueue(DefenderDefinition.getDefinition(mainRoom.maxSpawnEnergy).getBody(), { handledByColony: true, invasionManager: this.roomName, targetRoomName: this.roomName, role: 'invader', state: 'rally', subRole: 'attacker', rallyPoint: rallyFlag.pos }, creepsRequired - this.invaders.length);
            return false;
        }
        else
            return true;
    };
    InvasionManager.prototype.checkDismantlers = function (myRoom, rallyFlag) {
        var _this = this;
        if (myRoom == null)
            return false;
        var creepsRequired = 5;
        if (this.dismantlers.length < creepsRequired) {
            var mainRoom = myRoom.closestMainRoom;
            if (mainRoom == null)
                return false;
            var idleInvaders = _.filter(Game.creeps, function (x) { return x.memory.handledByColony && x.memory.role == 'invader' && x.memory.subRole == 'dismantler' && x.memory.invasionManager == null; });
            idleInvaders.forEach(function (x) { return x.memory = { handledByColony: true, invasionManager: _this.roomName, targetRoomName: _this.roomName, role: 'invader', state: 'rally', subRole: 'dismantler', rallyPoint: rallyFlag.pos }; });
            if (idleInvaders.length == 0) {
                var moduleCount = Math.floor(mainRoom.maxSpawnEnergy / 150);
                moduleCount = Math.min(moduleCount, 25);
                var body = new Body();
                body.work = moduleCount;
                body.move = moduleCount;
                mainRoom.spawnManager.addToQueue(body.getBody(), { handledByColony: true, invasionManager: this.roomName, targetRoomName: this.roomName, role: 'invader', state: 'rally', subRole: 'dismantler', rallyPoint: rallyFlag.pos }, creepsRequired - this.dismantlers.length);
            }
            return false;
        }
        else
            return true;
    };
    InvasionManager.prototype.endInvasion = function (rallyFlag) {
        var _this = this;
        console.log('END INVASION. ' + this.roomName);
        this.creeps.forEach(function (x) { x.memory = { role: x.memory.role, subRole: x.memory.subRole, handledByColony: true }; });
        if (Colony.memory.invasionManagers != null)
            delete Colony.memory.invasionManagers[this.roomName];
        delete Colony.invasionManagers[this.roomName];
        var invasionFlag = _.filter(Game.flags, function (x) { return x.memory.invasion == true && x.pos.roomName == _this.roomName; })[0];
        if (invasionFlag != null)
            invasionFlag.remove();
        if (rallyFlag != null)
            delete rallyFlag.memory.invasionRoomName;
    };
    InvasionManager.prototype.tick = function () {
        var _this = this;
        var rallyFlag = _.filter(Game.flags, function (x) { return x.memory.rally == true && x.memory.invasionRoomName == _this.roomName; })[0];
        this.creeps = _.filter(Game.creeps, function (x) { return x.memory.handledByColony == true && x.memory.invasionManager == _this.roomName; });
        this.scouts = _.filter(this.creeps, function (x) { return x.memory.targetPosition != null && x.memory.targetPosition.roomName == _this.roomName && x.memory.role == 'scout'; });
        this.invaders = _.filter(this.creeps, function (x) { return x.memory.role == 'invader' && x.memory.subRole == 'attacker'; });
        this.dismantlers = _.filter(this.creeps, function (x) { return x.memory.role == 'invader' && x.memory.subRole == 'dismantler'; });
        var room = Game.rooms[this.roomName];
        if (room != null && room.find(FIND_HOSTILE_STRUCTURES, { filter: function (x) { return x.structureType != STRUCTURE_CONTROLLER; } }).length == 0 && room.find(FIND_HOSTILE_CREEPS).length == 0) {
            this.endInvasion(rallyFlag);
            return;
        }
        var myRoom = Colony.getRoom(this.roomName);
        if (rallyFlag && this.checkScouts(myRoom) && this.checkDismantlers(myRoom, rallyFlag) && this.checkInvaders(myRoom, rallyFlag)) {
            console.log(rallyFlag.pos.roomName);
            if (_.every(this.invaders, function (x) { return x.pos.inRangeTo(rallyFlag.pos, 5); }) && _.every(this.dismantlers, function (x) { return x.pos.inRangeTo(rallyFlag.pos, 5); })) {
                this.creeps.forEach(function (x) { return x.memory.state = 'attack'; });
            }
        }
        this.invaders.forEach(function (x) { return new Invader(x).tick(); });
        this.dismantlers.forEach(function (x) { return new Invader(x).tick(); });
    };
    return InvasionManager;
}());
var METRICSOURCEDISTANCE = 1;
var METRICSOURCE = 0.5;
var METRICROOM = 0.5;
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
            //console.log('MaxMetric for ' + this.mainRoom.name + ': ' + this.mainRoom.spawns.length * MAXMETRIC);
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
        var value = METRICROOM + (myRoom.useableSources.length * ((myRoom.memory.mainRoomDistanceDescriptions[this.mainRoom.name].distance * METRICSOURCEDISTANCE) + METRICSOURCE));
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
    function RoomAssignmentHandler(rooms, mainRooms) {
        var _this = this;
        this.mainRooms = mainRooms;
        this.forbidden = ['E15S26', 'E15S27', 'E15S28', 'E15S29', 'E11S25', 'E12S25', 'E13S25', 'E14S25', 'E15S25'];
        this.assignments = {};
        this.roomsToAssign = {};
        _.forEach(mainRooms, function (x) { return _this.assignments[x.name] = new RoomAssignment(x); });
        _.forEach(_.filter(rooms, this.roomFilter.bind(this)), function (x) { return _this.roomsToAssign[x.name] = x; });
    }
    RoomAssignmentHandler.prototype.roomFilter = function (myRoom) {
        return _.every(this.forbidden, function (x) { return x != myRoom.name; }) && !Game.map.isRoomProtected(myRoom.name) && myRoom.useableSources.length > 0 && !myRoom.memory.foreignOwner && !myRoom.memory.foreignReserver && _.min(myRoom.memory.mainRoomDistanceDescriptions, function (x) { return x.distance; }).distance <= MAXDISTANCE;
    };
    RoomAssignmentHandler.prototype.assignRoomsByMinDistance = function () {
        var _this = this;
        _.forEach(_.sortByAll(_.values(this.roomsToAssign), function (x) { return [_.min(x.memory.mainRoomDistanceDescriptions, function (y) { return y.distance; }).distance, (10 - x.useableSources.length)]; }, ['asc', 'desc']), function (myRoom) {
            var possibleMainRooms = _.filter(myRoom.memory.mainRoomDistanceDescriptions, function (x) { return (x.distance <= MAXDISTANCE) && (x.distance <= 2 || x.distance == 2 && myRoom.useableSources.length > 1) && _this.assignments[x.roomName].canAssignRoom(myRoom); });
            console.log('Room: [' + myRoom.name + '] Distances to MainRooms [' + _.map(possibleMainRooms, function (x) { return x.roomName + ' ' + x.distance; }).join(', ') + ']');
            //console.log('Room: [' + myRoom.name + '] Possible MainRooms [' + _.map(possibleMainRooms, x => x.roomName).join(', ') + ']');
            var sorted = _.sortBy(possibleMainRooms, function (x) { return x.distance; });
            if (sorted.length == 1 || sorted.length >= 1 && sorted[0].distance < sorted[1].distance) {
                console.log('Assigning: ' + sorted[0].roomName);
                //console.log('Trying to add room [' + myRoom.name + '] to mainRoom [' + sorted[0].roomName + ']');
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
                if ((distanceDescription.distance <= 2 || distanceDescription.distance == 2 && myRoom.useableSources.length > 1) && _this.assignments[distanceDescription.roomName].canAssignRoom(myRoom)) {
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
        var mainRoomCandidates = this.getMainRoomCandidates();
        Memory['MainRoomCandidates'] = _.map(mainRoomCandidates, function (x) {
            return { mainRoom: x.mainRoom.name, myRooms: _.map(x.myRooms, function (y) { return y.name; }) };
        });
        while (_.size(mainRoomCandidates) > 0) {
            var candidate = _.sortByAll(_.filter(mainRoomCandidates, function (x) { return x; }), function (x) { return [_.size(x.myRooms), _this.assignments[x.mainRoom.name].freeMetric]; })[0];
            var rooms = _.sortByAll(_.values(candidate.myRooms), [function (x) { return 10 - _.size(x.mySources); }, function (x) { return x.name; }]);
            //console.log('TryAddRoom: '+this.roomsToAssign[candidate.myRooms[0].name]);
            this.assignments[candidate.mainRoom.name].tryAddRoom(rooms[0]);
            delete this.roomsToAssign[rooms[0].name];
            mainRoomCandidates = this.getMainRoomCandidates();
        }
    };
    RoomAssignmentHandler.prototype.getAssignments = function () {
        this.assignRoomsByMinDistance();
        this.assignCollisions();
        return _.indexBy(_.map(this.assignments, function (x) {
            return {
                mainRoom: x.mainRoom,
                myRooms: x.assignedRooms
            };
        }), function (x) { return x.mainRoom.name; });
    };
    return RoomAssignmentHandler;
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
            console.log();
            for (var i in this.results) {
                var result = this.results[i];
                console.log('Trace CPU Used: ' + result.usedCpu.toFixed(2) + ' Count: ' + result.count + ': ' + this.name + ': ' + result.name);
            }
        }
    };
    Tracer.prototype.reset = function () {
        this.results = {};
    };
    return Tracer;
}());
var RoomPos = (function () {
    function RoomPos() {
    }
    RoomPos.fromObj = function (obj) {
        return new RoomPosition(obj.x, obj.y, obj.roomName);
    };
    return RoomPos;
}());
/// <reference path="../../tracer.ts" />
/// <reference path="../../memoryObject.ts" />
/// <reference path="../../helpers.ts" />
var MySourceMemory = (function () {
    function MySourceMemory() {
    }
    return MySourceMemory;
}());
var MySource = (function (_super) {
    __extends(MySource, _super);
    function MySource(id, myRoom) {
        _super.call(this);
        this.id = id;
        this.myRoom = myRoom;
        this.memoryInitialized = false;
        this._room = { time: -1, room: null };
        this._source = { time: -1, source: null };
        this._sourceDropOffContainer = { time: -1, sourceDropOffContainer: null };
        this._dropOffStructre = { time: -1, dropOffStructure: null };
        this._nearByConstructionSite = { time: -1, constructionSite: null };
        this.tracer = new Tracer('MySource ' + id);
        Colony.tracers.push(this.tracer);
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
            var mem = new MySourceMemory();
            mem.id = this.id;
            this.myRoom.memory.sources[this.id] = mem;
            mem.pos = this.source.pos;
        }
        this.memoryInitialized = true;
        return this.myRoom.memory.sources[this.id];
    };
    Object.defineProperty(MySource.prototype, "room", {
        get: function () {
            var trace = this.tracer.start('Property room');
            if (this._room.time < Game.time)
                this._room = {
                    time: Game.time, room: Game.rooms[this.pos.roomName]
                };
            trace.stop();
            return this._room.room;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "source", {
        get: function () {
            var trace = this.tracer.start('Property source');
            if (this._source.time < Game.time)
                this._source = { time: Game.time, source: Game.getObjectById(this.id) };
            trace.stop();
            return this._source.source;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "sourceDropOffContainer", {
        get: function () {
            var trace = this.tracer.start('Property sourceDropOffContainer');
            if (this._sourceDropOffContainer.time == Game.time)
                return this._sourceDropOffContainer.sourceDropOffContainer;
            if (this.source && (!this.memory.sourceDropOffContainer || (this.memory.sourceDropOffContainer.time + 50) < Game.time)) {
                var structure = this.getSourceDropOffContainer();
                this._sourceDropOffContainer = { time: Game.time, sourceDropOffContainer: structure };
                this.memory.sourceDropOffContainer = { time: Game.time, value: structure ? { id: structure.id, pos: structure ? structure.pos : null } : null };
                trace.stop();
                return structure;
            }
            else {
                var structure = null;
                if (this.memory.sourceDropOffContainer.value)
                    structure = Game.getObjectById(this.memory.sourceDropOffContainer.value.id);
                if (structure == null && this.memory.sourceDropOffContainer && this.memory.sourceDropOffContainer.value != null)
                    structure = {
                        id: this.memory.sourceDropOffContainer.value.id,
                        pos: RoomPos.fromObj(this.memory.sourceDropOffContainer.value.pos)
                    };
                this._sourceDropOffContainer = { time: Game.time, sourceDropOffContainer: structure };
                trace.stop();
                return structure ? structure : null;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "dropOffStructure", {
        get: function () {
            var trace = this.tracer.start('Property dropOffStructure');
            if (this._dropOffStructre.time == Game.time)
                return this._dropOffStructre.dropOffStructure;
            if (this.source && (!this.memory.dropOffStructure || this.memory.dropOffStructure.time + 50 < Game.time)) {
                var structure = this.getDropOffStructure();
                this.memory.dropOffStructure = { time: Game.time, value: structure ? { id: structure.id, pos: structure.pos } : null };
                trace.stop();
                return structure;
            }
            else {
                var structure = Game.getObjectById(this.memory.dropOffStructure.value.id);
                trace.stop();
                this._dropOffStructre = { time: Game.time, dropOffStructure: structure };
                return structure ? structure : (this.memory.dropOffStructure ? { id: this.memory.dropOffStructure.value.id, pos: RoomPos.fromObj(this.memory.dropOffStructure.value.pos) } : null);
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "nearByConstructionSite", {
        get: function () {
            var trace = this.tracer.start('Property nearByConstruction');
            if (this._nearByConstructionSite.time + 10 < Game.time) {
                this._nearByConstructionSite = {
                    time: Game.time, constructionSite: _.filter(RoomPos.fromObj(this.memory.pos).findInRange(FIND_CONSTRUCTION_SITES, 4))[0]
                };
            }
            trace.stop();
            return this._nearByConstructionSite.constructionSite;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "pos", {
        get: function () {
            var trace = this.tracer.start('Property pos');
            trace.stop();
            return this.source != null ? this.source.pos : RoomPos.fromObj(this.memory.pos);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "maxHarvestingSpots", {
        get: function () {
            var trace = this.tracer.start('Property maxHarvestingSpots');
            if (this.memory.harvestingSpots != null || this.source == null) {
                trace.stop();
                return this.memory.harvestingSpots;
            }
            else {
                var pos = this.source.pos;
                trace.stop();
                return _.filter(this.source.room.lookForAtArea(LOOK_TERRAIN, pos.y - 1, pos.x - 1, pos.y + 1, pos.x + 1, true), function (x) { return x.terrain == 'swamp' || x.terrain == 'plain'; }).length;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "hasKeeper", {
        get: function () {
            var trace = this.tracer.start('Property keeper');
            if (this.memory.keeper != null) {
                trace.stop();
                return this.memory.keeper;
            }
            else {
                this.memory.keeper = this.source.pos.findInRange(FIND_STRUCTURES, 5, { filter: function (s) { return s.structureType == STRUCTURE_KEEPER_LAIR; } }).length > 0;
                trace.stop();
                return this.memory.keeper;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "roadBuiltToMainContainer", {
        get: function () {
            return this.memory.mainContainerRoadBuiltTo;
        },
        set: function (value) {
            this.memory.mainContainerRoadBuiltTo = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "pathLengthToMainContainer", {
        get: function () {
            var trace = this.tracer.start('Property pathLengthToMainContainer');
            if (this.memory.mainContainerPathLength != null || this.source == null) {
                trace.stop();
                return this.memory.mainContainerPathLength;
            }
            else {
                var pathLength = PathFinder.search(this.myRoom.mainRoom.spawns[0].pos, { pos: this.source.pos, range: 1 }).path.length;
                this.memory.mainContainerPathLength = pathLength;
                trace.stop();
                return pathLength;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "requiresCarrier", {
        get: function () {
            //console.log('Requires Carrier: sourceDropOff: ' + ((this.sourceDropOffContainer) ? 'true' : 'false'));
            //if (this.room)
            //    console.log('Requires Carrier: getSourceDropOff: ' + (this.getSourceDropOffContainer() ? 'true' : 'false'));
            //console.log('Requires Carrier: mainContainer: ' + (this.myRoom.mainRoom.mainContainer ? 'true' : 'false'));
            //console.log('Requires Carrier: hasLink: ' + (this.hasLink ? 'true' : 'false'));
            return this.sourceDropOffContainer != null && this.myRoom.mainRoom.mainContainer != null && !this.hasLink;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "energyCapacity", {
        get: function () {
            var trace = this.tracer.start('Property energyCapacity');
            if (this.source)
                this.memory.energyCapacity = this.source.energyCapacity;
            trace.stop();
            return this.memory.energyCapacity;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MySource.prototype, "hasLink", {
        get: function () {
            var trace = this.tracer.start('Property hasLink');
            if ((this.memory.hasLink == null || (Game.time % 100 == 0)) && this.source) {
                this.memory.hasLink = this.source.pos.findInRange(FIND_STRUCTURES, 4, { filter: function (x) { return x.structureType == STRUCTURE_LINK; } }).length > 0;
            }
            trace.stop();
            return this.memory.hasLink;
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
    Object.defineProperty(MySource.prototype, "containerMissing", {
        get: function () {
            if (this.requiresCarrier || this.hasLink)
                return false;
            return this.pos.findInRange(FIND_CONSTRUCTION_SITES, 4, {
                filter: function (s) { return (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE || s.structureType == STRUCTURE_LINK); }
            }).length == 0;
        },
        enumerable: true,
        configurable: true
    });
    MySource.prototype.getSourceDropOffContainer = function () {
        var containerCandidate = this.pos.findInRange(FIND_STRUCTURES, 4, {
            filter: function (s) { return (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE) && s.isActive(); }
        })[0];
        return containerCandidate;
    };
    MySource.prototype.getDropOffStructure = function () {
        var linkCandidate = this.pos.findInRange(FIND_MY_STRUCTURES, 4, {
            filter: function (s) { return s.structureType == STRUCTURE_LINK && s.isActive(); }
        })[0];
        if (this.myRoom.mainRoom.creepManagers.harvestingManager.sourceCarrierCreeps.length > 0) {
            var sourceDropOff = this.getSourceDropOffContainer();
            if (sourceDropOff && sourceDropOff.structureType == STRUCTURE_STORAGE)
                return sourceDropOff;
            else if (linkCandidate)
                return linkCandidate;
            else if (sourceDropOff)
                return sourceDropOff;
        }
        if (linkCandidate)
            return linkCandidate;
        if (this.myRoom.mainRoom.creepManagers.spawnFillManager.creeps.length > 0) {
            if (this.myRoom.mainRoom.mainContainer)
                return this.myRoom.mainRoom.mainContainer;
        }
        if (this.myRoom.mainRoom.spawns[0])
            return this.myRoom.mainRoom.spawns[0];
        return null;
    };
    return MySource;
}(MemoryObject));
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
/// <reference path="../sources/mySource.ts" />
/// <reference path="../structures/myContainer.ts" />
var MyRoom = (function () {
    function MyRoom(name) {
        this.name = name;
        this._room = { time: -1, room: null };
        this._myContainers = { time: -101, myContainers: {} };
        this._mySources = null;
        this._mainRoom = null;
        this.memory.name = name;
        if (this.room != null)
            this.scan();
    }
    Object.defineProperty(MyRoom.prototype, "memory", {
        get: function () {
            return this.accessMemory();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyRoom.prototype, "room", {
        get: function () {
            if (this._room.time < Game.time)
                this._room = {
                    time: Game.time, room: Game.rooms[this.name]
                };
            return this._room.room;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyRoom.prototype, "myContainers", {
        get: function () {
            var _this = this;
            if (((this._myContainers.time + 100) < Game.time || this.memory.containers == null) && this.room) {
                var containers = _.map(this.room.find(FIND_STRUCTURES, { filter: function (x) { return x.structureType == STRUCTURE_CONTAINER; } }), function (x) { return new MyContainer(x.id, _this); });
                this._myContainers = {
                    time: Game.time,
                    myContainers: _.indexBy(containers, function (x) { return x.id; })
                };
            }
            return this._myContainers.myContainers;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyRoom.prototype, "canHarvest", {
        get: function () {
            return (this.mainRoom && this.name == this.mainRoom.name || !(this.memory.foreignOwner || this.memory.foreignReserver));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyRoom.prototype, "mySources", {
        get: function () {
            var _this = this;
            //return _.indexBy(_.map(this.room.find<Source>(FIND_SOURCES), x => new MySource(x.id, this)), (x) => x.id);
            if (this._mySources == null) {
                if (this.memory.sources == null && this.room) {
                    this._mySources = { time: Game.time, mySources: _.indexBy(_.map(this.room.find(FIND_SOURCES), function (x) { return new MySource(x.id, _this); }), function (x) { return x.id; }) };
                }
                else if (this.memory.sources != null) {
                    this._mySources = { time: Game.time, mySources: _.indexBy(_.map(this.memory.sources, function (x) { return new MySource(x.id, _this); }), function (x) { return x.id; }) };
                }
            }
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
            return _.filter(this.mySources, function (x) { return !x.hasKeeper; });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyRoom.prototype, "mainRoom", {
        get: function () {
            if (this._mainRoom == null)
                this._mainRoom = Colony.mainRooms[this.memory.mainRoomName];
            return this._mainRoom;
        },
        set: function (value) {
            this._mainRoom = value;
            this.memory.mainRoomName = value == null ? null : value.name;
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
                hostiles: false,
                foreignOwner: null,
                foreignReserver: null,
                lastScanTime: null,
                mainRoomDistanceDescriptions: null,
                mainRoomName: null
            };
        return Colony.memory.rooms[this.name];
    };
    Object.defineProperty(MyRoom.prototype, "closestMainRoom", {
        get: function () {
            if (this.memory.mainRoomDistanceDescriptions == null || _.size(this.memory.mainRoomDistanceDescriptions) == 0)
                return null;
            return Colony.mainRooms[_.min(this.memory.mainRoomDistanceDescriptions, function (x) { return x.distance; }).roomName];
        },
        enumerable: true,
        configurable: true
    });
    MyRoom.prototype.scan = function () {
        var room = this.room;
        if (this.exits == null) {
            this.exits = {};
            var exits = Game.map.describeExits(this.name);
            if (exits != null)
                for (var exitDirection in exits)
                    this.exits[exitDirection] = exits[exitDirection];
        }
        if (room == null)
            return;
        this.memory.foreignOwner = room.controller != null && room.controller.owner != null && room.controller.owner.username != Colony.myName;
        this.memory.foreignReserver = room.controller != null && room.controller.reservation != null && room.controller.reservation.username != Colony.myName;
        this.memory.lastScanTime = Game.time;
    };
    MyRoom.prototype.scanForHostiles = function () {
        if (this.room == null)
            return;
        this.memory.hostiles = this.room.find(FIND_HOSTILE_CREEPS, { filter: function (c) { return c.owner.username != 'Source Keeper'; } }).length > 0;
    };
    return MyRoom;
}());
var Scout = (function () {
    function Scout(creep) {
        this.creep = creep;
        this.memory = creep.memory;
    }
    Scout.prototype.tick = function () {
        this.creep.say('SCOUT');
        this.memory = this.creep.memory;
        var pos = this.creep.pos;
        if (this.memory.targetPosition != null && (pos.roomName != this.memory.targetPosition.roomName || pos.x < 10 || pos.x > 40 || pos.y < 10 || pos.y > 40)) {
            //let path = this.creep.pos.findPathTo(new RoomPosition(25, 25, this.memory.targetRoomName), { ignoreDestructibleStructures: true });
            var result = this.creep.moveTo(new RoomPosition(25, 25, this.memory.targetPosition.roomName), { reusePath: 50 });
            if (result == ERR_NO_PATH)
                this.creep.suicide();
        }
        if (this.memory.targetPosition && pos.roomName == this.memory.targetPosition.roomName) {
            var myRoom = Colony.getRoom(pos.roomName);
            if (myRoom.memory.lastScanTime < Game.time - 100)
                myRoom.scan();
        }
    };
    return Scout;
}());
/// <reference path="./claimingManager.ts" />
/// <reference path="./invasionManager.ts" />
/// <reference path="./roomAssignment.ts" />
/// <reference path="../components/rooms/mainRoom.ts" />
/// <reference path="../components/rooms/myRoom.ts" />
/// <reference path="../components/creeps/scout/scout.ts" />
/// <reference path="../tracer.ts" />
var Colony;
(function (Colony) {
    Colony.tracers = [];
    Colony.mainRooms = {};
    Colony.rooms = {};
    Colony.claimingManagers = {};
    Colony.invasionManagers = {};
    function getRoom(roomName) {
        var room = Colony.rooms[roomName];
        if (room) {
            return room;
        }
        if (!Colony.memory.rooms[roomName] && !Game.rooms[roomName]) {
            return null;
        }
        else {
            var myRoom = new MyRoom(roomName);
            Colony.rooms[roomName] = myRoom;
            if (myRoom.memory.mainRoomDistanceDescriptions == null)
                calculateDistances(myRoom);
            return Colony.rooms[roomName];
        }
    }
    Colony.getRoom = getRoom;
    var forbidden = ['E15S26', 'E15S27', 'E15S28', 'E15S29', 'E11S25', 'E12S25', 'E13S25', 'E14S25', 'E15S25'];
    function assignMainRoom(room) {
        calculateDistances(room);
        return room.mainRoom;
    }
    Colony.assignMainRoom = assignMainRoom;
    function shouldSendScout(roomName) {
        var myRoom = getRoom(roomName);
        var result = !Game.map.isRoomProtected(roomName) && !(myRoom != null && myRoom.mainRoom) && !(_.any(forbidden, function (x) { return x == roomName; }))
            && (myRoom != null && !myRoom.memory.hostiles && !myRoom.memory.foreignOwner && !myRoom.memory.foreignReserver || (Game.time % 2000) == 0);
        return result;
    }
    function spawnCreep(requestRoom, body, memory, count) {
        if (count === void 0) { count = 1; }
        console.log('Colony.spawnCreep costs: ' + body.costs);
        var mainRoom = _.sortBy(_.filter(Colony.mainRooms, function (x) { return x.maxSpawnEnergy > body.costs; }), function (x) { return requestRoom.memory.mainRoomDistanceDescriptions[x.name].distance; })[0];
        if (mainRoom) {
            mainRoom.spawnManager.addToQueue(body.getBody(), memory, count);
            return true;
        }
        else
            return false;
    }
    Colony.spawnCreep = spawnCreep;
    function createScouts() {
        var myRooms = _.filter(Colony.rooms, function (x) { return x.mainRoom != null; });
        for (var idx in myRooms) {
            if (!Game.map.isRoomProtected(myRooms[idx].name) && myRooms[idx].mainRoom.spawnManager.isBusy == false) {
                var myRoom = myRooms[idx];
                var exits = myRoom.exits;
                if (Memory['exits'] == null)
                    Memory['exits'] = {};
                var _loop_5 = function(exitDirection) {
                    Memory['exits'][myRoom.name] = exits;
                    var targetRoomName = exits[exitDirection];
                    if (shouldSendScout(targetRoomName) && _.filter(Game.creeps, function (c) { return c.memory.role == 'scout' && c.memory.handledByColony == true && c.memory.targetPosition != null && c.memory.targetPosition.roomName == targetRoomName; }).length == 0) {
                        myRoom.mainRoom.spawnManager.addToQueue(['move'], { handledByColony: true, role: 'scout', mainRoomName: null, targetPosition: { x: 25, y: 25, roomName: targetRoomName } });
                    }
                };
                for (var exitDirection in exits) {
                    _loop_5(exitDirection);
                }
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
        var mainRoomNames = _.uniq(_.map(Game.spawns, function (s) { return s.room.name; }));
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
        if (memory.invasionManagers != null) {
            for (var idx in memory.invasionManagers) {
                Colony.invasionManagers[memory.invasionManagers[idx].targetRoomName] = new InvasionManager(memory.invasionManagers[idx].targetRoomName);
            }
        }
    }
    Colony.initialize = initialize;
    function calculateDistances(myRoom) {
        if (myRoom == null)
            return;
        for (var mainIdx in Colony.mainRooms) {
            var mainRoom = Colony.mainRooms[mainIdx];
            var routeResult = Game.map.findRoute(myRoom.name, mainRoom.name);
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
            if (Game.gcl.level > _.size(Colony.mainRooms) + _.size(Colony.claimingManagers))
                Colony.claimingManagers[flags[idx].pos.roomName] = new ClaimingManager(flags[idx].pos);
        }
        for (var idx in Colony.claimingManagers) {
            Colony.claimingManagers[idx].tick();
        }
        if (Memory['trace']) {
            var endCpu = Game.cpu.getUsed();
            console.log('Colony: Handle ClaimingManagers ' + (endCpu - startCpu).toFixed(2));
        }
    }
    function handleInvasionManagers() {
        if (Memory['trace'])
            var startCpu = Game.cpu.getUsed();
        var flags = _.filter(Game.flags, function (x) { return x.memory.invasion == true && !Colony.invasionManagers[x.roomName]; });
        flags.forEach(function (x) { Colony.invasionManagers[x.roomName] = new InvasionManager(x.pos.roomName); });
        _.values(Colony.invasionManagers).forEach(function (x) { return x.tick(); });
        var invasionsToDelete = _.filter(Colony.invasionManagers, function (x) { return !_.any(Game.flags, function (f) { return (f.memory.invasion == true || f.memory.invasion == 'true') && f.pos.roomName == x.roomName; }); });
        if (Memory['trace']) {
            var endCpu = Game.cpu.getUsed();
            console.log('Colony: Handle InvasionManagers ' + (endCpu - startCpu).toFixed(2));
        }
    }
    function tick() {
        Colony.memory = Memory['colony'];
        var startCpu;
        var endCpu;
        if (Memory['verbose'])
            console.log('ColonyHandler.tick');
        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        if (Game.time % 10 == 0) {
            var roomArray = [];
            for (var x in Colony.rooms)
                roomArray.push(Colony.rooms[x]);
            var idx = ~~((Game.time % (roomArray.length * 10)) / 10);
            var myRoom = roomArray[idx];
            calculateDistances(myRoom);
        }
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('Colony.Calculate distances to MainRooms: ' + (endCpu - startCpu).toFixed(2));
        }
        if (Memory['trace'])
            startCpu = Game.cpu.getUsed();
        for (var roomName in Game.rooms) {
            getRoom(roomName);
        }
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('Colony: Query all rooms ' + (endCpu - startCpu).toFixed(2));
        }
        handleClaimingManagers();
        handleInvasionManagers();
        createScouts();
        for (var roomName in Colony.mainRooms)
            Colony.mainRooms[roomName].tick();
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
            console.log('Colony: Handle scouts ' + (endCpu - startCpu).toFixed(2));
        }
        if ((Game.time % 500 == 0) || Memory['forceReassignment'] == true || Memory['forceReassignment'] == 'true') {
            try {
                var result = new RoomAssignmentHandler(Colony.rooms, Colony.mainRooms).getAssignments();
                var stringResult = _.map(result, function (x) {
                    return {
                        mainRoom: x.mainRoom.name,
                        rooms: _.map(x.myRooms, function (y) { return y.name; })
                    };
                });
                _.forEach(Colony.rooms, function (x) { return x.mainRoom = null; });
                _.forEach(result, function (x) { return _.forEach(x.myRooms, function (y) { return y.mainRoom = x.mainRoom; }); });
                Memory['RoomAssignment'] = stringResult;
                Memory['forceReassignment'] = false;
            }
            catch (e) {
                console.log('ERRROR: ROOMASSIGNMENT ' + e.stack);
                Memory['RoomAssignmentError'] = JSON.parse(JSON.stringify(e));
            }
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
        if (Memory['reset'] == true) {
            Memory['reset'] = false;
            Memory['colony'] = {};
            Colony.mainRooms = null;
            Colony.rooms = null;
        }
        console.log('Global reset');
        var startCpu = Game.cpu.getUsed();
        if (!Memory['colony'])
            Memory['colony'] = {};
        var colonyMemory = Memory['colony'];
        Colony.initialize(colonyMemory);
        var endCpu = Game.cpu.getUsed();
        console.log('Booting: ' + (endCpu - startCpu).toFixed(2));
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
        console.log('Time: ' + Game.time + ' CPU: ' + (endCpu - startCpu).toFixed(2) + ' Bucket: ' + Game.cpu.bucket);
    }
    GameManager.loop = loop;
})(GameManager || (GameManager = {}));
/// <reference path="../game-manager.ts" />
/*
* Singleton object. Since GameManager doesn't need multiple instances we can use it as singleton object.
*/
// Any modules that you use that modify the game's prototypes should be require'd 
// before you require the profiler. 
var profiler = require('screeps-profiler');
// This line monkey patches the global prototypes. 
profiler.enable();
GameManager.globalBootstrap();
// This doesn't look really nice, but Screeps' system expects this method in main.js to run the application.
// If we have this line, we can make sure that globals bootstrap and game loop work.
// http://support.screeps.com/hc/en-us/articles/204825672-New-main-loop-architecture
module.exports.loop = function () {
    //profiler.wrap(function () {
    console.log();
    GameManager.loop();
    //});
};
