import {SpawnRoomHandler} from "../components/rooms/spawnRoomHandler";

export class ColonyHandler {

    spawnRoomNames: Array<string>;

    constructor() {
        for (var spawnName in Game.spawns) {
            var spawn = Game.spawns[spawnName];
            break;
        }

        for (var idx in Memory.rooms) {
            if (Memory.rooms[idx].spawnRoomName == null) {
                Memory.rooms[idx].spawnRoomName = spawn.room.name;
            }
        }

        if (spawn != null) {
            var creeps = _.filter(Game.creeps, (c) => c.memory.spawnRoomName == null && !c.memory.colonyHandler);
            for (var idx in creeps)
                creeps[idx].memory.spawnRoomName = spawn.name;
        }
    }

    public tick() {

        if (Memory['verbose'])
            console.log('ColonyHandler.tick');


        
        this.spawnRoomNames = _.uniq(_.map(Game.spawns, (s) => s.room.name ));

        for (let i = 0; i < this.spawnRoomNames.length; i++) {
            new SpawnRoomHandler(this.spawnRoomNames[i],this).tick();
        }
    }

}