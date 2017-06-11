let board = [];
let chainCapturePaths = false;
let moving = 1;

let movesTable = {pm: [], pj: [], nm: [], nj: []};
let distanceChart = [];

let pieceMoved;
let blankAnimationSquares = [];
let translationCoords = [];
let capturedCoords = [];

let squareWidth = 0;

let saves = [];
let savesCounter = 0;

function __generateCoordTables() {
    let boardSpace = [];
    for (let y = 0; y <= 7; y++) {
        if (y % 2 === 0) {
            for (let x of [1, 3, 5, 7]) {
                boardSpace.push({
                    x: x,
                    y: y
                })
            }
        } else {
            for (let x of [0, 2, 4, 6]) {
                boardSpace.push({
                    x: x,
                    y: y
                })
            }
        }
    }
    return boardSpace
}
function _generateMovesTable() {
    let coordTable = __generateCoordTables();
    for (let square = 0; square <= 31; square++) {
        let x = coordTable[square].x;
        let y = coordTable[square].y;
        let pMoves = [];
        let pJumps = [];
        if (0 <= x - 1 && x - 1 <= 7 && 0 <= y - 1 && y - 1 <= 7) {
            if (Math.floor(square / 4) % 2 === 0) {
                pMoves.push(square - 4)
            } else {
                pMoves.push(square - 5)
            }
            if (0 <= x - 2 && x - 2 <= 7 && 0 <= y - 2 && y - 2 <= 7) {
                if (Math.floor(square / 4) % 2 === 0) {
                    pJumps.push([square - 4, square - 4 - 5])
                } else {
                    pJumps.push([square - 5, square - 5 - 4])
                }
            }
        }
        if (0 <= x + 1 && x + 1 <= 7 && 0 <= y - 1 && y - 1 <= 7) {
            if (Math.floor(square / 4) % 2 === 0) {
                pMoves.push(square - 3)
            } else {
                pMoves.push(square - 4)
            }
            if (0 <= x + 2 && x + 2 <= 7 && 0 <= y - 2 && y - 2 <= 7) {
                if (Math.floor(square / 4) % 2 === 0) {
                    pJumps.push([square - 3, square - 3 - 4])
                } else {
                    pJumps.push([square - 4, square - 4 - 3])
                }
            }
        }
        movesTable.pm.push(pMoves);
        movesTable.pj.push(pJumps);
        let nMoves = [];
        let nJumps = [];
        if (0 <= x - 1 && x - 1 <= 7 && 0 <= y + 1 && y + 1 <= 7) {
            if (Math.floor(square / 4) % 2 === 0) {
                nMoves.push(square + 4)
            } else {
                nMoves.push(square + 3)
            }
            if (0 <= x - 2 && x - 2 <= 7 && 0 <= y + 2 && y + 2 <= 7) {
                if (Math.floor(square / 4) % 2 === 0) {
                    nJumps.push([square + 4, square + 4 + 3])
                } else {
                    nJumps.push([square + 3, square + 3 + 4])
                }
            }
        }
        if (0 <= x + 1 && x + 1 <= 7 && 0 <= y + 1 && y + 1 <= 7) {
            if (Math.floor(square / 4) % 2 === 0) {
                nMoves.push(square + 5)
            } else {
                nMoves.push(square + 4)
            }
            if (0 <= x + 2 && x + 2 <= 7 && 0 <= y + 2 && y + 2 <= 7) {
                if (Math.floor(square / 4) % 2 === 0) {
                    nJumps.push([square + 5, square + 5 + 4])
                } else {
                    nJumps.push([square + 4, square + 4 + 5])
                }
            }
        }
        movesTable.nm.push(nMoves);
        movesTable.nj.push(nJumps);
    }
}
function _generateDistanceChart() {
    let diagonalPositionArray = [];
    for (let n of [30, 40, 41, 51, 52, 62, 63, 73]) {
        let holder = [];
        holder.push(n.toString());
        holder.push((n - 9).toString());
        holder.push((n - 18).toString());
        holder.push((n - 27).toString());
        for (let s of holder) {
            if (s === '3') {
                s = '03'
            }
            diagonalPositionArray.push([s[0], s[1]])
        }
    }
    for (let indexA = 0; indexA <= 31; indexA++) {
        let innerArray = [];
        for (let indexB = 0; indexB <= 31; indexB++) {
            innerArray.push((Math.abs(diagonalPositionArray[indexA][0] - diagonalPositionArray[indexB][0]) +
            Math.abs(diagonalPositionArray[indexA][1] - diagonalPositionArray[indexB][1])))
        }
        distanceChart.push(innerArray)
    }
}
function _determineMoveValidity(origin, adjacent, capture = -1, chainCheck = true, b = board) {
    if (chainCheck) {
        if (capture === -1) {
            return (!chainCapturePaths && b[adjacent] === 0);
        } else {
            return (b[capture] === 0
            && b[origin] * b[adjacent] < 0
            && (!chainCapturePaths || chainCapturePaths.some(function (path) {
                return capture === path[1]
            })))
        }
    } else {
        return (b[capture] === 0
        && b[origin] * b[adjacent] < 0)
    }
}
function _king(index, piece) {
    if ((index <= 3 && piece === 1) || (index >= 28 && piece === -1)) {
        board[index] = board[index] * kingWeight;
        return true
    } else {
        return false
    }
}
function _findCapturesFromIndex(index) {
    let piece = board[index];
    let searchIn;
    if (piece === 1) {
        searchIn = movesTable.pj[index].slice(0)
    } else if (piece === -1) {
        searchIn = movesTable.nj[index].slice(0)
    } else {
        searchIn = movesTable.pj[index].slice(0);
        searchIn = searchIn.concat(movesTable.nj[index])
    }
    return searchIn.filter(function (path) {
        return _determineMoveValidity(index, path[0], path[1], false) === true
    });
}
function findAllMoves(b = board) {
    let captures;
    let moves;
    let validCaptures = [];
    let validMoves = [];
    if (moving > 0) {
        captures = movesTable.pj.slice(0);
        moves = movesTable.pm.slice(0);
    } else {
        captures = movesTable.nj.slice(0);
        moves = movesTable.nm.slice(0);
    }
    for (let index = 0; index <= 31; index++) {
        if (moving * b[index] > 0) {
            if (b[index] === 1 || b[index] === -1) {
                for (let capture of captures[index]) {
                    if (_determineMoveValidity(index, capture[0], capture[1], true)) {
                        validCaptures.push([index, capture[0], capture[1]])
                    }
                }
            } else {
                for (let capture of movesTable.pj.slice(0)[index].concat(movesTable.nj.slice(0)[index])) {
                    if (_determineMoveValidity(index, capture[0], capture[1], true)) {
                        validCaptures.push([index, capture[0], capture[1]])
                    }
                }
            }
            if (validCaptures.length === 0) {
                if (b[index] === 1 || b[index] === -1) {
                    for (let move of moves[index]) {
                        if (_determineMoveValidity(index, move, -1, true)) {
                            validMoves.push([index, move])
                        }
                    }
                } else {
                    for (let move of movesTable.pm.slice(0)[index].concat(movesTable.nm.slice(0)[index])) {
                        if (_determineMoveValidity(index, move, -1, true)) {
                            validMoves.push([index, move])
                        }
                    }
                }
            }
        }
    }
    if (validCaptures.length === 0) {
        return validMoves
    } else {
        return validCaptures
    }
}
function sumDistances(b = board) {
    let sum = 0;
    for (let index = 0; index <= 31; index++) {
        if (b[index] !== 0) {
            for (let indexB = 0; indexB <= 31; indexB++) {
                if (b[index] * b[indexB] < -kingWeight) {
                    sum += 2 * (distanceChart[index][indexB])
                } else if (b[index] * b[indexB] < 0) {
                    sum += (distanceChart[index][indexB])
                }
            }
        }
    }
    return sum
}
function evaluate(b = board) {
    //sum pieces
    let sum = 1000 * b.reduce(function (sum, piece) {
            return sum + piece
        }, 0);
    //sum distances between opposing pieces
    if (sum < 0) {
        sum += sumDistances() / 10000
    } else if (sum > 0) {
        sum -= sumDistances() / 10000
    }
    //detect forward progress
    for (let index = 0; index <= 3; index++) {
        if (Math.abs(b[index]) === 1) {
            sum -= 6 * b[index]
        }
    }
    for (let index = 4; index <= 7; index++) {
        if (Math.abs(b[index]) === 1) {
            sum += 5 * b[index]
        }
    }
    for (let index = 8; index <= 11; index++) {
        if (Math.abs(b[index]) === 1) {
            sum += 3 * b[index]
        }
    }
    for (let index = 12; index <= 15; index++) {
        if (Math.abs(b[index]) === 1) {
            sum += 1 * b[index]
        }
    }
    for (let index = 16; index <= 19; index++) {
        if (Math.abs(b[index]) === 1) {
            sum -= 1 * b[index]
        }
    }
    for (let index = 20; index <= 23; index++) {
        if (Math.abs(b[index]) === 1) {
            sum -= 3 * b[index]
        }
    }
    for (let index = 24; index <= 27; index++) {
        if (Math.abs(b[index]) === 1) {
            sum -= 5 * b[index]
        }
    }
    for (let index = 28; index <= 31; index++) {
        if (Math.abs(b[index]) === 1) {
            sum -= 6
        }
    }
    return sum;
}
let kingWeight = 1.9;
let depth = 5;
function miniMax(moveSet, d = (depth + 1)) {
    d -= 1;
    let results = [];
    for (let m of moveSet) {
        //save board
        let storedState = storeState();
        implementMove(m);
        let allMoves = findAllMoves();
        //check for no moves
        if (allMoves.length !== 0) {
            //recurse
            if (d > 0) {
                results.push(miniMax(allMoves, d));
            }
            else {
                results.push(evaluate());
            }
        } else {
            //terminal node
            if (board.some(function (square) {
                    return (moving * square > 0)
                })
                && board.some(function (square) {
                    return (moving * square < 0)
                })) {
                results.push(0);
            } else {
                results.push(10 * evaluate())
            }
        }
        //restore board
        restoreState(storedState);
    }
    if (d === depth) {
        if (moving > 0) {
            return results.indexOf(Math.max(...results));
        } else {
            return results.indexOf(Math.min(...results));
        }
    } else {
        if (moving > 0) {
            return Math.max(...results);
        } else {
            return Math.min(...results);
        }
    }
}
function implementMove(m) {
    let piece = board[m[0]];
    board[m[0]] = 0;
    if (m.length === 3) {
        board[m[1]] = 0;
        board[m[2]] = piece;
        if (_king(m[2], piece)) {
            moving = -moving;
            chainCapturePaths = false;
        } else {
            let potentialCaptures = _findCapturesFromIndex(m[2]);
            if (potentialCaptures.length === 0) {
                moving = -moving;
                chainCapturePaths = false;
            } else {
                chainCapturePaths = potentialCaptures;
            }
        }
    } else {
        board[m[1]] = piece;
        _king(m[1], piece);
        moving = -moving;
        chainCapturePaths = false;
    }
}

