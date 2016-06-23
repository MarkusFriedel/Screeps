import {RoomInfo} from "./roomInfo";
import {SourceInfo} from "../sources/sourceInfo";
import {SpawnManager} from "./spawnManager";
import {ColonyHandler} from "../../colony/colonyHandler";





import {ConstructionManager} from "./constructionManager";
import {UpgradeManager} from "./upgradeManager";
import {RepairManager} from "./repairManager";
import {HarvestingManager} from "./harvestingManager";
import {SpawnFillManager} from "./spawnFillManager";
import {DefenseManager} from "./defenseManager";

export class SpawnRoomHandler {
    roomName: string;
    roomInfo: RoomInfo;
    room: Room;
    connectedRoomInfos: Array<RoomInfo>;
    allRoomInfos: Array<RoomInfo>;
    mainContainerPosition: RoomPosition;
    storagePosition: RoomPosition;
    //mainContainerId: string;
    mainContainer: Container | Storage;
    mainSpawnName: string;
    mainPosition: RoomPosition; //Usually location of the first spawn
    spawnManager: SpawnManager;
    extensionCount: number;
    maxSpawnEnergy: number;
    creeps: Array<Creep>;

    sourceInfos: Array<SourceInfo>;

    colonyHandler: ColonyHandler;

    creepManagers:  {
        constructionManager: ConstructionManager,
        repairManager: RepairManager,
        upgradeManager: UpgradeManager,
        spawnFillManager: SpawnFillManager,
        harvestingManager: HarvestingManager,
        defenseManager: DefenseManager,
    }

    constructor(roomName: string, colonyHandler: ColonyHandler) {
        this.roomName = roomName;
        this.roomInfo = new RoomInfo(roomName);
        this.room = Game.rooms[roomName];
        this.colonyHandler = colonyHandler;
        this.creeps = _.filter(Game.creeps, (c) => c.memory.spawnRoomName == this.roomName);
        
        this.extensionCount = this.room.find(FIND_MY_STRUCTURES, { filter: (s: Structure) => s.structureType == STRUCTURE_EXTENSION }).length;
        if (this.extensionCount > CONTROLLER_STRUCTURES.extension[this.room.controller.level])
            this.extensionCount = CONTROLLER_STRUCTURES.extension[this.room.controller.level];

        if (this.room.controller.level == 8)
            this.maxSpawnEnergy = this.extensionCount * 200;
        else if (this.room.controller.level == 7)
            this.maxSpawnEnergy = this.extensionCount * 100;
        else this.maxSpawnEnergy = this.extensionCount * 50;

        this.maxSpawnEnergy += 300;

        if (this.creeps.length == 0)
            this.maxSpawnEnergy = 300;

        this.connectedRoomInfos = _.map(_.filter(Memory.rooms, (r) => r.name != this.room.name && r.spawnRoomName == this.room.name), (r) => new RoomInfo(r.name));

        this.allRoomInfos = this.connectedRoomInfos.concat(this.roomInfo);

        this.sourceInfos = this.roomInfo.sources.concat(_.flatten(_.map(this.connectedRoomInfos, (r) => r.sources)));

        this.spawnManager = new SpawnManager(this);
        this.creepManagers = {

            constructionManager: new ConstructionManager(this),
            repairManager: new RepairManager(this),
            upgradeManager: new UpgradeManager(this),
            spawnFillManager: new SpawnFillManager(this),
            harvestingManager: new HarvestingManager(this),
            defenseManager: new DefenseManager(this),
        }
    }

    placeExtensions() {
        var maxExtensions = CONTROLLER_STRUCTURES.extension[this.room.controller.level];

        for (var i = maxExtensions - 1; i >= 0; i--) {
            var idiv5 = ~~(i / 5);
            var x = Math.ceil(idiv5 / 2);
            if (idiv5 % 2 == 1)
                x = -x;
            x += this.mainPosition.x;
            var y = this.mainPosition.y + 2 + (i % 5) * 2;//-(~~(i/5)%2)

            if ((idiv5 + 3) % 4 > 1)
                y++;

            var targetPos = new RoomPosition(x, y, this.roomName);
            if (targetPos.createConstructionSite(STRUCTURE_EXTENSION) == ERR_RCL_NOT_ENOUGH)
                break;
        }

    }

    placeMainContainer() {
        if (Memory['verbose'])
            console.log('SpawnRoomHandler.placeMainContainer');
        this.mainContainerPosition.createConstructionSite(STRUCTURE_CONTAINER);
    }

    placeStorage() {
        if (Memory['verbose'])
            console.log('SpawnRoomHandler.placeStorage');
        this.storagePosition.createConstructionSite(STRUCTURE_STORAGE);
    }

