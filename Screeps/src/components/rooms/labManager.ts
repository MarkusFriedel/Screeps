/// <reference path="../structures/myLab.ts" />
/// <reference path="../creeps/labCarrier/labCarrierDefinition.ts" />
/// <reference path="../creeps/labCarrier/labCarrier.ts" />
/// <reference path="./manager.ts" />

class LabManager extends Manager implements LabManagerInterface {

    public get memory(): LabManagerMemory {
        return this.accessMemory();
    }

    accessMemory() {
        if (this.mainRoom.memory.labManager == null)
            this.mainRoom.memory.labManager = {
                labs: {}
            }
        return this.mainRoom.memory.labManager;
    }

    _creeps: { time: number, creeps: Array<Creep> } = { time: -1, creeps: null };
    public get creeps(): Array<Creep> {
        if (this._creeps.time < Game.time)
            this._creeps = {
                time: Game.time, creeps: this.mainRoom.creepsByRole('labCarrier')
            };
        return this._creeps.creeps;
    }

    private _availablePublishResources: { time: number, resources: { [resource: string]: number } }
    public get availablePublishResources(): { [resource: string]: number } {
        if (this._availablePublishResources == null || this._availablePublishResources.time < Game.time) {
            let resources: { [resource: string]: number } = {};
            if (this.mainRoom.mainContainer) {
                for (let resource in this.mainRoom.mainContainer.store) {
                    if (resources[resource] == null)
                        resources[resource] = 0;
                    resources[resource] += this.mainRoom.mainContainer.store[resource];
                }
            }
            _.forEach(_.filter(this.myLabs, l => l.memory.mode & LabMode.publish && l.lab.mineralAmount && l.lab.mineralType == l.memory.resource), l => {
                if (resources[l.memory.resource] == null)
                    resources[l.memory.resource] = 0;
                resources[l.memory.resource] += l.lab.mineralAmount;
            });

            this._availablePublishResources = { time: Game.time, resources: resources };
        }
        return this._availablePublishResources.resources;
    }

    private _myLabs: { time: number, myLabs: { [id: string]: MyLab } };
    public get myLabs() {
        //let trace = this.tracer.start("Property mylabs");
        if (this._myLabs == null || this._myLabs.time + 500 < Game.time) {
            let labs = this.mainRoom.room.find<StructureLab>(FIND_MY_STRUCTURES, { filter: (s: StructureLab) => s.structureType == STRUCTURE_LAB && s.isActive() });
            this._myLabs = { time: Game.time, myLabs: _.indexBy(_.map(labs, l => new MyLab(this, l.id)), x => x.id) };
        }

        //trace.stop();
        return this._myLabs.myLabs;
    }

    public get freeLabs() {
        return _.filter(this.myLabs, l => l.memory.mode == LabMode.available);
    }

    public get imports() {
        return _.map(_.filter(this.myLabs, l => l.memory.mode & LabMode.import), x => x.memory.resource);
    }

    public get publishs() {
        return _.map(_.filter(this.myLabs, l => l.memory.mode & LabMode.publish), x => x.memory.resource);
    }

    public get reactions() {
        return _.map(_.filter(this.myLabs, l => l.memory.mode & LabMode.reaction), x => x.memory.resource);
    }

    private _publish: { time: number, publish: string[] } = null;
    public get publish() {
        if (this._publish == null || this._publish.time < Game.time) {
            this._publish = { time: Game.time, publish: _.flatten(_.map(_.filter(Game.flags, flag => flag.pos.roomName == this.mainRoom.name && flag.memory.labSettings && flag.memory.labSettings.publish), flag => <string[]>flag.memory.labSettings.publish)) };
        }
        return this._publish.publish;
    }

    private static _staticTracer: Tracer;
    public static get staticTracer(): Tracer {
        if (LabManager._staticTracer == null) {
            LabManager._staticTracer = new Tracer('LabManager');
            Colony.tracers.push(LabManager._staticTracer);
        }
        return LabManager._staticTracer;
    }

    constructor(public mainRoom: MainRoom) {
        super(LabManager.staticTracer);
        Colony.reactionManager.registerLabManager(this);
    }

