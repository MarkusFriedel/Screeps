import {ColonyHandler} from "../../../colony/colonyHandler";


export class Scout {

    creep: Creep;
    colonyHandler: ColonyHandler;

    constructor(creep: Creep, colonyHandler: ColonyHandler) {
        this.creep = creep;
        this.colonyHandler = colonyHandler;
    }

    public tick() {

    }

}