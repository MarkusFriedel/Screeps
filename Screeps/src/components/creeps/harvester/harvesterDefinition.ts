import {Body} from "../body";

export namespace HarvesterDefinition {

    export function getDefinition(maxEnergy: number) {
        let body = new Body();

        var basicModulesCount = ~~(maxEnergy / 200); //work,carry,move
        //if (basicModulesCount==0)
        //    return ['work','carry','carry','move','move'];

        body.work = basicModulesCount;
        body.carry = basicModulesCount;
        body.move = basicModulesCount;

        var remaining = maxEnergy - basicModulesCount * 200;

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