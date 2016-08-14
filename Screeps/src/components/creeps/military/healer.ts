/// <reference path="./armyCreep.ts" />
class Healer extends ArmyCreep<ArmyHealerMemory> {

    constructor(public name: string, public army: ArmyInterface) {
        super(name, army);
    }

    myTick() {
    };
}