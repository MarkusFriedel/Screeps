class RoomPos {
    static fromObj(obj: { x: number, y: number, roomName: string }): RoomPosition {
        return new RoomPosition(obj.x, obj.y, obj.roomName);
    }
    static equals(pos1: { x: number, y: number, roomName: string }, pos2: { x: number, y: number, roomName: string }) {
        return pos1.x == pos2.x && pos1.y == pos2.y && pos1.roomName == pos2.roomName;
    }

    static isOnEdge(pos: { x: number, y: number, roomName: string }) {
        return pos.x == 0 || pos.x == 49 || pos.y == 0 || pos.y == 49;
    }
}

