/// <reference path="../../components/creeps/military/army.ts" />

class ArmyManager implements ArmyManagerInterface {

    public get memory(): ArmyManagerMemory {
        return this.accessMemory();
    }

    accessMemory() {
        if (Colony.memory.armyManager == null)
            Colony.memory.armyManager = {
                nextId: 0,
                armies: {}
            };

        return Colony.memory.armyManager;
    }

    constructor() {

    }

    private _armies:{ time: number, armies: ArmyInterface[] };
    public get armies() {
        if (this._armies == null || this._armies.time < Game.time) {

        }
        return this._armies.armies;
    }

}