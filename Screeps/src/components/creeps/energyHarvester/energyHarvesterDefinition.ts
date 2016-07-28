namespace EnergyHarvesterDefinition {

    function getHarvesterDefinition(maxEnergy: number, maxWorkParts: number) {
        let body = new Body();

        let remainingEnergy = Math.min(maxEnergy, 1500);
        var basicModulesCount = ~~(remainingEnergy / 200); //work,carry,move

        body.work = basicModulesCount;
        body.carry = basicModulesCount;
        body.move = basicModulesCount;

        var remaining = remainingEnergy - basicModulesCount * 200;

        while (remaining >= 100) {
            if (remaining >= 150) {
                body.carry++; body.carry++; body.move++;
                remaining -= 150;
            }
            else if (remaining >= 100) {
                body.carry++; body.move++;
                remaining -= 100;
            }
            else
                break;
        }
        return body;
    }

    function getMinerDefinition(maxEnergy: number, maxWorkParts: number, resources?: { [resource: string]: number }, hasKeeper: boolean = false) {
        let body = new Body();
        body.carry = 2;
        var remainingEnergy = maxEnergy - 2 * BODYPART_COST.carry;
        let requiredMaxWorkParts = maxWorkParts;

        if (hasKeeper) {
            body.heal = 2;
            remainingEnergy -= 2 * BODYPART_COST.heal;
        }

        let boostCompound = _.filter(_.sortByOrder(ReactionManager.BOOSTPOWERS['harvest'].resources, [r => r.resource], ['desc']), r => resources[r.resource] >= Math.ceil(maxWorkParts / r.factor) * LAB_BOOST_MINERAL)[0];


        if (boostCompound) {
            requiredMaxWorkParts = Math.ceil(requiredMaxWorkParts / boostCompound.factor);
            body.boosts[boostCompound.resource] = { compound: boostCompound.resource, amount: requiredMaxWorkParts };
        }

        var basicModulesCount = Math.floor(remainingEnergy / (2 * BODYPART_COST.work + BODYPART_COST.move)); //work,carry,move

        

        

        body.move = basicModulesCount + body.heal/2;
        body.work = 2 * basicModulesCount;
        remainingEnergy -= basicModulesCount * (2 * BODYPART_COST.work + BODYPART_COST.move);

        if (remainingEnergy >= (BODYPART_COST.work + BODYPART_COST.move)) {
            body.work++;
            body.move++;
        }

        if (body.work > requiredMaxWorkParts) {
            body.work = requiredMaxWorkParts;
            body.move = Math.ceil((body.work + body.heal) / 2);
        }

        return body;
    }

    export function getDefinition(maxEnergy: number, hasSourceContainer: boolean = false, maxWorkParts: number = 50, resources?: { [resource: string]: number }, hasKeeper: boolean = false) {        
        if (!hasSourceContainer) 
            return getHarvesterDefinition(maxEnergy, maxWorkParts);
        else
            return getMinerDefinition(maxEnergy, maxWorkParts, resources, hasKeeper);
    }

}