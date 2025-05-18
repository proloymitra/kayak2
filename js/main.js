/**
 * River Rapids: Bangladesh - Kayak Racing Game
 * A top-down kayak racing game featuring Bangladeshi rivers
 */

// Game State Management
const GameState = {
    MAIN_MENU: 'main-menu',
    KAYAK_SELECTION: 'kayak-selection',
    RIVER_SELECTION: 'river-selection',
    MODE_SELECTION: 'mode-selection',
    MULTIPLAYER_OPTIONS: 'multiplayer-options',
    CREATE_ROOM: 'create-room',
    JOIN_ROOM: 'join-room',
    ROOM_LOBBY: 'room-lobby',
    GAMEPLAY: 'gameplay',
    END_GAME: 'end-game'
};

// Game Settings and Configuration
const Config = {
    // Canvas settings
    CANVAS_WIDTH: 480,
    CANVAS_HEIGHT: 800,
    
    // Game physics settings
    PADDLE_POWER: 0.5,
    WATER_RESISTANCE: 0.98,
    TURN_RATE: 0.05,
    
    // Kayak types and their stats
    KAYAKS: {
        1: { 
            name: 'Racing Kayak',
            speed: 0.9,
            maneuverability: 0.5,
            durability: 0.4,
            image: 'kayakOpt1.png'
        },
        2: { 
            name: 'Balanced Kayak',
            speed: 0.7,
            maneuverability: 0.7,
            durability: 0.6,
            image: 'kayak2.png'
        },
        3: { 
            name: 'Traditional Kayak',
            speed: 0.5,
            maneuverability: 0.9,
            durability: 0.8,
            image: 'kayak3.png'
        }
    },
    
    // River types and their characteristics
    RIVERS: {
        'padma': {
            name: 'Padma River',
            difficulty: 1,
            length: 'medium',
            width: 300,
            currentVariation: 0.2,
            obstacleFrequency: 0.3,
            image: 'padma.png'
        },
        'jamuna': {
            name: 'Jamuna River',
            difficulty: 2,
            length: 'short',
            width: 250,
            currentVariation: 0.3,
            obstacleFrequency: 0.5,
            image: 'jamuna.png'
        },
        'meghna': {
            name: 'Meghna River',
            difficulty: 3,
            length: 'long',
            width: 280,
            currentVariation: 0.5,
            obstacleFrequency: 0.7,
            image: 'meghna.png'
        }
    }
};

// Game variables
let currentState = GameState.MAIN_MENU;
let selectedKayak = null;
let selectedRiver = null;
let isMultiplayer = false;
let gameCanvas = null;
let ctx = null;
let gameRunning = false;
let gameLoop = null;
let player = null;
let opponents = [];
let obstacles = [];
let riverSegments = [];
let raceStartTime = 0;
let raceFinishTimes = {};
let paddleRhythm = { left: 0, right: 0, optimal: false };
let musicEnabled = true;

// Input tracking
const keys = {
    left: false,     // A key
    right: false,    // D key
    balance: false,  // Space key
    special: false   // Shift key
};

// Initialize the game when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
    
    // Initialize Photon multiplayer
    if (typeof PhotonManager !== 'undefined') {
        // Init Photon with slight delay to ensure DOM is ready
        setTimeout(() => {
            PhotonManager.initializePhoton();
        }, 1000);
    }
});

// Main game initialization
function initializeGame() {
    // Set up canvas
    gameCanvas = document.getElementById('game-canvas');
    gameCanvas.width = Config.CANVAS_WIDTH;
    gameCanvas.height = Config.CANVAS_HEIGHT;
    ctx = gameCanvas.getContext('2d');
    
    // Set up event listeners for UI navigation
    setupEventListeners();
    
    // Load assets (simplified version)
    loadAssets();
    
    // Display main menu
    showScreen(GameState.MAIN_MENU);
}

