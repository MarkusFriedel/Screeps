/// <reference path="../body.ts" />

namespace KeeperBusterDefinition {

    export function getDefinition(maxEnergy: number, resources?: { [resource: string]: number }) {
        let body = new Body();

        body.tough = 1;

        let requiredHealAmount = 8 * RANGED_ATTACK_POWER;
        let requiredHealModules = requiredHealAmount / HEAL_POWER;

        let boostCompound = _.filter(_.sortByOrder(ReactionManager.BOOSTPOWERS['heal'].resources, [r => r.resource], ['desc']), r => resources[r.resource] >= Math.ceil(requiredHealModules / r.factor) * LAB_BOOST_MINERAL)[0];

        if (boostCompound) {
            requiredHealModules = Math.ceil(requiredHealModules / boostCompound.factor);
            body.boosts[boostCompound.resource] = { compound: boostCompound.resource, amount: requiredHealModules };
        }

        body.heal = requiredHealModules;

        let rangedAttackModules = 12;

        boostCompound = _.filter(_.sortByOrder(ReactionManager.BOOSTPOWERS['rangedAttack'].resources, [r => r.resource], ['desc']), r => resources[r.resource] >= Math.ceil(rangedAttackModules / r.factor) * LAB_BOOST_MINERAL)[0];

        if (boostCompound) {
            rangedAttackModules = Math.floor(rangedAttackModules / boostCompound.factor);
            body.boosts[boostCompound.resource] = { compound: boostCompound.resource, amount: rangedAttackModules };
            
        }

        body.ranged_attack = rangedAttackModules;

        body.move = body.tough + body.heal + body.ranged_attack;

        if (body.costs > maxEnergy)
            return null;

        return body;
    }

}

