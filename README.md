# Super Kiro World 🎮

A retro-style 2D platformer game built with HTML5 Canvas and vanilla JavaScript, featuring the Kiro mascot as a flying character navigating through challenging levels.

## 🎯 Game Features

- **Flying Character Mechanics**: Control Kiro with smooth flying physics
- **Platform-Based Levels**: Navigate through carefully designed platform layouts
- **Collectible System**: Gather gems and power-ups for points and abilities
- **Particle Effects**: Dynamic trail particles and visual feedback
- **Score Persistence**: High scores saved locally in your browser
- **Responsive Controls**: WASD or Arrow Keys for movement
- **Retro Aesthetic**: Pixel-perfect styling with Kiro brand colors

## 🚀 How to Play

### Controls
- **Movement**: Arrow Keys or WASD
- **Fly Up**: ↑ / W / Spacebar
- **Fly Down**: ↓ / S
- **Horizontal**: ← → / A D
- **Restart**: R (when game over)

### Objective
- Collect gems (yellow squares) for points
- Grab power-ups for special abilities:
  - 🔵 **Speed Boost** (Cyan): Increases movement speed
  - 💖 **Extra Life** (Pink): Adds one life
  - ⭐ **Score Multiplier** (Yellow): Bonus points
- Reach the green flag to complete the level
- Avoid falling off the bottom of the screen

## 🛠️ Technical Stack

- **HTML5 Canvas**: 2D rendering engine
- **Vanilla JavaScript**: Game logic with ES6+ classes
- **CSS3**: UI styling and responsive design
- **LocalStorage**: Score persistence

## 🎨 Visual Design

The game follows Kiro's brand guidelines:
- **Primary Colors**: Orange (#FF8C00) for accents and highlights
- **Background**: Dark theme with high contrast
- **Typography**: Courier New for retro gaming feel
- **Accessibility**: WCAG AA compliant contrast ratios

## 🏗️ Architecture

### Core Classes
- **Game**: Main game loop and state management
- **ParticleSystem**: Dynamic visual effects and trails
- **AssetManager**: Image loading with fallback rendering
- **ScorePersistence**: LocalStorage integration for high scores

### Performance Features
- 60 FPS target with requestAnimationFrame
- Efficient collision detection
- Particle system with lifecycle management
- Smooth camera interpolation

## 🚀 Getting Started

1. **Clone or download** this repository
2. **Open `index.html`** in any modern web browser
3. **Start playing!** No build process or dependencies required

```bash
# If using a local server (optional)
python -m http.server 8000
# Then visit http://localhost:8000
```

## 📁 Project Structure

```
super-kiro-world/
├── index.html          # Game entry point
├── game.js            # Complete game implementation
├── kiro-logo.png      # Kiro mascot sprite
└── README.md          # This file
```

## 🎮 Game Mechanics

### Physics System
- **Gravity**: 0.2 (lighter for flying character)
- **Flying Power**: 8 (upward thrust)
- **Max Speed**: 6 (terminal velocity)
- **Friction**: 0.8 (realistic movement feel)

### Scoring System
- **Gems**: 100 points each
- **Speed Power-up**: 200 points
- **Life Power-up**: 500 points
- **Score Power-up**: 1000 points
- **Level Completion**: 1000 bonus points

## 🔧 Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

Requires HTML5 Canvas and ES6 support.

## 🎯 Future Enhancements

- Multiple levels with increasing difficulty
- Sound effects and background music
- Mobile touch controls
- Leaderboard system
- Additional power-ups and enemies
- Level editor

## 🤝 Contributing

This game was built as part of an AWS re:Invent workshop. Feel free to fork and enhance!

## 📄 License

MIT License - Feel free to use this code for learning and experimentation.

---

**Built with ❤️ using Kiro AI Assistant**