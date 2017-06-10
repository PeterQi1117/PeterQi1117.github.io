let board = [];
let chainCapturePaths = false;
let moving = 1;

let worker = new Worker('worker.js');
let workerComplete = false;

let canvasBoard = document.getElementById('canvas-board');
let canvasPieces = document.getElementById('canvas-pieces');
let canvasPieceHeld = document.getElementById('canvas-piece-held');
let contextBoard = canvasBoard.getContext("2d");
let contextPieces = canvasPieces.getContext('2d');
let contextPieceHeld = canvasPieceHeld.getContext('2d');
let boardWidth = canvasBoard.width = canvasPieces.width = canvasPieceHeld.width = canvasBoard.scrollWidth;
let boardHeight = canvasBoard.height = canvasPieces.height = canvasPieceHeld.height = canvasBoard.scrollHeight;
let squareWidth = boardWidth / 8;
let squareHeight = boardHeight / 8;
let defaultPieceRadius = 0.38;

let animations = [];
let animationsInProgress = false;
let fillInSquare = [];

let startingPositions = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
let tempBoard = [];
let pieceHeld = 0;
let dragIndex = 0;
let dropIndex = 0;

let validMoves = [];

//let player = 1;
let EnforceTurn = true;
//let enforceRules = true;
let boardPadding = 50;
let shadowX = 0;
let shadowY = 0.5;
canvasBoard.style.padding = boardPadding.toString() + 'px';
canvasPieces.style.padding = boardPadding.toString() + 'px';
canvasPieceHeld.style.padding = boardPadding.toString() + 'px';
canvasBoard.style.boxShadow = shadowX.toString() + 'px ' + shadowY.toString() + 'px ' + '5px rgba(0,0,0,0.5)';
function drawBoard() {
    let darkSquareColor = 'rgb(45,135,90)';
    let lightSquareColor = 'rgb(225,225,222)';
    canvasBoard.style.backgroundColor = lightSquareColor;
    contextBoard.shadowColor = "transparent";
    //context.shadowOffsetX = 0;
    //context.shadowOffsetY = 0;
    for (let x = 0; x <= 7; x++) {
        for (let y = 0; y <= 7; y++) {
            if ((x + y) % 2 == 0) {
                contextBoard.fillStyle = lightSquareColor; //'rgb(210,230,212)'
            } else {
                contextBoard.fillStyle = darkSquareColor;
            }
            contextBoard.fillRect(x * squareWidth, y * squareHeight, squareWidth, squareHeight);
        }
    }
    contextBoard.strokeStyle = darkSquareColor;
    contextBoard.lineWidth = 1;
    contextBoard.strokeRect(0, 0, squareWidth * 8, squareHeight * 8)
}
function drawPiece(x, y, color, raw_coords = false, radiusMultiplier = 1, animation = false) {
    let radius = defaultPieceRadius * radiusMultiplier;
    let context;
    if (!raw_coords) {
        context = contextPieces
    } else {
        context = contextPieceHeld
    }
    //
    if (animation) {
        context = contextPieceHeld
    }
    //
    context.save();
    let elevationMultiplier = 1.08;
    context.shadowColor = 'rgba(0,0,0,0.4)';
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0.5;
    if (color > 0) {
        context.fillStyle = 'rgb(250,250,250)';
    } else if (color < 0) {
        context.fillStyle = 'rgb(188,65,55)';
    } else {
        return;
    }
    let centerX;
    let centerY;
    if (raw_coords) {
        centerX = x;
        centerY = y;
    } else {
        centerX = x * squareWidth + squareWidth * 0.5;
        centerY = y * squareHeight + squareHeight * 0.5;
        context.shadowBlur = 5
    }
    if (raw_coords && !animation) {
        radius *= elevationMultiplier;
        context.shadowBlur = 20;
    }
    context.beginPath();
    context.arc(centerX, centerY, squareWidth * radius, 0, 2 * Math.PI, false);
    context.fill();
    if (color > 1 || color < -1) {
        context.shadowColor = 'transparent';
        context.strokeStyle = 'rgb(220,215,0)';
        let sizeConstant = squareWidth * radius * 2;
        if (raw_coords && !animation) {
            sizeConstant *= elevationMultiplier;
        }
        let crownWidthHalf = sizeConstant * 0.18;
        let crownHeight = sizeConstant * 0.13;
        let crownBaseYOffset = sizeConstant * 0.06;
        let crownOuterPointX = crownWidthHalf * 1.21;
        let crownOuterPointY = crownHeight * 0.5;
        let crownAdjacentPointX = crownOuterPointX * 0.6;
        let crownAdjacentPointY = crownHeight - ((crownHeight - crownOuterPointY) / 2);
        context.beginPath();
        context.moveTo(centerX - crownWidthHalf, centerY + crownBaseYOffset);
        context.lineTo(centerX - crownOuterPointX, centerY - crownOuterPointY);
        context.quadraticCurveTo(centerX - crownOuterPointX / 1.5, centerY + crownHeight / 4,
            centerX - crownAdjacentPointX, centerY - crownAdjacentPointY);
        context.quadraticCurveTo(centerX - crownAdjacentPointX / 1.9, centerY + crownHeight / 3,
            centerX, centerY - crownHeight);
        context.quadraticCurveTo(centerX + crownAdjacentPointX / 1.9, centerY + crownHeight / 3,
            centerX + crownAdjacentPointX, centerY - crownAdjacentPointY);
        context.quadraticCurveTo(centerX + crownOuterPointX / 1.5, centerY + crownHeight / 4,
            centerX + crownOuterPointX, centerY - crownOuterPointY);
        context.lineTo(centerX + crownWidthHalf, centerY + crownBaseYOffset);
        context.quadraticCurveTo(centerX, centerY + 1.3 * crownBaseYOffset,
            centerX - crownWidthHalf, centerY + crownBaseYOffset);
        context.closePath();
        context.stroke();
    }
    context.restore();
}
function drawPieces(positionsArray) {
    for (let square = 0; square <= 31; square++) {
        if (Math.floor(square / 4) % 2 != 0) {
            drawPiece(2 * (square % 4), Math.floor(square / 4), positionsArray[square]);
        } else {
            drawPiece(2 * (square % 4) + 1, Math.floor(square / 4), positionsArray[square]);
        }
    }
}
function getMousePosition(event) {
    let rect = canvasPieceHeld.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    }
}
function squareFromPosition(x_coord, y_coord) {
    return {
        x: Math.ceil((x_coord - boardPadding) / squareWidth) - 1,
        y: Math.ceil((y_coord - boardPadding) / squareHeight) - 1
    }
}
function indexFromSquare(x, y) {
    if (y == 0) {
        return Math.floor(x / 2)
    } else if (y % 2 != 0) {
        return 4 * y - 1 + (x / 2) + 1
    } else {
        return 4 * y - 1 + Math.ceil(x / 2)
    }
}

