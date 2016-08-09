class MyLink implements MyLinkInterface {

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

    drain: boolean;
    fill: boolean;


    public get minLevel() {
        if (this.nextToStorage) {
            if (_.any(this.mainRoom.links, x => x.id != this.id && !x.nextToStorage && !x.nearSource && x.link && x.link.energy < x.minLevel)) {
                return this.link.energyCapacity;
            }
            else return 0;
        }
        else if (this.drain && this.fill)
            return 400;
        else if (this.drain)
            return 0;
        else if (this.fill)
            return this.link.energyCapacity - 100;
    }

    public get maxLevel() {
        if (this.nextToStorage) {
            if (_.any(this.mainRoom.links, x => x.id != this.id && !x.nextToStorage && !x.nearSource && x.link && x.link.energy < x.minLevel)) {
                return this.link.energyCapacity;
            }
            else return 0;
        }
        else if (this.drain && this.fill)
            return 400;
        else if (this.drain)
            return 0;
        else if (this.fill)
            return this.link.energyCapacity;
    }

    id: string;



    constructor(link: Link, public mainRoom: MainRoom) {
        this.id = link.id;
        if (myMemory['profilerActive'])
            this.tick = profiler.registerFN(this.tick, 'MyLink.tick');


        let surroundingStructures = <Array<LookAtResultWithPos>>mainRoom.room.lookForAtArea(LOOK_STRUCTURES, link.pos.y - 2, link.pos.x - 2, link.pos.y + 2, link.pos.x + 2, true);
        this.nextToStorage = _.any(surroundingStructures, x => x.structure.structureType == STRUCTURE_STORAGE);
        this.nextToTower = _.any(surroundingStructures, x => x.structure.structureType == STRUCTURE_TOWER);
        this.nearSource = link.pos.findInRange(FIND_SOURCES, 4).length > 0;
        this.nearController = link.pos.inRangeTo(mainRoom.room.controller.pos, 4);



        this.drain = this.nearSource || this.nextToStorage;
        this.fill = this.nextToStorage || this.nextToTower || this.nearController;

    }

    public tick() {
        if (this.nextToStorage) {
            let myLinkToFill = _.sortBy(_.filter(this.mainRoom.links, x => x.minLevel > x.link.energy), x => 800 - (x.minLevel - x.link.energy))[0];
            if (myLinkToFill) {
                this.link.transferEnergy(myLinkToFill.link, Math.min(myLinkToFill.maxLevel - myLinkToFill.link.energy, this.link.energy));
            }
        }
        else {
            if (this.link.energy > this.maxLevel) {
                let myLinkToFill = _.sortBy(_.filter(this.mainRoom.links, x => !x.nextToStorage && x.minLevel > x.link.energy), x => 800 - (x.minLevel - x.link.energy))[0];
                if (myLinkToFill) {
                    this.link.transferEnergy(myLinkToFill.link, Math.min(myLinkToFill.maxLevel - myLinkToFill.link.energy, this.link.energy - this.maxLevel));
                }
                else {
                    myLinkToFill = _.filter(this.mainRoom.links, x => x.nextToStorage)[0];
                    if (myLinkToFill) {
                        this.link.transferEnergy(myLinkToFill.link, Math.min(myLinkToFill.link.energyCapacity - myLinkToFill.link.energy, this.link.energy - this.maxLevel));
                    }
                }

            }
        }
    }

}