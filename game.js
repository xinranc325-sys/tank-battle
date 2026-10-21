// 游戏配置
const CONFIG = {
    canvas: { width: 800, height: 600 },
    tank: { size: 40, speed: 3, bulletSpeed: 5, bulletCooldown: 500 },
    enemy: { size: 40, speed: 1.5, spawnInterval: 3000, maxCount: 5 },
    wall: { size: 40 }
};

// 游戏状态
const game = {
    canvas: null,
    ctx: null,
    running: false,
    paused: false,
    score: 0,
    lives: 3,
    level: 1,
    player: null,
    enemies: [],
    bullets: [],
    enemyBullets: [],
    walls: [],
    keys: {},
    lastBulletTime: 0,
    lastEnemySpawn: 0,
    animationId: null
};

// 坦克类
class Tank {
    constructor(x, y, color, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.tank.size;
        this.height = CONFIG.tank.size;
        this.color = color;
        this.direction = isPlayer ? 'up' : 'down';
        this.speed = isPlayer ? CONFIG.tank.speed : CONFIG.enemy.speed;
        this.isPlayer = isPlayer;
        this.lastShot = 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        const rotation = { up: 0, right: 90, down: 180, left: 270 }[this.direction];
        ctx.rotate((rotation * Math.PI) / 180);

        // 坦克主体
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // 炮管
        ctx.fillStyle = this.isPlayer ? '#38BDF8' : '#EF4444';
        ctx.fillRect(-3, -this.height / 2 - 15, 6, 20);

        ctx.restore();
    }

    move(dx, dy) {
        const newX = this.x + dx;
        const newY = this.y + dy;

        if (newX >= 0 && newX + this.width <= CONFIG.canvas.width &&
            newY >= 0 && newY + this.height <= CONFIG.canvas.height) {

            if (!this.checkWallCollision(newX, newY)) {
                this.x = newX;
                this.y = newY;
            }
        }
    }

    checkWallCollision(x, y) {
        for (let wall of game.walls) {
            if (x < wall.x + wall.width &&
                x + this.width > wall.x &&
                y < wall.y + wall.height &&
                y + this.height > wall.y) {
                return true;
            }
        }
        return false;
    }

    shoot() {
        const now = Date.now();
        if (now - this.lastShot < CONFIG.tank.bulletCooldown) return null;

        this.lastShot = now;
        const bullet = {
            x: this.x + this.width / 2 - 3,
            y: this.y + this.height / 2 - 3,
            width: 6,
            height: 6,
            direction: this.direction,
            speed: CONFIG.tank.bulletSpeed,
            isPlayer: this.isPlayer
        };

        return bullet;
    }
}

