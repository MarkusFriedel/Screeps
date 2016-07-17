class MyCreep {

    constructor(public creep: Creep) {

    }

    moveByPath(pathResult: { path: RoomPosition[] }) {
        if (this.creep.memory.myPathMovement == null)
            this.creep.memory.myPathMovement = { movementBlockedCount: 0, lastPos: this.creep.pos };

        let path = pathResult.path;
        if (path.length <=2)
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
                this.creep.say('shift');
                path.shift();
            }
            else {

                let direction = this.creep.pos.getDirectionTo(path[1].x, path[1].y);
                this.creep.move(direction);
                this.creep.memory.myPathMovement.lastPos = this.creep.pos;
                return OK;
            }
        }

        else if (!RoomPos.equals(this.creep.pos, path[0]) && !RoomPos.isOnEdge(this.creep.pos) && this.creep.fatigue == 0) {
            this.creep.moveTo(RoomPos.fromObj(path[0]));

            if (RoomPos.equals(this.creep.memory.myPathMovement.lastPos, this.creep.pos))
                path.shift();
                this.creep.memory.myPathMovement.lastPos = this.creep.pos;
        }
    }
}