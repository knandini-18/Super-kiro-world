// Super Kiro World - A 2D Platformer Game

// Particle class with lifecycle management
class Particle {
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

// Particle System class with performance optimization and object pooling
class ParticleSystem {
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
                console.log(`Performance optimization: Reduced particle limit to ${this.maxParticles} (FPS: ${this.performanceStats.currentFPS})`);
            } else if (this.performanceStats.currentFPS > 55 && this.maxParticles < 200) {
                // Increase particle limit if FPS is good and we're below default
                this.maxParticles = Math.min(200, this.maxParticles + 10);
                console.log(`Performance optimization: Increased particle limit to ${this.maxParticles} (FPS: ${this.performanceStats.currentFPS})`);
            }
            
            // Log performance stats occasionally
            if (this.performanceStats.frameCount % 300 === 0) {
                console.log(`Particle System Performance: FPS=${this.performanceStats.currentFPS}, Active=${this.particles.length}, Pool Hits=${this.performanceStats.poolHits}, Pool Misses=${this.performanceStats.poolMisses}`);
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
        
        // Batch particles by type for optimized rendering
        this.prepareBatchedRendering();
        
        // Render particles in batches for better performance
        // First render non-sparkle particles in batches
        this.renderBatch(ctx, 'trail');
        this.renderBatch(ctx, 'explosion');
        this.renderBatch(ctx, 'confetti');
        
        // Then render sparkle particles above other particles for prominence (requirement 5.5)
        this.renderBatch(ctx, 'sparkle');
        
        ctx.restore();
    }
    
    // Prepare particles for batched rendering
    prepareBatchedRendering() {
        // Clear previous batches
        this.renderBatches.trail.length = 0;
        this.renderBatches.explosion.length = 0;
        this.renderBatches.sparkle.length = 0;
        this.renderBatches.confetti.length = 0;
        
        // Sort particles into batches by type
        for (let particle of this.particles) {
            if (!particle.isDead() && this.renderBatches[particle.type]) {
                this.renderBatches[particle.type].push(particle);
            }
        }
    }
    
    // Render a batch of particles of the same type for optimization
    renderBatch(ctx, type) {
        const batch = this.renderBatches[type];
        if (batch.length === 0) return;
        
        // Optimize rendering by setting common properties once per batch
        ctx.save();
        
        switch (type) {
            case 'trail':
                // Batch render trail particles as circles
                for (let particle of batch) {
                    ctx.globalAlpha = particle.alpha;
                    ctx.fillStyle = particle.color;
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case 'explosion':
                // Batch render explosion particles as squares
                for (let particle of batch) {
                    ctx.globalAlpha = particle.alpha;
                    ctx.fillStyle = particle.color;
                    ctx.fillRect(particle.x - particle.size/2, particle.y - particle.size/2, particle.size, particle.size);
                }
                break;
                
            case 'sparkle':
                // Render sparkle particles individually due to complex star shape
                for (let particle of batch) {
                    particle.render(ctx);
                }
                break;
                
            case 'confetti':
                // Render confetti particles individually due to rotation
                for (let particle of batch) {
                    particle.render(ctx);
                }
                break;
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
            
            console.log(`Performance optimization: Removed ${particlesToRemove} particles`);
        }
    }
    
    // Test performance under high particle loads
    stressTest(duration = 5000) {
        console.log('Starting particle system stress test...');
        const startTime = Date.now();
        const testInterval = setInterval(() => {
            // Create many particles to test performance
            this.createExplosionParticles(400, 300, 20, ['#FF0000', '#00FF00', '#0000FF']);
            this.createTrailParticle(400, 300, Math.random() * 10 - 5, Math.random() * 10 - 5);
            this.createSparkleParticles(400, 300, 5);
            
            const elapsed = Date.now() - startTime;
            if (elapsed >= duration) {
                clearInterval(testInterval);
                console.log('Stress test completed. Performance stats:', this.getPerformanceStats());
            }
        }, 16); // ~60 FPS
    }
}

// Score Persistence Manager for localStorage operations
class ScorePersistence {
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
class AssetManager {
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

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Game state
        this.score = 0;
        this.lives = 5;
        this.level = 1;
        this.gameOver = false;
        this.levelComplete = false;
        this.assetsLoaded = false;
        this.highScore = 0;
        
        // Camera
        this.camera = { x: 0, y: 0 };
        
        // Input handling
        this.keys = {};
        this.setupInput();
        
        // Initialize asset manager
        this.assetManager = new AssetManager();
        
        // Initialize score persistence system
        this.scorePersistence = new ScorePersistence();
        
        // Initialize particle system
        this.particleSystem = new ParticleSystem(this.ctx);
        
        // Confetti celebration state
        this.confettiCelebration = {
            active: false,
            duration: 3000, // 3 seconds celebration duration
            startTime: 0,
            confettiCount: 50 // Number of confetti particles to create
        };
        
        // Retrieve and display stored high score on game start
        this.highScore = this.scorePersistence.getHighScore();
        
        // Load assets and then initialize game
        this.loadAssets().then(() => {
            this.assetsLoaded = true;
            this.initializeLevel();
            this.gameLoop();
        }).catch((error) => {
            console.error('Asset loading failed:', error);
            // Continue with fallback rendering
            this.assetsLoaded = true;
            this.initializeLevel();
            this.gameLoop();
        });
    }
    
