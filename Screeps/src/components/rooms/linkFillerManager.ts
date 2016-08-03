/// <reference path="../creeps/linkFiller/linkFillerDefinition.ts" />
/// <reference path="../creeps/linkFiller/linkFiller.ts" />
/// <reference path="./manager.ts" />

class LinkFillerManager implements LinkFillerManagerInterface {
    _creeps: { time: number, creeps: Array<Creep> } = { time: 0, creeps: null };
    public get creeps(): Array<Creep> {
        if (this._creeps.time < Game.time)
            this._creeps = {
                time: Game.time, creeps: this.mainRoom.creepsByRole('linkFiller')
            };
        return this._creeps.creeps;
    }

  

    constructor(public mainRoom: MainRoom) {
        this.preTick = profiler.registerFN(this.preTick, 'LinkFillerManager.preTick');
    }

    public preTick() {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if (this.creeps.length == 0 && this.mainRoom.links.length>0) {
            this.mainRoom.spawnManager.addToQueue(LinkFillerDefinition.getDefinition().getBody(), { role: 'linkFiller' });

        }
    }

    public tick() {
        this.creeps.forEach((c) => new LinkFiller(c, this.mainRoom).tick());
    }
}