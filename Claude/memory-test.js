// Test script to verify the memory game functionality
console.log("Memory test script running");

// Force the memory game to start after 2 seconds
setTimeout(() => {
    console.log("Testing memory game start");
    if (gameController && typeof gameController.startGame === 'function') {
        gameController.startGame('memory');
    } else {
        console.error("gameController not found or startGame is not a function");
    }
}, 2000); 