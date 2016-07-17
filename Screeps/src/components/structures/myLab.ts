class MyLab {

    public get memory(): LabMemory {
        return this.accessMemory();
    }

    accessMemory() {
        if (this.labManager.memory.labs[this.id] == null)
            this.labManager.memory.labs[this.id] = {
                resource: null,
                mode: null,
                reactionLabIds: null
            }
        return this.labManager.memory.labs[this.id];
    }

    private _connectedLabs: MyLab[] = null;
    public get connectedLabs() {
        if (this._connectedLabs == null) {
            this._connectedLabs = _.filter(this.labManager.myLabs, l => l.id != this.id && this.lab.pos.inRangeTo(l.lab.pos, 2));
        }
        return this._connectedLabs;
    }

    private _lab: { time: number, lab: StructureLab } = null;
    public get lab() {
        if (this._lab == null || this._lab.time < Game.time)
            this._lab = { time: Game.time, lab: Game.getObjectById<StructureLab>(this.id) };
        return this._lab.lab;
    }

    constructor(public labManager: LabManagerInterface, public id: string) {

    }

    public setUpReaction(resource: string) {
        if (this.memory.resource != null && this.memory.resource != resource || this.memory.mode & LabMode.reaction)
            return null;
        this.memory.reactionLabIds = [];
        let ingredients = Colony.reactionManager.ingredients[resource];
        this.memory.resource = resource;
        this.memory.mode &= ~LabMode.import;
        this.memory.mode |= LabMode.reaction;
        _.forEach(ingredients, ing => {
            let lab = _.filter(this.connectedLabs, x => x.memory.resource == ing && x.memory.mode & LabMode.import)[0] || _.filter(this.connectedLabs, x => x.memory.mode == LabMode.available)[0];
            if (lab) {
                this.memory.reactionLabIds.push(lab.id);
                if (lab.memory.mode == LabMode.available) {
                    lab.memory.resource = ing;
                    lab.memory.mode = LabMode.import;
                }
            }
                
        });
    }

    public reset() {
        this.memory.mode = LabMode.available;
        this.memory.reactionLabIds = [];
        this.memory.resource = null;
    }

    public requiredLabsForReaction(resource: string): number {
        if (this.memory.resource != null && this.memory.resource != resource || this.memory.mode & LabMode.reaction)
            return null;

        let ingredients = Colony.reactionManager.ingredients[resource];
        let requiredLabs =  2;
        _.forEach(ingredients, ing => {
            if (_.any(this.connectedLabs, x => x.memory.resource == ing && x.memory.mode & LabMode.import))
                requiredLabs--;
            });

        let availableLabs = _.filter(this.connectedLabs, x => x.memory.mode == LabMode.available).length;
        if (availableLabs < requiredLabs)
            return null;
        else return requiredLabs + (this.memory.mode == LabMode.available ? 1 : 0);
    }

    public tick() {
        //console.log('myLab.tick try room: ' + this.labManager.mainRoom.name);
        if (this.memory.mode & LabMode.reaction && this.lab && this.lab.cooldown == 0 && this.memory.reactionLabIds.length == 2 && (this.lab.mineralType == this.memory.resource || this.lab.mineralAmount==0)) {
            if (_.all(this.memory.reactionLabIds, x => this.labManager.myLabs[x].lab != null && this.labManager.myLabs[x].lab.mineralType == this.labManager.myLabs[x].memory.resource)) {
                this.lab.runReaction(this.labManager.myLabs[this.memory.reactionLabIds[0]].lab, this.labManager.myLabs[this.memory.reactionLabIds[1]].lab);
            }
        }
    }

}