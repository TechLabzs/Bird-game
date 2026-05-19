// ==================== GAME CONFIGURATION ====================
const CANVAS = document.getElementById('gameCanvas');
const CTX = CANVAS.getContext('2d');

// Level configurations
const LEVEL_CONFIGS = {
    1: { speed: 2.5, minGap: 140, maxGap: 180, gravity: 0.5, obstacleCount: 5, platformY: 700 },
    2: { speed: 3.2, minGap: 130, maxGap: 170, gravity: 0.55, obstacleCount: 6, platformY: 680 },
    3: { speed: 3.9, minGap: 120, maxGap: 160, gravity: 0.6, obstacleCount: 7, platformY: 660 },
    4: { speed: 4.6, minGap: 110, maxGap: 150, gravity: 0.65, obstacleCount: 8, platformY: 640 },
    5: { speed: 5.3, minGap: 100, maxGap: 140, gravity: 0.7, obstacleCount: 9, platformY: 620 }
};

// Game state
const GAME = {
    width: CANVAS.offsetWidth || 600,
    height: CANVAS.offsetHeight || 800,
    isRunning: false,
    gameActive: false,
    score: 0,
    bestScore: localStorage.getItem('bestScore') || 0,
    currentLevel: 1,
    levelConfig: LEVEL_CONFIGS[1]
};

// Set canvas size
CANVAS.width = GAME.width;
CANVAS.height = GAME.height;

// Player object
const PLAYER = {
    x: GAME.width / 2 - 20,
    y: GAME.height - 150,
    width: 40,
    height: 40,
    velocityY: 0,
    gravity: 0.5,
    jumpPower: -12,
    color: '#FFD700',
    eyeColor: '#333',
    isJumping: false,
    isOnPlatform: false
};

// Platform object
const PLATFORM = {
    x: GAME.width / 2 - 60,
    y: 700,
    width: 120,
    height: 15,
    color: '#00CC00'
};

// Obstacles array
let obstacles = [];
const OBSTACLE_CONFIG = {
    width: 80,
    spacing: 300,
    color: '#FF4444'
};

// Particle system
let particles = [];

// ==================== PARTICLE SYSTEM ====================
class Particle {
    constructor(x, y, vx, vy, color, life = 30) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = 5;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.3;
        this.life--;
    }

    draw() {
        const alpha = this.life / this.maxLife;
        CTX.save();
        CTX.globalAlpha = alpha;
        CTX.fillStyle = this.color;
        CTX.beginPath();
        CTX.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        CTX.fill();
        CTX.restore();
    }
}

function createParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = 4 + Math.random() * 3;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        particles.push(new Particle(x, y, vx, vy, color, 40));
    }
}

// ==================== OBSTACLE MANAGEMENT ====================
function generateObstacle(startX) {
    const minGap = GAME.levelConfig.minGap;
    const maxGap = GAME.levelConfig.maxGap;
    const gapSize = minGap + Math.random() * (maxGap - minGap);
    const topHeight = Math.random() * (GAME.height - gapSize - 120) + 80;
    const bottomY = topHeight + gapSize;

    return {
        x: startX,
        topHeight: topHeight,
        bottomY: bottomY,
        gapSize: gapSize,
        passed: false,
        rotation: 0
    };
}

function initializeObstacles() {
    obstacles = [];
    for (let i = 0; i < GAME.levelConfig.obstacleCount; i++) {
        obstacles.push(generateObstacle(GAME.width + i * OBSTACLE_CONFIG.spacing));
    }
}

// ==================== INPUT HANDLING ====================
function handleJump(e) {
    if (!GAME.gameActive) return;
    if (!GAME.isRunning && !PLAYER.isOnPlatform) return;
    
    if (e.type.includes('touch')) {
        e.preventDefault();
    }

    PLAYER.velocityY = PLAYER.jumpPower;
    PLAYER.isJumping = true;
    PLAYER.isOnPlatform = false;
    createParticles(PLAYER.x + PLAYER.width / 2, PLAYER.y + PLAYER.height, '#FFD700', 12);
    
    GAME.isRunning = true;
    
    if (navigator.vibrate) {
        navigator.vibrate(20);
    }
}

