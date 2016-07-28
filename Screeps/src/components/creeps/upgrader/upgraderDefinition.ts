namespace UpgraderDefinition {

    export function getDefinition(maxEnergy: number,minCarry=false, maxWorkParts=50) {
        let body = new Body();

        let remainingEnergy = maxEnergy;// Math.min(maxEnergy, 1500);

        var basicModuleCount = ~~(remainingEnergy / 300);
        if (basicModuleCount*2 > maxWorkParts)
            basicModuleCount= Math.floor(maxWorkParts / 2);

        if (basicModuleCount * 4 > 50) {
            basicModuleCount = Math.floor(50 / 4);
        }
        body.work = basicModuleCount * 2;
        body.carry = basicModuleCount * 1;
        body.move = basicModuleCount * 1;

        

        var remaining = maxEnergy - basicModuleCount * 300;

        while (remaining >= 100 && body.getBody().length <= 45 && body.work < maxWorkParts) {
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
            else
                break;
        }

        if (minCarry)
            body.carry = Math.min(Math.floor(body.getBody().length/5),body.carry);
        
        return body;
    }

}