// Memory Game Implementation - Clean Rebuild
document.addEventListener('DOMContentLoaded', function() {
    console.log("Memory Game module loaded");
    
    // Keep a reference to the original startGame method
    const originalStartGame = gameController.startGame;
    
    // Override the startGame method to handle 'memory' game type
    gameController.startGame = function(gameType) {
        if (gameType === 'memory') {
            console.log("Starting Memory Game");
            initMemoryGame.call(this);
        } else {
            originalStartGame.call(this, gameType);
        }
    };
    
    // The main Memory Game initialization function
    function initMemoryGame() {
        console.log("Initializing Memory Game");
        
        // Game elements
        const memoryContainer = document.getElementById('memory-container');
        const memoryBoard = memoryContainer.querySelector('.memory-board');
        const statusDisplay = document.getElementById('memory-status');
        const timerDisplay = document.getElementById('memory-timer');
        const messageDisplay = document.getElementById('memory-message');
        
        // Make sure the memory container is properly shown
        if (memoryContainer.classList.contains('hidden')) {
            memoryContainer.classList.remove('hidden');
        }
        
        // Game state
        const emojis = ['🍎', '🍌', '🍇', '🍊', '🍋', '🍓', '🍉', '🥥'];
        let cards = [...emojis, ...emojis]; // Double the emojis for pairs
        let flippedCards = [];
        let matchedCount = 0;
        let moveCount = 0;
        let isLocked = false;
        let timer = null;
        let seconds = 0;
        
        // Shuffle array using Fisher-Yates algorithm
        function shuffle(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }
        
        // Create and render the game board
        function createBoard() {
            // Clear the board
            memoryBoard.innerHTML = '';
            
            // Shuffle the cards
            cards = shuffle(cards);
            
            // Create each card
            cards.forEach((emoji, index) => {
                const card = document.createElement('div');
                card.className = 'memory-card';
                card.dataset.cardIndex = index;
                
                const cardInner = document.createElement('div');
                cardInner.className = 'card-inner';
                
                const cardFront = document.createElement('div');
                cardFront.className = 'card-front';
                cardFront.innerHTML = '<i class="fas fa-question"></i>';
                
                const cardBack = document.createElement('div');
                cardBack.className = 'card-back';
                cardBack.textContent = emoji;
                
                cardInner.appendChild(cardFront);
                cardInner.appendChild(cardBack);
                card.appendChild(cardInner);
                
                // Add click event
                card.addEventListener('click', flipCard);
                
                // Add to the board
                memoryBoard.appendChild(card);
            });
            
            // Update status display
            statusDisplay.textContent = `Pairs: 0/${emojis.length}`;
            timerDisplay.textContent = 'Time: 0:00';
            
            // Hide any messages
            hideMessage();
        }
        
        // Handle card flipping
        function flipCard() {
            // Return if game is locked or card is already flipped/matched
            if (isLocked || this.classList.contains('flipped') || this.classList.contains('matched')) {
                return;
            }
            
            // Start timer on first move
            if (moveCount === 0 && !timer) {
                startTimer();
            }
            
            // Add flipped class
            this.classList.add('flipped');
            flippedCards.push(this);
            
            // Play flip sound
            playBeep('move');
            
            // Check for match if we have two flipped cards
            if (flippedCards.length === 2) {
                isLocked = true;
                moveCount++;
                
                const firstIndex = parseInt(flippedCards[0].dataset.cardIndex);
                const secondIndex = parseInt(flippedCards[1].dataset.cardIndex);
                
                // Check if the cards match
                if (cards[firstIndex] === cards[secondIndex]) {
                    // It's a match!
                    setTimeout(() => {
                        flippedCards.forEach(card => {
                            card.classList.add('matched');
                        });
                        flippedCards = [];
                        isLocked = false;
                        matchedCount++;
                        
                        // Update score
                        this.score += 20;
                        this.updateScore(true);
                        
                        // Update status
                        statusDisplay.textContent = `Pairs: ${matchedCount}/${emojis.length}`;
                        
                        // Play match sound
                        playBeep('win');
                        
                        // Check for game completion
                        if (matchedCount === emojis.length) {
                            endGame();
                        }
                    }, 500);
                } else {
                    // Not a match
                    setTimeout(() => {
                        flippedCards.forEach(card => {
                            card.classList.remove('flipped');
                        });
                        flippedCards = [];
                        isLocked = false;
                        
                        // Play mismatch sound
                        playBeep('draw');
                    }, 1000);
                }
            }
        }
        
        // Start the timer
        function startTimer() {
            timer = setInterval(() => {
                seconds++;
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                timerDisplay.textContent = `Time: ${mins}:${secs < 10 ? '0' : ''}${secs}`;
            }, 1000);
        }
        
        // Stop the timer
        function stopTimer() {
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        }
        
        // Show a message
        function showMessage(message, isSuccess = true) {
            messageDisplay.textContent = message;
            messageDisplay.style.backgroundColor = isSuccess ? '#4CAF50' : '#F44336';
            messageDisplay.classList.add('show');
        }
        
        // Hide message
        function hideMessage() {
            messageDisplay.classList.remove('show');
        }
        
        // End the game
        function endGame() {
            stopTimer();
            
            // Calculate final score with time bonus
            const timeBonus = Math.max(0, 300 - seconds);
            const finalScore = this.score + timeBonus;
            
            // Update score with bonus
            this.score = finalScore;
            this.updateScore(true);
            
            // Show completion message
            showMessage(`Completed in ${Math.floor(seconds / 60)}:${seconds % 60 < 10 ? '0' : ''}${seconds % 60} with ${moveCount} moves!`, true);
            
            // Show game over modal with delay
            setTimeout(() => {
                this.endGame(finalScore, `Matched all pairs in ${moveCount} moves and ${Math.floor(seconds / 60)}:${seconds % 60 < 10 ? '0' : ''}${seconds % 60}`);
            }, 1500);
        }
        
        // Reset the game
        function resetGame() {
            // Reset state
            flippedCards = [];
            matchedCount = 0;
            moveCount = 0;
            isLocked = false;
            seconds = 0;
            
            // Stop and reset timer
            stopTimer();
            
            // Reset score
            this.score = 0;
            this.updateScore();
            
            // Create a new board
            createBoard();
        }
        
        // Initialize the board
        createBoard();
        
        // Add restart button functionality
        document.getElementById('restart-game').addEventListener('click', resetGame.bind(this));
        
        // Store game methods for the controller
        this.currentGame = {
            reset: resetGame.bind(this),
            stop: function() {
                stopTimer();
            }
        };
        
        console.log("Memory Game initialization complete");
    }
});

