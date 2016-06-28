import {MainRoom} from "../rooms/MainRoom";

export class MyLink {

    _link: { time: number, link: Link } = { time: 0, link: null };
    public get link(): Link {
        if (this._link.time < Game.time)
            this._link = {
                time: Game.time, link: Game.getObjectById<Link>(this.id)
            };
        return this._link.link;
    }

    nearSource: boolean;
    nextToStorage: boolean;
    nextToTower: boolean;
    nearController: boolean;

    maxLevel: number;
    minLevel: number;

    id: string;

    constructor(link: Link, public mainRoom: MainRoom) {
        this.id = link.id;

        let surroundingStructures = <Array<LookAtResultWithPos>>mainRoom.room.lookForAtArea(LOOK_STRUCTURES, link.pos.y - 1, link.pos.x - 1, link.pos.y + 1, link.pos.x + 1, true);
        this.nextToStorage = _.any(surroundingStructures, x => x.structure.structureType == STRUCTURE_STORAGE);
        this.nextToTower = _.any(surroundingStructures, x => x.structure.structureType == STRUCTURE_TOWER);
        this.nearSource = link.pos.findInRange(FIND_SOURCES, 4).length > 0;
        this.nearController = link.pos.inRangeTo(mainRoom.room.controller.pos, 4);



        let drain = this.nearSource;
        let fill = this.nextToStorage || this.nextToTower || this.nearController;

        if (drain && fill) {
            this.maxLevel = 400;
            this.minLevel = 250;
        }
        else if (drain) {
            this.maxLevel = 0;
            this.minLevel = 0;
        }
        else if (fill) {
            this.maxLevel = link.energyCapacity;
            this.minLevel = link.energyCapacity-100;
        }
    }

    public tick() {
        if (this.nextToStorage) {
            let myLinkToFill = _.sortBy(_.filter(this.mainRoom.links, x => x.minLevel > x.link.energy), x => -(x.minLevel - x.link.energy))[0];
            if (myLinkToFill) {
                this.link.transferEnergy(myLinkToFill.link, Math.min(myLinkToFill.maxLevel - myLinkToFill.link.energy, this.link.energy));
            }
        }
        else {
            if (this.link.energy > this.maxLevel) {
                let myLinkToFill = _.filter(this.mainRoom.links, x => x.nextToStorage)[0];
                if (myLinkToFill) {
                    this.link.transferEnergy(myLinkToFill.link, Math.min(myLinkToFill.link.energyCapacity - myLinkToFill.link.energy, this.link.energy - this.maxLevel));
                }

            }
        }
    }

}