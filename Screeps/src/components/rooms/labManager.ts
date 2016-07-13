/// <reference path="../structures/myLab.ts" />

class LabManager implements LabManagerInterface {

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

    private _myLabs: { time: number, myLabs: { [id: string]: MyLab } } = { time: -101, myLabs: {} };
    public get myLabs() {
        //let trace = this.tracer.start("Property mylabs");
        if (this._myLabs.time + 100 < Game.time) {
            let labs = this.mainRoom.room.find<StructureLab>(FIND_MY_STRUCTURES, { filter: (s: StructureLab) => s.structureType == STRUCTURE_LAB && s.isActive() });
            this._myLabs = { time: Game.time, myLabs: _.indexBy(_.map(labs, l => new MyLab(this, l.id)), x => x.id) };
        }

        //trace.stop();
        return this._myLabs.myLabs;
    }

    public get imports() {
        return _.map(_.filter(this.myLabs, l => l.memory.mode & LabMode.import), x => x.memory.resource);
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

    public constructor(public mainRoom: MainRoomInterface) {
        Colony.reactionManager.registerLabManager(this);
    }

    private bestLabForReaction(resource: string): { lab: MyLab, requiredLabs: number }  {
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

    public addReaction(resource: string) {
        let bestLab = this.bestLabForReaction(resource);
        if (bestLab) {
            console.log('Add reaction: found best lab');
            bestLab.lab.setUpReaction(resource);
        }
    }

    public setupPublishs() {
        _.forEach(this.publish, resource => {
            if (Colony.reactionManager.canProduce(resource)) {
                let freeLab = _.sortBy(this.myLabs, l => _.filter(l.connectedLabs, cl => cl.memory.mode == LabMode.available).length)[0];
                if (freeLab) {
                    freeLab.memory.mode = LabMode.publish | LabMode.import;
                    freeLab.memory.resource = resource;
                }
            }
        });
    }
}