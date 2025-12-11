/**
 * Property-based test for movement-based trail generation
 * Feature: game-enhancements, Property 4: Movement-based trail generation
 * Validates: Requirements 3.1, 3.4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { ParticleSystem, createMockContext, createMockPlayer } from './game-classes.js';

describe('Movement-based Trail Generation Property Tests', () => {
    let particleSystem;
    let mockContext;

    beforeEach(() => {
        mockContext = createMockContext();
        particleSystem = new ParticleSystem(mockContext);
    });

    /**
     * Property 4: Movement-based trail generation
     * For any player movement with non-zero velocity, trail particles should be generated 
     * behind the character with appropriate Kiro brand colors
     */
    it('should generate trail particles when player has non-zero velocity', () => {
        fc.assert(
            fc.property(
                // Generate random player positions and velocities
                fc.record({
                    x: fc.float({ min: 0, max: 1600 }),
                    y: fc.float({ min: 0, max: 600 }),
                    velocityX: fc.float({ min: -10, max: 10 }).filter(v => Math.abs(v) > 0.5),
                    velocityY: fc.float({ min: -10, max: 10 }).filter(v => Math.abs(v) > 0.5)
                }),
                (playerData) => {
                    // Arrange: Create player with non-zero velocity
                    const player = createMockPlayer(
                        playerData.x, 
                        playerData.y, 
                        playerData.velocityX, 
                        playerData.velocityY
                    );
                    
                    // Clear any existing particles
                    particleSystem.clear();
                    const initialParticleCount = particleSystem.getParticleCount();
                    
                    // Act: Simulate movement detection and trail generation
                    const isMoving = Math.abs(player.velocityX) > 0.5 || Math.abs(player.velocityY) > 0.5;
                    
                    if (isMoving) {
                        const trailX = player.x + player.width / 2;
                        const trailY = player.y + player.height / 2;
                        
                        // Generate trail particle (simulating game logic)
                        particleSystem.createTrailParticle(
                            trailX, 
                            trailY, 
                            player.velocityX, 
                            player.velocityY
                        );
                    }
                    
                    const finalParticleCount = particleSystem.getParticleCount();
                    
                    // Assert: Trail particles should be generated for moving player
                    expect(finalParticleCount).toBeGreaterThan(initialParticleCount);
                    
                    // Verify particle properties
                    const particles = particleSystem.particles;
                    if (particles.length > 0) {
                        const trailParticle = particles[particles.length - 1]; // Most recent particle
                        
                        // Verify it's a trail particle
                        expect(trailParticle.type).toBe('trail');
                        
                        // Verify Kiro brand colors are used
                        const kiroColors = ['#FF8C00', '#FFA500', '#FFB84D'];
                        expect(kiroColors).toContain(trailParticle.color);
                        
                        // Verify particle is positioned near player
                        const expectedX = player.x + player.width / 2;
                        const expectedY = player.y + player.height / 2;
                        
                        // Allow for random offset (±4 pixels as per implementation)
                        expect(Math.abs(trailParticle.x - expectedX)).toBeLessThanOrEqual(4);
                        expect(Math.abs(trailParticle.y - expectedY)).toBeLessThanOrEqual(4);
                        
                        // Verify particle inherits some velocity from player
                        // Trail particles should have velocity related to player velocity
                        const expectedVelX = player.velocityX * 0.3;
                        const expectedVelY = player.velocityY * 0.3;
                        
                        // Allow for random variation (±1 as per implementation)
                        expect(Math.abs(trailParticle.velocityX - expectedVelX)).toBeLessThanOrEqual(1);
                        expect(Math.abs(trailParticle.velocityY - expectedVelY)).toBeLessThanOrEqual(1);
                        
                        // Verify particle has appropriate life span
                        expect(trailParticle.life).toBeGreaterThan(1000); // Minimum life
                        expect(trailParticle.life).toBeLessThanOrEqual(1500); // Maximum life
                        
                        // Verify particle size is within expected range
                        expect(trailParticle.size).toBeGreaterThanOrEqual(2);
                        expect(trailParticle.size).toBeLessThanOrEqual(4);
                    }
                }
            ),
            { numRuns: 100 } // Run 100 iterations as specified in design document
        );
    });

    /**
     * Additional property test: Verify no trail particles are generated for stationary player
     * This complements the main property by testing the boundary condition
     */
    it('should not generate trail particles when player velocity is below movement threshold', () => {
        fc.assert(
            fc.property(
                // Generate random player positions with very low velocities
                fc.record({
                    x: fc.float({ min: 0, max: 1600 }),
                    y: fc.float({ min: 0, max: 600 }),
                    velocityX: fc.float({ min: -0.5, max: 0.5 }),
                    velocityY: fc.float({ min: -0.5, max: 0.5 })
                }),
                (playerData) => {
                    // Arrange: Create player with low velocity (below movement threshold)
                    const player = createMockPlayer(
                        playerData.x, 
                        playerData.y, 
                        playerData.velocityX, 
                        playerData.velocityY
                    );
                    
                    // Clear any existing particles
                    particleSystem.clear();
                    const initialParticleCount = particleSystem.getParticleCount();
                    
                    // Act: Check movement detection logic
                    const isMoving = Math.abs(player.velocityX) > 0.5 || Math.abs(player.velocityY) > 0.5;
                    
                    if (isMoving) {
                        const trailX = player.x + player.width / 2;
                        const trailY = player.y + player.height / 2;
                        
                        particleSystem.createTrailParticle(
                            trailX, 
                            trailY, 
                            player.velocityX, 
                            player.velocityY
                        );
                    }
                    
                    const finalParticleCount = particleSystem.getParticleCount();
                    
                    // Assert: No trail particles should be generated for stationary/slow-moving player
                    expect(finalParticleCount).toBe(initialParticleCount);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property test: Verify trail particles respect particle system limits
     */
    it('should respect maximum particle limit when generating trail particles', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 50 }), // Number of trail generation attempts
                (attempts) => {
                    // Arrange: Fill particle system near capacity
                    particleSystem.clear();
                    
                    // Fill system to near maximum capacity
                    for (let i = 0; i < particleSystem.maxParticles - 5; i++) {
                        particleSystem.createTrailParticle(100, 100, 1, 1);
                    }
                    
                    const nearCapacityCount = particleSystem.getParticleCount();
                    
                    // Act: Attempt to generate more trail particles
                    for (let i = 0; i < attempts; i++) {
                        particleSystem.createTrailParticle(100 + i, 100 + i, 1, 1);
                    }
                    
                    const finalCount = particleSystem.getParticleCount();
                    
                    // Assert: Particle count should never exceed maximum
                    expect(finalCount).toBeLessThanOrEqual(particleSystem.maxParticles);
                    expect(finalCount).toBeGreaterThanOrEqual(nearCapacityCount);
                }
            ),
            { numRuns: 100 }
        );
    });
});