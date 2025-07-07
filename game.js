const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gameLoopDuration = 600;
const tileSize = 54;
const gridSize = canvas.width/tileSize;
const regularTileSize = tileSize - 10;
const fullTileSize = tileSize;
const headRadius = 16;
const normalRadius = 8;

let snake = [{ x: 1, y: 1 }];
let prevSnake = [{ x: 1, y: 1 }];
let food = {};
let direction = 'right';
let score = 0;
let swallowing = -1;
let lastUpdateTime = 0;

function generateFood() {
    let foodX, foodY, onSnake;
    do {
        onSnake = false;
        foodX = Math.floor(Math.random() * gridSize);
        foodY = Math.floor(Math.random() * gridSize);
        for (const segment of snake) {
            if (segment.x === foodX && segment.y === foodY) {
                onSnake = true;
                break;
            }
        }
    } while (onSnake);
    food = { x: foodX, y: foodY };
}

function draw(progress) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const offset = (tileSize - regularTileSize) / 2;

    for (let i = 0; i < snake.length; i++) {
        const segment = snake[i];
        const prevSegment = prevSnake[i] || segment;

        let prevX = prevSegment.x;
        let prevY = prevSegment.y;

        const dx = segment.x - prevX;
        const dy = segment.y - prevY;

        if (dx > 1) prevX = gridSize;
        if (dx < -1) prevX = -1;
        if (dy > 1) prevY = gridSize;
        if (dy < -1) prevY = -1;

        const interX = prevX + (segment.x - prevX) * progress;
        const interY = prevY + (segment.y - prevY) * progress;

        const x = interX * tileSize + offset;
        const y = interY * tileSize + offset;

        if (i === 0) {
            // Head
            ctx.fillStyle = 'green';
            const isSwallowing = swallowing === 0;
            const currentSize = isSwallowing ? fullTileSize : regularTileSize;
            const currentRadius = isSwallowing ? headRadius + 2 : headRadius;
            const headOffset = (tileSize - currentSize) / 2;
            const headX = interX * tileSize + headOffset;
            const headY = interY * tileSize + headOffset;

            ctx.beginPath();
            ctx.moveTo(headX + currentRadius, headY);
            ctx.lineTo(headX + currentSize - currentRadius, headY);
            ctx.quadraticCurveTo(headX + currentSize, headY, headX + currentSize, headY + currentRadius);
            ctx.lineTo(headX + currentSize, headY + currentSize - currentRadius);
            ctx.quadraticCurveTo(headX + currentSize, headY + currentSize, headX + currentSize - currentRadius, headY + currentSize);
            ctx.lineTo(headX + currentRadius, headY + currentSize);
            ctx.quadraticCurveTo(headX, headY + currentSize, headX, headY + currentSize - currentRadius);
            ctx.lineTo(headX, headY + currentRadius);
            ctx.quadraticCurveTo(headX, headY, headX + currentRadius, headY);
            ctx.closePath();
            ctx.fill();

            // Eyes
            ctx.fillStyle = 'white';
            const eyeSize = tileSize / 6;
            const eyeOffset = tileSize / 5;

            switch (direction) {
                case 'up':
                    ctx.fillRect(headX + eyeOffset, headY + eyeOffset, eyeSize, eyeSize);
                    ctx.fillRect(headX + currentSize - eyeOffset - eyeSize, headY + eyeOffset, eyeSize, eyeSize);
                    break;
                case 'down':
                    ctx.fillRect(headX + eyeOffset, headY + currentSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                    ctx.fillRect(headX + currentSize - eyeOffset - eyeSize, headY + currentSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                    break;
                case 'left':
                    ctx.fillRect(headX + eyeOffset, headY + eyeOffset, eyeSize, eyeSize);
                    ctx.fillRect(headX + eyeOffset, headY + currentSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                    break;
                case 'right':
                    ctx.fillRect(headX + currentSize - eyeOffset - eyeSize, headY + eyeOffset, eyeSize, eyeSize);
                    ctx.fillRect(headX + currentSize - eyeOffset - eyeSize, headY + currentSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                    break;
            }
        } else if (i === snake.length - 1) {
            // Tail
            ctx.fillStyle = 'darkgreen';
            const prevSnakeSegment = snake[i - 1];
            const tailLength = regularTileSize;
            ctx.beginPath();
            if (prevSnakeSegment.x > segment.x) { // Moving right, tail points left
                ctx.moveTo(x + regularTileSize, y);
                ctx.quadraticCurveTo(x - tailLength, y + regularTileSize / 2, x + regularTileSize, y + regularTileSize);
            } else if (prevSnakeSegment.x < segment.x) { // Moving left, tail points right
                ctx.moveTo(x, y);
                ctx.quadraticCurveTo(x + regularTileSize + tailLength, y + regularTileSize / 2, x, y + regularTileSize);
            } else if (prevSnakeSegment.y > segment.y) { // Moving down, tail points up
                ctx.moveTo(x, y + regularTileSize);
                ctx.quadraticCurveTo(x + regularTileSize / 2, y - tailLength, x + regularTileSize, y + regularTileSize);
            } else { // Moving up, tail points down
                ctx.moveTo(x, y);
                ctx.quadraticCurveTo(x + regularTileSize / 2, y + regularTileSize + tailLength, x + regularTileSize, y);
            }
            ctx.closePath();
            ctx.fill();
        } else {
            // Body
            ctx.fillStyle = 'limegreen';
            if (i === swallowing) {
                const swallowOffset = (tileSize - fullTileSize) / 2;
                ctx.fillRect(interX * tileSize + swallowOffset, interY * tileSize + swallowOffset, fullTileSize, fullTileSize);
            } else {
                const radius = normalRadius;
                ctx.beginPath();
                ctx.moveTo(x + radius, y);
                ctx.lineTo(x + regularTileSize - radius, y);
                ctx.quadraticCurveTo(x + regularTileSize, y, x + regularTileSize, y + radius);
                ctx.lineTo(x + regularTileSize, y + regularTileSize - radius);
                ctx.quadraticCurveTo(x + regularTileSize, y + regularTileSize, x + regularTileSize - radius, y + regularTileSize);
                ctx.lineTo(x + radius, y + regularTileSize);
                ctx.quadraticCurveTo(x, y + regularTileSize, x, y + regularTileSize - radius);
                ctx.lineTo(x, y + radius);
                ctx.quadraticCurveTo(x, y, x + radius, y);
                ctx.closePath();
                ctx.fill();
            }
        }
    }

    ctx.font = `${regularTileSize - 4}px Arial`;
    ctx.fillText('🍌', food.x * fullTileSize, (food.y + 1) * fullTileSize);
}

function update() {
    prevSnake = JSON.parse(JSON.stringify(snake));

    if (swallowing > -1) {
        swallowing++;
        if (swallowing >= snake.length) {
            swallowing = -1;
        }
    }

    const head = { x: snake[0].x, y: snake[0].y };

    switch (direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }

    // Wrap around
    if (head.x < 0) head.x = gridSize - 1;
    if (head.x >= gridSize) head.x = 0;
    if (head.y < 0) head.y = gridSize - 1;
    if (head.y >= gridSize) head.y = 0;

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        swallowing = 0;
        generateFood();
    } else {
        snake.pop();
    }

    // Check for self-collision
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            // Reset game
            snake = [{ x: tileSize, y: tileSize }];
            direction = 'right';
            score = 0;
            swallowing = -1;
        }
    }

    document.getElementById('score').innerHTML = snake.length;
}