document.addEventListener('click', handleJump);
document.addEventListener('touchstart', handleJump);

// ==================== DRAWING FUNCTIONS ====================
function drawBackground() {
    const gradient = CTX.createLinearGradient(0, 0, 0, GAME.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    CTX.fillStyle = gradient;
    CTX.fillRect(0, 0, GAME.width, GAME.height);

    const time = Date.now() * 0.0001;
    drawCloud(100 + Math.sin(time) * 50, 80, 50);
    drawCloud(GAME.width - 150 + Math.cos(time * 0.7) * 40, 120, 40);
    drawCloud(GAME.width / 2 + Math.sin(time * 0.5) * 60, 60, 45);
}

function drawCloud(x, y, size) {
    CTX.fillStyle = 'rgba(255, 255, 255, 0.7)';
    CTX.beginPath();
    CTX.arc(x - size, y, size * 0.6, 0, Math.PI * 2);
    CTX.fill();
    CTX.beginPath();
    CTX.arc(x, y - size * 0.3, size * 0.8, 0, Math.PI * 2);
    CTX.fill();
    CTX.beginPath();
    CTX.arc(x + size, y, size * 0.6, 0, Math.PI * 2);
    CTX.fill();
}

function drawGround() {
    CTX.fillStyle = '#00AA00';
    CTX.fillRect(0, GAME.height - 40, GAME.width, 40);

    CTX.fillStyle = 'rgba(0, 150, 0, 0.5)';
    for (let i = 0; i < GAME.width; i += 30) {
        CTX.fillRect(i, GAME.height - 40, 15, 40);
    }
}

function drawPlatform() {
    const gradient = CTX.createLinearGradient(PLATFORM.x, PLATFORM.y, PLATFORM.x, PLATFORM.y + PLATFORM.height);
    gradient.addColorStop(0, '#00FF00');
    gradient.addColorStop(1, '#009900');
    
    CTX.fillStyle = gradient;
    CTX.fillRect(PLATFORM.x, PLATFORM.y, PLATFORM.width, PLATFORM.height);
    
    CTX.strokeStyle = '#008800';
    CTX.lineWidth = 2;
    CTX.strokeRect(PLATFORM.x, PLATFORM.y, PLATFORM.width, PLATFORM.height);
}

function drawPlayer() {
    const x = PLAYER.x;
    const y = PLAYER.y;

    CTX.fillStyle = 'rgba(0, 0, 0, 0.1)';
    CTX.beginPath();
    CTX.ellipse(x + PLAYER.width / 2, GAME.height - 35, 25, 8, 0, 0, Math.PI * 2);
    CTX.fill();

    const bodyGradient = CTX.createRadialGradient(x + 10, y + 10, 5, x + 20, y + 20, 30);
    bodyGradient.addColorStop(0, '#FFFF99');
    bodyGradient.addColorStop(1, '#FFD700');
    CTX.fillStyle = bodyGradient;
    CTX.beginPath();
    CTX.arc(x + PLAYER.width / 2, y + PLAYER.height / 2, PLAYER.width / 2, 0, Math.PI * 2);
    CTX.fill();

    CTX.strokeStyle = '#FFA500';
    CTX.lineWidth = 2;
    CTX.stroke();

    CTX.fillStyle = 'white';
    CTX.beginPath();
    CTX.arc(x + 12, y + 12, 6, 0, Math.PI * 2);
    CTX.fill();

    CTX.fillStyle = PLAYER.eyeColor;
    CTX.beginPath();
    CTX.arc(x + 13, y + 13, 3, 0, Math.PI * 2);
    CTX.fill();

    CTX.fillStyle = 'white';
    CTX.beginPath();
    CTX.arc(x + 28, y + 12, 6, 0, Math.PI * 2);
    CTX.fill();

    CTX.fillStyle = PLAYER.eyeColor;
    CTX.beginPath();
    CTX.arc(x + 29, y + 13, 3, 0, Math.PI * 2);
    CTX.fill();

    CTX.strokeStyle = PLAYER.eyeColor;
    CTX.lineWidth = 2;
    CTX.beginPath();
    CTX.arc(x + PLAYER.width / 2, y + 28, 5, 0, Math.PI);
    CTX.stroke();
}

function drawObstacles() {
    obstacles.forEach((obstacle) => {
        const x = obstacle.x;

        const topGradient = CTX.createLinearGradient(x, 0, x + OBSTACLE_CONFIG.width, 0);
        topGradient.addColorStop(0, '#FF6666');
        topGradient.addColorStop(0.5, '#FF4444');
        topGradient.addColorStop(1, '#FF2222');

        CTX.save();
        CTX.translate(x + OBSTACLE_CONFIG.width / 2, obstacle.topHeight / 2);
        CTX.rotate(obstacle.rotation);
        CTX.fillStyle = topGradient;
        CTX.fillRect(-OBSTACLE_CONFIG.width / 2, -obstacle.topHeight / 2, 
                     OBSTACLE_CONFIG.width, obstacle.topHeight);
        CTX.restore();

        CTX.save();
        CTX.translate(x + OBSTACLE_CONFIG.width / 2, obstacle.bottomY + (GAME.height - obstacle.bottomY) / 2);
        CTX.rotate(obstacle.rotation);
        CTX.fillStyle = topGradient;
        CTX.fillRect(-OBSTACLE_CONFIG.width / 2, -(GAME.height - obstacle.bottomY) / 2, 
                     OBSTACLE_CONFIG.width, GAME.height - obstacle.bottomY);
        CTX.restore();

        drawSpikes(x, obstacle.topHeight - 15, OBSTACLE_CONFIG.width, 15, false);
        drawSpikes(x, obstacle.bottomY, OBSTACLE_CONFIG.width, 15, true);
    });
}

function drawSpikes(x, y, width, height, isDown) {
    CTX.fillStyle = isDown ? '#DD0000' : '#FF7777';
    for (let i = 0; i < 8; i++) {
        const spikeX = x + (width / 8) * i + width / 16;
        CTX.beginPath();
        if (isDown) {
            CTX.moveTo(spikeX - 5, y);
            CTX.lineTo(spikeX, y + height);
            CTX.lineTo(spikeX + 5, y);
        } else {
            CTX.moveTo(spikeX - 5, y + height);
            CTX.lineTo(spikeX, y);
            CTX.lineTo(spikeX + 5, y + height);
        }
        CTX.fill();
    }
}

// ==================== UPDATE FUNCTIONS ====================
function updatePlayer() {
    PLAYER.velocityY += PLAYER.gravity;
    PLAYER.y += PLAYER.velocityY;

    if (PLAYER.isJumping && PLAYER.velocityY > 0) {
        PLAYER.isJumping = false;
    }

    // Platform collision
    if (!GAME.isRunning && PLAYER.velocityY >= 0 &&
        PLAYER.y + PLAYER.height >= PLATFORM.y &&
        PLAYER.y + PLAYER.height <= PLATFORM.y + PLATFORM.height + 5 &&
        PLAYER.x + PLAYER.width > PLATFORM.x &&
        PLAYER.x < PLATFORM.x + PLATFORM.width) {
        PLAYER.y = PLATFORM.y - PLAYER.height;
        PLAYER.velocityY = 0;
        PLAYER.isOnPlatform = true;
    }

    // Ground collision
    if (PLAYER.y + PLAYER.height >= GAME.height - 40) {
        endLevel();
    }

    // Ceiling collision
    if (PLAYER.y <= 0) {
        PLAYER.y = 0;
        PLAYER.velocityY = 0;
    }
}

function updateObstacles() {
    obstacles.forEach((obstacle) => {
        obstacle.x -= GAME.levelConfig.speed;
        obstacle.rotation += 0.01;

        if (obstacle.x + OBSTACLE_CONFIG.width < 0) {
            const lastObstacle = obstacles[obstacles.length - 1];
            const newObstacle = generateObstacle(lastObstacle.x + OBSTACLE_CONFIG.spacing);
            obstacles.shift();
            obstacles.push(newObstacle);
        }

        if (!obstacle.passed && obstacle.x + OBSTACLE_CONFIG.width < PLAYER.x) {
            obstacle.passed = true;
            GAME.score++;
            updateScore();
            createParticles(GAME.width / 2, 50, '#00FF00', 15);
            
            if (navigator.vibrate) {
                navigator.vibrate([50, 30, 50]);
            }
        }
    });
}

function updateParticles() {
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => p.update());
}

