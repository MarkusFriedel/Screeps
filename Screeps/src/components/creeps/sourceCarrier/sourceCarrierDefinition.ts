namespace SourceCarrierDefinition {

    export function getDefinition(maxEnergy: number, requiredAmount: number, resources?: { [resource: string]: number }) {
        let body = new Body();

        body.carry = (requiredAmount / CARRY_CAPACITY);
        if (body.carry % 2 == 1)
            body.carry++;
        body.move = Math.ceil(body.carry/2);

        let partDivider = Math.ceil((body.carry + body.move) / 50);
        let energyDivider = Math.ceil(body.costs / maxEnergy);

        let count = Math.max(partDivider, energyDivider);
        if (count > 1) {
            body.carry = Math.floor(body.carry / count);
            body.move = Math.ceil(body.carry / 2);
        }

        return { count: count, body: body };
    }

}