// Function to transition between screens
function showScreen(screenId) {
    // Hide all screens
    const screens = document.querySelectorAll('.game-screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show the requested screen
    const screenToShow = document.getElementById(screenId);
    screenToShow.classList.add('active');
    
    // Update current state
    currentState = screenId;
    
    // Special handling for certain screens
    if (screenId === GameState.GAMEPLAY) {
        startGame();
    } else if (screenId === GameState.MAIN_MENU) {
        // Reset selections when returning to main menu
        selectedKayak = null;
        selectedRiver = null;
    }
}

// Set up event listeners for UI interaction
function setupEventListeners() {
    // Main Menu
    document.getElementById('play-game-btn').addEventListener('click', () => {
        showScreen(GameState.KAYAK_SELECTION);
    });
    
    document.getElementById('music-switch').addEventListener('change', (e) => {
        musicEnabled = e.target.checked;
        toggleMusic(musicEnabled);
    });
    
    document.getElementById('exit-game-btn').addEventListener('click', () => {
        // In a browser environment, this might just show a confirmation
        if (confirm('Are you sure you want to exit the game?')) {
            // In a real application, this might close the window
            console.log('Game exited');
        }
    });
    
    // Kayak Selection
    const kayakOptions = document.querySelectorAll('.kayak-option');
    kayakOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove selection from all kayaks
            kayakOptions.forEach(k => k.classList.remove('selected'));
            // Add selection to clicked kayak
            option.classList.add('selected');
            // Store selection
            selectedKayak = option.getAttribute('data-kayak');
        });
    });
    
    document.getElementById('back-from-kayak').addEventListener('click', () => {
        showScreen(GameState.MAIN_MENU);
    });
    
    document.getElementById('confirm-kayak').addEventListener('click', () => {
        if (selectedKayak) {
            showScreen(GameState.RIVER_SELECTION);
        } else {
            alert('Please select a kayak to continue');
        }
    });
    
    // River Selection
    const riverOptions = document.querySelectorAll('.river-option');
    riverOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove selection from all rivers
            riverOptions.forEach(r => r.classList.remove('selected'));
            // Add selection to clicked river
            option.classList.add('selected');
            // Store selection
            selectedRiver = option.getAttribute('data-river');
        });
    });
    
    document.getElementById('back-from-river').addEventListener('click', () => {
        showScreen(GameState.KAYAK_SELECTION);
    });
    
    document.getElementById('confirm-river').addEventListener('click', () => {
        if (selectedRiver) {
            showScreen(GameState.MODE_SELECTION);
        } else {
            alert('Please select a river to continue');
        }
    });
    
    // Game Mode Selection
    document.getElementById('single-player-btn').addEventListener('click', () => {
        isMultiplayer = false;
        showScreen(GameState.GAMEPLAY);
    });
    
    document.getElementById('multiplayer-btn').addEventListener('click', () => {
        isMultiplayer = true;
        showScreen(GameState.MULTIPLAYER_OPTIONS);
    });
    
    document.getElementById('back-from-mode').addEventListener('click', () => {
        showScreen(GameState.RIVER_SELECTION);
    });
    
    // Multiplayer Options
    document.getElementById('create-room-btn').addEventListener('click', () => {
        if (PhotonManager.isConnectedToPhoton()) {
            // Create a Photon room
            const roomCode = PhotonManager.createPhotonRoom();
            
            if (roomCode) {
                document.getElementById('room-code').textContent = roomCode;
                document.getElementById('start-game-btn').disabled = true; // Disable until players join
                showScreen(GameState.CREATE_ROOM);
                
                // Update local player data
                if (selectedKayak) {
                    PhotonManager.localPlayerData.kayakType = selectedKayak;
                }
                
                if (selectedRiver) {
                    PhotonManager.localPlayerData.riverType = selectedRiver;
                }
                
                // Send initial update
                PhotonManager.sendPlayerUpdate();
            } else {
                alert('Failed to create a multiplayer room. Please try again.');
            }
        } else {
            alert('Could not connect to multiplayer server. Please try again later.');
        }
    });
    
    document.getElementById('join-room-btn').addEventListener('click', () => {
        if (PhotonManager.isConnectedToPhoton()) {
            showScreen(GameState.JOIN_ROOM);
        } else {
            alert('Could not connect to multiplayer server. Please try again later.');
        }
    });
    
    document.getElementById('back-from-mp-options').addEventListener('click', () => {
        showScreen(GameState.MODE_SELECTION);
    });
    
    // Create Room
    document.getElementById('share-code-btn').addEventListener('click', () => {
        const roomCode = document.getElementById('room-code').textContent;
        
        // Copy to clipboard if possible
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(roomCode)
                .then(() => alert('Room code copied to clipboard!'))
                .catch(err => alert(`Share this code with friends: ${roomCode}`));
        } else {
            alert(`Share this code with friends: ${roomCode}`);
        }
    });
    
    document.getElementById('back-from-create-room').addEventListener('click', () => {
        // Leave the Photon room if we're in one
        if (PhotonManager.isConnectedToPhoton()) {
            PhotonManager.leavePhotonRoom();
        }
        
        showScreen(GameState.MULTIPLAYER_OPTIONS);
    });
    
    document.getElementById('start-game-btn').addEventListener('click', () => {
        // Start the multiplayer game via Photon
        if (PhotonManager.isRoomHost()) {
            PhotonManager.startMultiplayerGame();
            showScreen(GameState.GAMEPLAY);
        }
    });
    
    // Join Room
    document.getElementById('join-btn').addEventListener('click', () => {
        const roomCode = document.getElementById('room-code-input').value;
        if (roomCode && roomCode.length >= 4) {
            // Try to join the Photon room
            if (PhotonManager.isConnectedToPhoton()) {
                const joined = PhotonManager.joinPhotonRoom(roomCode);
                
                if (joined) {
                    showScreen(GameState.ROOM_LOBBY);
                    document.getElementById('lobby-room-code').textContent = roomCode;
                } else {
                    alert('Could not join the room. Please check the room code and try again.');
                }
            } else {
                alert('Could not connect to multiplayer server. Please try again later.');
            }
        } else {
            alert('Please enter a valid room code');
        }
    });
    
    document.getElementById('back-from-join-room').addEventListener('click', () => {
        showScreen(GameState.MULTIPLAYER_OPTIONS);
    });
    
    // Room Lobby
    document.getElementById('ready-btn').addEventListener('click', (e) => {
        const isReady = e.target.textContent === 'Ready';
        e.target.textContent = isReady ? 'Not Ready' : 'Ready';
        e.target.classList.toggle('primary-btn');
        e.target.classList.toggle('secondary-btn');
        
        // Update player state in Photon
        if (PhotonManager.isConnectedToPhoton()) {
            // Send updated player status via Photon
            PhotonManager.sendPlayerUpdate();
        }
    });
    
    document.getElementById('leave-room-btn').addEventListener('click', () => {
        // Leave the Photon room
        if (PhotonManager.isConnectedToPhoton()) {
            PhotonManager.leavePhotonRoom();
        }
        
        showScreen(GameState.MULTIPLAYER_OPTIONS);
    });
    
    document.getElementById('start-lobby-game-btn').addEventListener('click', () => {
        // Start the multiplayer game via Photon
        if (PhotonManager.isRoomHost()) {
            PhotonManager.startMultiplayerGame();
            showScreen(GameState.GAMEPLAY);
        }
    });
    
    // Chat functionality
    document.getElementById('send-chat-btn').addEventListener('click', () => {
        const chatInput = document.getElementById('chat-input');
        const message = chatInput.value.trim();
        
        if (message && PhotonManager.isConnectedToPhoton()) {
            PhotonManager.sendChatMessage(message);
            chatInput.value = '';
        }
    });
    
    document.getElementById('send-lobby-chat-btn').addEventListener('click', () => {
        const chatInput = document.getElementById('lobby-chat-input');
        const message = chatInput.value.trim();
        
        if (message && PhotonManager.isConnectedToPhoton()) {
            PhotonManager.sendChatMessage(message);
            chatInput.value = '';
        }
    });
    
    // End Game Screen
    document.getElementById('play-again-btn').addEventListener('click', () => {
        showScreen(GameState.KAYAK_SELECTION);
    });
    
    document.getElementById('return-to-lobby-btn').addEventListener('click', () => {
        showScreen(GameState.ROOM_LOBBY);
    });
    
    document.getElementById('main-menu-btn').addEventListener('click', () => {
        showScreen(GameState.MAIN_MENU);
    });
    
    // Keyboard controls for gameplay
    window.addEventListener('keydown', (e) => {
        if (currentState === GameState.GAMEPLAY) {
            switch(e.key.toLowerCase()) {
                case 'a':
                    keys.left = true;
                    break;
                case 'd':
                    keys.right = true;
                    break;
                case ' ':
                    keys.balance = true;
                    break;
                case 'shift':
                    keys.special = true;
                    break;
            }
        }
    });
    
    window.addEventListener('keyup', (e) => {
        if (currentState === GameState.GAMEPLAY) {
            switch(e.key.toLowerCase()) {
                case 'a':
                    keys.left = false;
                    paddleStroke('left');
                    break;
                case 'd':
                    keys.right = false;
                    paddleStroke('right');
                    break;
                case ' ':
                    keys.balance = false;
                    break;
                case 'shift':
                    keys.special = false;
                    break;
            }
        }
    });
    
    // Mobile controls
    if ('ontouchstart' in window) {
        document.getElementById('left-paddle-btn').addEventListener('touchstart', () => {
            keys.left = true;
        });
        
        document.getElementById('left-paddle-btn').addEventListener('touchend', () => {
            keys.left = false;
            paddleStroke('left');
        });
        
        document.getElementById('right-paddle-btn').addEventListener('touchstart', () => {
            keys.right = true;
        });
        
        document.getElementById('right-paddle-btn').addEventListener('touchend', () => {
            keys.right = false;
            paddleStroke('right');
        });
        
        document.getElementById('balance-btn').addEventListener('touchstart', () => {
            keys.balance = true;
        });
        
        document.getElementById('balance-btn').addEventListener('touchend', () => {
            keys.balance = false;
        });
        
        document.getElementById('special-action-btn').addEventListener('touchstart', () => {
            keys.special = true;
        });
        
        document.getElementById('special-action-btn').addEventListener('touchend', () => {
            keys.special = false;
        });
    }
}

