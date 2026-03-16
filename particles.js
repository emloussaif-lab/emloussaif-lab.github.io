/**
 * Neural Connection Flow — Interactive Particle Background
 * =========================================================
 * High-performance Canvas particle system with neural-network-style connections.
 *
 * TUNING GUIDE:
 * - PARTICLE_COUNT : Number of nodes. 80-120 = elegant, 150+ = dense galaxy effect
 * - CONNECTION_RADIUS : Max distance for inter-particle links (px). Lower = sparser
 * - MOUSE_RADIUS : Influence zone of the cursor. 200-300 = subtle, 400+ = dramatic
 * - PARTICLE_SPEED : Max velocity. 0.3 = calm, 1.0+ = energetic
 * - FLOW_SPEED : Speed of data-pulse traveling along connection lines
 */

; (function NeuralConnectionFlow() {
    'use strict';

    // ── Configuration ──────────────────────────────────
    const CONFIG = {
        PARTICLE_COUNT: 90,        // sweet-spot for 1080p
        CONNECTION_RADIUS: 180,    // px – links appear below this distance
        MOUSE_RADIUS: 280,         // px – cursor magnetic field
        PARTICLE_SPEED: 0.35,      // max velocity per axis
        MIN_SIZE: 2,
        MAX_SIZE: 4.5,
        FLOW_SPEED: 0.008,         // speed of "data pulse" animation
        GLOW_BLUR: 12,             // canvas shadow blur for nodes
        LINE_WIDTH_BASE: 0.6,
        LINE_WIDTH_MOUSE: 1.2,
    };

    // ── Colors ─────────────────────────────────────────
    const VIOLET = { r: 123, g: 97, b: 255 };  // #7B61FF
    const CYAN = { r: 6, g: 182, b: 212 };  // #06B6D4
    const PINK = { r: 168, g: 85, b: 247 };  // accent

    // ── Canvas Setup ───────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.id = 'neuralCanvas';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let W, H;
    let particles = [];
    let mouse = { x: -9999, y: -9999, active: false };
    let time = 0;

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    // ── Particle Factory ───────────────────────────────
    function createParticle() {
        const colorMix = Math.random();
        let color;
        if (colorMix < 0.45) {
            color = VIOLET;
        } else if (colorMix < 0.85) {
            color = CYAN;
        } else {
            color = PINK;
        }

        return {
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * CONFIG.PARTICLE_SPEED * 2,
            vy: (Math.random() - 0.5) * CONFIG.PARTICLE_SPEED * 2,
            size: CONFIG.MIN_SIZE + Math.random() * (CONFIG.MAX_SIZE - CONFIG.MIN_SIZE),
            color: color,
            alpha: 0.4 + Math.random() * 0.5,
            pulseOffset: Math.random() * Math.PI * 2,
            isHex: Math.random() > 0.7,  // 30% chance of hexagonal node
        };
    }

    function initParticles() {
        particles = [];
        const count = Math.min(CONFIG.PARTICLE_COUNT, Math.floor((W * H) / 14000));
        for (let i = 0; i < count; i++) {
            particles.push(createParticle());
        }
    }

    // ── Drawing Helpers ────────────────────────────────
    function drawHexagon(cx, cy, r) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const px = cx + r * Math.cos(angle);
            const py = cy + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
    }

    function drawNode(p) {
        const pulse = 0.85 + 0.15 * Math.sin(time * 2 + p.pulseOffset);
        const r = p.size * pulse;
        const { r: cr, g: cg, b: cb } = p.color;
        const alpha = p.alpha * pulse;

        // Glow
        ctx.shadowColor = `rgba(${cr}, ${cg}, ${cb}, ${alpha * 0.6})`;
        ctx.shadowBlur = CONFIG.GLOW_BLUR;

        ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha})`;

        if (p.isHex) {
            drawHexagon(p.x, p.y, r * 1.2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Inner bright core
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(${Math.min(cr + 80, 255)}, ${Math.min(cg + 80, 255)}, ${Math.min(cb + 80, 255)}, ${alpha * 0.7})`;
        if (p.isHex) {
            drawHexagon(p.x, p.y, r * 0.45);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, r * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawConnection(x1, y1, x2, y2, dist, maxDist, isMouse) {
        const proximity = 1 - dist / maxDist;
        const baseAlpha = isMouse ? 0.35 : 0.15;
        const alpha = baseAlpha * proximity;
        const lineWidth = isMouse ? CONFIG.LINE_WIDTH_MOUSE : CONFIG.LINE_WIDTH_BASE;

        // Flow pulse — animated "data traveling" effect
        const flowPos = (time * CONFIG.FLOW_SPEED * (isMouse ? 3 : 1)) % 1;
        const dx = x2 - x1;
        const dy = y2 - y1;

        // Base line
        ctx.strokeStyle = isMouse
            ? `rgba(123, 97, 255, ${alpha})`
            : `rgba(6, 182, 212, ${alpha * 0.7})`;
        ctx.lineWidth = lineWidth * proximity;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Data flow pulse dot
        if (proximity > 0.3) {
            const pulseAlpha = alpha * 2.5 * proximity;
            const fx = x1 + dx * flowPos;
            const fy = y1 + dy * flowPos;
            const pulseSize = isMouse ? 2.5 : 1.5;

            ctx.shadowColor = isMouse
                ? `rgba(123, 97, 255, ${pulseAlpha})`
                : `rgba(6, 182, 212, ${pulseAlpha})`;
            ctx.shadowBlur = 8;

            ctx.fillStyle = isMouse
                ? `rgba(167, 139, 250, ${pulseAlpha})`
                : `rgba(103, 232, 249, ${pulseAlpha})`;
            ctx.beginPath();
            ctx.arc(fx, fy, pulseSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Second pulse, offset
            const flowPos2 = (flowPos + 0.5) % 1;
            const fx2 = x1 + dx * flowPos2;
            const fy2 = y1 + dy * flowPos2;
            ctx.fillStyle = isMouse
                ? `rgba(123, 97, 255, ${pulseAlpha * 0.5})`
                : `rgba(6, 182, 212, ${pulseAlpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(fx2, fy2, pulseSize * 0.7, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ── Physics Update ─────────────────────────────────
    function updateParticle(p) {
        // Organic drift with slight sine wobble
        p.x += p.vx + Math.sin(time + p.pulseOffset) * 0.08;
        p.y += p.vy + Math.cos(time * 0.7 + p.pulseOffset) * 0.08;

        // Soft boundary wrapping with padding
        const pad = 50;
        if (p.x < -pad) p.x = W + pad;
        if (p.x > W + pad) p.x = -pad;
        if (p.y < -pad) p.y = H + pad;
        if (p.y > H + pad) p.y = -pad;

        // Gentle mouse repulsion / attraction
        if (mouse.active) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < CONFIG.MOUSE_RADIUS * 0.4 && dist > 0) {
                // Slight push away from cursor center
                const force = 0.15 * (1 - dist / (CONFIG.MOUSE_RADIUS * 0.4));
                p.vx += (dx / dist) * force;
                p.vy += (dy / dist) * force;
            }
        }

        // Velocity damping
        p.vx *= 0.998;
        p.vy *= 0.998;

        // Clamp speed
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > CONFIG.PARTICLE_SPEED) {
            p.vx = (p.vx / speed) * CONFIG.PARTICLE_SPEED;
            p.vy = (p.vy / speed) * CONFIG.PARTICLE_SPEED;
        }
    }

    // ── Main Render Loop ───────────────────────────────
    function render() {
        ctx.clearRect(0, 0, W, H);
        time += 0.016; // ~60fps time step

        // Update positions
        for (let i = 0; i < particles.length; i++) {
            updateParticle(particles[i]);
        }

        // Draw connections (particle-to-particle)
        ctx.shadowBlur = 0;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < CONFIG.CONNECTION_RADIUS) {
                    drawConnection(
                        particles[i].x, particles[i].y,
                        particles[j].x, particles[j].y,
                        dist, CONFIG.CONNECTION_RADIUS, false
                    );
                }
            }
        }

        // Draw mouse connections
        if (mouse.active) {
            for (let i = 0; i < particles.length; i++) {
                const dx = particles[i].x - mouse.x;
                const dy = particles[i].y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < CONFIG.MOUSE_RADIUS) {
                    drawConnection(
                        mouse.x, mouse.y,
                        particles[i].x, particles[i].y,
                        dist, CONFIG.MOUSE_RADIUS, true
                    );
                }
            }

            // Draw mouse node
            ctx.shadowColor = 'rgba(123, 97, 255, 0.6)';
            ctx.shadowBlur = 20;
            ctx.fillStyle = 'rgba(123, 97, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Mouse outer ring
            const ringPulse = 0.8 + 0.2 * Math.sin(time * 3);
            ctx.strokeStyle = `rgba(167, 139, 250, ${0.2 * ringPulse})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 16 * ringPulse, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw nodes on top
        for (let i = 0; i < particles.length; i++) {
            drawNode(particles[i]);
        }

        requestAnimationFrame(render);
    }

    // ── Event Listeners ────────────────────────────────
    window.addEventListener('resize', () => {
        resize();
        initParticles();
    });

    document.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;
    });

    document.addEventListener('mouseleave', () => {
        mouse.active = false;
    });

    // Touch support
    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
            mouse.active = true;
        }
    }, { passive: true });

    document.addEventListener('touchend', () => {
        mouse.active = false;
    });

    // ── Boot ───────────────────────────────────────────
    resize();
    initParticles();
    render();

})();
