// Unit tests for asset loading scenarios
// **Feature: game-enhancements, Unit Tests: Asset loading scenarios**
// Test successful image loading, fallback rendering on load failure, and proper sprite scaling
// _Requirements: 1.1, 1.4, 1.5_

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AssetManager, createMockContext } from './game-classes.js';

describe('Asset Loading Scenarios Unit Tests', () => {
    let assetManager;
    let mockCtx;
    
    beforeEach(() => {
        assetManager = new AssetManager();
        mockCtx = createMockContext();
    });

    describe('Successful Image Loading', () => {
        it('should load image successfully and set correct states', async () => {
            // Mock successful image loading
            global.Image = class MockImage {
                constructor() {
                    this.onload = null;
                    this.onerror = null;
                    this.width = 64;
                    this.height = 64;
                }
                
                set src(value) {
                    this._src = value;
                    // Simulate successful loading
                    setTimeout(() => {
                        if (this.onload) this.onload();
                    }, 0);
                }
                
                get src() {
                    return this._src;
                }
            };

            const result = await assetManager.loadImage('testImage', 'test.png');
            
            // Verify successful loading
            expect(result).toBeDefined();
            expect(result.width).toBe(64);
            expect(result.height).toBe(64);
            expect(assetManager.isLoaded('testImage')).toBe(true);
            expect(assetManager.hasError('testImage')).toBe(false);
            expect(assetManager.getImage('testImage')).toBe(result);
        });

        it('should not reload already loaded images', async () => {
            // Mock successful image loading
            global.Image = class MockImage {
                constructor() {
                    this.onload = null;
                    this.onerror = null;
                    this.width = 32;
                    this.height = 32;
                }
                
                set src(value) {
                    this._src = value;
                    setTimeout(() => {
                        if (this.onload) this.onload();
                    }, 0);
                }
                
                get src() {
                    return this._src;
                }
            };

            // Load image first time
            const firstResult = await assetManager.loadImage('cachedImage', 'cached.png');
            
            // Load same image again
            const secondResult = await assetManager.loadImage('cachedImage', 'cached.png');
            
            // Should return the same cached image
            expect(firstResult).toBe(secondResult);
            expect(assetManager.isLoaded('cachedImage')).toBe(true);
        });

        it('should handle multiple concurrent image loads', async () => {
            // Mock successful image loading
            global.Image = class MockImage {
                constructor() {
                    this.onload = null;
                    this.onerror = null;
                    this.width = 48;
                    this.height = 48;
                }
                
                set src(value) {
                    this._src = value;
                    setTimeout(() => {
                        if (this.onload) this.onload();
                    }, Math.random() * 10); // Random delay to simulate real loading
                }
                
                get src() {
                    return this._src;
                }
            };

            // Load multiple images concurrently
            const promises = [
                assetManager.loadImage('image1', 'test1.png'),
                assetManager.loadImage('image2', 'test2.png'),
                assetManager.loadImage('image3', 'test3.png')
            ];

            const results = await Promise.all(promises);
            
            // Verify all images loaded successfully
            expect(results).toHaveLength(3);
            expect(assetManager.isLoaded('image1')).toBe(true);
            expect(assetManager.isLoaded('image2')).toBe(true);
            expect(assetManager.isLoaded('image3')).toBe(true);
        });
    });

    describe('Fallback Rendering on Load Failure', () => {
        it('should use fallback renderer when image loading fails', async () => {
            // Mock failing image loading
            global.Image = class FailingImage {
                constructor() {
                    this.onload = null;
                    this.onerror = null;
                }
                
                set src(value) {
                    this._src = value;
                    // Simulate loading failure
                    setTimeout(() => {
                        if (this.onerror) this.onerror();
                    }, 0);
                }
                
                get src() {
                    return this._src;
                }
            };

            const fallbackRenderer = vi.fn((ctx, x, y, width, height) => {
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(x, y, width, height);
            });

            const result = await assetManager.loadImage('failingImage', 'nonexistent.png', fallbackRenderer);
            
            // Verify fallback is used
            expect(result).toBeDefined();
            expect(result.fallback).toBe(true);
            expect(result.renderer).toBe(fallbackRenderer);
            expect(assetManager.isLoaded('failingImage')).toBe(true);
            expect(assetManager.hasError('failingImage')).toBe(true);
        });

        it('should reject promise when no fallback is provided and loading fails', async () => {
            // Mock failing image loading
            global.Image = class FailingImage {
                constructor() {
                    this.onload = null;
                    this.onerror = null;
                }
                
                set src(value) {
                    this._src = value;
                    setTimeout(() => {
                        if (this.onerror) this.onerror();
                    }, 0);
                }
                
                get src() {
                    return this._src;
                }
            };

            // Should reject when no fallback provided
            await expect(assetManager.loadImage('failingImage', 'nonexistent.png'))
                .rejects.toThrow('Failed to load image: failingImage');
            
            expect(assetManager.isLoaded('failingImage')).toBe(false);
            expect(assetManager.hasError('failingImage')).toBe(true);
        });

        it('should render fallback correctly when asset has fallback renderer', () => {
            const fallbackRenderer = vi.fn((ctx, x, y, width, height) => {
                ctx.fillStyle = '#FF8C00';
                ctx.fillRect(x, y, width, height);
                ctx.strokeStyle = '#FFA500';
                ctx.strokeRect(x, y, width, height);
            });

            // Manually set up fallback asset
            assetManager.images.set('fallbackAsset', { fallback: true, renderer: fallbackRenderer });

            const result = assetManager.renderImage(mockCtx, 'fallbackAsset', 10, 20, 32, 32);
            
            // Verify fallback renderer was called
            expect(fallbackRenderer).toHaveBeenCalledWith(mockCtx, 10, 20, 32, 32);
            expect(result.rendered).toBe('fallback');
        });

        it('should render basic fallback when no asset is available', () => {
            const result = assetManager.renderImage(mockCtx, 'nonexistentAsset', 5, 10, 40, 40);
            
            // Verify basic fallback rendering
            expect(result.rendered).toBe('fallback');
            const fillRectCalls = mockCtx._calls.filter(call => call.type === 'fillRect');
            const strokeRectCalls = mockCtx._calls.filter(call => call.type === 'strokeRect');
            
            expect(fillRectCalls).toHaveLength(1);
            expect(strokeRectCalls).toHaveLength(1);
            expect(fillRectCalls[0]).toEqual({ type: 'fillRect', x: 5, y: 10, w: 40, h: 40 });
        });
    });

    describe('Proper Sprite Scaling', () => {
        beforeEach(() => {
            // Mock successful image with specific dimensions
            const mockImage = {
                width: 100,
                height: 50 // 2:1 aspect ratio
            };
            assetManager.images.set('testSprite', mockImage);
            assetManager.loadingStates.set('testSprite', 'loaded');
        });

        it('should maintain aspect ratio when scaling sprite', () => {
            const result = assetManager.renderImage(mockCtx, 'testSprite', 0, 0, 60, 60, true);
            
            // With 2:1 aspect ratio image and 60x60 target, should fit to width
            // Expected: 60x30 (maintaining 2:1 ratio)
            expect(result.rendered).toBe('sprite');
            expect(result.width).toBe(60);
            expect(result.height).toBe(30);
            expect(result.aspectRatio).toBeCloseTo(2.0, 1);
            expect(result.originalAspectRatio).toBe(2.0);
            
            // Should be centered vertically
            expect(result.y).toBe(15); // (60 - 30) / 2
        });

        it('should stretch sprite when aspect ratio maintenance is disabled', () => {
            const result = assetManager.renderImage(mockCtx, 'testSprite', 0, 0, 60, 60, false);
            
            // Should stretch to exact dimensions
            expect(result.rendered).toBe('sprite');
            expect(result.width).toBe(60);
            expect(result.height).toBe(60);
            expect(result.aspectRatio).toBe(1.0);
            expect(result.originalAspectRatio).toBe(2.0);
        });

        it('should calculate optimal dimensions correctly for different aspect ratios', () => {
            // Test with wider image (landscape)
            const landscapeImage = { width: 200, height: 100 }; // 2:1 ratio
            assetManager.images.set('landscape', landscapeImage);
            assetManager.loadingStates.set('landscape', 'loaded');
            
            let dimensions = assetManager.getOptimalDimensions('landscape', 80, 80);
            expect(dimensions.width).toBe(80);
            expect(dimensions.height).toBe(40);
            
            // Test with taller image (portrait)
            const portraitImage = { width: 50, height: 100 }; // 1:2 ratio
            assetManager.images.set('portrait', portraitImage);
            assetManager.loadingStates.set('portrait', 'loaded');
            
            dimensions = assetManager.getOptimalDimensions('portrait', 80, 80);
            expect(dimensions.width).toBe(40);
            expect(dimensions.height).toBe(80);
        });

        it('should return target dimensions for fallback assets', () => {
            assetManager.images.set('fallbackAsset', { fallback: true, renderer: vi.fn() });
            
            const dimensions = assetManager.getOptimalDimensions('fallbackAsset', 64, 48);
            expect(dimensions.width).toBe(64);
            expect(dimensions.height).toBe(48);
        });

        it('should handle edge case of square images', () => {
            const squareImage = { width: 100, height: 100 }; // 1:1 ratio
            assetManager.images.set('square', squareImage);
            assetManager.loadingStates.set('square', 'loaded');
            
            const result = assetManager.renderImage(mockCtx, 'square', 0, 0, 50, 50, true);
            
            // Square image in square target should maintain exact dimensions
            expect(result.width).toBe(50);
            expect(result.height).toBe(50);
            expect(result.aspectRatio).toBe(1.0);
        });

        it('should handle very wide images correctly', () => {
            const wideImage = { width: 400, height: 100 }; // 4:1 ratio
            assetManager.images.set('wide', wideImage);
            assetManager.loadingStates.set('wide', 'loaded');
            
            const result = assetManager.renderImage(mockCtx, 'wide', 0, 0, 80, 80, true);
            
            // Should fit to width, resulting in very short height
            expect(result.width).toBe(80);
            expect(result.height).toBe(20);
            expect(result.y).toBe(30); // Centered vertically: (80 - 20) / 2
        });

        it('should handle very tall images correctly', () => {
            const tallImage = { width: 100, height: 400 }; // 1:4 ratio
            assetManager.images.set('tall', tallImage);
            assetManager.loadingStates.set('tall', 'loaded');
            
            const result = assetManager.renderImage(mockCtx, 'tall', 0, 0, 80, 80, true);
            
            // Should fit to height, resulting in very narrow width
            expect(result.width).toBe(20);
            expect(result.height).toBe(80);
            expect(result.x).toBe(30); // Centered horizontally: (80 - 20) / 2
        });
    });

    describe('Asset Manager State Management', () => {
        it('should track loading states correctly', () => {
            // Initially no state
            expect(assetManager.isLoaded('newAsset')).toBe(false);
            expect(assetManager.isLoading('newAsset')).toBe(false);
            expect(assetManager.hasError('newAsset')).toBe(false);
            
            // Set loading state manually for testing
            assetManager.loadingStates.set('newAsset', 'loading');
            expect(assetManager.isLoading('newAsset')).toBe(true);
            expect(assetManager.isLoaded('newAsset')).toBe(false);
            
            // Set loaded state
            assetManager.loadingStates.set('newAsset', 'loaded');
            assetManager.images.set('newAsset', { width: 32, height: 32 });
            expect(assetManager.isLoaded('newAsset')).toBe(true);
            expect(assetManager.isLoading('newAsset')).toBe(false);
            
            // Set error state
            assetManager.loadingStates.set('errorAsset', 'error');
            expect(assetManager.hasError('errorAsset')).toBe(true);
            expect(assetManager.isLoaded('errorAsset')).toBe(false);
        });

        it('should handle undefined asset keys gracefully', () => {
            expect(assetManager.isLoaded(undefined)).toBe(false);
            expect(assetManager.getImage(undefined)).toBeUndefined();
            expect(assetManager.hasError(undefined)).toBe(false);
            expect(assetManager.isLoading(undefined)).toBe(false);
        });

        it('should return correct image references', () => {
            const testImage = { width: 64, height: 64 };
            assetManager.images.set('testRef', testImage);
            
            expect(assetManager.getImage('testRef')).toBe(testImage);
            expect(assetManager.getImage('nonexistent')).toBeUndefined();
        });
    });
});