// Export game classes for testing
// This file extracts the classes from game.js for testing purposes

export class Particle {
    constructor(x, y, velocityX, velocityY, life, color, type, size = 4) {
        this.x = x;
        this.y = y;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.life = life;
        this.maxLife = life;
        this.color = color;
        this.type = type;
        this.size = size;
        this.alpha = 1.0;
    }
    
    update(deltaTime) {
        // Update position based on velocity
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        // Decrease life over time
        this.life -= deltaTime;
        
        // Update alpha based on remaining life for fade effect
        this.alpha = Math.max(0, this.life / this.maxLife);
        
        // Special twinkling animation for sparkle particles
        if (this.type === 'sparkle' && this.twinkleSpeed) {
            // Create twinkling effect by modulating alpha with sine wave
            const twinkleTime = (this.maxLife - this.life) * this.twinkleSpeed + this.twinkleOffset;
            const twinkleAlpha = 0.3 + 0.7 * (Math.sin(twinkleTime) * 0.5 + 0.5);
            this.alpha *= twinkleAlpha;
            
            // Add gentle floating motion for sparkles
            this.velocityY += Math.sin(twinkleTime * 0.5) * 0.01;
        }
        
        // Apply gravity for certain particle types
        if (this.type === 'explosion' || this.type === 'confetti') {
            this.velocityY += 0.3 * deltaTime; // Gravity effect
        }
        
        // Apply air resistance for realistic physics
        this.velocityX *= 0.98;
        this.velocityY *= 0.98;
    }
    
    render(ctx) {
        if (this.isDead()) return;
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        switch (this.type) {
            case 'trail':
                // Simple circular trail particles
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'explosion':
                // Square explosion particles with outward motion
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
                break;
                
            case 'sparkle':
                // Star-shaped sparkle particles
                ctx.fillStyle = this.color;
                this.drawStar(ctx, this.x, this.y, this.size);
                break;
                
            case 'confetti':
                // Rectangular confetti pieces
                ctx.fillStyle = this.color;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.life * 0.1); // Rotating effect
                ctx.fillRect(-this.size/2, -this.size/4, this.size, this.size/2);
                ctx.restore();
                break;
                
            default:
                // Default circular particle
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
        }
        
        ctx.restore();
    }
    
    drawStar(ctx, x, y, size) {
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size * 0.5;
        
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
            const starX = x + Math.cos(angle) * radius;
            const starY = y + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(starX, starY);
            } else {
                ctx.lineTo(starX, starY);
            }
        }
        ctx.closePath();
        ctx.fill();
    }
    
    isDead() {
        return this.life <= 0;
    }
}

export class ParticleSystem {
    constructor(ctx) {
        this.ctx = ctx;
        this.particles = [];
        this.maxParticles = 200; // Performance limit
        
        // Object pooling for performance optimization
        this.particlePool = [];
        this.poolSize = 300; // Pool size larger than max active particles
        this.initializePool();
        
        // Performance monitoring
        this.performanceStats = {
            frameCount: 0,
            lastFPSCheck: Date.now(),
            currentFPS: 60,
            particleCreationCount: 0,
            poolHits: 0,
            poolMisses: 0
        };
        
        // Batch rendering optimization
        this.renderBatches = {
            trail: [],
            explosion: [],
            sparkle: [],
            confetti: []
        };
    }
    
    // Initialize object pool with pre-created particles
    initializePool() {
        for (let i = 0; i < this.poolSize; i++) {
            this.particlePool.push(new Particle(0, 0, 0, 0, 0, '#FFFFFF', 'trail'));
        }
    }
    
    // Get particle from pool or create new one if pool is empty
    getParticleFromPool() {
        if (this.particlePool.length > 0) {
            this.performanceStats.poolHits++;
            return this.particlePool.pop();
        } else {
            this.performanceStats.poolMisses++;
            return new Particle(0, 0, 0, 0, 0, '#FFFFFF', 'trail');
        }
    }
    
