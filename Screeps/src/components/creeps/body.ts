export class Body {
        move: number;
        work: number;
        attack: number;
        carry: number;
        heal: number;
        ranged_attack: number;
        tough: number;
        claim: number;

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