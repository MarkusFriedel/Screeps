namespace MineralHarvesterDefinition {

 

    export function getDefinition(maxEnergy: number, myMineral: MyMineralInterface, resources?: { [resource: string]: number }) {
        let baseBody = new Body();
        //baseBody.carry = 2;

        if (myMineral.hasKeeper) {
            baseBody.heal = 2;
            baseBody.move = 1;
        }
        let remainingEnergy = maxEnergy - baseBody.costs;

        if (remainingEnergy < BODYPART_COST.work + BODYPART_COST.move)
            return { count: 0, body: baseBody };

        let workBody = new Body();
        workBody.work = ['H', 'O', 'X'].indexOf(myMineral.resource) >= 0 ? 20 : 10;

        if (myMineral.hasKeeper)
            workBody.work *= 1;

        workBody.move = Math.ceil(workBody.work / 2);

        if (resources) {
            let boostCompound = _.filter(_.sortByOrder(ReactionManager.BOOSTPOWERS['harvest'].resources, [r => r.resource], ['desc']), r => resources[r.resource] >= Math.ceil(workBody.work / r.factor) * LAB_BOOST_MINERAL)[0];

            if (boostCompound) {
                workBody.work = Math.ceil(workBody.work / boostCompound.factor);
                workBody.boosts[boostCompound.resource] = { compound: boostCompound.resource, amount: workBody.work };
            }
        }
        let count = 1;
        if (workBody.costs > remainingEnergy) {
            count = Math.ceil(workBody.costs / maxEnergy);
            workBody.work = Math.ceil(workBody.work / count);
            workBody.move = Math.ceil(workBody.work / 2);
            _.forEach(workBody.boosts, b => b.amount = Math.min(b.amount, workBody.work));
        }

        workBody.move += baseBody.move;
        workBody.heal += baseBody.heal;
        workBody.carry += baseBody.carry;

        return { count: Math.min(count, myMineral.maxHarvestingSpots - (myMineral.hasKeeper ? 1 : 0)), body: workBody };
    }

}