    // Return particle to pool for reuse
    returnParticleToPool(particle) {
        if (this.particlePool.length < this.poolSize) {
            // Reset particle properties for reuse
            particle.life = 0;
            particle.alpha = 1.0;
            this.particlePool.push(particle);
        }
    }
    
    // Monitor performance and adjust particle limits dynamically
    updatePerformanceStats() {
        this.performanceStats.frameCount++;
        const now = Date.now();
        
        if (now - this.performanceStats.lastFPSCheck >= 1000) {
            this.performanceStats.currentFPS = this.performanceStats.frameCount;
            this.performanceStats.frameCount = 0;
            this.performanceStats.lastFPSCheck = now;
            
            // Dynamic particle limit adjustment based on performance
            if (this.performanceStats.currentFPS < 45) {
                // Reduce particle limit if FPS drops below 45
                this.maxParticles = Math.max(100, this.maxParticles - 20);
            } else if (this.performanceStats.currentFPS > 55 && this.maxParticles < 200) {
                // Increase particle limit if FPS is good and we're below default
                this.maxParticles = Math.min(200, this.maxParticles + 10);
            }
        }
    }
    
    createTrailParticle(x, y, velocityX, velocityY) {
        if (this.particles.length >= this.maxParticles) return;
        
        // Use object pooling for performance
        const particle = this.getParticleFromPool();
        
        // Create trail particle with Kiro brand colors
        const colors = ['#FF8C00', '#FFA500', '#FFB84D'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // Reinitialize pooled particle
        particle.x = x + Math.random() * 8 - 4; // Small random offset
        particle.y = y + Math.random() * 8 - 4;
        particle.velocityX = velocityX * 0.3 + (Math.random() - 0.5) * 2; // Inherit some velocity
        particle.velocityY = velocityY * 0.3 + (Math.random() - 0.5) * 2;
        particle.life = 1000 + Math.random() * 500; // Life in milliseconds
        particle.maxLife = particle.life;
        particle.color = color;
        particle.type = 'trail';
        particle.size = 2 + Math.random() * 2; // Size variation
        particle.alpha = 1.0;
        
        this.particles.push(particle);
        this.performanceStats.particleCreationCount++;
    }
    
    createExplosionParticles(x, y, count, colors = ['#FF8C00', '#FFA500', '#FFB84D']) {
        // Limit particle creation based on current performance
        const actualCount = Math.min(count, this.maxParticles - this.particles.length);
        
        for (let i = 0; i < actualCount; i++) {
            const particle = this.getParticleFromPool();
            
            const angle = (Math.PI * 2 * i) / actualCount + Math.random() * 0.5;
            const speed = 3 + Math.random() * 4;
            
            // Reinitialize pooled particle
            particle.x = x;
            particle.y = y;
            particle.velocityX = Math.cos(angle) * speed; // Outward motion
            particle.velocityY = Math.sin(angle) * speed;
            particle.life = 800 + Math.random() * 400; // Life in milliseconds
            particle.maxLife = particle.life;
            particle.color = colors[Math.floor(Math.random() * colors.length)];
            particle.type = 'explosion';
            particle.size = 3 + Math.random() * 3;
            particle.alpha = 1.0;
            
            this.particles.push(particle);
            this.performanceStats.particleCreationCount++;
        }
    }
    
    createSparkleParticles(x, y, count) {
        // Use bright, contrasting colors for visibility as specified in requirements
        const sparkleColors = ['#FFFFFF', '#FFD700', '#FFFF00', '#00FFFF', '#FF00FF', '#00FF00'];
        
        // Limit particle creation based on current performance
        const actualCount = Math.min(count, this.maxParticles - this.particles.length);
        
        for (let i = 0; i < actualCount; i++) {
            const particle = this.getParticleFromPool();
            
            // Reinitialize pooled particle
            particle.x = x + (Math.random() - 0.5) * 30; // Wider spread for better visibility
            particle.y = y + (Math.random() - 0.5) * 30;
            particle.velocityX = (Math.random() - 0.5) * 1.5; // Gentle floating motion
            particle.velocityY = -Math.random() * 1.5 - 0.5; // Gentle upward motion
            particle.life = 2000 + Math.random() * 1500; // Longer life for sparkles to be more visible
            particle.maxLife = particle.life;
            particle.color = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];
            particle.type = 'sparkle';
            particle.size = 3 + Math.random() * 3; // Larger size for better visibility
            particle.alpha = 1.0;
            
            // Add twinkling properties for animation
            particle.twinkleSpeed = 0.05 + Math.random() * 0.1;
            particle.twinkleOffset = Math.random() * Math.PI * 2;
            
            this.particles.push(particle);
            this.performanceStats.particleCreationCount++;
        }
    }
    
