import {MainRoom} from "../rooms/MainRoom";

export class MyLink {

    nearSource: boolean;
    nextToStorage: boolean;
    nextToTower: boolean;

    maxLevel: number;
    minLevel: number;
    id: string;

    constructor(public link: Link, public mainRoom: MainRoom) {
        this.id = link.id;


    }

    public tick() {
        this.link = Game.getObjectById<Link>(this.id);
    }

}