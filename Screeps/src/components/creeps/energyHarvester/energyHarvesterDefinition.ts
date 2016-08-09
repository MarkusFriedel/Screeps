namespace EnergyHarvesterDefinition {

    function getHarvesterDefinition(maxEnergy: number, mySource: MySourceInterface) {
        let body = new Body();


        body.work = mySource.rate / HARVEST_POWER;

        body.carry = body.work;

        body.move = body.work;

        let count = 1;

        if (body.costs > maxEnergy) {
            count = Math.ceil(body.costs / maxEnergy);
            body.work = Math.floor(body.work / count);
            body.carry = Math.floor(body.carry / count);
            body.move = Math.floor(body.move / count);
        }

        if (body.costs + BODYPART_COST.carry + BODYPART_COST.move <= maxEnergy) {
            body.move++;
            body.carry++;
        }


        return { count: Math.min(mySource.maxHarvestingSpots, count), body: body };
    }

    function getMinerDefinition(maxEnergy: number, mySource: MySourceInterface,resources?: {[resource: string]: number}) {
        let baseBody = new Body();

        if (maxEnergy == 300) {
            baseBody.work = 2;
            baseBody.move = 2;
            return {
                body: baseBody, count: mySource.rate / baseBody.energyHarvestingRate
            };
        }

        if (mySource.link || !mySource.hasKeeper && !mySource.containerPosition)
            baseBody.carry = 2;

        if (mySource.hasKeeper) {
            baseBody.heal = 2;
            baseBody.move = 1;
        }
        let remainingEnergy = maxEnergy - baseBody.costs;

        if (remainingEnergy < BODYPART_COST.work + BODYPART_COST.move)
            return { count: 0, body: baseBody };

        let workBody = new Body();
        workBody.work = mySource.rate / HARVEST_POWER;

        if (mySource.hasKeeper)
            workBody.work *= 2;
        
        if (resources) {
            let boostCompound = _.filter(_.sortByOrder(ReactionManager.BOOSTPOWERS['harvest'].resources, [r => r.resource], ['desc']), r => resources[r.resource] >= Math.ceil(workBody.work / r.factor) * LAB_BOOST_MINERAL)[0];

            if (boostCompound) {
                workBody.work = Math.ceil(workBody.work / boostCompound.factor);
                workBody.boosts[boostCompound.resource] = { compound: boostCompound.resource, amount: workBody.work };
            }
        }
        workBody.move = Math.ceil(workBody.work / 2);

        let count = 1;
        if (workBody.costs > remainingEnergy) {
            count = Math.ceil(workBody.costs / maxEnergy);
            workBody.work = Math.floor(workBody.work / count);
            workBody.move = Math.floor(workBody.work / 2);
            _.forEach(workBody.boosts, b => b.amount = Math.min(b.amount, workBody.work));
        }

        workBody.move += baseBody.move;
        workBody.heal += baseBody.heal;
        workBody.carry += baseBody.carry;

        return { count: Math.min(count, mySource.maxHarvestingSpots), body: workBody };
    }

    export function getDefinition(maxEnergy: number, mySource: MySourceInterface, needsToDeliver: boolean = false, resources?: { [resource: string]: number }) {
        if (needsToDeliver)
            return getHarvesterDefinition(maxEnergy, mySource);
        else
            return getMinerDefinition(maxEnergy, mySource, resources);
    }

}