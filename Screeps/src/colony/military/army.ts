/// <reference path="../../components/creeps/military/armyCreep.ts" />

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
                rallyPoint:null
            }
        return this.armyManager.memory.armies[this.id];
    }

    public get creeps() {
        return _.filter(Game.creeps, c => c.memory.armyId == this.id);
    }

    constructor(public armyManager: ArmyManager, public id) {

    }

}