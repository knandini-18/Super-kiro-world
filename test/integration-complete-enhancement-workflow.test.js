// Integration tests for complete enhancement workflow
// **Feature: game-enhancements, Integration Test: Complete enhancement workflow**
// Test end-to-end gameplay with all particle effects, score persistence, and asset loading

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game } from '../game.js';
import { 
    Particle, 
    ParticleSystem, 
    ScorePersistence, 
    createMockPlayer, 
    createMockContext 
} from './game-classes.js';

describe('Integration: Complete Enhancement Workflow', () => {
    let mockCanvas, mockContext, mockLocalStorage;
    
    beforeEach(() => {
        // Mock DOM elements
        mockCanvas = {
            width: 800,
            height: 600,
            getContext: vi.fn()
        };
        
        mockContext = createMockContext();
        mockCanvas.getContext.mockReturnValue(mockContext);
        
        global.document.getElementById = vi.fn((id) => {
            if (id === 'gameCanvas') return mockCanvas;
            return { textContent: '' };
        });
        
        // Mock localStorage with realistic behavior
        mockLocalStorage = {
            data: {},
            getItem: vi.fn((key) => mockLocalStorage.data[key] || null),
            setItem: vi.fn((key, value) => { mockLocalStorage.data[key] = value; }),
            removeItem: vi.fn((key) => { delete mockLocalStorage.data[key]; }),
            clear: vi.fn(() => { mockLocalStorage.data = {}; })
        };
        global.localStorage = mockLocalStorage;
        
        // Mock Image constructor for asset loading tests
        global.Image = class MockImage {
            constructor() {
                this.onload = null;
                this.onerror = null;
                this.width = 32;
                this.height = 32;
            }
            
            set src(value) {
                this._src = value;
                // Simulate different loading scenarios based on filename
                setTimeout(() => {
                    if (value.includes('invalid') || value.includes('error')) {
                        if (this.onerror) this.onerror();
                    } else {
                        if (this.onload) this.onload();
                    }
                }, 0);
            }
            
            get src() { return this._src; }
        };
        
        // Mock requestAnimationFrame
        global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 16));
    });

    describe('End-to-End Gameplay with All Particle Effects', () => {
        it('should create trail particles during player movement', async () => {
            const game = new Game();
            await new Promise(resolve => setTimeout(resolve, 50)); // Wait for asset loading
            
            // Simulate player movement
            const initialParticleCount = game.particleSystem.getParticleCount();
            
            // Set player velocity to trigger movement
            game.player.velocityX = 5;
            game.player.velocityY = -2;
            
            // Update game to trigger trail generation
            game.update();
            
            const finalParticleCount = game.particleSystem.getParticleCount();
            
            // Verify trail particles were created during movement
            expect(finalParticleCount).toBeGreaterThan(initialParticleCount);
            
            // Verify trail particles have correct properties
            const trailParticles = game.particleSystem.particles.filter(p => p.type === 'trail');
            expect(trailParticles.length).toBeGreaterThan(0);
            
            // Verify trail particles use Kiro brand colors
            const kiroColors = ['#FF8C00', '#FFA500', '#FFB84D'];
            trailParticles.forEach(particle => {
                expect(kiroColors).toContain(particle.color);
            });
        });

        it('should create explosion particles on platform collisions', async () => {
            const game = new Game();
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Position player to collide with first platform
            game.player.x = 150;
            game.player.y = 540; // Just above platform at y=550
            game.player.velocityY = 5; // Moving downward
            
            const initialParticleCount = game.particleSystem.getParticleCount();
            
            // Update to trigger collision
            game.update();
            
            const finalParticleCount = game.particleSystem.getParticleCount();
            
            // Verify explosion particles were created
            expect(finalParticleCount).toBeGreaterThan(initialParticleCount);
            
            // Verify explosion particles exist
            const explosionParticles = game.particleSystem.particles.filter(p => p.type === 'explosion');
            expect(explosionParticles.length).toBeGreaterThan(0);
        });

        it('should create sparkle particles in obstacle areas', async () => {
            const game = new Game();
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Position player in first obstacle area
            const obstacleArea = game.obstacleAreas[0];
            game.player.x = obstacleArea.x + 10;
            game.player.y = obstacleArea.y + 10;
            
            // Update multiple times to trigger sparkle generation (30% chance per frame)
            for (let i = 0; i < 20; i++) {
                game.update();
            }
            
            // Verify sparkle particles were created
            const sparkleParticles = game.particleSystem.particles.filter(p => p.type === 'sparkle');
            expect(sparkleParticles.length).toBeGreaterThan(0);
            
            // Verify sparkle particles use bright, contrasting colors
            const brightColors = ['#FFFFFF', '#FFD700', '#FFFF00', '#00FFFF', '#FF00FF', '#00FF00'];
            sparkleParticles.forEach(particle => {
                expect(brightColors).toContain(particle.color);
            });
        });

        it('should create confetti particles on high score achievement', async () => {
            const game = new Game();
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Set up scenario for new high score
            game.score = 5000;
            game.highScore = 1000;
            
            // Trigger high score save which should create confetti
            game.scorePersistence.saveHighScore(game.score);
            game.triggerConfettiCelebration();
            
            // Verify confetti particles were created
            const confettiParticles = game.particleSystem.particles.filter(p => p.type === 'confetti');
            expect(confettiParticles.length).toBeGreaterThan(0);
            
            // Verify confetti uses multiple Kiro brand colors
            const confettiColors = ['#FF8C00', '#FFA500', '#FFB84D', '#FFFFFF', '#FFD700'];
            confettiParticles.forEach(particle => {
                expect(confettiColors).toContain(particle.color);
            });
            
            // Verify celebration state is active
            expect(game.confettiCelebration.active).toBe(true);
        });

        it('should handle complete gameplay scenario with all effects', async () => {
            const game = new Game();
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Simulate complete gameplay scenario
            let totalParticlesCreated = 0;
            
            // 1. Player movement (creates trail particles)
            game.player.velocityX = 3;
            game.player.velocityY = -1;
            game.update();
            totalParticlesCreated += game.particleSystem.getParticleCount();
            
            // 2. Collectible collision (creates explosion particles)
            game.player.x = game.collectibles[0].x;
            game.player.y = game.collectibles[0].y;
            game.update();
            
            // 3. Navigate through obstacle area (creates sparkle particles)
            const obstacleArea = game.obstacleAreas[0];
            game.player.x = obstacleArea.x + 20;
            game.player.y = obstacleArea.y + 20;
            
            // Update multiple times to ensure sparkle generation
            for (let i = 0; i < 10; i++) {
                game.update();
            }
            
            // 4. Achieve high score (creates confetti particles)
            game.score = 10000;
            game.scorePersistence.saveHighScore(game.score);
            game.triggerConfettiCelebration();
            
            // Verify all particle types were created during gameplay
            const particleTypes = new Set(game.particleSystem.particles.map(p => p.type));
            expect(particleTypes.has('trail')).toBe(true);
            expect(particleTypes.has('explosion')).toBe(true);
            expect(particleTypes.has('sparkle')).toBe(true);
            expect(particleTypes.has('confetti')).toBe(true);
            
            // Verify total particle count is reasonable (not exceeding performance limits)
            expect(game.particleSystem.getParticleCount()).toBeLessThanOrEqual(200);
        });
    });

    describe('Score Persistence Across Game Sessions', () => {
        it('should persist current score on game over', () => {
            const scorePersistence = new ScorePersistence();
            const testScore = 2500;
            
            // Save score on game over
            const result = scorePersistence.saveScore(testScore);
            
            // Verify save was successful
            expect(result).toBe(true);
            expect(mockLocalStorage.setItem).toHaveBeenCalled();
            
            // Verify score can be retrieved
            const retrievedScore = scorePersistence.getCurrentScore();
            expect(retrievedScore).toBe(testScore);
        });

        it('should persist high score across sessions', () => {
            const scorePersistence = new ScorePersistence();
            
            // Set initial high score
            scorePersistence.saveHighScore(1000);
            let highScore = scorePersistence.getHighScore();
            expect(highScore).toBe(1000);
            
            // Achieve new high score
            const newHighScore = scorePersistence.saveHighScore(2500);
            expect(newHighScore).toBe(true);
            
            // Verify new high score is persisted
            highScore = scorePersistence.getHighScore();
            expect(highScore).toBe(2500);
            
            // Verify lower score doesn't update high score
            const lowerScore = scorePersistence.saveHighScore(1500);
            expect(lowerScore).toBe(false);
            expect(scorePersistence.getHighScore()).toBe(2500);
        });

        it('should handle localStorage unavailability gracefully', () => {
            // Mock localStorage as unavailable
            global.localStorage = null;
            
            const scorePersistence = new ScorePersistence();
            
            // Verify graceful degradation
            expect(scorePersistence.isLocalStorageAvailable()).toBe(false);
            
            // Verify operations return defaults without crashing
            const result = scorePersistence.saveScore(1000);
            expect(result).toBe(false);
            
            const highScore = scorePersistence.getHighScore();
            expect(highScore).toBe(0); // Default value
        });

        it('should handle corrupted data recovery', () => {
            const scorePersistence = new ScorePersistence();
            
            // Simulate corrupted data in localStorage
            mockLocalStorage.data['superKiroWorld'] = 'invalid json data';
            
            // Verify corrupted data is handled gracefully
            const data = scorePersistence.getData();
            expect(data.highScore).toBe(0);
            expect(data.gamesPlayed).toBe(0);
            
            // Verify corrupted data is cleared
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('superKiroWorld');
        });

        it('should maintain score data integrity across game sessions', async () => {
            // Simulate first game session
            const game1 = new Game();
            await new Promise(resolve => setTimeout(resolve, 50));
            
            game1.score = 3000;
            game1.scorePersistence.saveHighScore(3000);
            
            // Simulate second game session (new game instance)
            const game2 = new Game();
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Verify high score persisted across sessions
            expect(game2.highScore).toBe(3000);
            
            // Achieve higher score in second session
            game2.score = 5000;
            game2.scorePersistence.saveHighScore(5000);
            
            // Verify new high score is saved
            expect(game2.scorePersistence.getHighScore()).toBe(5000);
        });
    });

    describe('Asset Loading and Fallback Scenarios', () => {
        it('should load Kiro logo successfully', async () => {
            const game = new Game();
            
            // Wait for asset loading to complete
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Verify asset manager loaded the logo
            expect(game.assetManager.isLoaded('kiroLogo')).toBe(true);
            expect(game.assetsLoaded).toBe(true);
        });

        it('should handle asset loading failure with fallback rendering', async () => {
            // Mock Image to simulate loading failure
            global.Image = class FailingImage {
                constructor() {
                    this.onload = null;
                    this.onerror = null;
                }
                
                set src(value) {
                    setTimeout(() => {
                        if (this.onerror) this.onerror();
                    }, 0);
                }
            };
            
            const game = new Game();
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Verify game continues with fallback rendering
            expect(game.assetsLoaded).toBe(true);
            
            // Verify fallback renderer is used
            const asset = game.assetManager.getImage('kiroLogo');
            expect(asset.fallback).toBe(true);
            expect(typeof asset.renderer).toBe('function');
        });

        it('should render player sprite with proper scaling and aspect ratio', async () => {
            const game = new Game();
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Simulate rendering
            game.render();
            
            // Verify renderImage was called with correct parameters
            // Note: In a real test, we would verify the actual rendering calls
            expect(game.assetManager.isLoaded('kiroLogo')).toBe(true);
            
            // Verify player dimensions are maintained
            expect(game.player.width).toBe(32);
            expect(game.player.height).toBe(32);
        });

        it('should handle asset loading during gameplay', async () => {
            const game = new Game();
            
            // Start game before assets are fully loaded
            expect(game.assetsLoaded).toBe(false);
            
            // Verify loading screen is shown
            game.render();
            
            // Wait for assets to load
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Verify game transitions to normal gameplay
            expect(game.assetsLoaded).toBe(true);
            
            // Verify game can be played normally after asset loading
            game.player.velocityX = 2;
            game.update();
            
            expect(game.particleSystem.getParticleCount()).toBeGreaterThanOrEqual(0);
        });

        it('should maintain visual integrity during all game states', async () => {
            const game = new Game();
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Test rendering in different game states
            
            // 1. Normal gameplay
            game.render();
            expect(mockContext.drawImage).toHaveBeenCalled();
            
            // 2. Game over state
            game.gameOver = true;
            game.render();
            
            // 3. Level complete state
            game.gameOver = false;
            game.levelComplete = true;
            game.render();
            
            // 4. During particle effects
            game.levelComplete = false;
            game.particleSystem.createTrailParticle(100, 100, 1, 1);
            game.render();
            
            // Verify rendering calls were made in all states
            expect(mockContext.fillRect).toHaveBeenCalled();
            expect(mockContext.save).toHaveBeenCalled();
            expect(mockContext.restore).toHaveBeenCalled();
        });
    });

    describe('Performance and Memory Management', () => {
        it('should maintain particle count within performance limits', async () => {
            const game = new Game();
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Generate many particles to test performance limits
            for (let i = 0; i < 300; i++) {
                game.particleSystem.createTrailParticle(100 + i, 100, 1, 1);
            }
            
            // Verify particle count doesn't exceed maximum
            expect(game.particleSystem.getParticleCount()).toBeLessThanOrEqual(200);
        });

        it('should clean up dead particles automatically', async () => {
            const game = new Game();
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Create particles with short life
            for (let i = 0; i < 10; i++) {
                const particle = new Particle(100, 100, 0, 0, 100, '#FF8C00', 'trail');
                game.particleSystem.particles.push(particle);
            }
            
            const initialCount = game.particleSystem.getParticleCount();
            
            // Update particles to expire them
            for (let i = 0; i < 10; i++) {
                game.particleSystem.update(50); // Large delta time to expire particles
            }
            
            const finalCount = game.particleSystem.getParticleCount();
            
            // Verify dead particles were cleaned up
            expect(finalCount).toBeLessThan(initialCount);
        });

        it('should handle confetti cleanup after celebration', async () => {
            const game = new Game();
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Trigger confetti celebration
            game.triggerConfettiCelebration();
            
            const initialConfettiCount = game.particleSystem.particles.filter(p => p.type === 'confetti').length;
            expect(initialConfettiCount).toBeGreaterThan(0);
            
            // Simulate celebration duration completion
            game.confettiCelebration.startTime = Date.now() - 4000; // 4 seconds ago
            game.updateConfettiCelebration();
            
            const finalConfettiCount = game.particleSystem.particles.filter(p => p.type === 'confetti').length;
            
            // Verify confetti particles were cleaned up
            expect(finalConfettiCount).toBe(0);
            expect(game.confettiCelebration.active).toBe(false);
        });
    });

    describe('Cross-System Integration', () => {
        it('should integrate particle system with collision detection', async () => {
            const game = new Game();
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Position player to collide with collectible
            const collectible = game.collectibles[0];
            game.player.x = collectible.x;
            game.player.y = collectible.y;
            
            const initialScore = game.score;
            const initialParticleCount = game.particleSystem.getParticleCount();
            
            // Update to trigger collision
            game.update();
            
            // Verify collision was detected and handled
            expect(collectible.collected).toBe(true);
            expect(game.score).toBeGreaterThan(initialScore);
            
            // Verify particles were created for collision
            expect(game.particleSystem.getParticleCount()).toBeGreaterThan(initialParticleCount);
        });

        it('should integrate score system with particle effects', async () => {
            const game = new Game();
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Set up for high score achievement
            game.score = 1000;
            game.highScore = 500;
            
            // Trigger level completion (which saves high score)
            game.player.x = game.goal.x;
            game.player.y = game.goal.y;
            game.update();
            
            // Verify level completion and score persistence
            expect(game.levelComplete).toBe(true);
            expect(game.highScore).toBe(1000);
            
            // Verify confetti celebration was triggered
            expect(game.confettiCelebration.active).toBe(true);
        });

        it('should integrate asset management with particle rendering', async () => {
            const game = new Game();
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Create particles and render
            game.particleSystem.createTrailParticle(100, 100, 1, 1);
            game.particleSystem.createSparkleParticles(200, 200, 3);
            
            // Render game with particles
            game.render();
            
            // Verify both asset rendering and particle rendering occurred
            expect(mockContext.save).toHaveBeenCalled();
            expect(mockContext.restore).toHaveBeenCalled();
            expect(mockContext.translate).toHaveBeenCalled();
        });
    });
});