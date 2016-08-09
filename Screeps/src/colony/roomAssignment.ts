

var METRICSOURCEDISTANCE = 1;
var METRICSOURCE = 0.5;
var METRICROOM = 0;
var MAXMETRIC = 9;

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
        let value = METRICROOM + (_.size(myRoom.mySources) * ((myRoom.memory.mrd[this.mainRoom.name].d * METRICSOURCEDISTANCE) + METRICSOURCE));
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

    forbidden: Array<string> = Colony.memory.forbiddenRooms || [];

    private assignments: { [mainRoomName: string]: RoomAssignmentInterface } = {};

    private roomsToAssign: { [roomName: string]: MyRoomInterface } = {};

    private roomFilter(myRoom: MyRoom) {
        return _.every(this.forbidden, x => x != myRoom.name) && (!_.any(myRoom.mySources, s => s.hasKeeper) || Colony.memory.harvestKeeperRooms) && !Game.map.isRoomProtected(myRoom.name) && _.size(myRoom.mySources) > 0 && !myRoom.memory.fO && !myRoom.memory.fR && _.min(myRoom.memory.mrd, x => x.d).d <= MAXDISTANCE;
    }

    private rooms: { [roomName: string]: MyRoomInterface };
    private mainRooms: { [roomName: string]: MainRoomInterface };

    constructor() {

        this.rooms = Colony.getAllRooms();
        this.mainRooms = Colony.mainRooms;
        _.forEach(this.mainRooms, x => this.assignments[x.name] = new RoomAssignment(x));
        _.forEach(_.filter(this.rooms, this.roomFilter.bind(this)), x => this.roomsToAssign[x.name] = x);
    }

    private assignRoomsByMinDistance() {
        let avaiableResources = RESOURCES_ALL; //_.map(Colony.mainRooms, mainRoom => mainRoom.myRoom.myMineral.resource);
        let sortedRooms = _.sortByOrder(_.values<MyRoomInterface>(this.roomsToAssign), [
            x=> _.min(x.memory.mrd, y => y.d).d == 0 ? 0 : 1,
            x => _.min(x.memory.mrd, y => y.d).d,
            x => x.useableSources.length,
            x => (x.myMineral && x.myMineral.hasExtractor && avaiableResources.indexOf(x.myMineral.resourceType) < 0) ? 0 : 1,
            x=> _.size(x.mySources)
        ], ['asc', 'asc', 'desc', 'asc', 'desc']);

        console.log('Assigning MyRooms: ' + _.map(sortedRooms,x=>x.name).join(', '));

        _.forEach(sortedRooms, (myRoom) => {
            let possibleMainRooms = _.filter(myRoom.memory.mrd, x => x.d <= MAXDISTANCE && (myRoom.useableSources.length > 0 || Colony.mainRooms[x.n].room.controller.level >= 6) && this.assignments[x.n].canAssignRoom(myRoom));
            console.log('Room: [' + myRoom.name + '] Distances to MainRooms [' + _.map(possibleMainRooms, x => x.n + ' ' + x.d).join(', ') + ']');
            console.log('Room: [' + myRoom.name + '] Possible MainRooms [' + _.map(possibleMainRooms, x => x.n).join(', ') + ']');
            let sorted = _.sortBy(possibleMainRooms, x => x.d);

            if ((sorted.length == 1 || sorted.length >= 1 && sorted[0].d < sorted[1].d) && myRoom.memory.mrd[sorted[0].n].d == _.min(myRoom.memory.mrd, x => x.d).d) {
                console.log('Assigning: ' + sorted[0].n);
                console.log('Trying to add room [' + myRoom.name + '] to mainRoom [' + sorted[0].n + ']');
                if (this.assignments[sorted[0].n].tryAddRoom(myRoom))
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
            _.forEach(myRoom.memory.mrd, (distanceDescription) => {
                if (distanceDescription.d <= MAXDISTANCE && (Colony.mainRooms[distanceDescription.n].room.controller.level >= 6 || myRoom.useableSources.length > 0) && this.assignments[distanceDescription.n].canAssignRoom(myRoom)) {
                    if (mainRoomCandidates[distanceDescription.n] == null)
                        mainRoomCandidates[distanceDescription.n] = {
                            mainRoom: this.mainRooms[distanceDescription.n],
                            myRooms: {}
                        };
                    mainRoomCandidates[distanceDescription.n].myRooms[myRoom.name] = myRoom;
                }

            });
        });

        return mainRoomCandidates;
    }

    private assignCollisions() {
        let avaiableResources = RESOURCES_ALL; //_.map(Colony.mainRooms, mainRoom => mainRoom.myRoom.myMineral.resource);
        let mainRoomCandidates = this.getMainRoomCandidates();
        myMemory['MainRoomCandidates'] = _.map(mainRoomCandidates, x => {
            return { mainRoom: x.mainRoom.name, myRooms: _.map(x.myRooms, y => y.name) }
        });
        while (_.size(mainRoomCandidates) > 0) {
            let candidate = _.sortByAll(_.filter(mainRoomCandidates, x => x), [x => _.size(x.mainRoom.connectedRooms), x => _.size(x.myRooms), x => this.assignments[x.mainRoom.name].freeMetric])[0];
            let rooms = _.sortByAll(_.values<MyRoom>(candidate.myRooms), [x => (candidate.mainRoom.room.controller.level >= 6 && x.myMineral && x.myMineral.hasKeeper && avaiableResources.indexOf(x.myMineral.resourceType) < 0) ? 0 : 1, x => 10 - (candidate.mainRoom.room.controller.level >= 6 ? _.size(x.mySources) : _.size(x.useableSources)), x => x.name]);
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

    public applySolution() {
        if (Colony.memory.roomAssignment == null) {
            console.log('No RoomAssignments found. Execute "createRoomAssignments()" to create');
            return;
        }
        _.forEach(this.rooms, (x) => x.mainRoom = null);
        _.forEach(Colony.memory.roomAssignment, (assignment) => _.forEach(_.map(assignment.rooms, r => Colony.getRoom(r)), (myRoom) => myRoom.mainRoom = Colony.mainRooms[assignment.mainRoomName]));

        console.log('RoomAssignment successfull');
    }
    
    public createSolution() {
        try {

            let assignments = this.getAssignments();

            let result = _.indexBy(_.map(assignments, a => {
                return <RoomAssignmentEntry>{
                    rooms: _.map(a.myRooms, y => y.name),
                    mainRoomName: a.mainRoom.name,
                    metric: a.metric
                }
            }), x => x.mainRoomName);

            Colony.memory.roomAssignment = result;

            console.log('Created RoomAssignmentSolution');



            

            //_.forEach(_.filter(this.rooms, room => _.size(room.mySources)>0 && (!_.any(room.mySources, s => s.hasKeeper) || Colony.memory.harvestKeeperRooms) && room.mainRoom == null && _.any(room.memory.mrd, x => x.d == 1) && !room.memory.fO && !room.memory.fR), room => {
            //    let mainRoom = this.mainRooms[_.min(room.memory.mrd, x => x.d).n];
            //    room.mainRoom = mainRoom;
            //});

            //myMemory['RoomAssignment'] = stringResult;
        }
        catch (e) {
            console.log('ERRROR: ROOMASSIGNMENT ' + e.stack);
            myMemory['RoomAssignmentError'] = JSON.parse(JSON.stringify(e));
        }
    }
}