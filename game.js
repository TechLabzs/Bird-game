// ==================== GAME CONFIGURATION ====================
const CANVAS = document.getElementById('gameCanvas');
const CTX = CANVAS.getContext('2d');

// Level configurations
const LEVEL_CONFIGS = {
    1: { speed: 3, minGap: 80, maxGap: 100, gravity: 0.8, platformY: 650 },
    2: { speed: 3.5, minGap: 70, maxGap: 90, gravity: 0.85, platformY: 650 },
    3: { speed: 4, minGap: 60, maxGap: 80, gravity: 0.9, platformY: 650 },
    4: { speed: 4.5, minGap: 50, maxGap: 70, gravity: 0.95, platformY: 650 },
    5: { speed: 5, minGap: 40, maxGap: 60, gravity: 1, platformY: 650 }
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

// Platform object
const PLATFORM = {
    x: GAME.width / 2 - 60,
    y: 650,
    width: 120,
    height: 20,
    color: '#00CC00'
};

// Player object
const PLAYER = {
    x: GAME.width / 2 - 20,
    y: PLATFORM.y - 40,
    width: 40,
    height: 40,
    velocityY: 0,
    gravity: 0.8,
    jumpPower: -15,
    color: '#FFD700',
    eyeColor: '#333',
    isJumping: false,
    isOnPlatform: true,
    onGround: true
};

// Obstacles array
let obstacles = [];
let platforms = [];
const OBSTACLE_CONFIG = {
    width: 60,
    height: 30,
    spacing: 280,
    color: '#FF4444'
};

// Particle system
let particles = [];
let obstaclesPassed = 0;

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

// ==================== PLATFORM MANAGEMENT ====================
function generatePlatform(xPosition) {
    return {
        x: xPosition,
        y: 550,
        width: 120,
        height: 20,
        color: '#0099FF'
    };
}

// ==================== OBSTACLE MANAGEMENT ====================
function generateObstacle(startX) {
    const minGap = GAME.levelConfig.minGap;
    const maxGap = GAME.levelConfig.maxGap;
    const randomHeight = minGap + Math.random() * (maxGap - minGap);

    return {
        x: startX,
        y: 680 - randomHeight,
        width: OBSTACLE_CONFIG.width,
        height: randomHeight,
        passed: false,
        rotation: 0
    };
}

function initializeObstacles() {
    obstacles = [];
    platforms = [];
    obstaclesPassed = 0;
    
    // Create obstacles and checkpoint platforms
    for (let i = 0; i < 20; i++) {
        obstacles.push(generateObstacle(GAME.width + i * OBSTACLE_CONFIG.spacing));
        
        // Add checkpoint platform after every 5 obstacles
        if ((i + 1) % 5 === 0) {
            const platformX = GAME.width + (i + 1) * OBSTACLE_CONFIG.spacing + 100;
            platforms.push(generatePlatform(platformX));
        }
    }
}

// ==================== INPUT HANDLING ====================
function handleJump(e) {
    if (!GAME.gameActive) return;
    if (GAME.isRunning && !PLAYER.onGround) return;
    
    if (e.type.includes('touch')) {
        e.preventDefault();
    }

    if (!GAME.isRunning) {
        GAME.isRunning = true;
    }

    // Only allow jump if on ground or platform
    if (PLAYER.onGround || PLAYER.isOnPlatform) {
        PLAYER.velocityY = PLAYER.jumpPower;
        PLAYER.isJumping = true;
        PLAYER.onGround = false;
        PLAYER.isOnPlatform = false;
        createParticles(PLAYER.x + PLAYER.width / 2, PLAYER.y + PLAYER.height, '#FFD700', 12);
        
        if (navigator.vibrate) {
            navigator.vibrate(20);
        }
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
    CTX.fillStyle = '#8B7355';
    CTX.fillRect(0, GAME.height - 40, GAME.width, 40);

    // Ground pattern
    CTX.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let i = 0; i < GAME.width; i += 40) {
        CTX.fillRect(i, GAME.height - 40, 20, 40);
    }
}

function drawStartPlatform() {
    // Shadow
    CTX.fillStyle = 'rgba(0, 0, 0, 0.2)';
    CTX.fillRect(PLATFORM.x - 5, PLATFORM.y + PLATFORM.height + 3, PLATFORM.width + 10, 8);

    // Main platform with gradient
    const gradient = CTX.createLinearGradient(PLATFORM.x, PLATFORM.y, PLATFORM.x, PLATFORM.y + PLATFORM.height);
    gradient.addColorStop(0, '#00FF00');
    gradient.addColorStop(0.5, '#00DD00');
    gradient.addColorStop(1, '#009900');
    
    CTX.fillStyle = gradient;
    CTX.fillRect(PLATFORM.x, PLATFORM.y, PLATFORM.width, PLATFORM.height);
    
    // Border
    CTX.strokeStyle = '#006600';
    CTX.lineWidth = 3;
    CTX.strokeRect(PLATFORM.x, PLATFORM.y, PLATFORM.width, PLATFORM.height);

    // Highlight
    CTX.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    CTX.lineWidth = 1;
    CTX.strokeRect(PLATFORM.x + 2, PLATFORM.y + 2, PLATFORM.width - 4, PLATFORM.height - 4);

    // Start text
    CTX.fillStyle = 'white';
    CTX.font = 'bold 14px Arial';
    CTX.textAlign = 'center';
    CTX.fillText('START', PLATFORM.x + PLATFORM.width / 2, PLATFORM.y + 35);
}

function drawCheckpoints() {
    platforms.forEach((platform) => {
        // Shadow
        CTX.fillStyle = 'rgba(0, 0, 0, 0.2)';
        CTX.fillRect(platform.x - 5, platform.y + platform.height + 3, platform.width + 10, 8);

        // Main platform with blue gradient
        const gradient = CTX.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
        gradient.addColorStop(0, '#00DDFF');
        gradient.addColorStop(0.5, '#00AADD');
        gradient.addColorStop(1, '#0088BB');
        
        CTX.fillStyle = gradient;
        CTX.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Border
        CTX.strokeStyle = '#0066AA';
        CTX.lineWidth = 3;
        CTX.strokeRect(platform.x, platform.y, platform.width, platform.height);

        // Highlight
        CTX.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        CTX.lineWidth = 1;
        CTX.strokeRect(platform.x + 2, platform.y + 2, platform.width - 4, platform.height - 4);

        // Checkpoint label
        CTX.fillStyle = 'white';
        CTX.font = 'bold 10px Arial';
        CTX.textAlign = 'center';
        CTX.fillText('CHECKPOINT', platform.x + platform.width / 2, platform.y + platform.height + 16);
    });
}

function drawPlayer() {
    const x = PLAYER.x;
    const y = PLAYER.y;

    // Shadow on ground
    CTX.fillStyle = 'rgba(0, 0, 0, 0.2)';
    CTX.beginPath();
    CTX.ellipse(x + PLAYER.width / 2, 690, 25, 6, 0, 0, Math.PI * 2);
    CTX.fill();

    // Body - golden circle with gradient
    const bodyGradient = CTX.createRadialGradient(x + 10, y + 10, 5, x + 20, y + 20, 30);
    bodyGradient.addColorStop(0, '#FFFF99');
    bodyGradient.addColorStop(1, '#FFD700');
    CTX.fillStyle = bodyGradient;
    CTX.beginPath();
    CTX.arc(x + PLAYER.width / 2, y + PLAYER.height / 2, PLAYER.width / 2, 0, Math.PI * 2);
    CTX.fill();

    // Border
    CTX.strokeStyle = '#FFA500';
    CTX.lineWidth = 2;
    CTX.stroke();

    // Left eye
    CTX.fillStyle = 'white';
    CTX.beginPath();
    CTX.arc(x + 12, y + 12, 6, 0, Math.PI * 2);
    CTX.fill();

    // Left pupil
    CTX.fillStyle = PLAYER.eyeColor;
    CTX.beginPath();
    CTX.arc(x + 13, y + 13, 3, 0, Math.PI * 2);
    CTX.fill();

    // Right eye
    CTX.fillStyle = 'white';
    CTX.beginPath();
    CTX.arc(x + 28, y + 12, 6, 0, Math.PI * 2);
    CTX.fill();

    // Right pupil
    CTX.fillStyle = PLAYER.eyeColor;
    CTX.beginPath();
    CTX.arc(x + 29, y + 13, 3, 0, Math.PI * 2);
    CTX.fill();

    // Mouth
    CTX.strokeStyle = PLAYER.eyeColor;
    CTX.lineWidth = 2;
    CTX.beginPath();
    CTX.arc(x + PLAYER.width / 2, y + 28, 5, 0, Math.PI);
    CTX.stroke();
}

function drawObstacles() {
    obstacles.forEach((obstacle) => {
        const x = obstacle.x;
        const y = obstacle.y;
        const h = obstacle.height;

        // Obstacle gradient
        const gradient = CTX.createLinearGradient(x, y, x, y + h);
        gradient.addColorStop(0, '#FF6666');
        gradient.addColorStop(0.5, '#FF4444');
        gradient.addColorStop(1, '#CC0000');

        // Draw obstacle rectangle
        CTX.fillStyle = gradient;
        CTX.fillRect(x, y, obstacle.width, h);
        
        // Border
        CTX.strokeStyle = '#990000';
        CTX.lineWidth = 2;
        CTX.strokeRect(x, y, obstacle.width, h);

        // Spikes on top
        drawObstacleSpikes(x, y, obstacle.width);
    });
}

function drawObstacleSpikes(x, y, width) {
    CTX.fillStyle = '#FF2222';
    const spikeCount = Math.floor(width / 12);
    for (let i = 0; i < spikeCount; i++) {
        const spikeX = x + (width / spikeCount) * i + (width / spikeCount) / 2;
        CTX.beginPath();
        CTX.moveTo(spikeX - 4, y);
        CTX.lineTo(spikeX, y - 8);
        CTX.lineTo(spikeX + 4, y);
        CTX.fill();
    }
}

// ==================== UPDATE FUNCTIONS ====================
function updatePlayer() {
    // Apply gravity
    PLAYER.velocityY += PLAYER.gravity;
    PLAYER.y += PLAYER.velocityY;

    // Check if falling - not on platform anymore
    if (PLAYER.isJumping && PLAYER.velocityY > 0) {
        PLAYER.isJumping = false;
    }

    // Ground collision
    if (PLAYER.y + PLAYER.height >= 680) {
        PLAYER.y = 680 - PLAYER.height;
        PLAYER.velocityY = 0;
        PLAYER.onGround = true;
        PLAYER.isOnPlatform = false;
    } else {
        PLAYER.onGround = false;
    }

    // Start platform collision
    if (PLAYER.velocityY >= 0) {
        const playerBottom = PLAYER.y + PLAYER.height;
        const platformTop = PLATFORM.y;
        const playerCenterX = PLAYER.x + PLAYER.width / 2;
        
        if (playerBottom >= platformTop && playerBottom <= platformTop + 20 &&
            playerCenterX > PLATFORM.x - 20 && playerCenterX < PLATFORM.x + PLATFORM.width + 20 &&
            !PLAYER.isOnPlatform) {
            PLAYER.y = PLATFORM.y - PLAYER.height;
            PLAYER.velocityY = 0;
            PLAYER.isOnPlatform = true;
            PLAYER.onGround = false;
        }
    }

    // Checkpoint platforms collision
    platforms.forEach((platform) => {
        if (PLAYER.velocityY >= 0) {
            const playerBottom = PLAYER.y + PLAYER.height;
            const platformTop = platform.y;
            const playerCenterX = PLAYER.x + PLAYER.width / 2;
            
            if (playerBottom >= platformTop && playerBottom <= platformTop + 20 &&
                playerCenterX > platform.x - 20 && playerCenterX < platform.x + platform.width + 20 &&
                !PLAYER.isOnPlatform) {
                PLAYER.y = platform.y - PLAYER.height;
                PLAYER.velocityY = 0;
                PLAYER.isOnPlatform = true;
                PLAYER.onGround = false;
                createParticles(PLAYER.x + PLAYER.width / 2, PLAYER.y, '#00DDFF', 15);
                if (navigator.vibrate) {
                    navigator.vibrate([30, 20, 30]);
                }
            }
        }
    });

    // Ceiling collision
    if (PLAYER.y <= 0) {
        PLAYER.y = 0;
        PLAYER.velocityY = 0;
    }
}

function updateObstacles() {
    obstacles.forEach((obstacle) => {
        obstacle.x -= GAME.levelConfig.speed;

        if (obstacle.x + obstacle.width < 0) {
            const lastObstacle = obstacles[obstacles.length - 1];
            const newObstacle = generateObstacle(lastObstacle.x + OBSTACLE_CONFIG.spacing);
            obstacles.push(newObstacle);
            obstacles.shift();
        }

        if (!obstacle.passed && obstacle.x + obstacle.width < PLAYER.x) {
            obstacle.passed = true;
            GAME.score++;
            updateScore();
            createParticles(GAME.width / 2, 100, '#00FF00', 15);
            
            if (navigator.vibrate) {
                navigator.vibrate([50, 30, 50]);
            }
        }
    });
}

function updatePlatforms() {
    // Remove platforms that are off screen
    platforms = platforms.filter(p => p.x > -150);
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
        const obstacleRight = obstacle.x + obstacle.width;
        const obstacleTop = obstacle.y;
        const obstacleBottom = obstacle.y + obstacle.height;

        // Check if player overlaps with obstacle
        if (playerRight > obstacleLeft && playerLeft < obstacleRight &&
            playerBottom > obstacleTop && playerTop < obstacleBottom) {
            createParticles(PLAYER.x + PLAYER.width / 2, PLAYER.y, '#FF4444', 20);
            endLevel();
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
    
    GAME.score = 0;
    GAME.isRunning = false;
    PLAYER.x = GAME.width / 2 - 20;
    PLAYER.y = PLATFORM.y - PLAYER.height;
    PLAYER.velocityY = 0;
    PLAYER.isOnPlatform = true;
    PLAYER.onGround = false;
    PLAYER.isJumping = false;
    
    obstacles = [];
    platforms = [];
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
    drawStartPlatform();
    drawCheckpoints();

    if (GAME.gameActive) {
        updatePlayer();
        if (GAME.isRunning) {
            updateObstacles();
            updatePlatforms();
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
