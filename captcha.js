const { createCanvas } = require('canvas');

function generateCaptcha(){
    const text = Math.random().toString(36).substring(2, 8).toUpperCase();
    const canvas = createCanvas(200, 80);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = "#1f1f1f";
    ctx.fillRect(0, 0, 200, 80);

    ctx.font = "bold 32px Arial";
    ctx.fillStyle = "#ffffff";

    const x = 20;
    const y = 50;

    ctx.fillText(text, x, y);

    return {
        text,
        buffer: canvas.toBuffer()
    };
}

module.exports = { generateCaptcha }