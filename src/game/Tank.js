import Bullet from './Bullet';

export default class Tank {
  constructor(x, y, isEnemy = false) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 40;
    this.speed = 3;
    this.rotation = 0; // Body rotation
    this.turretRotation = 0; // Turret rotation
    this.color = isEnemy ? '#ff0000' : '#00ff00';
    this.lastShot = 0;
    this.reloadTime = 500; // ms

    this.isEnemy = isEnemy;
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.exp = 0;
    this.level = 1;

    // Apply initial EXP/Size if provided (for enemies)
    if (this.isEnemy) {
      // Random EXP between 0 and 5000
      this.gainExp(Math.floor(Math.random() * 5000));
      this.health = this.maxHealth; // Ensure full health at spawn
    }
  }

  heal(amount) {
    this.health = Math.min(this.health + amount, this.maxHealth);
  }

  shoot(bullets, now) {
    const s = this.scale;
    const barrelLength = 35 * s;
    const spawnX = this.x + Math.cos(this.turretRotation) * barrelLength;
    const spawnY = this.y + Math.sin(this.turretRotation) * barrelLength;

    const bullet = new Bullet(spawnX, spawnY, this.turretRotation);
    bullet.isEnemyBullet = this.isEnemy; // Mark as enemy bullet
    bullet.radius = 5 * s; // Scale bullet size

    bullets.push(bullet);
    this.lastShot = now;
  }

  get scale() {
    return Math.min(1 + this.exp / 1000, 3); // Max scale 3
  }

  takeDamage(amount) {
    this.health -= amount;
    return this.health <= 0;
  }

  gainExp(amount) {
    this.exp += amount;
    // Recalculate stats based on new scale
    const s = this.scale;
    this.width = 40 * s;
    this.height = 40 * s;
    this.maxHealth = 100 * s;
    // Heal proportional to growth? Or just increase max.
    // Let's current health increase proportionally too?
    // this.health = this.maxHealth; // Full heal on level up? Maybe too OP.
  }

  update(input, dt, player, bullets) {
    if (this.isEnemy && player) {
      // Simple AI: Move towards player
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const interactionDist = 500;
      const stopDist = 200; // Stop to shoot

      if (dist < interactionDist) {
        const angle = Math.atan2(dy, dx);
        this.turretRotation = angle; // Always aim at player

        if (dist > stopDist) {
          this.x += Math.cos(angle) * (this.speed * 0.5);
          this.y += Math.sin(angle) * (this.speed * 0.5);
          this.rotation = angle;
        }

        // Shoot if cooldown ready
        const now = Date.now();
        if (now - this.lastShot > this.reloadTime + Math.random() * 1000) { // Add some randomness and delay
          if (bullets) {
            this.shoot(bullets, now);
          }
        }
      }
      return;
    }
    // Movement (WASD)
    if (input.keys['w']) {
      this.y -= this.speed;
    }
    if (input.keys['s']) {
      this.y += this.speed;
    }
    if (input.keys['a']) {
      this.x -= this.speed;
    }
    if (input.keys['d']) {
      this.x += this.speed;
    }

    // Turret Rotation (J/K)
    const rotationSpeed = 0.05;
    if (input.keys['j']) {
      this.turretRotation -= rotationSpeed;
    }
    if (input.keys['k']) {
      this.turretRotation += rotationSpeed;
    }

    // Keep tank within bounds (optional, but good)
    // For now, let's just let it run free.
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Draw Body
    ctx.rotate(this.rotation); // If we add body rotation later
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

    // Draw Tracks (visual only)
    ctx.fillStyle = '#333';
    ctx.fillRect(-this.width / 2 - 5, -this.height / 2, 5, this.height);
    ctx.fillRect(this.width / 2, -this.height / 2, 5, this.height);

    // Draw Turret
    ctx.rotate(this.turretRotation - this.rotation); // Relative to body
    ctx.fillStyle = this.isEnemy ? '#cc0000' : '#006600';
    ctx.beginPath();
    ctx.arc(0, 0, 15 * this.scale, 0, Math.PI * 2); // Scale turret
    ctx.fill();

    // Draw Barrel
    const barrelWidth = 35 * this.scale;
    const barrelHeight = 10 * this.scale;
    ctx.fillRect(0, -barrelHeight / 2, barrelWidth, barrelHeight);

    ctx.restore();

    // Draw Health Bar
    if (this.health < this.maxHealth || this.isEnemy) {
      ctx.fillStyle = 'red';
      ctx.fillRect(this.x - 25, this.y - this.height / 2 - 15, 50, 5);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(this.x - 25, this.y - this.height / 2 - 15, 50 * (this.health / this.maxHealth), 5);
    }
  }
}
