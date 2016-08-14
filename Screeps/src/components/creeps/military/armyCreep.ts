/// <reference path="../myCreep.ts" />

abstract class ArmyCreep<TMemoryType extends ArmyCreepMemory> extends MyCreep<TMemoryType> {

    

    constructor(public name:string,army: ArmyInterface) {
        super(name);
    }

}