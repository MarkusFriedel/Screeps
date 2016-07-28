

var METRICSOURCEDISTANCE = 1;
var METRICSOURCE = 0.5;
var METRICROOM = 0;
var MAXMETRIC = 10;

var MAXDISTANCE = 2;

class RoomAssignment implements RoomAssignmentInterface {



    assignedRooms: Array<MyRoomInterface> = [];

    get metric() {
        let value = _.sum(this.assignedRooms, x => this.calculateMetricFor(x));// + this.calculateMetricFor(this.mainRoom.myRoom);
        //console.log('Current metric for ' + this.mainRoom.name + ': ' + value.toString());
        return value;
    }

    get maxMetric() {
        //if (this.mainRoom.room.controller.level < 4)
        //    return 8;
        ////console.log('MaxMetric for ' + this.mainRoom.name + ': ' + this.mainRoom.spawns.length * MAXMETRIC);
        //else
        return this.mainRoom.spawns.length * MAXMETRIC;
    }

    get freeMetric() {
        return this.maxMetric - this.metric;
    }

    constructor(public mainRoom: MainRoomInterface) {

    }

    public canAssignRoom(myRoom: MyRoomInterface) {
        return (!_.any(this.assignedRooms, x => x.name == myRoom.name)) && (this.metric + this.calculateMetricFor(myRoom)) <= this.maxMetric;
    }

    public tryAddRoom(myRoom: MyRoomInterface) {
        if (this.canAssignRoom(myRoom)) {
            this.assignedRooms.push(myRoom);
            return true;
        }
        else
            return false;
    }

    calculateMetricFor(myRoom: MyRoomInterface) {
        let value = METRICROOM + (_.size(myRoom.mySources) * ((myRoom.memory.mainRoomDistanceDescriptions[this.mainRoom.name].distance * METRICSOURCEDISTANCE) + METRICSOURCE));
        //if (myRoom.name == this.mainRoom.name) {
        //console.log('Metric for ' + this.mainRoom.name + '=>' + myRoom.name + ': ' + value);
        //console.log('MetricRoom: ' + METRICROOM);
        //console.log('Usable Sources: ' + _.size(myRoom.useableSources));
        //console.log(_.map(myRoom.useableSources, x => x.id).join(', '));
        //console.log('distance: ' + myRoom.memory.mainRoomDistanceDescriptions[this.mainRoom.name].distance);
        //console.log('Metric source distance: ' + METRICSOURCEDISTANCE);
        //console.log('Metric source: ' + METRICSOURCE);
        //}
        return value;
    }


}
class RoomAssignmentHandler implements RoomAssignmentHandlerInterface {

    forbidden: Array<string> = [];

    private assignments: { [mainRoomName: string]: RoomAssignmentInterface } = {};

    private roomsToAssign: { [roomName: string]: MyRoomInterface } = {};

    private roomFilter(myRoom: MyRoom) {
        return _.every(this.forbidden, x => x != myRoom.name) && !Game.map.isRoomProtected(myRoom.name) && _.size(myRoom.mySources) > 0 && !myRoom.memory.foreignOwner && !myRoom.memory.foreignReserver && _.min(myRoom.memory.mainRoomDistanceDescriptions, x => x.distance).distance <= MAXDISTANCE;
    }

    private rooms: { [roomName: string]: MyRoomInterface };
    private mainRooms: { [roomName: string]: MainRoomInterface };

    constructor() {
        this.rooms = Colony.rooms;
        this.mainRooms = Colony.mainRooms;
        _.forEach(this.mainRooms, x => this.assignments[x.name] = new RoomAssignment(x));
        _.forEach(_.filter(this.rooms, this.roomFilter.bind(this)), x => this.roomsToAssign[x.name] = x);
    }

    private assignRoomsByMinDistance() {
        let avaiableResources = RESOURCES_ALL; //_.map(Colony.mainRooms, mainRoom => mainRoom.myRoom.myMineral.resource);
        let sortedRooms = _.sortByOrder(_.values<MyRoomInterface>(this.roomsToAssign), [
            x=> _.min(x.memory.mainRoomDistanceDescriptions, y => y.distance).distance == 0 ? 0 : 1,
            x => _.min(x.memory.mainRoomDistanceDescriptions, y => y.distance).distance,
            x => x.useableSources.length,
            x=> (x.myMineral && x.myMineral.hasKeeper && avaiableResources.indexOf(x.myMineral.resource) < 0) ? 0 : 1,
            x=> _.size(x.mySources)
        ], ['asc', 'desc', 'asc', 'asc', 'desc']);

        console.log('Assigning MyRooms: ' + _.map(sortedRooms,x=>x.name).join(', '));

        _.forEach(sortedRooms, (myRoom) => {
            let possibleMainRooms = _.filter(myRoom.memory.mainRoomDistanceDescriptions, x => x.distance <= MAXDISTANCE && (myRoom.useableSources.length > 0 || Colony.mainRooms[x.roomName].room.controller.level >= 6) && this.assignments[x.roomName].canAssignRoom(myRoom));
            console.log('Room: [' + myRoom.name + '] Distances to MainRooms [' + _.map(possibleMainRooms, x => x.roomName + ' ' + x.distance).join(', ') + ']');
            console.log('Room: [' + myRoom.name + '] Possible MainRooms [' + _.map(possibleMainRooms, x => x.roomName).join(', ') + ']');
            let sorted = _.sortBy(possibleMainRooms, x => x.distance);

            if ((sorted.length == 1 || sorted.length >= 1 && sorted[0].distance < sorted[1].distance) && myRoom.memory.mainRoomDistanceDescriptions[sorted[0].roomName].distance == _.min(myRoom.memory.mainRoomDistanceDescriptions, x => x.distance).distance) {
                console.log('Assigning: ' + sorted[0].roomName);
                console.log('Trying to add room [' + myRoom.name + '] to mainRoom [' + sorted[0].roomName + ']');
                if (this.assignments[sorted[0].roomName].tryAddRoom(myRoom))
                    delete this.roomsToAssign[myRoom.name];
            }

        });
    }

