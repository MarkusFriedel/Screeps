namespace SpawnFillerDefinition {

    export function getDefinition(maxEnergy: number) {
        let body = new Body();

        let remainingEnergy = Math.min(maxEnergy, 150*12);

        var basicModuleCount = ~~(remainingEnergy / 150);
        //basicModuleCount = (basicModuleCount > 8) ? 8 : basicModuleCount;

        body.carry = 2 * basicModuleCount;
        body.move = 1 * basicModuleCount;

        return body;
    }

}