# 8-bit Room Game

A simple 8-bit style game built with Phaser.js featuring a single room environment, an auto-roaming character, weapon-based screen effects, dynamic lighting, and a special transformation system.

## Features

- **Single Room Environment**: A room with two walls, computer desk, couch, TV with game console, and a window as the light source
- **Auto-Roaming Character**: An 8-bit character that automatically roams around the room with idle animations
- **Four Weapons**: 
  - **Foam Bat**: Light screen bounce
  - **Frying Pan**: Room bounces more
  - **Toy Hammer**: Screen bounce + flash
  - **Zapper**: Rapid bouncing + flashing
- **Time-of-Day Lighting**: Room lighting changes based on time (bright afternoon, evening-toned at night)
- **Gorilla Mode**: At 1000 hits, the character transforms into Super Saiyan-style gorilla mode for 2 minutes, going wild and messing up the room
- **Room Repair**: After gorilla mode, the room gradually repairs itself with one object fixed every few seconds

## How to Play

1. Open `index.html` in a web browser
2. Click on the game canvas to attack with your selected weapon
3. Select different weapons using the UI buttons on the left
4. Watch the character roam around the room
5. Build up hits to trigger gorilla mode at 1000 hits
6. Observe the time-of-day lighting changes

## Controls

- **Mouse Click**: Attack with selected weapon
- **Weapon Buttons**: Select different weapons (Foam Bat, Frying Pan, Toy Hammer, Zapper)

## Technical Details

- **Engine**: Phaser.js 3.80.1
- **Resolution**: 1024x768
- **Style**: 8-bit pixel art
- **Browser**: Modern browsers with JavaScript enabled

## Setup

No installation required! Just open `index.html` in your web browser. The game uses Phaser.js via CDN.

## License

This project is open source and available for personal use.
