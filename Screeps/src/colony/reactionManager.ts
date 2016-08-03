enum SetupProcessResult {
    Failed = 1,
    FromStorage = 2,
    Reaction = 4
}

class ReactionManager implements ReactionManagerInterface {

    public get memory(): ReactionManagerMemory {
        return this.accessMemory();
    }


    accessMemory() {
        if (Colony.memory.reactionManager == null)
            Colony.memory.reactionManager = {
                setupTime: null,
                highestPowerCompounds: null,
                publishableCompounds:null
            }
        return Colony.memory.reactionManager;
    }

    constructor() {
        this.totalStorage = Colony.profiler.registerFN(this.totalStorage, 'ReactionManager.totalStorage');
        this.canProvide = Colony.profiler.registerFN(this.canProvide, 'ReactionManager.canProvide');
        this.getAvailableResourceAmount = Colony.profiler.registerFN(this.getAvailableResourceAmount, 'ReactionManager.getAvailableResourceAmount');
        this.setupProcess = Colony.profiler.registerFN(this.setupProcess, 'ReactionManager.setupProcess');
        this.setupProcessChain = Colony.profiler.registerFN(this.setupProcessChain, 'ReactionManager.setupProcessChain');
        this.setup = Colony.profiler.registerFN(this.setup, 'ReactionManager.setup');
        this.tick = Colony.profiler.registerFN(this.tick, 'ReactionManager.tick');
    }

    private get labRooms() {
        return _.filter(Colony.mainRooms, mainRoom => _.size(mainRoom.managers.labManager.myLabs) >= 1);
    }

    private totalStorage(resource: string) {
        //let mainContainers = _.map(_.filter(Colony.mainRooms, mainRoom => mainRoom.mainContainer), mainRoom => mainRoom.mainContainer);
        let terminals = _.map(_.filter(Colony.mainRooms, mainRoom => mainRoom.terminal && mainRoom.terminal.store[resource]), mainRoom => mainRoom.terminal);

        //return _.sum(mainContainers, x => x.store[resource]) + _.sum(terminals, x => x.store[resource]);
        return _.sum(terminals, x => x.store[resource]);
    }

    public get requiredAmount() {
        //return this.labRooms.length * 5500 + 5000;
        return 7500;
    }

    private forbiddenCompounds = [RESOURCE_CATALYZED_KEANIUM_ACID, RESOURCE_CATALYZED_LEMERGIUM_ACID, RESOURCE_CATALYZED_UTRIUM_ALKALIDE, RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE];

    public get publishableCompounds() {
        if (this.memory.publishableCompounds == null || this.highestPowerCompounds == null || this.memory.publishableCompounds.time + 500 < this.memory.highestPowerCompounds.time) {
            let compounds = _.uniq(this.highestPowerCompounds.concat(_.filter(RESOURCES_ALL, r => this.ingredients[r] && this.ingredients[r].indexOf(RESOURCE_CATALYST) >= 0)));
            this.memory.publishableCompounds = { time: this.memory.highestPowerCompounds.time, compounds: compounds };
        }

        return this.memory.publishableCompounds.compounds;
    }

    public get highestPowerCompounds() {
        if (this.memory.highestPowerCompounds == null || this.memory.highestPowerCompounds.time + 500 < Game.time) {
            this.memory.highestPowerCompounds = { time: Game.time, compounds: [] };
            _.forEach(ReactionManager.powerPriority, power => {
                let resources = _.sortBy(_.filter(ReactionManager.BOOSTPOWERS[power].resources, r => this.forbiddenCompounds.indexOf(r.resource) < 0), r => r.factor > 1 ? 100 - r.factor : r.factor);
                for (let resource in resources) {
                    if (this.canProvide(resources[resource].resource)) {
                        this.memory.highestPowerCompounds.compounds.push(resources[resource].resource);
                        break;
                    }
                }
            });
        }
        return this.memory.highestPowerCompounds.compounds;
    }

