export default class Bullet {
    constructor(x, y, rotation) {
        this.x = x;
        this.y = y;
        this.rotation = rotation;
        this.speed = 10;
        this.radius = 5;
        this.active = true;
        this.isEnemyBullet = false; // Default to player bullet
    }

    update(width, height) {
        this.x += Math.cos(this.rotation) * this.speed;
        this.y += Math.sin(this.rotation) * this.speed;

        // Deactivate if out of bounds
        if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
