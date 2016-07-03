namespace SourceCarrierDefinition {

    export function getDefinition(maxEnergy: number,maxCarryParts:number=50) {
        let body = new Body();

        var basicModuleCount = ~~(maxEnergy / 150);
        if (basicModuleCount * 3 > 50)
            basicModuleCount = ~~(50 / 3);

        if (basicModuleCount * 2 > maxCarryParts) {
            basicModuleCount = Math.ceil(maxCarryParts / 2);
        }

        body.carry = 2 * basicModuleCount;
        body.move = basicModuleCount;

        return body;
    }

}