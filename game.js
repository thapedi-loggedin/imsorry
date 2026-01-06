// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-canvas',
    backgroundColor: '#3a3a3a',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: GameScene
};

// Initialize game
const game = new Phaser.Game(config);

// Main game scene
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Game state
        this.hitCount = 0;
        this.currentWeapon = 'bat';
        this.timeOfDay = 14; // Start at 2 PM (14:00)
        this.gorillaMode = false;
        this.gorillaModeTimer = 0;
        this.roomDestroyed = false;
        this.furnitureOriginalPositions = {};
        this.furnitureDestroyed = [];
        this.repairQueue = [];
        this.repairTimer = 0;
        
        // Character state
        this.characterTarget = null;
        this.idleAnimationTimer = 0;
        this.characterMoving = false;
        
        // Create room
        this.createRoom();
        
        // Create character
        this.createCharacter();
        
        // Setup weapons
        this.setupWeapons();
        
        // Setup lighting
        this.setupLighting();
        
        // Setup UI updates
        this.setupUI();
        
        // Time progression
        this.time.addEvent({
            delay: 1000, // Update every second
            callback: this.updateTime,
            callbackScope: this,
            loop: true
        });
    }

    createRoom() {
        // Room floor
        this.add.rectangle(512, 384, 1024, 768, 0x4a4a4a);
        
        // Left wall
        this.leftWall = this.add.rectangle(50, 384, 100, 768, 0x5a5a5a);
        this.leftWall.setStrokeStyle(2, 0x333333);
        
        // Right wall
        this.rightWall = this.add.rectangle(974, 384, 100, 768, 0x5a5a5a);
        this.rightWall.setStrokeStyle(2, 0x333333);
        
        // Window (top center, light source)
        this.window = this.add.rectangle(512, 100, 200, 150, 0x87ceeb);
        this.window.setStrokeStyle(3, 0x654321);
        this.windowLight = this.add.rectangle(512, 100, 200, 150, 0xffffff);
        this.windowLight.setAlpha(0.3);
        
        // TV with console (top center, below window)
        this.tv = this.add.rectangle(512, 250, 180, 120, 0x1a1a1a);
        this.tv.setStrokeStyle(2, 0x000000);
        this.tvScreen = this.add.rectangle(512, 250, 150, 90, 0x0000ff);
        this.tvScreen.setAlpha(0.5);
        this.console = this.add.rectangle(512, 310, 100, 30, 0x333333);
        this.console.setStrokeStyle(2, 0x000000);
        
        // Computer desk (bottom left)
        this.desk = this.add.rectangle(250, 600, 200, 100, 0x654321);
        this.desk.setStrokeStyle(2, 0x4a2c1a);
        this.deskMonitor = this.add.rectangle(250, 550, 120, 80, 0x1a1a1a);
        this.deskMonitor.setStrokeStyle(2, 0x000000);
        this.deskScreen = this.add.rectangle(250, 550, 100, 60, 0x00ff00);
        this.deskScreen.setAlpha(0.3);
        
        // Couch (bottom right)
        this.couch = this.add.rectangle(750, 600, 200, 120, 0x8b4513);
        this.couch.setStrokeStyle(2, 0x654321);
        this.couchBack = this.add.rectangle(750, 540, 200, 40, 0x8b4513);
        this.couchBack.setStrokeStyle(2, 0x654321);
        
        // Store original positions for repair
        this.furnitureOriginalPositions = {
            tv: { x: 512, y: 250 },
            console: { x: 512, y: 310 },
            desk: { x: 250, y: 600 },
            deskMonitor: { x: 250, y: 550 },
            deskScreen: { x: 250, y: 550 },
            couch: { x: 750, y: 600 },
            couchBack: { x: 750, y: 540 },
            window: { x: 512, y: 100 },
            windowLight: { x: 512, y: 100 }
        };
        
        // Create furniture array for easy access
        this.furniture = [
            { obj: this.tv, name: 'tv' },
            { obj: this.console, name: 'console' },
            { obj: this.desk, name: 'desk' },
            { obj: this.deskMonitor, name: 'deskMonitor' },
            { obj: this.deskScreen, name: 'deskScreen' },
            { obj: this.couch, name: 'couch' },
            { obj: this.couchBack, name: 'couchBack' }
        ];
    }

    createCharacter() {
        // Create 8-bit character (simple rectangle sprite)
        this.character = this.add.rectangle(512, 384, 40, 40, 0x00ff00);
        this.character.setStrokeStyle(2, 0x00aa00);
        
        // Character eyes
        this.characterEye1 = this.add.circle(502, 374, 4, 0x000000);
        this.characterEye2 = this.add.circle(522, 374, 4, 0x000000);
        
        // Start roaming
        this.startRoaming();
        
        // Idle animation
        this.idleAnimationTimer = this.time.addEvent({
            delay: 2000,
            callback: this.playIdleAnimation,
            callbackScope: this,
            loop: true
        });
    }

    startRoaming() {
        if (this.gorillaMode) {
            // In gorilla mode, move erratically
            this.moveCharacterErratically();
        } else {
            // Normal roaming
            const waypoints = [
                { x: 200, y: 400 },
                { x: 400, y: 300 },
                { x: 600, y: 400 },
                { x: 800, y: 500 },
                { x: 600, y: 600 },
                { x: 400, y: 500 },
                { x: 512, y: 384 }
            ];
            
            const randomWaypoint = Phaser.Utils.Array.GetRandom(waypoints);
            this.characterTarget = randomWaypoint;
            this.characterMoving = true;
        }
    }

    moveCharacterErratically() {
        const randomX = Phaser.Math.Between(100, 924);
        const randomY = Phaser.Math.Between(100, 668);
        const speed = Phaser.Math.Between(300, 600);
        
        this.tweens.add({
            targets: [this.character, this.characterEye1, this.characterEye2],
            x: randomX,
            y: randomY,
            duration: speed,
            ease: 'Power2',
            onComplete: () => {
                if (this.gorillaMode) {
                    this.moveCharacterErratically();
                }
            }
        });
    }

    playIdleAnimation() {
        if (!this.characterMoving && !this.gorillaMode) {
            // Breathing animation
            this.tweens.add({
                targets: this.character,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 500,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });
        }
    }

    setupWeapons() {
        // Weapon buttons
        const weapons = ['bat', 'pan', 'hammer', 'zapper'];
        weapons.forEach(weapon => {
            const btn = document.getElementById(`weapon-${weapon}`);
            if (btn) {
                btn.addEventListener('click', () => {
                    this.selectWeapon(weapon);
                });
            }
        });
        
        // Attack on canvas click
        this.input.on('pointerdown', (pointer) => {
            if (!this.gorillaMode) {
                this.attack();
            }
        });
    }

    selectWeapon(weapon) {
        this.currentWeapon = weapon;
        
        // Update UI
        document.querySelectorAll('.weapon-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`weapon-${weapon}`).classList.add('active');
    }

    attack() {
        // Increment hit counter
        this.hitCount++;
        this.updateHitCounter();
        
        // Apply weapon effects
        switch (this.currentWeapon) {
            case 'bat':
                this.cameras.main.shake(100, 0.005);
                break;
            case 'pan':
                this.cameras.main.shake(200, 0.01);
                break;
            case 'hammer':
                this.cameras.main.shake(150, 0.008);
                this.cameras.main.flash(100, 255, 255, 255);
                break;
            case 'zapper':
                this.cameras.main.shake(300, 0.02);
                this.cameras.main.flash(50, 255, 255, 255);
                // Rapid flashing
                this.time.delayedCall(100, () => {
                    this.cameras.main.flash(50, 255, 255, 255);
                });
                this.time.delayedCall(200, () => {
                    this.cameras.main.flash(50, 255, 255, 255);
                });
                break;
        }
        
        // Check for gorilla mode trigger
        if (this.hitCount >= 1000 && !this.gorillaMode) {
            this.triggerGorillaMode();
        }
    }

    triggerGorillaMode() {
        this.gorillaMode = true;
        this.gorillaModeTimer = 120000; // 2 minutes in milliseconds
        this.roomDestroyed = true;
        
        // Transform character
        this.character.setFillStyle(0xff6600); // Orange/red
        this.character.setScale(1.5);
        this.character.setStrokeStyle(3, 0xff0000);
        
        // Mess up the room
        this.destroyRoom();
        
        // Intense screen effects
        this.time.addEvent({
            delay: 500,
            callback: () => {
                if (this.gorillaMode) {
                    this.cameras.main.shake(200, 0.01);
                    this.cameras.main.flash(100, 255, 100, 0);
                }
            },
            callbackScope: this,
            loop: true
        });
        
        // Start gorilla mode timer
        this.time.addEvent({
            delay: this.gorillaModeTimer,
            callback: this.endGorillaMode,
            callbackScope: this
        });
    }

    destroyRoom() {
        // Randomly move and rotate furniture
        this.furniture.forEach(item => {
            const randomX = Phaser.Math.Between(100, 924);
            const randomY = Phaser.Math.Between(100, 668);
            const randomRotation = Phaser.Math.Between(0, 360);
            
            this.tweens.add({
                targets: item.obj,
                x: randomX,
                y: randomY,
                angle: randomRotation,
                duration: 1000,
                ease: 'Bounce.easeOut'
            });
            
            this.furnitureDestroyed.push(item.name);
        });
        
        // Mess up window
        this.tweens.add({
            targets: [this.window, this.windowLight],
            x: Phaser.Math.Between(300, 724),
            y: Phaser.Math.Between(50, 200),
            angle: Phaser.Math.Between(-45, 45),
            duration: 1000,
            ease: 'Bounce.easeOut'
        });
        this.furnitureDestroyed.push('window');
        this.furnitureDestroyed.push('windowLight');
    }

    endGorillaMode() {
        this.gorillaMode = false;
        
        // Reset character
        this.character.setFillStyle(0x00ff00);
        this.character.setScale(1);
        this.character.setStrokeStyle(2, 0x00aa00);
        
        // Start room repair
        this.startRoomRepair();
    }

    startRoomRepair() {
        // Create repair queue from destroyed furniture
        this.repairQueue = [...this.furnitureDestroyed];
        this.furnitureDestroyed = [];
        this.repairTimer = 0;
        
        // Repair one item every few seconds
        this.time.addEvent({
            delay: 3000, // Every 3 seconds
            callback: this.repairNextItem,
            callbackScope: this,
            repeat: this.repairQueue.length - 1
        });
    }

    repairNextItem() {
        if (this.repairQueue.length > 0) {
            const itemName = this.repairQueue.shift();
            const originalPos = this.furnitureOriginalPositions[itemName];
            
            if (originalPos) {
                let itemObj = null;
                
                // Find the object
                if (itemName === 'tv') itemObj = this.tv;
                else if (itemName === 'console') itemObj = this.console;
                else if (itemName === 'desk') itemObj = this.desk;
                else if (itemName === 'deskMonitor') itemObj = this.deskMonitor;
                else if (itemName === 'deskScreen') itemObj = this.deskScreen;
                else if (itemName === 'couch') itemObj = this.couch;
                else if (itemName === 'couchBack') itemObj = this.couchBack;
                else if (itemName === 'window') itemObj = this.window;
                else if (itemName === 'windowLight') itemObj = this.windowLight;
                
                if (itemObj) {
                    // Animate back to original position
                    this.tweens.add({
                        targets: itemObj,
                        x: originalPos.x,
                        y: originalPos.y,
                        angle: 0,
                        duration: 1000,
                        ease: 'Power2'
                    });
                }
            }
        }
        
        // Check if all repaired
        if (this.repairQueue.length === 0) {
            this.roomDestroyed = false;
        }
    }

    setupLighting() {
        // Create lighting overlay
        this.lightingOverlay = this.add.rectangle(512, 384, 1024, 768, 0x000000);
        this.lightingOverlay.setAlpha(0);
        this.lightingOverlay.setDepth(1000);
        
        // Update lighting based on time
        this.updateLighting();
    }

    updateTime() {
        // Progress time (1 hour per minute of real time)
        this.timeOfDay += 0.0167; // ~1 hour per minute
        
        if (this.timeOfDay >= 24) {
            this.timeOfDay = 0;
        }
        
        this.updateLighting();
        this.updateTimeDisplay();
    }

    updateLighting() {
        let alpha = 0;
        let windowAlpha = 0.3;
        
        // Afternoon (12-18): Bright
        if (this.timeOfDay >= 12 && this.timeOfDay < 18) {
            alpha = 0;
            windowAlpha = 0.5;
        }
        // Evening (18-22): Getting darker
        else if (this.timeOfDay >= 18 && this.timeOfDay < 22) {
            alpha = (this.timeOfDay - 18) / 4 * 0.4;
            windowAlpha = 0.5 - (this.timeOfDay - 18) / 4 * 0.2;
        }
        // Night (22-6): Dark
        else if (this.timeOfDay >= 22 || this.timeOfDay < 6) {
            alpha = 0.4;
            windowAlpha = 0.1;
        }
        // Morning (6-12): Getting brighter
        else {
            alpha = 0.4 - (this.timeOfDay - 6) / 6 * 0.4;
            windowAlpha = 0.1 + (this.timeOfDay - 6) / 6 * 0.4;
        }
        
        this.lightingOverlay.setAlpha(alpha);
        this.windowLight.setAlpha(windowAlpha);
    }

    updateTimeDisplay() {
        const hour = Math.floor(this.timeOfDay);
        const minute = Math.floor((this.timeOfDay - hour) * 60);
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        let period = 'Afternoon';
        if (this.timeOfDay >= 18 && this.timeOfDay < 22) {
            period = 'Evening';
        } else if (this.timeOfDay >= 22 || this.timeOfDay < 6) {
            period = 'Night';
        } else if (this.timeOfDay >= 6 && this.timeOfDay < 12) {
            period = 'Morning';
        }
        
        document.getElementById('time-display').textContent = `${period} (${timeString})`;
    }

    setupUI() {
        this.updateHitCounter();
        this.updateTimeDisplay();
    }

    updateHitCounter() {
        document.getElementById('hit-counter').textContent = this.hitCount;
    }

    update() {
        // Character movement
        if (this.characterTarget && !this.gorillaMode && !this.characterMoving) {
            const distance = Phaser.Math.Distance.Between(
                this.character.x,
                this.character.y,
                this.characterTarget.x,
                this.characterTarget.y
            );
            
            const speed = 100; // pixels per second
            const duration = (distance / speed) * 1000; // milliseconds
            
            this.characterMoving = true;
            
            this.tweens.add({
                targets: [this.character, this.characterEye1, this.characterEye2],
                x: this.characterTarget.x,
                y: this.characterTarget.y,
                duration: duration,
                ease: 'Linear',
                onUpdate: () => {
                    // Keep eyes relative to character
                    this.characterEye1.x = this.character.x - 10;
                    this.characterEye1.y = this.character.y - 10;
                    this.characterEye2.x = this.character.x + 10;
                    this.characterEye2.y = this.character.y - 10;
                },
                onComplete: () => {
                    // Reached target, wait then pick new target
                    this.characterTarget = null;
                    this.characterMoving = false;
                    
                    this.time.delayedCall(2000, () => {
                        if (!this.gorillaMode) {
                            this.startRoaming();
                        }
                    });
                }
            });
        }
    }
}
