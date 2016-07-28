

abstract class MyCreep {

    public get memory(): CreepMemory { return this.creep.memory; }

    private _myRoom: { time: number, myRoom: MyRoomInterface }
    public get myRoom() {
        if (this._myRoom == null || this._myRoom.time < Game.time) {
            this._myRoom = { time: Game.time, myRoom: Colony.getRoom(this.creep.room.name) }
        }
        return this._myRoom.myRoom;
    }

    public get haveToFlee() {
        let hostileCreeps = _.filter(this.myRoom.hostileScan.creeps, creep => creep.bodyInfo.totalAttackRate > 0);
        return hostileCreeps.length > 0 && _.any(hostileCreeps, c => c.bodyInfo.totalAttackRate>20 && new BodyInfo(this.creep.body).healRate < c.bodyInfo.totalAttackRate && this.creep.pos.inRangeTo(c.pos, c.bodyInfo.rangedAttackRate > 0 ? 4 : 2));
    }

    constructor(public creep: Creep) {

    }

    moveByPath(customPath: RoomPosition[] = null) {
        if (this.creep.memory.myPathMovement == null)
            this.creep.memory.myPathMovement = { movementBlockedCount: 0, lastPos: this.creep.pos };

        let path = customPath || this.memory.path.path;
        if (path.length <= 2)
            return;

        if (RoomPos.isOnEdge(path[0]) && path.length >= 3 && RoomPos.equals(path[2], this.creep.pos)) {
            path.shift();
        }

        if (RoomPos.equals(this.creep.pos, path[1]))
            path.shift();

        if (RoomPos.equals(this.creep.pos, path[0]) && this.creep.fatigue == 0) {
            if (RoomPos.equals(this.creep.memory.myPathMovement.lastPos, this.creep.pos))
                this.creep.memory.myPathMovement.movementBlockedCount++;
            else
                this.creep.memory.myPathMovement.movementBlockedCount = 0;

            if (this.creep.memory.myPathMovement.movementBlockedCount >= 3) {
                this.creep.memory.myPathMovement.movementBlockedCount = 0;
                //this.creep.say('shift');
                path.shift();
            }
            else {

                let direction = this.creep.pos.getDirectionTo(path[1].x, path[1].y);
                this.creep.move(direction);
                this.creep.memory.myPathMovement.lastPos = this.creep.pos;
                return OK;
            }
        }

        else if (!RoomPos.equals(this.creep.pos, path[0]) && this.creep.fatigue == 0) {
            this.creep.moveTo(RoomPos.fromObj(path[0]));

            if (RoomPos.equals(this.creep.memory.myPathMovement.lastPos, this.creep.pos) && !RoomPos.isOnEdge(this.creep.pos))
                path.shift();
            this.creep.memory.myPathMovement.lastPos = this.creep.pos;
        }
    }

    flee() {
        if (this.creep.spawning || _.size(this.myRoom.hostileScan.creeps) == 0)
            return;
        let path = PathFinder.search(this.creep.pos, _.map(_.filter(this.myRoom.hostileScan.creeps, c => c.bodyInfo.totalAttackRate > 0), c => {
            return {
                pos: c.pos,
                range: c.bodyInfo.rangedAttackRate > 0 ? 6 : 4
            }
        }), { flee: true, roomCallback: Colony.getCreepAvoidanceMatrix });
        path.path.unshift(this.creep.pos);
        this.moveByPath(path.path);

        if (_.sum(this.creep.carry) > 0) {
            this.creep.drop(_.first(_.filter(_.keys(this.creep.carry), x => this.creep.carry[x] > 0)));
        }

        if (this.creep.getActiveBodyparts(HEAL) > 0)
            this.creep.heal(this.creep);

    }

    public tick() {
        if (this.creep.spawning)
            return;



        if (this.myRoom.mainRoom && this.memory.requiredBoosts != null && _.size(this.memory.requiredBoosts) > 0) {
            for (let resource in this.memory.requiredBoosts) {
                this.creep.say(resource);
                let boost = this.memory.requiredBoosts[resource];

                let lab = _.filter(this.myRoom.mainRoom.managers.labManager.myLabs, l => l.memory.resource == boost.compound && l.memory.mode & LabMode.publish && l.lab.mineralType == boost.compound && l.lab.mineralAmount >= boost.amount * LAB_BOOST_MINERAL && l.lab.energy >= boost.amount * LAB_BOOST_ENERGY)[0];
                if (lab) {
                    let result = lab.lab.boostCreep(this.creep, boost.amount);
                    this.creep.say(result.toString());
                    if (result == ERR_NOT_IN_RANGE)
                        this.creep.moveTo(lab.lab);
                    else if (result == OK) {
                        delete this.memory.requiredBoosts[boost.compound];
                    }
                    break;
                }
            }


        }
        else if (this.memory.autoFlee && this.haveToFlee) {
            this.creep.say('OH NO!');
            this.flee();
        }
        else
            this.myTick();
    }

    public abstract myTick();
}