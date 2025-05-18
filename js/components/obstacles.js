// Obstacle class - represents rocks, logs and other obstacles
class Obstacle {
    constructor(canvasWidth, canvasHeight) {
        this.types = ['rock', 'log', 'whirlpool'];
        this.type = this.types[Math.floor(Math.random() * this.types.length)];
        
        // River boundaries (assuming banks are 100px wide)
        const bankWidth = 100;
        const riverWidth = canvasWidth - bankWidth * 2;
        
        // Set dimensions based on type
        if (this.type === 'rock') {
            this.width = 30 + Math.random() * 30;
            this.height = this.width;
            this.color = '#808080'; // Gray
        } else if (this.type === 'log') {
            this.width = 100 + Math.random() * 50;
            this.height = 20 + Math.random() * 10;
            this.color = '#8B4513'; // Brown
        } else if (this.type === 'whirlpool') {
            this.width = 40 + Math.random() * 20;
            this.height = this.width;
            this.color = '#1E90FF'; // Dodger blue
            this.rotation = 0;
        }
        
        // Position obstacle within river boundaries
        this.x = bankWidth + Math.random() * (riverWidth - this.width);
        this.y = -this.height;
        
        // Speed of obstacle
        this.speed = 100 + Math.random() * 100;
    }
    
    // Update obstacle position
    update(deltaTime) {
        this.y += this.speed * deltaTime;
        
        // Update rotation for whirlpool
        if (this.type === 'whirlpool') {
            this.rotation += deltaTime * 2;
        }
    }
    
    // Draw the obstacle
    draw(ctx) {
        ctx.fillStyle = this.color;
        
        if (this.type === 'rock') {
            // Draw rock as irregular circle
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Add some texture to the rock
            ctx.strokeStyle = '#696969';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + this.width/3, this.y + this.height/3, this.width/6, 0, Math.PI * 2);
            ctx.stroke();
        } 
        else if (this.type === 'log') {
            // Draw log as rounded rectangle
            const radius = this.height / 2;
            
            ctx.beginPath();
            ctx.moveTo(this.x + radius, this.y);
            ctx.lineTo(this.x + this.width - radius, this.y);
            ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + radius);
            ctx.lineTo(this.x + this.width, this.y + this.height - radius);
            ctx.quadraticCurveTo(this.x + this.width, this.y + this.height, this.x + this.width - radius, this.y + this.height);
            ctx.lineTo(this.x + radius, this.y + this.height);
            ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - radius);
            ctx.lineTo(this.x, this.y + radius);
            ctx.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
            ctx.closePath();
            ctx.fill();
            
            // Add some lines for texture
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 1;
            for (let i = 1; i < 4; i++) {
                ctx.beginPath();
                ctx.moveTo(this.x + 10, this.y + (this.height / 4) * i);
                ctx.lineTo(this.x + this.width - 10, this.y + (this.height / 4) * i);
                ctx.stroke();
            }
        } 
        else if (this.type === 'whirlpool') {
            // Save context for rotation
            ctx.save();
            ctx.translate(this.x + this.width/2, this.y + this.height/2);
            ctx.rotate(this.rotation);
            
            // Draw whirlpool spiral
            ctx.strokeStyle = '#87CEEB';
            ctx.lineWidth = 3;
            ctx.beginPath();
            
            const maxRadius = this.width/2;
            const spiralTurns = 3;
            const pointsPerTurn = 20;
            const totalPoints = spiralTurns * pointsPerTurn;
            
            for (let i = 0; i <= totalPoints; i++) {
                const angle = (i / pointsPerTurn) * Math.PI * 2;
                const radius = (i / totalPoints) * maxRadius;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.stroke();
            
            // Restore context
            ctx.restore();
        }
    }
}