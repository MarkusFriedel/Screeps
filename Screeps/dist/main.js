"use strict";
var Config;
(function (Config) {
    // APPLICATION CORE CONFIGURATION
    /**
     * Enable this if you want a lot of text to be logged to console.
     * @type {boolean}
     */
    Config.VERBOSE = true;
    // APPLICATION GAMEPLAY CONFIGURATION
    /**
     * @type {number}
     */
    Config.MAX_HARVESTERS_PER_SOURCE = 4;
    /**
     * Default amount of minimal ticksToLive Screep can have, before it goes to renew. This is only default value, that don't have to be used.
     * So it doesn't cover all Screeps
     * @type {number}
     */
    Config.DEFAULT_MIN_LIFE_BEFORE_NEEDS_REFILL = 700;
})(Config = exports.Config || (exports.Config = {}));
var MyRoom = (function () {
    function MyRoom(name, memory) {
        this.sourcesScanned = false;
        this.name = name;
        this.memory = memory;
        if (memory.containers == null)
            memory.containers = {};
        if (memory.sources == null)
            memory.sources = {};
        this.loadFromMemory();
        if (!this.mainRoom)
            this.mainRoom = Colony.assignMainRoom(this);
        if (Game.rooms[this.name] != null)
            this.scan();
    }
    MyRoom.prototype.scanSources = function (room) {
        if (Object.keys(this.sources).length == 0) {
            this.sources = {};
            var sources = room.find(FIND_SOURCES);
            for (var idx in sources) {
                var source = sources[idx];
                if (this.memory.sources[source.id] == null)
                    this.memory.sources[source.id] = { containerId: null, energyCapacity: null, harvestingSpots: null, id: source.id, keeper: null, lastScanTime: null, pos: null };
                this.sources[source.id] = new MySource(source.id, this.memory.sources[source.id]);
            }
        }
        else {
            for (var sourceId in this.sources)
                this.sources[sourceId].scan();
        }
    };
    MyRoom.prototype.scanContainers = function (room) {
        if (this.containers != null) {
            for (var idx in this.containers) {
                var container = Game.getObjectById(this.containers[idx].id);
                if (!container) {
                    delete this.containers[this.containers[idx].id];
                }
                else {
                    this.containers[this.containers[idx].id].scan(container);
                }
            }
        }
        var containers = room.find(FIND_STRUCTURES, { filter: function (s) { return s.structureType == STRUCTURE_CONTAINER; } });
        for (var idx in containers) {
            var container = containers[idx];
            if (!container) {
                if (this.memory.containers[container.id] == null)
                    this.memory.containers[container.id] = { id: container.id, pos: container.pos, lastScanTime: Game.time };
                this.containers[container.id] = new MyContainer(container.id, this.memory.containers[container.id]);
            }
        }
    };
    MyRoom.prototype.scan = function () {
        var room = Game.rooms[this.name];
        if (this.exits == null) {
            this.exits = {};
            var exits = Game.map.describeExits(this.name);
            if (exits != null)
                for (var exitDirection in exits)
                    this.exits[exitDirection] = exits[exitDirection];
        }
        if (room == null)
            return;
        this.lastScanTime = Game.time;
        if (!this.sourcesScanned)
            this.scanSources(room);
        this.sourcesScanned = true;
        this.scanContainers(room);
        this.saveToMemory();
    };
    MyRoom.prototype.saveToMemory = function () {
        this.memory.lastScanTime = this.lastScanTime;
        this.memory.mainRoomName = this.mainRoom ? this.mainRoom.roomName : null;
    };
    MyRoom.prototype.loadFromMemory = function () {
        this.sources = _.indexBy(_.map(this.memory.sources, function (s) { return new MySource(s.id, s); }), function (s) { return s.id; });
        this.containers = _.indexBy(_.map(this.memory.containers, function (s) { return new MyContainer(s.id, s); }), function (s) { return s.id; });
        this.mainRoom = Colony.mainRooms[this.memory.mainRoomName];
    };
    MyRoom.prototype.scanHostiles = function () {
    };
    return MyRoom;
}());
exports.MyRoom = MyRoom;
var MySource = (function () {
    function MySource(id, memory) {
        this.id = id;
        this.memory = memory;
        this.scan();
        this.loadFromMemory();
    }
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
    MySource.prototype.findContainer = function () {
        var candidates = this.pos.findInRange(FIND_STRUCTURES, 4, {
            filter: function (s) { return s.structureType == STRUCTURE_CONTAINER; }
        });
        if (candidates.length > 0)
            return candidates[0];
        else
            return null;
    };
    MySource.prototype.scan = function () {
        var source = Game.getObjectById(this.id);
        if (source != null) {
            this.lastScanTime = Game.time;
            this.energyCapacity = source.energyCapacity;
            this.pos = source.pos;
            this.lastScanTime = Game.time;
            this.keeper = source.pos.findInRange(FIND_STRUCTURES, 5, { filter: function (s) { return s.structureType == STRUCTURE_KEEPER_LAIR; } }).length > 0;
            this.harvestingSpots = this.getHarvestingSpots(source);
            if (!Game.getObjectById(this.containerId)) {
                var container = this.findContainer();
                if (container) {
                    this.containerId = container.id;
                }
                else {
                    this.containerId = null;
                }
            }
            this.saveToMemory();
            return true;
        }
        return false;
    };
    MySource.prototype.containerMissing = function () {
        if (Game.rooms[this.pos.roomName] == null)
            return false;
        if (Game.getObjectById(this.containerId) != null)
            return false;
        var container = this.findContainer();
        if (container != null) {
            this.containerId = container.id;
            Memory['sources'][this.id].containerId = this.containerId;
            return false;
        }
        this.containerId = null;
        Memory['sources'][this.id].containerId = null;
        return this.pos.findInRange(FIND_CONSTRUCTION_SITES, 4, {
            filter: function (s) { return s.structureType == STRUCTURE_CONTAINER; }
        }).length == 0;
    };
    MySource.prototype.loadFromMemory = function () {
        this.energyCapacity = this.memory.energyCapacity;
        if (this.memory.pos)
            this.pos = new RoomPosition(this.memory.pos.x, this.memory.pos.y, this.memory.pos.roomName);
        this.lastScanTime = this.memory.lastScanTime;
        this.keeper = this.memory.keeper;
        this.harvestingSpots = this.memory.harvestingSpots;
        this.containerId = this.memory.containerId;
    };
    MySource.prototype.saveToMemory = function () {
        this.memory.containerId = this.containerId;
        this.memory.energyCapacity = this.energyCapacity;
        this.memory.harvestingSpots = this.harvestingSpots;
        this.memory.id = this.id;
        this.memory.keeper = this.keeper;
        this.memory.lastScanTime = this.lastScanTime;
        this.memory.pos = this.pos;
    };
    return MySource;
}());
exports.MySource = MySource;
var SpawnManager = (function () {
    function SpawnManager(mainRoom, memory) {
        this.queue = [];
        this.mainRoom = mainRoom;
        this.memory = memory;
    }
    SpawnManager.prototype.AddToQueue = function (body, memory, count) {
        if (count === void 0) { count = 1; }
        for (var i = 0; i < count; i++)
            this.queue.push({ body: body, memory: memory });
    };
    SpawnManager.prototype.spawn = function () {
        if (this.queue.length == 0) {
            this.isIdle = true;
            return;
        }
        var reversedQueue = this.queue.reverse();
        for (var idx in this.mainRoom.spawns) {
            var spawn = this.mainRoom.spawns[idx];
            if (reversedQueue.length == 0)
                break;
            var queueItem = reversedQueue[reversedQueue.length - 1];
            // TODO not only try the last queue item
            if (spawn.spawning == null && spawn.canCreateCreep(queueItem.body) == OK) {
                var memory = queueItem.memory;
                memory.mainRoomName = this.mainRoom.myRoom.name;
                spawn.createCreep(queueItem.body, null, memory);
                reversedQueue.pop();
            }
        }
    };
    return SpawnManager;
}());
exports.SpawnManager = SpawnManager;
var Colony;
(function (Colony) {
    Colony.mainRooms = {};
    Colony.rooms = {};
    function getRoom(roomName) {
        var room = Colony.rooms[roomName];
        if (room)
            return room;
        else if (!Colony.memory.rooms[roomName] && !Game.rooms[roomName])
            return null;
        else {
            if (!Colony.memory.rooms[roomName])
                Colony.memory.rooms[roomName] = { containers: null, lastScanTime: null, mainRoomName: null, name: roomName, sources: null };
            Colony.rooms[roomName] = new MyRoom(roomName, Colony.memory.rooms[roomName]);
            return Colony.rooms[roomName];
        }
    }
    Colony.getRoom = getRoom;
    ;
    function initialize(memory) {
        Colony.memory = memory;
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
            if (!memory.mainRooms[mainRoomNames[idx]])
                memory.mainRooms[mainRoomNames[idx]] = {
                    constructionManager: null, defenseManager: null, harvestingManager: null, mainPosition: null, repairManager: null, spawnFillManager: null, spawnManager: null, upgradeManager: null
                };
            Colony.mainRooms[mainRoomNames[idx]] = new MainRoom(mainRoomNames[idx], memory.mainRooms[mainRoomNames[idx]]);
        }
    }
    Colony.initialize = initialize;
    function assignMainRoom(room) {
        // TODO Rewrite it for multiple MainRooms
        for (var idx in Colony.mainRooms)
            return Colony.mainRooms[idx];
    }
    Colony.assignMainRoom = assignMainRoom;
    function createScouts() {
        for (var roomName in Colony.mainRooms) {
            if (!Game.map.isRoomProtected(roomName)) {
                var mainRoom = Colony.mainRooms[roomName];
                var exits = mainRoom.myRoom.exits;
                var _loop_1 = function(exitDirection) {
                    var targetRoomName = exits[exitDirection];
                    if (!Game.map.isRoomProtected(targetRoomName) && _.filter(Game.creeps, function (c) { return c.memory.role == 'scout' && c.memory.handledByColony == true && c.memory.targetRoomName == targetRoomName; }).length == 0) {
                        mainRoom.spawnManager.AddToQueue(['move'], { handledByColony: true, role: 'scout', mainRoomName: null, targetRoomName: targetRoomName });
                    }
                };
                for (var exitDirection in exits) {
                    _loop_1(exitDirection);
                }
            }
        }
    }
    Colony.createScouts = createScouts;
    function tick() {
        if (Memory['verbose'])
            console.log('ColonyHandler.tick');
        for (var roomName in Colony.mainRooms)
            Colony.mainRooms[roomName].tick();
        var creeps = _.filter(Game.creeps, function (c) { return c.memory.handledByColony; });
        for (var idx in creeps) {
            var creep = creeps[idx];
            if (creep.memory.role == 'scout')
                new Scout(creep).tick();
        }
        createScouts();
    }
    Colony.tick = tick;
})(Colony = exports.Colony || (exports.Colony = {}));
var ConstructionManager = (function () {
    function ConstructionManager(mainRoom, memory) {
        this.mainRoom = mainRoom;
        this.memory = memory;
        this.maxCreeps = 2;
        this.getData();
    }
    ConstructionManager.prototype.getConstruction = function () {
        for (var idx in Game.constructionSites) {
            return Game.constructionSites[idx];
        }
    };
    ConstructionManager.prototype.getData = function () {
        this.creeps = _.filter(this.mainRoom.creeps, function (c) { return c.memory.role == 'constructor'; });
        this.idleCreeps = _.filter(this.creeps, function (c) { return c.memory.targetId == null; });
    };
    ConstructionManager.prototype.checkCreeps = function () {
        this.getData();
        var constructionSite = this.getConstruction();
        if (constructionSite != null && (this.creeps.length < this.maxCreeps || this.idleCreeps.length > 0)) {
            for (var idx in this.idleCreeps) {
                var creep = this.idleCreeps[idx];
                creep.memory.targetId = constructionSite.id;
                creep.memory.targetPosition = constructionSite.pos;
            }
            this.idleCreeps = [];
            debugger;
            this.mainRoom.spawnManager.AddToQueue(ConstructorDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'constructor', targetId: constructionSite.id, targetPosition: constructionSite.pos }, this.maxCreeps - this.creeps.length);
        }
    };
    ConstructionManager.prototype.tick = function () {
        var _this = this;
        this.getData();
        this.creeps.forEach(function (c) { return new Constructor(c, _this.mainRoom).tick(); });
    };
    return ConstructionManager;
}());
exports.ConstructionManager = ConstructionManager;
var UpgradeManager = (function () {
    function UpgradeManager(mainRoom, memory) {
        this.mainRoom = mainRoom;
        this.memory = memory;
        this.getData();
    }
    UpgradeManager.prototype.getData = function () {
        this.creeps = _.filter(this.mainRoom.creeps, function (c) { return c.memory.role == 'upgrader'; });
    };
    UpgradeManager.prototype.checkCreeps = function () {
        this.getData();
        if (this.mainRoom.mainContainer != null && this.mainRoom.room.energyAvailable == this.mainRoom.room.energyCapacityAvailable && this.mainRoom.spawnManager.queue.length == 0 && this.creeps.length < 2) {
            this.mainRoom.spawnManager.AddToQueue(UpgraderDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'upgrader' }, 1);
        }
    };
    UpgradeManager.prototype.tick = function () {
        var _this = this;
        this.getData();
        this.creeps.forEach(function (c) { return new Upgrader(c, _this.mainRoom).tick(); });
    };
    return UpgradeManager;
}());
exports.UpgradeManager = UpgradeManager;
var RepairManager = (function () {
    function RepairManager(mainRoom, memory) {
        this.mainRoom = mainRoom;
        this.memory = memory;
        this.getData();
    }
    RepairManager.prototype.getRepairTargets = function () {
    };
    RepairManager.prototype.getData = function () {
        this.creeps = _.filter(this.mainRoom.creeps, function (c) { return c.memory.role == 'repairer'; });
        this.idleCreeps = _.filter(this.creeps, function (c) { return c.memory.targetId == null; });
    };
    RepairManager.prototype.checkCreeps = function () {
    };
    RepairManager.prototype.tick = function () {
        this.getData();
    };
    return RepairManager;
}());
exports.RepairManager = RepairManager;
var HarvestingManager = (function () {
    function HarvestingManager(mainRoom, memory) {
        this.mainRoom = mainRoom;
        this.memory = memory;
        this.getData();
    }
    HarvestingManager.prototype.placeSourceContainers = function () {
        if (this.mainRoom.mainContainer)
            for (var idx in this.mainRoom.sources) {
                var sourceInfo = this.mainRoom.sources[idx];
                if (sourceInfo.keeper)
                    continue;
                if (!sourceInfo.keeper && sourceInfo.containerMissing()) {
                    var path = sourceInfo.pos.findPathTo(this.mainRoom.mainContainer.pos, { ignoreCreeps: true });
                    var containerPosition = new RoomPosition(path[1].x, path[1].y, sourceInfo.pos.roomName);
                    containerPosition.createConstructionSite(STRUCTURE_CONTAINER);
                }
            }
    };
    HarvestingManager.prototype.getData = function () {
        this.harvesterCreeps = _.filter(this.mainRoom.creeps, function (c) { return c.memory.role == 'harvester'; });
        this.idleHarvesterCreeps = _.filter(this.harvesterCreeps, function (c) { return c.memory.sourceId == null; });
        this.sourceCarrierCreeps = _.filter(this.mainRoom.creeps, function (c) { return c.memory.role == 'sourceCarrier'; });
        this.idleSourceCarrierCreeps = _.filter(this.harvesterCreeps, function (c) { return c.memory.sourceId == null; });
    };
    HarvestingManager.prototype.checkCreeps = function () {
        this.getData();
        for (var idx in this.mainRoom.sources) {
            var sourceInfo = this.mainRoom.myRoom.sources[idx];
            if (sourceInfo.keeper)
                continue;
            var harvesters = _.filter(this.harvesterCreeps, function (c) { return c.memory.sourceId == sourceInfo.id; });
            if (harvesters.length < sourceInfo.harvestingSpots)
                this.mainRoom.spawnManager.AddToQueue(HarvesterDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'harvester', sourceId: sourceInfo.id }, sourceInfo.harvestingSpots - harvesters.length);
            if (sourceInfo.containerId) {
                var sourceCarriers = _.filter(this.sourceCarrierCreeps, function (c) { return c.memory.sourceId == sourceInfo.id; });
                if (harvesters.length < 1)
                    this.mainRoom.spawnManager.AddToQueue(SourceCarrierDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'sourceCarrier', sourceId: sourceInfo.id });
            }
        }
    };
    HarvestingManager.prototype.tick = function () {
        var _this = this;
        this.getData();
        this.harvesterCreeps.forEach(function (c) { return new Harvester(c, _this.mainRoom).tick(); });
        this.sourceCarrierCreeps.forEach(function (c) { return new Harvester(c, _this.mainRoom).tick(); });
    };
    return HarvestingManager;
}());
exports.HarvestingManager = HarvestingManager;
var SpawnFillManager = (function () {
    function SpawnFillManager(mainRoom, memory) {
        this.mainRoom = mainRoom;
        this.memory = memory;
        this.getData();
    }
    SpawnFillManager.prototype.checkCreeps = function () {
        if (this.mainRoom.mainContainer != null && _.size(_.filter(Game.creeps, function (c) { return c.memory.role == 'spawnFiller'; })) < 2) {
            this.mainRoom.spawnManager.AddToQueue(SpawnFillerDefinition.getDefinition(this.mainRoom.maxSpawnEnergy).getBody(), { role: 'spawnFiller' }, 1);
        }
    };
    SpawnFillManager.prototype.getData = function () {
        this.creeps = _.filter(this.mainRoom.creeps, function (c) { return c.memory.role == 'spawnFiller'; });
    };
    SpawnFillManager.prototype.tick = function () {
        var _this = this;
        this.getData();
        this.creeps.forEach(function (c) { return new SpawnFiller(c, _this.mainRoom).tick(); });
    };
    return SpawnFillManager;
}());
exports.SpawnFillManager = SpawnFillManager;
var DefenseManager = (function () {
    function DefenseManager(mainRoom, memory) {
        this.mainRoom = mainRoom;
        this.memory = memory;
    }
    DefenseManager.prototype.checkCreeps = function () {
    };
    DefenseManager.prototype.tick = function () {
    };
    return DefenseManager;
}());
exports.DefenseManager = DefenseManager;
var MainRoom = (function () {
    function MainRoom(roomName, memory) {
        this.roomName = roomName;
        this.memory = memory;
        this.myRoom = Colony.getRoom(roomName);
        this.room = Game.rooms[roomName];
        this.spawns = _.filter(Game.spawns, function (s) { return s.room.name == roomName; });
        if (this.memory.mainPosition) {
            var pos = this.memory.mainPosition;
            this.mainPosition = new RoomPosition(pos.x, pos.y, roomName);
        }
        else {
            this.memory.mainPosition = this.mainPosition = this.spawns[0].pos;
        }
        if (!this.memory.spawnManager)
            this.memory.spawnManager = {};
        if (!this.memory.constructionManager)
            this.memory.constructionManager = {};
        if (!this.memory.repairManager)
            this.memory.repairManager = {};
        if (!this.memory.upgradeManager)
            this.memory.upgradeManager = {};
        if (!this.memory.spawnFillManager)
            this.memory.spawnFillManager = {};
        if (!this.memory.harvestingManager)
            this.memory.harvestingManager = {};
        if (!this.memory.defenseManager)
            this.memory.defenseManager = {};
        this.spawnManager = new SpawnManager(this, this.memory.spawnManager);
        this.creepManagers = {
            constructionManager: new ConstructionManager(this, this.memory.constructionManager),
            repairManager: new RepairManager(this, this.memory.repairManager),
            upgradeManager: new UpgradeManager(this, this.memory.upgradeManager),
            spawnFillManager: new SpawnFillManager(this, this.memory.spawnFillManager),
            harvestingManager: new HarvestingManager(this, this.memory.harvestingManager),
            defenseManager: new DefenseManager(this, this.memory.defenseManager),
        };
    }
    MainRoom.prototype.getMaxSpawnEnergy = function () {
        var maxSpawnEnergy = 0;
        this.extensionCount = this.room.find(FIND_MY_STRUCTURES, { filter: function (s) { return s.structureType == STRUCTURE_EXTENSION; } }).length;
        if (this.extensionCount > CONTROLLER_STRUCTURES.extension[this.room.controller.level])
            this.extensionCount = CONTROLLER_STRUCTURES.extension[this.room.controller.level];
        if (this.room.controller.level == 8)
            maxSpawnEnergy = this.extensionCount * 200;
        else if (this.room.controller.level == 7)
            maxSpawnEnergy = this.extensionCount * 100;
        else
            maxSpawnEnergy = this.extensionCount * 50;
        maxSpawnEnergy += 300;
        if (this.creeps.length == 0)
            maxSpawnEnergy = 300;
        return maxSpawnEnergy;
    };
    MainRoom.prototype.getAllSources = function () {
        var sources = this.myRoom.sources;
        for (var roomIdx in this.connectedRooms)
            for (var sourceIdx in this.connectedRooms[roomIdx].sources)
                sources[this.connectedRooms[roomIdx].sources[sourceIdx].id] = this.connectedRooms[roomIdx].sources[sourceIdx];
        return sources;
    };
    MainRoom.prototype.update = function () {
        var _this = this;
        this.creeps = _.filter(Game.creeps, function (c) { return c.memory.mainRoomName == _this.roomName && !c.memory.handledByColony; });
        if (Game.time % 100 == 0) {
            this.maxSpawnEnergy = this.getMaxSpawnEnergy();
            this.connectedRooms = _.filter(Colony.rooms, function (r) { return r.name != _this.room.name && r.mainRoom == _this; });
            this.allRooms = this.connectedRooms.concat(this.myRoom);
            this.sources = this.getAllSources();
        }
        //this.sources = _this.myRoom.sources.concat(_.flatten(_.map(this.connectedRooms, (r) => _.values<MySource>(r.sources))));
        //this.sources = _.values<MySource>(this.myRoom.sources).concat(_.flatten(_.map(this.connectedRooms, (r) => _.values<MySource>(r.sources))));
    };
    MainRoom.prototype.placeExtensions = function () {
        var maxExtensions = CONTROLLER_STRUCTURES.extension[this.room.controller.level];
        for (var i = maxExtensions - 1; i >= 0; i--) {
            var idiv5 = ~~(i / 5);
            var x = Math.ceil(idiv5 / 2);
            if (idiv5 % 2 == 1)
                x = -x;
            x += this.mainPosition.x;
            var y = this.mainPosition.y + 3 + (i % 5) * 2; //-(~~(i/5)%2)
            if ((idiv5 + 3) % 4 > 1)
                y--;
            var targetPos = new RoomPosition(x, y, this.roomName);
            if (targetPos.createConstructionSite(STRUCTURE_EXTENSION) == ERR_RCL_NOT_ENOUGH)
                break;
        }
    };
    MainRoom.prototype.placeMainContainer = function () {
        if (Memory['verbose'])
            console.log('SpawnRoomHandler.placeMainContainer');
        var closestSource = this.mainPosition.findClosestByPath(FIND_SOURCES);
        var targetPos = null;
        if (!closestSource)
            targetPos = new RoomPosition(this.mainPosition.x + 4, this.mainPosition.y + 4, this.roomName);
        else {
            targetPos = new RoomPosition(this.mainPosition.x, this.mainPosition.y, this.roomName);
            var direction = this.mainPosition.getDirectionTo(closestSource);
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
            targetPos = new RoomPosition(this.mainPosition.x + 2, this.mainPosition.y + 2, this.roomName);
        else {
            targetPos = new RoomPosition(this.mainPosition.x, this.mainPosition.y, this.roomName);
            var direction = this.mainPosition.getDirectionTo(closestSource);
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
        if (this.mainContainer == null) {
            var candidates = this.mainPosition.findInRange(FIND_STRUCTURES, 4, {
                filter: function (s) { return s.structureType == STRUCTURE_CONTAINER; }
            });
            if (candidates.length > 0) {
                this.mainContainer = candidates[0];
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
    };
    MainRoom.prototype.checkAndPlaceStorage = function () {
        var storage = this.room.storage;
        if (storage != null) {
            this.mainContainer = storage;
        }
        else if (CONTROLLER_STRUCTURES.storage[this.room.controller.level] > 0) {
            this.placeStorage();
        }
        else {
            this.checkAndPlaceMainContainer();
        }
    };
    MainRoom.prototype.checkCreeps = function () {
        this.creepManagers.spawnFillManager.checkCreeps();
        this.creepManagers.harvestingManager.checkCreeps();
        this.creepManagers.repairManager.checkCreeps();
        this.creepManagers.constructionManager.checkCreeps();
        this.creepManagers.upgradeManager.checkCreeps();
        this.creepManagers.defenseManager.checkCreeps();
    };
    MainRoom.prototype.tickCreeps = function () {
        this.creepManagers.spawnFillManager.tick();
        this.creepManagers.harvestingManager.tick();
        this.creepManagers.repairManager.tick();
        this.creepManagers.constructionManager.tick();
        this.creepManagers.upgradeManager.tick();
        this.creepManagers.defenseManager.tick();
    };
    MainRoom.prototype.tick = function () {
        if (Memory['verbose'])
            console.log('SpawnRoomHandler.tick');
        if (this.room == null)
            return;
        this.update();
        this.checkAndPlaceStorage();
        this.placeExtensions();
        this.checkCreeps();
        this.spawnManager.spawn();
        this.creepManagers.harvestingManager.placeSourceContainers();
        this.tickCreeps();
    };
    return MainRoom;
}());
exports.MainRoom = MainRoom;
var Scout = (function () {
    function Scout(creep) {
        this.creep = creep;
        this.memory = creep.memory;
    }
    Scout.prototype.tick = function () {
        var pos = this.creep.pos;
        if (pos.roomName != this.memory.targetRoomName || pos.x < 10 || pos.x > 40 || pos.y < 10 || pos.y > 40)
            this.creep.moveTo(new RoomPosition(25, 25, this.memory.targetRoomName));
        if (pos.x == 0 || pos.x == 49 || pos.y == 0 || pos.y == 49 || Game.time % 100 == 0) {
            var myRoom = Colony.getRoom(pos.roomName);
            myRoom.scan();
        }
    };
    return Scout;
}());
exports.Scout = Scout;
var MyContainer = (function () {
    function MyContainer(id, memory) {
        this.id = id;
        this.memory = memory;
        this.loadFromMemory();
        this.scan();
    }
    MyContainer.prototype.scan = function (container) {
        var cont = container;
        if (!cont)
            cont = Game.getObjectById(this.id);
        if (cont) {
            this.pos = cont.pos;
            this.lastScanTime = Game.time;
            this.saveToMemory();
            return true;
        }
        return false;
    };
    MyContainer.prototype.loadFromMemory = function () {
        this.pos = new RoomPosition(this.memory.pos.x, this.memory.pos.y, this.memory.pos.roomName);
        this.lastScanTime = this.memory.lastScanTime;
    };
    MyContainer.prototype.saveToMemory = function () {
        this.memory.id = this.id;
        this.memory.pos = this.pos;
        this.memory.lastScanTime = this.lastScanTime;
    };
    return MyContainer;
}());
exports.MyContainer = MyContainer;
var Body = (function () {
    function Body() {
    }
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
exports.Body = Body;
var Constructor = (function () {
    function Constructor(creep, mainRoom) {
        this.creep = creep;
        this.targetId = creep.memory.targetId;
        this.mainRoom = mainRoom;
        this.target = Game.getObjectById(this.targetId);
        if (this.target != null) {
            this.creep.memory.targetPosition = this.target.pos;
            this.targetPosition = this.target.pos;
        }
        else if (this.creep.memory.targetId != null) {
            this.targetPosition = new RoomPosition(creep.memory.targetPosition.x, creep.memory.targetPosition.y, creep.memory.targetPosition.roomName);
            if (Game.rooms[this.targetPosition.roomName] != null) {
                this.targetPosition = null;
                this.target = null;
                this.targetId = null;
                this.creep.memory.targetId = null;
                this.creep.memory.targetPosition = null;
            }
        }
    }
    Constructor.prototype.construct = function () {
        if (this.target != null) {
            if (this.creep.build(this.target) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.target);
        }
        else {
            this.creep.moveTo(this.targetPosition);
        }
    };
    Constructor.prototype.upgrade = function () {
        if (this.creep.upgradeController(this.creep.room.controller) == ERR_NOT_IN_RANGE)
            this.creep.moveTo(this.creep.room.controller);
    };
    Constructor.prototype.tick = function () {
        if (this.creep.carry.energy > 0) {
            if (this.targetPosition != null)
                this.construct();
            else
                this.upgrade();
        }
        else {
            if (this.mainRoom == null)
                return;
            var mainContainer = this.mainRoom.mainContainer;
            if (mainContainer != null) {
                if (mainContainer.store.energy > 100)
                    if (mainContainer.transfer(this.creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(mainContainer);
            }
            else {
                if (this.mainRoom.spawnManager.isIdle) {
                    for (var spawnName in Game.spawns) {
                        var spawn = Game.spawns[spawnName];
                        break;
                    }
                    if (spawn.transferEnergy(this.creep) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(spawn);
                }
            }
        }
    };
    return Constructor;
}());
exports.Constructor = Constructor;
var ConstructorDefinition;
(function (ConstructorDefinition) {
    function getDefinition(maxEnergy) {
        var body = new Body();
        body.work = 1;
        body.carry = 1;
        body.move = 1;
        var remaining = maxEnergy - 200;
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
        }
        return body;
    }
    ConstructorDefinition.getDefinition = getDefinition;
})(ConstructorDefinition = exports.ConstructorDefinition || (exports.ConstructorDefinition = {}));
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
    };
    return Upgrader;
}());
exports.Upgrader = Upgrader;
var UpgraderDefinition;
(function (UpgraderDefinition) {
    function getDefinition(maxEnergy) {
        var body = new Body();
        var basicModuleCount = ~~(maxEnergy / 300);
        body.work = basicModuleCount * 2;
        body.carry = basicModuleCount * 1;
        body.move = basicModuleCount * 1;
        var remaining = maxEnergy - basicModuleCount * 300;
        while (remaining >= 100) {
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
        }
        return body;
    }
    UpgraderDefinition.getDefinition = getDefinition;
})(UpgraderDefinition = exports.UpgraderDefinition || (exports.UpgraderDefinition = {}));
var Harvester = (function () {
    function Harvester(creep, mainRoom) {
        this.creep = creep;
        this.mainRoom = mainRoom;
        this.memory = creep.memory;
        this.loadFromMemory();
    }
    Harvester.prototype.getSourcePosition = function () {
        this.source = Game.getObjectById(this.sourceId);
        if (this.source == null)
            this.sourcePosition = this.source.pos;
        else
            this.sourcePosition = this.mainRoom.sources[this.sourceId].pos;
    };
    Harvester.prototype.harvest = function () {
        var source = Game.getObjectById(this.sourceId);
        if (source != null) {
            if (this.creep.harvest(source) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(source);
        }
        else {
            this.creep.moveTo(this.sourcePosition);
        }
    };
    Harvester.prototype.tick = function () {
        if (this.creep.carry.energy < this.creep.carryCapacity) {
            this.harvest();
        }
        else {
            var dropOffContainer = this.mainRoom.mainContainer;
            if (dropOffContainer == null || this.mainRoom.creepManagers.spawnFillManager.creeps.length == 0) {
                for (var spawnName in Game.spawns) {
                    dropOffContainer = Game.spawns[spawnName];
                }
            }
            if (this.creep.transfer(dropOffContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(dropOffContainer);
        }
    };
    Harvester.prototype.loadFromMemory = function () {
        this.sourceId = this.memory.sourceId;
        this.mainRoom = Colony.mainRooms[this.memory.mainRoomName];
    };
    Harvester.prototype.saveToMemory = function () {
        this.memory.mainRoomName = this.mainRoom.roomName;
    };
    return Harvester;
}());
exports.Harvester = Harvester;
var HarvesterDefinition;
(function (HarvesterDefinition) {
    function getDefinition(maxEnergy) {
        var body = new Body();
        var basicModulesCount = ~~(maxEnergy / 200); //work,carry,move
        //if (basicModulesCount==0)
        //    return ['work','carry','carry','move','move'];
        body.work = basicModulesCount;
        body.carry = basicModulesCount;
        body.move = basicModulesCount;
        var remaining = maxEnergy - basicModulesCount * 200;
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
        }
        return body;
    }
    HarvesterDefinition.getDefinition = getDefinition;
})(HarvesterDefinition = exports.HarvesterDefinition || (exports.HarvesterDefinition = {}));
var SourceCarrier = (function () {
    function SourceCarrier(creep, mainRoom) {
        this.creep = creep;
        this.mainRoom = mainRoom;
        this.memory = this.creep.memory;
        this.mySource = this.mainRoom.sources[this.memory.sourceId];
    }
    SourceCarrier.prototype.pickUp = function () {
        if (this.mySource.pos.roomName != this.creep.room.name)
            this.creep.moveTo(this.mySource);
        else {
            this.sourceContainer = Game.getObjectById(this.mySource.containerId);
            if (this.sourceContainer && this.sourceContainer.transfer(this.creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(this.sourceContainer);
        }
    };
    SourceCarrier.prototype.deliver = function () {
        var mainContainer = this.mainRoom.mainContainer;
        if (mainContainer != null) {
            if (this.creep.transfer(mainContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(mainContainer);
        }
    };
    SourceCarrier.prototype.tick = function () {
        if (this.creep.carry.energy == 0)
            this.pickUp();
        else
            this.deliver();
    };
    return SourceCarrier;
}());
exports.SourceCarrier = SourceCarrier;
var SourceCarrierDefinition;
(function (SourceCarrierDefinition) {
    function getDefinition(maxEnergy) {
        var body = new Body();
        var basicModuleCount = ~~(maxEnergy / 150);
        body.carry = 2 * basicModuleCount;
        body.move = basicModuleCount;
        return body;
    }
    SourceCarrierDefinition.getDefinition = getDefinition;
})(SourceCarrierDefinition = exports.SourceCarrierDefinition || (exports.SourceCarrierDefinition = {}));
var SpawnFiller = (function () {
    function SpawnFiller(creep, mainRoom) {
        this.creep = creep;
        this.mainRoom = mainRoom;
    }
    SpawnFiller.prototype.refill = function () {
        if (!this.mainRoom)
            return;
        var mainContainer = this.mainRoom.mainContainer;
        if (mainContainer != null) {
            if (mainContainer.transfer(this.creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(mainContainer);
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
exports.SpawnFiller = SpawnFiller;
var SpawnFillerDefinition;
(function (SpawnFillerDefinition) {
    function getDefinition(maxEnergy) {
        var body = new Body();
        var basicModuleCount = ~~(maxEnergy / 150);
        basicModuleCount = (basicModuleCount > 8) ? 8 : basicModuleCount;
        body.carry = 2 * basicModuleCount;
        body.move = 1 * basicModuleCount;
        return body;
    }
    SpawnFillerDefinition.getDefinition = getDefinition;
})(SpawnFillerDefinition = exports.SpawnFillerDefinition || (exports.SpawnFillerDefinition = {}));
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
        if (!Memory['colony'])
            Memory['colony'] = {};
        var colonyMemory = Memory['colony'];
        Colony.initialize(colonyMemory);
    }
    GameManager.globalBootstrap = globalBootstrap;
    function loop() {
        // Loop code starts here
        // This is executed every tick
        for (var name in Memory.creeps) {
            if (!Game.creeps[name]) {
                delete Memory.creeps[name];
            }
        }
        if (Memory['verbose'])
            console.log('MainLoop');
        Colony.tick();
    }
    GameManager.loop = loop;
})(GameManager = exports.GameManager || (exports.GameManager = {}));
/*
* Singleton object. Since GameManager doesn't need multiple instances we can use it as singleton object.
*/
GameManager.globalBootstrap();
// This doesn't look really nice, but Screeps' system expects this method in main.js to run the application.
// If we have this line, we can make sure that globals bootstrap and game loop work.
// http://support.screeps.com/hc/en-us/articles/204825672-New-main-loop-architecture
module.exports.loop = function () {
    GameManager.loop();
};
