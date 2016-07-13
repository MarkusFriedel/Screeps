/// <reference path="../body.ts" />

namespace TerminalFillerDefinition {

    export function getDefinition(maxEnergy: number) {
        let body = new Body();

        body.carry = 9;
        body.move = 3;

        return body;
    }

}