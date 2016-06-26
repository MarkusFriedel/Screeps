import {Body} from "../body";

export namespace UpgraderDefinition {

    export function getDefinition(maxEnergy: number) {
        let body = new Body();

        let remainingEnergy = Math.min(maxEnergy, 1500);

        var basicModuleCount = ~~(remainingEnergy / 300);
        body.work = basicModuleCount * 2;
        body.carry = basicModuleCount * 1;
        body.move = basicModuleCount * 1;

        var remaining = maxEnergy - basicModuleCount * 300;

        while (remaining >= 100) {
            if (remaining >= 300) {
                body.work++; body.carry++; body.carry++; body.carry++; body.move++;
                remaining -= 300;
            }
            else if (remaining >= 150) {
                body.work++; body.move++;
                remaining -= 150;
            }
            else if (remaining >= 50) {
                body.carry++;
                remaining -= 50;
            }
        }
        
        return body;
    }

}