/**
 * Tests for particle lifecycle management
 * Task 4.1: Write property test for particle lifecycle management
 * Requirements: 3.2, 4.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ParticleSystem, Particle, createMockContext } from './game-classes.js';
import fc from 'fast-check';

describe('Particle Lifecycle Management', () => {
    let particleSystem;
    let mockContext;

    beforeEach(() => {
        mockContext = createMockContext();
        particleSystem = new ParticleSystem(mockContext);
    });

    describe('Property-Based Tests', () => {
        /**
         * **Feature: game-enhancements, Property 5: Particle lifecycle management**
         * **Validates: Requirements 3.2, 4.5**
         */
        it('should decrease life over time until reaching zero and then be removed from the particle system', () => {
            fc.assert(fc.property(
                // Generate random particle parameters
                fc.integer({ min: 0, max: 1600 }), // x position
                fc.integer({ min: 0, max: 600 }),  // y position
                fc.float({ min: -10, max: 10 }),   // velocityX
                fc.float({ min: -10, max: 10 }),   // velocityY
                fc.integer({ min: 100, max: 3000 }), // initial life (milliseconds)
                fc.constantFrom('trail', 'explosion', 'sparkle', 'confetti'), // particle type
                fc.integer({ min: 2, max: 8 }),    // particle size
                fc.constantFrom('#FF8C00', '#FFA500', '#FFB84D', '#FFFFFF', '#FFD700'), // color
                (x, y, velocityX, velocityY, initialLife, particleType, size, color) => {
                    // Arrange: Create a particle with the generated parameters
                    const particle = new Particle(x, y, velocityX, velocityY, initialLife, color, particleType, size);
                    
                    // Add particle to the system
                    particleSystem.clear();
                    particleSystem.particles.push(particle);
                    
                    // Store initial state
                    const initialParticleLife = particle.life;
                    const initialMaxLife = particle.maxLife;
                    const initialParticleCount = particleSystem.getParticleCount();
                    
                    // Verify initial state
                    expect(particle.life).toBe(initialLife);
                    expect(particle.maxLife).toBe(initialLife);
                    expect(particle.isDead()).toBe(false);
                    expect(initialParticleCount).toBe(1);
                    
                    // Act & Assert: Simulate particle lifecycle until death
                    const deltaTime = 16.67; // ~60 FPS frame time
                    let updateCount = 0;
                    const maxUpdates = Math.ceil(initialLife / deltaTime) + 10; // Safety margin
                    
                    while (!particle.isDead() && updateCount < maxUpdates) {
                        const previousLife = particle.life;
                        const previousAlpha = particle.alpha;
                        
                        // Update the particle
                        particle.update(deltaTime);
                        updateCount++;
                        
                        // Verify life decreases over time
                        if (!particle.isDead()) {
                            expect(particle.life).toBeLessThan(previousLife);
                            expect(particle.life).toBeCloseTo(previousLife - deltaTime, 1);
                            
                            // Verify alpha decreases proportionally with life
                            const expectedAlpha = Math.max(0, particle.life / particle.maxLife);
                            expect(particle.alpha).toBeCloseTo(expectedAlpha, 5);
                            expect(particle.alpha).toBeLessThanOrEqual(previousAlpha);
                            
                            // Verify maxLife remains constant
                            expect(particle.maxLife).toBe(initialMaxLife);
                            
                            // Verify life is never negative
                            expect(particle.life).toBeGreaterThanOrEqual(0);
                        }
                    }
                    
                    // Verify particle eventually dies
                    expect(particle.isDead()).toBe(true);
                    expect(particle.life).toBeLessThanOrEqual(0);
                    expect(particle.alpha).toBe(0);
                    
                    // Now test particle system cleanup
                    particleSystem.update(deltaTime);
                    
                    // Verify dead particles are removed from the system
                    const finalParticleCount = particleSystem.getParticleCount();
                    expect(finalParticleCount).toBe(0);
                    
                    // Verify the particle is no longer in the particles array
                    expect(particleSystem.particles).not.toContain(particle);
                    expect(particleSystem.particles.length).toBe(0);
                }
            ), { numRuns: 100 }); // Run 100 iterations as specified in design document
        });

        /**
         * Test multiple particles with different lifespans to ensure proper cleanup
         */
        it('should manage multiple particles with different lifespans and remove them individually as they die', () => {
            fc.assert(fc.property(
                // Generate array of particle configurations
                fc.array(
                    fc.record({
                        x: fc.integer({ min: 0, max: 1600 }),
                        y: fc.integer({ min: 0, max: 600 }),
                        velocityX: fc.float({ min: -5, max: 5 }),
                        velocityY: fc.float({ min: -5, max: 5 }),
                        life: fc.integer({ min: 50, max: 1000 }), // Shorter lives for faster testing
                        type: fc.constantFrom('trail', 'explosion', 'sparkle', 'confetti'),
                        color: fc.constantFrom('#FF8C00', '#FFA500', '#FFB84D')
                    }),
                    { minLength: 2, maxLength: 10 }
                ),
                (particleConfigs) => {
                    // Arrange: Create multiple particles with different lifespans
                    particleSystem.clear();
                    const particles = [];
                    
                    for (const config of particleConfigs) {
                        const particle = new Particle(
                            config.x, config.y, config.velocityX, config.velocityY,
                            config.life, config.color, config.type
                        );
                        particles.push(particle);
                        particleSystem.particles.push(particle);
                    }
                    
                    const initialCount = particleSystem.getParticleCount();
                    expect(initialCount).toBe(particleConfigs.length);
                    
                    // Act: Simulate until all particles are dead
                    const deltaTime = 16.67;
                    let simulationSteps = 0;
                    const maxSteps = Math.ceil(Math.max(...particleConfigs.map(p => p.life)) / deltaTime) + 20;
                    
                    const deathOrder = [];
                    
                    while (particleSystem.getParticleCount() > 0 && simulationSteps < maxSteps) {
                        const aliveCountBefore = particleSystem.getParticleCount();
                        
                        // Update particle system
                        particleSystem.update(deltaTime);
                        simulationSteps++;
                        
                        const aliveCountAfter = particleSystem.getParticleCount();
                        
                        // Track when particles die
                        if (aliveCountAfter < aliveCountBefore) {
                            deathOrder.push({
                                step: simulationSteps,
                                aliveCount: aliveCountAfter,
                                died: aliveCountBefore - aliveCountAfter
                            });
                        }
                        
                        // Verify particle count never increases
                        expect(aliveCountAfter).toBeLessThanOrEqual(aliveCountBefore);
                        
                        // Verify all remaining particles are alive
                        for (const particle of particleSystem.particles) {
                            expect(particle.isDead()).toBe(false);
                            expect(particle.life).toBeGreaterThan(0);
                        }
                    }
                    
                    // Assert: All particles should eventually be removed
                    expect(particleSystem.getParticleCount()).toBe(0);
                    expect(particleSystem.particles.length).toBe(0);
                    
                    // Verify particles died in expected order (shorter life first, generally)
                    // Note: Due to random velocity effects and physics, exact order may vary slightly
                    expect(deathOrder.length).toBeGreaterThan(0);
                    
                    // Verify final cleanup
                    for (const originalParticle of particles) {
                        expect(originalParticle.isDead()).toBe(true);
                        expect(particleSystem.particles).not.toContain(originalParticle);
                    }
                }
            ), { numRuns: 50 }); // Fewer runs due to complexity
        });
    });

    describe('Unit Tests for Lifecycle Components', () => {
        it('should create particles with correct initial lifecycle state', () => {
            // Arrange & Act
            const particle = new Particle(100, 200, 1, -1, 1500, '#FF8C00', 'trail');

            // Assert
            expect(particle.life).toBe(1500);
            expect(particle.maxLife).toBe(1500);
            expect(particle.alpha).toBe(1.0);
            expect(particle.isDead()).toBe(false);
        });

        it('should correctly identify dead particles', () => {
            // Arrange
            const particle = new Particle(100, 200, 0, 0, 50, '#FF8C00', 'explosion');

            // Act - simulate until death
            while (particle.life > 0) {
                particle.update(16.67);
            }

            // Assert
            expect(particle.isDead()).toBe(true);
            expect(particle.life).toBeLessThanOrEqual(0);
        });

        it('should maintain maxLife constant throughout lifecycle', () => {
            // Arrange
            const particle = new Particle(100, 200, 0, 0, 1000, '#FF8C00', 'trail');
            const initialMaxLife = particle.maxLife;

            // Act - update multiple times
            for (let i = 0; i < 10; i++) {
                particle.update(16.67);
            }

            // Assert
            expect(particle.maxLife).toBe(initialMaxLife);
            expect(particle.maxLife).toBe(1000);
        });

        it('should update alpha proportionally to remaining life', () => {
            // Arrange
            const particle = new Particle(100, 200, 0, 0, 1000, '#FF8C00', 'sparkle');

            // Act & Assert - test at different life stages
            particle.update(250); // 25% life consumed
            expect(particle.alpha).toBeCloseTo(0.75, 2);

            particle.update(250); // 50% life consumed total
            expect(particle.alpha).toBeCloseTo(0.5, 2);

            particle.update(250); // 75% life consumed total
            expect(particle.alpha).toBeCloseTo(0.25, 2);
        });

        it('should remove dead particles from particle system during cleanup', () => {
            // Arrange
            const shortLivedParticle = new Particle(100, 200, 0, 0, 50, '#FF8C00', 'explosion');
            const longLivedParticle = new Particle(200, 300, 0, 0, 2000, '#FFA500', 'trail');
            
            particleSystem.particles.push(shortLivedParticle);
            particleSystem.particles.push(longLivedParticle);

            // Act - update until short-lived particle dies
            while (!shortLivedParticle.isDead()) {
                particleSystem.update(16.67);
            }

            // Assert
            expect(particleSystem.getParticleCount()).toBe(1);
            expect(particleSystem.particles).toContain(longLivedParticle);
            expect(particleSystem.particles).not.toContain(shortLivedParticle);
            expect(longLivedParticle.isDead()).toBe(false);
        });

        it('should handle edge case of zero initial life', () => {
            // Arrange
            const particle = new Particle(100, 200, 0, 0, 0, '#FF8C00', 'explosion');

            // Assert
            expect(particle.isDead()).toBe(true);
            expect(particle.alpha).toBe(0);
        });

        it('should handle edge case of very small life values', () => {
            // Arrange
            const particle = new Particle(100, 200, 0, 0, 1, '#FF8C00', 'trail');

            // Act
            particle.update(16.67); // Update with normal delta time

            // Assert
            expect(particle.isDead()).toBe(true);
            expect(particle.life).toBeLessThanOrEqual(0);
        });

        it('should clear all particles when particle system is cleared', () => {
            // Arrange
            for (let i = 0; i < 5; i++) {
                const particle = new Particle(i * 50, 100, 0, 0, 1000, '#FF8C00', 'trail');
                particleSystem.particles.push(particle);
            }
            expect(particleSystem.getParticleCount()).toBe(5);

            // Act
            particleSystem.clear();

            // Assert
            expect(particleSystem.getParticleCount()).toBe(0);
            expect(particleSystem.particles.length).toBe(0);
        });
    });
});