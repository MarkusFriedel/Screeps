class TowerManager implements TowerManagerInterface {
    public get memory(): HarvestingManagerMemory {
        return this.accessMemory();
    }

    accessMemory() {
        if (this.mainRoom.memory.harvestingManager == null)
            this.mainRoom.memory.harvestingManager = {
                debug: false,
                verbose: false
            }
        return this.mainRoom.memory.harvestingManager;
    }

    constructor(public mainRoom: MainRoomInterface) {

    }
}