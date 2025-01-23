class SeededRandom {
    constructor(seed = Math.floor(Math.random() * 1000000)) {
        this.seed = seed;
    }

    next() {
        let result = this.seed;
        result ^= result << 13;
        result ^= result >> 17;
        result ^= result << 5;
        this.seed = result;
        return (result >>> 0) / 4294967296;
    }
}

class TileFlipGame {
    constructor(gridSize = 5) {
        this.GRID_SIZES = [3, 4, 5, 6, 7, 9, 11, 13, 15, 20, 50];
        this.TARGET_GRID_SIZE = window.innerHeight / 1.8; // Target size for all grids
        this.BASE_CURSOR_BORDER = 3; // Fixed cursor border width

        this.gridSize = gridSize;
        this.customSize;
        this.gameContainer = document.getElementById('game');
        this.cursor = document.getElementById('cursor');
        this.winMessage = document.getElementById('winMessage');
        this.winTimer = document.getElementById('win-time')
        this.nextButton = document.getElementById('next-button');
        this.retryButton = document.getElementById('retry-button');
        this.stopwatch = document.getElementById('stopwatch');
        this.bestTimeDisplay = document.getElementById('bestTime');
        this.sizeSelector = document.getElementById('sizeSelector');

        this.cursorPosition = { x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) };
        this.gameWon = false;
        this.gameStarted = false;
        this.timer = null;
        this.elapsedTime = 0;
        this.currentSeed = Math.floor(Math.random() * 1000000);
        this.rng = new SeededRandom(this.currentSeed);

        this.initializeSizeSelector();
        this.initializeWinButtons();
        this.initializeGame();
        this.setupEventListeners();
        this.updateBestTimeDisplay();