function checkCollisions() {
    obstacles.forEach((obstacle) => {
        const playerLeft = PLAYER.x;
        const playerRight = PLAYER.x + PLAYER.width;
        const playerTop = PLAYER.y;
        const playerBottom = PLAYER.y + PLAYER.height;

        const obstacleLeft = obstacle.x;
        const obstacleRight = obstacle.x + OBSTACLE_CONFIG.width;

        if (playerRight > obstacleLeft && playerLeft < obstacleRight) {
            if (playerTop < obstacle.topHeight) {
                createParticles(PLAYER.x + PLAYER.width / 2, PLAYER.y, '#FF4444', 20);
                endLevel();
            }

            if (playerBottom > obstacle.bottomY) {
                createParticles(PLAYER.x + PLAYER.width / 2, PLAYER.y + PLAYER.height, '#FF4444', 20);
                endLevel();
            }
        }
    });
}

// ==================== GAME STATE FUNCTIONS ====================
function updateScore() {
    document.getElementById('scoreValue').textContent = GAME.score;
}

function endLevel() {
    GAME.isRunning = false;
    
    if (GAME.score > GAME.bestScore) {
        GAME.bestScore = GAME.score;
        localStorage.setItem('bestScore', GAME.bestScore);
    }

    document.getElementById('finalLevel').textContent = GAME.currentLevel;
    document.getElementById('finalScore').textContent = GAME.score;
    document.getElementById('gameOver').style.display = 'block';

    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 200]);
    }
}

