// Kayak class - represents the player's kayak
class Kayak {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 80;
        this.speed = 200; // pixels per second
        this.velocity = {
            x: 0,
            y: 0
        };
        this.acceleration = 500;
        this.maxSpeed = 300;
        this.friction = 0.9;
        this.color = '#FFA500'; // Orange kayak
    }

    // Update kayak position
    update(deltaTime) {
        // Apply velocity
        this.x += this.velocity.x * deltaTime;
        this.y += this.velocity.y * deltaTime;
        
        // Apply friction
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        
        // Constrain to canvas bounds
        this.x = Math.max(0, Math.min(window.innerWidth - this.width, this.x));
        this.y = Math.max(0, Math.min(window.innerHeight - this.height, this.y));
    }

    // Draw the kayak
    draw(ctx) {
        ctx.fillStyle = this.color;
        
        // Draw kayak body
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + this.height/2, this.width/2, this.height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw paddle
        ctx.fillStyle = '#8B4513'; // Brown paddle
        ctx.fillRect(this.x - 10, this.y + this.height/2 - 5, this.width + 20, 10);
    }

    // Movement methods
    moveLeft() {
        this.velocity.x = -this.speed;
    }

    moveRight() {
        this.velocity.x = this.speed;
    }

    speedUp() {
        this.velocity.y = -this.speed/2;
    }

    slowDown() {
        this.velocity.y = this.speed/2;
    }
}