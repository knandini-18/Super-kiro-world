# Project Structure

## Root Files
- `index.html` - Main HTML entry point with game canvas and UI elements
- `game.js` - Complete game implementation with Game class and all mechanics
- `kiro-logo.png` - Kiro brand logo asset for game sprites

## Directory Structure
```
/
├── .kiro/steering/          # AI assistant steering rules
│   ├── game-style-guide.md  # Visual design standards
│   ├── my-rules-my-game.md  # Game development guidelines
│   ├── user-context.md      # User preferences and requirements
│   ├── product.md           # Product overview
│   ├── tech.md              # Technical specifications
│   └── structure.md         # This file
├── .vscode/                 # VS Code configuration
├── index.html               # Game entry point
├── game.js                  # Main game logic
└── kiro-logo.png           # Game asset

```

## Code Organization

### HTML Structure (`index.html`)
- Game canvas container with fixed dimensions (800x600)
- UI elements for score, lives, and level display
- Embedded CSS for styling and responsive design
- Game over/restart modal styling

### JavaScript Architecture (`game.js`)
- Single `Game` class containing all game logic
- Key components within Game class:
  - Input handling system
  - Player mechanics (flying character)
  - Platform collision system
  - Collectibles and power-ups
  - Camera system with smooth following
  - Rendering pipeline
  - Game state management

### Asset Management
- Static image assets in root directory
- Kiro logo intended for player sprite integration
- All visual elements currently rendered as colored rectangles

## Naming Conventions
- camelCase for JavaScript variables and methods
- kebab-case for CSS classes and IDs
- Descriptive names for game entities (player, platforms, collectibles)
- Consistent color variable usage following Kiro brand guidelines