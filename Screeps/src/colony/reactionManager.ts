class ReactionManager implements ReactionManagerInterface {

    public get memory(): ReactionManagerMemory {
        return this.accessMemory();
    }

    accessMemory() {
        if (Colony.memory.reactionManager == null)
            Colony.memory.reactionManager = {
                setupTime: null
            }
        return Colony.memory.reactionManager;
    }

    private static basicCompounds = [RESOURCE_HYDROXIDE, RESOURCE_ZYNTHIUM_KEANITE, RESOURCE_UTRIUM_LEMERGITE, RESOURCE_GHODIUM];

    private _ingredients: { [output: string]: string[] } = null;
    public get ingredients() {
        if (this._ingredients == null) {
            this._ingredients = {};
            for (let ing1 in REACTIONS) {
                for (let ing2 in REACTIONS[ing1]) {
                    this._ingredients[REACTIONS[ing1][ing2]] = [ing1, ing2];
                }
            }

        }
        return this._ingredients;
    }

    private requiredResources: { [resource: string]: number } = {};

    public canProduce(resource: string) {
        if (this.ingredients[resource] == null)
            return _.any(Colony.mainRooms, mainRoom => mainRoom.mineral.mineralType == resource) || this.getAvailableResourceAmount(resource) > 2000;
        else {
            return this.canProduce(this.ingredients[resource][0]) && this.canProduce(this.ingredients[resource][1]);
        }
    }

    private _availableResources: { [resource: string]: { time: number, amount: number } } = {}
    public getAvailableResourceAmount(resource: string) {
        if (this._availableResources[resource] == null || this._availableResources[resource].time + 100 < Game.time)
            this._availableResources[resource] = {
                time: Game.time,
                amount: _.sum(this.labManagers, lm => lm.mainRoom.terminal ? lm.mainRoom.terminal.store[resource] : 0)
            };
        return this._availableResources[resource].amount;
    }

    private labManagers: {
        [roomName: string]: LabManagerInterface
    } = {};

    public registerLabManager(labManager: LabManagerInterface) {
        this.labManagers[labManager.mainRoom.name] = labManager;
    }

    private setupPublishs() {
        _.forEach(this.labManagers, lm => lm.setupPublishs());
    }

    private get imports() {
        return _.uniq(_.flatten(_.map(this.labManagers, l => l.imports)));
    }

    private get reactions() {
        return _.uniq(_.flatten(_.map(this.labManagers, l => l.reactions)));
    }

    private setupProcess(resource: string) {
        if (this.ingredients[resource]==null || this.getAvailableResourceAmount(resource) > 10000)
            return false;
        let bestManager = _.sortBy(_.filter(_.map(this.labManagers, x => {
            return { manager: x, requiredLabs: x.requiredLabsForReaction(resource) }
        }), x => x.requiredLabs != null), x => x.requiredLabs)[0];
        if (bestManager) {
            console.log('Best Manager for reaction: ' + bestManager.manager.mainRoom.name);
            bestManager.manager.addReaction(resource);
            return true;
        }
        return false;
    }

    private setupProcesses() {
        let changed = false;
        let requirements = _.difference(this.imports, this.reactions);
        console.log('Mineral requirements: ' + requirements.join(','));
        _.forEach(requirements, r => {
            if (this.setupProcess(r))
                changed = true;
        });

        return changed;
    }

    private setupBasics() {
        let changed = false;

        let requirements = _.filter(ReactionManager.basicCompounds,x=> this.canProduce(x));
        console.log('Mineral requirements: ' + requirements.join(','));
        _.forEach(requirements, r => {
            if (this.setupProcess(r))
                changed = true;
        });

        return changed;
    }

    private setup() {
        if (this.memory.setupTime == null || this.memory.setupTime + 5000 < Game.time) {
            _.forEach(this.labManagers, x => x.reset());
            this.memory.setupTime = Game.time;
            this.requiredResources = {};
            this.setupPublishs();
            let changed = true;
            while (changed) {
                while (this.setupProcesses()) { }
                changed = this.setupBasics();
            }
            //this.setupProcess();
            //this.setupProcess();
            //this.setupProcess();

        }
    }

    

    public tick() {
        this.setup();
        this.sendResourcesUsingTerminals();
    }

    private sendResourcesUsingTerminals() {
        if ((Game.time + 25) % 100 == 0) {
            console.log('reactionManager.sendResourcesUsingTerminals');
            _.forEach(_.filter(this.labManagers, x => x.imports.length > 0 && x.mainRoom && x.mainRoom.terminal), labManager => {
                console.log('reactionManager.sendResourcesUsingTerminals  LabManager: ' + labManager.mainRoom.name);
                console.log('reactionManager.sendResourcesUsingTerminals  LabManager: ' + labManager.mainRoom.name + ', imports: ' + labManager.imports.join(','));
                _.forEach(_.filter(labManager.imports, x => !labManager.mainRoom.terminal.store[x] || labManager.mainRoom.terminal.store[x] < 2000), resource => {
                    console.log('reactionManager.sendResourcesUsingTerminals  Resource: ' + resource);
                    let otherRoom = _.sortBy(_.filter(Colony.mainRooms, mainRoom => mainRoom.terminal && (mainRoom.terminal.store[resource] >= 4000 || (!mainRoom.labManager || !(resource in mainRoom.labManager.imports)) && mainRoom.terminal.store[resource] >= 2000)), x => labManager.mainRoom.myRoom.memory.mainRoomDistanceDescriptions[x.name])[0];
                    if (otherRoom) {
                        console.log('reactionManager.sendResourcesUsingTerminals  otherRoom: ' + otherRoom.name);
                        otherRoom.terminal.send(resource, 2000, labManager.mainRoom.name);
                    }
                });
            });
        }
    }
}