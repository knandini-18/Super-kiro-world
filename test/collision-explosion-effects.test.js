/**
 * Tests for collision-based explosion effects
 * Task 6: Add collision-based explosion effects
 * Requirements: 4.1, 4.2, 4.3
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ParticleSystem, createMockContext, createMockPlayer } from './game-classes.js';
import fc from 'fast-check';

describe('Collision-based Explosion Effects', () => {
    let particleSystem;
    let mockContext;

    beforeEach(() => {
        mockContext = createMockContext();
        particleSystem = new ParticleSystem(mockContext);
    });

    describe('Platform Collision Explosions', () => {
        it('should create explosion particles when player collides with platform', () => {
            // Arrange
            const collisionX = 200;
            const collisionY = 300;
            const initialParticleCount = particleSystem.getParticleCount();

            // Act: Simulate platform collision explosion
            particleSystem.createExplosionParticles(
                collisionX, 
                collisionY, 
                8, // Platform collision particle count
                ['#FF8C00', '#FFA500', '#FFB84D', '#FFFFFF']
            );

            // Assert
            const finalParticleCount = particleSystem.getParticleCount();
            expect(finalParticleCount).toBe(initialParticleCount + 8);

            // Verify explosion particles have correct properties
            const explosionParticles = particleSystem.particles.slice(-8); // Last 8 particles
            explosionParticles.forEach(particle => {
                expect(particle.type).toBe('explosion');
                expect(['#FF8C00', '#FFA500', '#FFB84D', '#FFFFFF']).toContain(particle.color);
                expect(particle.x).toBe(collisionX);
                expect(particle.y).toBe(collisionY);
                
                // Verify outward motion physics
                const speed = Math.sqrt(particle.velocityX ** 2 + particle.velocityY ** 2);
                expect(speed).toBeGreaterThan(3); // Minimum speed
                expect(speed).toBeLessThanOrEqual(7); // Maximum speed (3 + 4)
                
                // Verify particle life span
                expect(particle.life).toBeGreaterThan(800);
                expect(particle.life).toBeLessThanOrEqual(1200);
                
                // Verify particle size
                expect(particle.size).toBeGreaterThanOrEqual(3);
                expect(particle.size).toBeLessThanOrEqual(6);
            });
        });
    });

    describe('Collectible Collision Explosions', () => {
        it('should create distinct explosion effects for collectible collisions', () => {
            // Arrange
            const collectibleX = 150;
            const collectibleY = 250;
            const initialParticleCount = particleSystem.getParticleCount();

            // Act: Simulate collectible collision explosion
            particleSystem.createExplosionParticles(
                collectibleX, 
                collectibleY, 
                12, // More particles for collectibles
                ['#FFB84D', '#FFD700', '#FFFF00', '#FFA500']
            );

            // Assert
            const finalParticleCount = particleSystem.getParticleCount();
            expect(finalParticleCount).toBe(initialParticleCount + 12);

            // Verify collectible explosion particles have distinct properties
            const explosionParticles = particleSystem.particles.slice(-12); // Last 12 particles
            explosionParticles.forEach(particle => {
                expect(particle.type).toBe('explosion');
                expect(['#FFB84D', '#FFD700', '#FFFF00', '#FFA500']).toContain(particle.color);
                expect(particle.x).toBe(collectibleX);
                expect(particle.y).toBe(collectibleY);
                
                // Verify outward motion physics
                const speed = Math.sqrt(particle.velocityX ** 2 + particle.velocityY ** 2);
                expect(speed).toBeGreaterThan(3);
                expect(speed).toBeLessThanOrEqual(7);
            });
        });
    });

    describe('Power-up Collision Explosions', () => {
        it('should create special explosion effects for speed power-up collisions', () => {
            // Arrange
            const powerUpX = 300;
            const powerUpY = 400;
            const initialParticleCount = particleSystem.getParticleCount();

            // Act: Simulate speed power-up collision explosion
            particleSystem.createExplosionParticles(
                powerUpX, 
                powerUpY, 
                15, // Even more particles for power-ups
                ['#00FFFF', '#00CCFF', '#0099FF', '#FFFFFF'] // Cyan variants for speed
            );

            // Assert
            const finalParticleCount = particleSystem.getParticleCount();
            expect(finalParticleCount).toBe(initialParticleCount + 15);

            // Verify power-up explosion particles have special properties
            const explosionParticles = particleSystem.particles.slice(-15); // Last 15 particles
            explosionParticles.forEach(particle => {
                expect(particle.type).toBe('explosion');
                expect(['#00FFFF', '#00CCFF', '#0099FF', '#FFFFFF']).toContain(particle.color);
                expect(particle.x).toBe(powerUpX);
                expect(particle.y).toBe(powerUpY);
            });
        });

        it('should create special explosion effects for life power-up collisions', () => {
            // Arrange
            const powerUpX = 350;
            const powerUpY = 450;
            const initialParticleCount = particleSystem.getParticleCount();

            // Act: Simulate life power-up collision explosion
            particleSystem.createExplosionParticles(
                powerUpX, 
                powerUpY, 
                15,
                ['#FF0080', '#FF3399', '#FF66B2', '#FFFFFF'] // Pink variants for life
            );

            // Assert
            const finalParticleCount = particleSystem.getParticleCount();
            expect(finalParticleCount).toBe(initialParticleCount + 15);

            // Verify life power-up explosion particles
            const explosionParticles = particleSystem.particles.slice(-15);
            explosionParticles.forEach(particle => {
                expect(particle.type).toBe('explosion');
                expect(['#FF0080', '#FF3399', '#FF66B2', '#FFFFFF']).toContain(particle.color);
            });
        });

        it('should create special explosion effects for score power-up collisions', () => {
            // Arrange
            const powerUpX = 400;
            const powerUpY = 500;
            const initialParticleCount = particleSystem.getParticleCount();

            // Act: Simulate score power-up collision explosion
            particleSystem.createExplosionParticles(
                powerUpX, 
                powerUpY, 
                15,
                ['#FFFF00', '#FFD700', '#FFA500', '#FFFFFF'] // Yellow variants for score
            );

            // Assert
            const finalParticleCount = particleSystem.getParticleCount();
            expect(finalParticleCount).toBe(initialParticleCount + 15);

            // Verify score power-up explosion particles
            const explosionParticles = particleSystem.particles.slice(-15);
            explosionParticles.forEach(particle => {
                expect(particle.type).toBe('explosion');
                expect(['#FFFF00', '#FFD700', '#FFA500', '#FFFFFF']).toContain(particle.color);
            });
        });
    });

    describe('Explosion Particle Physics', () => {
        it('should apply gravity and air resistance to explosion particles', () => {
            // Arrange
            particleSystem.createExplosionParticles(100, 100, 5);
            const explosionParticles = particleSystem.particles.slice(-5);
            
            // Store initial velocities
            const initialVelocities = explosionParticles.map(p => ({
                x: p.velocityX,
                y: p.velocityY
            }));

            // Act: Update particles to simulate physics
            const deltaTime = 16.67; // ~60 FPS
            particleSystem.update(deltaTime);

            // Assert: Verify physics effects
            explosionParticles.forEach((particle, index) => {
                // Verify gravity effect (velocityY should increase)
                expect(particle.velocityY).toBeGreaterThan(initialVelocities[index].y);
                
                // Verify air resistance (velocities should decrease in magnitude)
                const initialSpeed = Math.sqrt(initialVelocities[index].x ** 2 + initialVelocities[index].y ** 2);
                const currentSpeed = Math.sqrt(particle.velocityX ** 2 + particle.velocityY ** 2);
                
                // Air resistance should reduce speed (accounting for gravity effect on Y)
                expect(Math.abs(particle.velocityX)).toBeLessThan(Math.abs(initialVelocities[index].x));
                
                // Verify particle life decreases
                expect(particle.life).toBeLessThan(particle.maxLife);
                
                // Verify alpha fading
                expect(particle.alpha).toBeLessThan(1.0);
                expect(particle.alpha).toBe(particle.life / particle.maxLife);
            });
        });

        it('should remove explosion particles when they die', () => {
            // Arrange
            particleSystem.createExplosionParticles(100, 100, 3);
            const initialCount = particleSystem.getParticleCount();
            
            // Set particles to very low life
            particleSystem.particles.forEach(particle => {
                particle.life = 1; // Very low life
            });

            // Act: Update to kill particles
            particleSystem.update(16.67);

            // Assert: Dead particles should be removed
            const finalCount = particleSystem.getParticleCount();
            expect(finalCount).toBeLessThan(initialCount);
            
            // Verify no dead particles remain
            particleSystem.particles.forEach(particle => {
                expect(particle.isDead()).toBe(false);
            });
        });
    });

    describe('Performance and Memory Management', () => {
        it('should respect maximum particle limits during collision explosions', () => {
            // Arrange: Fill system near capacity
            particleSystem.clear();
            for (let i = 0; i < particleSystem.maxParticles - 10; i++) {
                particleSystem.createExplosionParticles(100, 100, 1);
            }
            
            const nearCapacityCount = particleSystem.getParticleCount();

            // Act: Try to create more explosion particles
            particleSystem.createExplosionParticles(200, 200, 20); // Try to add 20 more

            // Assert: Should not exceed maximum
            const finalCount = particleSystem.getParticleCount();
            expect(finalCount).toBeLessThanOrEqual(particleSystem.maxParticles);
            expect(finalCount).toBeGreaterThanOrEqual(nearCapacityCount);
        });
    });

    describe('Property-Based Tests', () => {
        /**
         * **Feature: game-enhancements, Property 7: Collision-triggered particle generation**
         * **Validates: Requirements 4.1, 4.2**
         */
        it('should generate explosion particles at collision coordinates for any collision event', () => {
            fc.assert(fc.property(
                // Generate random collision coordinates within reasonable game bounds
                fc.integer({ min: 0, max: 1600 }), // collisionX
                fc.integer({ min: 0, max: 600 }),  // collisionY
                // Generate random collision types (platform, collectible, power-up)
                fc.constantFrom('platform', 'collectible', 'powerup'),
                // Generate random particle counts based on collision type
                fc.integer({ min: 5, max: 20 }),   // particleCount
                (collisionX, collisionY, collisionType, particleCount) => {
                    // Arrange: Clear particle system and record initial state
                    particleSystem.clear();
                    const initialParticleCount = particleSystem.getParticleCount();
                    
                    // Define collision-appropriate colors based on type
                    let expectedColors;
                    switch (collisionType) {
                        case 'platform':
                            expectedColors = ['#FF8C00', '#FFA500', '#FFB84D', '#FFFFFF'];
                            break;
                        case 'collectible':
                            expectedColors = ['#FFB84D', '#FFD700', '#FFFF00', '#FFA500'];
                            break;
                        case 'powerup':
                            expectedColors = ['#00FFFF', '#00CCFF', '#0099FF', '#FFFFFF'];
                            break;
                    }
                    
                    // Act: Simulate collision event by creating explosion particles
                    particleSystem.createExplosionParticles(
                        collisionX, 
                        collisionY, 
                        particleCount, 
                        expectedColors
                    );
                    
                    // Assert: Verify particles were generated at collision coordinates
                    const finalParticleCount = particleSystem.getParticleCount();
                    const actualParticlesCreated = finalParticleCount - initialParticleCount;
                    
                    // Should create particles (respecting max particle limit)
                    const expectedParticlesCreated = Math.min(
                        particleCount, 
                        particleSystem.maxParticles - initialParticleCount
                    );
                    expect(actualParticlesCreated).toBe(expectedParticlesCreated);
                    
                    // Verify all created particles have correct properties
                    const newParticles = particleSystem.particles.slice(-actualParticlesCreated);
                    newParticles.forEach(particle => {
                        // All particles should be explosion type
                        expect(particle.type).toBe('explosion');
                        
                        // All particles should start at collision coordinates
                        expect(particle.x).toBe(collisionX);
                        expect(particle.y).toBe(collisionY);
                        
                        // All particles should have appropriate colors for collision type
                        expect(expectedColors).toContain(particle.color);
                        
                        // All particles should have outward motion (non-zero velocity)
                        const speed = Math.sqrt(particle.velocityX ** 2 + particle.velocityY ** 2);
                        expect(speed).toBeGreaterThan(0);
                        
                        // All particles should have reasonable life span
                        expect(particle.life).toBeGreaterThan(0);
                        expect(particle.maxLife).toBeGreaterThan(0);
                        
                        // All particles should have reasonable size
                        expect(particle.size).toBeGreaterThan(0);
                        expect(particle.size).toBeLessThanOrEqual(10);
                    });
                }
            ), { numRuns: 100 }); // Run 100 iterations as specified in design document
        });
    });
});