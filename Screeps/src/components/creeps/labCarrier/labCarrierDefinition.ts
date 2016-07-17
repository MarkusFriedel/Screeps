/// <reference path="../body.ts" />

namespace LabCarrierDefinition {

    export function getDefinition(maxEnergy: number) {
        let body = new Body();

        body.carry = 10;
        body.move = 5;

        return body;
    }

}