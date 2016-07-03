﻿import {MyRoom} from "./myRoom";
import {MySource} from "../sources/mySource";
import {SpawnManager} from "./spawnManager";
import {Colony} from "../../colony/colony";
/// <reference path='./src/objectWithMemory.ts' />
//import {ObjectWithMemory} from "../../objectWithMemory";

import {MyLink} from "../structures/myLink";

import {MyTower} from "../structures/myTower";
import {ConstructionManager} from "./constructionManager";
import {UpgradeManager} from "./upgradeManager";
import {RepairManager} from "./repairManager";
import {HarvestingManager} from "./harvestingManager";
import {SpawnFillManager} from "./spawnFillManager";
import {DefenseManager} from "./defenseManager";
import {ReservationManager} from "./reservationManager";
import {RoadConstructionManager} from "./roadConstructionManager";
import {LinkFillerManager} from "./linkFillerManager";

export class MainRoom {

    public get memory(): MainRoomMemory {
        return this.accessMemory();
    }

    _room: { time: number, room: Room } = { time: -1, room: null };
    public get room(): Room {
        if (this._room.time < Game.time)
            this._room = {
                time: Game.time, room: Game.rooms[this.name]
            };
        return this._room.room;
    }

    _maxSpawnEnergy: { time: number, maxSpawnEnergy: number } = { time: -1, maxSpawnEnergy: 300 };
    public get maxSpawnEnergy(): number {
        if (this.creepManagers.spawnFillManager.creeps.length == 0)
            return 300;
        if (this._maxSpawnEnergy.time + 50 < Game.time)
            this._maxSpawnEnergy = {
                time: Game.time, maxSpawnEnergy: this.getMaxSpawnEnergy()
            };
        return this._maxSpawnEnergy.maxSpawnEnergy;
        //return 400;
    }

    _creeps: { time: number, creeps: Array<Creep> } = { time: -1, creeps: null };
    public get creeps(): Array<Creep> {
        if (this._creeps.time < Game.time)
            this._creeps = {
                time: Game.time, creeps: _.filter(Game.creeps, (c) => (<CreepMemory>c.memory).mainRoomName == this.name && !(<CreepMemory>c.memory).handledByColony)
            };
        return this._creeps.creeps;
    }
    _mainContainerId: string;
    _mainContainer: { time: number, mainContainer: Container | Storage } = { time: -1, mainContainer: null };
    public get mainContainer(): Container | Storage {
        if (this._mainContainer.time < Game.time) {
            if (this._mainContainer.time + 100 < Game.time || this._mainContainerId == null) {
                this._mainContainer = {
                    time: Game.time, mainContainer: this.checkAndPlaceStorage()
                };
            }
            else
                this._mainContainer = { time: Game.time, mainContainer: Game.getObjectById<Container | Storage>(this._mainContainerId) }
        }
        return this._mainContainer.mainContainer;
    }

    _spawns: { time: number, spawns: Array<Spawn> } = { time: -1, spawns: null };
    public get spawns(): Array<Spawn> {
        if (this._spawns.time < Game.time)
            this._spawns = {
                time: Game.time, spawns: _.filter(Game.spawns, x => x.room.name == this.name)
            };
        return this._spawns.spawns;
    }

    accessMemory() {
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
    }

    name: string;
    myRoom: MyRoom;
    connectedRooms: Array<MyRoom>;
    allRooms: Array<MyRoom>;
    mainPosition: RoomPosition; //Usually location of the first spawn
    spawnManager: SpawnManager;
    roadConstructionManager: RoadConstructionManager;
    extensionCount: number;
    links: Array<MyLink>;

    sources: {
        [id: string]: MySource;
    };


    creepManagers: {
        constructionManager: ConstructionManager,
        repairManager: RepairManager,
        upgradeManager: UpgradeManager,
        spawnFillManager: SpawnFillManager,
        harvestingManager: HarvestingManager,
        defenseManager: DefenseManager,
        reservationManager: ReservationManager,
        linkFillerManager: LinkFillerManager
    }



    constructor(roomName: string) {
        this.name = roomName;
        this.myRoom = Colony.getRoom(roomName);
        this.myRoom.mainRoom = this;
        if (this.myRoom.memory.mainRoomDistanceDescriptions == null)
            this.myRoom.memory.mainRoomDistanceDescriptions = {};
        this.myRoom.memory.mainRoomDistanceDescriptions[this.name] = { roomName: this.name, distance: 0 };

        //this.spawnNames = _.map(_.filter(Game.spawns, (s) => s.room.name == roomName), (s) => s.name);

        this.links = _.map(this.room.find<Link>(FIND_MY_STRUCTURES, { filter: (x: Structure) => x.structureType == STRUCTURE_LINK }), x => new MyLink(x, this));

        if (this.memory.mainPosition) {
            let pos = this.memory.mainPosition;
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
        }

        this.update(true);

        if (!this.memory.roadConstructionManager)
            this.memory.roadConstructionManager = null;
        this.roadConstructionManager = new RoadConstructionManager(this);
    }

