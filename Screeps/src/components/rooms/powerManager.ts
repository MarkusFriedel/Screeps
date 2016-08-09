/// <reference path="../structures/myPowerBank.ts" />
/// <reference path="../creeps/powerHarvester/powerHarvester.ts" />

class PowerManager implements PowerManagerInterface {

    constructor(public mainRoom: MainRoomInterface) {

    }

    private _myPowerBank: { time: number, myPowerBank: MyPowerBankInterface }
    public get myPowerBank() {
        if (this._myPowerBank == null || this._myPowerBank.time < Game.time) {

        }
        return this._myPowerBank.myPowerBank;
    }

}