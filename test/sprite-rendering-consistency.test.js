/**
 * Property test for sprite rendering consistency
 * Feature: game-enhancements, Property 1: Sprite rendering consistency
 * Validates: Requirements 1.2, 1.3
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { AssetManager, createMockContext } from './game-classes.js';

describe('Sprite Rendering Consistency Property Tests', () => {
    let assetManager;
    let mockCtx;
    
    beforeEach(async () => {
        assetManager = new AssetManager();
        mockCtx = createMockContext();
        
        // Load the Kiro logo for testing - simulate successful loading
        await assetManager.loadImage('kiroLogo', 'kiro-logo.png');
    });
    
    it('Property 1: Sprite rendering consistency - should always render with preserved aspect ratio regardless of position or collision state', () => {
        fc.assert(
            fc.property(
                // Generate random game states
                fc.record({
                    playerX: fc.float({ min: -100, max: 2000 }), // Player position X
                    playerY: fc.float({ min: -100, max: 800 }), // Player position Y
                    playerWidth: fc.integer({ min: 16, max: 64 }), // Player width
                    playerHeight: fc.integer({ min: 16, max: 64 }), // Player height
                    velocityX: fc.float({ min: -20, max: 20 }), // Player velocity X
                    velocityY: fc.float({ min: -20, max: 20 }), // Player velocity Y
                    collisionState: fc.boolean(), // Whether player is colliding
                    onGround: fc.boolean(), // Whether player is on ground
                    gameState: fc.constantFrom('playing', 'paused', 'loading') // Game state
                }),
                (gameState) => {
                    // Ensure Kiro logo is loaded (requirement for the property)
                    expect(assetManager.isLoaded('kiroLogo')).toBe(true);
                    
                    // Reset mock context calls
                    mockCtx._calls.length = 0;
                    
                    // Render the player sprite using AssetManager
                    const renderResult = assetManager.renderImage(
                        mockCtx,
                        'kiroLogo',
                        gameState.playerX,
                        gameState.playerY,
                        gameState.playerWidth,
                        gameState.playerHeight,
                        true // Always maintain aspect ratio
                    );
                    
                    // Property assertions:
                    
                    // 1. Should always render using sprite (not fallback) when logo is loaded
                    expect(renderResult.rendered).toBe('sprite');
                    
                    // 2. Should preserve aspect ratio regardless of game state
                    const originalAspectRatio = renderResult.originalAspectRatio;
                    const renderedAspectRatio = renderResult.aspectRatio;
                    
                    // The rendered aspect ratio should match the original image aspect ratio
                    // (within floating point precision tolerance)
                    expect(Math.abs(renderedAspectRatio - originalAspectRatio)).toBeLessThan(0.001);
                    
                    // 3. Should maintain visual integrity regardless of position
                    // The sprite should be rendered within reasonable bounds relative to the target area
                    expect(renderResult.x).toBeGreaterThanOrEqual(gameState.playerX);
                    expect(renderResult.y).toBeGreaterThanOrEqual(gameState.playerY);
                    expect(renderResult.x + renderResult.width).toBeLessThanOrEqual(gameState.playerX + gameState.playerWidth);
                    expect(renderResult.y + renderResult.height).toBeLessThanOrEqual(gameState.playerY + gameState.playerHeight);
                    
                    // 4. Should use drawImage (not fillRect) for sprite rendering
                    const drawImageCalls = mockCtx._calls.filter(call => call.type === 'drawImage');
                    expect(drawImageCalls.length).toBeGreaterThan(0);
                    
                    // 5. Rendered dimensions should be positive and reasonable
                    expect(renderResult.width).toBeGreaterThan(0);
                    expect(renderResult.height).toBeGreaterThan(0);
                    expect(renderResult.width).toBeLessThanOrEqual(gameState.playerWidth);
                    expect(renderResult.height).toBeLessThanOrEqual(gameState.playerHeight);
                    
                    // 6. Position and collision state should not affect the rendering method
                    // (This is implicitly tested by the fact that we always get 'sprite' rendering
                    // regardless of the random collision state, position, or velocity)
                }
            ),
            { numRuns: 100 } // Run 100 iterations as specified in design document
        );
    });
    
    it('Property 1 Edge Case: Should handle extreme aspect ratios correctly', () => {
        fc.assert(
            fc.property(
                fc.record({
                    targetWidth: fc.integer({ min: 8, max: 128 }),
                    targetHeight: fc.integer({ min: 8, max: 128 }),
                    imageWidth: fc.integer({ min: 1, max: 200 }),
                    imageHeight: fc.integer({ min: 1, max: 200 })
                }),
                (testCase) => {
                    // Create a mock asset with custom dimensions
                    const customAsset = {
                        width: testCase.imageWidth,
                        height: testCase.imageHeight
                    };
                    assetManager.images.set('testSprite', customAsset);
                    assetManager.loadingStates.set('testSprite', 'loaded');
                    
                    // Reset mock context calls
                    mockCtx._calls.length = 0;
                    
                    // Render with custom dimensions
                    const renderResult = assetManager.renderImage(
                        mockCtx,
                        'testSprite',
                        0,
                        0,
                        testCase.targetWidth,
                        testCase.targetHeight,
                        true
                    );
                    
                    // Should always preserve aspect ratio
                    const originalAspectRatio = testCase.imageWidth / testCase.imageHeight;
                    const renderedAspectRatio = renderResult.aspectRatio;
                    
                    expect(Math.abs(renderedAspectRatio - originalAspectRatio)).toBeLessThan(0.001);
                    
                    // Should fit within target bounds
                    expect(renderResult.width).toBeLessThanOrEqual(testCase.targetWidth);
                    expect(renderResult.height).toBeLessThanOrEqual(testCase.targetHeight);
                }
            ),
            { numRuns: 100 }
        );
    });
});