// 墙壁类
class Wall {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.wall.size;
        this.height = CONFIG.wall.size;
    }

    draw(ctx) {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

// 初始化游戏
function init() {
    game.canvas = document.getElementById('gameCanvas');
    game.ctx = game.canvas.getContext('2d');
    game.canvas.width = CONFIG.canvas.width;
    game.canvas.height = CONFIG.canvas.height;

    setupControls();
    setupLevel();
}

// 设置关卡
function setupLevel() {
    game.player = new Tank(
        CONFIG.canvas.width / 2 - CONFIG.tank.size / 2,
        CONFIG.canvas.height - CONFIG.tank.size - 20,
        '#1E3A52',
        true
    );

    game.enemies = [];
    game.bullets = [];
    game.enemyBullets = [];
    game.walls = [];

    // 创建墙壁
    createWalls();
}

// 创建墙壁布局
function createWalls() {
    const positions = [
        [200, 150], [400, 150], [600, 150],
        [150, 300], [350, 300], [550, 300],
        [300, 450]
    ];

    positions.forEach(([x, y]) => {
        game.walls.push(new Wall(x, y));
    });
}

// 控制设置
function setupControls() {
    document.addEventListener('keydown', (e) => {
        game.keys[e.key] = true;

        if (e.key === ' ') {
            e.preventDefault();
            if (game.running && !game.paused) {
                const bullet = game.player.shoot();
                if (bullet) game.bullets.push(bullet);
            }
        }

        if (e.key.toLowerCase() === 'p') {
            togglePause();
        }
    });

    document.addEventListener('keyup', (e) => {
        game.keys[e.key] = false;
    });

    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
}

// 开始游戏
function startGame() {
    game.running = true;
    game.paused = false;
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    gameLoop();
}

// 暂停/继续
function togglePause() {
    if (!game.running) return;
    game.paused = !game.paused;
    document.getElementById('pauseBtn').textContent = game.paused ? '继续' : '暂停';
    if (!game.paused) gameLoop();
}

// 重新开始
function restartGame() {
    game.score = 0;
    game.lives = 3;
    game.level = 1;
    document.getElementById('gameOver').classList.add('hidden');
    updateUI();
    setupLevel();
    startGame();
}

// 游戏循环
function gameLoop() {
    if (!game.running || game.paused) return;

    update();
    draw();

    game.animationId = requestAnimationFrame(gameLoop);
}

// 更新游戏状态
function update() {
    // 玩家移动
    if (game.keys['ArrowUp']) {
        game.player.direction = 'up';
        game.player.move(0, -game.player.speed);
    }
    if (game.keys['ArrowDown']) {
        game.player.direction = 'down';
        game.player.move(0, game.player.speed);
    }
    if (game.keys['ArrowLeft']) {
        game.player.direction = 'left';
        game.player.move(-game.player.speed, 0);
    }
    if (game.keys['ArrowRight']) {
        game.player.direction = 'right';
        game.player.move(game.player.speed, 0);
    }

    // 生成敌人
    const now = Date.now();
    if (now - game.lastEnemySpawn > CONFIG.enemy.spawnInterval &&
        game.enemies.length < CONFIG.enemy.maxCount) {
        spawnEnemy();
        game.lastEnemySpawn = now;
    }

    // 更新敌人
    game.enemies.forEach((enemy, index) => {
        // 简单AI：随机移动
        if (Math.random() < 0.02) {
            const directions = ['up', 'down', 'left', 'right'];
            enemy.direction = directions[Math.floor(Math.random() * directions.length)];
        }

        const moves = {
            up: [0, -enemy.speed],
            down: [0, enemy.speed],
            left: [-enemy.speed, 0],
            right: [enemy.speed, 0]
        };

        const [dx, dy] = moves[enemy.direction];
        enemy.move(dx, dy);

        // 敌人射击
        if (Math.random() < 0.01) {
            const bullet = enemy.shoot();
            if (bullet) game.enemyBullets.push(bullet);
        }
    });

    // 更新子弹
    updateBullets();

    // 检测碰撞
    checkCollisions();
}

// 生成敌人
function spawnEnemy() {
    const x = Math.random() * (CONFIG.canvas.width - CONFIG.enemy.size);
    const enemy = new Tank(x, 20, '#4B1E1E', false);
    game.enemies.push(enemy);
}

// 更新子弹
function updateBullets() {
    const moveBullet = (bullet) => {
        const moves = {
            up: [0, -bullet.speed],
            down: [0, bullet.speed],
            left: [-bullet.speed, 0],
            right: [bullet.speed, 0]
        };
        const [dx, dy] = moves[bullet.direction];
        bullet.x += dx;
        bullet.y += dy;
    };

    game.bullets = game.bullets.filter(bullet => {
        moveBullet(bullet);
        return bullet.x > 0 && bullet.x < CONFIG.canvas.width &&
               bullet.y > 0 && bullet.y < CONFIG.canvas.height;
    });

    game.enemyBullets = game.enemyBullets.filter(bullet => {
        moveBullet(bullet);
        return bullet.x > 0 && bullet.x < CONFIG.canvas.width &&
               bullet.y > 0 && bullet.y < CONFIG.canvas.height;
    });
}

// 碰撞检测
function checkCollisions() {
    // 玩家子弹击中敌人
    game.bullets.forEach((bullet, bIndex) => {
        game.enemies.forEach((enemy, eIndex) => {
            if (checkRectCollision(bullet, enemy)) {
                game.bullets.splice(bIndex, 1);
                game.enemies.splice(eIndex, 1);
                game.score += 100;
                updateUI();
            }
        });
    });

    // 敌人子弹击中玩家
    game.enemyBullets.forEach((bullet, bIndex) => {
        if (checkRectCollision(bullet, game.player)) {
            game.enemyBullets.splice(bIndex, 1);
            game.lives--;
            updateUI();

            if (game.lives <= 0) {
                gameOver();
            }
        }
    });

    // 敌人与玩家碰撞
    game.enemies.forEach((enemy) => {
        if (checkRectCollision(enemy, game.player)) {
            game.lives--;
            updateUI();
            if (game.lives <= 0) {
                gameOver();
            }
        }
    });
}

// 矩形碰撞检测
function checkRectCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// 绘制游戏
function draw() {
    // 清空画布
    game.ctx.fillStyle = '#0A0D12';
    game.ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

    // 绘制墙壁
    game.walls.forEach(wall => wall.draw(game.ctx));

    // 绘制玩家
    game.player.draw(game.ctx);

    // 绘制敌人
    game.enemies.forEach(enemy => enemy.draw(game.ctx));

    // 绘制子弹
    game.ctx.fillStyle = '#38BDF8';
    game.bullets.forEach(bullet => {
        game.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    game.ctx.fillStyle = '#EF4444';
    game.enemyBullets.forEach(bullet => {
        game.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

// 更新UI
function updateUI() {
    document.getElementById('score').textContent = game.score;
    document.getElementById('lives').textContent = game.lives;
    document.getElementById('level').textContent = game.level;
}

// 游戏结束
function gameOver() {
    game.running = false;
    cancelAnimationFrame(game.animationId);
    document.getElementById('finalScore').textContent = game.score;
    document.getElementById('gameOver').classList.remove('hidden');
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
}

// 初始化游戏
window.addEventListener('load', init);
