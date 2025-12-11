// **Feature: game-enhancements, Property 10: Sparkle particle visual properties**
// **Validates: Requirements 5.2, 5.3**

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { ParticleSystem, createMockContext } from './game-classes.js';
import './setup.js';

describe('Sparkle particle visual properties property tests', () => {
    let particleSystem;
    let mockContext;

    beforeEach(() => {
        mockContext = createMockContext();
        particleSystem = new ParticleSystem(mockContext);
    });

    it('Property 10: For any sparkle particle, it should use bright, contrasting colors and exhibit twinkling animation behavior', () => {
        fc.assert(fc.property(
            // Generate random positions for sparkle creation
            fc.record({
                x: fc.integer({ min: 0, max: 800 }),
                y: fc.integer({ min: 0, max: 600 }),
                count: fc.integer({ min: 1, max: 10 })
            }),
            (sparkleData) => {
                particleSystem.clear();
                
                // Create sparkle particles at the specified position
                particleSystem.createSparkleParticles(sparkleData.x, sparkleData.y, sparkleData.count);
                
                // Get all sparkle particles
                const sparkleParticles = particleSystem.particles.filter(p => p.type === 'sparkle');
                
                // Verify we created the expected number of particles (up to max limit)
                expect(sparkleParticles.length).toBeGreaterThan(0);
                expect(sparkleParticles.length).toBeLessThanOrEqual(sparkleData.count);
                
                // Verify each sparkle particle has bright, contrasting colors (Requirement 5.2)
                const brightColors = ['#FFFFFF', '#FFD700', '#FFFF00', '#00FFFF', '#FF00FF', '#00FF00'];
                
                sparkleParticles.forEach(particle => {
                    // Check color is one of the bright, contrasting colors
                    expect(brightColors).toContain(particle.color);
                    
                    // Check particle has twinkling properties for animation (Requirement 5.3)
                    expect(particle.twinkleSpeed).toBeDefined();
                    expect(particle.twinkleSpeed).toBeGreaterThan(0);
                    expect(particle.twinkleOffset).toBeDefined();
                    expect(particle.twinkleOffset).toBeGreaterThanOrEqual(0);
                    expect(particle.twinkleOffset).toBeLessThan(Math.PI * 2);
                    
                    // Check particle has appropriate size for visibility
                    expect(particle.size).toBeGreaterThanOrEqual(3);
                    expect(particle.size).toBeLessThanOrEqual(6);
                    
                    // Check particle has longer life for better visibility
                    expect(particle.life).toBeGreaterThanOrEqual(2000);
                    expect(particle.life).toBeLessThanOrEqual(3500);
                    
                    // Check particle type is correct
                    expect(particle.type).toBe('sparkle');
                });
            }
        ), { numRuns: 100 });
    });

    it('Property 10 Twinkling Animation: Sparkle particles should exhibit twinkling behavior over time', () => {
        fc.assert(fc.property(
            fc.record({
                x: fc.integer({ min: 100, max: 700 }),
                y: fc.integer({ min: 100, max: 500 }),
                deltaTime: fc.float({ min: 10, max: 50 })
            }),
            (testData) => {
                particleSystem.clear();
                
                // Create a sparkle particle
                particleSystem.createSparkleParticles(testData.x, testData.y, 1);
                const sparkleParticle = particleSystem.particles.find(p => p.type === 'sparkle');
                
                expect(sparkleParticle).toBeDefined();
                
                // Record initial alpha
                const initialAlpha = sparkleParticle.alpha;
                
                // Update the particle to trigger twinkling animation
                sparkleParticle.update(testData.deltaTime);
                
                // After update, alpha should be modified by twinkling effect
                // The twinkling effect modulates alpha, so it should be different from base fade
                const baseAlpha = Math.max(0, sparkleParticle.life / sparkleParticle.maxLife);
                
                // The actual alpha should be the result of twinkling modulation
                // We can't predict the exact value due to sine wave, but we can verify it's reasonable
                expect(sparkleParticle.alpha).toBeGreaterThanOrEqual(0);
                expect(sparkleParticle.alpha).toBeLessThanOrEqual(1);
                
                // Verify twinkling properties are still present and valid
                expect(sparkleParticle.twinkleSpeed).toBeGreaterThan(0);
                expect(sparkleParticle.twinkleOffset).toBeGreaterThanOrEqual(0);
            }
        ), { numRuns: 100 });
    });

    it('Property 10 Color Brightness: All sparkle colors should be bright and contrasting', () => {
        fc.assert(fc.property(
            fc.record({
                x: fc.integer({ min: 0, max: 800 }),
                y: fc.integer({ min: 0, max: 600 })
            }),
            (position) => {
                particleSystem.clear();
                
                // Create multiple sparkle particles to test color variety
                particleSystem.createSparkleParticles(position.x, position.y, 20);
                
                const sparkleParticles = particleSystem.particles.filter(p => p.type === 'sparkle');
                const brightColors = ['#FFFFFF', '#FFD700', '#FFFF00', '#00FFFF', '#FF00FF', '#00FF00'];
                
                // Verify all particles use only bright, contrasting colors
                sparkleParticles.forEach(particle => {
                    expect(brightColors).toContain(particle.color);
                });
                
                // Verify we have color variety (not all the same color)
                const uniqueColors = new Set(sparkleParticles.map(p => p.color));
                
                // With 20 particles and 6 colors, we should have some variety
                // (This is probabilistic, but very likely with random selection)
                if (sparkleParticles.length >= 6) {
                    expect(uniqueColors.size).toBeGreaterThan(1);
                }
            }
        ), { numRuns: 100 });
    });

    it('Property 10 Visual Prominence: Sparkle particles should have properties that make them visually prominent', () => {
        fc.assert(fc.property(
            fc.record({
                x: fc.integer({ min: 0, max: 800 }),
                y: fc.integer({ min: 0, max: 600 }),
                count: fc.integer({ min: 1, max: 5 })
            }),
            (sparkleData) => {
                particleSystem.clear();
                
                // Create sparkle particles
                particleSystem.createSparkleParticles(sparkleData.x, sparkleData.y, sparkleData.count);
                
                const sparkleParticles = particleSystem.particles.filter(p => p.type === 'sparkle');
                
                sparkleParticles.forEach(particle => {
                    // Sparkle particles should be larger than trail particles for visibility
                    expect(particle.size).toBeGreaterThanOrEqual(3);
                    
                    // Sparkle particles should have longer life than explosion particles
                    expect(particle.life).toBeGreaterThan(1500);
                    
                    // Sparkle particles should have gentle motion (not too fast)
                    expect(Math.abs(particle.velocityX)).toBeLessThanOrEqual(1.5);
                    expect(Math.abs(particle.velocityY)).toBeLessThanOrEqual(2);
                    
                    // Sparkle particles should have upward or floating motion
                    expect(particle.velocityY).toBeLessThanOrEqual(0.5); // Generally upward or neutral
                });
            }
        ), { numRuns: 100 });
    });
});