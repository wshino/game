# Project: 大航海時代 (Age of Discovery Trading Game)

## Overview

A browser-based trading simulation game themed around the Age of Discovery. Players trade goods across 7 historical ports, upgrade their ships, and build wealth through strategic trading.

## Tech Stack

- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **No Framework**: Vanilla JavaScript implementation
- **Storage**: No persistence (resets on page reload)
- **Deployment**: GitHub Pages
- **Node.js**: v20+ (for development tooling only)

## Project Structure

```
/
├── index.html          # Main game page
├── game.js            # Core game logic
├── style.css          # Styling and animations
├── package.json       # Project metadata
├── README.md          # Project documentation
├── GAME_DESIGN.md     # Game design document
├── SPECIFICATIONS.md  # Technical specifications
└── openspec/          # OpenSpec directory
    ├── AGENTS.md      # AI agent instructions
    ├── project.md     # This file
    ├── specs/         # Current specifications
    └── changes/       # Change proposals
```

## Game Features

### Ports (7 Historical Locations)
1. リスボン (Lisbon) - Portugal
2. セビリア (Seville) - Spain
3. ヴェネツィア (Venice) - Italy
4. アレクサンドリア (Alexandria) - Egypt
5. カリカット (Calicut) - India
6. マラッカ (Malacca) - Malaysia
7. 長崎 (Nagasaki) - Japan

### Trade Goods (8 Types)
- ワイン (Wine)
- 織物 (Textiles)
- 香辛料 (Spices)
- 絹 (Silk)
- 金鉱石 (Gold Ore)
- 陶器 (Porcelain)
- 茶 (Tea)
- 銀 (Silver)

### Ship Types (4 Upgrades)
1. カラベル船 (Caravel) - Capacity: 50, Speed: 1x
2. キャラック船 (Carrack) - Capacity: 100, Speed: 1.2x
3. ガレオン船 (Galleon) - Capacity: 150, Speed: 1.5x
4. 東インド会社船 (East India Company Ship) - Capacity: 250, Speed: 2x

### Game Mechanics
- **Dynamic Pricing**: Prices fluctuate ±10% in real-time
- **Travel Costs**: Based on distance and ship speed
- **Autopilot**: Automated trading between ports
- **Starting Capital**: 1000 Gold

## Coding Conventions

### JavaScript
- Use `const` and `let` (no `var`)
- Camelcase for variables and functions
- Single quotes for strings
- Semicolons required
- Clear comments in Japanese for game logic

### HTML
- Semantic HTML5 tags
- UTF-8 encoding
- Responsive meta viewport

### CSS
- Mobile-first responsive design
- CSS animations for visual effects
- BEM-like naming for classes
- Colors: Maritime theme (blues, golds, browns)

### UI/UX
- Clear visual feedback for actions
- Animated effects (waves, ship movement)
- Japanese text for game content
- Responsive design for mobile and desktop

## Development Workflow

1. Check existing specifications in `openspec/specs/`
2. For new features, create proposal in `openspec/changes/`
3. Implement changes following specifications
4. Update specs to reflect implementation
5. Test in browser (no automated tests currently)
6. Commit and push to feature branch
7. Create PR for review

## Game Balance

Refer to `BALANCE_REPORT.md` for:
- Profitability analysis by trade route
- Ship upgrade ROI calculations
- Recommended trading strategies

## Current Status

- Core trading mechanics: ✓ Implemented
- Ship upgrades: ✓ Implemented
- Autopilot feature: ✓ Implemented
- Autopilot persistence: ✓ Implemented (continues when browser closed or page reloaded)
- Save/Load system: ✗ Not implemented (intentional)

## Language

- **Code Comments**: Japanese
- **UI Text**: Japanese
- **Documentation**: Japanese (README) and English (technical docs)
- **Git Commits**: Japanese or English

## Contact

Repository: https://github.com/wshino/game