    private getMainRoomCandidates() {
        let mainRoomCandidates: {
            [mainRoomName: string]: {
                mainRoom: MainRoomInterface,
                myRooms: { [myRoomName: string]: MyRoomInterface }
            }
        } = {};
        _.forEach(this.roomsToAssign, (myRoom) => {
            _.forEach(myRoom.memory.mainRoomDistanceDescriptions, (distanceDescription) => {
                if (distanceDescription.distance <= MAXDISTANCE && (Colony.mainRooms[distanceDescription.roomName].room.controller.level >= 6 || myRoom.useableSources.length > 0) && this.assignments[distanceDescription.roomName].canAssignRoom(myRoom)) {
                    if (mainRoomCandidates[distanceDescription.roomName] == null)
                        mainRoomCandidates[distanceDescription.roomName] = {
                            mainRoom: this.mainRooms[distanceDescription.roomName],
                            myRooms: {}
                        };
                    mainRoomCandidates[distanceDescription.roomName].myRooms[myRoom.name] = myRoom;
                }

            });
        });

        return mainRoomCandidates;
    }

    private assignCollisions() {
        let avaiableResources = RESOURCES_ALL; //_.map(Colony.mainRooms, mainRoom => mainRoom.myRoom.myMineral.resource);
        let mainRoomCandidates = this.getMainRoomCandidates();
        Memory['MainRoomCandidates'] = _.map(mainRoomCandidates, x => {
            return { mainRoom: x.mainRoom.name, myRooms: _.map(x.myRooms, y => y.name) }
        });
        while (_.size(mainRoomCandidates) > 0) {
            let candidate = _.sortByAll(_.filter(mainRoomCandidates, x => x), [x => _.size(x.mainRoom.connectedRooms), x => _.size(x.myRooms), x => this.assignments[x.mainRoom.name].freeMetric])[0];
            let rooms = _.sortByAll(_.values<MyRoom>(candidate.myRooms), [x => (candidate.mainRoom.room.controller.level >= 6 && x.myMineral && x.myMineral.hasKeeper && avaiableResources.indexOf(x.myMineral.resource) < 0) ? 0 : 1, x => 10 - (candidate.mainRoom.room.controller.level >= 6 ? _.size(x.mySources) : _.size(x.useableSources)), x => x.name]);
            console.log('Candidate: ' + candidate.mainRoom.name + ' Rooms: ' + _.map(rooms, x => x.name).join(', '));
            this.assignments[candidate.mainRoom.name].tryAddRoom(rooms[0]);
            delete this.roomsToAssign[rooms[0].name];
            mainRoomCandidates = this.getMainRoomCandidates();
        }
    }


    public getAssignments() {
        this.assignRoomsByMinDistance();
        this.assignCollisions();

        return _.indexBy(_.map(this.assignments, x => {
            return {
                mainRoom: x.mainRoom,
                metric: x.metric,
                myRooms: x.assignedRooms
            }
        }), x => x.mainRoom.name);
    }

    public assignRooms() {
        try {

            let assignments = this.getAssignments();

            let stringResult = _.map(assignments, x => {
                return {
                    mainRoom: x.mainRoom.name,
                    rooms: _.map(x.myRooms, y => y.name),
                    metric: x.metric
                }
            });

            console.log('Assigning Rooms');

            //_.forEach(this.rooms, (x) => x.mainRoom = null);

            //_.forEach(assignments, (assignment) => _.forEach(assignment.myRooms, (myRoom) =>myRoom.mainRoom = assignment.mainRoom));

            //_.forEach(_.filter(this.rooms, room => room.mainRoom == null && _.any(room.memory.mainRoomDistanceDescriptions, x => x.distance == 1) && !room.memory.foreignOwner && !room.memory.foreignReserver), room => {
            //    let mainRoom = this.mainRooms[_.min(room.memory.mainRoomDistanceDescriptions, x => x.distance).roomName];
            //    room.mainRoom = mainRoom;
            //});

            Memory['RoomAssignment'] = stringResult;
        }
        catch (e) {
            console.log('ERRROR: ROOMASSIGNMENT ' + e.stack);
            Memory['RoomAssignmentError'] = JSON.parse(JSON.stringify(e));
        }
    }
}