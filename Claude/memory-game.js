// Memory Game - Streamlined Version
document.addEventListener('DOMContentLoaded', function() {
    console.log("Memory Game loaded");
    
    // Get the memory game card in the game selection grid
    const memoryGameCard = document.querySelector('.game-card[data-game="memory"]');
    if (memoryGameCard) {
        memoryGameCard.addEventListener('click', initializeMemoryGame);
    }
    
    // Main initialization function
    function initializeMemoryGame() {
        console.log("Initializing Memory Game");
        
        // Show game area and hide other game containers
        const gameArea = document.getElementById('game-area');
        if (gameArea) {
            gameArea.classList.remove('hidden');
            
            // Hide all other game containers
            document.querySelectorAll('.game-container').forEach(container => {
                container.classList.add('hidden');
            });
        }
        
        // Get memory container
        const memoryContainer = document.getElementById('memory-container');
        if (!memoryContainer) {
            console.error("Memory container not found!");
            return;
        }
        
        // Show memory container
        memoryContainer.classList.remove('hidden');
        
        // Set game title in the main game header
        const titleElement = document.getElementById('current-game-title');
        if (titleElement) {
            titleElement.textContent = 'Memory Game';
        }
        
        // Start the game
        const memoryGame = new MemoryGame(memoryContainer);
        memoryGame.start();
        
        // Store reference for game controller
        if (typeof gameController !== 'undefined') {
            gameController.currentGame = memoryGame;
        }
    }
    
    // Memory Game Class
    class MemoryGame {
        constructor(container) {
            // DOM elements
            this.container = container;
            this.board = container.querySelector('.memory-board');
            this.pairsDisplay = container.querySelector('#memory-pairs');
            this.timerDisplay = container.querySelector('#memory-timer');
            this.scoreDisplay = document.getElementById('game-score');
            this.messageDisplay = container.querySelector('#memory-message');
            
            // Game configuration with diverse symbols
            this.difficulties = {
                easy: { 
                    rows: 4, 
                    cols: 4, 
                    symbols: ['🚀', '💻', '🎸', '📱', '🎮', '🎧', '📷', '🏆']
                },
                medium: { 
                    rows: 4, 
                    cols: 5, 
                    symbols: ['🚀', '💻', '🎸', '📱', '🎮', '🎧', '📷', '🏆', '🔔', '⚡️']
                },
                hard: { 
                    rows: 5, 
                    cols: 6, 
                    symbols: ['🚀', '💻', '🎸', '📱', '🎮', '🎧', '📷', '🏆', '🔔', '⚡️', '🎯', '🎨', '🎬', '💎', '📚']
                }
            };
            
            // Sound effects with the requested MyInstants error sound
            this.sounds = {
                flip: new Audio('https://assets.mixkit.co/active_storage/sfx/2073/2073-preview.mp3'),
                match: new Audio('https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3'),
                
                // Using the error notification sound from MyInstants
                error: new Audio('https://www.myinstants.com/media/sounds/error-notification.mp3'),
                
                win: new Audio('https://assets.mixkit.co/active_storage/sfx/1993/1993-preview.mp3')
            };
            
            // Preload sounds
            for (const sound in this.sounds) {
                this.sounds[sound].load();
            }
            
            // Game state
            this.cards = [];
            this.currentDifficulty = 'easy';
            this.flippedCards = [];
            this.matchedPairs = 0;
            this.totalPairs = 0;
            this.moves = 0;
            this.seconds = 0;
            this.timer = null;
            this.isPaused = false;
            this.isGameOver = false;
            this.isMuted = false;
            
            // Bind methods
            this.handleCardClick = this.handleCardClick.bind(this);
            
            // Set up event listeners
            this.setupEventListeners();
        }
        
        setupEventListeners() {
            // Set up difficulty buttons
            const difficultyButtons = this.container.querySelectorAll('.difficulty-btn');
            difficultyButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.changeDifficulty(btn.dataset.level);
                });
            });
            
            // Set up new game button
            const newGameBtn = this.container.querySelector('#memory-new-game');
            if (newGameBtn) {
                newGameBtn.addEventListener('click', () => this.resetGame());
            }
            
            // Set up pause button
            const pauseBtn = this.container.querySelector('#memory-pause');
            if (pauseBtn) {
                pauseBtn.addEventListener('click', () => this.togglePause());
            }
            
            // Reset button (from game controller)
            const resetBtn = document.getElementById('restart-game');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => this.resetGame());
            }
            
            // Set up sound toggle button
            const soundBtn = this.container.querySelector('#memory-sound-toggle');
            if (soundBtn) {
                soundBtn.addEventListener('click', () => {
                    this.toggleSound();
                });
            }
        }
        
        start() {
            this.createBoard();
            this.startTimer();
        }
        
        createBoard() {
            // Clear previous board
            if (this.board) {
                this.board.innerHTML = '';
            }
            
            // Get difficulty settings
            const config = this.difficulties[this.currentDifficulty];
            if (!config) return;
            
            // Apply grid template based on difficulty
            this.board.style.gridTemplateColumns = `repeat(${config.cols}, 1fr)`;
            
            // Create pairs of cards
            this.cards = [];
            this.flippedCards = [];
            this.matchedPairs = 0;
            this.moves = 0;
            this.seconds = 0;
            
            // Determine number of pairs based on difficulty
            this.totalPairs = Math.floor(config.rows * config.cols / 2);
            
            // Create array of symbols for cards
            const symbols = [...config.symbols].slice(0, this.totalPairs);
            const cardSymbols = [...symbols, ...symbols];
            
            // Shuffle the symbols
            this.shuffle(cardSymbols);
            
            // Add debug info
            console.log("Creating board with", cardSymbols.length, "cards");
            console.log("Difficulty:", this.currentDifficulty);
            console.log("Grid template:", `repeat(${config.cols}, 1fr)`);
            
            // Create cards
            for (let i = 0; i < cardSymbols.length; i++) {
                const card = document.createElement('div');
                card.className = 'memory-card';
                card.dataset.cardId = i;
                card.dataset.value = cardSymbols[i];
                
                // Create card inner elements with fixed structure
                card.innerHTML = `
                    <div class="card-inner">
                        <div class="card-front">
                            <div class="question-mark">?</div>
                        </div>
                        <div class="card-back">
                            ${cardSymbols[i]}
                        </div>
                    </div>
                `;
                
                // Add click handler
                card.addEventListener('click', this.handleCardClick);
                
                // Add to board
                this.board.appendChild(card);
                
                // Add to cards array
                this.cards.push({
                    element: card,
                    value: cardSymbols[i],
                    isFlipped: false,
                    isMatched: false
                });
            }
            
            // Update pairs and timer displays
            this.updatePairsDisplay();
            
            // Extra debug to see if board is populated
            console.log("Board children:", this.board.children.length);
        }
        
        handleCardClick(event) {
            // Check if game is paused or over
            if (this.isPaused || this.isGameOver) return;
            
            // Get the card element (could be child element clicked)
            let cardElement = event.target;
            while (!cardElement.classList.contains('memory-card') && cardElement !== this.board) {
                cardElement = cardElement.parentElement;
            }
            
            // Handle case where we didn't find a card
            if (!cardElement.classList.contains('memory-card')) return;
            
            // Get card ID
            const cardId = parseInt(cardElement.dataset.cardId);
            const card = this.cards[cardId];
            
            // Skip if already flipped or matched
            if (card.isFlipped || card.isMatched) return;
            
            // Skip if two cards already flipped
            if (this.flippedCards.length >= 2) return;
            
            // Play flip sound consistently for all card flips
            this.playSound('flip');
            
            // Flip the card
            this.flipCard(card);
            
            // Add to flipped cards
            this.flippedCards.push(card);
            
            // Check for match if two cards flipped
            if (this.flippedCards.length === 2) {
                this.moves++;
                // Delay the match check slightly to allow the flip animation to complete
                setTimeout(() => {
                    this.checkForMatch();
                }, 300);
            }
        }
        
        flipCard(card) {
            card.isFlipped = true;
            card.element.classList.add('flipped');
            // Sound is now played in handleCardClick
        }
        
        unflipCard(card) {
            card.isFlipped = false;
            card.element.classList.remove('flipped');
        }
        
        checkForMatch() {
            const [firstCard, secondCard] = this.flippedCards;
            
            // Check if values match
            if (firstCard.value === secondCard.value) {
                // Mark as matched
                this.handleMatch(firstCard, secondCard);
                
                // Play match sound
                this.playSound('match');
            } else {
                // Play error sound immediately
                this.playSound('error');
                
                // Unflip after delay
                setTimeout(() => {
                    this.handleMismatch(firstCard, secondCard);
                }, 800);
            }
        }
        
        handleMatch(firstCard, secondCard) {
            // Mark cards as matched
            firstCard.isMatched = true;
            secondCard.isMatched = true;
            
            // Add matched class
            firstCard.element.classList.add('matched');
            secondCard.element.classList.add('matched');
            
            // Increase matched pairs
            this.matchedPairs++;
            
            // Update pairs display
            this.updatePairsDisplay();
            
            // Update score
            this.updateScore(10);
            
            // Reset flipped cards
            this.flippedCards = [];
            
            // Check if game over
            if (this.matchedPairs === this.totalPairs) {
                this.handleGameOver();
            }
        }
        
        handleMismatch(firstCard, secondCard) {
            // Add shake animation
            firstCard.element.classList.add('shake');
            secondCard.element.classList.add('shake');
            
            // Remove shake after animation completes - decreased from 800ms to 500ms
            setTimeout(() => {
                firstCard.element.classList.remove('shake');
                secondCard.element.classList.remove('shake');
                
                // Unflip cards
                this.unflipCard(firstCard);
                this.unflipCard(secondCard);
                
                // Reset flipped cards
                this.flippedCards = [];
            }, 500);
        }
        
        updatePairsDisplay() {
            if (this.pairsDisplay) {
                this.pairsDisplay.textContent = `Pairs: ${this.matchedPairs}/${this.totalPairs}`;
            }
        }
        
        updateScore(points) {
            if (typeof gameController !== 'undefined' && gameController.updateScore) {
                gameController.score += points;
                gameController.updateScore();
            }
        }
        
        handleGameOver() {
            this.isGameOver = true;
            this.stopTimer();
            
            // Play win sound
            this.playSound('win');
            
            // Show success message
            this.showMessage(`Congratulations! You won in ${this.moves} moves and ${this.formatTime(this.seconds)}!`, true);
            
            // Show game over modal
            if (typeof gameController !== 'undefined' && gameController.showModal) {
                gameController.showModal(
                    'Memory Game Complete!',
                    `You found all pairs in ${this.moves} moves and ${this.formatTime(this.seconds)}!`
                );
            }
        }
        
        toggleSound() {
            this.isMuted = !this.isMuted;
            
            // Update button appearance
            const soundBtn = this.container.querySelector('#memory-sound-toggle');
            if (soundBtn) {
                soundBtn.classList.toggle('muted', this.isMuted);
            }
        }
        
        formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }
        
        startTimer() {
            // Stop any existing timer
            this.stopTimer();
            
            // Reset seconds
            this.seconds = 0;
            
            // Update timer display
            if (this.timerDisplay) {
                this.timerDisplay.textContent = `Time: 0:00`;
            }
            
            // Start new timer
            this.timer = setInterval(() => {
                if (!this.isPaused) {
                    this.seconds++;
                    
                    if (this.timerDisplay) {
                        this.timerDisplay.textContent = `Time: ${this.formatTime(this.seconds)}`;
                    }
                }
            }, 1000);
        }
        
        stopTimer() {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
        }
        
        showMessage(message, isSuccess = true) {
            if (this.messageDisplay) {
                this.messageDisplay.textContent = message;
                
                if (message) {
                    this.messageDisplay.className = 'memory-message show ' + (isSuccess ? 'success' : 'error');
                } else {
                    this.messageDisplay.className = 'memory-message';
                }
            }
        }
        
        togglePause() {
            this.isPaused = !this.isPaused;
            
            // Update pause button text
            const pauseBtn = this.container.querySelector('#memory-pause');
            if (pauseBtn) {
                pauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
            }
            
            // If paused, show message and blur cards
            if (this.isPaused) {
                this.showMessage('Game Paused', true);
                
                const cards = this.board.querySelectorAll('.memory-card:not(.matched)');
                cards.forEach(card => {
                    card.style.filter = 'blur(5px)';
                });
            } else {
                // Hide message and unblur cards
                this.showMessage('', true);
                
                const cards = this.board.querySelectorAll('.memory-card');
                cards.forEach(card => {
                    card.style.filter = 'none';
                });
            }
        }
        
        changeDifficulty(difficulty) {
            if (this.difficulties[difficulty]) {
                // Update active button
                const buttons = this.container.querySelectorAll('.difficulty-btn');
                buttons.forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.level === difficulty);
                });
                
                this.currentDifficulty = difficulty;
                this.resetGame();
            }
        }
        
        resetGame() {
            // Stop timer
            this.stopTimer();
            
            // Reset pause state
            this.isPaused = false;
            this.isGameOver = false;
            
            // Update pause button
            const pauseBtn = this.container.querySelector('#memory-pause');
            if (pauseBtn) {
                pauseBtn.textContent = 'Pause';
            }
            
            // Clear message
            this.showMessage('');
            
            // Create new board
            this.createBoard();
            
            // Start timer
            this.startTimer();
        }
        
        shuffle(array) {
            let currentIndex = array.length;
            let temporaryValue, randomIndex;
            
            while (currentIndex !== 0) {
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex -= 1;
                
                temporaryValue = array[currentIndex];
                array[currentIndex] = array[randomIndex];
                array[randomIndex] = temporaryValue;
            }
            
            return array;
        }
        
        playSound(soundName) {
            // Check if sound exists and browser supports Audio
            if (this.sounds[soundName] && !this.isMuted) {
                console.log(`Playing sound: ${soundName}`);
                
                // Reset the audio to the beginning if it's already playing
                this.sounds[soundName].currentTime = 0;
                
                // Play with better error handling
                const playPromise = this.sounds[soundName].play();
                
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log(`Error playing ${soundName} sound:`, error);
                    });
                }
            }
        }
    }
});