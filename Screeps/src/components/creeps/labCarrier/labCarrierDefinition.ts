/// <reference path="../body.ts" />

namespace LabCarrierDefinition {

    export function getDefinition(maxEnergy: number) {
        let body = new Body();

        body.carry = 20;
        body.move = 10;

        return body;
    }

}