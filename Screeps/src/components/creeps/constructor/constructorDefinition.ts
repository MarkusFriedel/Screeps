import {Body} from "../body";

export namespace ConstructorDefinition {

    export function getDefinition(maxEnergy: number) {
        let body = new Body();

        body.work = 1;
        body.carry = 1;
        body.move = 1;

        let remainingEnergy = Math.min(maxEnergy, 1500);
        var remaining = remainingEnergy - 200;

        while (remaining >= 100) {
            if (remaining >= 150) {
                body.carry++; body.carry++; body.move++;
                remaining -= 150;
            }
            else if (remaining >= 100) {
                body.carry++; body.move++;
                remaining -= 100;
            }
        }

        

        return body;
    }

}