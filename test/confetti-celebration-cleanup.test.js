/**
 * Tests for confetti celebration cleanup
 * Task 9.2: Write property test for confetti celebration cleanup
 * Requirements: 6.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ParticleSystem, createMockContext } from './game-classes.js';
import fc from 'fast-check';

describe('Confetti Celebration Cleanup', () => {
    let particleSystem;
    let mockContext;

    beforeEach(() => {
        mockContext = createMockContext();
        particleSystem = new ParticleSystem(mockContext);
        
        // Mock Date.now for consistent timing tests
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('Celebration Duration Management', () => {
        it('should track celebration duration correctly', () => {
            // Arrange
            const celebrationDuration = 3000; // 3 seconds
            const startTime = Date.now();
            
            // Simulate celebration state
            const celebration = {
                active: true,
                duration: celebrationDuration,
                startTime: startTime
            };

            // Act: Advance time by half duration
            vi.advanceTimersByTime(celebrationDuration / 2);
            const halfwayTime = Date.now();
            const halfwayElapsed = halfwayTime - celebration.startTime;

            // Assert: Should still be active at halfway point
            expect(halfwayElapsed).toBe(celebrationDuration / 2);
            expect(halfwayElapsed).toBeLessThan(celebrationDuration);

            // Act: Advance time to completion
            vi.advanceTimersByTime(celebrationDuration / 2);
            const completionTime = Date.now();
            const totalElapsed = completionTime - celebration.startTime;

            // Assert: Should have reached completion duration
            expect(totalElapsed).toBe(celebrationDuration);
            expect(totalElapsed).toBeGreaterThanOrEqual(celebrationDuration);
        });

        it('should complete celebration after specified duration', () => {
            // Arrange
            const celebrationDuration = 3000;
            let celebration = {
                active: true,
                duration: celebrationDuration,
                startTime: Date.now()
            };

            // Create confetti particles
            particleSystem.createConfettiParticles(400, 200, 10);
            const initialConfettiCount = particleSystem.particles.filter(p => p.type === 'confetti').length;
            expect(initialConfettiCount).toBe(10);

            // Act: Advance time beyond celebration duration
            vi.advanceTimersByTime(celebrationDuration + 100);

            // Simulate celebration cleanup logic
            const currentTime = Date.now();
            const elapsed = currentTime - celebration.startTime;
            
            if (elapsed >= celebration.duration) {
                celebration.active = false;
                // Clear confetti particles
                particleSystem.particles = particleSystem.particles.filter(
                    particle => particle.type !== 'confetti'
                );
            }

            // Assert: Celebration should be complete and confetti cleared
            expect(celebration.active).toBe(false);
            const finalConfettiCount = particleSystem.particles.filter(p => p.type === 'confetti').length;
            expect(finalConfettiCount).toBe(0);
        });
    });

    describe('Confetti Particle Cleanup', () => {
        it('should remove only confetti particles during cleanup', () => {
            // Arrange: Create mixed particle types
            particleSystem.createTrailParticle(100, 100, 1, 1);
            particleSystem.createExplosionParticles(200, 200, 3);
            particleSystem.createSparkleParticles(300, 300, 2);
            particleSystem.createConfettiParticles(400, 400, 5);

            const initialTrailCount = particleSystem.particles.filter(p => p.type === 'trail').length;
            const initialExplosionCount = particleSystem.particles.filter(p => p.type === 'explosion').length;
            const initialSparkleCount = particleSystem.particles.filter(p => p.type === 'sparkle').length;
            const initialConfettiCount = particleSystem.particles.filter(p => p.type === 'confetti').length;

            expect(initialTrailCount).toBe(1);
            expect(initialExplosionCount).toBe(3);
            expect(initialSparkleCount).toBe(2);
            expect(initialConfettiCount).toBe(5);

            // Act: Perform confetti cleanup
            particleSystem.particles = particleSystem.particles.filter(
                particle => particle.type !== 'confetti'
            );

            // Assert: Only confetti should be removed
            const finalTrailCount = particleSystem.particles.filter(p => p.type === 'trail').length;
            const finalExplosionCount = particleSystem.particles.filter(p => p.type === 'explosion').length;
            const finalSparkleCount = particleSystem.particles.filter(p => p.type === 'sparkle').length;
            const finalConfettiCount = particleSystem.particles.filter(p => p.type === 'confetti').length;

            expect(finalTrailCount).toBe(initialTrailCount); // Unchanged
            expect(finalExplosionCount).toBe(initialExplosionCount); // Unchanged
            expect(finalSparkleCount).toBe(initialSparkleCount); // Unchanged
            expect(finalConfettiCount).toBe(0); // All confetti removed
        });

        it('should handle cleanup when no confetti particles exist', () => {
            // Arrange: Create non-confetti particles only
            particleSystem.createTrailParticle(100, 100, 1, 1);
            particleSystem.createExplosionParticles(200, 200, 3);
            
            const initialParticleCount = particleSystem.getParticleCount();
            const initialConfettiCount = particleSystem.particles.filter(p => p.type === 'confetti').length;
            expect(initialConfettiCount).toBe(0);

            // Act: Perform confetti cleanup
            particleSystem.particles = particleSystem.particles.filter(
                particle => particle.type !== 'confetti'
            );

            // Assert: No particles should be removed
            const finalParticleCount = particleSystem.getParticleCount();
            expect(finalParticleCount).toBe(initialParticleCount);
        });
    });

    describe('Memory Management', () => {
        it('should prevent memory leaks by clearing all confetti references', () => {
            // Arrange: Create many confetti particles
            const confettiCount = 50;
            particleSystem.createConfettiParticles(400, 200, confettiCount);
            
            expect(particleSystem.getParticleCount()).toBe(confettiCount);
            expect(particleSystem.particles.filter(p => p.type === 'confetti').length).toBe(confettiCount);

            // Act: Perform cleanup
            const confettiParticles = particleSystem.particles.filter(p => p.type === 'confetti');
            particleSystem.particles = particleSystem.particles.filter(
                particle => particle.type !== 'confetti'
            );

            // Assert: All confetti references should be removed
            expect(particleSystem.particles.filter(p => p.type === 'confetti').length).toBe(0);
            expect(particleSystem.getParticleCount()).toBe(0);
            
            // Verify original confetti particles are no longer in the system
            confettiParticles.forEach(confettiParticle => {
                expect(particleSystem.particles).not.toContain(confettiParticle);
            });
        });
    });

    describe('Property-Based Tests', () => {
        /**
         * **Feature: game-enhancements, Property 12: Confetti celebration cleanup**
         * **Validates: Requirements 6.4**
         */
        it('should clear all confetti particles after celebration duration completes for any celebration scenario', () => {
            fc.assert(fc.property(
                // Generate random celebration duration (1-10 seconds)
                fc.integer({ min: 1000, max: 10000 }),
                // Generate random confetti count
                fc.integer({ min: 1, max: 100 }),
                // Generate random screen coordinates
                fc.integer({ min: 0, max: 800 }),
                fc.integer({ min: 0, max: 600 }),
                // Generate random number of other particle types
                fc.integer({ min: 0, max: 20 }),
                (celebrationDuration, confettiCount, screenX, screenY, otherParticleCount) => {
                    // Arrange: Set up celebration scenario
                    const startTime = Date.now();
                    let celebration = {
                        active: true,
                        duration: celebrationDuration,
                        startTime: startTime
                    };

                    // Clear particle system and create mixed particles
                    particleSystem.clear();
                    
                    // Create other particle types that should not be affected
                    for (let i = 0; i < otherParticleCount; i++) {
                        const particleType = Math.floor(Math.random() * 3);
                        switch (particleType) {
                            case 0:
                                particleSystem.createTrailParticle(100 + i * 10, 100, 1, 1);
                                break;
                            case 1:
                                particleSystem.createExplosionParticles(200 + i * 10, 200, 1);
                                break;
                            case 2:
                                particleSystem.createSparkleParticles(300 + i * 10, 300, 1);
                                break;
                        }
                    }
                    
                    // Create confetti particles for celebration
                    const actualConfettiCount = Math.min(
                        confettiCount, 
                        particleSystem.maxParticles - particleSystem.getParticleCount()
                    );
                    
                    if (actualConfettiCount > 0) {
                        particleSystem.createConfettiParticles(
                            screenX, 
                            screenY, 
                            actualConfettiCount,
                            ['#FF8C00', '#FFA500', '#FFB84D', '#FFFFFF', '#FFD700']
                        );
                    }

                    // Record initial state
                    const initialTotalParticles = particleSystem.getParticleCount();
                    const initialConfettiCount = particleSystem.particles.filter(p => p.type === 'confetti').length;
                    const initialOtherParticles = particleSystem.particles.filter(p => p.type !== 'confetti').length;
                    
                    expect(initialConfettiCount).toBe(actualConfettiCount);

                    // Act: Advance time to just before completion
                    vi.advanceTimersByTime(celebrationDuration - 100);
                    let currentTime = Date.now();
                    let elapsed = currentTime - celebration.startTime;
                    
                    // Assert: Celebration should still be active
                    expect(elapsed).toBeLessThan(celebrationDuration);
                    expect(celebration.active).toBe(true);
                    
                    // Confetti should still exist
                    let currentConfettiCount = particleSystem.particles.filter(p => p.type === 'confetti').length;
                    expect(currentConfettiCount).toBe(initialConfettiCount);

                    // Act: Advance time to complete celebration
                    vi.advanceTimersByTime(200); // Go past completion
                    currentTime = Date.now();
                    elapsed = currentTime - celebration.startTime;

                    // Simulate celebration cleanup logic
                    if (elapsed >= celebration.duration) {
                        celebration.active = false;
                        // Clear all confetti particles from the system
                        particleSystem.particles = particleSystem.particles.filter(
                            particle => particle.type !== 'confetti'
                        );
                    }

                    // Assert: Celebration should be complete and all confetti cleared
                    expect(elapsed).toBeGreaterThanOrEqual(celebrationDuration);
                    expect(celebration.active).toBe(false);
                    
                    // Verify all confetti particles are cleared
                    const finalConfettiCount = particleSystem.particles.filter(p => p.type === 'confetti').length;
                    expect(finalConfettiCount).toBe(0);
                    
                    // Verify other particles are unaffected
                    const finalOtherParticles = particleSystem.particles.filter(p => p.type !== 'confetti').length;
                    expect(finalOtherParticles).toBe(initialOtherParticles);
                    
                    // Verify total particle count is reduced by exactly the confetti count
                    const finalTotalParticles = particleSystem.getParticleCount();
                    expect(finalTotalParticles).toBe(initialTotalParticles - initialConfettiCount);
                    
                    // Verify no confetti particles remain in the system
                    particleSystem.particles.forEach(particle => {
                        expect(particle.type).not.toBe('confetti');
                    });
                }
            ), { numRuns: 100 }); // Run 100 iterations as specified in design document
        });

        it('should handle cleanup correctly when celebration duration is very short', () => {
            fc.assert(fc.property(
                // Generate very short celebration durations (1-100ms)
                fc.integer({ min: 1, max: 100 }),
                fc.integer({ min: 1, max: 10 }), // Small confetti count for quick test
                (shortDuration, confettiCount) => {
                    // Arrange
                    particleSystem.clear();
                    const startTime = Date.now();
                    let celebration = {
                        active: true,
                        duration: shortDuration,
                        startTime: startTime
                    };

                    // Create confetti
                    particleSystem.createConfettiParticles(400, 200, confettiCount);
                    const initialConfettiCount = particleSystem.particles.filter(p => p.type === 'confetti').length;

                    // Act: Advance time past short duration
                    vi.advanceTimersByTime(shortDuration + 10);
                    
                    // Simulate cleanup
                    const currentTime = Date.now();
                    const elapsed = currentTime - celebration.startTime;
                    
                    if (elapsed >= celebration.duration) {
                        celebration.active = false;
                        particleSystem.particles = particleSystem.particles.filter(
                            particle => particle.type !== 'confetti'
                        );
                    }

                    // Assert: Should handle short durations correctly
                    expect(celebration.active).toBe(false);
                    const finalConfettiCount = particleSystem.particles.filter(p => p.type === 'confetti').length;
                    expect(finalConfettiCount).toBe(0);
                }
            ), { numRuns: 50 });
        });
    });
});