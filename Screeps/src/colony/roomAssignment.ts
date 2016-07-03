

var METRICSOURCEDISTANCE = 1;
var METRICSOURCE = 0.5;
var METRICROOM = 0.5;
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
        //console.log('MaxMetric for ' + this.mainRoom.name + ': ' + this.mainRoom.spawns.length * MAXMETRIC);
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
        let value = METRICROOM + (myRoom.useableSources.length * ((myRoom.memory.mainRoomDistanceDescriptions[this.mainRoom.name].distance * METRICSOURCEDISTANCE) + METRICSOURCE));
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

    forbidden: Array<string> = ['E15S26', 'E15S27', 'E15S28', 'E15S29', 'E11S25', 'E12S25', 'E13S25', 'E14S25', 'E15S25'];

    private assignments: { [mainRoomName: string]: RoomAssignmentInterface } = {};

    private roomsToAssign: { [roomName: string]: MyRoomInterface } = {};

    private roomFilter(myRoom: MyRoom) {
        return _.every(this.forbidden, x => x != myRoom.name) && !Game.map.isRoomProtected(myRoom.name) && myRoom.useableSources.length > 0 && !myRoom.memory.foreignOwner && !myRoom.memory.foreignReserver && _.min(myRoom.memory.mainRoomDistanceDescriptions, x => x.distance).distance <= MAXDISTANCE;
    }

    constructor(rooms: { [roomName: string]: MyRoomInterface }, public mainRooms: { [roomName: string]: MainRoomInterface }) {
        _.forEach(mainRooms, x => this.assignments[x.name] = new RoomAssignment(x));
        _.forEach(_.filter(rooms, this.roomFilter.bind(this)), x => this.roomsToAssign[x.name] = x);
    }

    private assignRoomsByMinDistance() {
        _.forEach(_.sortByAll(_.values<MyRoomInterface>(this.roomsToAssign), x => [_.min(x.memory.mainRoomDistanceDescriptions, y => y.distance).distance, (10 - x.useableSources.length)], ['asc', 'desc']), (myRoom) => {
            let possibleMainRooms = _.filter(myRoom.memory.mainRoomDistanceDescriptions, x => (x.distance <= MAXDISTANCE) && (x.distance <= 2 || x.distance == 2 && myRoom.useableSources.length >1) && this.assignments[x.roomName].canAssignRoom(myRoom));
            console.log('Room: [' + myRoom.name + '] Distances to MainRooms [' + _.map(possibleMainRooms, x => x.roomName + ' ' + x.distance).join(', ') + ']');
            //console.log('Room: [' + myRoom.name + '] Possible MainRooms [' + _.map(possibleMainRooms, x => x.roomName).join(', ') + ']');
            let sorted = _.sortBy(possibleMainRooms, x => x.distance);

            if (sorted.length == 1 || sorted.length >= 1 && sorted[0].distance < sorted[1].distance) {
                console.log('Assigning: ' + sorted[0].roomName);
                //console.log('Trying to add room [' + myRoom.name + '] to mainRoom [' + sorted[0].roomName + ']');
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
                if ((distanceDescription.distance <= 2 || distanceDescription.distance == 2 && myRoom.useableSources.length>1) && this.assignments[distanceDescription.roomName].canAssignRoom(myRoom)) {
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
        let mainRoomCandidates = this.getMainRoomCandidates();
        Memory['MainRoomCandidates'] = _.map(mainRoomCandidates, x => {
            return { mainRoom: x.mainRoom.name, myRooms: _.map(x.myRooms, y => y.name) }
        });
        while (_.size(mainRoomCandidates) > 0) {
            let candidate = _.sortByAll(_.filter(mainRoomCandidates, x => x), x => [_.size(x.myRooms), this.assignments[x.mainRoom.name].freeMetric])[0];
            let rooms = _.sortByAll(_.values<MyRoom>(candidate.myRooms), [x => 10 - _.size(x.mySources), x => x.name]);
            //console.log('TryAddRoom: '+this.roomsToAssign[candidate.myRooms[0].name]);
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
                myRooms: x.assignedRooms
            }
        }), x => x.mainRoom.name);
    }
}