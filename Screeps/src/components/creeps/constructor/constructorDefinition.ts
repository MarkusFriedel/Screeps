import {Body} from "../body";

export namespace ConstructorDefinition {

    export function getDefinition(maxEnergy: number) {
        let body = new Body();

        body.work = 1;
        body.carry = 1;
        body.move = 1;

        let remainingEnergy = Math.min(maxEnergy, maxEnergy);
        var remaining = remainingEnergy - 200;

        while (remaining >= 150 && body.getBody().length < (50 - 3)) {
            if (remaining >= 400 && body.getBody().length < (50-6)) {
                body.work++; body.work++; body.carry++; body.carry++; body.move++; body.move++;
                remaining -= 400;
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