    async loadAssets() {
        // Define fallback renderer for Kiro logo
        const kiroFallbackRenderer = (ctx, x, y, width, height) => {
            // Draw Kiro-style character with brand colors and proper proportions
            ctx.fillStyle = '#FF8C00';
            ctx.fillRect(x, y, width, height);
            
            // Add border with rounded corners effect
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
            
            // Add inner highlight for depth
            ctx.fillStyle = '#FFB84D';
            ctx.fillRect(x + 2, y + 2, width - 4, height * 0.3);
            
            // Add simple "K" letter in center with better styling
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `bold ${Math.floor(height * 0.5)}px Courier New`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('K', x + width/2, y + height/2);
            
            // Add shadow for the letter
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillText('K', x + width/2 + 1, y + height/2 + 1);
        };
        
        // Load Kiro logo with fallback
        try {
            await this.assetManager.loadImage('kiroLogo', 'kiro-logo.png', kiroFallbackRenderer);
            console.log('Kiro logo loaded successfully');
        } catch (error) {
            console.log('Using fallback renderer for Kiro logo');
        }
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    initializeLevel() {
        // Player setup (Flying Kiro)
        this.player = {
            x: 100,
            y: 400,
            width: 32,
            height: 32,
            velocityX: 0,
            velocityY: 0,
            speed: 5,
            flyPower: 8,
            maxFlySpeed: 6,
            onGround: false,
            color: '#FF8C00',
            canFly: true
        };
        
        // Level platforms
        this.platforms = [
            // Ground platforms
            { x: 0, y: 550, width: 300, height: 50 },
            { x: 400, y: 550, width: 200, height: 50 },
            { x: 700, y: 550, width: 300, height: 50 },
            { x: 1100, y: 550, width: 400, height: 50 },
            
            // Floating platforms
            { x: 350, y: 450, width: 100, height: 20 },
            { x: 550, y: 400, width: 100, height: 20 },
            { x: 750, y: 350, width: 100, height: 20 },
            { x: 950, y: 300, width: 100, height: 20 },
            { x: 1200, y: 250, width: 150, height: 20 },
            { x: 1450, y: 200, width: 100, height: 20 },
            
            // Higher platforms
            { x: 200, y: 300, width: 80, height: 20 },
            { x: 500, y: 250, width: 80, height: 20 },
            { x: 800, y: 200, width: 80, height: 20 },
            { x: 1300, y: 150, width: 100, height: 20 }
        ];
        
        // Collectible gems and power-ups
        this.collectibles = [
            { x: 150, y: 500, width: 16, height: 16, collected: false, type: 'gem' },
            { x: 380, y: 410, width: 16, height: 16, collected: false, type: 'gem' },
            { x: 580, y: 360, width: 16, height: 16, collected: false, type: 'gem' },
            { x: 780, y: 310, width: 16, height: 16, collected: false, type: 'gem' },
            { x: 980, y: 260, width: 16, height: 16, collected: false, type: 'gem' },
            { x: 1230, y: 210, width: 16, height: 16, collected: false, type: 'gem' },
            { x: 1480, y: 160, width: 16, height: 16, collected: false, type: 'gem' },
            { x: 230, y: 260, width: 16, height: 16, collected: false, type: 'gem' },
            { x: 530, y: 210, width: 16, height: 16, collected: false, type: 'gem' },
            { x: 830, y: 160, width: 16, height: 16, collected: false, type: 'gem' }
        ];
        
        // Power-ups
        this.powerUps = [
            { x: 450, y: 300, width: 20, height: 20, collected: false, type: 'speed' },
            { x: 850, y: 150, width: 20, height: 20, collected: false, type: 'life' },
            { x: 1300, y: 100, width: 20, height: 20, collected: false, type: 'score' }
        ];
        
        // Level goal (flag)
        this.goal = { x: 1400, y: 100, width: 32, height: 50 };
        
        // Obstacle areas for sparkle effects (designated areas that trigger sparkles when player passes through)
        this.obstacleAreas = [
            // Narrow passages between platforms
            { x: 300, y: 450, width: 100, height: 100, name: 'gap1' },
            { x: 600, y: 350, width: 150, height: 150, name: 'gap2' },
            { x: 850, y: 250, width: 100, height: 200, name: 'gap3' },
            { x: 1050, y: 200, width: 150, height: 100, name: 'gap4' },
            { x: 1350, y: 150, width: 100, height: 150, name: 'gap5' },
            
            // Challenging navigation areas around floating platforms
            { x: 450, y: 380, width: 200, height: 70, name: 'challenge1' },
            { x: 750, y: 280, width: 200, height: 120, name: 'challenge2' },
            { x: 1150, y: 180, width: 250, height: 120, name: 'challenge3' }
        ];
        
        // Track which obstacle areas player is currently in for sparkle generation
        this.playerInObstacleAreas = new Set();
        
        // Level boundaries
        this.levelWidth = 1600;
        this.levelHeight = 600;
    }
    
    update() {
        if (this.gameOver || this.levelComplete) return;
        
        this.handleInput();
        this.updatePlayer();
        this.updateCamera();
        this.checkCollisions();
        this.checkObstacleAreas();
        this.checkGoal();
        this.updateUI();
        
        // Update particle system with delta time (assuming 60 FPS = ~16.67ms per frame)
        this.particleSystem.update(16.67);
        
        // Update confetti celebration system
        this.updateConfettiCelebration();
        
        // Performance monitoring and optimization
        if (this.debugFrameCount === undefined) this.debugFrameCount = 0;
        this.debugFrameCount++;
        
        // Log performance stats occasionally (every 300 frames = ~5 seconds)
        if (this.debugFrameCount % 300 === 0 && this.particleSystem.getParticleCount() > 0) {
            const stats = this.particleSystem.getPerformanceStats();
            console.log(`Particle Performance: FPS=${stats.currentFPS}, Active=${stats.activeParticles}/${stats.maxParticles}, Pool=${stats.poolUtilization}`);
        }
        
        // Automatic performance optimization if needed
        if (this.debugFrameCount % 120 === 0) { // Check every 2 seconds
            const stats = this.particleSystem.getPerformanceStats();
            if (stats.currentFPS < 50 && stats.activeParticles > stats.maxParticles * 0.8) {
                this.particleSystem.optimizePerformance();
            }
        }
    }
    
    handleInput() {
        // Horizontal movement
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.velocityX = -this.player.speed;
        } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.velocityX = this.player.speed;
        } else {
            // Apply friction
            this.player.velocityX *= 0.8;
        }
        
