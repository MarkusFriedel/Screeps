namespace DefenderDefinition {

    export function getDefinition(maxEnergy: number) {
        let body = new Body();

        let remainingEnergy = Math.min(maxEnergy, 700);

        var basicModulesCount = ~~(remainingEnergy / 190); //work,carry,move
        body.attack = basicModulesCount;
        body.tough = basicModulesCount;
        body.move = 2 * basicModulesCount;

        remainingEnergy = remainingEnergy - 190 * basicModulesCount;

        while (remainingEnergy >= (BODYPART_COST.attack + BODYPART_COST.move) && body.getBody().length <= 48) {
            body.attack++; body.move++;
            remainingEnergy -= (BODYPART_COST.attack + BODYPART_COST.move);
        }

        while (remainingEnergy >= (BODYPART_COST.tough + BODYPART_COST.move) && body.getBody().length<=48) {
            body.tough++; body.move++;
            remainingEnergy -= (BODYPART_COST.tough + BODYPART_COST.move);
        }
        return body;
    }

}