function updateBestScore() {
    document.getElementById('bestValue').textContent = GAME.bestScore;
}

// Global functions for menu
window.nextLevel = function() {
    if (GAME.currentLevel < 5) {
        GAME.currentLevel++;
    } else {
        GAME.currentLevel = 1;
    }
    startNewLevel();
};

window.goToMenu = function() {
    location.reload();
};

function startNewLevel() {
    GAME.levelConfig = LEVEL_CONFIGS[GAME.currentLevel];
    PLAYER.gravity = GAME.levelConfig.gravity;
    PLATFORM.y = GAME.levelConfig.platformY;
    
    GAME.score = 0;
    GAME.isRunning = false;
    PLAYER.x = GAME.width / 2 - 20;
    PLAYER.y = GAME.height - 150;
    PLAYER.velocityY = 0;
    PLAYER.isOnPlatform = true;
    
    obstacles = [];
    particles = [];
    
    initializeObstacles();
    updateScore();
    document.getElementById('levelValue').textContent = GAME.currentLevel;
    document.getElementById('gameOver').style.display = 'none';
}

function startGame() {
    document.getElementById('mainMenu').style.display = 'none';
    GAME.gameActive = true;
    startNewLevel();
}

// ==================== MAIN GAME LOOP ====================
function gameLoop() {
    drawBackground();
    drawGround();
    drawPlatform();

    if (GAME.gameActive) {
        updatePlayer();
        if (GAME.isRunning) {
            updateObstacles();
            checkCollisions();
        }
    }

    updateParticles();

    drawObstacles();
    drawPlayer();

    particles.forEach(p => p.draw());

    requestAnimationFrame(gameLoop);
}

// ==================== INITIALIZATION ====================
function init() {
    window.addEventListener('resize', () => {
        GAME.width = CANVAS.offsetWidth || 600;
        GAME.height = CANVAS.offsetHeight || 800;
        CANVAS.width = GAME.width;
        CANVAS.height = GAME.height;
    });

    updateBestScore();
    document.getElementById('startButton').addEventListener('click', startGame);
    gameLoop();
}

init();