    createConfettiParticles(x, y, count, colors = ['#FF8C00', '#FFA500', '#FFB84D', '#FFFFFF']) {
        // Limit particle creation based on current performance
        const actualCount = Math.min(count, this.maxParticles - this.particles.length);
        
        for (let i = 0; i < actualCount; i++) {
            const particle = this.getParticleFromPool();
            
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            
            // Reinitialize pooled particle
            particle.x = x;
            particle.y = y;
            particle.velocityX = Math.cos(angle) * speed;
            particle.velocityY = Math.sin(angle) * speed - 3; // Initial upward motion
            particle.life = 2000 + Math.random() * 1000; // Long life for celebration
            particle.maxLife = particle.life;
            particle.color = colors[Math.floor(Math.random() * colors.length)];
            particle.type = 'confetti';
            particle.size = 4 + Math.random() * 4;
            particle.alpha = 1.0;
            
            this.particles.push(particle);
            this.performanceStats.particleCreationCount++;
        }
    }
    
    update(deltaTime) {
        // Update performance monitoring
        this.updatePerformanceStats();
        
        // Update all particles
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].update(deltaTime);
        }
        
        // Remove dead particles for memory management and return to pool
        this.cleanup();
    }
    
    render(ctx, camera) {
        ctx.save();
        
        // Apply camera transform for world-space particles
        ctx.translate(-camera.x, -camera.y);
        
        // Render all particles
        for (let particle of this.particles) {
            particle.render(ctx);
        }
        
        ctx.restore();
    }
    
    cleanup() {
        // Remove dead particles and return them to pool for reuse
        const aliveParticles = [];
        
        for (let particle of this.particles) {
            if (particle.isDead()) {
                // Return dead particle to pool for reuse
                this.returnParticleToPool(particle);
            } else {
                aliveParticles.push(particle);
            }
        }
        
        this.particles = aliveParticles;
    }
    
    // Get current particle count for debugging/performance monitoring
    getParticleCount() {
        return this.particles.length;
    }
    
    // Clear all particles (useful for level transitions)
    clear() {
        // Return all particles to pool before clearing
        for (let particle of this.particles) {
            this.returnParticleToPool(particle);
        }
        this.particles = [];
    }
    
    // Get performance statistics for monitoring
    getPerformanceStats() {
        return {
            ...this.performanceStats,
            activeParticles: this.particles.length,
            poolSize: this.particlePool.length,
            maxParticles: this.maxParticles,
            poolUtilization: ((this.poolSize - this.particlePool.length) / this.poolSize * 100).toFixed(1) + '%'
        };
    }
    
    // Force performance optimization by reducing particle count
    optimizePerformance() {
        if (this.particles.length > this.maxParticles * 0.8) {
            // Remove oldest particles first (they're likely to expire soon anyway)
            const particlesToRemove = Math.floor(this.particles.length * 0.2);
            
            for (let i = 0; i < particlesToRemove; i++) {
                const particle = this.particles.shift();
                if (particle) {
                    this.returnParticleToPool(particle);
                }
            }
        }
    }
}

// Mock player object for testing
export function createMockPlayer(x = 100, y = 400, velocityX = 0, velocityY = 0) {
    return {
        x,
        y,
        width: 32,
        height: 32,
        velocityX,
        velocityY,
        speed: 5,
        flyPower: 8,
        maxFlySpeed: 6,
        onGround: false,
        color: '#FF8C00',
        canFly: true
    };
}

