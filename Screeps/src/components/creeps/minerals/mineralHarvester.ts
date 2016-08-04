/// <reference path="../myCreep.ts" />

class MineralHarvester extends MyCreep {
    public get memory(): MineralHarvesterMemory { return this.creep.memory; }

    _mineral: { time: number, mineral: Mineral };
    public get mineral(): Mineral {
        if (this.mineral == null || this._mineral.time < Game.time)
            this._mineral = {
                time: Game.time, mineral: Game.getObjectById<Mineral>(this.memory.mineralId)
            };
        return this._mineral.mineral;
    }

    _myMineral: { time: number, myMineral: MyMineralInterface };
    public get myMineral(): MyMineralInterface {
        if (this._myMineral == null || this._myMineral.time < Game.time)
            this._myMineral = {
                time: Game.time, myMineral: this.mainRoom.minerals[this.memory.mineralId]
            };
        return this._myMineral.myMineral;
    }


    constructor(public creep: Creep, public mainRoom: MainRoomInterface) {
        super(creep);
        this.memory.autoFlee = true;

        this.myTick = profiler.registerFN(this.myTick, 'MineralHarvester.tick');

    }

    private healed: boolean = false;

    public myTick() {
        if (this.creep.spawning) {
            return;
        }

        if (this.myMineral.amount == 0 && this.myMineral.refreshTime > Game.time + this.creep.ticksToLive) {
            this.recycle();
            return;
        }

        this.healed = false;

        if (this.creep.getActiveBodyparts(HEAL) > 0 && this.creep.hits + this.creep.getActiveBodyparts(HEAL) * HEAL_POWER <= this.creep.hitsMax) {
            this.creep.heal(this.creep);
            this.healed = true;
        }

        if (this.myMineral == null) {
            this.creep.say('NoMineral');
            return;
        }

        if (!this.creep.pos.isNearTo(this.myMineral.pos))
            this.moveTo({
                pos: this.myMineral.pos, range: 1
            }, {
                    plainCost: 2,
                    swampCost: 5,
                    roomCallback: Colony.getCustomMatrix({
                        ignoreKeeperSourceId: this.myMineral.id
                    })

                });
        else
            this.creep.harvest(this.myMineral.mineral);

    }
}