// Storage Error Handling Unit Tests
// Tests localStorage unavailability graceful degradation and corrupted data recovery

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScorePersistence } from './game-classes.js';
import './setup.js';

describe('Storage Error Handling', () => {
    let scorePersistence;
    let mockLocalStorage;
    let consoleWarnSpy;
    let consoleLogSpy;

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
        
        // Spy on console methods to verify error handling
        consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    describe('localStorage Unavailability Graceful Degradation', () => {
        /**
         * Test localStorage unavailability graceful degradation
         * _Requirements: 2.4, 2.5_
         */
        it('should detect localStorage unavailability and continue functioning', () => {
            // Mock localStorage.setItem to throw error (simulating unavailability)
            global.localStorage.setItem = vi.fn(() => {
                throw new Error('localStorage is not available');
            });
            
            // Should detect localStorage is not available
            const isAvailable = scorePersistence.isLocalStorageAvailable();
            expect(isAvailable).toBe(false);
            
            // Should log warning about unavailability
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'localStorage is not available:', 
                'localStorage is not available'
            );
        });

        it('should continue functioning with session-only scoring when localStorage unavailable', () => {
            // Mock localStorage to throw errors
            global.localStorage.setItem = vi.fn(() => {
                throw new Error('localStorage disabled');
            });
            global.localStorage.getItem = vi.fn(() => {
                throw new Error('localStorage disabled');
            });
            
            // Save score should return false but not crash
            const saveResult = scorePersistence.saveScore(1500);
            expect(saveResult).toBe(false);
            
            // Should log session-only mode message
            expect(consoleLogSpy).toHaveBeenCalledWith(
                'localStorage unavailable, running in session-only mode'
            );
            
            // Should still return default values without crashing
            const currentScore = scorePersistence.getCurrentScore();
            expect(currentScore).toBe(0);
            
            const highScore = scorePersistence.getHighScore();
            expect(highScore).toBe(0);
            
            const gamesPlayed = scorePersistence.getGamesPlayed();
            expect(gamesPlayed).toBe(0);
        });

        it('should handle localStorage quota exceeded errors gracefully', () => {
            // Mock localStorage.setItem to throw quota exceeded error
            global.localStorage.setItem = vi.fn(() => {
                const error = new Error('QuotaExceededError');
                error.name = 'QuotaExceededError';
                throw error;
            });
            
            // Save should return false and log error
            const saveResult = scorePersistence.saveScore(2500);
            expect(saveResult).toBe(false);
            
            // Should log error message
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Error saving score data:', 
                'QuotaExceededError'
            );
        });

        it('should handle localStorage access denied errors gracefully', () => {
            // Mock localStorage to throw access denied error
            global.localStorage.getItem = vi.fn(() => {
                throw new Error('Access denied');
            });
            
            // Should return defaults and not crash
            const data = scorePersistence.getData();
            expect(data).toEqual({
                currentScore: 0,
                highScore: 0,
                lastPlayed: null,
                gamesPlayed: 0
            });
            
            // Should log error message
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Error reading score data:', 
                'Access denied'
            );
        });

        it('should maintain game functionality when localStorage operations fail', () => {
            // Mock all localStorage operations to fail
            global.localStorage.setItem = vi.fn(() => {
                throw new Error('Storage failure');
            });
            global.localStorage.getItem = vi.fn(() => {
                throw new Error('Storage failure');
            });
            global.localStorage.removeItem = vi.fn(() => {
                throw new Error('Storage failure');
            });
            
            // All operations should complete without throwing
            expect(() => {
                scorePersistence.saveScore(1000);
                scorePersistence.saveHighScore(2000);
                scorePersistence.getCurrentScore();
                scorePersistence.getHighScore();
                scorePersistence.getGamesPlayed();
                scorePersistence.isNewHighScore(1500);
            }).not.toThrow();
            
            // Should return consistent default values
            expect(scorePersistence.getCurrentScore()).toBe(0);
            expect(scorePersistence.getHighScore()).toBe(0);
            expect(scorePersistence.getGamesPlayed()).toBe(0);
        });
    });

    describe('Corrupted Data Recovery', () => {
        /**
         * Test corrupted data recovery
         * _Requirements: 2.4, 2.5_
         */
        it('should detect and handle invalid JSON data', () => {
            // Set invalid JSON in localStorage
            mockLocalStorage.set('superKiroWorld', 'invalid json data {');
            
            // Should handle corruption gracefully
            const data = scorePersistence.getData();
            expect(data).toEqual({
                currentScore: 0,
                highScore: 0,
                lastPlayed: null,
                gamesPlayed: 0
            });
            
            // Should log corruption warning
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Error reading score data:', 
                expect.any(String)
            );
            
            // Should clear corrupted data
            expect(global.localStorage.removeItem).toHaveBeenCalledWith('superKiroWorld');
        });

        it('should detect and handle data with wrong structure', () => {
            // Set data with wrong structure
            mockLocalStorage.set('superKiroWorld', JSON.stringify({
                wrongField: 'value',
                highScore: 'not a number',
                gamesPlayed: null
            }));
            
            // Should detect corruption and reset to defaults
            const data = scorePersistence.getData();
            expect(data).toEqual({
                currentScore: 0,
                highScore: 0,
                lastPlayed: null,
                gamesPlayed: 0
            });
            
            // Should log corruption detection
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Corrupted score data detected, resetting to defaults'
            );
        });

        it('should handle data with missing required fields', () => {
            // Set data missing required fields
            mockLocalStorage.set('superKiroWorld', JSON.stringify({
                currentScore: 100
                // Missing highScore and gamesPlayed
            }));
            
            // Should detect corruption and reset
            const data = scorePersistence.getData();
            expect(data).toEqual({
                currentScore: 0,
                highScore: 0,
                lastPlayed: null,
                gamesPlayed: 0
            });
            
            // Should call handleCorruptedData
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Corrupted score data detected, resetting to defaults'
            );
        });

        it('should handle data with invalid field types', () => {
            // Set data with invalid types
            mockLocalStorage.set('superKiroWorld', JSON.stringify({
                currentScore: 'string instead of number',
                highScore: [],
                gamesPlayed: {},
                lastPlayed: 'invalid date'
            }));
            
            // Should detect type corruption and reset
            const data = scorePersistence.getData();
            expect(data).toEqual({
                currentScore: 0,
                highScore: 0,
                lastPlayed: null,
                gamesPlayed: 0
            });
        });

        it('should recover and allow normal operation after corruption', () => {
            // Start with corrupted data
            mockLocalStorage.set('superKiroWorld', 'corrupted data');
            
            // First access should detect corruption and reset
            const initialData = scorePersistence.getData();
            expect(initialData.currentScore).toBe(0);
            
            // Should now be able to save new data normally
            const saveResult = scorePersistence.saveScore(1500);
            expect(saveResult).toBe(true);
            
            // Should retrieve the new data correctly
            const newData = scorePersistence.getCurrentScore();
            expect(newData).toBe(1500);
            
            // Verify data is properly structured in storage
            const storedData = JSON.parse(mockLocalStorage.get('superKiroWorld'));
            expect(storedData.currentScore).toBe(1500);
            expect(typeof storedData.highScore).toBe('number');
            expect(typeof storedData.gamesPlayed).toBe('number');
        });

        it('should handle corruption during handleCorruptedData operation', () => {
            // Mock removeItem to fail during corruption handling
            global.localStorage.removeItem = vi.fn(() => {
                throw new Error('Cannot remove corrupted data');
            });
            
            // Set corrupted data
            mockLocalStorage.set('superKiroWorld', 'corrupted');
            
            // Should handle the error during cleanup gracefully
            expect(() => {
                scorePersistence.getData();
            }).not.toThrow();
            
            // Should log the cleanup error
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Error clearing corrupted data:', 
                'Cannot remove corrupted data'
            );
        });

        it('should handle null and undefined data gracefully', () => {
            // Test with null data
            mockLocalStorage.set('superKiroWorld', 'null');
            let data = scorePersistence.getData();
            expect(data).toEqual({
                currentScore: 0,
                highScore: 0,
                lastPlayed: null,
                gamesPlayed: 0
            });
            
            // Test with undefined data (empty storage)
            mockLocalStorage.delete('superKiroWorld');
            data = scorePersistence.getData();
            expect(data).toEqual({
                currentScore: 0,
                highScore: 0,
                lastPlayed: null,
                gamesPlayed: 0
            });
        });
    });

    describe('Error Recovery Integration', () => {
        it('should maintain consistent behavior across error scenarios', () => {
            const testScenarios = [
                // localStorage unavailable
                () => {
                    global.localStorage.setItem = vi.fn(() => {
                        throw new Error('localStorage unavailable');
                    });
                },
                // Corrupted data
                () => {
                    mockLocalStorage.set('superKiroWorld', 'invalid data');
                },
                // Quota exceeded
                () => {
                    global.localStorage.setItem = vi.fn(() => {
                        const error = new Error('QuotaExceededError');
                        error.name = 'QuotaExceededError';
                        throw error;
                    });
                }
            ];
            
            testScenarios.forEach((setupError, index) => {
                // Reset for each scenario
                beforeEach();
                setupError();
                
                // All methods should return consistent defaults
                expect(scorePersistence.getCurrentScore()).toBe(0);
                expect(scorePersistence.getHighScore()).toBe(0);
                expect(scorePersistence.getGamesPlayed()).toBe(0);
                expect(scorePersistence.isNewHighScore(100)).toBe(true);
                
                // Operations should not throw errors
                expect(() => {
                    scorePersistence.saveScore(500);
                    scorePersistence.saveHighScore(1000);
                }).not.toThrow();
            });
        });
    });
});