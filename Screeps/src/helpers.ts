export class RoomPos {
    static fromObj(obj: { x: number, y: number, roomName: string }): RoomPosition {
        return new RoomPosition(obj.x, obj.y, obj.roomName);
    }
}