    checkAndPlaceSpawn() {
        let mainSpawn = <Spawn>Game.spawns[this.mainSpawnName];
        if (mainSpawn == null) {
            let spawnCandidates = <Spawn[]>_.filter(this.mainPosition.lookFor<Structure>('structure'), (s) => s.structureType == STRUCTURE_SPAWN);
            if (spawnCandidates.length > 0)
                this.mainSpawnName = spawnCandidates[0].name;
            else {
                this.mainPosition.createConstructionSite(STRUCTURE_SPAWN);
            }
        }
    }

    checkAndPlaceMainContainer() {
        if (this.mainContainer == null) {
            let candidates = this.mainPosition.findInRange<Container>(FIND_STRUCTURES, 4, {
                filter: (s: Structure) => s.structureType == STRUCTURE_CONTAINER
            });

            if (candidates.length > 0) {
                this.mainContainer = candidates[0];
            } else {
                let constructionCandidates = this.mainPosition.findInRange<ConstructionSite>(FIND_CONSTRUCTION_SITES, 4, {
                    filter: (s: Structure) => s.structureType == STRUCTURE_CONTAINER
                });

                if (constructionCandidates.length == 0) {
                    this.placeMainContainer();
                }
            }
        }
    }



    checkAndPlaceStorage() {
        let storage = this.room.storage;
        if (storage != null) {
            this.mainContainer = storage;
        }
        else if (CONTROLLER_STRUCTURES.storage[this.room.controller.level] > 0) {
            this.placeStorage();
        }
        else {
            this.checkAndPlaceMainContainer();
        }
    }

    loadFromMemory() {
        let mem = this.room.memory;
        let storagePositionMem = mem['storagePosition'];
        if (storagePositionMem != null)
            this.storagePosition = new RoomPosition(storagePositionMem.x, storagePositionMem.y, this.roomName);
        this.mainSpawnName = mem['mainSpawnName'];
        let mainLocationMem = mem['mainPosition'];
        if (mainLocationMem != null)
            this.mainPosition = new RoomPosition(mainLocationMem.x, mainLocationMem.y, this.roomName);
        let mainContainerPositionMem = mem['mainContainerPosition'];
        if (mainContainerPositionMem != null)
            this.mainContainerPosition = new RoomPosition(mainContainerPositionMem.x, mainContainerPositionMem.y, this.roomName);
        if (mem['mainContainerId']!=null)
            this.mainContainer = <Container | Storage>Game.getObjectById(mem['mainContainerId']);
    }

    saveToMemory() {
        let mem = this.room.memory;
        mem['storagePosition'] = this.storagePosition;
        mem['mainSpawnName'] = this.mainSpawnName;
        mem['mainPosition'] = this.mainPosition;
        mem['mainContainerPosition'] = this.mainContainerPosition;
        if (this.mainContainer!=null)
            mem['mainContainerId'] = this.mainContainer.id;
    }

    init() {
        if (this.mainSpawnName == null) {
            let spawns = _.filter(Game.spawns, (s) => s.room.name == this.roomName);
            this.mainSpawnName = spawns[0].name;
            this.mainPosition = spawns[0].pos;
            this.mainContainerPosition = new RoomPosition(this.mainPosition.x + 4, this.mainPosition.y, this.roomName);
            this.storagePosition = new RoomPosition(this.mainPosition.x + 3, this.mainPosition.y, this.roomName);
            this.saveToMemory();
        }

    }

    checkCreeps() {
        this.creepManagers.spawnFillManager.checkCreeps();
        this.creepManagers.harvestingManager.checkCreeps();
        this.creepManagers.repairManager.checkCreeps();
        this.creepManagers.constructionManager.checkCreeps();
        this.creepManagers.upgradeManager.checkCreeps();
        this.creepManagers.defenseManager.checkCreeps();        
    }

    tickCreeps() {
        this.creepManagers.spawnFillManager.tick();
        this.creepManagers.harvestingManager.tick();
        this.creepManagers.repairManager.tick();
        this.creepManagers.constructionManager.tick();
        this.creepManagers.upgradeManager.tick();
        this.creepManagers.defenseManager.tick();  
    }

    public tick() {
        if (Memory['verbose'])
            console.log('SpawnRoomHandler.tick');

        

        if (this.room == null)
            return;
        this.loadFromMemory();
        //Memory.rooms[this.roomName].spawnRoomHandler = this;
        this.init();

        this.checkAndPlaceSpawn();
        this.checkAndPlaceStorage();
        this.placeExtensions();

        this.checkCreeps();

        this.spawnManager.spawn();

        this.tickCreeps();

        this.saveToMemory();

        //delete Memory.rooms[this.roomName].spawnRoomHandler;

    }
}