        // Flying mechanics
        if (this.keys['ArrowUp'] || this.keys['KeyW'] || this.keys['Space']) {
            if (this.player.canFly) {
                this.player.velocityY -= this.player.flyPower * 0.3;
                // Limit upward flying speed
                if (this.player.velocityY < -this.player.maxFlySpeed) {
                    this.player.velocityY = -this.player.maxFlySpeed;
                }
            }
        }
        
        // Downward flying
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.player.velocityY += this.player.flyPower * 0.2;
            // Limit downward flying speed
            if (this.player.velocityY > this.player.maxFlySpeed) {
                this.player.velocityY = this.player.maxFlySpeed;
            }
        }
    }
    
    updatePlayer() {
        // Store previous position for movement detection
        const prevX = this.player.x;
        const prevY = this.player.y;
        
        // Apply lighter gravity for flying character
        this.player.velocityY += 0.2;
        
        // Update position
        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;
        
        // Movement detection for trail triggering
        const isMoving = Math.abs(this.player.velocityX) > 0.5 || Math.abs(this.player.velocityY) > 0.5;
        
        // Generate trail particles when player is moving with improved timing
        if (isMoving) {
            // Throttle trail generation based on movement intensity for better performance and visual appeal
            const movementIntensity = Math.sqrt(this.player.velocityX * this.player.velocityX + this.player.velocityY * this.player.velocityY);
            const trailFrequency = Math.min(1.0, movementIntensity / 3); // Scale with movement speed
            
            // Use frame-based timing for consistent trail generation
            if (!this.trailTimer) this.trailTimer = 0;
            this.trailTimer += trailFrequency;
            
            if (this.trailTimer >= 1.0) {
                this.trailTimer = 0;
                
                // Generate particles at multiple points for richer trail effect
                const numTrailPoints = Math.ceil(movementIntensity / 2);
                for (let i = 0; i < numTrailPoints; i++) {
                    const offsetX = (Math.random() - 0.5) * this.player.width * 0.8;
                    const offsetY = (Math.random() - 0.5) * this.player.height * 0.8;
                    const trailX = this.player.x + this.player.width / 2 + offsetX;
                    const trailY = this.player.y + this.player.height / 2 + offsetY;
                    
                    // Create trail particle with inherited velocity and slight randomization
                    this.particleSystem.createTrailParticle(
                        trailX, 
                        trailY, 
                        this.player.velocityX + (Math.random() - 0.5) * 2, 
                        this.player.velocityY + (Math.random() - 0.5) * 2
                    );
                }
            }
        } else {
            // Reset trail timer when not moving
            this.trailTimer = 0;
        }
        
        // Keep player within level bounds
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x > this.levelWidth - this.player.width) {
            this.player.x = this.levelWidth - this.player.width;
        }
        
        // Keep player within vertical bounds
        if (this.player.y < 0) this.player.y = 0;
        if (this.player.y > this.levelHeight) {
            this.loseLife();
        }
    }
    
    updateCamera() {
        // Smooth camera following
        const targetX = this.player.x - this.width / 2;
        const targetY = this.player.y - this.height / 2;
        
        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.1;
        
        // Keep camera within level bounds
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.levelWidth - this.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.levelHeight - this.height));
    }
    
    checkCollisions() {
        this.player.onGround = false;
        
        // Platform collisions with explosion effects
        for (let platform of this.platforms) {
            if (this.isColliding(this.player, platform)) {
                // Calculate collision point for explosion effect
                const overlapLeft = Math.max(this.player.x, platform.x);
                const overlapRight = Math.min(this.player.x + this.player.width, platform.x + platform.width);
                const overlapTop = Math.max(this.player.y, platform.y);
                const overlapBottom = Math.min(this.player.y + this.player.height, platform.y + platform.height);
                
                const collisionX = (overlapLeft + overlapRight) / 2;
                const collisionY = (overlapTop + overlapBottom) / 2;
                
                // Generate explosion particles at collision point for platform collisions
                this.particleSystem.createExplosionParticles(
                    collisionX, 
                    collisionY, 
                    8, // Particle count for platform collisions
                    ['#FF8C00', '#FFA500', '#FFB84D', '#FFFFFF'] // Platform collision colors
                );
                
                // Top collision (landing on platform)
                if (this.player.velocityY > 0 && 
                    this.player.y < platform.y) {
                    this.player.y = platform.y - this.player.height;
                    this.player.velocityY = 0;
                    this.player.onGround = true;
                }
                // Bottom collision (hitting platform from below)
                else if (this.player.velocityY < 0 && 
                         this.player.y > platform.y) {
                    this.player.y = platform.y + platform.height;
                    this.player.velocityY = 0;
                }
                // Side collisions
                else if (this.player.velocityX > 0) {
                    this.player.x = platform.x - this.player.width;
                    this.player.velocityX = 0;
                } else if (this.player.velocityX < 0) {
                    this.player.x = platform.x + platform.width;
                    this.player.velocityX = 0;
                }
            }
        }
        
        // Collectible collisions with distinct explosion effects
        for (let collectible of this.collectibles) {
            if (!collectible.collected && this.isColliding(this.player, collectible)) {
                collectible.collected = true;
                this.score += 100;
                
                // Create distinct explosion effects for collectible collisions
                const collectibleCenterX = collectible.x + collectible.width / 2;
                const collectibleCenterY = collectible.y + collectible.height / 2;
                
                this.particleSystem.createExplosionParticles(
                    collectibleCenterX, 
                    collectibleCenterY, 
                    12, // More particles for collectibles to make them feel more rewarding
                    ['#FFB84D', '#FFD700', '#FFFF00', '#FFA500'] // Bright, golden colors for collectibles
                );
            }
        }
        
        // Power-up collisions with special explosion effects
        for (let powerUp of this.powerUps) {
            if (!powerUp.collected && this.isColliding(this.player, powerUp)) {
                powerUp.collected = true;
                this.handlePowerUp(powerUp.type);
                
                // Create special explosion effects for power-up collisions
                const powerUpCenterX = powerUp.x + powerUp.width / 2;
                const powerUpCenterY = powerUp.y + powerUp.height / 2;
                
                // Different colors based on power-up type
                let powerUpColors;
                switch(powerUp.type) {
                    case 'speed':
                        powerUpColors = ['#00FFFF', '#00CCFF', '#0099FF', '#FFFFFF']; // Cyan variants
                        break;
                    case 'life':
                        powerUpColors = ['#FF0080', '#FF3399', '#FF66B2', '#FFFFFF']; // Pink variants
                        break;
                    case 'score':
                        powerUpColors = ['#FFFF00', '#FFD700', '#FFA500', '#FFFFFF']; // Yellow variants
                        break;
                    default:
                        powerUpColors = ['#FF8C00', '#FFA500', '#FFB84D', '#FFFFFF'];
                }
                
                this.particleSystem.createExplosionParticles(
                    powerUpCenterX, 
                    powerUpCenterY, 
                    15, // Even more particles for power-ups to emphasize their importance
                    powerUpColors
                );
            }
        }
    }
    
    checkObstacleAreas() {
        // Check which obstacle areas the player is currently in
        const currentAreas = new Set();
        
        for (let area of this.obstacleAreas) {
            if (this.isColliding(this.player, area)) {
                currentAreas.add(area.name);
                
                // If player just entered this area, start generating sparkles
                if (!this.playerInObstacleAreas.has(area.name)) {
                    console.log(`Player entered obstacle area: ${area.name}`);
                }
                
                // Generate sparkle particles while player is in the area with improved timing
                // Create sparkles at strategic positions for better visual distribution
                if (!this.sparkleTimers) this.sparkleTimers = new Map();
                if (!this.sparkleTimers.has(area.name)) this.sparkleTimers.set(area.name, 0);
                
                let sparkleTimer = this.sparkleTimers.get(area.name);
                sparkleTimer += 1;
                
                // Generate sparkles with improved timing and positioning
                if (sparkleTimer >= 8) { // Every 8 frames for consistent timing
                    sparkleTimer = 0;
                    
                    // Create sparkles in a pattern around the player for better visual effect
                    const playerCenterX = this.player.x + this.player.width / 2;
                    const playerCenterY = this.player.y + this.player.height / 2;
                    
                    for (let i = 0; i < 3; i++) {
                        const angle = (Math.PI * 2 * i) / 3 + Date.now() * 0.001;
                        const radius = 20 + Math.sin(Date.now() * 0.003 + i) * 10;
                        const sparkleX = Math.max(area.x, Math.min(area.x + area.width, 
                            playerCenterX + Math.cos(angle) * radius));
                        const sparkleY = Math.max(area.y, Math.min(area.y + area.height, 
                            playerCenterY + Math.sin(angle) * radius));
                        
                        this.particleSystem.createSparkleParticles(sparkleX, sparkleY, 1);
                    }
                }
                
                this.sparkleTimers.set(area.name, sparkleTimer);
            }
        }
        
        // Check for areas the player just exited
        for (let areaName of this.playerInObstacleAreas) {
            if (!currentAreas.has(areaName)) {
                console.log(`Player exited obstacle area: ${areaName}`);
                // Clean up sparkle timer for exited area
                if (this.sparkleTimers && this.sparkleTimers.has(areaName)) {
                    this.sparkleTimers.delete(areaName);
                }
            }
        }
        
        // Update the current areas set
        this.playerInObstacleAreas = currentAreas;
    }

    checkGoal() {
        if (this.isColliding(this.player, this.goal)) {
            this.levelComplete = true;
            this.score += 1000;
            
            // Store current score to localStorage immediately on level completion
            this.scorePersistence.saveScore(this.score);
            
            // Update high score if current score is higher and trigger confetti celebration
            if (this.scorePersistence.saveHighScore(this.score)) {
                this.highScore = this.score;
                console.log('New high score achieved!');
                this.triggerConfettiCelebration();
            }
        }
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    handlePowerUp(type) {
        switch(type) {
            case 'speed':
                this.player.speed = Math.min(this.player.speed + 2, 10);
                this.score += 200;
                break;
            case 'life':
                this.lives++;
                this.score += 500;
                break;
            case 'score':
                this.score += 1000;
                break;
        }
    }
    
    loseLife() {
        this.lives--;
        if (this.lives <= 0) {
            this.gameOver = true;
            // Store current score to localStorage immediately on game over
            this.scorePersistence.saveScore(this.score);
            
            // Update high score if current score is higher and trigger confetti celebration
            if (this.scorePersistence.saveHighScore(this.score)) {
                this.highScore = this.score;
                console.log('New high score achieved!');
                this.triggerConfettiCelebration();
            }
        } else {
            // Reset player position
            this.player.x = 100;
            this.player.y = 400;
            this.player.velocityX = 0;
            this.player.velocityY = 0;
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Show loading screen if assets aren't loaded yet
        if (!this.assetsLoaded) {
            this.drawLoadingScreen();
            return;
        }
        
        // Save context for camera transform
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Draw platforms with enhanced visual polish
        for (let platform of this.platforms) {
            // Create gradient for depth effect
            const gradient = this.ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
            gradient.addColorStop(0, '#555');
            gradient.addColorStop(0.3, '#444');
            gradient.addColorStop(1, '#333');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            // Enhanced border with multiple layers for depth
            this.ctx.strokeStyle = '#777';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
            
            // Top highlight for 3D effect
            this.ctx.strokeStyle = '#888';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(platform.x, platform.y);
            this.ctx.lineTo(platform.x + platform.width, platform.y);
            this.ctx.stroke();
            
            // Bottom shadow for depth
            this.ctx.strokeStyle = '#222';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(platform.x, platform.y + platform.height);
            this.ctx.lineTo(platform.x + platform.width, platform.y + platform.height);
            this.ctx.stroke();
            
            // Add subtle texture pattern
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            for (let i = 0; i < platform.width; i += 8) {
                for (let j = 0; j < platform.height; j += 8) {
                    if ((i + j) % 16 === 0) {
                        this.ctx.fillRect(platform.x + i, platform.y + j, 2, 2);
                    }
                }
            }
        }
        
        // Draw collectibles (gems) with enhanced visual polish
        for (let collectible of this.collectibles) {
            if (!collectible.collected) {
                // Add pulsing animation to gems
                const time = Date.now() * 0.003;
                const pulseScale = 1 + Math.sin(time + collectible.x * 0.01) * 0.1;
                const glowIntensity = 0.5 + Math.sin(time * 2 + collectible.y * 0.01) * 0.3;
                
                this.ctx.save();
                this.ctx.translate(collectible.x + collectible.width/2, collectible.y + collectible.height/2);
                this.ctx.scale(pulseScale, pulseScale);
                
                // Draw gem with gradient effect
                const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, collectible.width/2);
                gradient.addColorStop(0, '#FFD700');
                gradient.addColorStop(0.7, '#FFB84D');
                gradient.addColorStop(1, '#FF8C00');
                
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(-collectible.width/2, -collectible.height/2, collectible.width, collectible.height);
                
                // Enhanced sparkle effect with animated glow
                this.ctx.strokeStyle = `rgba(255, 215, 0, ${glowIntensity})`;
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(-collectible.width/2 - 3, -collectible.height/2 - 3, collectible.width + 6, collectible.height + 6);
                
                // Add rotating sparkle points
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 1;
                for (let i = 0; i < 4; i++) {
                    const angle = time + i * Math.PI / 2;
                    const sparkleX = Math.cos(angle) * (collectible.width/2 + 5);
                    const sparkleY = Math.sin(angle) * (collectible.height/2 + 5);
                    this.ctx.beginPath();
                    this.ctx.moveTo(sparkleX - 2, sparkleY);
                    this.ctx.lineTo(sparkleX + 2, sparkleY);
                    this.ctx.moveTo(sparkleX, sparkleY - 2);
                    this.ctx.lineTo(sparkleX, sparkleY + 2);
                    this.ctx.stroke();
                }
                
                this.ctx.restore();
            }
        }
        
        // Draw power-ups with enhanced visual effects
        for (let powerUp of this.powerUps) {
            if (!powerUp.collected) {
                const time = Date.now() * 0.004;
                const floatOffset = Math.sin(time + powerUp.x * 0.02) * 3;
                const rotationAngle = time * 0.5;
                const pulseScale = 1 + Math.sin(time * 3) * 0.15;
                
                this.ctx.save();
                this.ctx.translate(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2 + floatOffset);
                this.ctx.rotate(rotationAngle);
                this.ctx.scale(pulseScale, pulseScale);
                
                // Enhanced power-up rendering with gradients and effects
                let gradient, glowColor;
                switch(powerUp.type) {
                    case 'speed':
                        gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, powerUp.width/2);
                        gradient.addColorStop(0, '#FFFFFF');
                        gradient.addColorStop(0.5, '#00FFFF');
                        gradient.addColorStop(1, '#0088CC');
                        glowColor = '#00FFFF';
                        break;
                    case 'life':
                        gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, powerUp.width/2);
                        gradient.addColorStop(0, '#FFFFFF');
                        gradient.addColorStop(0.5, '#FF0080');
                        gradient.addColorStop(1, '#CC0066');
                        glowColor = '#FF0080';
                        break;
                    case 'score':
                        gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, powerUp.width/2);
                        gradient.addColorStop(0, '#FFFFFF');
                        gradient.addColorStop(0.5, '#FFFF00');
                        gradient.addColorStop(1, '#CCCC00');
                        glowColor = '#FFFF00';
                        break;
                }
                
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(-powerUp.width/2, -powerUp.height/2, powerUp.width, powerUp.height);
                
                // Animated glow effect
                const glowIntensity = 0.6 + Math.sin(time * 4) * 0.4;
                this.ctx.strokeStyle = `rgba(${this.hexToRgb(glowColor)}, ${glowIntensity})`;
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(-powerUp.width/2 - 4, -powerUp.height/2 - 4, powerUp.width + 8, powerUp.height + 8);
                
                // Add energy particles around power-ups
                for (let i = 0; i < 6; i++) {
                    const particleAngle = time * 2 + i * Math.PI / 3;
                    const particleRadius = powerUp.width/2 + 8 + Math.sin(time * 3 + i) * 3;
                    const particleX = Math.cos(particleAngle) * particleRadius;
                    const particleY = Math.sin(particleAngle) * particleRadius;
                    
                    this.ctx.fillStyle = glowColor;
                    this.ctx.beginPath();
                    this.ctx.arc(particleX, particleY, 1.5, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                this.ctx.restore();
            }
        }
        
        // Draw obstacle areas with enhanced magical visualization
        const obstacleTime = Date.now() * 0.003;
        for (let area of this.obstacleAreas) {
            const isActive = this.playerInObstacleAreas.has(area.name);
            
            if (isActive) {
                // Active area with magical shimmer effect
                const shimmerAlpha = 0.2 + Math.sin(obstacleTime * 4) * 0.1;
                const gradient = this.ctx.createRadialGradient(
                    area.x + area.width/2, area.y + area.height/2, 0,
                    area.x + area.width/2, area.y + area.height/2, Math.max(area.width, area.height)/2
                );
                gradient.addColorStop(0, `rgba(255, 255, 255, ${shimmerAlpha})`);
                gradient.addColorStop(0.7, `rgba(200, 200, 255, ${shimmerAlpha * 0.5})`);
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(area.x, area.y, area.width, area.height);
                
                // Animated border for active areas
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(obstacleTime * 6) * 0.3})`;
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([5, 5]);
                this.ctx.lineDashOffset = -obstacleTime * 20;
                this.ctx.strokeRect(area.x, area.y, area.width, area.height);
                this.ctx.setLineDash([]);
                
                // Add floating magical particles
                for (let i = 0; i < 3; i++) {
                    const particleTime = obstacleTime + i * 2;
                    const particleX = area.x + (Math.sin(particleTime) * 0.5 + 0.5) * area.width;
                    const particleY = area.y + (Math.cos(particleTime * 0.7) * 0.5 + 0.5) * area.height;
                    const particleAlpha = 0.4 + Math.sin(particleTime * 3) * 0.3;
                    
                    this.ctx.fillStyle = `rgba(200, 200, 255, ${particleAlpha})`;
                    this.ctx.beginPath();
                    this.ctx.arc(particleX, particleY, 1.5, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            } else {
                // Inactive area with subtle indication
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                this.ctx.lineWidth = 1;
                this.ctx.setLineDash([3, 3]);
                this.ctx.strokeRect(area.x, area.y, area.width, area.height);
                this.ctx.setLineDash([]);
            }
        }
        
        // Draw goal flag with enhanced animation and visual effects
        const flagTime = Date.now() * 0.005;
        const flagWave = Math.sin(flagTime * 2) * 2;
        const flagGlow = 0.7 + Math.sin(flagTime * 3) * 0.3;
        
        // Flag pole with gradient
        const poleGradient = this.ctx.createLinearGradient(this.goal.x, this.goal.y, this.goal.x + 5, this.goal.y);
        poleGradient.addColorStop(0, '#228B22');
        poleGradient.addColorStop(0.5, '#32CD32');
        poleGradient.addColorStop(1, '#00FF00');
        
        this.ctx.fillStyle = poleGradient;
        this.ctx.fillRect(this.goal.x, this.goal.y, 5, this.goal.height);
        
        // Animated flag with wave effect
        this.ctx.save();
        this.ctx.translate(this.goal.x + 5, this.goal.y + 5);
        
        // Flag gradient
        const flagGradient = this.ctx.createLinearGradient(0, 0, 20, 0);
        flagGradient.addColorStop(0, '#FFD700');
        flagGradient.addColorStop(0.5, '#FFB84D');
        flagGradient.addColorStop(1, '#FF8C00');
        
        this.ctx.fillStyle = flagGradient;
        
        // Draw waving flag using curves
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.quadraticCurveTo(10 + flagWave, 7.5, 20, 0 + flagWave);
        this.ctx.lineTo(20, 15 + flagWave);
        this.ctx.quadraticCurveTo(10 + flagWave, 7.5, 0, 15);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Flag border with glow effect
        this.ctx.strokeStyle = `rgba(255, 215, 0, ${flagGlow})`;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.restore();
        
        // Add victory sparkles around the flag
        for (let i = 0; i < 8; i++) {
            const sparkleAngle = flagTime + i * Math.PI / 4;
            const sparkleRadius = 40 + Math.sin(flagTime * 2 + i) * 10;
            const sparkleX = this.goal.x + this.goal.width/2 + Math.cos(sparkleAngle) * sparkleRadius;
            const sparkleY = this.goal.y + this.goal.height/2 + Math.sin(sparkleAngle) * sparkleRadius;
            const sparkleAlpha = 0.3 + Math.sin(flagTime * 4 + i) * 0.3;
            
            this.ctx.fillStyle = `rgba(255, 215, 0, ${sparkleAlpha})`;
            this.ctx.beginPath();
            this.ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw player (Kiro) using AssetManager with aspect ratio preservation
        if (this.assetsLoaded) {
            // Render Kiro logo sprite with proper scaling and aspect ratio
            this.assetManager.renderImage(
                this.ctx, 
                'kiroLogo', 
                this.player.x, 
                this.player.y, 
                this.player.width, 
                this.player.height,
                true // Maintain aspect ratio during all game states
            );
        } else {
            // Loading state - show simple placeholder
            this.ctx.fillStyle = '#FF8C00';
            this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
            this.ctx.strokeStyle = '#FFA500';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(this.player.x, this.player.y, this.player.width, this.player.height);
        }
        
        // Render particle system (particles should render above game objects but below UI)
        // Sparkle particles will be rendered with prominence as specified in requirements
        this.particleSystem.render(this.ctx, this.camera);
        
        // Restore context
        this.ctx.restore();
        
        // Draw UI overlays
        if (this.gameOver) {
            this.drawGameOver();
        } else if (this.levelComplete) {
            this.drawLevelComplete();
        }
    }
    
    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#FF8C00';
        this.ctx.font = '48px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 80);
        
        this.ctx.fillStyle = '#FFB84D';
        this.ctx.font = '24px Courier New';
        this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 - 20);
        this.ctx.fillText(`High Score: ${this.highScore}`, this.width / 2, this.height / 2 + 10);
        
        // Show "NEW HIGH SCORE!" if applicable
        if (this.score === this.highScore && this.score > 0) {
            this.ctx.fillStyle = '#00FF00';
            this.ctx.font = '20px Courier New';
            this.ctx.fillText('NEW HIGH SCORE!', this.width / 2, this.height / 2 + 40);
        }
        
        this.ctx.fillStyle = '#FFB84D';
        this.ctx.font = '18px Courier New';
        this.ctx.fillText('Press R to Restart', this.width / 2, this.height / 2 + 80);
    }
    
    drawLevelComplete() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#00FF00';
        this.ctx.font = '48px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('LEVEL COMPLETE!', this.width / 2, this.height / 2 - 80);
        
        this.ctx.fillStyle = '#FFB84D';
        this.ctx.font = '24px Courier New';
        this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 - 20);
        this.ctx.fillText(`High Score: ${this.highScore}`, this.width / 2, this.height / 2 + 10);
        
        // Show "NEW HIGH SCORE!" if applicable
        if (this.score === this.highScore && this.score > 0) {
            this.ctx.fillStyle = '#00FF00';
            this.ctx.font = '20px Courier New';
            this.ctx.fillText('NEW HIGH SCORE!', this.width / 2, this.height / 2 + 40);
        }
        
        this.ctx.fillStyle = '#FFB84D';
        this.ctx.font = '18px Courier New';
        this.ctx.fillText('Press R to Restart', this.width / 2, this.height / 2 + 80);
    }
    
    drawLoadingScreen() {
        this.ctx.fillStyle = '#FF8C00';
        this.ctx.font = '36px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Loading Assets...', this.width / 2, this.height / 2 - 20);
        
        this.ctx.fillStyle = '#FFB84D';
        this.ctx.font = '18px Courier New';
        this.ctx.fillText('Super Kiro World', this.width / 2, this.height / 2 + 20);
        
        // Simple loading animation
        const dots = '.'.repeat((Math.floor(Date.now() / 500) % 4));
        this.ctx.fillText(dots, this.width / 2, this.height / 2 + 50);
    }
    
    triggerConfettiCelebration() {
        // Trigger enhanced confetti celebration effect for new high score
        this.confettiCelebration.active = true;
        this.confettiCelebration.startTime = Date.now();
        
        // Create confetti particles with multiple Kiro brand colors
        const confettiColors = ['#FF8C00', '#FFA500', '#FFB84D', '#FFFFFF', '#FFD700', '#32CD32', '#FF69B4'];
        
        // Create confetti in multiple waves for more dramatic effect
        const createConfettiWave = (delay, intensity) => {
            setTimeout(() => {
                if (this.confettiCelebration.active) {
                    const waveCount = Math.floor(this.confettiCelebration.confettiCount * intensity);
                    
                    for (let i = 0; i < waveCount; i++) {
                        // Create confetti from multiple spawn points for better coverage
                        const spawnPoints = [
                            { x: this.camera.x + this.width * 0.2, y: this.camera.y },
                            { x: this.camera.x + this.width * 0.5, y: this.camera.y },
                            { x: this.camera.x + this.width * 0.8, y: this.camera.y }
                        ];
                        
                        const spawnPoint = spawnPoints[i % spawnPoints.length];
                        const confettiX = spawnPoint.x + (Math.random() - 0.5) * 100;
                        const confettiY = spawnPoint.y + Math.random() * 50;
                        
                        this.particleSystem.createConfettiParticles(
                            confettiX,
                            confettiY,
                            1,
                            confettiColors
                        );
                    }
                }
            }, delay);
        };
        
        // Create multiple waves of confetti for extended celebration
        createConfettiWave(0, 0.4);      // Initial burst
        createConfettiWave(200, 0.3);    // Second wave
        createConfettiWave(500, 0.2);    // Third wave
        createConfettiWave(1000, 0.1);   // Final wave
        
        console.log('Enhanced confetti celebration started!');
    }
    
    updateConfettiCelebration() {
        if (!this.confettiCelebration.active) return;
        
        const currentTime = Date.now();
        const elapsed = currentTime - this.confettiCelebration.startTime;
        
        // Check if celebration duration has completed
        if (elapsed >= this.confettiCelebration.duration) {
            this.confettiCelebration.active = false;
            
            // Clear all confetti particles from the system after celebration completes
            this.particleSystem.particles = this.particleSystem.particles.filter(
                particle => particle.type !== 'confetti'
            );
            
            console.log('Confetti celebration completed and cleaned up');
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
        
        // Update performance stats in UI
        const stats = this.particleSystem.getPerformanceStats();
        document.getElementById('particleCount').textContent = stats.activeParticles;
        document.getElementById('fps').textContent = stats.currentFPS;
        document.getElementById('poolStats').textContent = stats.poolUtilization;
    }
    
    restart() {
        this.score = 0;
        this.lives = 5;
        this.gameOver = false;
        this.levelComplete = false;
        this.initializeLevel();
        this.camera = { x: 0, y: 0 };
        
        // Clear all particles on restart for clean state
        this.particleSystem.clear();
        
        // Reset confetti celebration state
        this.confettiCelebration.active = false;
        this.confettiCelebration.startTime = 0;
        
        // Retrieve current high score on restart
        this.highScore = this.scorePersistence.getHighScore();
        
        // Ensure assets are still available
        if (!this.assetManager.isLoaded('kiroLogo')) {
            console.log('Reloading assets after restart...');
            this.assetsLoaded = false;
            this.loadAssets().then(() => {
                this.assetsLoaded = true;
            }).catch(() => {
                this.assetsLoaded = true; // Continue with fallback
            });
        }
    }
    
    // Performance testing methods for debugging and optimization
    testParticlePerformance() {
        console.log('Starting particle performance test...');
        this.particleSystem.stressTest(3000);
    }
    
    getPerformanceInfo() {
        return this.particleSystem.getPerformanceStats();
    }
    
    optimizeParticles() {
        this.particleSystem.optimizePerformance();
    }
    
    // Helper function for color conversion
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            const r = parseInt(result[1], 16);
            const g = parseInt(result[2], 16);
            const b = parseInt(result[3], 16);
            return `${r}, ${g}, ${b}`;
        }
        return '255, 255, 255'; // Default to white
    }
    
    gameLoop() {
        // Only update game logic if assets are loaded
        if (this.assetsLoaded) {
            // Handle restart
            if ((this.gameOver || this.levelComplete) && this.keys['KeyR']) {
                this.restart();
            }
            
            // Performance testing shortcuts (for development/debugging)
            if (this.keys['KeyP'] && !this.performanceTestPressed) {
                this.testParticlePerformance();
                this.performanceTestPressed = true;
            }
            if (!this.keys['KeyP']) {
                this.performanceTestPressed = false;
            }
            
            if (this.keys['KeyO'] && !this.optimizePressed) {
                this.optimizeParticles();
                console.log('Manual particle optimization triggered');
                this.optimizePressed = true;
            }
            if (!this.keys['KeyO']) {
                this.optimizePressed = false;
            }
            
            this.update();
        }
        
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    // Create game instance and expose globally for performance testing
    window.game = new Game();
    
    // Add performance testing instructions to console
    console.log('Super Kiro World - Performance Testing Commands:');
    console.log('- Press P during gameplay to run particle stress test');
    console.log('- Press O during gameplay to manually optimize particles');
    console.log('- Use game.getPerformanceInfo() in console for detailed stats');
    console.log('- Use game.testParticlePerformance() in console for stress test');
});