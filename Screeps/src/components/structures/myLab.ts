class MyLab implements MyLabInterface {

    public get memory(): LabMemory {
        return this.accessMemory();
    }

    accessMemory() {
        if (this.labManager.memory.labs[this.id] == null)
            this.labManager.memory.labs[this.id] = {
                resource: null,
                mode: null,
                reactionLabIds: null,
                backup: null,
                publishBackup: null
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
        this.tick = profiler.registerFN(this.tick, 'MyLab.tick');
    }

    public backup() {
        let backup = {
            mode: this.memory.mode,
            resource: this.memory.resource,
            reactionLabIds: _.clone(this.memory.reactionLabIds)
        }
        this.memory.backup = backup;
    }

    public restore() {
        if (this.memory.backup) {
            this.memory.mode = this.memory.backup.mode;
            this.memory.resource = this.memory.backup.resource;
            this.memory.reactionLabIds = _.clone(this.memory.backup.reactionLabIds);
        }
    }

    public backupPublish() {
        let backup = {
            mode: this.memory.mode,
            resource: this.memory.resource,
            reactionLabIds: _.clone(this.memory.reactionLabIds)
        }
        this.memory.publishBackup = backup;
    }

    public restorePublish() {
        if (this.memory.publishBackup) {
            this.memory.mode = this.memory.publishBackup.mode;
            this.memory.resource = this.memory.publishBackup.resource;
            this.memory.reactionLabIds = _.clone(this.memory.publishBackup.reactionLabIds);
        }
    }

    public setUpReaction(resource: string): MyLab[] {
        console.log('Reaction Manager: Trying to setup ' + resource);
        if (this.memory.resource != null && this.memory.resource != resource || this.memory.mode & LabMode.reaction)
            return null;
        this.memory.reactionLabIds = [];
        let ingredients = Colony.reactionManager.ingredients[resource];
        this.memory.resource = resource;
        this.memory.mode &= ~LabMode.import;
        this.memory.mode |= LabMode.reaction;
        let affectedLabs: MyLab[] = [this];
        _.forEach(ingredients, ing => {
            let lab = _.filter(this.connectedLabs, x => x.memory.resource == ing && x.memory.mode & LabMode.import)[0] || _.filter(this.connectedLabs, x => x.memory.mode == LabMode.available)[0];
            if (lab) {
                this.memory.reactionLabIds.push(lab.id);
                if (lab.memory.mode == LabMode.available) {
                    lab.memory.resource = ing;
                    lab.memory.mode = LabMode.import;
                    affectedLabs.push(lab);
                }
            }

        });
        return affectedLabs;
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
        let requiredLabs = 2;
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
        if (Game.time % LAB_COOLDOWN == 0) {
            try {
                if (this.memory.mode & LabMode.reaction && this.lab && this.lab.cooldown == 0 && this.memory.reactionLabIds.length == 2 && (this.lab.mineralType == this.memory.resource || this.lab.mineralAmount == 0)) {
                    if (_.all(this.memory.reactionLabIds, x => this.labManager.myLabs[x].lab != null && this.labManager.myLabs[x].lab.mineralType == this.labManager.myLabs[x].memory.resource && this.labManager.myLabs[x].lab.mineralAmount >= LAB_COOLDOWN)) {
                        this.lab.runReaction(this.labManager.myLabs[this.memory.reactionLabIds[0]].lab, this.labManager.myLabs[this.memory.reactionLabIds[1]].lab);
                    }
                }
            } catch (e) {
                console.log(e.stack);
            }
        }
    }

}