function storeState() {
    if (chainCapturePaths) {
        return [board.slice(0), chainCapturePaths.slice(0), moving]
    } else {
        return [board.slice(0), false, moving]
    }
}
function restoreState(state) {
    board = state[0].slice(0);
    if (state[1]) {
        chainCapturePaths = state[1];
    } else {
        chainCapturePaths = false
    }
    moving = state[2];
}

_generateMovesTable();
_generateDistanceChart();

function coordsFromIndex(index) {
    let gridPosition;
    if (Math.floor(index / 4) % 2 !== 0) {
        gridPosition = [2 * (index % 4), Math.floor(index / 4)];
    } else {
        gridPosition = [2 * (index % 4) + 1, Math.floor(index / 4)];
    }
    return [gridPosition[0] * squareWidth + squareWidth / 2, gridPosition[1] * squareWidth + squareWidth / 2]
}
function move() {
    let allMoves = findAllMoves();
    let moveFound = allMoves[miniMax(allMoves)];
    pieceMoved = board[moveFound[0]];
    blankAnimationSquares.push(moveFound[moveFound.length - 1]);
    if (moveFound.length === 2) {
        translationCoords.push([coordsFromIndex(moveFound[0]), coordsFromIndex(moveFound[1])]);
    } else {
        translationCoords.push([coordsFromIndex(moveFound[0]), coordsFromIndex(moveFound[2])]);
        capturedCoords.push([coordsFromIndex(moveFound[1]), board[moveFound[1]]])
    }
    implementMove(moveFound);
    if (chainCapturePaths !== false) {
        move()
    }
}

