import {Body} from "../body";

export namespace SpawnFillerDefinition {

    export function getDefinition(maxEnergy: number) {
        let body = new Body();

        var basicModuleCount = ~~(maxEnergy / 150);
        basicModuleCount = (basicModuleCount > 8) ? 8 : basicModuleCount;

        body.carry = 2 * basicModuleCount;
        body.move = 1 * basicModuleCount;

        return body;
    }

}