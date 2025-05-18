/**
 * River Rapids: Bangladesh - Photon Multiplayer Integration
 * Handles multiplayer functionality using Photon Realtime
 */

// Photon connection variables
let photon = null;
let photonRoom = null;
let photonClient = null;
let isConnectedToPhoton = false;
let isRoomHost = false;
let localPlayerData = {
    id: null,
    name: "",
    kayakType: null,
    riverType: null,
    position: { x: 0, y: 0 },
    angle: 0,
    progress: 0,
    finished: false,
    finishTime: 0
};
let remotePlayers = {};

// Initialize Photon connection with App ID
function initializePhoton() {
    console.log("Initializing Photon connection...");
    
    // Check if Photon SDK is available
    if (typeof Photon === 'undefined' || !Photon.LoadBalancing) {
        console.error("Photon SDK not loaded. Using mock multiplayer for testing.");
        setupMockPhoton();
        return false;
    }
    
    try {
        // Initialize the Photon client with the provided App ID
        photonClient = new Photon.LoadBalancing.LoadBalancingClient(
            Photon.ConnectionProtocol.Wss,
            "8c1d58f4-5d17-4fc4-bfda-723938db0252", // Your Photon App ID
            "1.0" // Version
        );
        
        // Set event callbacks
        photonClient.onStateChange = handleStateChange;
        photonClient.onEvent = handlePhotonEvent;
        photonClient.onError = handlePhotonError;
        
        try {
            // Set custom authentication values
            const authValues = new Photon.LoadBalancing.AuthenticationValues();
            authValues.userId = generatePlayerId();
            photonClient.setCustomAuthentication(authValues);
            
            // Connect to Photon Cloud
            photonClient.connectToRegionMaster("us");
        } catch (innerError) {
            console.error("Failed to connect to Photon master:", innerError);
            setupMockPhoton();
            return false;
        }
        
        // Set a timeout for connection (5 seconds)
        setTimeout(() => {
            if (!isConnectedToPhoton) {
                console.warn("Connection to Photon timed out. Using mock multiplayer for testing.");
                setupMockPhoton();
            }
        }, 5000);
        
        return true;
    } catch (error) {
        console.error("Failed to initialize Photon:", error);
        setupMockPhoton();
        return false;
    }
}

