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

// Particle System class with basic particle management
class ParticleSystem {
    constructor(ctx) {
        this.ctx = ctx;
        this.particles = [];
        this.maxParticles = 200; // Performance limit
    }
    
    createTrailParticle(x, y, velocityX, velocityY) {
        if (this.particles.length >= this.maxParticles) return;
        
        // Create trail particle with Kiro brand colors
        const colors = ['#FF8C00', '#FFA500', '#FFB84D'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const particle = new Particle(
            x + Math.random() * 8 - 4, // Small random offset
            y + Math.random() * 8 - 4,
            velocityX * 0.3 + (Math.random() - 0.5) * 2, // Inherit some velocity
            velocityY * 0.3 + (Math.random() - 0.5) * 2,
            1000 + Math.random() * 500, // Life in milliseconds
            color,
            'trail',
            2 + Math.random() * 2 // Size variation
        );
        
        this.particles.push(particle);
    }
    
    createExplosionParticles(x, y, count, colors = ['#FF8C00', '#FFA500', '#FFB84D']) {
        for (let i = 0; i < count && this.particles.length < this.maxParticles; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const speed = 3 + Math.random() * 4;
            
            const particle = new Particle(
                x,
                y,
                Math.cos(angle) * speed, // Outward motion
                Math.sin(angle) * speed,
                800 + Math.random() * 400, // Life in milliseconds
                colors[Math.floor(Math.random() * colors.length)],
                'explosion',
                3 + Math.random() * 3
            );
            
            this.particles.push(particle);
        }
    }
    
    createSparkleParticles(x, y, count) {
        const sparkleColors = ['#FFFFFF', '#FFD700', '#FFFF00', '#FFA500'];
        
        for (let i = 0; i < count && this.particles.length < this.maxParticles; i++) {
            const particle = new Particle(
                x + (Math.random() - 0.5) * 20,
                y + (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 2, // Gentle floating motion
                -Math.random() * 2 - 1, // Upward motion
                1500 + Math.random() * 1000, // Longer life for sparkles
                sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
                'sparkle',
                2 + Math.random() * 2
            );
            
            this.particles.push(particle);
        }
    }
    
    createConfettiParticles(x, y, count, colors = ['#FF8C00', '#FFA500', '#FFB84D', '#FFFFFF']) {
        for (let i = 0; i < count && this.particles.length < this.maxParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            
            const particle = new Particle(
                x,
                y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 3, // Initial upward motion
                2000 + Math.random() * 1000, // Long life for celebration
                colors[Math.floor(Math.random() * colors.length)],
                'confetti',
                4 + Math.random() * 4
            );
            
            this.particles.push(particle);
        }
    }
    
    update(deltaTime) {
        // Update all particles
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].update(deltaTime);
        }
        
        // Remove dead particles for memory management
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
        // Remove dead particles to prevent memory leaks
        this.particles = this.particles.filter(particle => !particle.isDead());
    }
    
    // Get current particle count for debugging/performance monitoring
    getParticleCount() {
        return this.particles.length;
    }
    
    // Clear all particles (useful for level transitions)
    clear() {
        this.particles = [];
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
            return;
        }
        
        if (asset.fallback) {
            // Use custom fallback renderer
            asset.renderer(ctx, x, y, width, height);
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
            } else {
                // Stretch to fit exact dimensions
                ctx.drawImage(asset, x, y, width, height);
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
        this.checkGoal();
        this.updateUI();
        
        // Update particle system with delta time (assuming 60 FPS = ~16.67ms per frame)
        this.particleSystem.update(16.67);
        
        // Debug: Log particle count occasionally (every 60 frames = ~1 second)
        if (this.debugFrameCount === undefined) this.debugFrameCount = 0;
        this.debugFrameCount++;
        if (this.debugFrameCount % 60 === 0 && this.particleSystem.getParticleCount() > 0) {
            console.log(`Particle system active: ${this.particleSystem.getParticleCount()} particles`);
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
        
        // Generate trail particles when player is moving
        if (isMoving) {
            // Create trail particles behind the character with Kiro brand colors
            // Generate particles at the center-back of the player sprite
            const trailX = this.player.x + this.player.width / 2;
            const trailY = this.player.y + this.player.height / 2;
            
            // Create trail particle with inherited velocity for natural movement
            this.particleSystem.createTrailParticle(
                trailX, 
                trailY, 
                this.player.velocityX, 
                this.player.velocityY
            );
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
        
        // Platform collisions
        for (let platform of this.platforms) {
            if (this.isColliding(this.player, platform)) {
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
        
        // Collectible collisions
        for (let collectible of this.collectibles) {
            if (!collectible.collected && this.isColliding(this.player, collectible)) {
                collectible.collected = true;
                this.score += 100;
            }
        }
        
        // Power-up collisions
        for (let powerUp of this.powerUps) {
            if (!powerUp.collected && this.isColliding(this.player, powerUp)) {
                powerUp.collected = true;
                this.handlePowerUp(powerUp.type);
            }
        }
    }
    
    checkGoal() {
        if (this.isColliding(this.player, this.goal)) {
            this.levelComplete = true;
            this.score += 1000;
            
            // Store current score to localStorage immediately on level completion
            this.scorePersistence.saveScore(this.score);
            
            // Update high score if current score is higher
            if (this.scorePersistence.saveHighScore(this.score)) {
                this.highScore = this.score;
                console.log('New high score achieved!');
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
            
            // Update high score if current score is higher
            if (this.scorePersistence.saveHighScore(this.score)) {
                this.highScore = this.score;
                console.log('New high score achieved!');
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
        
        // Draw platforms
        this.ctx.fillStyle = '#444';
        for (let platform of this.platforms) {
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            // Platform border
            this.ctx.strokeStyle = '#666';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        }
        
        // Draw collectibles (gems)
        for (let collectible of this.collectibles) {
            if (!collectible.collected) {
                this.ctx.fillStyle = '#FFB84D';
                this.ctx.fillRect(collectible.x, collectible.y, collectible.width, collectible.height);
                // Gem sparkle effect
                this.ctx.strokeStyle = '#FF8C00';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(collectible.x - 2, collectible.y - 2, collectible.width + 4, collectible.height + 4);
            }
        }
        
        // Draw power-ups
        for (let powerUp of this.powerUps) {
            if (!powerUp.collected) {
                switch(powerUp.type) {
                    case 'speed':
                        this.ctx.fillStyle = '#00FFFF'; // Cyan for speed
                        break;
                    case 'life':
                        this.ctx.fillStyle = '#FF0080'; // Pink for life
                        break;
                    case 'score':
                        this.ctx.fillStyle = '#FFFF00'; // Yellow for score
                        break;
                }
                this.ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
                // Power-up glow effect
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(powerUp.x - 3, powerUp.y - 3, powerUp.width + 6, powerUp.height + 6);
            }
        }
        
        // Draw goal flag
        this.ctx.fillStyle = '#00FF00';
        this.ctx.fillRect(this.goal.x, this.goal.y, this.goal.width, this.goal.height);
        this.ctx.fillStyle = '#FFB84D';
        this.ctx.fillRect(this.goal.x + 5, this.goal.y + 5, 20, 15);
        
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
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
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
    
    gameLoop() {
        // Only update game logic if assets are loaded
        if (this.assetsLoaded) {
            // Handle restart
            if ((this.gameOver || this.levelComplete) && this.keys['KeyR']) {
                this.restart();
            }
            
            this.update();
        }
        
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new Game();
});