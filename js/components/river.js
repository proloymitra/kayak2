// River class - represents the river and its flow
class River {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.color = '#1E90FF'; // Dodger blue
        this.flowSpeed = 100; // pixels per second
        this.banks = [];
        this.waves = [];
        
        // Generate river banks
        this.generateBanks();
        
        // Generate initial waves
        this.generateWaves();
    }
    
    // Generate river banks
    generateBanks() {
        const bankWidth = 100;
        
        // Left bank
        this.banks.push({
            x: 0,
            y: 0,
            width: bankWidth,
            height: this.height,
            color: '#8B4513' // Brown
        });
        
        // Right bank
        this.banks.push({
            x: this.width - bankWidth,
            y: 0,
            width: bankWidth,
            height: this.height,
            color: '#8B4513' // Brown
        });
    }
    
    // Generate waves for river animation
    generateWaves() {
        const waveCount = 20;
        const riverWidth = this.width - (this.banks[0].width + this.banks[1].width);
        const riverStartX = this.banks[0].width;
        
        for (let i = 0; i < waveCount; i++) {
            this.waves.push({
                x: riverStartX + Math.random() * riverWidth,
                y: Math.random() * this.height,
                radius: 2 + Math.random() * 4,
                speed: this.flowSpeed * (0.8 + Math.random() * 0.4)
            });
        }
    }
    
    // Update river animation
    update(deltaTime) {
        // Update waves position
        for (let i = 0; i < this.waves.length; i++) {
            this.waves[i].y += this.waves[i].speed * deltaTime;
            
            // Reset waves that moved off-screen
            if (this.waves[i].y > this.height) {
                const riverWidth = this.width - (this.banks[0].width + this.banks[1].width);
                const riverStartX = this.banks[0].width;
                
                this.waves[i].x = riverStartX + Math.random() * riverWidth;
                this.waves[i].y = -Math.random() * 50;
            }
        }
    }
    
    // Draw the river
    draw(ctx) {
        // Draw river background
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw river banks
        for (const bank of this.banks) {
            ctx.fillStyle = bank.color;
            ctx.fillRect(bank.x, bank.y, bank.width, bank.height);
        }
        
        // Draw waves
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for (const wave of this.waves) {
            ctx.beginPath();
            ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}