// Setup mock Photon for development/testing
function setupMockPhoton() {
    console.log("Setting up mock Photon service for testing");
    
    // Create a mock implementation that simulates Photon functionality
    isConnectedToPhoton = true;
    updateConnectionStatus(true);
    
    // Store the original functions
    const originalCreateRoom = createPhotonRoom;
    const originalJoinRoom = joinPhotonRoom;
    const originalLeaveRoom = leavePhotonRoom;
    const originalSendEvent = sendPhotonEvent;
    const originalSendChat = sendChatMessage;
    const originalStartGame = startMultiplayerGame;
    const originalUpdateRemoteData = updateRemotePlayerData;
    
    // Replace with mock functions
    window.PhotonManager.createPhotonRoom = function(roomName) {
        console.log("Creating mock room:", roomName || generateRoomCode());
        isRoomHost = true;
        localPlayerData.id = 1;
        localPlayerData.name = "Player 1 (You)";
        
        // Generate a room code if not provided
        const code = roomName || generateRoomCode();
        
        // Add some mock players after a short delay
        setTimeout(addMockPlayers, 2000);
        
        return code;
    };
    
    // Mock room joining that always succeeds
    window.PhotonManager.joinPhotonRoom = function(roomName) {
        console.log("Joining mock room:", roomName);
        isRoomHost = false;
        localPlayerData.id = 1;
        localPlayerData.name = "Player 1 (You)";
        
        // Add some mock players after a short delay
        setTimeout(addMockPlayers, 2000);
        
        return true;
    };
    
    // Add mock players to a room
    function addMockPlayers() {
        // Add 1-2 mock players
        remotePlayers = {
            2: {
                id: 2,
                name: "Mock Player 2",
                kayakType: Math.floor(Math.random() * 3) + 1,
                position: { x: 0, y: 0 },
                angle: 0,
                progress: 0,
                finished: false,
                finishTime: 0
            }
        };
        
        // Maybe add a third player
        if (Math.random() > 0.5) {
            remotePlayers[3] = {
                id: 3,
                name: "Mock Player 3",
                kayakType: Math.floor(Math.random() * 3) + 1,
                position: { x: 0, y: 0 },
                angle: 0,
                progress: 0,
                finished: false,
                finishTime: 0
            };
        }
        
        // Update UI with mock players
        updatePlayerListUI();
        
        // Enable Start Game button if we're the host
        if (isRoomHost) {
            const startButton = document.getElementById('start-game-btn');
            if (startButton) {
                startButton.disabled = false;
            }
        }
    }
    
    // Mock player update that simulates AI-like behavior
    window.PhotonManager.updateRemotePlayerData = function() {
        for (const id in remotePlayers) {
            const player = remotePlayers[id];
            
            // Simulate progress for mock players (slightly random)
            if (!player.finished) {
                // Progress slightly slower than human player typically would
                player.progress += 0.05 + Math.random() * 0.1;
                
                // Random angle changes
                player.angle = (Math.random() - 0.5) * 0.3;
                
                // Mark as finished when they reach 100%
                if (player.progress >= 100) {
                    player.progress = 100;
                    player.finished = true;
                    player.finishTime = raceFinishTimes['player'] ? 
                        raceFinishTimes['player'] + (Math.random() * 10000 - 5000) : // Finish close to player
                        Date.now() - raceStartTime; // If player hasn't finished
                    
                    raceFinishTimes[player.name] = player.finishTime;
                }
            }
        }
    };
    
    // Mock message sending functions
    window.PhotonManager.sendChatMessage = function(message) {
        console.log("Mock chat message:", message);
        
        // Display the message in UI
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
            const messageElement = document.createElement('div');
            messageElement.className = 'chat-message';
            messageElement.innerHTML = `<span class="sender">You:</span> ${message}`;
            chatMessages.appendChild(messageElement);
            
            // Add a mock response after a delay
            setTimeout(() => {
                const responseElement = document.createElement('div');
                responseElement.className = 'chat-message';
                
                const responses = [
                    "Ready to race?",
                    "Good luck!",
                    "Let's go!",
                    "I'll beat you this time!",
                    "Nice kayak choice."
                ];
                
                const mockPlayer = Object.values(remotePlayers)[0];
                const mockResponse = responses[Math.floor(Math.random() * responses.length)];
                
                responseElement.innerHTML = `<span class="sender">${mockPlayer.name}:</span> ${mockResponse}`;
                chatMessages.appendChild(responseElement);
                
                // Scroll to the bottom
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 1000 + Math.random() * 2000);
            
            // Scroll to the bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        return true;
    };
    
    // Mock event sending
    window.PhotonManager.sendPhotonEvent = function(eventCode, data) {
        console.log("Mock event sent:", eventCode, data);
        return true;
    };
    
    // Mock leave room
    window.PhotonManager.leavePhotonRoom = function() {
        console.log("Left mock room");
        remotePlayers = {};
        return true;
    };
    
    // Mock start game
    window.PhotonManager.startMultiplayerGame = function() {
        console.log("Starting mock multiplayer game");
        return true;
    };
}

// Generate a unique player ID
function generatePlayerId() {
    return "Player_" + Math.floor(Math.random() * 10000);
}

// Handle Photon client state changes
function handleStateChange(state) {
    console.log("Photon state changed:", state);
    
    switch (state) {
        case Photon.LoadBalancing.LoadBalancingClient.State.ConnectedToMaster:
            console.log("Connected to Photon Master server");
            isConnectedToPhoton = true;
            
            // Update UI to show connected status
            updateConnectionStatus(true);
            
            // Join lobby when connected to master
            photonClient.joinLobby();
            break;
            
        case Photon.LoadBalancing.LoadBalancingClient.State.JoinedLobby:
            console.log("Joined Photon lobby");
            
            // Check if we have pending room actions to take
            if (photonClient._pendingRoomName) {
                console.log("Creating pending room after joining lobby");
                const roomName = photonClient._pendingRoomName;
                photonClient._pendingRoomName = null;
                continueRoomCreation(roomName);
            } else if (photonClient._pendingJoinRoom) {
                console.log("Joining pending room after joining lobby");
                const roomName = photonClient._pendingJoinRoom;
                photonClient._pendingJoinRoom = null;
                continueRoomJoin(roomName);
            }
            break;
            
        case Photon.LoadBalancing.LoadBalancingClient.State.JoinedRoom:
            console.log("Joined room:", photonClient.currentRoom.name);
            
            // Set local player data and update UI
            localPlayerData.id = photonClient.myActor().actorNr;
            localPlayerData.name = "Player " + localPlayerData.id;
            
            // Determine if we're the host (first player or room creator)
            isRoomHost = (localPlayerData.id === 1);
            
            // If we're host, enable the start button after a short delay
            if (isRoomHost) {
                setTimeout(() => {
                    const startButton = document.getElementById('start-game-btn');
                    if (startButton) {
                        startButton.disabled = false;
                    }
                }, 1000);
            }
            
            // Send initial player data
            sendPlayerUpdate();
            break;
            
        case Photon.LoadBalancing.LoadBalancingClient.State.Disconnected:
            console.log("Disconnected from Photon");
            isConnectedToPhoton = false;
            isRoomHost = false;
            
            // Update UI to show disconnected status
            updateConnectionStatus(false);
            
            // Try to reconnect
            setTimeout(() => {
                if (!isConnectedToPhoton) {
                    console.log("Attempting to reconnect to Photon...");
                    try {
                        photonClient.connectToRegionMaster("us");
                    } catch (error) {
                        console.error("Reconnection failed:", error);
                        setupMockPhoton();
                    }
                }
            }, 3000);
            break;
            
        case Photon.LoadBalancing.LoadBalancingClient.State.Error:
            console.error("Photon error state");
            setupMockPhoton();
            break;
    }
}

// Handle incoming Photon events
function handlePhotonEvent(code, content, actorNr) {
    console.log(`Received event ${code} from ${actorNr}:`, content);
    
    switch (code) {
        case PhotonEventCodes.PLAYER_JOINED:
            handlePlayerJoined(content, actorNr);
            break;
            
        case PhotonEventCodes.PLAYER_LEFT:
            handlePlayerLeft(actorNr);
            break;
            
        case PhotonEventCodes.PLAYER_UPDATE:
            handlePlayerUpdate(content, actorNr);
            break;
            
        case PhotonEventCodes.GAME_START:
            handleGameStart(content);
            break;
            
        case PhotonEventCodes.PLAYER_FINISHED:
            handlePlayerFinished(content, actorNr);
            break;
            
        case PhotonEventCodes.CHAT_MESSAGE:
            handleChatMessage(content, actorNr);
            break;
    }
}

// Handle Photon errors
function handlePhotonError(errorCode, errorMsg) {
    console.error(`Photon error ${errorCode}: ${errorMsg}`);
    
    // Show error in UI
    alert(`Multiplayer error: ${errorMsg}`);
}

// Create a new Photon room
function createPhotonRoom(roomName) {
    if (!isConnectedToPhoton) {
        console.error("Cannot create room: Not connected to Photon");
        return setupMockRoom();
    }
    
    try {
        // Generate a random room name if none provided
        if (!roomName) {
            roomName = generateRoomCode();
        }
        
        // Make sure we're connected to master server
        if (photonClient.isInLobby()) {
            console.log("Already in lobby, creating room...");
        } else if (photonClient.isConnectedToMaster()) {
            console.log("Connected to master, joining lobby first...");
            photonClient.joinLobby();
            
            // We'll create the room after joining the lobby via callbacks
            // Store the roomName for later
            photonClient._pendingRoomName = roomName;
            
            // Set a short timeout to proceed anyway
            setTimeout(() => {
                if (!photonClient.isJoinedToRoom() && photonClient._pendingRoomName) {
                    console.log("Creating room after timeout...");
                    const storedName = photonClient._pendingRoomName;
                    photonClient._pendingRoomName = null;
                    continueRoomCreation(storedName);
                }
            }, 1000);
            
            return roomName;
        } else {
            console.warn("Not connected to master, using mock room");
            return setupMockRoom();
        }
        
        return continueRoomCreation(roomName);
    } catch (error) {
        console.error("Failed to create room:", error);
        return setupMockRoom();
    }
}

// Continue room creation after preparation
function continueRoomCreation(roomName) {
    try {
        // Create room options
        const roomOptions = new Photon.LoadBalancing.RoomOptions();
        roomOptions.maxPlayers = 4;
        roomOptions.isVisible = true;
        roomOptions.emptyRoomTtl = 10000;
        roomOptions.playerTtl = 10000;
        roomOptions.customRoomProperties = {
            gameType: "kayakRace",
            appVersion: "1.0"
        };
        
        // Create and join the room - this will be a public room
        photonClient.createRoom(roomName, roomOptions);
        
        console.log(`Created room: ${roomName}`);
        isRoomHost = true;
        
        // Set local player data
        localPlayerData.id = photonClient.myActor().actorNr;
        localPlayerData.name = "Player " + localPlayerData.id;
        
        return roomName;
    } catch (error) {
        console.error("Failed in continueRoomCreation:", error);
        return setupMockRoom();
    }
}

// Create a mock room when real Photon fails
function setupMockRoom() {
    console.log("Setting up mock room as fallback");
    setupMockPhoton();
    const code = generateRoomCode();
    setTimeout(() => {
        updateConnectionStatus(true);
        isRoomHost = true;
        localPlayerData.id = 1;
        addMockPlayers();
    }, 1000);
    return code;
}

// Join an existing Photon room
function joinPhotonRoom(roomName) {
    if (!isConnectedToPhoton) {
        console.error("Cannot join room: Not connected to Photon");
        return setupMockJoin(roomName);
    }
    
    try {
        // Make sure we're connected to master server
        if (photonClient.isInLobby()) {
            console.log("Already in lobby, joining room...");
        } else if (photonClient.isConnectedToMaster()) {
            console.log("Connected to master, joining lobby first...");
            photonClient.joinLobby();
            
            // Store the roomName for joining after we enter the lobby
            photonClient._pendingJoinRoom = roomName;
            
            // Set a short timeout to proceed anyway
            setTimeout(() => {
                if (!photonClient.isJoinedToRoom() && photonClient._pendingJoinRoom) {
                    console.log("Joining room after timeout...");
                    const storedName = photonClient._pendingJoinRoom;
                    photonClient._pendingJoinRoom = null;
                    continueRoomJoin(storedName);
                }
            }, 1000);
            
            return true;
        } else {
            console.warn("Not connected to master, using mock join");
            return setupMockJoin(roomName);
        }
        
        return continueRoomJoin(roomName);
    } catch (error) {
        console.error("Failed to join room:", error);
        return setupMockJoin(roomName);
    }
}

// Continue joining a room after preparation
function continueRoomJoin(roomName) {
    try {
        console.log("Attempting to join room:", roomName);
        
        // First, check if the room exists
        const existingRooms = photonClient.availableRooms();
        let roomExists = false;
        
        if (existingRooms && existingRooms.length > 0) {
            for (const room of existingRooms) {
                if (room.name === roomName) {
                    roomExists = true;
                    break;
                }
            }
        }
        
        if (!roomExists) {
            console.warn(`Room '${roomName}' not found, checking open rooms`);
            
            // Debug available rooms
            if (existingRooms && existingRooms.length > 0) {
                console.log("Available rooms:");
                existingRooms.forEach(room => console.log(` - ${room.name} (${room.playerCount}/${room.maxPlayers})`));
            } else {
                console.log("No available rooms found");
            }
        }
        
        // Attempt to join by name anyway - Photon will search across regions
        photonClient.joinRoom(roomName);
        
        console.log(`Joined room: ${roomName}`);
        isRoomHost = false;
        
        // Set local player data
        localPlayerData.id = photonClient.myActor().actorNr;
        localPlayerData.name = "Player " + localPlayerData.id;
        
        return true;
    } catch (error) {
        console.error("Failed in continueRoomJoin:", error);
        return setupMockJoin(roomName);
    }
}

// Set up a mock room join when real Photon fails
function setupMockJoin(roomName) {
    console.log("Setting up mock room join as fallback for:", roomName);
    setupMockPhoton();
    setTimeout(() => {
        updateConnectionStatus(true);
        isRoomHost = false;
        localPlayerData.id = Math.floor(Math.random() * 3) + 2; // Random ID 2-4
        localPlayerData.name = "Player " + localPlayerData.id;
        addMockPlayers();
    }, 1000);
    return true;
}

// Leave the current Photon room
function leavePhotonRoom() {
    if (photonClient && photonClient.isJoinedToRoom()) {
        photonClient.leaveRoom();
        console.log("Left Photon room");
        
        isRoomHost = false;
        remotePlayers = {};
        
        return true;
    }
    
    return false;
}

// Send a game event to all players in the room
function sendPhotonEvent(eventCode, data) {
    if (!photonClient || !photonClient.isJoinedToRoom()) {
        console.error("Cannot send event: Not in a room");
        return false;
    }
    
    try {
        const raiseOptions = {
            cache: Photon.LoadBalancing.Constants.EventCaching.AddToRoomCache
        };
        
        photonClient.raiseEvent(eventCode, data, raiseOptions);
        return true;
    } catch (error) {
        console.error("Failed to send event:", error);
        return false;
    }
}

// Send a chat message to all players
function sendChatMessage(message) {
    return sendPhotonEvent(PhotonEventCodes.CHAT_MESSAGE, {
        senderId: localPlayerData.id,
        senderName: localPlayerData.name,
        message: message,
        timestamp: Date.now()
    });
}

// Send local player data to other players
function sendPlayerUpdate() {
    return sendPhotonEvent(PhotonEventCodes.PLAYER_UPDATE, {
        id: localPlayerData.id,
        name: localPlayerData.name,
        kayakType: localPlayerData.kayakType,
        riverType: localPlayerData.riverType,
        position: localPlayerData.position,
        angle: localPlayerData.angle,
        progress: localPlayerData.progress,
        finished: localPlayerData.finished,
        finishTime: localPlayerData.finishTime
    });
}

// Start the multiplayer game (host only)
function startMultiplayerGame() {
    if (!isRoomHost) {
        console.error("Only the host can start the game");
        return false;
    }
    
    return sendPhotonEvent(PhotonEventCodes.GAME_START, {
        startTime: Date.now(),
        riverType: localPlayerData.riverType
    });
}

// Handle a player joining the room
function handlePlayerJoined(data, actorNr) {
    console.log(`Player ${actorNr} joined the room`);
    
    // Add player to remotePlayers if it's not the local player
    if (actorNr !== localPlayerData.id) {
        // Create a default player data object
        remotePlayers[actorNr] = {
            id: actorNr,
            name: `Player ${actorNr}`,
            kayakType: Math.floor(Math.random() * 3) + 1, // Random kayak until we get their data
            riverType: selectedRiver,
            position: { x: 0, y: 0 },
            angle: 0,
            progress: 0,
            finished: false,
            finishTime: 0
        };
        
        console.log(`Added remote player: ${actorNr}`, remotePlayers[actorNr]);
        
        // If we have any data for this player, update it
        if (data) {
            if (data.name) remotePlayers[actorNr].name = data.name;
            if (data.kayakType) remotePlayers[actorNr].kayakType = data.kayakType;
            if (data.riverType) remotePlayers[actorNr].riverType = data.riverType;
        }
        
        // Update player list in UI
        updatePlayerListUI();
        
        // Send local player data to the new player
        sendPlayerUpdate();
        
        // Add a welcome message to chat
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
            const messageElement = document.createElement('div');
            messageElement.className = 'chat-message system-message';
            messageElement.innerHTML = `<span class="sender">System:</span> ${remotePlayers[actorNr].name} joined the room`;
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    // Enable Start Game button if we're the host and have at least 2 players
    if (isRoomHost) {
        const totalPlayers = Object.keys(remotePlayers).length + 1; // +1 for local player
        console.log(`Total players: ${totalPlayers}`);
        
        const startButton = document.getElementById('start-game-btn');
        if (startButton && totalPlayers >= 2) {
            startButton.disabled = false;
        }
    }
}

// Handle a player leaving the room
function handlePlayerLeft(actorNr) {
    console.log(`Player ${actorNr} left the room`);
    
    // Remove player from remotePlayers
    if (remotePlayers[actorNr]) {
        // Store the player name before removing
        const playerName = remotePlayers[actorNr].name;
        
        // Remove from our list
        delete remotePlayers[actorNr];
        
        // Update player list in UI
        updatePlayerListUI();
        
        // Add a leave message to chat
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
            const messageElement = document.createElement('div');
            messageElement.className = 'chat-message system-message';
            messageElement.innerHTML = `<span class="sender">System:</span> ${playerName} left the room`;
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    // Disable Start Game button if we're the host and don't have enough players
    if (isRoomHost) {
        const totalPlayers = Object.keys(remotePlayers).length + 1; // +1 for local player
        console.log(`Total players after leave: ${totalPlayers}`);
        
        const startButton = document.getElementById('start-game-btn');
        if (startButton && totalPlayers < 2) {
            startButton.disabled = true;
        }
    }
}

// Handle player data updates
function handlePlayerUpdate(data, actorNr) {
    // Skip if it's our own update
    if (actorNr === localPlayerData.id) return;
    
    console.log(`Received player update from ${actorNr}:`, data);
    
    // Update player data
    if (!remotePlayers[actorNr]) {
        console.log(`Creating new remote player ${actorNr} from update`);
        
        remotePlayers[actorNr] = {
            id: actorNr,
            name: data.name || `Player ${actorNr}`,
            kayakType: data.kayakType || 1,
            riverType: data.riverType,
            position: { x: 0, y: 0 },
            angle: 0,
            progress: 0,
            finished: false,
            finishTime: 0
        };
        
        // Add a join message to chat since we just learned about this player
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
            const messageElement = document.createElement('div');
            messageElement.className = 'chat-message system-message';
            messageElement.innerHTML = `<span class="sender">System:</span> ${remotePlayers[actorNr].name} joined the room`;
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    // Update player properties
    const player = remotePlayers[actorNr];
    if (data.name) player.name = data.name;
    if (data.kayakType !== undefined) player.kayakType = data.kayakType;
    if (data.riverType !== undefined) player.riverType = data.riverType;
    if (data.position) player.position = data.position;
    if (data.angle !== undefined) player.angle = data.angle;
    if (data.progress !== undefined) player.progress = data.progress;
    if (data.finished !== undefined) player.finished = data.finished;
    if (data.finishTime !== undefined) player.finishTime = data.finishTime;
    
    // If the player has finished and we have a global raceFinishTimes object
    if (player.finished && player.finishTime && typeof raceFinishTimes !== 'undefined') {
        raceFinishTimes[player.name] = player.finishTime;
    }
    
    // Update player list in UI if in lobby or any room screen
    if (currentState === GameState.ROOM_LOBBY || 
        currentState === GameState.CREATE_ROOM || 
        document.querySelector('.player-slots')) {
        updatePlayerListUI();
    }
    
    // Enable Start Game button if we're the host and have at least 2 players
    if (isRoomHost) {
        const totalPlayers = Object.keys(remotePlayers).length + 1; // +1 for local player
        console.log(`Total players after update: ${totalPlayers}`);
        
        const startButton = document.getElementById('start-game-btn');
        if (startButton && totalPlayers >= 2) {
            startButton.disabled = false;
        }
    }
}

// Handle game start event
function handleGameStart(data) {
    console.log("Game starting:", data);
    
    // Set river selection based on host's choice
    if (data.riverType) {
        selectedRiver = data.riverType;
    }
    
    // Show gameplay screen and start the game
    showScreen(GameState.GAMEPLAY);
}

// Handle player finished event
function handlePlayerFinished(data, actorNr) {
    console.log(`Player ${actorNr} finished the race in ${data.finishTime}ms`);
    
    // Update player finish data
    if (remotePlayers[actorNr]) {
        remotePlayers[actorNr].finished = true;
        remotePlayers[actorNr].finishTime = data.finishTime;
        
        // Record finish time for results
        raceFinishTimes[remotePlayers[actorNr].name] = data.finishTime;
    }
    
    // Check if all players have finished
    checkAllPlayersFinished();
}

// Handle chat message event
function handleChatMessage(data, actorNr) {
    // Add message to the chat UI
    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        
        let senderName = data.senderName || `Player ${actorNr}`;
        if (actorNr === localPlayerData.id) {
            senderName = "You";
        }
        
        messageElement.innerHTML = `<span class="sender">${senderName}:</span> ${data.message}`;
        chatMessages.appendChild(messageElement);
        
        // Scroll to the bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Check if all players have finished the race
function checkAllPlayersFinished() {
    // Check if local player and all remote players have finished
    if (!localPlayerData.finished) return false;
    
    for (const playerId in remotePlayers) {
        if (!remotePlayers[playerId].finished) return false;
    }
    
    // If all players have finished, end the race
    endRace();
    return true;
}

// Update connection status in UI
function updateConnectionStatus(connected) {
    const connectionIndicator = document.getElementById('connection-status');
    if (connectionIndicator) {
        connectionIndicator.className = connected ? 'connected' : 'disconnected';
        connectionIndicator.textContent = connected ? 'Connected' : 'Disconnected';
    }
}

// Get available rooms from Photon
function getAvailableRooms() {
    if (!photonClient || !isConnectedToPhoton) {
        return [];
    }
    
    try {
        return photonClient.availableRooms() || [];
    } catch (error) {
        console.error("Failed to get available rooms:", error);
        return [];
    }
}

// Update the join screen with public rooms
function updatePublicRoomList() {
    const roomsList = document.querySelector('.public-rooms');
    if (!roomsList) return;
    
    // Get available rooms
    const rooms = getAvailableRooms();
    
    // Clear existing list
    roomsList.innerHTML = '';
    
    if (rooms.length === 0) {
        const noRooms = document.createElement('div');
        noRooms.className = 'no-rooms';
        noRooms.textContent = 'No public rooms available';
        roomsList.appendChild(noRooms);
        return;
    }
    
    // Add each room to the list
    rooms.forEach(room => {
        const roomItem = document.createElement('div');
        roomItem.className = 'room-item';
        roomItem.innerHTML = `
            <div class="room-name">${room.name}</div>
            <div class="room-info">${room.playerCount}/${room.maxPlayers} players</div>
            <button class="join-room-btn secondary-btn" data-room="${room.name}">Join</button>
        `;
        
        // Add event listener for join button
        const joinBtn = roomItem.querySelector('.join-room-btn');
        if (joinBtn) {
            joinBtn.addEventListener('click', () => {
                joinPhotonRoom(room.name);
                document.getElementById('lobby-room-code').textContent = room.name;
                showScreen(GameState.ROOM_LOBBY);
            });
        }
        
        roomsList.appendChild(roomItem);
    });
}

// Update player list in UI
function updatePlayerListUI() {
    // Get player list container
    const playerList = document.querySelector('.player-slots') || 
                      document.querySelector('.player-list');
    
    if (!playerList) return;
    
    // Clear existing list
    playerList.innerHTML = '';
    
    // Add local player
    const localPlayerSlot = document.createElement('div');
    localPlayerSlot.className = 'player-slot';
    
    let localPlayerName = localPlayerData.name;
    if (isRoomHost) {
        localPlayerName += ' (Host)';
    }
    
    localPlayerSlot.innerHTML = `
        <div class="player-name">${localPlayerName}</div>
        <div class="player-kayak kayak-${localPlayerData.kayakType || 1}"></div>
    `;
    
    playerList.appendChild(localPlayerSlot);
    
    // Add remote players
    for (const playerId in remotePlayers) {
        const player = remotePlayers[playerId];
        
        const playerSlot = document.createElement('div');
        playerSlot.className = 'player-slot';
        
        playerSlot.innerHTML = `
            <div class="player-name">${player.name}</div>
            <div class="player-kayak kayak-${player.kayakType || 1}"></div>
        `;
        
        playerList.appendChild(playerSlot);
    }
    
    // Add empty slots if needed
    const maxPlayers = 4;
    const currentPlayers = 1 + Object.keys(remotePlayers).length;
    
    for (let i = currentPlayers; i < maxPlayers; i++) {
        const emptySlot = document.createElement('div');
        emptySlot.className = 'player-slot waiting';
        emptySlot.innerHTML = '<div class="player-name">Waiting...</div>';
        
        playerList.appendChild(emptySlot);
    }
}

// Convert remote players to game opponents
function convertRemotePlayersToOpponents() {
    // Create a new opponents array - don't affect the global one directly
    let newOpponents = [];
    
    // Used lanes to avoid duplicates
    let usedLanes = [player ? player.lane : 2]; // Default player lane is 2
    
    for (const playerId in remotePlayers) {
        const remotePlayer = remotePlayers[playerId];
        
        // Create an opponent object from remote player data
        const kayakType = remotePlayer.kayakType || 1;
        const kayakConfig = Config.KAYAKS[kayakType];
        
        // Find an available lane
        let opponentLane;
        do {
            opponentLane = Math.floor(Math.random() * 4) + 1;
        } while (usedLanes.includes(opponentLane));
        
        // Mark lane as used
        usedLanes.push(opponentLane);
        
        newOpponents.push({
            id: remotePlayer.id,
            x: (opponentLane - 0.5) * (Config.CANVAS_WIDTH / 4),
            y: Config.CANVAS_HEIGHT - 100,
            width: 30,
            height: 60,
            speed: 0,
            maxSpeed: 5 * kayakConfig.speed,
            angle: 0,
            turnRate: Config.TURN_RATE * kayakConfig.maneuverability,
            paddleStrength: Config.PADDLE_POWER * kayakConfig.speed,
            durability: kayakConfig.durability,
            lane: opponentLane,
            progress: 0,
            finished: false,
            aiKayakType: kayakType,
            name: remotePlayer.name,
            isRemotePlayer: true
        });
    }
    
    return newOpponents;
}

// Update remote player data in game
function updateRemotePlayerData() {
    // Return early if we're not in a multiplayer game
    if (!isMultiplayer || !photonClient || !photonClient.isJoinedToRoom()) return;
    
    // Update local player data
    localPlayerData.position = { x: player.x, y: player.y };
    localPlayerData.angle = player.angle;
    localPlayerData.progress = player.progress;
    localPlayerData.finished = player.finished;
    
    if (player.finished && localPlayerData.finishTime === 0) {
        localPlayerData.finishTime = raceFinishTimes['player'];
        
        // Broadcast finish time to other players
        sendPhotonEvent(PhotonEventCodes.PLAYER_FINISHED, {
            finishTime: localPlayerData.finishTime
        });
    }
    
    // Send updated data to other players (throttled to reduce network traffic)
    if (Date.now() % 3 === 0) { // Only send every 3rd frame approximately
        sendPlayerUpdate();
    }
    
    // Update opponent positions from remote player data
    opponents.forEach(opponent => {
        if (opponent.isRemotePlayer && remotePlayers[opponent.id]) {
            const remoteData = remotePlayers[opponent.id];
            
            // Only update remote positions if we have received data
            if (remoteData.position && remoteData.position.x !== 0) {
                // Calculate screen position based on player's view
                const dx = remoteData.position.x - opponent.x;
                opponent.x += dx * 0.1; // Smooth interpolation
                
                // Progress affects y-position indirectly
                opponent.progress = remoteData.progress;
                opponent.angle = remoteData.angle;
                opponent.finished = remoteData.finished;
            }
        }
    });
}

// Photon event codes for custom game events
const PhotonEventCodes = {
    PLAYER_JOINED: 1,
    PLAYER_LEFT: 2,
    PLAYER_UPDATE: 3,
    GAME_START: 4,
    PLAYER_FINISHED: 5,
    CHAT_MESSAGE: 6
};

// Export functions and variables
window.PhotonManager = {
    initializePhoton,
    createPhotonRoom,
    joinPhotonRoom,
    leavePhotonRoom,
    sendChatMessage,
    startMultiplayerGame,
    updateRemotePlayerData,
    convertRemotePlayersToOpponents,
    sendPhotonEvent,
    sendPlayerUpdate,
    updatePublicRoomList,
    getAvailableRooms,
    isConnectedToPhoton: () => isConnectedToPhoton,
    isRoomHost: () => isRoomHost,
    localPlayerData: localPlayerData,
    PhotonEventCodes
};

// Initialize the mock directly if Photon isn't available
if (typeof Photon === 'undefined' || !Photon.LoadBalancing) {
    console.log("Photon SDK not available at load time, setting up mock automatically");
    setTimeout(setupMockPhoton, 500);
}