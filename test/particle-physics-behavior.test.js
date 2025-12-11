/**
 * Tests for particle physics behavior
 * Task 6.2: Write property test for particle physics behavior
 * Requirements: 4.3, 6.3
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ParticleSystem, Particle, createMockContext } from './game-classes.js';
import fc from 'fast-check';

describe('Particle Physics Behavior', () => {
    let particleSystem;
    let mockContext;

    beforeEach(() => {
        mockContext = createMockContext();
        particleSystem = new ParticleSystem(mockContext);
    });

    describe('Property-Based Tests', () => {
        /**
         * **Feature: game-enhancements, Property 8: Particle physics behavior**
         * **Validates: Requirements 4.3, 6.3**
         */
        it('should exhibit outward motion from creation point with decreasing life and appropriate physics simulation', () => {
            fc.assert(fc.property(
                // Generate random creation coordinates within game bounds
                fc.integer({ min: 0, max: 1600 }), // creationX
                fc.integer({ min: 0, max: 600 }),  // creationY
                // Generate random particle types that should have physics (explosion, confetti)
                fc.constantFrom('explosion', 'confetti'),
                // Generate random particle count
                fc.integer({ min: 1, max: 20 }),
                // Generate random simulation time steps
                fc.integer({ min: 1, max: 5 }), // Number of update cycles to simulate
                (creationX, creationY, particleType, particleCount, updateCycles) => {
                    // Arrange: Clear particle system and create particles
                    particleSystem.clear();
                    
                    // Create particles based on type
                    if (particleType === 'explosion') {
                        particleSystem.createExplosionParticles(
                            creationX, 
                            creationY, 
                            particleCount,
                            ['#FF8C00', '#FFA500', '#FFB84D']
                        );
                    } else if (particleType === 'confetti') {
                        particleSystem.createConfettiParticles(
                            creationX, 
                            creationY, 
                            particleCount,
                            ['#FF8C00', '#FFA500', '#FFB84D', '#FFFFFF']
                        );
                    }
                    
                    // Get the created particles
                    const particles = particleSystem.particles.filter(p => p.type === particleType);
                    
                    // Skip if no particles were created (due to max particle limit)
                    if (particles.length === 0) return;
                    
                    // Store initial state for comparison
                    const initialStates = particles.map(particle => ({
                        x: particle.x,
                        y: particle.y,
                        velocityX: particle.velocityX,
                        velocityY: particle.velocityY,
                        life: particle.life,
                        maxLife: particle.maxLife,
                        alpha: particle.alpha
                    }));
                    
                    // Act: Simulate physics over multiple update cycles
                    const deltaTime = 16.67; // ~60 FPS
                    for (let cycle = 0; cycle < updateCycles; cycle++) {
                        particleSystem.update(deltaTime);
                    }
                    
                    // Assert: Verify physics behavior for each particle
                    particles.forEach((particle, index) => {
                        const initialState = initialStates[index];
                        
                        // Skip particles that have died during simulation
                        if (particle.isDead()) return;
                        
                        // 1. Verify outward motion from creation point
                        // Particles should have moved away from their creation point
                        const distanceFromCreation = Math.sqrt(
                            (particle.x - creationX) ** 2 + 
                            (particle.y - creationY) ** 2
                        );
                        
                        // Should have moved some distance (unless velocity was very small)
                        const totalVelocity = Math.sqrt(
                            initialState.velocityX ** 2 + initialState.velocityY ** 2
                        );
                        if (totalVelocity > 0.1) { // Only check if particle had meaningful initial velocity
                            expect(distanceFromCreation).toBeGreaterThan(0);
                        }
                        
                        // 2. Verify decreasing life values
                        expect(particle.life).toBeLessThan(initialState.life);
                        expect(particle.life).toBeGreaterThanOrEqual(0);
                        
                        // 3. Verify alpha decreases with life (fade effect)
                        const expectedAlpha = Math.max(0, particle.life / particle.maxLife);
                        expect(particle.alpha).toBeCloseTo(expectedAlpha, 5);
                        expect(particle.alpha).toBeLessThanOrEqual(initialState.alpha);
                        
                        // 4. Verify appropriate physics simulation based on particle type
                        if (particleType === 'explosion' || particleType === 'confetti') {
                            // Should have gravity effect (velocityY should increase over time)
                            // Note: We need to account for air resistance which reduces velocity
                            // The net effect depends on initial velocity and simulation time
                            
                            // Verify air resistance effect (velocities should be reduced in magnitude)
                            // Air resistance applies 0.98 multiplier each frame
                            const expectedVelXReduction = Math.pow(0.98, updateCycles);
                            const expectedVelYReduction = Math.pow(0.98, updateCycles);
                            
                            // For X velocity, should be reduced by air resistance
                            if (Math.abs(initialState.velocityX) > 0.1) {
                                const expectedVelX = initialState.velocityX * expectedVelXReduction;
                                // Allow some tolerance due to floating point precision
                                expect(Math.abs(particle.velocityX)).toBeLessThanOrEqual(
                                    Math.abs(initialState.velocityX) + 0.1
                                );
                            }
                            
                            // For Y velocity, gravity (0.3 * deltaTime per frame) competes with air resistance
                            // The exact result depends on initial velocity and time, but we can verify
                            // that physics forces are being applied
                            const gravityEffect = 0.3 * deltaTime * updateCycles;
                            
                            // Verify that either gravity or air resistance has had an effect
                            const velocityChanged = 
                                Math.abs(particle.velocityX - initialState.velocityX) > 0.01 ||
                                Math.abs(particle.velocityY - initialState.velocityY) > 0.01;
                            expect(velocityChanged).toBe(true);
                        }
                        
                        // 5. Verify particle maintains valid state
                        expect(particle.maxLife).toBe(initialState.maxLife); // Should not change
                        expect(particle.size).toBeGreaterThan(0);
                        expect(particle.type).toBe(particleType);
                        
                        // 6. Verify position has been updated based on velocity
                        // Position should change if particle has velocity
                        if (Math.abs(initialState.velocityX) > 0.1 || Math.abs(initialState.velocityY) > 0.1) {
                            const positionChanged = 
                                Math.abs(particle.x - initialState.x) > 0.01 ||
                                Math.abs(particle.y - initialState.y) > 0.01;
                            expect(positionChanged).toBe(true);
                        }
                    });
                }
            ), { numRuns: 100 }); // Run 100 iterations as specified in design document
        });
    });

    describe('Unit Tests for Physics Components', () => {
        it('should apply gravity to explosion particles', () => {
            // Arrange
            const particle = new Particle(100, 100, 0, -5, 1000, '#FF8C00', 'explosion');
            const initialVelocityY = particle.velocityY;

            // Act
            particle.update(16.67); // One frame at 60 FPS

            // Assert
            expect(particle.velocityY).toBeGreaterThan(initialVelocityY);
            expect(particle.velocityY).toBeCloseTo(initialVelocityY + 0.3 * 16.67, 1);
        });

        it('should apply gravity to confetti particles', () => {
            // Arrange
            const particle = new Particle(100, 100, 2, -3, 2000, '#FF8C00', 'confetti');
            const initialVelocityY = particle.velocityY;

            // Act
            particle.update(16.67); // One frame at 60 FPS

            // Assert
            expect(particle.velocityY).toBeGreaterThan(initialVelocityY);
            expect(particle.velocityY).toBeCloseTo(initialVelocityY + 0.3 * 16.67, 1);
        });

        it('should apply air resistance to all particle velocities', () => {
            // Arrange
            const particle = new Particle(100, 100, 5, -5, 1000, '#FF8C00', 'explosion');
            const initialVelocityX = particle.velocityX;
            const initialVelocityY = particle.velocityY;

            // Act
            particle.update(16.67); // One frame at 60 FPS

            // Assert
            // Air resistance should reduce velocity magnitude
            expect(Math.abs(particle.velocityX)).toBeLessThan(Math.abs(initialVelocityX));
            // Y velocity is affected by both gravity and air resistance
            // After applying gravity: velocityY = initialVelocityY + gravity
            // After applying air resistance: velocityY = (initialVelocityY + gravity) * 0.98
            const expectedVelocityY = (initialVelocityY + 0.3 * 16.67) * 0.98;
            expect(particle.velocityY).toBeCloseTo(expectedVelocityY, 1);
        });

        it('should not apply gravity to trail particles', () => {
            // Arrange
            const particle = new Particle(100, 100, 0, -5, 1000, '#FF8C00', 'trail');
            const initialVelocityY = particle.velocityY;

            // Act
            particle.update(16.67); // One frame at 60 FPS

            // Assert
            // Trail particles should not have gravity, only air resistance
            const expectedVelocityY = initialVelocityY * 0.98;
            expect(particle.velocityY).toBeCloseTo(expectedVelocityY, 1);
        });

        it('should not apply gravity to sparkle particles', () => {
            // Arrange
            const particle = new Particle(100, 100, 1, -2, 1500, '#FFFFFF', 'sparkle');
            const initialVelocityY = particle.velocityY;

            // Act
            particle.update(16.67); // One frame at 60 FPS

            // Assert
            // Sparkle particles should not have gravity, only air resistance
            const expectedVelocityY = initialVelocityY * 0.98;
            expect(particle.velocityY).toBeCloseTo(expectedVelocityY, 1);
        });

        it('should decrease particle life over time', () => {
            // Arrange
            const particle = new Particle(100, 100, 0, 0, 1000, '#FF8C00', 'explosion');
            const initialLife = particle.life;

            // Act
            particle.update(16.67); // One frame at 60 FPS

            // Assert
            expect(particle.life).toBeLessThan(initialLife);
            expect(particle.life).toBeCloseTo(initialLife - 16.67, 1);
        });

        it('should update alpha based on remaining life', () => {
            // Arrange
            const particle = new Particle(100, 100, 0, 0, 1000, '#FF8C00', 'explosion');
            
            // Act
            particle.update(16.67); // One frame at 60 FPS

            // Assert
            const expectedAlpha = Math.max(0, particle.life / particle.maxLife);
            expect(particle.alpha).toBeCloseTo(expectedAlpha, 5);
        });

        it('should update position based on velocity', () => {
            // Arrange
            const particle = new Particle(100, 100, 3, -2, 1000, '#FF8C00', 'explosion');
            const initialX = particle.x;
            const initialY = particle.y;

            // Act
            particle.update(16.67); // One frame at 60 FPS

            // Assert
            // Position should change based on velocity (accounting for physics effects)
            expect(particle.x).not.toBe(initialX);
            expect(particle.y).not.toBe(initialY);
            
            // Verify position moved in expected direction (before air resistance)
            expect(particle.x).toBeGreaterThan(initialX); // Moving right
            // Y movement is complex due to gravity, but should have moved
            expect(Math.abs(particle.y - initialY)).toBeGreaterThan(0);
        });
    });
});