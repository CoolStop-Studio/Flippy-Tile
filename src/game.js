
// Random seed generator
// Not important how it works, it just generates random seed
class SeededRandom {
    constructor(seed = Math.floor(Math.random() * 1000000)) {
        this.seed = seed;
    }

    next() { // Returns a new random seed
        let result = this.seed;
        result ^= result << 13;
        result ^= result >> 17;
        result ^= result << 5;
        this.seed = result;
        return (result >>> 0) / 4294967296;
    }
}

class TileFlipGame {
    constructor() { // Define constants
        this.GRID_SIZES = [3, 4, 5, 6, 7, 9, 11, 13, 15, 20, 50]; // Starting grid sizes
        this.TARGET_GRID_SIZE = window.innerHeight / 1.8; // The tile grid size, not amount of tiles, the actual pixel width
        this.BASE_CURSOR_BORDER = 4; // Cusor thickness

        this.version = "v1.0" // Version

        this.gridSize = 5; // Default tile amount when page loaded
        this.customSize; // The + button in grid sizes, used to get size if its not in GRID_SIZES
        this.Bookmarks = JSON.parse(localStorage.getItem('tileFlipBookmarks') || '{}');; // Get bookmarks if they exist in localstorage, else return empty object
        this.gameContainer = document.getElementById('game'); // The entire game element
        this.cursor = document.getElementById('cursor'); // The cursor element
        this.winMessage = document.getElementById('winMessage'); // The win screen element
        this.winTimer = document.getElementById('win-time'); // The win screen time element
        this.nextButton = document.getElementById('next-button'); // The win screen next button element
        this.retryButton = document.getElementById('retry-button'); // The win screen retry button element
        this.stopwatch = document.getElementById('stopwatch'); // The current time in the topbar element
        this.bestTimeDisplay = document.getElementById('bestTime'); // The best time in the topbar element
        this.sizeSelector = document.getElementById('sizeSelector'); // The entire size sidebar element
        this.bookmarkSelector = document.getElementById('bookmarkSelector'); // The entire bookmark sidebar element
        this.leftSidebar = document.getElementById('left-sidebar');
        this.rightSidebar = document.getElementById('right-sidebar');
        this.editBookmark = document.getElementById('edit-bookmark');
        this.createBookmark = document.getElementById('create-bookmark');

        this.cursorPosition = { x: Math.floor(this.gridSize / 2), y: Math.floor(this.gridSize / 2) }; // The cursors position in the grid, in tiles not pixels
        this.gameWon = false; // Is the game won?
        this.gameStarted = false; // Is the game started?
        this.timer = null; // The timer interval
        this.elapsedTime = 0; // Current time since started, not formatted
        this.currentSeed = Math.floor(Math.random() * 1000000); // The current seed, set to random on page load
        this.rng = new SeededRandom(this.currentSeed); // The seededRandom class from before, generates random numbers

        // Initialization functions
        this.initializeSizeSelector();
        this.initializeBookmarkSelector();
        this.initializeButtons();
        this.initializeGame();
        this.setupEventListeners();
        this.updateBestTimeDisplay();

        window.addEventListener("resize", () => this.resizeWindow());
    }

    resizeWindow() { // On window resize, update TARGET_GRID_SIZE to match, and update the scaling for the game
        this.TARGET_GRID_SIZE = window.innerHeight / 2;
        this.updateStyles();
    }

    calculateScaling() { // Calculate scaling based on TARGET_GRID_SIZE, for each CSS formatting property
        const gap = Math.max(2, Math.floor(this.TARGET_GRID_SIZE / this.gridSize / 20));
        const availableSpace = this.TARGET_GRID_SIZE - (gap * (this.gridSize - 1));
        const tileSize = Math.floor(availableSpace / this.gridSize);

        const borderRadius = Math.max(2, Math.floor(tileSize / 12));

        return {
            tileSize,
            gap,
            borderRadius,
            cursorBorder: this.BASE_CURSOR_BORDER
        };
    }

    updateStyles() { // Update styles for the tiles
        const { tileSize, gap, borderRadius, cursorBorder } = this.calculateScaling();

        document.documentElement.style.setProperty('--tile-size', `${tileSize}px`);
        document.documentElement.style.setProperty('--gap-size', `${gap}px`);

        const tileStyle = document.createElement('style');
        tileStyle.textContent = `
          .tile, .cursor {
            border-radius: ${borderRadius}px;
          }
          .cursor {
            border-width: ${cursorBorder}px;
          }
        `;

        const oldStyle = document.getElementById('dynamic-game-styles');
        if (oldStyle) {
            oldStyle.remove();
        }

        tileStyle.id = 'dynamic-game-styles';
        document.head.appendChild(tileStyle);
    }

    setupCreateAndEditBookmark() {
        
    }

    initializeSizeSelector() { // Initialize the items on the size selector sidebar
        this.sizeSelector.innerHTML = '';
        
        const newSizeButton = document.getElementById("new-size-btn")

        newSizeButton.addEventListener('click', (e) => {
            e.preventDefault();

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
                    if (Number(newSize) > 75 && !(Number(newSize) > 100) && !(Number(newSize) < 2) ) {
                        if(confirm("This is a very large size! Are you sure you want to continue?")) {
                            this.customSize = newSize;
                            valid = true;
                        }
                    } else if (Number(newSize) > 100) {
                        alert("Needs to be 100 or less")
                    } else if (Number(newSize) < 2) {
                        alert("Needs to be greater than 1")
                    }
                } else {
                    alert("Invalid input: " + newSize)
                }
            }

            this.changeGridSize(newSize);
            this.sizeSelector.querySelectorAll('.size-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            newSizeButton.classList.add('active');
        });

