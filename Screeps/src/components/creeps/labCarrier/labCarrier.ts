class LabCarrier {

    constructor(public creep: Creep, public labManager: LabManagerInterface) {
    }

    private dropOffEnergy() {
        let myLab = _.filter(this.labManager.myLabs, lab => lab.memory.mode & LabMode.publish && lab.lab.energy <= lab.lab.energyCapacity - this.creep.carry.energy)[0];

        let dropOffStructure: Lab | Container | Storage = myLab ? myLab.lab : null;

        if (dropOffStructure == null) {
            let mainContainer = this.labManager.mainRoom.mainContainer;
            if (_.sum(mainContainer.store) <= mainContainer.storeCapacity - this.creep.carry.energy)
                dropOffStructure = mainContainer;
        }

        if (dropOffStructure) {
            if (this.creep.transfer(dropOffStructure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(dropOffStructure);
        }
        else
            this.creep.drop(RESOURCE_ENERGY);
    }

    private dropOffResource() {
        let foundTarget = false;
        //let resource =  _.keys(this.creep.carry)[0];
        //let myLab = _.filter(this.labManager.myLabs, lab => lab.memory.mode & LabMode.import && lab.memory.resource == && lab.lab.
        for (let resource in this.creep.carry) {
            if (this.creep.carry[resource] > 0) {
                let myLab = _.filter(this.labManager.myLabs, lab => lab.memory.mode & LabMode.import && lab.memory.resource == resource && lab.lab && (lab.lab.mineralType == resource || lab.lab.mineralAmount == 0) && lab.lab.mineralAmount <= lab.lab.mineralCapacity - this.creep.carry[resource])[0];
                if (myLab) {
                    if (this.creep.transfer(myLab.lab, resource) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(myLab.lab);
                    foundTarget = true;
                    break;
                }
            }
        }
        if (!foundTarget && this.labManager.mainRoom.terminal) {
            for (let resource in this.creep.carry) {
                if (this.creep.carry[resource]>0 && _.sum(this.labManager.mainRoom.terminal.store) <= this.labManager.mainRoom.terminal.storeCapacity - this.creep.carry[resource]) {
                    if (this.creep.transfer(this.labManager.mainRoom.terminal, resource) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(this.labManager.mainRoom.terminal);
                    foundTarget = true;
                    break;
                }
            }
        }
        if (!foundTarget) {
            for (let resource in this.creep.carry) {
                this.creep.drop(resource);
                break;
            }
        }
    }

    private pickUp() {
        let wrongResourceLab = _.filter(this.labManager.myLabs, lab => lab.lab && lab.memory.mode != LabMode.available && lab.lab.mineralAmount > 0 && lab.memory.resource != lab.lab.mineralType)[0];
        if (wrongResourceLab) {
            //this.creep.say('A');
            if (this.creep.withdraw(wrongResourceLab.lab, wrongResourceLab.lab.mineralType) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(wrongResourceLab.lab);
        }
        else {
            let publishLab = _.filter(this.labManager.myLabs, lab => lab.memory.mode & LabMode.publish && lab.lab && lab.lab.energy <= lab.lab.energyCapacity - this.creep.carryCapacity)[0];

            if (publishLab && this.labManager.mainRoom.mainContainer && this.labManager.mainRoom.mainContainer.store.energy >= this.labManager.mainRoom.maxSpawnEnergy * 2) {
                //this.creep.say('B');
                if (this.creep.withdraw(this.labManager.mainRoom.mainContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(this.labManager.mainRoom.mainContainer);
            }
            else {
                let outputLab = _.filter(this.labManager.myLabs, lab => lab.memory.mode & LabMode.reaction && lab.lab && (lab.lab.mineralAmount >= 1000+ this.creep.carryCapacity && !(lab.memory.mode & LabMode.publish) || lab.lab.mineralAmount - this.creep.carryCapacity >= lab.lab.mineralCapacity / 2))[0];

                if (outputLab && this.labManager.mainRoom.terminal && _.sum(this.labManager.mainRoom.terminal.store) <= this.labManager.mainRoom.terminal.storeCapacity - this.creep.carryCapacity) {
                    //this.creep.say('C');
                    if (this.creep.withdraw(outputLab.lab, outputLab.lab.mineralType) == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(outputLab.lab);

                }
                else if (this.labManager.mainRoom.terminal || this.labManager.mainRoom.mainContainer) {
                    let inputLab: MyLab = null;
                    let source: Container | Storage | Terminal = null;
                    if (this.labManager.mainRoom.terminal) {
                        inputLab = _.sortBy(_.filter(this.labManager.myLabs, lab => lab.memory.mode & LabMode.import && lab.lab && (lab.lab.mineralAmount == 0 || lab.lab.mineralType == lab.memory.resource && lab.lab.mineralAmount <= 2000 - this.creep.carryCapacity) && this.labManager.mainRoom.terminal.store[lab.memory.resource] >= this.creep.carryCapacity), x => x.lab.mineralAmount ? x.lab.mineralAmount : 0)[0];
                        source = this.labManager.mainRoom.terminal;
                    }
                    if (inputLab == null && this.labManager.mainRoom.mainContainer) {
                        inputLab = _.sortBy(_.filter(this.labManager.myLabs, lab => lab.memory.mode & LabMode.import && lab.lab && (lab.lab.mineralAmount == 0 || lab.lab.mineralType == lab.memory.resource && lab.lab.mineralAmount <= 2000 - this.creep.carryCapacity) && this.labManager.mainRoom.mainContainer.store[lab.memory.resource] >= this.creep.carryCapacity), x => x.lab.mineralAmount ? x.lab.mineralAmount : 0)[0];
                        source = this.labManager.mainRoom.mainContainer;
                    }
                    if (inputLab) {
                        //this.creep.say('D');
                        if (this.creep.withdraw(source, inputLab.memory.resource) == ERR_NOT_IN_RANGE)
                            this.creep.moveTo(source);

                    }
                }
            }


        }


    }

    public tick() {
        if (this.creep.carry.energy > 0) {
            this.dropOffEnergy();
        }
        else if (_.sum(this.creep.carry) > 0) {
            this.dropOffResource();
        }

        else
            this.pickUp();
    }
}