    public canProvide(resource: string, amount: number = null) {
        let requiredAmount = this.requiredAmount;
        if (amount != null)
            requiredAmount = amount;
        if (this.ingredients[resource] == null)
            return _.any(Colony.mainRooms, mainRoom => _.any(mainRoom.minerals, m => m.resource == resource) && mainRoom.room.controller.level >= 6) || this.getAvailableResourceAmount(resource) > requiredAmount;
        else if (this.totalStorage(resource) >= requiredAmount)
            return true;
        else
            return this.canProvide(this.ingredients[resource][0], amount - this.totalStorage(this.ingredients[resource][0])) && this.canProvide(this.ingredients[resource][1], amount - this.totalStorage(this.ingredients[resource][1]));

    }

    //private static _BOOSTPOWERS: { [power: string]: { bodyPart: string, resources: Array<{ resource: string, factor: number }> } };
    public static get BOOSTPOWERS(): { [power: string]: { bodyPart: string, resources: Array<{ resource: string, factor: number }> } } {
        if (!Colony.memory.boostPowers) {
            Colony.memory.boostPowers = {};
            for (let bodyPart in BOOSTS) {
                for (let resource in BOOSTS[bodyPart]) {
                    for (let power in BOOSTS[bodyPart][resource]) {
                        if (Colony.memory.boostPowers[power] == null)
                            Colony.memory.boostPowers[power] = { bodyPart: bodyPart, resources: [] };
                        Colony.memory.boostPowers[power].resources.push({ resource: resource, factor: BOOSTS[bodyPart][resource][power] });
                    }
                }
            }
        }
        return Colony.memory.boostPowers;
    }



    private static basicCompounds = [RESOURCE_HYDROXIDE, RESOURCE_ZYNTHIUM_KEANITE, RESOURCE_UTRIUM_LEMERGITE, RESOURCE_GHODIUM];
    private static powerPriority = [
        'harvest',
        'heal',
        'rangedAttack',
        'damage',
        'attack',
        
        'fatigue',
        'upgradeController',
        'dismantle',
        'capacity',
        'build',
        
    ];


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

    private _highestTierPowers: Array<string>;

    private requiredResources: { [resource: string]: number } = {};

