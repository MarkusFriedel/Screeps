class BodyInfo implements BodyInfoInterface {

    constructor(public parts: BodyPartDefinition[]) {

    }

    private _attackRate: { time: number, rate: number };
    public get attackRate() {
        if (this._attackRate == null || this._attackRate.time < Game.time) {
            this._attackRate = {
                time: Game.time,
                rate: _.sum(_.filter(this.parts, part => part.type == ATTACK && part.hits>0), part => ATTACK_POWER * (BOOSTS.attack[part.boost] ? BOOSTS.attack[part.boost].attack : 1))
            };
        }

        return this._attackRate.rate;
    }

    private _rangedAttackRate: { time: number, rate: number };
    public get rangedAttackRate() {
        if (this._rangedAttackRate == null || this._rangedAttackRate.time < Game.time) {
            this._rangedAttackRate = {
                time: Game.time,
                rate: _.sum(_.filter(this.parts, part => part.type == RANGED_ATTACK && part.hits > 0), part => RANGED_ATTACK_POWER * (BOOSTS.ranged_attack[part.boost] ? BOOSTS.ranged_attack[part.boost].rangedAttack : 1))
            };
        }

        return this._rangedAttackRate.rate;
    }

    public get totalAttackRate() {
        return this.attackRate + this.rangedAttackRate;
    }

    private _healRate: { time: number, rate: number };
    public get healRate() {
        if (this._healRate == null || this._healRate.time < Game.time) {
            this._healRate = {
                time: Game.time,
                rate: _.sum(_.filter(this.parts, part => part.type == HEAL && part.hits > 0), part => HEAL_POWER * (BOOSTS.heal[part.boost] ? BOOSTS.heal[part.boost].heal : 1 ))
            };
        }

        return this._healRate.rate;
    }

    private _damageRate: { time: number, rate: number };
    public get damageRate() {
        if (this._damageRate == null || this._damageRate.time < Game.time) {
            this._damageRate = {
                time: Game.time,
                rate: _.min(_.map(_.filter(this.parts, part => part.type == TOUGH && part.hits > 0), part => (BOOSTS.tough[part.boost] ? BOOSTS.tough[part.boost].damage : 1))) || 1
            };
        }
        return this._damageRate.rate;
    }

    private _toughAmount: { time: number, amount: number };
    public get toughAmount() {
        if (this._toughAmount == null || this._toughAmount.time < Game.time) {
            this._toughAmount = {
                time: Game.time,
                amount: _.sum(_.filter(this.parts, part => part.type == TOUGH && part.hits > 0), x => x.hits)
            };
        }

        return this._toughAmount.amount;
    }
}