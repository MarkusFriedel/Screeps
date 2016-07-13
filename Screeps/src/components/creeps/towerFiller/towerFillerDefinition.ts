/// <reference path="../body.ts" />

namespace TowerFillerDefinition {

    export function getDefinition(maxEnergy: number) {
        let body = new Body();

        body.carry = 4;
        body.move = 2;

        return body;
    }

}