    //public canProduce(resource: string) {
    //    if (this.ingredients[resource] == null)
    //        return _.any(Colony.mainRooms, mainRoom => mainRoom.mineral.mineralType == resource && mainRoom.room.controller.level>=6) || this.getAvailableResourceAmount(resource) > 2000;
    //    else {
    //        return this.canProduce(this.ingredients[resource][0]) && this.canProduce(this.ingredients[resource][1]);
    //    }
    //}

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
        //_.forEach(this.labManagers, lm => lm.setupPublishs());
    }

    private get importCounts(): { [resource: string]: { resource: string, count: number } } {
        return _.indexBy(_.map(_.groupBy(_.flatten(_.map(this.labManagers, lm => lm.imports))), x => { return { resource: x[0], count: x.length } }), x => x.resource);
    }
    private get publishCounts(): { [resource: string]: { resource: string, count: number } } {
        return _.indexBy(_.map(_.groupBy(_.flatten(_.map(this.labManagers, lm => lm.publishs))), x => { return { resource: x[0], count: x.length } }), x => x.resource);
    }

    private get imports() {
        return _.uniq(_.flatten(_.map(this.labManagers, l => l.imports)));
    }

    private get reactions() {
        return _.uniq(_.flatten(_.map(this.labManagers, l => l.reactions)));
    }


    private setupProcess(resource: string): SetupProcessResult {
        if (this.totalStorage(resource) >= this.requiredAmount)
            return SetupProcessResult.FromStorage;
        else if (this.ingredients[resource] == null)
            return SetupProcessResult.Failed;
        let bestManager = _.sortByAll(_.filter(_.map(this.labManagers, x => {
            return { manager: x, requiredLabs: x.requiredLabsForReaction(resource) }
        }), x => x.requiredLabs != null), [x => x.requiredLabs, x => CONTROLLER_STRUCTURES.lab[8] - x.manager.freeLabs.length])[0];
        if (bestManager) {
            bestManager.manager.addReaction(resource);
            let result = _.map(this.ingredients[resource], r => this.setupProcess(r));
            if (_.any(result, r => r == SetupProcessResult.Failed))
                return SetupProcessResult.Failed;
            else return SetupProcessResult.Reaction;
        }
        return SetupProcessResult.Failed;
    }

    private setupProcessChain(resource: string): SetupProcessResult {
        console.log('Reaction Manager: Setup process chain ' + resource);
        this.backup();
        let result = this.setupProcess(resource);
        if (result & SetupProcessResult.Failed) {
            this.restore();
            let cascadeResult = _.map(this.ingredients[resource], r => this.setupProcessChain(r));
            return (cascadeResult[0] | cascadeResult[1]);
        }
        return result;
    }

    private backup() {
        _.forEach(this.labManagers, lm => lm.backup());
    }

    private restore() {
        _.forEach(this.labManagers, lm => lm.restore());
    }

    private setup() {
        if (this.memory.setupTime == null || this.memory.setupTime + 1000 < Game.time) {
            _.forEach(this.labManagers, x => x.reset());
            this.memory.setupTime = Game.time;
            this.requiredResources = {};

            let compoundsToProduce: Array<string> = [];

            if (this.canProvide(RESOURCE_GHODIUM))
                compoundsToProduce.push(RESOURCE_GHODIUM);

            _.forEach(this.highestPowerCompounds, c => compoundsToProduce.push(c));

            


            while (compoundsToProduce.length > 0) {
                console.log();
                console.log('Reaction Manager: Compounds to produce: ' + compoundsToProduce.join(','));
                let loopCompounds = _.clone(compoundsToProduce);
                compoundsToProduce = [];
                _.forEach(loopCompounds, c => {
                    let result = this.setupProcessChain(c);
                    if (!(result & SetupProcessResult.Failed))
                        console.log('Reaction Manager: Succcessfully setup ' + c);
                    console.log('Reaction Manager ' + c+' result: '+result);
                    if (result & SetupProcessResult.Reaction) {
                        compoundsToProduce.push(c);
                    }
                });
            }
        }
    }



    public tick() {
        this.setup();
        //this.sendResourcesUsingTerminals();
    }

    private sendResourcesUsingTerminals() {
        if ((Game.time + 25) % 100 == 0) {
            console.log('reactionManager.sendResourcesUsingTerminals');
            _.forEach(_.filter(this.labManagers, x => x.imports.length > 0 && x.mainRoom && x.mainRoom.terminal), labManager => {
                console.log('reactionManager.sendResourcesUsingTerminals  LabManager: ' + labManager.mainRoom.name);
                console.log('reactionManager.sendResourcesUsingTerminals  LabManager: ' + labManager.mainRoom.name + ', imports: ' + labManager.imports.join(','));
                _.forEach(_.filter(labManager.imports, x => !labManager.mainRoom.terminal.store[x] || labManager.mainRoom.terminal.store[x] < 2000), resource => {
                    console.log('reactionManager.sendResourcesUsingTerminals  Resource: ' + resource);
                    let otherRoom = _.sortBy(_.filter(Colony.mainRooms, mainRoom => mainRoom.terminal && (mainRoom.terminal.store[resource] >= 4000 || (!mainRoom.managers.labManager || !(resource in mainRoom.managers.labManager.imports)) && mainRoom.terminal.store[resource] >= 2000)), x => labManager.mainRoom.myRoom.memory.mainRoomDistanceDescriptions[x.name])[0];
                    if (otherRoom) {
                        console.log('reactionManager.sendResourcesUsingTerminals  otherRoom: ' + otherRoom.name);
                        otherRoom.terminal.send(resource, 2000, labManager.mainRoom.name);
                    }
                });
            });
        }
    }
}