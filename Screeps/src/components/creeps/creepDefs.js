var creepDefs = {
    reserver: function (maxEnergy) {
        return [CLAIM, CLAIM, MOVE];

    },
    warrior: function (maxEnergy) {
        if (maxEnergy > 520)
            maxEnergy = 520;
        var basicModulesCount = ~~(maxEnergy / 130); //work,carry,move
        var attackCount = basicModulesCount * 1;
        var moveCount = basicModulesCount * 1;

        var result = [];
        for (var i = 0; i < attackCount; i++)
            result.push('attack');
        for (var i = 0; i < moveCount; i++)
            result.push('move');
        console.log('Attacks: ' + attackCount),
        console.log('Moves: ' + moveCount)
        return result;
    },
    harvester: function (maxEnergy) {
        if (maxEnergy > 550)
            return creepDefs.miner(maxEnergy);
        var basicModulesCount = ~~(maxEnergy / 200); //work,carry,move
        //if (basicModulesCount==0)
        //    return ['work','carry','carry','move','move'];

        var workCount = basicModulesCount;
        var carryCount = basicModulesCount;
        var moveCount = basicModulesCount;


        var remaining = maxEnergy - basicModulesCount * 200;

        while (remaining >= 100) {
            if (remaining >= 150) {
                carryCount++; carryCount++; moveCount++;
                remaining -= 150;
            }
            else if (remaining >= 100) {
                carryCount++; moveCount++;
                remaining -= 100;
            }
        }

        var result = [];
        for (var i = 0; i < workCount; i++)
            result.push('work');
        for (var i = 0; i < carryCount; i++)
            result.push('carry');
        for (var i = 0; i < moveCount; i++)
            result.push('move');

        return result;
    },
    repairer: function (maxEnergy) {
        var basicModulesCount = ~~(maxEnergy / 400); //work,carry,carry,move,move
        if (basicModulesCount == 0)
            return ['work', 'carry', 'carry', 'move', 'move'];
        if (basicModulesCount > 5)
            basicModulesCount = 5;

        var workCount = 2 * basicModulesCount;
        var carryCount = 2 * basicModulesCount;
        var moveCount = 2 * basicModulesCount;

        var remaining = maxEnergy - 400 * basicModulesCount;

        while (remaining >= 100) {
            if (remaining >= 150) {
                carryCount++; carryCount++; moveCount++;
                remaining -= 150;
            }
            else if (remaining >= 100) {
                carryCount++; moveCount++;
                remaining -= 100;
            }
        }

        var result = [];
        for (var i = 0; i < workCount; i++)
            result.push('work');
        for (var i = 0; i < carryCount; i++)
            result.push('carry');
        for (var i = 0; i < moveCount; i++)
            result.push('move');

        return result;
    },
    worker: function (maxEnergy) {
        /*if(maxE>900)
            var maxEnergy=900;
        else
            var maxEnergy=maxE;*/

        //var basicModulesCount = ~~(maxEnergy/200); //work,carry,carry,move,move
        //if (basicModulesCount==0)
        //    return ['work','carry','carry','move','move'];

        var workCount = 1;
        var carryCount = 1;
        var moveCount = 1;


        var remaining = maxEnergy - 200;

        while (remaining >= 100) {
            if (remaining >= 150) {
                carryCount++; carryCount++; moveCount++;
                remaining -= 150;
            }
            else if (remaining >= 100) {
                carryCount++; moveCount++;
                remaining -= 100;
            }
        }

        var result = [];
        for (var i = 0; i < workCount; i++)
            result.push('work');
        for (var i = 0; i < carryCount; i++)
            result.push('carry');
        for (var i = 0; i < moveCount; i++)
            result.push('move');

        return result;
    },
    carrier: function (maxEnergy) {
        if (Memory.roadsBuilt) {
            var basicModuleCount = ~~(maxEnergy / 150);
            //basicModuleCount= (basicModuleCount >8) ? 8 : basicModuleCount;
            var result = [];
            for (var i = 0; i < basicModuleCount; i++) {
                result.push('carry');
                result.push('carry');
                result.push('move');
            }
            return result;
        } else {
            var basicModuleCount = ~~(maxEnergy / 100);
            var result = [];
            for (var i = 0; i < basicModuleCount; i++) {
                result.push('carry');
                result.push('move');
            }
            return result;
        }
    },
    spawnFiller: function (maxEnergy) {
        if (Memory.roadsBuilt) {
            var basicModuleCount = ~~(maxEnergy / 150);
            basicModuleCount = (basicModuleCount > 8) ? 8 : basicModuleCount;
            var result = [];
            for (var i = 0; i < basicModuleCount; i++) {
                result.push('carry');
                result.push('carry');
                result.push('move');
            }
            return result;
        } else {
            var basicModuleCount = ~~(maxEnergy / 100);
            var result = [];
            for (var i = 0; i < basicModuleCount; i++) {
                result.push('carry');
                result.push('move');
            }
            return result;
        }
    },
    miner: function (maxEnergy) {

        var basicModuleCount = ~~(maxEnergy / 300);
        var workCount = basicModuleCount * 2;
        var carryCount = basicModuleCount * 1;
        var moveCount = basicModuleCount * 1;

        var remaining = maxEnergy - basicModuleCount * 300;

        while (remaining >= 100) {
            if (remaining >= 250) {
                workCount++; workCount++; moveCount++;
                remaining -= 250;
            }
            else if (remaining >= 150) {
                workCount++; moveCount++;
                remaining -= 150;
            }
            else if (remaining >= 50) {
                carryCount++;
                remaining -= 50;
            }
        }
        if (workCount > 6)
            workCount = 6;
        if (carryCount > 4)
            carryCount = 4;
        if (moveCount > Math.ceil((workCount + carryCount) / 4))
            moveCount = Math.ceil((workCount + carryCount) / 4);

        if (carryCount > 2)
            carryCount = 2;
        if (moveCount > 2)
            moveCount = 2;

        var result = [];
        for (var i = 0; i < workCount; i++)
            result.push('work');
        for (var i = 0; i < carryCount; i++)
            result.push('carry');
        for (var i = 0; i < moveCount; i++)
            result.push('move');
        return result;
    },
    upgrader: function (maxEnergy) {

        var basicModuleCount = ~~(maxEnergy / 300);
        var workCount = basicModuleCount * 2;
        var carryCount = basicModuleCount * 1;
        var moveCount = basicModuleCount * 1;

        var remaining = maxEnergy - basicModuleCount * 300;

        while (remaining >= 100) {
            if (remaining >= 300) {
                workCount++; carryCount++; carryCount++; carryCount++; moveCount++;
                remaining -= 300;
            }
            else if (remaining >= 150) {
                workCount++; moveCount++;
                remaining -= 150;
            }
            else if (remaining >= 50) {
                carryCount++;
                remaining -= 50;
            }
        }
        var result = [];
        for (var i = 0; i < workCount; i++)
            result.push('work');
        for (var i = 0; i < carryCount; i++)
            result.push('carry');
        for (var i = 0; i < moveCount; i++)
            result.push('move');
        return result;
    }
};

