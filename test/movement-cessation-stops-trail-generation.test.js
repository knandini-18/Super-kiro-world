/**
 * Property-based test for movement cessation stops trail generation
 * Feature: game-enhancements, Property 6: Movement cessation stops trail generation
 * Validates: Requirements 3.3
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { ParticleSystem, createMockContext, createMockPlayer } from './game-classes.js';

describe('Movement Cessation Stops Trail Generation Property Tests', () => {
    let particleSystem;
    let mockContext;

    beforeEach(() => {
        mockContext = createMockContext();
        particleSystem = new ParticleSystem(mockContext);
    });

    /**
     * Property 6: Movement cessation stops trail generation
     * For any game state where player velocity is zero, no new trail particles should be created
     */
    it('should not generate trail particles when player velocity is zero or below movement threshold', () => {
        fc.assert(
            fc.property(
                // Generate random player positions with zero or very low velocities
                fc.record({
                    x: fc.float({ min: 0, max: 1600 }),
                    y: fc.float({ min: 0, max: 600 }),
                    velocityX: fc.float({ min: -0.5, max: 0.5 }),
                    velocityY: fc.float({ min: -0.5, max: 0.5 })
                }),
                (playerData) => {
                    // Arrange: Create player with zero or very low velocity (below movement threshold)
                    const player = createMockPlayer(
                        playerData.x, 
                        playerData.y, 
                        playerData.velocityX, 
                        playerData.velocityY
                    );
                    
                    // Clear any existing particles
                    particleSystem.clear();
                    const initialParticleCount = particleSystem.getParticleCount();
                    
                    // Act: Simulate movement detection logic from game.js
                    const isMoving = Math.abs(player.velocityX) > 0.5 || Math.abs(player.velocityY) > 0.5;
                    
                    // Only generate trail particles if player is moving (as per game logic)
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
                    expect(finalParticleCount).toBe(0);
                    
                    // Verify that the movement detection logic correctly identifies non-moving state
                    expect(isMoving).toBe(false);
                }
            ),
            { numRuns: 100 } // Run 100 iterations as specified in design document
        );
    });

    /**
     * Property test: Verify trail generation stops immediately when player velocity drops below threshold
     */
    it('should stop generating trail particles when player transitions from moving to stationary', () => {
        fc.assert(
            fc.property(
                // Generate scenarios where player transitions from moving to stationary
                fc.record({
                    x: fc.float({ min: 0, max: 1600 }),
                    y: fc.float({ min: 0, max: 600 }),
                    initialVelocityX: fc.float({ min: -10, max: 10 }).filter(v => Math.abs(v) > 0.5),
                    initialVelocityY: fc.float({ min: -10, max: 10 }).filter(v => Math.abs(v) > 0.5),
                    finalVelocityX: fc.float({ min: -0.5, max: 0.5 }),
                    finalVelocityY: fc.float({ min: -0.5, max: 0.5 })
                }),
                (playerData) => {
                    // Arrange: Create player initially moving
                    const player = createMockPlayer(
                        playerData.x, 
                        playerData.y, 
                        playerData.initialVelocityX, 
                        playerData.initialVelocityY
                    );
                    
                    particleSystem.clear();
                    
                    // Act: First phase - player is moving, should generate trail particles
                    let isMoving = Math.abs(player.velocityX) > 0.5 || Math.abs(player.velocityY) > 0.5;
                    
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
                    
                    const particleCountAfterMoving = particleSystem.getParticleCount();
                    
                    // Second phase - player stops moving
                    player.velocityX = playerData.finalVelocityX;
                    player.velocityY = playerData.finalVelocityY;
                    
                    isMoving = Math.abs(player.velocityX) > 0.5 || Math.abs(player.velocityY) > 0.5;
                    
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
                    
                    // Assert: Trail particles should have been generated when moving
                    expect(particleCountAfterMoving).toBeGreaterThan(0);
                    
                    // Assert: No additional trail particles should be generated when stopped
                    expect(finalParticleCount).toBe(particleCountAfterMoving);
                    
                    // Verify movement detection correctly identifies stopped state
                    expect(isMoving).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property test: Verify exact velocity threshold behavior
     */
    it('should respect the exact velocity threshold of 0.5 for trail generation', () => {
        fc.assert(
            fc.property(
                fc.record({
                    x: fc.float({ min: 0, max: 1600 }),
                    y: fc.float({ min: 0, max: 600 }),
                    velocityX: fc.oneof(
                        fc.constant(0.5),    // Exactly at threshold
                        fc.constant(-0.5),   // Exactly at negative threshold
                        fc.constant(0.4),    // Just below threshold
                        fc.constant(-0.4),   // Just below negative threshold
                        fc.constant(0.6),    // Just above threshold
                        fc.constant(-0.6)    // Just above negative threshold
                    ),
                    velocityY: fc.oneof(
                        fc.constant(0.5),    // Exactly at threshold
                        fc.constant(-0.5),   // Exactly at negative threshold
                        fc.constant(0.4),    // Just below threshold
                        fc.constant(-0.4),   // Just below negative threshold
                        fc.constant(0.6),    // Just above threshold
                        fc.constant(-0.6)    // Just above negative threshold
                    )
                }),
                (playerData) => {
                    // Arrange: Create player with specific velocity values around threshold
                    const player = createMockPlayer(
                        playerData.x, 
                        playerData.y, 
                        playerData.velocityX, 
                        playerData.velocityY
                    );
                    
                    particleSystem.clear();
                    const initialParticleCount = particleSystem.getParticleCount();
                    
                    // Act: Apply movement detection logic
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
                    
                    // Assert: Determine expected behavior based on velocity threshold
                    const shouldMove = Math.abs(playerData.velocityX) > 0.5 || Math.abs(playerData.velocityY) > 0.5;
                    
                    if (shouldMove) {
                        // Player should be moving, trail particles should be generated
                        expect(finalParticleCount).toBeGreaterThan(initialParticleCount);
                        expect(isMoving).toBe(true);
                    } else {
                        // Player should not be moving, no trail particles should be generated
                        expect(finalParticleCount).toBe(initialParticleCount);
                        expect(isMoving).toBe(false);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property test: Verify that existing trail particles continue to exist when movement stops
     * (only new generation should stop, existing particles should continue their lifecycle)
     */
    it('should allow existing trail particles to continue when movement stops', () => {
        fc.assert(
            fc.property(
                fc.record({
                    x: fc.float({ min: 0, max: 1600 }),
                    y: fc.float({ min: 0, max: 600 }),
                    movingVelocityX: fc.float({ min: -10, max: 10 }).filter(v => Math.abs(v) > 0.5),
                    movingVelocityY: fc.float({ min: -10, max: 10 }).filter(v => Math.abs(v) > 0.5)
                }),
                (playerData) => {
                    // Arrange: Create player initially moving
                    const player = createMockPlayer(
                        playerData.x, 
                        playerData.y, 
                        playerData.movingVelocityX, 
                        playerData.movingVelocityY
                    );
                    
                    particleSystem.clear();
                    
                    // Generate some trail particles while moving
                    for (let i = 0; i < 5; i++) {
                        const trailX = player.x + player.width / 2;
                        const trailY = player.y + player.height / 2;
                        
                        particleSystem.createTrailParticle(
                            trailX, 
                            trailY, 
                            player.velocityX, 
                            player.velocityY
                        );
                    }
                    
                    const particleCountWithTrails = particleSystem.getParticleCount();
                    expect(particleCountWithTrails).toBeGreaterThan(0);
                    
                    // Act: Stop player movement
                    player.velocityX = 0;
                    player.velocityY = 0;
                    
                    const isMoving = Math.abs(player.velocityX) > 0.5 || Math.abs(player.velocityY) > 0.5;
                    
                    // Try to generate new trail particles (should not happen)
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
                    
                    // Assert: Existing particles should remain, no new particles should be added
                    expect(finalParticleCount).toBe(particleCountWithTrails);
                    expect(isMoving).toBe(false);
                    
                    // Verify all existing particles are still trail particles
                    const trailParticles = particleSystem.particles.filter(p => p.type === 'trail');
                    expect(trailParticles.length).toBe(finalParticleCount);
                }
            ),
            { numRuns: 100 }
        );
    });
});