function prepareCaptureAnimation() {
    //call after prepare translation
    let translationLength = translationCoords.length;
    for (let item of capturedCoords) {
        item.push(translationLength);
        item.push(1)
    }
}

function prepareTranslationAnimation() {
    let resultCoordArray = [];
    //
    let secondsPerMove = (1 / 6);
    let framesPerMove = 60 * secondsPerMove;
    let totalFrames = translationCoords.length * framesPerMove;
    let translationDistancePerMove = Math.abs(translationCoords[0][0][0] - translationCoords[0][1][0]); //single dimension
    let totalTranslationDistance = translationDistancePerMove * translationCoords.length;
    let averageDistancePerFrame = totalTranslationDistance / totalFrames; // single-dimension
    //
    let destinationCoords = [];
    for (let coordSet of translationCoords) {
        destinationCoords.push(coordSet[0])
    }
    destinationCoords.push(translationCoords[translationCoords.length - 1][1]);
    //
    //let startingCoord = destinationCoords[0];
    for (let coord = 0; coord < destinationCoords.length - 1; coord++) {
        let dx;
        let dy;
        if (destinationCoords[coord][0] < destinationCoords[coord + 1][0]) {
            dx = averageDistancePerFrame;
        } else {
            dx = -averageDistancePerFrame;
        }
        if (destinationCoords[coord][1] < destinationCoords[coord + 1][1]) {
            dy = averageDistancePerFrame;
        } else {
            dy = -averageDistancePerFrame;
        }
        let remainingDistance = translationDistancePerMove;
        resultCoordArray.push(destinationCoords[coord]);
        while (remainingDistance > 0) {
            remainingDistance -= Math.abs(dx);
            let lastCoords = resultCoordArray[resultCoordArray.length - 1].slice(0);
            resultCoordArray.push([lastCoords[0] + dx, lastCoords[1] + dy])
        }
    }
    return resultCoordArray
}

