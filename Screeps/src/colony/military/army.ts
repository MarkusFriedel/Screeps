class Army implements ArmyInterface {

    public get memory(): ArmyMemory {
        return this.accessMemory();
    }

    accessMemory() {
        if (this.militaryManager.memory.armies == null)
            this.militaryManager.memory.armies = {};
        if (this.militaryManager.memory.armies[this.id] == null)
            this.militaryManager.memory.armies[this.id] = {
                id: this.id,
                state: ArmyState.Rally,
                mission: ArmyMission.None
            }
        return this.militaryManager.memory.armies[this.id];
    }

    constructor(public militaryManager: MilitaryManagerInterface, public id) {

    }

}