    getMaxSpawnEnergy(): number {
        let maxSpawnEnergy = 0;

        this.extensionCount = this.room.find(FIND_MY_STRUCTURES, { filter: (s: Structure) => s.structureType == STRUCTURE_EXTENSION && s.isActive() }).length;
        if (this.extensionCount > CONTROLLER_STRUCTURES.extension[this.room.controller.level])
            this.extensionCount = CONTROLLER_STRUCTURES.extension[this.room.controller.level];

        if (this.room.controller.level == 8)
            maxSpawnEnergy = this.extensionCount * 200;
        else if (this.room.controller.level == 7)
            maxSpawnEnergy = this.extensionCount * 100;
        else maxSpawnEnergy = this.extensionCount * 50;

        maxSpawnEnergy += 300;

        //console.log('MAXENERGYCONDITION :' + this.name + ' creeps.length: ' + this.creeps.length + ', harverster length: ' + this.creepManagers.harvestingManager.harvesterCreeps.length);

        if (this.creeps.length == 0 || !this.mainContainer /*|| (this.mainContainer.store.energy == 0 && this.creepManagers.harvestingManager.harvesterCreeps.length == 0)*/)
            maxSpawnEnergy = Math.max(this.room.energyAvailable, 300);

        return maxSpawnEnergy;
    }

    getAllSources() {
        var sources = _.indexBy(_.map(this.myRoom.mySources, x => x), x => x.id);
        for (var roomIdx in _.filter(this.connectedRooms, x => x.canHarvest))
            for (var sourceIdx in this.connectedRooms[roomIdx].mySources)
                sources[this.connectedRooms[roomIdx].mySources[sourceIdx].id] = this.connectedRooms[roomIdx].mySources[sourceIdx];
        return sources;
    }

    update(runAll = true) {
        if (runAll || (Game.time % 1) == 0) {

            this.connectedRooms = _.filter(Colony.rooms, (r) => r.name != this.name && r.mainRoom && r.mainRoom.name == this.name);

            this.allRooms = this.connectedRooms.concat(this.myRoom);
        }

        this.sources = this.getAllSources();
        //this.sources = _this.myRoom.sources.concat(_.flatten(_.map(this.connectedRooms, (r) => _.values<MySource>(r.sources))));
        //this.sources = _.values<MySource>(this.myRoom.sources).concat(_.flatten(_.map(this.connectedRooms, (r) => _.values<MySource>(r.sources))));
    }

    placeExtensions() {
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

    }

    placeMainContainer() {
        if (Memory['verbose'])
            console.log('SpawnRoomHandler.placeMainContainer');
        let closestSource = this.mainPosition.findClosestByPath<Source>(FIND_SOURCES);

        let targetPos: RoomPosition = null;
        if (!closestSource)
            targetPos = new RoomPosition(this.mainPosition.x + 4, this.mainPosition.y + 4, this.name);
        else {
            targetPos = new RoomPosition(this.mainPosition.x, this.mainPosition.y, this.name);
            let direction = this.mainPosition.getDirectionTo(this.room.controller);
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
    }

    placeStorage() {
        if (Memory['verbose'])
            console.log('SpawnRoomHandler.placeStorage');

        let closestSource = this.mainPosition.findClosestByPath<Source>(FIND_SOURCES);
        let targetPos: RoomPosition = null;
        if (!closestSource)
            targetPos = new RoomPosition(this.mainPosition.x + 2, this.mainPosition.y + 2, this.name);
        else {
            targetPos = new RoomPosition(this.mainPosition.x, this.mainPosition.y, this.name);
            let direction = this.mainPosition.getDirectionTo(this.room.controller);
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
    }

    checkAndPlaceMainContainer(): Container {
        let mainContainer = null;
        this.memory.mainContainerId && (mainContainer = Game.getObjectById(this.memory.mainContainerId));

        if (mainContainer == null) {
            let candidates = this.mainPosition.findInRange<Container>(FIND_STRUCTURES, 4, {
                filter: (s: Structure) => s.structureType == STRUCTURE_CONTAINER
            });

            if (candidates.length > 0) {
                this.memory.mainContainerId = candidates[0].id;
                return candidates[0];
            } else {
                let constructionCandidates = this.mainPosition.findInRange<ConstructionSite>(FIND_CONSTRUCTION_SITES, 4, {
                    filter: (s: Structure) => s.structureType == STRUCTURE_CONTAINER
                });

                if (constructionCandidates.length == 0) {
                    this.placeMainContainer();
                }
            }
        }
        else
            return mainContainer;
    }



    checkAndPlaceStorage(): Storage | Container {
        if (this.room.storage != null) {
            return this.room.storage;
        }
        else if (CONTROLLER_STRUCTURES.storage[this.room.controller.level] > 0) {
            this.placeStorage();
        }
        return this.checkAndPlaceMainContainer();
    }

    checkCreeps() {
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



    }

    tickCreeps() {
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
    }

    public tick() {
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
        this.links.forEach(x => x.tick());
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
        this.allRooms.forEach(r => r.scanForHostiles());
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
        this.room.find<Tower>(FIND_MY_STRUCTURES, { filter: (x: Structure) => x.structureType == STRUCTURE_TOWER }).forEach(x => new MyTower(x, this).tick());
        if (Memory['trace']) {
            endCpu = Game.cpu.getUsed();
            console.log('Tower.tick: ' + (endCpu - startCpu).toFixed(2));
        }

        this.tickCreeps();

        if (Game.time % 100 == 0)
            for (let idx in this.allRooms) {
                let myRoom = this.allRooms[idx];
                myRoom.scan();
            }
    }
}