        this.GRID_SIZES.forEach(size => {
            const button = document.createElement('button');
            button.textContent = `${size}x${size}`; 
            button.classList.add('size-btn');
            if (size === this.gridSize) {
                button.classList.add('active');
            }
            
            button.addEventListener('click', (e) => {
                e.preventDefault(); 
                if (size !== this.gridSize) {
                    this.changeGridSize(size);

                    this.sizeSelector.querySelectorAll('.size-btn').forEach(btn => {
                        
                        btn.classList.remove('active');
                    });
                    button.classList.add('active');
                }
            });

            this.sizeSelector.appendChild(button);

        });
    }

    initializeBookmarkSelector() {
        this.reloadBookmarkSelector();

        
        const newBookmarkButton = document.getElementById("new-bookmark-btn")

        newBookmarkButton.addEventListener('click', (e) => {
            e.preventDefault();

            this.createBookmark.style.display = 'flex'
            this.editBookmark.style.display = 'none'
            // let name = prompt("Name?");
            // if(name) {
            //     let seed = prompt("Seed? (Leave black for current seed)");
            //     if(seed) {
            //         this.newBookmark(name, seed)
            //     } else {
            //         this.newBookmark(name, this.currentSeed)
            //     }
            // }            

        });


        
    }

    reloadBookmarkSelector() {
        this.bookmarkSelector.innerHTML = '';

        if (this.Bookmarks[this.gridSize]) {
            this.Bookmarks[this.gridSize].forEach(item => {
                const button = document.createElement('button');
                button.textContent = item.name;
                button.classList.add('bookmark-btn');
                if (this.currentSeed === item.value) {
                    button.classList.add('active');
                }
                
                button.addEventListener('click', (e) => {
                    this.createBookmark.style.display = 'flex'
                    this.editBookmark.style.display = 'none'
                    e.preventDefault();
                    this.reset(item.value)
                    this.updateBookmarkSelector();

                });
    
                this.bookmarkSelector.appendChild(button);
    
            });
        }
    }


    updateBookmarkSelector() {
        const buttons = this.bookmarkSelector.querySelectorAll('.bookmark-btn');
        const bookmarks = this.Bookmarks[this.gridSize]
        for (let i = 0; i < bookmarks.length; i++) {
            buttons[i].classList.toggle('active', this.currentSeed == bookmarks[i].value);
        }
    }

    initializeButtons() {
        this.nextButton.addEventListener('click', () => {
            this.reset(Math.floor(Math.random() * 1000000));
        });
        this.retryButton.addEventListener('click', () => {
            this.reset(this.currentSeed);
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

    getBookmarks() {
        const allBookmarks = JSON.parse(localStorage.getItem('tileFlipBookmarks') || '{}');
        return allBookmarks !== undefined ? allBookmarks : {};
    }

    newBookmark(name, value) {
        
        let obj = { name: name, value: value }
        
        if (this.Bookmarks[this.gridSize]) {
            this.Bookmarks[this.gridSize].push(obj);
        } else {
            this.Bookmarks[this.gridSize] = [obj]
        }
        
        localStorage.setItem('tileFlipBookmarks', JSON.stringify(this.Bookmarks));

        
        this.reloadBookmarkSelector()
    }

    getBestTime() {
        const bestTimes = JSON.parse(localStorage.getItem('tileFlipBestTimes') || '{}');
        return bestTimes[this.gridSize] !== undefined ? bestTimes[this.gridSize] : null;
    }

    setBestTime(time) {
        const bestTimes = JSON.parse(localStorage.getItem('tileFlipBestTimes') || '{}');
        const currentBest = bestTimes[this.gridSize];

        if (currentBest == null || time < currentBest) {
            bestTimes[this.gridSize] = time;
            localStorage.setItem('tileFlipBestTimes', JSON.stringify(bestTimes));
            this.updateBestTimeDisplay();
        }
    }

    clearLocalStorage() {
        if (confirm("Clear all bookmarks & times?")) {
            localStorage.clear()
            this.Bookmarks = {};
            this.updateBestTimeDisplay();
            this.reloadBookmarkSelector();
        }
    }

    updateBestTimeDisplay() {
        const bestTime = this.getBestTime();
        this.bestTimeDisplay.textContent = bestTime !== null ? this.formatTime(bestTime) : '--:--:--';
    }

    initializeGame() {
        document.getElementById("version").innerHTML = this.version;
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
        this.reloadBookmarkSelector();
        this.reset(Math.floor(Math.random() * 1000000));
        this.updateBestTimeDisplay();
        this.updateBookmarkSelector();
    }

    reset(newSeed = null) {
        this.gameWon = false;
        this.gameStarted = false;
        this.cursorPosition = {
            x: Math.floor(this.gridSize / 2),
            y: Math.floor(this.gridSize / 2)
        };
        this.winMessage.classList.remove('show');

        this.currentSeed = newSeed;

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

            ' ': () => this.reset(Math.floor(Math.random() * 1000000)),
            'q': () => this.reset(Math.floor(Math.random() * 1000000)),
            'Shift': () => this.reset(Math.floor(Math.random() * 1000000)),

            'e': () => this.reset(this.currentSeed),
            'r': () => this.reset(this.currentSeed),
            'f': () => this.reset(this.currentSeed),
            'Enter': () => this.reset(this.currentSeed),

            '`': () => this.clearLocalStorage(),
        };
        document.addEventListener('keydown', (event) => {
            const handler = keyboardControls[event.key];
            if (handler) {
                event.preventDefault();
                handler(event);
            }
        });
    }
}

try {
    const game = new TileFlipGame();
} catch(err) {
    alert(err)
}