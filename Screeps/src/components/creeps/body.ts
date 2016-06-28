export class Body {

    static getFromCreep(creep: Creep) {
        let body = new Body();
        for (let part in BODYPARTS_ALL) {
            body[BODYPARTS_ALL[part]] = _.filter(creep.body, x => x.type == BODYPARTS_ALL[part]).length;
        }
        return body;

    }

    move: number;
    work: number;
    attack: number;
    carry: number;
    heal: number;
    ranged_attack: number;
    tough: number;
    claim: number;

    getHarvestingRate() {
        return this.work * 2;
    }


    isMilitary() {
        return (this.heal + this.ranged_attack + this.attack) > 0;
    }

    getBody() {
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