﻿class TowerFiller {

    creep: Creep;
    mainRoom: MainRoomInterface;

    constructor(creep: Creep, mainRoom: MainRoomInterface) {
        this.creep = creep;
        this.mainRoom = mainRoom;
    }

    public tick() {
        if (this.mainRoom.towers.length == 0)
            return;
        if (this.creep.carry.energy == 0) {
            let links = _.filter(this.mainRoom.links, (x) => x.nextToTower == true);
            if (links.length > 0 && links[0].link) {
                let link = links[0].link;

                if (link.transferEnergy(this.creep) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(link);
            }
            else {
                let container = this.mainRoom.mainContainer;
                if (container) {
                    if (container.transfer(this.creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(container);
                }
            }
        }
        else {
            let tower = _.min(this.mainRoom.towers, t => t.energy);
            if (tower) {
                if (this.creep.transfer(tower, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(tower);
            }
        }
    }

}
