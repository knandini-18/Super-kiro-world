// Property-Based Test for High Score Monotonicity
// **Feature: game-enhancements, Property 3: High score monotonicity**
// **Validates: Requirements 2.2**

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { ScorePersistence } from './game-classes.js';

describe('High Score Monotonicity Property Tests', () => {
    let scorePersistence;
    
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        scorePersistence = new ScorePersistence();
    });
    
    it('Property 3: High score monotonicity - for any sequence of scores, the stored high score should never decrease and should always reflect the maximum score achieved', () => {
        fc.assert(
            fc.property(
                // Generate an array of non-negative integers representing scores
                fc.array(fc.integer({ min: 0, max: 1000000 }), { minLength: 1, maxLength: 20 }),
                (scores) => {
                    // Clear any existing data
                    localStorage.clear();
                    const persistence = new ScorePersistence();
                    
                    let expectedHighScore = 0;
                    let previousHighScore = 0;
                    
                    // Process each score in the sequence
                    for (const score of scores) {
                        // Update expected high score to be the maximum seen so far
                        expectedHighScore = Math.max(expectedHighScore, score);
                        
                        // Save the score (this should update high score if it's higher)
                        persistence.saveHighScore(score);
                        
                        // Get the current high score from storage
                        const currentHighScore = persistence.getHighScore();
                        
                        // Property 1: High score should never decrease
                        expect(currentHighScore).toBeGreaterThanOrEqual(previousHighScore);
                        
                        // Property 2: High score should always reflect the maximum score achieved
                        expect(currentHighScore).toBe(expectedHighScore);
                        
                        // Update previous high score for next iteration
                        previousHighScore = currentHighScore;
                    }
                    
                    // Final verification: high score should equal the maximum of all scores
                    const finalHighScore = persistence.getHighScore();
                    const maxScore = Math.max(...scores);
                    expect(finalHighScore).toBe(maxScore);
                }
            ),
            { numRuns: 100 } // Run 100 iterations as specified in design document
        );
    });
    
    it('Property 3 Edge Case: High score monotonicity with duplicate scores', () => {
        fc.assert(
            fc.property(
                // Generate a score and then an array of the same score
                fc.integer({ min: 0, max: 1000000 }),
                fc.integer({ min: 2, max: 10 }),
                (score, repeatCount) => {
                    // Clear any existing data
                    localStorage.clear();
                    const persistence = new ScorePersistence();
                    
                    // Submit the same score multiple times
                    for (let i = 0; i < repeatCount; i++) {
                        persistence.saveHighScore(score);
                        
                        // High score should remain constant
                        expect(persistence.getHighScore()).toBe(score);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('Property 3 Edge Case: High score monotonicity with decreasing sequence', () => {
        fc.assert(
            fc.property(
                // Generate a decreasing sequence of scores
                fc.array(fc.integer({ min: 0, max: 1000 }), { minLength: 2, maxLength: 10 })
                  .map(arr => arr.sort((a, b) => b - a)), // Sort in decreasing order
                (decreasingScores) => {
                    // Clear any existing data
                    localStorage.clear();
                    const persistence = new ScorePersistence();
                    
                    // The high score should be the first (highest) score in the sequence
                    const expectedHighScore = decreasingScores[0];
                    
                    for (const score of decreasingScores) {
                        persistence.saveHighScore(score);
                        
                        // High score should always be the maximum (first score in decreasing sequence)
                        expect(persistence.getHighScore()).toBe(expectedHighScore);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('Property 3 Edge Case: High score monotonicity starting from zero', () => {
        fc.assert(
            fc.property(
                fc.array(fc.integer({ min: 0, max: 1000000 }), { minLength: 1, maxLength: 15 }),
                (scores) => {
                    // Clear any existing data
                    localStorage.clear();
                    const persistence = new ScorePersistence();
                    
                    // Initial high score should be 0
                    expect(persistence.getHighScore()).toBe(0);
                    
                    let runningMax = 0;
                    
                    for (const score of scores) {
                        runningMax = Math.max(runningMax, score);
                        persistence.saveHighScore(score);
                        
                        // High score should equal the running maximum
                        expect(persistence.getHighScore()).toBe(runningMax);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});