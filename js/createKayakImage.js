// This script will create a basic kayak image and save it to the assets folder
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 100;
    
    const ctx = canvas.getContext('2d');
    
    // Draw kayak body
    ctx.fillStyle = '#FF9800';
    ctx.beginPath();
    ctx.moveTo(30, 50);
    ctx.bezierCurveTo(50, 30, 150, 30, 170, 50);
    ctx.bezierCurveTo(150, 70, 50, 70, 30, 50);
    ctx.closePath();
    ctx.fill();
    
    // Add details
    ctx.strokeStyle = '#E65100';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 50);
    ctx.lineTo(160, 50);
    ctx.stroke();
    
    // Add cockpit
    ctx.fillStyle = '#795548';
    ctx.beginPath();
    ctx.ellipse(100, 50, 20, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Create download link
    const link = document.createElement('a');
    link.download = 'kayakOpt1.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    console.log('Created kayak image. Please move it to the assets/images folder.');
});