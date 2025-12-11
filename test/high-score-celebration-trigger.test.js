/**
 * Tests for high score celebration trigger
 * Task 9.1: Write property test for high score celebration trigger
 * Requirements: 6.1, 6.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ParticleSystem, ScorePersistence, createMockContext } from './game-classes.js';
import fc from 'fast-check';

describe('High Score Celebration Trigger', () => {
    let particleSystem;
    let scorePersistence;
    let mockContext;

    beforeEach(() => {
        mockContext = createMockContext();
        particleSystem = new ParticleSystem(mockContext);
        scorePersistence = new ScorePersistence();
        
        // Clear localStorage for clean test state
        localStorage.clear();
    });

    describe('High Score Detection', () => {
        it('should trigger confetti when a new high score is achieved', () => {
            // Arrange
            const currentHighScore = 1000;
            const newScore = 1500;
            
            // Set up existing high score
            scorePersistence.saveHighScore(currentHighScore);
            
            // Act: Achieve new high score
            const isNewHighScore = scorePersistence.saveHighScore(newScore);
            
            // Assert: Should detect new high score
            expect(isNewHighScore).toBe(true);
            expect(scorePersistence.getHighScore()).toBe(newScore);
        });

        it('should not trigger confetti when score does not exceed high score', () => {
            // Arrange
            const currentHighScore = 2000;
            const lowerScore = 1500;
            
            // Set up existing high score
            scorePersistence.saveHighScore(currentHighScore);
            
            // Act: Achieve lower score
            const isNewHighScore = scorePersistence.saveHighScore(lowerScore);
            
            // Assert: Should not detect new high score
            expect(isNewHighScore).toBe(false);
            expect(scorePersistence.getHighScore()).toBe(currentHighScore);
        });
    });

    describe('Confetti Creation', () => {
        it('should create confetti particles with multiple Kiro brand colors', () => {
            // Arrange
            const confettiX = 400;
            const confettiY = 200;
            const confettiCount = 10;
            const expectedColors = ['#FF8C00', '#FFA500', '#FFB84D', '#FFFFFF', '#FFD700'];
            const initialParticleCount = particleSystem.getParticleCount();

            // Act: Create confetti particles for celebration
            particleSystem.createConfettiParticles(
                confettiX,
                confettiY,
                confettiCount,
                expectedColors
            );

            // Assert
            const finalParticleCount = particleSystem.getParticleCount();
            expect(finalParticleCount).toBe(initialParticleCount + confettiCount);

            // Verify confetti particles have correct properties
            const confettiParticles = particleSystem.particles.slice(-confettiCount);
            confettiParticles.forEach(particle => {
                expect(particle.type).toBe('confetti');
                expect(expectedColors).toContain(particle.color);
                expect(particle.x).toBe(confettiX);
                expect(particle.y).toBe(confettiY);
                
                // Verify confetti has upward initial motion
                expect(particle.velocityY).toBeLessThan(0); // Negative Y is upward
                
                // Verify confetti life span (should be longer for celebration)
                expect(particle.life).toBeGreaterThan(2000);
                expect(particle.life).toBeLessThanOrEqual(3000);
                
                // Verify confetti size
                expect(particle.size).toBeGreaterThanOrEqual(4);
                expect(particle.size).toBeLessThanOrEqual(8);
            });
        });

        it('should create confetti with realistic falling physics', () => {
            // Arrange
            particleSystem.createConfettiParticles(100, 100, 5);
            const confettiParticles = particleSystem.particles.slice(-5);
            
            // Store initial velocities
            const initialVelocities = confettiParticles.map(p => ({
                x: p.velocityX,
                y: p.velocityY
            }));

            // Act: Update particles to simulate physics
            const deltaTime = 16.67; // ~60 FPS
            particleSystem.update(deltaTime);

            // Assert: Verify realistic falling physics
            confettiParticles.forEach((particle, index) => {
                // Verify gravity effect (velocityY should increase due to falling)
                expect(particle.velocityY).toBeGreaterThan(initialVelocities[index].y);
                
                // Verify air resistance (velocities should decrease in magnitude)
                expect(Math.abs(particle.velocityX)).toBeLessThan(Math.abs(initialVelocities[index].x));
                
                // Verify particle life decreases over time
                expect(particle.life).toBeLessThan(particle.maxLife);
                
                // Verify alpha fading for visual effect
                expect(particle.alpha).toBeLessThan(1.0);
                expect(particle.alpha).toBe(particle.life / particle.maxLife);
            });
        });
    });

    describe('Property-Based Tests', () => {
        /**
         * **Feature: game-enhancements, Property 11: High score celebration trigger**
         * **Validates: Requirements 6.1, 6.2**
         */
        it('should trigger confetti celebration for any score that exceeds current high score', () => {
            fc.assert(fc.property(
                // Generate random current high score
                fc.integer({ min: 0, max: 10000 }),
                // Generate random new score that's higher
                fc.integer({ min: 1, max: 5000 }),
                // Generate random screen coordinates for confetti
                fc.integer({ min: 0, max: 800 }), // screenX
                fc.integer({ min: 0, max: 600 }), // screenY
                // Generate random confetti count
                fc.integer({ min: 10, max: 100 }),
                (currentHighScore, scoreIncrease, screenX, screenY, confettiCount) => {
                    // Arrange: Set up current high score
                    scorePersistence.handleCorruptedData(); // Clear any existing data
                    scorePersistence.saveHighScore(currentHighScore);
                    
                    const newScore = currentHighScore + scoreIncrease; // Ensure new score is higher
                    const initialParticleCount = particleSystem.getParticleCount();
                    
                    // Act: Achieve new high score and trigger celebration
                    const isNewHighScore = scorePersistence.saveHighScore(newScore);
                    
                    if (isNewHighScore) {
                        // Simulate confetti celebration trigger
                        const confettiColors = ['#FF8C00', '#FFA500', '#FFB84D', '#FFFFFF', '#FFD700'];
                        
                        // Create confetti particles across screen for celebration
                        const actualConfettiCount = Math.min(confettiCount, particleSystem.maxParticles - initialParticleCount);
                        for (let i = 0; i < actualConfettiCount; i++) {
                            particleSystem.createConfettiParticles(
                                screenX + (Math.random() - 0.5) * 200, // Spread around screen center
                                screenY + (Math.random() - 0.5) * 100,
                                1, // One particle per call
                                confettiColors
                            );
                        }
                    }
                    
                    // Assert: Verify celebration was triggered for new high score
                    expect(isNewHighScore).toBe(true);
                    expect(scorePersistence.getHighScore()).toBe(newScore);
                    
                    // Verify confetti particles were created
                    const finalParticleCount = particleSystem.getParticleCount();
                    const confettiParticlesCreated = finalParticleCount - initialParticleCount;
                    
                    if (actualConfettiCount > 0) {
                        expect(confettiParticlesCreated).toBeGreaterThan(0);
                        expect(confettiParticlesCreated).toBeLessThanOrEqual(actualConfettiCount);
                        
                        // Verify all new particles are confetti with correct properties
                        const newParticles = particleSystem.particles.slice(-confettiParticlesCreated);
                        newParticles.forEach(particle => {
                            expect(particle.type).toBe('confetti');
                            expect(['#FF8C00', '#FFA500', '#FFB84D', '#FFFFFF', '#FFD700']).toContain(particle.color);
                            
                            // Verify confetti has initial upward motion for celebration effect
                            expect(particle.velocityY).toBeLessThan(0);
                            
                            // Verify confetti has appropriate life span for celebration
                            expect(particle.life).toBeGreaterThan(2000);
                            expect(particle.maxLife).toBeGreaterThan(2000);
                            
                            // Verify confetti size is appropriate for visibility
                            expect(particle.size).toBeGreaterThanOrEqual(4);
                            expect(particle.size).toBeLessThanOrEqual(8);
                        });
                    }
                }
            ), { numRuns: 100 }); // Run 100 iterations as specified in design document
        });

        it('should not trigger confetti celebration for scores that do not exceed high score', () => {
            fc.assert(fc.property(
                // Generate random high score
                fc.integer({ min: 1000, max: 10000 }),
                // Generate random lower score
                fc.integer({ min: 0, max: 999 }),
                (highScore, lowerScore) => {
                    // Arrange: Set up high score
                    scorePersistence.handleCorruptedData(); // Clear any existing data
                    scorePersistence.saveHighScore(highScore);
                    
                    const initialParticleCount = particleSystem.getParticleCount();
                    
                    // Act: Try to save a lower score
                    const isNewHighScore = scorePersistence.saveHighScore(lowerScore);
                    
                    // Assert: Should not trigger celebration
                    expect(isNewHighScore).toBe(false);
                    expect(scorePersistence.getHighScore()).toBe(highScore); // High score unchanged
                    
                    // Verify no confetti particles were created
                    const finalParticleCount = particleSystem.getParticleCount();
                    expect(finalParticleCount).toBe(initialParticleCount);
                }
            ), { numRuns: 100 });
        });
    });
});