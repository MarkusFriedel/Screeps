namespace RepairerDefinition {

    export function getDefinition(maxEnergy: number) {
        let body = new Body();

        let remainingEnergy = Math.min(maxEnergy, 3500);

        if (remainingEnergy < 350) {
            body.work = 1;
            body.carry = 2;
            body.move = 2;
        }
        else {

            var basicModulesCount = ~~(remainingEnergy / 350); //work,carry,carry,move,move
            if (basicModulesCount > 8)
                basicModulesCount = 8;

            body.work = 1 * basicModulesCount;
            body.carry = 3 * basicModulesCount;
            body.move = 2 * basicModulesCount;

            var remaining = remainingEnergy - 350 * basicModulesCount;

            remaining = Math.min(remaining, 300);

            //while (remaining >= 150) {
            //    body.carry++;
            //    body.carry++;
            //    body.move++;
            //    remaining -= 150;
            //}



        }
        return body;
    }
}