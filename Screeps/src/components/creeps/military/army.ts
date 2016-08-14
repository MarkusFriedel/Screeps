/// <reference path="./armyCreep.ts" />
/// <reference path="./healer.ts" />
/// <reference path="./dismantler.ts" />

class Army implements ArmyInterface {

    public get memory(): ArmyMemory {
        return this.accessMemory();
    }

    accessMemory() {
        if (this.armyManager.memory.armies == null)
            this.armyManager.memory.armies = {};
        if (this.armyManager.memory.armies[this.id] == null)
            this.armyManager.memory.armies[this.id] = {
                id: this.id,
                state: ArmyState.Rally,
                mission: ArmyMission.None,
                rallyPoint: null
            }
        return this.armyManager.memory.armies[this.id];
    }

    private createCreep(name: string) {
        let creepMemory = <ArmyCreepMemory>myMemory.creeps[name];

        switch (creepMemory.role) {
            case 'healer':
                return new Healer(name, this);
            case 'dismantler':
                return new Dismantler(name, this);
        }
        return null;
    }

    private _creeps: { [name: string]: ArmyCreep<ArmyCreepMemory> };
    public get creeps() {
        if (this._creeps == null) {
            this._creeps = _.indexBy(_.map(_.filter(Game.creeps, c => c.memory.armyId == this.id), c => this.createCreep(c.name)), c => c.name);
        }
        else {
            _.forEach(_.filter(Game.creeps, c => c.memory.armyId == this.id), c => {
                if (!this._creeps[c.name])
                    this._creeps[c.name] = this.createCreep(c.name);
            });
            _.forEach(this._creeps, c => {
                if (!Game.creeps[c.name])
                    delete this._creeps[c.name];
            });
        }
        return this._creeps;
    }



    constructor(public armyManager: ArmyManager, public id) {

    }

    public tick() {
        _.forEach(this.creeps, c => c.tick());
    }

}