// Generate a random room code for multiplayer
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing characters
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('room-code').textContent = code;
    document.getElementById('lobby-room-code').textContent = code;
    return code;
}

// Toggle background music
function toggleMusic(enabled) {
    // In a real implementation, this would play/pause the music
    console.log(`Music ${enabled ? 'enabled' : 'disabled'}`);
    // Example implementation with audio element:
    // const backgroundMusic = document.getElementById('background-music');
    // if (enabled) {
    //     backgroundMusic.play();
    // } else {
    //     backgroundMusic.pause();
    // }
}

// Game assets storage
const Assets = {
    images: {},
    loaded: false,
    totalAssets: 0,
    loadedAssets: 0
};

// Load game assets (images, sounds)
function loadAssets() {
    console.log('Loading game assets...');
    
    // List all images to load
    const imageFiles = [
        'kayakOpt1.png', 
        'kayak2.png', 
        'kayak3.png', 
        'padma.png', 
        'jamuna.png', 
        'meghna.png',
        'main-bg.jpg',
        'leftOar1.png',
        'rightOar1.png'
    ];
    
    Assets.totalAssets = imageFiles.length;
    Assets.loadedAssets = 0;
    
    // Load each image
    imageFiles.forEach(src => {
        const img = new Image();
        
        img.onload = () => {
            Assets.loadedAssets++;
            console.log(`Loaded image: ${src}`);
            
            if (Assets.loadedAssets === Assets.totalAssets) {
                Assets.loaded = true;
                console.log('All assets loaded successfully');
            }
        };
        
        img.onerror = () => {
            Assets.loadedAssets++;
            console.error(`Failed to load image: ${src}`);
            
            // Create a placeholder for failed images
            const placeholderCanvas = document.createElement('canvas');
            placeholderCanvas.width = 200;
            placeholderCanvas.height = 100;
            const ctx = placeholderCanvas.getContext('2d');
            
            // Draw placeholder
            ctx.fillStyle = '#FF9800';
            ctx.fillRect(0, 0, 200, 100);
            ctx.fillStyle = 'black';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Image not found: ${src}`, 100, 50);
            
            // Use placeholder instead
            Assets.images[src] = placeholderCanvas;
            
            if (Assets.loadedAssets === Assets.totalAssets) {
                Assets.loaded = true;
                console.log('Asset loading completed with some errors');
            }
        };
        
        // Start loading the image
        img.src = `assets/images/${src}`;
        Assets.images[src] = img;
    });
}

// Start the game
function startGame() {
    if (gameRunning) return;
    
    // Set default kayak and river if not selected
    if (!selectedKayak) selectedKayak = "2"; // Default to balanced kayak
    if (!selectedRiver) selectedRiver = "padma"; // Default to Padma river
    
    console.log(`Starting game with kayak ${selectedKayak} on river ${selectedRiver}`);
    gameRunning = true;
    
    // Initialize player kayak
    const kayakConfig = Config.KAYAKS[selectedKayak];
    player = {
        x: Config.CANVAS_WIDTH / 2,
        y: Config.CANVAS_HEIGHT - 100,
        width: 30,
        height: 60,
        speed: 0,
        maxSpeed: 5 * kayakConfig.speed,
        angle: 0,  // 0 is pointing up
        turnRate: Config.TURN_RATE * kayakConfig.maneuverability,
        paddleStrength: Config.PADDLE_POWER * kayakConfig.speed,
        durability: kayakConfig.durability,
        lane: 2,   // 1-4 representing the lane
        progress: 0,  // 0-100% of race completion
        finished: false
    };
    
    // Create opponents based on game mode
    if (isMultiplayer) {
        // For multiplayer, convert connected Photon players to opponents
        if (typeof PhotonManager !== 'undefined') {
            // Setup player data for sending
            PhotonManager.localPlayerData.kayakType = selectedKayak;
            PhotonManager.localPlayerData.riverType = selectedRiver;
            
            // Convert remote players to game opponents
            const remoteOpponents = PhotonManager.convertRemotePlayersToOpponents();
            
            // Only use remote opponents if there are any
            if (remoteOpponents && remoteOpponents.length > 0) {
                opponents = remoteOpponents;
                console.log("Created " + opponents.length + " multiplayer opponents");
            } else {
                console.warn("No remote players found, using AI opponents instead");
                createOpponents();
            }
        } else {
            // Fallback to AI opponents if Photon isn't available
            console.warn("PhotonManager not available, using AI opponents");
            createOpponents();
        }
    } else {
        // Create AI opponents for single player
        createOpponents();
    }
    
    // Generate river course
    generateRiverCourse();
    
    // Start race countdown
    startRaceCountdown();
}

// Create AI opponents for single player mode
function createOpponents() {
    opponents = [];
    
    for (let i = 0; i < 3; i++) {
        // Randomly select kayak types for opponents
        const aiKayakType = Math.floor(Math.random() * 3) + 1;
        const aiKayakConfig = Config.KAYAKS[aiKayakType];
        
        // Find an available lane
        let aiLane;
        do {
            aiLane = Math.floor(Math.random() * 4) + 1;
        } while (aiLane === player.lane || opponents.some(op => op.lane === aiLane));
        
        opponents.push({
            x: (aiLane - 0.5) * (Config.CANVAS_WIDTH / 4),
            y: Config.CANVAS_HEIGHT - 100,
            width: 30,
            height: 60,
            speed: 0,
            maxSpeed: 5 * aiKayakConfig.speed * (0.8 + Math.random() * 0.4), // Some variation
            angle: 0,
            turnRate: Config.TURN_RATE * aiKayakConfig.maneuverability,
            paddleStrength: Config.PADDLE_POWER * aiKayakConfig.speed,
            durability: aiKayakConfig.durability,
            lane: aiLane,
            progress: 0,
            finished: false,
            aiKayakType: aiKayakType, // Store kayak type for image reference
            name: `AI Player ${i+1}`,
            paddleTimer: 0,
            difficulty: selectedRiver === 'padma' ? 0.7 : (selectedRiver === 'jamuna' ? 0.8 : 0.9)
        });
    }
}

// Generate the river course
function generateRiverCourse() {
    const riverConfig = Config.RIVERS[selectedRiver];
    riverSegments = [];
    obstacles = [];
    
    // Create river segments based on river length
    const segmentCount = riverConfig.length === 'short' ? 20 : 
                        (riverConfig.length === 'medium' ? 30 : 40);
    
    // Base width of the river
    const baseWidth = riverConfig.width;
    
    for (let i = 0; i < segmentCount; i++) {
        // Vary the river width slightly
        const segmentWidth = baseWidth * (1 - riverConfig.currentVariation/2 + Math.random() * riverConfig.currentVariation);
        
        // Vary the river curve
        const curveAmount = (Math.random() - 0.5) * 0.2 * riverConfig.currentVariation;
        
        // Create faster current sections randomly
        const hasFastCurrent = Math.random() < 0.3;
        
        riverSegments.push({
            width: segmentWidth,
            curve: curveAmount,
            hasFastCurrent: hasFastCurrent,
            y: -i * Config.CANVAS_HEIGHT / 10  // Position segments along the course
        });
        
        // Add obstacles based on frequency
        if (Math.random() < riverConfig.obstacleFrequency) {
            // Different types of obstacles: rocks, debris, whirlpools
            const obstacleType = Math.random() < 0.6 ? 'debris' : 
                               (Math.random() < 0.8 ? 'rock' : 'whirlpool');
            
            obstacles.push({
                x: Config.CANVAS_WIDTH * (0.2 + Math.random() * 0.6),
                y: -i * Config.CANVAS_HEIGHT / 10 - Math.random() * Config.CANVAS_HEIGHT / 10,
                type: obstacleType,
                width: obstacleType === 'rock' ? 40 : 
                      (obstacleType === 'debris' ? 30 : 50),
                height: obstacleType === 'rock' ? 40 : 
                       (obstacleType === 'debris' ? 20 : 50),
                rotation: Math.random() * Math.PI * 2
            });
        }
    }
    
    // Add finish line
    obstacles.push({
        x: Config.CANVAS_WIDTH / 2,
        y: -segmentCount * Config.CANVAS_HEIGHT / 10 - 100,
        type: 'finishLine',
        width: Config.CANVAS_WIDTH,
        height: 20,
        rotation: 0
    });
}

// Start the race countdown sequence
function startRaceCountdown() {
    let countdown = 3;
    
    const countdownInterval = setInterval(() => {
        // Display countdown in the center of the screen
        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        drawRiver();
        drawPlayer();
        drawOpponents();
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (countdown > 0) {
            ctx.fillText(countdown, gameCanvas.width / 2, gameCanvas.height / 2);
            countdown--;
        } else {
            ctx.fillText('GO!', gameCanvas.width / 2, gameCanvas.height / 2);
            clearInterval(countdownInterval);
            
            // Start the actual race
            startRaceTimer();
            gameLoop = requestAnimationFrame(updateGame);
        }
    }, 1000);
}

// Start the race timer
function startRaceTimer() {
    raceStartTime = Date.now();
    raceFinishTimes = {};
}

// Handle paddle stroke (for rhythm-based paddling)
function paddleStroke(side) {
    const now = Date.now();
    const otherSide = side === 'left' ? 'right' : 'left';
    
    // Check if player object exists
    if (!player) return;
    
    // Ensure minimum speed to keep the kayak moving
    if (player.speed < 0.1) {
        player.speed = 0.1;
    }
    
    // Check if this creates a good rhythm
    if (paddleRhythm[otherSide] > 0) {
        const timeDiff = now - paddleRhythm[otherSide];
        
        // Optimal rhythm is between 300-500ms between alternating strokes
        if (timeDiff > 300 && timeDiff < 500) {
            paddleRhythm.optimal = true;
            // Bonus speed for good rhythm
            player.speed += player.paddleStrength * 1.5;
        } else {
            paddleRhythm.optimal = false;
            // Regular paddle power
            player.speed += player.paddleStrength;
        }
    } else {
        // First stroke or same side repeatedly
        paddleRhythm.optimal = false;
        player.speed += player.paddleStrength * 0.7;
    }
    
    // Ensure kayak moves even with minimal paddling
    if (player.speed < 0.2) {
        player.speed = 0.2;
    }
    
    // Record this stroke time
    paddleRhythm[side] = now;
    
    // If paddling on same side repeatedly, turn the kayak
    if (side === 'left') {
        player.angle += player.turnRate;
    } else {
        player.angle -= player.turnRate;
    }
    
    // Clamp the angle to prevent extreme spinning
    if (player.angle > Math.PI/2) player.angle = Math.PI/2;
    if (player.angle < -Math.PI/2) player.angle = -Math.PI/2;
    
    // Clamp the speed
    if (player.speed > player.maxSpeed) {
        player.speed = player.maxSpeed;
    }
    
    console.log(`Paddle ${side}: Speed=${player.speed.toFixed(2)}, Angle=${player.angle.toFixed(2)}`);
}

// Main game loop
function updateGame() {
    if (!gameRunning) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // Update player physics
    updatePlayerPhysics();
    
    // Handle multiplayer data sync if in multiplayer mode
    if (isMultiplayer && typeof PhotonManager !== 'undefined') {
        PhotonManager.updateRemotePlayerData();
    }
    
    // Update AI opponents
    updateOpponents();
    
    // Check for collisions
    checkCollisions();
    
    // Update race progress
    updateRaceProgress();
    
    // Draw everything
    drawRiver();
    drawObstacles();
    drawPlayer();
    drawOpponents();
    drawUI();
    
    // Check if race is complete
    if (checkRaceComplete()) {
        endRace();
    } else {
        // Continue the game loop
        gameLoop = requestAnimationFrame(updateGame);
    }
}

// Update player physics
function updatePlayerPhysics() {
    // Apply water resistance
    player.speed *= Config.WATER_RESISTANCE;
    
    // Handle balance (straighten kayak)
    if (keys.balance) {
        player.angle *= 0.9;
    }
    
    // Apply special action if available (e.g., boost)
    if (keys.special) {
        // Example: temporary speed boost
        player.speed *= 1.1;
    }
    
    // Calculate movement direction based on angle
    const dx = Math.sin(player.angle) * player.speed;
    const dy = -Math.cos(player.angle) * player.speed;
    
    // Update position - this is the player's actual position in the world
    player.x += dx;
    
    // For y-position, we'll move the world around the player
    // We only update player.y for tracking progress, but the player stays centered
    player.y += dy;
    
    // Keep player within horizontal river boundaries (simplified)
    if (player.x < 20) player.x = 20;
    if (player.x > gameCanvas.width - 20) player.x = gameCanvas.width - 20;
    
    // Keep player in the lower portion of the screen (camera focus)
    // We don't modify player.y here, as that tracks progress
}

// Update AI opponents
function updateOpponents() {
    opponents.forEach(opponent => {
        if (opponent.finished) return;
        
        // AI paddling rhythm
        opponent.paddleTimer++;
        
        if (opponent.paddleTimer > 20) {
            // Decide which side to paddle (somewhat intelligent)
            let paddleSide;
            
            // If drifting too far left or right, correct course
            if (opponent.x < (opponent.lane - 0.7) * (Config.CANVAS_WIDTH / 4)) {
                paddleSide = 'left';  // Paddle left to turn right
            } else if (opponent.x > (opponent.lane - 0.3) * (Config.CANVAS_WIDTH / 4)) {
                paddleSide = 'right'; // Paddle right to turn left
            } else {
                // Alternate for optimal speed
                paddleSide = Math.random() < 0.5 ? 'left' : 'right';
            }
            
            // Apply paddle force - make AI opponents move even if river isn't selected
            opponent.speed += opponent.paddleStrength;
            
            // Make sure AI always has some speed to keep moving
            if (opponent.speed < 0.2) {
                opponent.speed = 0.2 + Math.random() * 0.3;
            }
            
            if (opponent.speed > opponent.maxSpeed) {
                opponent.speed = opponent.maxSpeed;
            }
            
            // Apply turning force
            if (paddleSide === 'left') {
                opponent.angle += opponent.turnRate;
            } else {
                opponent.angle -= opponent.turnRate;
            }
            
            // Reset timer with some randomness based on difficulty
            opponent.paddleTimer = Math.random() * 5 * (1 - opponent.difficulty);
        }
        
        // Apply water resistance
        opponent.speed *= Config.WATER_RESISTANCE;
        
        // AI balance control (straighten kayak sometimes)
        if (Math.abs(opponent.angle) > 0.2 && Math.random() < opponent.difficulty) {
            opponent.angle *= 0.8;
        }
        
        // Calculate movement
        const dx = Math.sin(opponent.angle) * opponent.speed;
        const dy = -Math.cos(opponent.angle) * opponent.speed;
        
        // Update position
        opponent.x += dx;
        opponent.y += dy;
        
        // Keep within boundaries
        if (opponent.x < 20) opponent.x = 20;
        if (opponent.x > gameCanvas.width - 20) opponent.x = gameCanvas.width - 20;
    });
}

// Check for collisions with obstacles
function checkCollisions() {
    obstacles.forEach(obstacle => {
        // Simple rectangular collision detection
        if (
            player.x < obstacle.x + obstacle.width / 2 &&
            player.x + player.width > obstacle.x - obstacle.width / 2 &&
            player.y < obstacle.y + obstacle.height / 2 &&
            player.y + player.height > obstacle.y - obstacle.height / 2
        ) {
            handleCollision(player, obstacle);
        }
        
        // Check collisions for AI opponents
        opponents.forEach(opponent => {
            if (
                opponent.x < obstacle.x + obstacle.width / 2 &&
                opponent.x + opponent.width > obstacle.x - obstacle.width / 2 &&
                opponent.y < obstacle.y + obstacle.height / 2 &&
                opponent.y + opponent.height > obstacle.y - obstacle.height / 2
            ) {
                handleCollision(opponent, obstacle);
            }
        });
    });
}

// Handle collision effects
function handleCollision(kayak, obstacle) {
    switch (obstacle.type) {
        case 'rock':
            // Major slowdown
            kayak.speed *= (0.3 + 0.4 * kayak.durability);
            // Random angle deflection
            kayak.angle += (Math.random() - 0.5) * 0.5;
            break;
            
        case 'debris':
            // Minor slowdown
            kayak.speed *= (0.6 + 0.3 * kayak.durability);
            // Small angle deflection
            kayak.angle += (Math.random() - 0.5) * 0.2;
            break;
            
        case 'whirlpool':
            // Spin the kayak
            kayak.angle += Math.PI / 4;
            // Slight slowdown
            kayak.speed *= 0.8;
            break;
            
        case 'finishLine':
            // Mark as finished if not already
            if (!kayak.finished) {
                kayak.finished = true;
                // Record finish time for player
                if (kayak === player) {
                    raceFinishTimes['player'] = Date.now() - raceStartTime;
                } else {
                    raceFinishTimes[kayak.name] = Date.now() - raceStartTime;
                }
            }
            break;
    }
}

// Update race progress for all racers
function updateRaceProgress() {
    // Calculate player progress
    const totalRaceLength = riverSegments.length * Config.CANVAS_HEIGHT / 10 + 100;
    player.progress = (-player.y + Config.CANVAS_HEIGHT - 100) / totalRaceLength * 100;
    
    // Ensure progress is between 0-100%
    player.progress = Math.max(0, Math.min(100, player.progress));
    
    // Calculate AI progress
    opponents.forEach(opponent => {
        opponent.progress = (-opponent.y + Config.CANVAS_HEIGHT - 100) / totalRaceLength * 100;
        opponent.progress = Math.max(0, Math.min(100, opponent.progress));
    });
    
    // Update position indicator
    updatePositionIndicator();
}

// Update the player's position indicator (1st, 2nd, etc.)
function updatePositionIndicator() {
    // Combine player and opponents into a single array
    const allRacers = [
        { name: 'player', progress: player.progress, finished: player.finished },
        ...opponents.map(o => ({ name: o.name, progress: o.progress, finished: o.finished }))
    ];
    
    // Sort by progress (and finish time for completed racers)
    allRacers.sort((a, b) => {
        if (a.finished && b.finished) {
            return raceFinishTimes[a.name] - raceFinishTimes[b.name];
        } else if (a.finished) {
            return -1;
        } else if (b.finished) {
            return 1;
        } else {
            return b.progress - a.progress;
        }
    });
    
    // Find player position
    const playerPosition = allRacers.findIndex(r => r.name === 'player') + 1;
    
    // Update the display
    document.getElementById('position-indicator').textContent = `Position: ${playerPosition}/${allRacers.length}`;
    
    return allRacers;
}

// Check if the race is complete
function checkRaceComplete() {
    // Race is complete if player has finished or all AI opponents have finished
    return player.finished || opponents.every(o => o.finished);
}

// End the race and show results
function endRace() {
    gameRunning = false;
    if (gameLoop) {
        cancelAnimationFrame(gameLoop);
        gameLoop = null;
    }
    
    // Get final positions
    const finalPositions = updatePositionIndicator();
    
    // For multiplayer, ensure we've sent our finish time
    if (isMultiplayer && typeof PhotonManager !== 'undefined' && player.finished) {
        if (PhotonManager.localPlayerData.finishTime === 0) {
            PhotonManager.localPlayerData.finishTime = raceFinishTimes['player'];
            PhotonManager.sendPhotonEvent(PhotonEventCodes.PLAYER_FINISHED, {
                finishTime: PhotonManager.localPlayerData.finishTime
            });
        }
    }
    
    // Populate race results
    const resultsContainer = document.querySelector('.race-results');
    resultsContainer.innerHTML = '';
    
    const positions = ['1st', '2nd', '3rd', '4th'];
    
    finalPositions.forEach((racer, index) => {
        const finishTime = racer.finished ? 
            formatTime(raceFinishTimes[racer.name]) : 'DNF';
        
        const resultEntry = document.createElement('div');
        resultEntry.className = 'result-entry';
        resultEntry.innerHTML = `
            <div class="position">${positions[index]}</div>
            <div class="player-name">${racer.name === 'player' ? 'You' : racer.name}</div>
            <div class="time">${finishTime}</div>
        `;
        
        resultsContainer.appendChild(resultEntry);
    });
    
    // Show end game screen
    showScreen(GameState.END_GAME);
    
    // Show multiplayer-only elements if in multiplayer mode
    if (isMultiplayer) {
        document.body.classList.add('multiplayer');
        
        // Show the return to lobby button only in multiplayer
        document.getElementById('return-to-lobby-btn').style.display = 'block';
    } else {
        document.body.classList.remove('multiplayer');
        
        // Hide the return to lobby button in single player
        document.getElementById('return-to-lobby-btn').style.display = 'none';
    }
}

// Format milliseconds to MM:SS.ms
function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

// Drawing functions
function drawRiver() {
    const playerFixedY = Config.CANVAS_HEIGHT - 150; // Same fixed Y as the player
    
    // Draw river background
    ctx.fillStyle = 'rgb(25, 118, 210)'; // River blue
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // Draw river banks
    ctx.fillStyle = 'rgb(76, 175, 80)'; // Green banks
    
    // Draw river segments
    riverSegments.forEach(segment => {
        // Calculate the segment's position relative to the camera view
        // This makes the river "move" around the player
        const screenY = playerFixedY - (player.y - segment.y);
        
        // Only draw segments that are visible on screen
        if (screenY > -200 && screenY < gameCanvas.height + 200) {
            // Draw river banks
            ctx.fillRect(0, screenY, (gameCanvas.width - segment.width) / 2, 100);
            ctx.fillRect(gameCanvas.width - (gameCanvas.width - segment.width) / 2, screenY, (gameCanvas.width - segment.width) / 2, 100);
            
            // Draw fast current section if present
            if (segment.hasFastCurrent) {
                ctx.fillStyle = 'rgba(187, 222, 251, 0.3)'; // Light blue current
                ctx.fillRect((gameCanvas.width - segment.width) / 2 + 20, screenY, segment.width - 40, 100);
                ctx.fillStyle = 'rgb(76, 175, 80)'; // Reset to green for next segment
            }
        }
    });
    
    // Draw lane markers
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([5, 10]);
    ctx.lineWidth = 2;
    
    for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gameCanvas.width / 4, 0);
        ctx.lineTo(i * gameCanvas.width / 4, gameCanvas.height);
        ctx.stroke();
    }
    
    ctx.setLineDash([]);
}

function drawObstacles() {
    const playerFixedY = Config.CANVAS_HEIGHT - 150; // Same fixed Y as the player
    
    obstacles.forEach(obstacle => {
        // Calculate the obstacle's position relative to the camera view
        const screenX = obstacle.x;
        const screenY = playerFixedY - (player.y - obstacle.y);
        
        // Only draw obstacles that are visible on screen
        if (screenY > -100 && screenY < gameCanvas.height + 100) {
            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.rotate(obstacle.rotation);
            
            switch (obstacle.type) {
                case 'rock':
                    ctx.fillStyle = '#888';
                    ctx.beginPath();
                    ctx.ellipse(0, 0, obstacle.width / 2, obstacle.height / 2, 0, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 'debris':
                    ctx.fillStyle = '#A0522D';
                    ctx.fillRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
                    break;
                    
                case 'whirlpool':
                    // Draw a spiral
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    
                    for (let i = 0; i < 3; i++) {
                        const radius = obstacle.width / 2 * (1 - i * 0.3);
                        ctx.arc(0, 0, radius, 0, Math.PI * 2);
                    }
                    
                    ctx.stroke();
                    break;
                    
                case 'finishLine':
                    ctx.fillStyle = 'white';
                    ctx.fillRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
                    
                    // Checkerboard pattern
                    ctx.fillStyle = 'black';
                    const checkSize = 20;
                    for (let x = -obstacle.width / 2; x < obstacle.width / 2; x += checkSize) {
                        for (let y = -obstacle.height / 2; y < obstacle.height / 2; y += checkSize) {
                            // Draw checkered pattern
                            if ((Math.floor(x / checkSize) + Math.floor(y / checkSize)) % 2 === 0) {
                                ctx.fillRect(x, y, checkSize, checkSize);
                            }
                        }
                    }
                    break;
            }
            
            ctx.restore();
            
            // Slowly rotate the obstacles for animation
            obstacle.rotation += 0.001;
        }
    });
}

function drawPlayer() {
    if (!player) return;
    
    ctx.save();
    
    // Position the player at a fixed position in the lower part of the screen
    // This is key to keeping the camera focused on the player
    const screenX = player.x;
    const screenY = Config.CANVAS_HEIGHT - 150; // Fixed position near bottom of screen
    
    ctx.translate(screenX, screenY);
    ctx.rotate(player.angle);
    
    // Get the kayak image
    const kayakImage = Assets.images[Config.KAYAKS[selectedKayak].image];
    
    if (kayakImage && kayakImage.complete && kayakImage.naturalWidth !== 0) {
        // If we have a valid image, draw it
        const imgWidth = player.width * 2;  // Make the image wider than the hitbox
        const imgHeight = player.height * 1.5;  // Make the image taller than the hitbox
        ctx.drawImage(kayakImage, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
    } else {
        // Fallback to basic rectangle if image fails
        ctx.fillStyle = 'rgb(255, 193, 7)'; // Yellow kayak
        ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
    }
    
    // Draw paddle animation if paddling
    if (keys.left || keys.right) {
        // Get oar images
        const leftOarImage = Assets.images['leftOar1.png'];
        const rightOarImage = Assets.images['rightOar1.png'];
        
        // Size the oars relative to the kayak
        const oarWidth = player.width * 1.2;
        const oarHeight = player.height * 1.2;
        
        if (keys.left && leftOarImage && leftOarImage.complete) {
            // Draw left oar image
            ctx.drawImage(
                leftOarImage, 
                -player.width - oarWidth/2, 
                -oarHeight/2, 
                oarWidth, 
                oarHeight
            );
        } else if (keys.left) {
            // Fallback if image not loaded
            ctx.fillStyle = 'rgb(121, 85, 72)'; // Brown paddle
            ctx.fillRect(-player.width / 2 - 10, -10, 10, 20);
        }
        
        if (keys.right && rightOarImage && rightOarImage.complete) {
            // Draw right oar image
            ctx.drawImage(
                rightOarImage, 
                player.width - oarWidth/2, 
                -oarHeight/2, 
                oarWidth, 
                oarHeight
            );
        } else if (keys.right) {
            // Fallback if image not loaded
            ctx.fillStyle = 'rgb(121, 85, 72)'; // Brown paddle
            ctx.fillRect(player.width / 2, -10, 10, 20);
        }
    }
    
    // Visual indicator for paddle rhythm
    if (paddleRhythm.optimal) {
        ctx.fillStyle = 'rgba(76, 175, 80, 0.3)'; // Green glow
        ctx.beginPath();
        ctx.arc(0, 0, player.width, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
    
    // Draw player name above kayak
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('You', screenX, screenY - player.height);
}

function drawOpponents() {
    const playerFixedY = Config.CANVAS_HEIGHT - 150; // Same fixed Y as the player
    
    opponents.forEach(opponent => {
        ctx.save();
        
        // Position the opponent relative to player's position
        // X is the opponent's actual X
        // Y is the opponent's Y relative to the player, but offset by the fixed player position
        const screenX = opponent.x;
        const screenY = playerFixedY - (player.y - opponent.y);
        
        ctx.translate(screenX, screenY);
        ctx.rotate(opponent.angle);
        
        // Get the kayak image (pick randomly from the available kayaks)
        const kayakType = opponent.aiKayakType || Math.floor(Math.random() * 3) + 1;
        const kayakImage = Assets.images[Config.KAYAKS[kayakType].image];
        
        if (kayakImage && kayakImage.complete && kayakImage.naturalWidth !== 0) {
            // If we have a valid image, draw it
            const imgWidth = opponent.width * 2;  // Make the image wider than the hitbox
            const imgHeight = opponent.height * 1.5;  // Make the image taller than the hitbox
            ctx.drawImage(kayakImage, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
        } else {
            // Fallback to basic rectangle if image fails
            ctx.fillStyle = 'rgb(233, 30, 99)'; // Pink opponent kayak
            ctx.fillRect(-opponent.width / 2, -opponent.height / 2, opponent.width, opponent.height);
        }
        
        // Draw AI oars if paddling recently (based on paddle timer)
        const leftOarImage = Assets.images['leftOar1.png'];
        const rightOarImage = Assets.images['rightOar1.png'];
        const oarWidth = opponent.width * 1.2;
        const oarHeight = opponent.height * 1.2;
        
        // AI alternates paddles based on paddleTimer
        const paddlingSide = opponent.paddleTimer < 10 ? (opponent.paddleTimer % 2 === 0 ? 'left' : 'right') : null;
        
        if (paddlingSide === 'left' && leftOarImage && leftOarImage.complete) {
            // Draw left oar
            ctx.drawImage(
                leftOarImage, 
                -opponent.width - oarWidth/2, 
                -oarHeight/2, 
                oarWidth, 
                oarHeight
            );
        } else if (paddlingSide === 'right' && rightOarImage && rightOarImage.complete) {
            // Draw right oar
            ctx.drawImage(
                rightOarImage, 
                opponent.width - oarWidth/2, 
                -oarHeight/2, 
                oarWidth, 
                oarHeight
            );
        }
        
        ctx.restore();
        
        // Draw opponent name above kayak
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(opponent.name, screenX, screenY - opponent.height);
    });
}

function drawUI() {
    // Draw timer
    const currentTime = player.finished ? 
        raceFinishTimes['player'] : (Date.now() - raceStartTime);
    document.getElementById('timer').textContent = formatTime(currentTime);
    
    // Draw minimap
    drawMinimap();
    
    // Draw paddle rhythm indicator (simplified)
    const rhythmIndicator = paddleRhythm.optimal ? '✓' : '';
    
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(rhythmIndicator, gameCanvas.width - 30, gameCanvas.height - 30);
}

function drawMinimap() {
    const minimap = document.getElementById('minimap');
    if (!minimap) return; // Safety check
    
    try {
        const minimapCtx = minimap.getContext('2d');
        if (!minimapCtx) return;
        
        // Clear minimap
        minimapCtx.clearRect(0, 0, minimap.width, minimap.height);
        
        // Draw river line
        minimapCtx.fillStyle = 'rgb(25, 118, 210)';
        minimapCtx.fillRect(minimap.width / 2 - 5, 0, 10, minimap.height);
        
        // Draw finish line
        const finishY = 10;
        minimapCtx.fillStyle = 'white';
        minimapCtx.fillRect(minimap.width / 2 - 10, finishY, 20, 5);
        
        // Calculate race progress for minimap
        const totalHeight = minimap.height - 20;
        
        // Draw player position (if player exists)
        if (player) {
            const playerY = totalHeight - (player.progress / 100 * totalHeight) + 10;
            minimapCtx.fillStyle = 'rgb(255, 193, 7)';
            minimapCtx.beginPath();
            minimapCtx.arc(minimap.width / 2, playerY, 4, 0, Math.PI * 2);
            minimapCtx.fill();
        }
        
        // Draw opponents
        if (opponents && opponents.length > 0) {
            opponents.forEach(opponent => {
                if (opponent) {
                    const opponentY = totalHeight - (opponent.progress / 100 * totalHeight) + 10;
                    minimapCtx.fillStyle = 'rgb(233, 30, 99)';
                    minimapCtx.beginPath();
                    minimapCtx.arc(minimap.width / 2, opponentY, 3, 0, Math.PI * 2);
                    minimapCtx.fill();
                }
            });
        }
    } catch (error) {
        console.error('Error drawing minimap:', error);
    }
}

// Initialize minimap canvas
function initMinimap() {
    const minimap = document.getElementById('minimap');
    if (!minimap) return; // Safety check in case the element isn't ready
    
    const container = document.getElementById('minimap-container');
    if (!container) return;
    
    // Set default size if container dimensions are 0
    minimap.width = container.clientWidth || 100;
    minimap.height = container.clientHeight || 150;
    
    // Create canvas context if doesn't exist
    if (!minimap.getContext) {
        console.error('Canvas context not available');
        return;
    }
    
    // Initialize with a basic background
    const ctx = minimap.getContext('2d');
    ctx.fillStyle = 'rgb(25, 118, 210)';
    ctx.fillRect(0, 0, minimap.width, minimap.height);
}

// Resize event handler
window.addEventListener('resize', function() {
    initMinimap();
});

// Initialize and run the game
document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
    initMinimap();
});