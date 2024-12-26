const gameSize = 5; // Changeable grid size
const tilesDiv = document.getElementById("tiles");
const cursor = document.getElementById("cursor");
let tilesArray = [];
let cursorPos = {
    x: Math.floor(gameSize / 2) - (gameSize % 2 === 0 ? 1 : 0),
    y: Math.floor(gameSize / 2) - (gameSize % 2 === 0 ? 1 : 0)
};


function setUp() {
    const tileSize = 80 / gameSize; // Relative size for tiles
    tilesDiv.style.gridTemplateColumns = `repeat(${gameSize}, ${tileSize}vmin)`;
    tilesDiv.style.gridTemplateRows = `repeat(${gameSize}, ${tileSize}vmin)`;

    // Create tiles...
    for (let x = 0; x < gameSize; x++) {
        tilesArray.push([]);
        for (let y = 0; y < gameSize; y++) {
            const tile = document.createElement("div");
            tile.className = "tile";
            tile.dataset.x = x;
            tile.dataset.y = y;

            // Randomize initial color
            tile.style.backgroundColor = Math.random() > 0.5 ? "black" : "white";
            tile.style.width = `${tileSize}vmin`;
            tile.style.height = `${tileSize}vmin`;

            tilesArray[x].push(tile);
            tilesDiv.appendChild(tile);

        }
    }

    // Set cursor size and initial position
    const tileAndGapSize = tileSize + 1; // tile size plus 1vmin gap
    const cursorSize = tileSize + 2; // Slightly larger than tiles
    cursor.style.width = `${cursorSize}vmin`;
    cursor.style.height = `${cursorSize}vmin`;

    // Set initial cursor position to match cursorPos
    cursor.style.transform = `translate(${
        cursorPos.y * tileAndGapSize
    }vmin, ${
        cursorPos.x * tileAndGapSize
    }vmin)`;
}

function moveCursor(x, y, shouldFlip = true) {
    if (x >= 0 && x < gameSize && y >= 0 && y < gameSize) {
        cursorPos.x = x;
        cursorPos.y = y;

        const tileAndGapSize = (80 / gameSize + 1);
        cursor.style.transform = `translate(${
            y * tileAndGapSize
        }vmin, ${
            x * tileAndGapSize
        }vmin)`;

        if (shouldFlip) {
            flipTileColor(x, y);
        }

        if (checkWinCondition()) {
            showWinMessage();
        }
    }
}

function flipTileColor(x, y) {
    const tile = tilesArray[x][y];
    tile.style.backgroundColor = tile.style.backgroundColor === "black" ? "white" : "black";

    // Trigger scaling animation
    tile.classList.add("scaling");
    setTimeout(() => tile.classList.remove("scaling"), 200);
}

function checkWinCondition() {
    const firstColor = tilesArray[0][0].style.backgroundColor;
    return tilesArray.flat().every(tile => tile.style.backgroundColor === firstColor);
}

function showWinMessage() {
    const message = document.createElement("div");
    message.className = "message";
    message.innerText = "You Win!";
    document.body.appendChild(message);

    // Disable further input
    document.removeEventListener("keydown", handleKeyPress);
}

function handleKeyPress(event) {
    let {x, y} = cursorPos;

    if (event.key === "ArrowUp") 
        x --;
     else if (event.key === "ArrowDown") 
        x ++;
     else if (event.key === "ArrowLeft") 
        y --;
     else if (event.key === "ArrowRight") 
        y ++;
    


    moveCursor(x, y);
}

// Prevent arrow keys from scrolling the page
window.addEventListener("keydown", e => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
    }
});

// Set up the game
setUp();

// Add event listener for keypress
document.addEventListener("keydown", handleKeyPress);