onmessage = function (event) {
    let message = event.data;
    //this.postMessage(message);
    if (message.messageType === 'initiate') {
        board = message.board;
        squareWidth = message.squareWidth;
        saves.push(storeState());
        this.postMessage({messageType: 'updateValidMoves', validMoves: findAllMoves()});
    } else if (message.messageType === 'playerMove') {

        if (message.playerMove.length === 3) {
            capturedCoords.push([coordsFromIndex(message.playerMove[1]), board[message.playerMove[1]]]);
            prepareCaptureAnimation();
        }
        implementMove(message.playerMove);
        this.postMessage({
            messageType: 'playerMoveResponse',
            board: board,
            chainCapturePaths: chainCapturePaths,
            moving: moving,
            capturedCoords: capturedCoords,
            blankSquare: message.playerMove[1],
        });
        this.postMessage({messageType: 'updateValidMoves', validMoves: findAllMoves()});
    } else if (message.messageType === 'requestComputerMove') {
        move();
        translationCoords = prepareTranslationAnimation();
        prepareCaptureAnimation();
        let blankSquare = blankAnimationSquares[blankAnimationSquares.length - 1];
        //
        saves.splice(savesCounter + 1, saves.length - savesCounter + 1, storeState());
        savesCounter += 1;
        //
        this.postMessage({
            messageType: 'computerMove',
            board: board,
            chainCapturePaths: chainCapturePaths,
            moving: moving,
            blankSquare: blankSquare,
            translationCoord: translationCoords,
            capturedCoords: capturedCoords,
            pieceMoved: pieceMoved
        });
        this.postMessage({messageType: 'updateValidMoves', validMoves: findAllMoves()});
    } else if (message.messageType === 'ArrowLeft') {
        if (savesCounter > 0) {
            savesCounter -= 1;
            restoreState(saves[savesCounter]);
            this.postMessage({
                messageType: 'ArrowResponse',
                board: board,
                chainCapturePaths: chainCapturePaths,
                moving: moving
            });
            this.postMessage({messageType: 'updateValidMoves', validMoves: findAllMoves()});
        }
    } else if (message.messageType === 'ArrowRight') {
        if (savesCounter + 1 < saves.length) {
            savesCounter += 1;
            restoreState(saves[savesCounter]);
            this.postMessage({
                messageType: 'ArrowResponse',
                board: board,
                chainCapturePaths: chainCapturePaths,
                moving: moving
            });
            this.postMessage({messageType: 'updateValidMoves', validMoves: findAllMoves()});
        }
    }
    blankAnimationSquares = [];
    translationCoords = [];
    capturedCoords = [];
};
