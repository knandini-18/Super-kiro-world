// Score Persistence Round Trip Property Test
// **Feature: game-enhancements, Property 2: Score persistence round trip**

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { ScorePersistence } from './game-classes.js';
import './setup.js';

describe('Score Persistence Round Trip', () => {
    let scorePersistence;
    let mockLocalStorage;

    beforeEach(() => {
        // Create a fresh mock localStorage for each test
        mockLocalStorage = new Map();
        
        // Mock localStorage with Map-based implementation
        global.localStorage = {
            getItem: vi.fn((key) => mockLocalStorage.get(key) || null),
            setItem: vi.fn((key, value) => mockLocalStorage.set(key, value)),
            removeItem: vi.fn((key) => mockLocalStorage.delete(key)),
            clear: vi.fn(() => mockLocalStorage.clear())
        };

        scorePersistence = new ScorePersistence();
    });

    /**
     * **Feature: game-enhancements, Property 2: Score persistence round trip**
     * **Validates: Requirements 2.1, 2.3**
     * 
     * Property: For any valid score value, storing it to local storage and then retrieving it should return the same score value
     */
    it('Property 2: Score persistence round trip - storing and retrieving should return same score value', () => {
        fc.assert(fc.property(
            // Generate valid score values (non-negative integers)
            fc.integer({ min: 0, max: 999999 }),
            (score) => {
                // Clear any existing data to ensure clean test
                mockLocalStorage.clear();
                
                // Save the score
                const saveResult = scorePersistence.saveScore(score);
                
                // Verify save was successful
                expect(saveResult).toBe(true);
                
                // Retrieve the current score
                const retrievedScore = scorePersistence.getCurrentScore();
                
                // Round trip property: retrieved score should equal original score
                expect(retrievedScore).toBe(score);
                
                // Also verify the score is properly stored in the data structure
                const data = scorePersistence.getData();
                expect(data.currentScore).toBe(score);
                
                // Verify that the score was actually written to localStorage
                expect(global.localStorage.setItem).toHaveBeenCalled();
                
                // Verify the stored JSON contains the correct score
                const storedData = JSON.parse(mockLocalStorage.get('superKiroWorld'));
                expect(storedData.currentScore).toBe(score);
            }
        ), { numRuns: 100 }); // Run 100 iterations as specified in design document
    });

    /**
     * Additional round trip test for high scores
     */
    it('Property 2 Extension: High score persistence round trip should work correctly', () => {
        fc.assert(fc.property(
            // Generate two scores where second is higher (to test high score logic)
            fc.integer({ min: 0, max: 50000 }),
            fc.integer({ min: 50001, max: 999999 }),
            (initialScore, newHighScore) => {
                // Clear any existing data
                mockLocalStorage.clear();
                
                // Set initial score
                scorePersistence.saveScore(initialScore);
                const initialRetrieved = scorePersistence.getCurrentScore();
                expect(initialRetrieved).toBe(initialScore);
                
                // Save new high score
                const highScoreResult = scorePersistence.saveHighScore(newHighScore);
                expect(highScoreResult).toBe(true); // Should return true for new high score
                
                // Retrieve high score
                const retrievedHighScore = scorePersistence.getHighScore();
                
                // Round trip property: retrieved high score should equal original high score
                expect(retrievedHighScore).toBe(newHighScore);
                
                // Current score should also be updated to the high score
                const currentScore = scorePersistence.getCurrentScore();
                expect(currentScore).toBe(newHighScore);
            }
        ), { numRuns: 100 });
    });

    /**
     * Test round trip with localStorage unavailable (session-only mode)
     */
    it('Property 2 Fallback: Should handle localStorage unavailability gracefully', () => {
        fc.assert(fc.property(
            fc.integer({ min: 0, max: 999999 }),
            (score) => {
                // Mock localStorage to throw error (simulating unavailability)
                global.localStorage.setItem = vi.fn(() => {
                    throw new Error('localStorage not available');
                });
                
                // Save should return false but not crash
                const saveResult = scorePersistence.saveScore(score);
                expect(saveResult).toBe(false);
                
                // Should still be able to get default values without crashing
                const retrievedScore = scorePersistence.getCurrentScore();
                expect(retrievedScore).toBe(0); // Default value
                
                const highScore = scorePersistence.getHighScore();
                expect(highScore).toBe(0); // Default value
            }
        ), { numRuns: 50 });
    });

    /**
     * Test round trip with corrupted data recovery
     */
    it('Property 2 Corruption Recovery: Should handle corrupted data and reset to defaults', () => {
        fc.assert(fc.property(
            fc.integer({ min: 0, max: 999999 }),
            (score) => {
                // Set up corrupted data in localStorage
                mockLocalStorage.set('superKiroWorld', 'invalid json data');
                
                // Should handle corruption gracefully and return defaults
                const retrievedScore = scorePersistence.getCurrentScore();
                expect(retrievedScore).toBe(0); // Default value
                
                // Should be able to save new score after corruption recovery
                const saveResult = scorePersistence.saveScore(score);
                expect(saveResult).toBe(true);
                
                // Should now retrieve the newly saved score correctly
                const newRetrievedScore = scorePersistence.getCurrentScore();
                expect(newRetrievedScore).toBe(score);
            }
        ), { numRuns: 50 });
    });
});