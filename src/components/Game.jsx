import React, { useEffect, useRef } from 'react';
import Tank from '../game/Tank';
import Bullet from '../game/Bullet';

const Game = () => {
    const canvasRef = useRef(null);
    const requestRef = useRef();
    const previousTimeRef = useRef();

    // Game State
    const gameState = useRef({
        tank: new Tank(400, 300),
        bullets: [],
        enemies: [],
        enemySpawnTimer: 0,
        keys: {
            w: false, a: false, s: false, d: false,
            j: false, k: false,
            ' ': false
        }
    });

    const checkCollision = (circle, rect) => {
        // Simple Circle-Rect collision
        const distX = Math.abs(circle.x - rect.x);
        const distY = Math.abs(circle.y - rect.y);

        if (distX > (rect.width / 2 + circle.radius)) { return false; }
        if (distY > (rect.height / 2 + circle.radius)) { return false; }

        if (distX <= (rect.width / 2)) { return true; }
        if (distY <= (rect.height / 2)) { return true; }

        const dx = distX - rect.width / 2;
        const dy = distY - rect.height / 2;
        return (dx * dx + dy * dy <= (circle.radius * circle.radius));
    };

    const update = (deltaTime) => {
        const { tank, bullets, enemies, keys } = gameState.current;

        // Update Tank
        tank.update({ keys }, deltaTime);

        // Spawn Enemies
        gameState.current.enemySpawnTimer += deltaTime;
        if (gameState.current.enemySpawnTimer > 3000) { // Spawn every 3 seconds
            // Spawn at random edge
            let ex, ey;
            if (Math.random() < 0.5) {
                ex = Math.random() < 0.5 ? -50 : 850;
                ey = Math.random() * 600;
            } else {
                ex = Math.random() * 800;
                ey = Math.random() < 0.5 ? -50 : 650;
            }
            enemies.push(new Tank(ex, ey, true));
            gameState.current.enemySpawnTimer = 0;
        }

        // Update Enemies
        enemies.forEach(enemy => enemy.update(null, deltaTime, tank, bullets));

        // Update Bullets
        gameState.current.bullets = bullets.filter(b => b.active);
        gameState.current.bullets.forEach(b => b.update(800, 600));

        // Collision Detection
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];

            if (bullet.isEnemyBullet) {
                // Check Player Collision
                if (checkCollision(bullet, tank)) {
                    bullet.active = false;
                    // Player takes damage
                    // For now, maybe just lose some EXP or HP?
                    tank.takeDamage(5); // Player takes 5 damage
                    // Game Over check?
                    if (tank.health <= 0) {
                        // Reset Game
                        alert('Game Over!');
                        window.location.reload();
                    }
                }
            } else {
                // Check Enemy Collision
                for (let j = enemies.length - 1; j >= 0; j--) {
                    const enemy = enemies[j];
                    if (checkCollision(bullet, enemy)) {
                        // Enemy hit
                        bullet.active = false;
                        const dmg = 25 * tank.scale; // Player damage scales with size
                        if (enemy.takeDamage(dmg)) {
                            // Enemy Dead
                            enemies.splice(j, 1);
                            tank.gainExp(enemy.maxHealth); // Gain EXP based on enemy size/health
                            tank.heal(enemy.maxHealth * 0.5); // Heal 50% of enemy max health
                        }
                        break;
                    }
                }
            }
        }

        // Player vs Enemy (Body collision damage?) - Optional for now
        // enemies.forEach(enemy => { if(checkCollision({x: tank.x, y: tank.y, radius: 20}, enemy)) { tank.takeDamage(1); } });

        // Shooting Logic
        if (keys[' ']) {
            const now = Date.now();
            if (now - tank.lastShot > tank.reloadTime) {
                // Calculate spawn position at the tip of the barrel
                const barrelLength = 35 * (tank.width / 40); // Scale barrel spawn point
                const spawnX = tank.x + Math.cos(tank.turretRotation) * barrelLength;
                const spawnY = tank.y + Math.sin(tank.turretRotation) * barrelLength;

                const bullet = new Bullet(spawnX, spawnY, tank.turretRotation);
                gameState.current.bullets.push(bullet);
                tank.lastShot = now;
            }
        }
    };

    const draw = (ctx) => {
        // Clear Canvas
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        const { tank, bullets, enemies } = gameState.current;

        // Draw Enemies
        enemies.forEach(e => e.draw(ctx));

        // Draw Bullets
        bullets.forEach(b => {
            ctx.fillStyle = b.isEnemyBullet ? 'orange' : 'yellow';
            b.draw(ctx);
        });

        // Draw Tank
        tank.draw(ctx);

        // Draw UI (EXP / Level)
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(`EXP: ${tank.exp}`, 10, 30);
        ctx.fillText(`HP: ${tank.health}`, 10, 60);
    };

    const loop = (time) => {
        if (previousTimeRef.current !== undefined) {
            const deltaTime = time - previousTimeRef.current;

            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                update(deltaTime);
                draw(ctx);
            }
        }
        previousTimeRef.current = time;
        requestRef.current = requestAnimationFrame(loop);
    };

    useEffect(() => {
        // Input Handling
        const handleKeyDown = (e) => {
            gameState.current.keys[e.key] = true;
        };

        const handleKeyUp = (e) => {
            gameState.current.keys[e.key] = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Start Loop
        requestRef.current = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            cancelAnimationFrame(requestRef.current);
        };
    }, []);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#111' }}>
            <canvas
                ref={canvasRef}
                width={800}
                height={600}
                style={{ border: '2px solid #555' }}
            />
        </div>
    );
};

export default Game;
