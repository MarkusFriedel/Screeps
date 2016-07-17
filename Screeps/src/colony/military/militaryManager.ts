/// <reference path="./army.ts" />
/// <reference path="../../components/creeps/body.ts" />
class MilitaryManager implements MilitaryManagerInterface {

    public get memory(): MilitaryManagerMemory {
        return this.accessMemory();
    }

    accessMemory() {
        if (Colony.memory.militaryManager == null)
            Colony.memory.militaryManager = {
                armies: {},
                nextId: 0
            };

        return Colony.memory.militaryManager;
    }

    

    private _armies: { [id: number]: ArmyInterface }
    public get armies() {
        if (this._armies == null) {
            this._armies = {};
            for (let armyId in this.memory.armies) {
                let armyMemory = this.memory.armies[armyId];
                this._armies[armyId] = new Army(this, armyId);
            }
        }

        return this._armies;
    }

    

    public tick() {
        //_.forEach(Colony.rooms, x => this.scanForHostiles(x));
    }
}