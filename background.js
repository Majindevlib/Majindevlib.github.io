/* =========================================
   PARTICLE + STAR BACKGROUND

   The canvas is absolutely positioned and sized
   to the FULL document height (not just the
   viewport), so it scrolls together with the
   rest of the page as one unit. Works the same
   on any page that includes <canvas id="canvas">
   and this script — the page's own content
   (carousel, study grid, etc.) determines how
   tall the page is, and this script just fills
   whatever height that turns out to be.
========================================= */

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let viewWidth = 0;    // window width
let viewHeight = 0;   // window height (used to size/place the hero text)
let canvasHeight = 0; // full scrollable document height (used to size the canvas)

const mouse = { x: -1000, y: -1000, active: false };

const PARTICLE_SPACING = 5;
const MOUSE_RADIUS = 70;
const MOUSE_FORCE = 18;
const SPRING = 0.085;
const DAMPING = 0.82;

const STAR_DENSITY_PER_VIEWPORT = 260;
const STAR_SPEED = 1.8;

let particles = [];
let stars = [];

const textCanvas = document.createElement("canvas");
const textCtx = textCanvas.getContext("2d");

function createParticles() {
    particles = [];

    const tempWidth = Math.min(viewWidth * .9, 1500);
    const tempHeight = Math.min(viewHeight * .45, 500);

    textCanvas.width = tempWidth;
    textCanvas.height = tempHeight;

    textCtx.clearRect(0, 0, tempWidth, tempHeight);

    const fontSize = Math.min(tempWidth * .18, tempHeight * .6);

    textCtx.font = `900 ${fontSize}px Arial`;
    textCtx.textAlign = "center";
    textCtx.textBaseline = "middle";
    textCtx.fillStyle = "white";
    textCtx.fillText("MAJIN V1", tempWidth / 2, tempHeight / 2);

    const image = textCtx.getImageData(0, 0, tempWidth, tempHeight);
    const data = image.data;

    const offsetX = (viewWidth - tempWidth) / 2;
    const offsetY = (viewHeight - tempHeight) / 2 - 130;

    for (let y = 0; y < tempHeight; y += PARTICLE_SPACING) {
        for (let x = 0; x < tempWidth; x += PARTICLE_SPACING) {
            const index = (y * tempWidth + x) * 4;

            if (data[index + 3] > 140) {
                particles.push({
                    x: offsetX + x,
                    y: offsetY + y,
                    homeX: offsetX + x,
                    homeY: offsetY + y,
                    vx: 0,
                    vy: 0,
                    size: Math.random() * 1.2 + 1.5,
                    alpha: Math.random() * .25 + .75
                });
            }
        }
    }
}

function createStars() {
    stars = [];

    const count = Math.round(
        STAR_DENSITY_PER_VIEWPORT * (canvasHeight / Math.max(viewHeight, 1))
    );

    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * viewWidth,
            y: Math.random() * canvasHeight,
            length: Math.random() * 35 + 8,
            speed: Math.random() * STAR_SPEED + .25,
            alpha: Math.random() * .55 + .1,
            width: Math.random() * 1.2 + .2
        });
    }
}

function resize() {
    viewWidth = window.innerWidth;
    viewHeight = window.innerHeight;

    canvasHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        viewHeight
    );

    const ratio = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = viewWidth * ratio;
    canvas.height = canvasHeight * ratio;

    canvas.style.width = viewWidth + "px";
    canvas.style.height = canvasHeight + "px";

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    createStars();
    createParticles();
}

window.addEventListener("resize", resize);

/* Mouse coordinates are converted to page (document) space,
   since particles live in a canvas taller than the viewport
   and scroll with the page. */
window.addEventListener("mousemove", event => {
    mouse.x = event.clientX + window.scrollX;
    mouse.y = event.clientY + window.scrollY;
    mouse.active = true;
});

window.addEventListener("mouseleave", () => {
    mouse.active = false;
    mouse.x = -1000;
    mouse.y = -1000;
});

function updateParticle(p) {
    p.vx += (p.homeX - p.x) * SPRING;
    p.vy += (p.homeY - p.y) * SPRING;

    if (mouse.active) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0 && distance < MOUSE_RADIUS) {
            const nx = dx / distance;
            const ny = dy / distance;
            const influence = 1 - distance / MOUSE_RADIUS;
            const force = MOUSE_FORCE * influence * influence;

            p.vx += nx * force;
            p.vy += ny * force;
        }
    }

    p.vx *= DAMPING;
    p.vy *= DAMPING;

    p.x += p.vx;
    p.y += p.vy;
}

function drawStars() {
    stars.forEach(star => {
        star.x += star.speed;

        if (star.x > viewWidth + 100) {
            star.x = -100;
            star.y = Math.random() * canvasHeight;
        }

        const gradient = ctx.createLinearGradient(
            star.x, star.y,
            star.x - star.length, star.y - star.length * .12
        );

        gradient.addColorStop(0, `rgba(255,255,255,${star.alpha})`);
        gradient.addColorStop(1, "rgba(255,255,255,0)");

        ctx.strokeStyle = gradient;
        ctx.lineWidth = star.width;

        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(star.x - star.length, star.y - star.length * .12);
        ctx.stroke();
    });
}

function drawParticles() {
    particles.forEach(p => {
        let glow = 0;

        if (mouse.active) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < MOUSE_RADIUS) {
                glow = 1 - distance / MOUSE_RADIUS;
            }
        }

        const brightness = .75 + glow * .25;

        ctx.fillStyle = `rgba(255,255,255,${p.alpha * brightness})`;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

function animate() {
    ctx.fillStyle = "#050608";
    ctx.fillRect(0, 0, viewWidth, canvasHeight);

    drawStars();

    particles.forEach(updateParticle);
    drawParticles();

    requestAnimationFrame(animate);
}

/* =========================================
   NAV — highlight whichever item is clicked
   (Home/Study are real links so the browser
   navigates away; Media/More are placeholders
   until they have real destinations)
========================================= */

document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
        document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
        item.classList.add("active");
    });
});

/* =========================================
   START

   Runs after this page's own content-building
   script (carousel or study grid) so the height
   measurement below includes that content.
========================================= */

resize();
animate();

// Safety re-measure in case fonts/images shift layout right after load.
window.addEventListener("load", resize);
setTimeout(resize, 300);
