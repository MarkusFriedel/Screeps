import {Config} from "./../../config/config";

export interface ContainerInfoInterface {

    id: string;
    roomName: string;
}

export class ContainerInfo implements ContainerInfoInterface {

    id: string;
    roomName: string;

    constructor(id: string) {
        this.id = id;

        if (Memory['containers'] == null)
            Memory['containers'] = {};

        var container = <Container>Game.getObjectById(id);
        if (container != null) {
            Memory['containers'][id] = {
                id: id,
                roomName: container.room.name
            }
        }
                   
    }
}