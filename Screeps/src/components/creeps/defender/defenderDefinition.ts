﻿import {Body} from "../body";

export namespace DefenderDefinition {

    export function getDefinition(maxEnergy: number) {
        let body = new Body();

        let remainingEnergy = Math.min(maxEnergy, 1500);

        var basicModulesCount = ~~(remainingEnergy / 330); //work,carry,move
        body.attack = basicModulesCount;
        body.ranged_attack = basicModulesCount;
        body.move = 2 * basicModulesCount;

        remainingEnergy = remainingEnergy - 330 * basicModulesCount;

        while (remainingEnergy >= (BODYPART_COST.attack + BODYPART_COST.move)) {
            body.attack++; body.move++;
            remainingEnergy -= (BODYPART_COST.attack + BODYPART_COST.move);
        }
        return body;
    }

}