    private bestLabForReaction(resource: string): { lab: MyLab, requiredLabs: number } {
        console.log('LabManager.bestLabForReaction');
        let labRequirements = _.map(this.myLabs, x => { return { lab: x, requiredLabs: x.requiredLabsForReaction(resource) } });
        let bestLab = _.sortBy(_.filter(labRequirements, x => x.requiredLabs != null), x => x.requiredLabs)[0];
        return bestLab;
    }

    public requiredLabsForReaction(resource: string) {
        let bestLab = this.bestLabForReaction(resource);
        return bestLab ? bestLab.requiredLabs : null;
    }

    public reset() {
        _.forEach(this.myLabs, x => x.reset());
    }

    public addReaction(resource: string): MyLabInterface[] {
        let bestLab = this.bestLabForReaction(resource);
        if (bestLab) {
            console.log('Add reaction: found best lab');
            return bestLab.lab.setUpReaction(resource);
        }
        return null;
    }

    public backup() {
        _.forEach(this.myLabs, l => l.backup());
    }

    public restore() {
        _.forEach(this.myLabs, l => l.restore());
    }



    public _preTick() {
        if (this.mainRoom.spawnManager.isBusy)
            return;
        if (_.any(this.myLabs, x => x.memory.mode != LabMode.available) && this.creeps.length == 0) {
            let body = LabCarrierDefinition.getDefinition(this.mainRoom.maxSpawnEnergy);
            this.mainRoom.spawnManager.addToQueue(body.getBody(), { role: 'labCarrier' });
        }
    }



    public _tick() {
        _.forEach(this.myLabs, x => x.tick());

        this.requiredPublishs = [];

        _.forEach(_.map(_.filter(this.mainRoom.creeps, c => (<CreepMemory>c.memory).requiredBoosts && _.size((<CreepMemory>c.memory).requiredBoosts) > 0), c => (<CreepMemory>c.memory).requiredBoosts), c => {
            for (let resource in c) {
                if (c[resource].amount > 0 && this.requiredPublishs.indexOf(resource) < 0)
                    this.requiredPublishs.push(resource);

            }
        });

        this.setupPublishs();
        this.restorePublishs();

        _.forEach(this.creeps, x => new LabCarrier(x, this).tick());
    }

    private requiredPublishs: Array<string>;

    private setupPublishs() {
        for (let resource of this.requiredPublishs) {
            if (_.any(this.myLabs, l => l.memory.mode & LabMode.publish && l.memory.resource == resource))
                continue;
            let lab = _.filter(this.myLabs, l => l.memory.mode & LabMode.reaction && l.memory.resource == resource)[0];
            if (lab) {
                lab.backupPublish();
                lab.memory.mode |= LabMode.import | LabMode.publish;
                continue;
            }
            lab = _.sortBy(_.filter(this.myLabs, l => l.memory.mode == LabMode.available), l => l.lab.mineralType == resource ? 0 : 1)[0];
            if (lab) {
                lab.backupPublish();
                lab.memory.mode = LabMode.import | LabMode.publish;
                lab.memory.resource = resource;
                continue;
            }
            lab = _.filter(this.myLabs, l => _.all(this.myLabs, other => other.memory.reactionLabIds.indexOf(l.id) < 0))[0];
            if (lab) {
                lab.backupPublish();
                lab.memory.mode = LabMode.import | LabMode.publish;
                lab.memory.resource = resource;
                lab.memory.reactionLabIds = [];
                continue;
            }
            lab = _.sortBy(_.filter(this.myLabs, l => ~(l.memory.mode & LabMode.publish)), l => l.lab.mineralAmount)[0];
            if (lab) {
                lab.backupPublish();
                lab.memory.mode = LabMode.import | LabMode.publish;
                lab.memory.resource = resource;
                lab.memory.reactionLabIds = [];
                continue;
            }
        }
    }

    private restorePublishs() {
        _.forEach(_.filter(this.myLabs, l => l.memory.mode & LabMode.publish && this.requiredPublishs.indexOf(l.memory.resource) < 0), l => {
            l.restorePublish();
        });
    }
}