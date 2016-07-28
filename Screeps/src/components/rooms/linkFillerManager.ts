/// <reference path="../creeps/linkFiller/linkFillerDefinition.ts" />
/// <reference path="../creeps/linkFiller/linkFiller.ts" />
/// <reference path="./manager.ts" />

class LinkFillerManager extends Manager implements LinkFillerManagerInterface {
    _creeps: { time: number, creeps: Array<Creep> } = { time: 0, creeps: null };
    public get creeps(): Array<Creep> {
        if (this._creeps.time < Game.time)
            this._creeps = {
                time: Game.time, creeps: this.mainRoom.creepsByRole('linkFiller')
            };
        return this._creeps.creeps;
    }

    private static _staticTracer: Tracer;
    public static get staticTracer(): Tracer {
        if (LinkFillerManager._staticTracer == null) {
            LinkFillerManager._staticTracer = new Tracer('LinkFillerManager');
            Colony.tracers.push(LinkFillerManager._staticTracer);
        }
        return LinkFillerManager._staticTracer;
    }

    constructor(public mainRoom: MainRoom) {
        super(LinkFillerManager.staticTracer);
    }

    public _preTick() {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if (this.creeps.length == 0 && this.mainRoom.links.length>0) {
            this.mainRoom.spawnManager.addToQueue(LinkFillerDefinition.getDefinition().getBody(), { role: 'linkFiller' });

        }
    }

    public _tick() {
        this.creeps.forEach((c) => new LinkFiller(c, this.mainRoom).tick());
    }
}