function findIntermediary(origin, target) {
    let addNumber;
    if (Math.abs(origin - target) == 7) {
        if (Math.floor(origin / 4) % 2 == 0) {
            addNumber = 4
        } else {
            addNumber = 3
        }
    } else {
        if (Math.floor(origin / 4) % 2 == 0) {
            addNumber = 5
        } else {
            addNumber = 4
        }
    }
    if (origin < target) {
        return (origin + addNumber)
    } else {
        return (target + addNumber)
    }
}

function mouseDown(event) {
    document.removeEventListener('keydown', keyDown);
    let mousePosition = getMousePosition(event);
    let square = squareFromPosition(mousePosition.x, mousePosition.y);
    if ((square.x + square.y) % 2 != 0) {
        let index = dragIndex = indexFromSquare(square.x, square.y);
        if (board[index] != 0) {
            canvasPieceHeld.addEventListener('mousemove', mouseMove);
            document.addEventListener('mouseup', mouseUp);
            tempBoard = board.slice(0);
            tempBoard[index] = 0;
            pieceHeld = board[index];
            contextPieces.clearRect(0, 0, canvasPieces.width, canvasPieces.height);
            drawPieces(tempBoard);
            drawPiece(mousePosition.x - boardPadding, mousePosition.y - boardPadding, pieceHeld, true);
        }
    }
}
function mouseMove(event) {
    let mousePosition = getMousePosition(event);
    contextPieceHeld.clearRect(0, 0, canvasPieces.width, canvasPieces.height);
    drawPiece(mousePosition.x - boardPadding, mousePosition.y - boardPadding, pieceHeld, true);
}
function mouseUp(event) {
    canvasPieceHeld.removeEventListener('mousedown', mouseDown);
    canvasPieceHeld.removeEventListener('mousemove', mouseMove);
    canvasPieceHeld.removeEventListener('mouseup', mouseUp);
    let mousePosition = getMousePosition(event);
    let square = squareFromPosition(mousePosition.x, mousePosition.y);
    if ((square.x + square.y) % 2 != 0) {
        dropIndex = indexFromSquare(square.x, square.y);
        // post message check move validity
        if (validMoves.some(function (move) {
                return (move[0] == dragIndex && move[move.length - 1] == dropIndex)
            })
            && (!EnforceTurn || (moving * board[dragIndex] > 0))) {
            let m;
            if (Math.abs(dragIndex - dropIndex) >= 7) {
                m = [dragIndex, findIntermediary(dragIndex, dropIndex), dropIndex];
            } else {
                m = [dragIndex, dropIndex]
            }
            worker.postMessage({messageType: 'playerMove', playerMove: m});
            workerComplete = false;
            let interval = setInterval(function () { // wait for worker to update
                if (workerComplete) {
                    clearInterval(interval);
                    if (!chainCapturePaths) {
                        workerComplete = false;
                        worker.postMessage({messageType: 'requestComputerMove'});
                    }
                }
            }, 5);
        } else {
            updateCanvas();
        }
    } else {
        updateCanvas();
    }
    canvasPieceHeld.addEventListener('mousedown', mouseDown);
    document.addEventListener('keydown', keyDown);
    pieceHeld = 0;
}
function keyDown(event) {
    console.log(event.code.toString());
    if (event.code.toString() == 'ArrowLeft') {
        worker.postMessage({messageType: 'ArrowLeft'})
    } else if (event.code.toString() == 'ArrowRight') {
        worker.postMessage({messageType: 'ArrowRight'})
    } else if (event.code.toString() == 'KeyS') {
        simulationCount = 0;
        simulateGame()
    }
}