function placeExtensions(room) {
    var spawn = room.find(FIND_MY_SPAWNS)[0];
    if (spawn == null)
        return;

    var maxExtensions = 0;
    if (room.controller.level >= 2)
        maxExtensions += 5;
    if (room.controller.level >= 3)
        maxExtensions += 5;
    if (room.controller.level > 3)
        maxExtensions += (room.controller.level - 3) * 10;

    if (room.find(FIND_STRUCTURES, { filter: (s) =>s.structureType == STRUCTURE_EXTENSION }).length + room.find(FIND_MY_CONSTRUCTION_SITES, { filter: (s) =>s.structureType == STRUCTURE_EXTENSION }).length < maxExtensions) {

        for (var i = maxExtensions - 1; i >= 0; i--) {
            var idiv5 = ~~(i / 5);
            var x = Math.ceil(idiv5 / 2);
            if (idiv5 % 2 == 1)
                x = -x;
            x += spawn.pos.x;
            var y = spawn.pos.y + 2 + (i % 5) * 2;//-(~~(i/5)%2)

            if ((idiv5 + 3) % 4 > 1)
                y++;

            var targetPos = room.getPositionAt(x, y);
            if (targetPos.createConstructionSite(STRUCTURE_EXTENSION) == ERR_RCL_NOT_ENOUGH)
                break;
        }
    }
}

function placeHarvestContainers() {
    for (var roomName in Game.rooms) {
        //require('module.scanRoom').scanRoom(Game.rooms[roomName]);
        var roomInfo = Memory.rooms[roomName];
        if (!(roomInfo.harvest || roomInfo.mainRoom))
            continue;
        for (var sourceId in roomInfo.sources) {
            var sourceScan = roomInfo.sources[sourceId];
            if (sourceScan.containerConstructed || sourceScan.keeper)
                continue;
            var source = Game.getObjectById(sourceId);

            var path = source.pos.findPathTo(Game.spawns.Spawn1, { ignoreCreeps: true });
            var containerPosition = new RoomPosition(path[1].x, path[1].y, roomName);
            containerPosition.createConstructionSite(STRUCTURE_CONTAINER);

            sourceScan.containerConstructed = true;
        }
    }
}