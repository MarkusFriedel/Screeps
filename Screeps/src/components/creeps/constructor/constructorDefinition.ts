/// <reference path="../body.ts" />

namespace ConstructorDefinition {

    export function getDefinition(maxEnergy: number) {
        let body = new Body();

        body.work = 1;
        body.carry = 2;
        body.move = 2;

        let remainingEnergy = Math.min(maxEnergy, 1050);
        var remaining = remainingEnergy - 300;

        if (remaining >= 50) {
            body.carry++;
            remaining -= 50;
        }


        while (remaining >= 150 && body.getBody().length < (50 - 3)) {
            if (remaining >= 350 && body.getBody().length < (50-6)) {
                body.work++; body.carry++; body.carry++; body.carry++; body.move++; body.move++;
                remaining -= 350;
            }
            else if (remaining >= 150 && body.getBody().length < (50 - 3)) {
                body.carry++; body.carry++; body.move++;
                remaining -= 150;
            }
            else
                break;

        }
        return body;
    }

}