class Body implements BodyInterface {

    static getFromBodyArray(parts: BodyPartDefinition[]) {
        let body = new Body();
        for (let part in BODYPARTS_ALL) {
            body[BODYPARTS_ALL[part]] = _.filter(parts, x => x.type == BODYPARTS_ALL[part]).length;
        }

        return body;
    }

    static getFromCreep(creep: Creep) {
        return Body.getFromBodyArray(creep.body);
    }



    public get costs() {
        let costs = 0;
        costs += this.move * BODYPART_COST[MOVE];
        costs += this.work * BODYPART_COST[WORK];
        costs += this.attack * BODYPART_COST[ATTACK];
        costs += this.carry * BODYPART_COST[CARRY];
        costs += this.heal * BODYPART_COST[HEAL];
        costs += this.ranged_attack * BODYPART_COST[RANGED_ATTACK];
        costs += this.tough * BODYPART_COST[TOUGH];
        costs += this.claim * BODYPART_COST[CLAIM];
        return costs;
    }

    boosts: { [compound: string]: { compound: string, amount: number } } = {};

    move: number=0;
    work: number = 0;
    attack: number = 0;
    carry: number = 0;
    heal: number = 0;
    ranged_attack: number = 0;
    tough: number = 0;
    claim: number = 0;

    public get energyHarvestingRate() {
        let rate = this.work * HARVEST_POWER;
        _.forEach(this.boosts, b => {
            if (BOOSTS.work[b.compound] && BOOSTS.work[b.compound].harvest)
                rate += HARVEST_POWER * (BOOSTS.work[b.compound].harvest - 1) * b.amount;
        });

        return rate;
    }

    public get mineralHarvestingRate() {
        return this.energyHarvestingRate / 2;
    }

    public get isMilitaryDefender() {
        return (this.heal + this.ranged_attack + this.attack) > 0;
    }

    public get isMilitaryAttacker() {
        return (this.heal + this.ranged_attack + this.attack + this.work) > 0;
    }



    public getBody() {
        let body: string[] = [];
        for (let i = 0; i < this.tough; i++)
            body.push(TOUGH);
        for (let i = 0; i < this.claim; i++)
            body.push(CLAIM);
        for (let i = 0; i < this.ranged_attack; i++)
            body.push(RANGED_ATTACK);
        for (let i = 0; i < this.attack; i++)
            body.push(ATTACK);
        for (let i = 0; i < this.work; i++)
            body.push(WORK);
        for (let i = 0; i < this.heal; i++)
            body.push(HEAL);
        for (let i = 0; i < this.carry; i++)
            body.push(CARRY);
        for (let i = 0; i < this.move; i++)
            body.push(MOVE);

        return body;
    }
}