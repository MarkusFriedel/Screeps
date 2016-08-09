

class SpawnManager implements SpawnManagerInterface {

    public get memory(): SpawnManagerMemory {
        return this.accessMemory();
    }

    accessMemory() {
        if (this.mainRoom.memory.spawnManager == null)
            this.mainRoom.memory.spawnManager = {
                debug: false,
                verbose: false,
                queue:null
            }
        return this.mainRoom.memory.spawnManager;
    }

    public get canSpawn():boolean {
        return _.any(this.spawns, x => x.spawning==null);
    }

    public get isBusy(): boolean {
        //return false;
        return /*(this.memory.sleepingUntil != null && this.memory.sleepingUntil>Game.time) ||*/ this.queue.length >= 3 || _.filter(this.spawns, x => x.spawning == null).length <= this.queue.length;
    }

    _spawns: { time: number, spawns: Array<Spawn> } = { time: 0, spawns: null };
    public get spawns(): Array<Spawn> {
        if (this._spawns.time < Game.time)
            this._spawns = {
                time: Game.time, spawns: _.filter(Game.spawns, x => x.room.name == this.mainRoom.name)
            };
        return this._spawns.spawns;
    }

    queue: SpawnQueueItem[] = [];
    isIdle: boolean;

   

    constructor(public mainRoom: MainRoomInterface, memory: SpawnManagerMemory) {
        this.mainRoom = mainRoom;
        if (myMemory['profilerActive']) {
            this.spawn = profiler.registerFN(this.spawn, 'SpawnManager.spawn');
        }
        
    }

    public addToQueue(body: string[], memory: any, count: number = 1, priority:boolean=false) {
        for (let i = 0; i < count; i++) {
            if (priority)
                this.queue.unshift({ body: body, memory: memory });
            else
                this.queue.push({ body: body, memory: memory });
        }
    }

    public spawn() {
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
        for (let idx in this.spawns) {
            let spawn = this.spawns[idx];
             if (this.queue.length == 0) {
                break;
            }
            var queueItem = this.queue[0];
            // TODO not only try the last queue item
            if (spawn.spawning == null) {
                let creepMemory = <CreepMemory>queueItem.memory;
                if (!creepMemory.mainRoomName)
                    creepMemory.mainRoomName = this.mainRoom.name;
                if (!Colony.memory.creepIdx)
                    Colony.memory.creepIdx = 0;
                if (Body.getFromBodyArray(_.map(queueItem.body, b => { return { boost: null, type: b, hits: 100 } })).costs > this.mainRoom.room.energyCapacityAvailable) {
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
    }

}