﻿/// <reference path="../myCreep.ts" />

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

    public static staticTracer: Tracer;
    public tracer: Tracer;

    constructor(public creep: Creep, public mainRoom: MainRoomInterface) {
        super(creep);
        this.memory.autoFlee = true;

        if (MineralHarvester.staticTracer == null) {
            MineralHarvester.staticTracer = new Tracer('MineralHarvester');
            Colony.tracers.push(MineralHarvester.staticTracer);
        }
        this.tracer = MineralHarvester.staticTracer;
    }

    public myTick() {
        let trace = this.tracer.start('tick()');
        if (this.creep.spawning) {
            trace.stop();
            return;
        }

        if (this.myMineral == null) {
            this.creep.say('NoMineral');
            trace.stop();
            return;
        }

        if (this.memory.path == null) {
            this.memory.path = PathFinder.search(this.creep.pos, { pos: this.myMineral.pos, range: 6 }, { roomCallback: Colony.getTravelMatrix, plainCost: 2, swampCost: 10 });
            this.memory.path.path.unshift(this.creep.pos);
        }

        if (this.memory.path.path.length > 2)
            this.moveByPath();
        else {
            if (this.myMineral.pos.roomName != this.creep.room.name) {
                this.creep.moveTo(this.myMineral.pos);
            }
            else {
                if (this.creep.harvest(this.myMineral.mineral) == ERR_NOT_IN_RANGE)
                    this.creep.moveTo(this.myMineral.mineral);

                if (this.creep.carry[this.myMineral.resource] > this.creep.carryCapacity - _.filter(this.creep.body, b => b.type == WORK).length) {
                    let carrier = _.filter(this.mainRoom.managers.mineralHarvestingManager.carrierCreeps, c => c.memory.mineralId == this.myMineral.id && c.memory.state == MineralCarrierState.Pickup && c.pos.isNearTo(this.creep.pos))[0];
                    if (carrier)
                        this.creep.transfer(carrier, RESOURCE_ENERGY);
                    else
                        this.creep.drop(RESOURCE_ENERGY);
                }
            }

        }
        trace.stop();
    }
}