import {Body} from "../body";

export namespace HarvesterDefinition {

    function getHarvesterDefinition(maxEnergy: number, maxWorkParts: number) {
        let body = new Body();

        let remainingEnergy = Math.min(maxEnergy, 1500);
        var basicModulesCount = ~~(remainingEnergy / 200); //work,carry,move

        body.work = basicModulesCount;
        body.carry = basicModulesCount;
        body.move = basicModulesCount;

        var remaining = remainingEnergy - basicModulesCount * 200;

        while (remaining >= 100) {
            if (remaining >= 150) {
                body.carry++; body.carry++; body.move++;
                remaining -= 150;
            }
            else if (remaining >= 100) {
                body.carry++; body.move++;
                remaining -= 100;
            }
            else
                break;
        }
        return body;
    }

    function getMinerDefinition(maxEnergy: number, maxWorkParts: number) {
        let body = new Body();
        body.carry = 2;
        var remainingEnergy = maxEnergy - 2 * BODYPART_COST.carry;

        var basicModulesCount = Math.floor(remainingEnergy / (2 * BODYPART_COST.work + BODYPART_COST.move)); //work,carry,move

        body.move = basicModulesCount;
        body.work = 2 * basicModulesCount;
        remainingEnergy -= basicModulesCount * (2 * BODYPART_COST.work + BODYPART_COST.move);

        if (remainingEnergy >= (BODYPART_COST.work + BODYPART_COST.move)) {
            body.work++;
            body.move++;
        }

        if (body.work > maxWorkParts) {
            body.work = maxWorkParts;
            body.move = Math.ceil(body.work / 2);
        }

        return body;
    }

    export function getDefinition(maxEnergy: number, hasSourceContainer: boolean=false, maxWorkParts:number=50) {        
        if (!hasSourceContainer) 
            return getHarvesterDefinition(maxEnergy, maxWorkParts);
        else
            return getMinerDefinition(maxEnergy, maxWorkParts);
    }

}