// Score Persistence Manager for localStorage operations
export class ScorePersistence {
    constructor() {
        this.storageKey = 'superKiroWorld';
        this.defaultData = {
            currentScore: 0,
            highScore: 0,
            lastPlayed: null,
            gamesPlayed: 0
        };
    }
    
    // Check if localStorage is available
    isLocalStorageAvailable() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('localStorage is not available:', e.message);
            return false;
        }
    }
    
    // Get stored data or return defaults
    getData() {
        if (!this.isLocalStorageAvailable()) {
            return { ...this.defaultData };
        }
        
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) {
                return { ...this.defaultData };
            }
            
            const data = JSON.parse(stored);
            
            // Validate data structure and handle corrupted data
            if (typeof data !== 'object' || 
                typeof data.highScore !== 'number' || 
                typeof data.gamesPlayed !== 'number') {
                console.warn('Corrupted score data detected, resetting to defaults');
                this.handleCorruptedData();
                return { ...this.defaultData };
            }
            
            return data;
        } catch (e) {
            console.warn('Error reading score data:', e.message);
            this.handleCorruptedData();
            return { ...this.defaultData };
        }
    }
    
    // Save data to localStorage
    saveData(data) {
        if (!this.isLocalStorageAvailable()) {
            console.log('localStorage unavailable, running in session-only mode');
            return false;
        }
        
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (e) {
            console.warn('Error saving score data:', e.message);
            return false;
        }
    }
    
    // Save current score immediately on game over
    saveScore(score) {
        const data = this.getData();
        data.currentScore = score;
        data.lastPlayed = Date.now();
        data.gamesPlayed++;
        
        return this.saveData(data);
    }
    
    // Update high score if current score is higher
    saveHighScore(score) {
        const data = this.getData();
        
        if (score > data.highScore) {
            data.highScore = score;
            data.currentScore = score;
            data.lastPlayed = Date.now();
            data.gamesPlayed++;
            
            console.log(`New high score achieved: ${score}`);
            return this.saveData(data);
        }
        
        return false; // No new high score
    }
    
    // Get stored high score
    getHighScore() {
        const data = this.getData();
        return data.highScore;
    }
    
    // Get current score
    getCurrentScore() {
        const data = this.getData();
        return data.currentScore;
    }
    
    // Get games played count
    getGamesPlayed() {
        const data = this.getData();
        return data.gamesPlayed;
    }
    
    // Handle corrupted data by resetting to defaults
    handleCorruptedData() {
        if (this.isLocalStorageAvailable()) {
            try {
                localStorage.removeItem(this.storageKey);
                console.log('Corrupted data cleared, reset to defaults');
            } catch (e) {
                console.warn('Error clearing corrupted data:', e.message);
            }
        }
    }
    
    // Check if a score would be a new high score
    isNewHighScore(score) {
        return score > this.getHighScore();
    }
}

// Asset Manager for handling image loading and fallback rendering
export class AssetManager {
    constructor() {
        this.images = new Map();
        this.loadingStates = new Map();
    }
    
    loadImage(key, src, fallbackRenderer = null) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (this.images.has(key)) {
                resolve(this.images.get(key));
                return;
            }
            
            // Set loading state
            this.loadingStates.set(key, 'loading');
            
            const img = new Image();
            
            img.onload = () => {
                this.images.set(key, img);
                this.loadingStates.set(key, 'loaded');
                console.log(`Asset loaded successfully: ${key} (${img.width}x${img.height})`);
                resolve(img);
            };
            
            img.onerror = () => {
                console.warn(`Failed to load asset: ${key} from ${src}`);
                this.loadingStates.set(key, 'error');
                
                // Store fallback renderer if provided
                if (fallbackRenderer) {
                    this.images.set(key, { fallback: true, renderer: fallbackRenderer });
                    console.log(`Using fallback renderer for: ${key}`);
                    resolve(this.images.get(key));
                } else {
                    reject(new Error(`Failed to load image: ${key}`));
                }
            };
            
