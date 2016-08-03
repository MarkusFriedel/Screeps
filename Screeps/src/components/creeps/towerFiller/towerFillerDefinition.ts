/// <reference path="../body.ts" />

namespace TowerFillerDefinition {

    export function getDefinition(maxEnergy: number, towerCount:number=1) {
        let body = new Body();

        body.carry = 4 * Math.min(towerCount,5);
        body.move = 2 * Math.min(towerCount,5);

        return body;
    }

}