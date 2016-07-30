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

class MyCostMatrix {
    static compress(costMatrix: CostMatrix): CompressedCostMatrix {
        let serializedCostMatrix = costMatrix.serialize();
        let result: CompressedCostMatrix = { matrix: [] };

        for (let i = 0; i < serializedCostMatrix.length; i++) {
            if (serializedCostMatrix[i] != 0) {
                result.matrix.push({
                    i: i, v: serializedCostMatrix[i]
                });
            }
        }
        return result;
    }

    static decompress(compressedCostMatrix: CompressedCostMatrix): CostMatrix {
        let result: number[] = [625];

        _.fill(result, 0);

        for (let i = 0; i < compressedCostMatrix.matrix.length; i++) {
            result[compressedCostMatrix.matrix[i].i] = compressedCostMatrix.matrix[i].v;
        }

        return PathFinder.CostMatrix.deserialize(result);
    }
}

