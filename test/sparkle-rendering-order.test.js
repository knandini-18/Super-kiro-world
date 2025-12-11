// Unit test for sparkle rendering order
// **Validates: Requirements 5.5**

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParticleSystem, createMockContext } from './game-classes.js';
import './setup.js';

describe('Sparkle rendering order unit tests', () => {
    let particleSystem;
    let mockContext;
    let renderCalls;

    beforeEach(() => {
        renderCalls = [];
        
        // Create a mock context that tracks render calls
        mockContext = createMockContext();
        
        // Override render methods to track call order
        const originalFillRect = mockContext.fillRect;
        const originalBeginPath = mockContext.beginPath;
        const originalArc = mockContext.arc;
        const originalFill = mockContext.fill;
        
        mockContext.fillRect = vi.fn((...args) => {
            renderCalls.push({ method: 'fillRect', args, context: 'particle' });
            return originalFillRect.apply(mockContext, args);
        });
        
        mockContext.beginPath = vi.fn((...args) => {
            renderCalls.push({ method: 'beginPath', args, context: 'particle' });
            return originalBeginPath.apply(mockContext, args);
        });
        
        mockContext.arc = vi.fn((...args) => {
            renderCalls.push({ method: 'arc', args, context: 'particle' });
            return originalArc.apply(mockContext, args);
        });
        
        mockContext.fill = vi.fn((...args) => {
            renderCalls.push({ method: 'fill', args, context: 'particle' });
            return originalFill.apply(mockContext, args);
        });
        
        particleSystem = new ParticleSystem(mockContext);
    });

    it('should render sparkle particles above other particle types for prominence (Requirement 5.5)', () => {
        // Create different types of particles
        particleSystem.createTrailParticle(100, 100, 1, 1);
        particleSystem.createExplosionParticles(200, 200, 3);
        particleSystem.createSparkleParticles(300, 300, 2);
        particleSystem.createConfettiParticles(400, 400, 2);
        
        // Verify we have different particle types
        const trailParticles = particleSystem.particles.filter(p => p.type === 'trail');
        const explosionParticles = particleSystem.particles.filter(p => p.type === 'explosion');
        const sparkleParticles = particleSystem.particles.filter(p => p.type === 'sparkle');
        const confettiParticles = particleSystem.particles.filter(p => p.type === 'confetti');
        
        expect(trailParticles.length).toBeGreaterThan(0);
        expect(explosionParticles.length).toBeGreaterThan(0);
        expect(sparkleParticles.length).toBeGreaterThan(0);
        expect(confettiParticles.length).toBeGreaterThan(0);
        
        // Clear render calls and render the particle system
        renderCalls = [];
        const mockCamera = { x: 0, y: 0 };
        particleSystem.render(mockContext, mockCamera);
        
        // Find the indices of first sparkle render call and last non-sparkle render call
        let lastNonSparkleIndex = -1;
        let firstSparkleIndex = -1;
        
        // We need to track which particles are being rendered by looking at the render pattern
        // Sparkle particles use star rendering (multiple lineTo calls), others use different patterns
        
        // For this test, we'll verify the render method calls the particles in the correct order
        // by checking that sparkle particles are rendered after other particles
        
        // Since we can't easily distinguish particle types from render calls alone,
        // we'll test the particle system's render method directly
        const originalParticleRender = particleSystem.particles[0].render;
        let renderOrder = [];
        
        // Mock each particle's render method to track order
        particleSystem.particles.forEach((particle, index) => {
            particle.render = vi.fn((ctx) => {
                renderOrder.push({ index, type: particle.type });
                return originalParticleRender.call(particle, ctx);
            });
        });
        
        // Clear and render again with our tracking
        renderOrder = [];
        particleSystem.render(mockContext, mockCamera);
        
        // Verify rendering order: non-sparkle particles should be rendered before sparkle particles
        const nonSparkleRenders = renderOrder.filter(r => r.type !== 'sparkle');
        const sparkleRenders = renderOrder.filter(r => r.type === 'sparkle');
        
        if (nonSparkleRenders.length > 0 && sparkleRenders.length > 0) {
            const lastNonSparkleOrder = Math.max(...nonSparkleRenders.map(r => renderOrder.indexOf(r)));
            const firstSparkleOrder = Math.min(...sparkleRenders.map(r => renderOrder.indexOf(r)));
            
            // Sparkle particles should be rendered after non-sparkle particles
            expect(firstSparkleOrder).toBeGreaterThan(lastNonSparkleOrder);
        }
    });

    it('should render all non-sparkle particles first, then all sparkle particles', () => {
        // Create a mix of particles
        particleSystem.createTrailParticle(50, 50, 0, 0);
        particleSystem.createSparkleParticles(100, 100, 1);
        particleSystem.createExplosionParticles(150, 150, 1);
        particleSystem.createSparkleParticles(200, 200, 1);
        particleSystem.createTrailParticle(250, 250, 0, 0);
        
        // Track render calls by particle type
        let renderSequence = [];
        
        particleSystem.particles.forEach(particle => {
            particle.render = vi.fn((ctx) => {
                renderSequence.push(particle.type);
            });
        });
        
        // Render the particle system
        const mockCamera = { x: 0, y: 0 };
        particleSystem.render(mockContext, mockCamera);
        
        // Verify the rendering sequence
        const sparkleStartIndex = renderSequence.indexOf('sparkle');
        
        if (sparkleStartIndex !== -1) {
            // All particles before the first sparkle should be non-sparkle
            for (let i = 0; i < sparkleStartIndex; i++) {
                expect(renderSequence[i]).not.toBe('sparkle');
            }
            
            // All particles from the first sparkle onwards should be sparkle
            for (let i = sparkleStartIndex; i < renderSequence.length; i++) {
                if (renderSequence[i] === 'sparkle') {
                    // This is expected
                    expect(renderSequence[i]).toBe('sparkle');
                } else {
                    // If we find a non-sparkle after sparkles started, the order is wrong
                    // But our implementation should prevent this
                    expect(renderSequence[i]).toBe('sparkle');
                }
            }
        }
    });

    it('should maintain proper rendering order even with particle updates', () => {
        // Create particles and let some die
        particleSystem.createTrailParticle(100, 100, 1, 1);
        particleSystem.createSparkleParticles(200, 200, 2);
        particleSystem.createExplosionParticles(300, 300, 1);
        
        // Update particles (some might die)
        particleSystem.update(1000); // Large delta to potentially kill some particles
        
        // Add more particles after update
        particleSystem.createSparkleParticles(400, 400, 1);
        particleSystem.createTrailParticle(500, 500, 1, 1);
        
        // Track render order
        let renderTypes = [];
        particleSystem.particles.forEach(particle => {
            particle.render = vi.fn((ctx) => {
                renderTypes.push(particle.type);
            });
        });
        
        // Render
        const mockCamera = { x: 0, y: 0 };
        particleSystem.render(mockContext, mockCamera);
        
        // Verify sparkles are still rendered last
        const lastNonSparkleIndex = renderTypes.lastIndexOf(renderTypes.find(type => type !== 'sparkle'));
        const firstSparkleIndex = renderTypes.indexOf('sparkle');
        
        if (lastNonSparkleIndex !== -1 && firstSparkleIndex !== -1) {
            expect(firstSparkleIndex).toBeGreaterThan(lastNonSparkleIndex);
        }
    });

    it('should handle edge case of only sparkle particles', () => {
        // Create only sparkle particles
        particleSystem.createSparkleParticles(100, 100, 3);
        
        let renderCount = 0;
        particleSystem.particles.forEach(particle => {
            particle.render = vi.fn((ctx) => {
                renderCount++;
                expect(particle.type).toBe('sparkle');
            });
        });
        
        // Render
        const mockCamera = { x: 0, y: 0 };
        particleSystem.render(mockContext, mockCamera);
        
        // All particles should have been rendered
        expect(renderCount).toBe(particleSystem.particles.length);
        expect(renderCount).toBeGreaterThan(0);
    });

    it('should handle edge case of no sparkle particles', () => {
        // Create only non-sparkle particles
        particleSystem.createTrailParticle(100, 100, 1, 1);
        particleSystem.createExplosionParticles(200, 200, 2);
        
        let renderCount = 0;
        particleSystem.particles.forEach(particle => {
            particle.render = vi.fn((ctx) => {
                renderCount++;
                expect(particle.type).not.toBe('sparkle');
            });
        });
        
        // Render
        const mockCamera = { x: 0, y: 0 };
        particleSystem.render(mockContext, mockCamera);
        
        // All particles should have been rendered
        expect(renderCount).toBe(particleSystem.particles.length);
        expect(renderCount).toBeGreaterThan(0);
    });
});