        window.addEventListener("resize", () => this.resizeWindow());
    }

    resizeWindow() {
        this.TARGET_GRID_SIZE = window.innerHeight / 2;
        this.updateStyles();
    }

    calculateScaling() {
        // Calculate tile size to make grid fill target size
        const gap = Math.max(2, Math.floor(this.TARGET_GRID_SIZE / this.gridSize / 20)); // Dynamic gap size
        const availableSpace = this.TARGET_GRID_SIZE - (gap * (this.gridSize - 1));
        const tileSize = Math.floor(availableSpace / this.gridSize);

        // Calculate border radius based on tile size
        const borderRadius = Math.max(2, Math.floor(tileSize / 12));

        return {
            tileSize,
            gap,
            borderRadius,
            cursorBorder: this.BASE_CURSOR_BORDER // Keep cursor border consistent
        };
    }

    updateStyles() {
        const { tileSize, gap, borderRadius, cursorBorder } = this.calculateScaling();

        // Update CSS custom properties
        document.documentElement.style.setProperty('--tile-size', `${tileSize}px`);
        document.documentElement.style.setProperty('--gap-size', `${gap}px`);

        // Update tile and cursor border radius, keeping cursor border width fixed
        const tileStyle = document.createElement('style');
        tileStyle.textContent = `
          .tile, .cursor {
            border-radius: ${borderRadius}px;
          }
          .cursor {
            border-width: ${cursorBorder}px;
          }
        `;

        // Remove any previous dynamic styles
        const oldStyle = document.getElementById('dynamic-game-styles');
        if (oldStyle) {
            oldStyle.remove();
        }

        tileStyle.id = 'dynamic-game-styles';
        document.head.appendChild(tileStyle);
    }
    // In your TileFlipGame class, update the initializeSizeSelector method:
    initializeSizeSelector() {
        // Clear existing buttons first
        this.sizeSelector.innerHTML = '';

        this.GRID_SIZES.forEach(size => {
            
            const button = document.createElement('button');
            button.textContent = `${size}x${size}`; // Using × instead of x
            button.classList.add('size-btn');
            if (size === this.gridSize) {
                button.classList.add('active');
            }
            
            // Add click event listener
            button.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent any default button behavior
                if (size !== this.gridSize) {
                    this.changeGridSize(size);

                    // Update active state of all buttons
                    this.sizeSelector.querySelectorAll('.size-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    button.classList.add('active');
                }
            });

            this.sizeSelector.appendChild(button);

        });

        const customSizeButton = document.createElement('button')
        customSizeButton.textContent = "?x?"; // Using × instead of x
        customSizeButton.classList.add('size-btn');
        if (!this.GRID_SIZES.includes(this.gridSize)) {
            customSizeButton.classList.add('active');
        }
            
        // Add click event listener
        customSizeButton.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent any default button behavior

            let newSize;
            let valid = false;

            while(!valid) {
                newSize = prompt("Size?")

                if(!newSize) {
                    if(this.customSize) {
                        newSize = this.customSize;
                    }
                    newSize = 5;
                    break;
                }

                if(Number(newSize)) {
                    if (!(Number(newSize > 100)) && !(Number(newSize) < 2)) {
                        this.customSize = newSize;
                        valid = true;
                    }
                    if (Number(newSize) > 100 && !(Number(newSize) > 300) && !(Number(newSize) < 2) ) {
                        if(confirm("This is a very large size! Are you sure you want to continue?")) {
                            this.customSize = newSize;
                            valid = true;
                        }
                    } else if (Number(newSize) > 300) {
                        alert("Needs to be 300 or less")
                    } else if (Number(newSize) < 2) {
                        alert("Needs to be greater than 1")
                    }
                } else {
                    alert("Invalid input: " + newSize)
                }
            }

            this.changeGridSize(newSize);
            customSizeButton.textContent = `${newSize}x${newSize}`
            // Update active state of all buttons
            this.sizeSelector.querySelectorAll('.size-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            customSizeButton.classList.add('active');
        });

        this.sizeSelector.appendChild(customSizeButton);
    }

    initializeWinButtons() {
        this.nextButton.addEventListener('click', () => {
            this.reset(true);
        });
        this.retryButton.addEventListener('click', () => {
            this.reset(false);
        });
    }

    updateSizeSelector() {
        const buttons = this.sizeSelector.querySelectorAll('.size-btn');
        buttons.forEach(btn => {
            const size = parseInt(btn.textContent);
            btn.classList.toggle('active', size === this.gridSize);
        });
    }

    formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const milliseconds = (ms % 1000) / 10;
        const seconds = totalSeconds % 60;
        const minutes = Math.floor(totalSeconds / 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(Math.floor(milliseconds)).padStart(2, '0')}`;
    }

    getBestTime() {
        const bestTimes = JSON.parse(localStorage.getItem('tileFlipBestTimes') || '{}');
        return bestTimes[this.gridSize] !== undefined ? bestTimes[this.gridSize] : null;
    }

    setBestTime(time) {
        const bestTimes = JSON.parse(localStorage.getItem('tileFlipBestTimes') || '{}');
        const currentBest = bestTimes[this.gridSize];

        // Ensure 0ms is handled correctly as a valid best time
        if (currentBest == null || time < currentBest) {
            bestTimes[this.gridSize] = time;
            localStorage.setItem('tileFlipBestTimes', JSON.stringify(bestTimes));
            this.updateBestTimeDisplay();
        }
    }


    clearAllBestTimes() {
        localStorage.removeItem('tileFlipBestTimes');
        this.updateBestTimeDisplay();
    }

    updateBestTimeDisplay() {
        const bestTime = this.getBestTime();
        this.bestTimeDisplay.textContent = bestTime !== null ? this.formatTime(bestTime) : '--:--:--';
    }

    initializeGame() {
        this.createGrid();
        this.updateCursor();
    }

    createGrid() {
        this.updateStyles();

        this.gameContainer.style.gridTemplateColumns = `repeat(${this.gridSize}, var(--tile-size))`;
        this.gameContainer.style.gridTemplateRows = `repeat(${this.gridSize}, var(--tile-size))`;

        this.rng = new SeededRandom(this.currentSeed);

        this.gameContainer.innerHTML = Array(this.gridSize * this.gridSize)
            .fill('')
            .map(() => `<div class="tile ${this.rng.next() > 0.5 ? 'black' : ''}"></div>`)
            .join('');
    }

    updateStopwatchDisplay() {
        this.stopwatch.textContent = this.formatTime(this.elapsedTime);
    }

    startStopwatch() {
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.timer = setInterval(() => {
                this.elapsedTime += 10;
                this.updateStopwatchDisplay();
            }, 10);
        }
    }

    stopStopwatch() {
        clearInterval(this.timer);
        this.timer = null;
    }

    resetStopwatch() {
        this.stopStopwatch();
        this.elapsedTime = 0;
        this.updateStopwatchDisplay();
    }

    flipTile(x, y) {
        const index = y * this.gridSize + x;
        const tile = this.gameContainer.children[index];

        tile.classList.toggle('black');

        tile.style.transform = 'scale(1.2)';
        tile.style.transition = 'none';

        requestAnimationFrame(() => {
            tile.style.transition = 'transform 0.3s ease';
            tile.style.transform = 'scale(1)';
        });

        this.checkWinCondition();
    }

    checkWinCondition() {
        const tiles = Array.from(this.gameContainer.children);
        const firstTileColor = tiles[0].classList.contains('black');

        if (tiles.every(tile => tile.classList.contains('black') === firstTileColor)) {
            this.onWin()
        }
    }

    onWin() {
        this.gameWon = true;
        this.winMessage.classList.add('show');
        this.stopStopwatch();
        this.setBestTime(this.elapsedTime);
        this.winTimer.innerHTML = this.formatTime(this.elapsedTime);
    }

    updateCursor() {
        const { tileSize, gap } = this.calculateScaling();
        const offset = (this.gridSize - 1) / 2;
        const totalTileSize = tileSize + gap;

        this.cursor.style.transform = `translate(${(this.cursorPosition.x - offset) * totalTileSize}px, ${(this.cursorPosition.y - offset) * totalTileSize}px)`;
    }

    moveCursor(dx, dy) {
        if (this.gameWon) return;

        const newX = this.cursorPosition.x + dx;
        const newY = this.cursorPosition.y + dy;

        if (newX >= 0 && newX < this.gridSize && newY >= 0 && newY < this.gridSize) {
            this.cursorPosition = { x: newX, y: newY };
            this.updateCursor();
            this.startStopwatch();
            this.flipTile(this.cursorPosition.x, this.cursorPosition.y);
        }
    }

    changeGridSize(newSize) {
        if (newSize === this.gridSize) return;
        this.gridSize = newSize;
        this.cursorPosition = {
            x: Math.floor(newSize / 2),
            y: Math.floor(newSize / 2)
        };
        this.updateSizeSelector();
        this.reset(true);
        this.updateBestTimeDisplay();
    }

    reset(newSeed = true) {
        this.gameWon = false;
        this.gameStarted = false;
        this.cursorPosition = {
            x: Math.floor(this.gridSize / 2),
            y: Math.floor(this.gridSize / 2)
        };
        this.winMessage.classList.remove('show');

        if (newSeed) {
            this.currentSeed = Math.floor(Math.random() * 1000000);
        }

        this.createGrid();
        this.updateCursor();
        this.resetStopwatch();
    }

    customSeed() {
        prompt("What seed?")
    }

    setupEventListeners() {
        const keyboardControls = {

            'ArrowUp': () => this.moveCursor(0, -1),
            'w': () => this.moveCursor(0, -1),
            'p': () => this.moveCursor(0, -1),
            'ArrowDown': () => this.moveCursor(0, 1),
            's': () => this.moveCursor(0, 1),
            ';': () => this.moveCursor(0, 1),
            'ArrowLeft': () => this.moveCursor(-1, 0),
            'a': () => this.moveCursor(-1, 0),
            'l': () => this.moveCursor(-1, 0),
            'ArrowRight': () => this.moveCursor(1, 0),
            'd': () => this.moveCursor(1, 0),
            "'": () => this.moveCursor(1, 0),

            ' ': () => this.reset(true),
            'q': () => this.reset(true),
            'Shift': () => this.reset(true),
            'e': () => this.reset(false),
            'r': () => this.reset(false),
            'f': () => this.reset(false),
            'Enter': () => this.reset(false),
            '0': () => this.customSeed()
        };
        document.addEventListener('keydown', (event) => {
            if (event.shiftKey && event.key === 'Backspace') {
                this.clearAllBestTimes();
                return;
            }
            
            const handler = keyboardControls[event.key];
            if (handler) {
                event.preventDefault();
                handler(event);
            }
        });
    }
}

// Initialize game with default 5x5 grid
const game = new TileFlipGame(5);