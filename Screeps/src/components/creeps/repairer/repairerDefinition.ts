namespace RepairerDefinition {

    export function getDefinition(maxEnergy: number) {
        let body = new Body();

        let remainingEnergy = Math.min(maxEnergy, 800);

        if (remainingEnergy < 400) {
            body.work = 1;
            body.carry = 2;
            body.move = 2;
        }
        else {

            var basicModulesCount = ~~(remainingEnergy / 400); //work,carry,carry,move,move
            if (basicModulesCount > 5)
                basicModulesCount = 5;

            body.work = 2 * basicModulesCount;
            body.carry = 2 * basicModulesCount;
            body.move = 2 * basicModulesCount;

            var remaining = remainingEnergy - 400 * basicModulesCount;

            while (remaining >= 100) {
                if (remaining >= 200) {
                    body.work++;
                    body.carry++;;
                    body.move++;;
                    remaining -= 200;
                }
                else if (remaining >= 100) {
                    body.carry++;
                    body.move++;
                    remaining -= 100;
                }
                else
                    break;
            }


            
        }
        return body;
    }
}