function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);

    const elapsed = currentTime - lastUpdateTime;
    if (elapsed < gameLoopDuration) {
        const progress = elapsed / gameLoopDuration;
        draw(progress);
        return;
    }

    lastUpdateTime = currentTime;
    update();
    draw(0);
}

const upButton = document.getElementById('up');
const downButton = document.getElementById('down');
const leftButton = document.getElementById('left');
const rightButton = document.getElementById('right');

function changeDirection(newDirection) {
    switch (newDirection) {
        case 'up':
            if (direction !== 'down') direction = 'up';
            break;
        case 'down':
            if (direction !== 'up') direction = 'down';
            break;
        case 'left':
            if (direction !== 'right') direction = 'left';
            break;
        case 'right':
            if (direction !== 'left') direction = 'right';
            break;
    }
}

upButton.addEventListener('click', () => changeDirection('up'));
downButton.addEventListener('click', () => changeDirection('down'));
leftButton.addEventListener('click', () => changeDirection('left'));
rightButton.addEventListener('click', () => changeDirection('right'));

document.addEventListener('keydown', e => {
    const btnMap = {
        'ArrowUp': 'up',
        'ArrowDown': 'down',
        'ArrowLeft': 'left',
        'ArrowRight': 'right'
    };
    const direction = btnMap[e.key];
    if (direction) {
        changeDirection(direction);
        document.getElementById(direction).classList.add('active');
    }
});

document.addEventListener('keyup', e => {
    const btnMap = {
        'ArrowUp': 'up',
        'ArrowDown': 'down',
        'ArrowLeft': 'left',
        'ArrowRight': 'right'
    };
    const direction = btnMap[e.key];
    if (direction) {
        document.getElementById(direction).classList.remove('active');
    }
});

generateFood();
requestAnimationFrame(gameLoop);