            // Start loading
            img.src = src;
        });
    }
    
    isLoaded(key) {
        return this.loadingStates.get(key) === 'loaded' || 
               (this.images.has(key) && this.images.get(key).fallback);
    }
    
    getImage(key) {
        return this.images.get(key);
    }
    
    hasError(key) {
        return this.loadingStates.get(key) === 'error';
    }
    
    isLoading(key) {
        return this.loadingStates.get(key) === 'loading';
    }
    
    // Get optimal dimensions for gameplay while maintaining aspect ratio
    getOptimalDimensions(key, targetWidth, targetHeight) {
        const asset = this.getImage(key);
        
        if (!asset || asset.fallback) {
            // Return target dimensions for fallback
            return { width: targetWidth, height: targetHeight };
        }
        
        const imgAspectRatio = asset.width / asset.height;
        const targetAspectRatio = targetWidth / targetHeight;
        
        if (imgAspectRatio > targetAspectRatio) {
            // Image is wider - fit to width
            return {
                width: targetWidth,
                height: targetWidth / imgAspectRatio
            };
        } else {
            // Image is taller - fit to height
            return {
                width: targetHeight * imgAspectRatio,
                height: targetHeight
            };
        }
    }
    
    // Render image or fallback with aspect ratio preservation
    renderImage(ctx, key, x, y, width, height, maintainAspectRatio = true) {
        const asset = this.getImage(key);
        
        if (!asset) {
            // No asset available, render basic fallback
            ctx.fillStyle = '#FF8C00';
            ctx.fillRect(x, y, width, height);
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
            return { rendered: 'fallback', x, y, width, height };
        }
        
        if (asset.fallback) {
            // Use custom fallback renderer
            asset.renderer(ctx, x, y, width, height);
            return { rendered: 'fallback', x, y, width, height };
        } else {
            // Render actual image with proper scaling and aspect ratio preservation
            if (maintainAspectRatio) {
                const imgAspectRatio = asset.width / asset.height;
                const targetAspectRatio = width / height;
                
                let renderWidth = width;
                let renderHeight = height;
                let renderX = x;
                let renderY = y;
                
                if (imgAspectRatio > targetAspectRatio) {
                    // Image is wider than target - fit to width
                    renderHeight = width / imgAspectRatio;
                    renderY = y + (height - renderHeight) / 2;
                } else {
                    // Image is taller than target - fit to height
                    renderWidth = height * imgAspectRatio;
                    renderX = x + (width - renderWidth) / 2;
                }
                
                ctx.drawImage(asset, renderX, renderY, renderWidth, renderHeight);
                return { 
                    rendered: 'sprite', 
                    x: renderX, 
                    y: renderY, 
                    width: renderWidth, 
                    height: renderHeight,
                    aspectRatio: renderWidth / renderHeight,
                    originalAspectRatio: imgAspectRatio
                };
            } else {
                // Stretch to fit exact dimensions
                ctx.drawImage(asset, x, y, width, height);
                return { 
                    rendered: 'sprite', 
                    x, 
                    y, 
                    width, 
                    height,
                    aspectRatio: width / height,
                    originalAspectRatio: asset.width / asset.height
                };
            }
        }
    }
}

// Mock context for testing
export function createMockContext() {
    const calls = [];
    return {
        fillRect: vi.fn((x, y, w, h) => calls.push({ type: 'fillRect', x, y, w, h })),
        strokeRect: vi.fn((x, y, w, h) => calls.push({ type: 'strokeRect', x, y, w, h })),
        fillText: vi.fn(),
        drawImage: vi.fn((img, x, y, w, h) => calls.push({ type: 'drawImage', img, x, y, w, h })),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        clearRect: vi.fn(),
        measureText: vi.fn(() => ({ width: 100 })),
        fillStyle: '#000000',
        strokeStyle: '#000000',
        lineWidth: 1,
        font: '12px Arial',
        textAlign: 'left',
        textBaseline: 'top',
        globalAlpha: 1,
        _calls: calls
    };
}