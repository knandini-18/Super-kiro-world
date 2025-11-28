---
inclusion: always
---

# Game Visual Style Guide

Apply these visual standards when generating game code, UI elements, or styling.

## Color Palette

Use Kiro brand colors for all visual elements:

### Primary Colors
- **Orange-500** (`#FF8C00`): Primary actions, CTAs, key highlights, main brand moments
- **Orange-400** (`#FFA500`): Hover states, secondary accents (lighter orange)
- **Orange-300** (`#FFB84D`): Text links, subtle highlights (lightest orange)

### Backgrounds
- **Black-900**: Primary background (darkest)
- **Prey-900**: Secondary backgrounds (dark gray)
- **Prey-750**: Cards, containers (medium-dark gray)
- **Prey-700**: Hover states on dark elements (lighter gray)

### Text
- **White**: Primary text on dark backgrounds
- **Prey-300**: Secondary text, muted content
- **Prey-400**: Tertiary text, labels

### Color Usage Rules
- Default to dark theme with Black-900 base
- Use orange-500 sparingly as accent, not dominant color
- Maintain WCAG AA contrast ratios (4.5:1 minimum for text)
- Apply orange to interactive elements and brand moments

### Implementation Examples
```
Primary button: background #FF8C00, hover #FFA500
Text link: color #FFB84D, hover #FF8C00
Card: background prey-750, hover prey-700
Body text: white or prey-300
```

## Design Principles

### Performance Targets
- Target 60 FPS for smooth gameplay
- Optimize render loops and minimize redraws
- Use requestAnimationFrame for animations

### Interaction Design
- Provide immediate visual feedback for all player inputs (< 100ms response)
- Add satisfying juice: screen shake, particle effects, sound effects
- Smooth transitions for all button interactions
- Maintain consistent spacing and visual hierarchy

### Game Feel
- Retro pixel art aesthetic with modern polish
- Clear visual feedback for game events (collisions, scoring, power-ups)
- Ask user about gravity mechanics before implementing physics

### Accessibility
- High contrast between text and backgrounds
- Clear visual indicators for interactive elements
- Keyboard navigation support where applicable 