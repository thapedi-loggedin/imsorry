# Treehouse Sanctuary

A cozy isometric Phaser game prototype about living in a warm treehouse room, letting things get messy, and quietly restoring order over time.

## Current Direction

The room is now built as an **art-backed Phaser scene**:

- The approved isometric concept image is used as the room background.
- Phaser handles invisible interaction zones, character movement, mess states, repair queue, and UI overlays.
- This keeps the visual bar close to the concept while the gameplay systems stay flexible.

## Tech Stack

- Vite
- Phaser 3
- Plain JavaScript modules

## Project Structure

- `index.html` - Vite HTML entry
- `src/main.js` - Phaser bootstrapping
- `src/scenes/SanctuaryScene.js` - main game scene
- `src/scenes/sanctuaryObjects.js` - interaction zone data
- `src/styles.css` - page shell styling
- `public/assets/backgrounds/treehouse-sanctuary-concept.png` - current room background

## Scripts

```bash
npm install
npm run dev
npm run build
```

## Controls

- Click a room object to make it messy, then broken.
- Click the floor to move the character.
- Wait and the character automatically restores queued objects.

## Manual Validation

1. Run `npm run dev`.
2. Open the local Vite URL.
3. Confirm the concept-art room appears, not programmer-art furniture.
4. Click fireplace, shelves, couch, desk, record player, and stairwell zones.
5. Confirm labels/markers appear and the HUD updates.
6. Wait for the character to walk to queued objects and repair them.
