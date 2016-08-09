/// <reference path="../creeps/nukeFiller/nukeFiller.ts" />

class NukeManager {

    public get nuker() {
        return this.mainRoom.nuker;
    }

    public get isReady() {
        return this.nuker.energyCapacity == this.nuker.energy && this.nuker.ghodiumCapacity == this.nuker.ghodium;
    }

    private _nukeFillers: { time: number, nukeFillers: { [name: string]: NukeFiller } }
    public get nukeFillers() {
        if (this._nukeFillers == null)
            this._nukeFillers = { time: Game.time, nukeFillers: _.indexBy(_.map(this.nukeFillerCreeps, c => new NukeFiller(c.name, this.mainRoom)), x => x.name) };
        else if (this._nukeFillers.time < Game.time) {
            _.forEach(this.nukeFillerCreeps, c => {
                if (!this._nukeFillers.nukeFillers[c.name])
                    this._nukeFillers.nukeFillers[c.name] = new NukeFiller(c.name, this.mainRoom);
            });
        }
        return this._nukeFillers.nukeFillers;
    }

    private _nukeFillerCreeps: { time: number, creeps: Array<Creep> };
    public get nukeFillerCreeps(): Array<Creep> {
        if (this._nukeFillerCreeps == null || this._nukeFillerCreeps.time < Game.time)
            this._nukeFillerCreeps = {
                time: Game.time, creeps:this.mainRoom.creepsByRole('nukeFiller')
            };
        return this._nukeFillerCreeps.creeps;
    }

    constructor(public mainRoom: MainRoomInterface) {

    }

    preTick() {
        if (this.mainRoom.spawnManager.isBusy || this.nukeFillerCreeps.length > 0 || !this.nuker || this.isReady)
            return;

        let memory = <CreepMemory>{
            mainRoomName: this.mainRoom.name,
            role: 'nukeFiller'
        };
        let body = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE];

        this.mainRoom.spawnManager.addToQueue(body, memory);
        
    }

    tick() {
        _.forEach(this.nukeFillers, nf => nf.tick());
    }

}