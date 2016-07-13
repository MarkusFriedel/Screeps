class ReactionManager implements ReactionManagerInterface {

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
            return _.any(Colony.mainRooms, mainRoom => mainRoom.mineral.mineralType == resource) || this.getAvailableResourceAmount(resource) > 1000;
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

    private setupProcess() {
        let changed = false;
        let requirements = _.difference(this.imports, this.reactions);
        console.log('Mineral requirements: ' + requirements.join(','));
        _.forEach(requirements, r => {
            if (this.getAvailableResourceAmount(r) > 10000)
                return;
            let bestManager = _.sortBy(_.filter(_.map(this.labManagers, x => {
                return { manager: x, requiredLabs: x.requiredLabsForReaction(r) }
            }), x => x.requiredLabs != null), x => x.requiredLabs)[0];
            if (bestManager) {
                console.log('Best Manager for reaction: ' + bestManager.manager.mainRoom.name);
                bestManager.manager.addReaction(r);
                changed = true;
            }
        });
        return changed;
    }

    private setupTime = null;
    private setup() {
        if (this.setupTime == null || this.setupTime + 5000 < Game.time) {
            _.forEach(this.labManagers, x => x.reset());
            this.setupTime = Game.time;
            this.requiredResources = {};
            this.setupPublishs();
            while (this.setupProcess()) { }
            //this.setupProcess();
            //this.setupProcess();
            //this.setupProcess();

        }
    }

    public tick() {
        this.setup();
    }
}