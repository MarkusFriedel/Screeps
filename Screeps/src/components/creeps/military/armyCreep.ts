/// <reference path="../myCreep.ts" />

abstract class ArmyCreep extends MyCreep {

    constructor(public creep:Creep,army: ArmyInterface) {
        super(creep);
    }

}