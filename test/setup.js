// Test setup for Super Kiro World
import { beforeEach } from 'vitest';

// Mock canvas and context for testing
beforeEach(() => {
  // Mock HTMLCanvasElement
  global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
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
  }));

  // Mock Image constructor
  global.Image = class {
    constructor() {
      this.onload = null;
      this.onerror = null;
      this.src = '';
      this.width = 32;
      this.height = 32;
    }
    
    set src(value) {
      this._src = value;
      // Simulate successful loading for tests
      setTimeout(() => {
        if (this.onload) this.onload();
      }, 0);
    }
    
    get src() {
      return this._src;
    }
  };

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  };
  global.localStorage = localStorageMock;

  // Mock requestAnimationFrame
  global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 16));
  
  // Mock DOM elements
  global.document.getElementById = vi.fn((id) => {
    return {
      textContent: '',
      width: 800,
      height: 600,
      getContext: global.HTMLCanvasElement.prototype.getContext
    };
  });
});