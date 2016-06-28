import {Body} from "../body";

export namespace LinkFillerDefinition {

    export function getDefinition() {
        let body = new Body();

        body.carry = 8;
        body.move = 2;

        return body;
    }

}