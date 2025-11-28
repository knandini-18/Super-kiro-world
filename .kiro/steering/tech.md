# Technical Stack

## Core Technologies
- **HTML5 Canvas**: Primary rendering engine for 2D graphics
- **Vanilla JavaScript**: Game logic and mechanics (ES6+ class-based architecture)
- **CSS3**: UI styling and responsive design

## Architecture Patterns
- Object-oriented game design with single Game class
- Component-based entity system (player, platforms, collectibles)
- Game loop pattern using requestAnimationFrame for 60 FPS target
- Event-driven input handling with keyboard state tracking

## Key Libraries & APIs
- Canvas 2D Rendering Context API
- DOM Event API for input handling
- requestAnimationFrame for smooth animations

## Performance Considerations
- 60 FPS target performance
- Efficient collision detection algorithms
- Smooth camera interpolation (lerp-based following)
- Minimal DOM manipulation during gameplay

## Common Commands
Since this is a client-side web application, no build system is required:

### Development
- Open `index.html` directly in browser for testing
- Use browser developer tools for debugging
- No compilation or build step needed

### Testing
- Manual testing through browser gameplay
- Browser console for error checking and debugging
- Performance monitoring via browser DevTools

## Browser Compatibility
- Modern browsers supporting HTML5 Canvas
- ES6+ JavaScript features (classes, arrow functions, const/let)
- No external dependencies or frameworks required