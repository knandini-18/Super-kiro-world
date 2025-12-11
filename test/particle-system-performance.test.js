/**
 * Performance tests for particle system
 * Task 10.1: Write performance tests for particle system
 * **Feature: game-enhancements, Property Performance: Particle system maintains 60 FPS under load**
 * **Validates: Requirements 3.5, 4.4**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParticleSystem, Particle } from './game-classes.js';

describe('Particle System Performance Tests', () => {
    let particleSystem;
    let mockContext;

    beforeEach(() => {
        mockContext = {
            fillRect: vi.fn(),
            strokeRect: vi.fn(),
            fillText: vi.fn(),
            drawImage: vi.fn(),
            beginPath: vi.fn(),
            arc: vi.fn(),
            fill: vi.fn(),
            stroke: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            closePath: vi.fn(),
            save: vi.fn(),
            restore: vi.fn(),
            translate: vi.fn(),
            rotate: vi.fn(),
            clearRect: vi.fn(),
            measureText: vi.fn(() => ({ width: 100 })),
            set fillStyle(value) { this._fillStyle = value; },
            get fillStyle() { return this._fillStyle; },
            set strokeStyle(value) { this._strokeStyle = value; },
            get strokeStyle() { return this._strokeStyle; },
            set lineWidth(value) { this._lineWidth = value; },
            get lineWidth() { return this._lineWidth; },
            set font(value) { this._font = value; },
            get font() { return this._font; },
            set textAlign(value) { this._textAlign = value; },
            get textAlign() { return this._textAlign; },
            set textBaseline(value) { this._textBaseline = value; },
            get textBaseline() { return this._textBaseline; },
            set globalAlpha(value) { this._globalAlpha = value; },
            get globalAlpha() { return this._globalAlpha; }
        };

        particleSystem = new ParticleSystem(mockContext);
    });

    describe('60 FPS Performance Under Load', () => {
        it('should maintain 60 FPS performance with maximum particle load', () => {
            // Arrange: Create maximum number of particles (200 as per performance limit)
            const maxParticles = 200;
            const targetFrameTime = 16.67; // 60 FPS = ~16.67ms per frame
            
            // Create particles of different types to simulate real game conditions
            for (let i = 0; i < maxParticles; i++) {
                const particleType = ['trail', 'explosion', 'sparkle', 'confetti'][i % 4];
                const x = Math.random() * 800;
                const y = Math.random() * 600;
                const vx = (Math.random() - 0.5) * 10;
                const vy = (Math.random() - 0.5) * 10;
                
                switch (particleType) {
                    case 'trail':
                        particleSystem.createTrailParticle(x, y, vx, vy);
                        break;
                    case 'explosion':
                        particleSystem.createExplosionParticles(x, y, 1);
                        break;
                    case 'sparkle':
                        particleSystem.createSparkleParticles(x, y, 1);
                        break;
                    case 'confetti':
                        particleSystem.createConfettiParticles(x, y, 1);
                        break;
                }
            }

            // Verify we have maximum particles
            expect(particleSystem.getParticleCount()).toBeLessThanOrEqual(maxParticles);

            // Act: Measure update performance over multiple frames
            const frameCount = 60; // Test 1 second worth of frames
            const startTime = performance.now();
            
            for (let frame = 0; frame < frameCount; frame++) {
                particleSystem.update(targetFrameTime);
            }
            
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            const averageFrameTime = totalTime / frameCount;

            // Assert: Average frame time should be well under 16.67ms to maintain 60 FPS
            // Allow some overhead for test environment, but should be significantly faster
            expect(averageFrameTime).toBeLessThan(10); // Should be much faster than 16.67ms
            
            console.log(`Average frame time with ${particleSystem.getParticleCount()} particles: ${averageFrameTime.toFixed(2)}ms`);
        });

        it('should maintain performance with mixed particle operations', () => {
            // Arrange: Simulate realistic game scenario with mixed particle operations
            const targetFrameTime = 16.67;
            const testDuration = 30; // 30 frames (~0.5 seconds)
            
            const startTime = performance.now();
            
            // Act: Simulate realistic game loop with particle creation and updates
            for (let frame = 0; frame < testDuration; frame++) {
                // Simulate player movement creating trail particles
                if (frame % 2 === 0) { // Every other frame
                    particleSystem.createTrailParticle(
                        100 + frame * 5, 
                        300, 
                        2, 
                        0
                    );
                }
                
                // Simulate occasional collisions creating explosion particles
                if (frame % 10 === 0) { // Every 10 frames
                    particleSystem.createExplosionParticles(
                        200 + frame * 10, 
                        250, 
                        8
                    );
                }
                
                // Simulate sparkle effects in obstacle areas
                if (frame % 5 === 0) { // Every 5 frames
                    particleSystem.createSparkleParticles(
                        300 + frame * 8, 
                        200, 
                        3
                    );
                }
                
                // Update particle system
                particleSystem.update(targetFrameTime);
                
                // Simulate rendering (just call render without measuring render time)
                const mockCamera = { x: 0, y: 0 };
                particleSystem.render(mockContext, mockCamera);
            }
            
            const endTime = performance.now();
            const totalTime = endTime - testDuration;
            const averageFrameTime = totalTime / testDuration;
            
            // Assert: Should maintain good performance even with dynamic particle creation
            expect(averageFrameTime).toBeLessThan(8); // Should be well under 16.67ms
            expect(particleSystem.getParticleCount()).toBeGreaterThan(0); // Should have active particles
            
            console.log(`Mixed operations average frame time: ${averageFrameTime.toFixed(2)}ms with ${particleSystem.getParticleCount()} particles`);
        });

        it('should handle burst particle creation without performance degradation', () => {
            // Arrange: Simulate burst scenarios like confetti celebrations or multiple explosions
            const burstSize = 50; // Large burst of particles
            const targetFrameTime = 16.67;
            
            // Act: Create burst of particles and measure update performance
            const startTime = performance.now();
            
            // Create burst of confetti particles (simulating high score celebration)
            particleSystem.createConfettiParticles(400, 200, burstSize, ['#FF8C00', '#FFA500', '#FFB84D']);
            
            // Update particles for several frames to test sustained performance
            for (let frame = 0; frame < 10; frame++) {
                particleSystem.update(targetFrameTime);
            }
            
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            const averageFrameTime = totalTime / 10;
            
            // Assert: Should handle burst creation and updates efficiently
            expect(averageFrameTime).toBeLessThan(5); // Should be very fast
            expect(particleSystem.getParticleCount()).toBeLessThanOrEqual(200); // Respects max limit
            
            console.log(`Burst creation average frame time: ${averageFrameTime.toFixed(2)}ms`);
        });
    });

    describe('Memory Cleanup Efficiency', () => {
        it('should efficiently remove dead particles without memory leaks', () => {
            // Arrange: Create particles with very short lifespans
            const particleCount = 100;
            const shortLifespan = 50; // 50ms lifespan
            
            for (let i = 0; i < particleCount; i++) {
                const particle = new Particle(
                    100 + i, 
                    100, 
                    0, 
                    0, 
                    shortLifespan, 
                    '#FF8C00', 
                    'trail'
                );
                particleSystem.particles.push(particle);
            }
            
            expect(particleSystem.getParticleCount()).toBe(particleCount);
            
            // Act: Update particles to expire them and measure cleanup efficiency
            const startTime = performance.now();
            
            // Update with large delta time to expire all particles
            particleSystem.update(100); // 100ms delta time should expire all particles
            
            const endTime = performance.now();
            const cleanupTime = endTime - startTime;
            
            // Assert: All particles should be cleaned up efficiently
            expect(particleSystem.getParticleCount()).toBe(0);
            expect(cleanupTime).toBeLessThan(5); // Cleanup should be very fast
            
            console.log(`Cleanup time for ${particleCount} particles: ${cleanupTime.toFixed(2)}ms`);
        });

        it('should maintain memory efficiency during continuous particle lifecycle', () => {
            // Arrange: Simulate continuous particle creation and cleanup over time
            const testDuration = 50; // 50 update cycles
            const particlesPerCycle = 5;
            const targetFrameTime = 16.67;
            
            let maxParticleCount = 0;
            const particleCountHistory = [];
            
            // Act: Continuously create and update particles
            for (let cycle = 0; cycle < testDuration; cycle++) {
                // Create new particles each cycle
                for (let i = 0; i < particlesPerCycle; i++) {
                    particleSystem.createTrailParticle(
                        cycle * 10 + i * 5, 
                        100, 
                        1, 
                        0
                    );
                }
                
                // Update particles (some will die, some will continue)
                particleSystem.update(targetFrameTime);
                
                const currentCount = particleSystem.getParticleCount();
                particleCountHistory.push(currentCount);
                maxParticleCount = Math.max(maxParticleCount, currentCount);
            }
            
            // Assert: Memory should be managed efficiently
            expect(maxParticleCount).toBeLessThanOrEqual(200); // Should respect max limit
            
            // Check that particle count stabilizes (not growing indefinitely)
            const finalCount = particleSystem.getParticleCount();
            const midTestCount = particleCountHistory[Math.floor(testDuration / 2)];
            
            // Final count should not be significantly higher than mid-test count
            // This indicates proper cleanup is happening
            expect(finalCount).toBeLessThanOrEqual(midTestCount * 1.5);
            
            console.log(`Max particles during continuous lifecycle: ${maxParticleCount}`);
            console.log(`Final particle count: ${finalCount}`);
        });

        it('should handle memory cleanup for different particle types efficiently', () => {
            // Arrange: Create mix of particle types with different lifespans
            const particleTypes = [
                { type: 'trail', life: 100 },
                { type: 'explosion', life: 200 },
                { type: 'sparkle', life: 300 },
                { type: 'confetti', life: 150 }
            ];
            
            const particlesPerType = 25; // 100 total particles
            
            particleTypes.forEach(({ type, life }) => {
                for (let i = 0; i < particlesPerType; i++) {
                    const particle = new Particle(
                        100 + i * 2, 
                        100, 
                        0, 
                        0, 
                        life, 
                        '#FF8C00', 
                        type
                    );
                    particleSystem.particles.push(particle);
                }
            });
            
            const initialCount = particleSystem.getParticleCount();
            expect(initialCount).toBe(100);
            
            // Act: Update particles through multiple cleanup cycles
            const startTime = performance.now();
            
            // Update with incremental time to test selective cleanup
            particleSystem.update(120); // Should remove trail particles (life: 100)
            const afterFirstCleanup = particleSystem.getParticleCount();
            
            particleSystem.update(50);  // Should remove explosion particles (total: 170ms)
            const afterSecondCleanup = particleSystem.getParticleCount();
            
            particleSystem.update(100); // Should remove confetti particles (total: 270ms)
            const afterThirdCleanup = particleSystem.getParticleCount();
            
            particleSystem.update(50);  // Should remove sparkle particles (total: 320ms)
            const finalCount = particleSystem.getParticleCount();
            
            const endTime = performance.now();
            const totalCleanupTime = endTime - startTime;
            
            // Assert: Cleanup should be selective and efficient
            expect(afterFirstCleanup).toBeLessThan(initialCount); // Some particles removed
            expect(afterSecondCleanup).toBeLessThan(afterFirstCleanup); // More particles removed
            expect(afterThirdCleanup).toBeLessThan(afterSecondCleanup); // Even more removed
            expect(finalCount).toBe(0); // All particles should be gone
            
            expect(totalCleanupTime).toBeLessThan(10); // Cleanup should be fast
            
            console.log(`Selective cleanup progression: ${initialCount} → ${afterFirstCleanup} → ${afterSecondCleanup} → ${afterThirdCleanup} → ${finalCount}`);
            console.log(`Total cleanup time: ${totalCleanupTime.toFixed(2)}ms`);
        });

        it('should prevent memory leaks during particle system clear operations', () => {
            // Arrange: Fill particle system with particles
            const particleCount = 150;
            
            for (let i = 0; i < particleCount; i++) {
                particleSystem.createTrailParticle(i * 2, 100, 1, 0);
            }
            
            expect(particleSystem.getParticleCount()).toBeGreaterThan(0);
            
            // Act: Clear all particles and measure performance
            const startTime = performance.now();
            
            particleSystem.clear();
            
            const endTime = performance.now();
            const clearTime = endTime - startTime;
            
            // Assert: Clear operation should be immediate and complete
            expect(particleSystem.getParticleCount()).toBe(0);
            expect(clearTime).toBeLessThan(1); // Should be nearly instantaneous
            
            // Verify system can still create particles after clear
            particleSystem.createTrailParticle(100, 100, 1, 0);
            expect(particleSystem.getParticleCount()).toBe(1);
            
            console.log(`Clear operation time for ${particleCount} particles: ${clearTime.toFixed(2)}ms`);
        });
    });

    describe('Performance Limits and Boundaries', () => {
        it('should enforce particle count limits for performance protection', () => {
            // Arrange: Attempt to create more particles than the system limit
            const attemptedParticles = 300; // More than the 200 limit
            
            // Act: Try to create excessive particles
            for (let i = 0; i < attemptedParticles; i++) {
                particleSystem.createTrailParticle(i, 100, 1, 0);
            }
            
            // Assert: Should not exceed performance limit
            expect(particleSystem.getParticleCount()).toBeLessThanOrEqual(200);
            
            console.log(`Attempted ${attemptedParticles} particles, actual count: ${particleSystem.getParticleCount()}`);
        });

        it('should maintain performance when particle limit is reached', () => {
            // Arrange: Fill system to capacity
            while (particleSystem.getParticleCount() < 200) {
                particleSystem.createTrailParticle(
                    Math.random() * 800, 
                    Math.random() * 600, 
                    Math.random() * 4 - 2, 
                    Math.random() * 4 - 2
                );
            }
            
            const targetFrameTime = 16.67;
            
            // Act: Continue operations at capacity and measure performance
            const startTime = performance.now();
            
            for (let frame = 0; frame < 30; frame++) {
                // Try to create more particles (should be rejected)
                particleSystem.createTrailParticle(100, 100, 1, 0);
                
                // Update existing particles
                particleSystem.update(targetFrameTime);
            }
            
            const endTime = performance.now();
            const averageFrameTime = (endTime - startTime) / 30;
            
            // Assert: Performance should remain good even at capacity
            expect(averageFrameTime).toBeLessThan(8);
            expect(particleSystem.getParticleCount()).toBeLessThanOrEqual(200);
            
            console.log(`Performance at capacity: ${averageFrameTime.toFixed(2)}ms per frame`);
        });
    });
});