function updateCanvas() {
    contextPieces.clearRect(0, 0, canvasPieces.width, canvasPieces.height);
    contextPieceHeld.clearRect(0, 0, canvasPieces.width, canvasPieces.height);
    drawPieces(board);
}
function resetBoard() {
    board = startingPositions.slice(0);
    drawBoard();
    drawPieces(board);
}

function animateMove() {
    contextPieceHeld.clearRect(0, 0, canvasPieces.width, canvasPieces.height);
    for (let a = 0; a < animations.length; a++) {
        let animation = animations[a];
        if (animation.animationType == 'captured') {
            if (animation.animationData[2] > 0) {
                //reduce delay
                animation.animationData[2] -= 1;
                //draw piece
                let coords = animation.animationData[0];
                let piece = animation.animationData[1];
                drawPiece(coords[0], coords[1], piece, true, 1, true);
            } else {
                let size = animation.animationData[3];
                if (size > 0.1) {
                    let coords = animation.animationData[0];
                    let piece = animation.animationData[1];
                    drawPiece(coords[0], coords[1], piece, true, size, true);
                    animation.animationData[3] = Math.pow((size - 0.15), 1.1)
                } else {
                    animations.splice(a, 1)
                }
            }
        } else if (animation.animationType == 'translation') {
            if (animation.animationData.length > 0) {
                let coords = animation.animationData.shift();
                drawPiece(coords[0], coords[1], animation.animatedItem, true);
            } else {
                animations.splice(a, 1);
                tempBoard[fillInSquare[0]] = fillInSquare[1];
                contextPieces.clearRect(0, 0, canvasPieces.width, canvasPieces.height);
                drawPieces(tempBoard);
                fillInSquare = []
            }
        }
    }
    if (animations.length > 0) {
        requestAnimationFrame(animateMove)
    } else {
        updateCanvas();
        animationsInProgress = false;
    }
}

function workerMessage(event) {
    let message = event.data;
    if (message.messageType == 'playerMoveResponse') {
        board = message.board;
        chainCapturePaths = message.chainCapturePaths;
        moving = message.moving;
        if (message.capturedCoords.length == 1) {
            animations.push({animationType: 'captured', animationData: message.capturedCoords[0]});
            tempBoard = board.slice(0);
            tempBoard[message.blankSquare] = 0;
            animationsInProgress = true;
            contextPieces.clearRect(0, 0, canvasPieces.width, canvasPieces.height);
            drawPieces(tempBoard);
            animateMove();
        }
        updateCanvas();
        //workerComplete = true
    } else if (message.messageType == 'updateValidMoves') {
        validMoves = message.validMoves;
        workerComplete = true;
    } else if (message.messageType == 'computerMove') {
        let newInterval = setInterval(function () {
            if (!animationsInProgress) {
                animationsInProgress = true;
                board = message.board;
                chainCapturePaths = message.chainCapturePaths;
                moving = message.moving;
                tempBoard = board.slice(0);
                tempBoard[message.blankSquare] = 0;
                fillInSquare.push(message.blankSquare);
                fillInSquare.push(message.pieceMoved);
                animations = [];
                for (let animationData of message.capturedCoords) {
                    // animationData : [coords, piece, delay, size]
                    animations.push({animationType: 'captured', animationData: animationData});
                }
                animations.push({
                    animationType: 'translation',
                    animationData: message.translationCoord,
                    animatedItem: message.pieceMoved
                });
                contextPieces.clearRect(0, 0, canvasPieces.width, canvasPieces.height);
                drawPieces(tempBoard);
                animateMove();
                clearInterval(newInterval)
            }
        }, 20);
        //followed by updateValidMoves
    } else if (message.messageType == 'ArrowResponse') {
        board = message.board;
        chainCapturePaths = message.chainCapturePaths;
        moving = message.moving;
        updateCanvas();
    }
}

let simulationCount = 0;
function simulateGame() {
    simulationCount += 1;
    worker.postMessage({messageType: 'requestComputerMove'});
    workerComplete = false;
    let wait = setInterval(function () {
        if (workerComplete && !animationsInProgress) {
            clearInterval(wait);
            if (validMoves.length > 0 && simulationCount < 80) {
                simulateGame()
            } else if (simulationCount == 80) {
                console.log('80 moves complete')
            }
        }
    }, 50)
}

//initiate
resetBoard();
canvasPieceHeld.addEventListener('mousedown', mouseDown);
document.addEventListener('keydown', keyDown);
worker.postMessage({messageType: 'initiate', squareWidth: squareWidth, board: startingPositions});
worker.addEventListener('message', workerMessage);

/*

//
let t_one = performance.now();
let t_two = 0;
simulateGame();
let wait = setInterval(function () {
    if (simulationCount == 80) {
        t_two = performance.now();
        console.log(t_two-t_one + 'miliseconds');
        clearInterval(wait)
    }
}, 10);
//
*/
