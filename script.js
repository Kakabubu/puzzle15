const startButtonText = "Вперед до пошуків";

const imagePath = {
    hidden: 'images/hidden/', // Folder for hidden images
    revealed: 'images/revealed/', // Folder for revealed images
    questionMark: 'images/question.png' // Image for hidden tiles
};

const elementIds = {
    storageState: 'puzzleState',
    puzzleContainer: 'puzzle-container',
    codeInput: 'codeInput',
    resetButton: 'resetButton'
}

const gameMessages = {
    win: '🎉 Вітаю, ти вже ближче до винагороди. Тепер тобі треба прочитати цей пазл.',
    invalidCode: 'Такого кода немає. Спробуйте ще раз.',
    previousTileNotFound: 'Previous tile not found.',
    previousTileNotRevealed: 'Хитрішка! Спочатку тобі треба розблокувати попередній пазл!',
    allTilesRevealed: "Всі пазли розблоковані! Тепер розв'язуйте пазл.",
    cheatAllTilesRevealed: 'ЧітКод Активовано: всі пазли розблоковані!',
    cheatPuzzleSolved: "ЧітКод Активовано: пазл розв'язано!",
    confirmReset: "Почати гру наново, чи продовжити попередню? (Cancel щоб продовжити попередню)"
}

const puzzleGame = {
    setting() {
        const size = 4, emptyTileNumber = 0;
        const lastTileNumber = size * size;
        const totalTiles = lastTileNumber - 1

        return {
            size, emptyTileNumber, lastTileNumber, totalTiles,
            codesMap: {
                tile1: { code: 'contidion478', number: 1 },
                tile2: { code: 'sofa729', number: 2 },//CHANGE
                tile3: { code: 'tv557', number: 3 },
                tile4: { code: 'bed951', number: 4 },
                tile5: { code: 'owl741', number: 5 },
                tile6: { code: 'electr444', number: 6 },
                tile7: { code: 'ДанилоАнтонович709', number: 7 },
                tile8: { code: 'elevator123', number: 8 },
                tile9: { code: 'door512', number: 9 },//CHANGE
                tile10: { code: 'mazda777', number: 10 },
                tile11: { code: 'slide749', number: 11 },
                tile12: { code: 'shelf000', number: 12 },//CHANGE
                tile13: { code: 'bath105', number: 13 },
                tile14: { code: 'pipe771', number: 14 },
                tile15: { code: 'oven442', number: 15 },
                tile16: { code: 'freezer850', number: 16 },
                cheatReveal: 'codeAll',
                cheatSolve: 'codeSolve',
                cheatSolveAlmoust: 'codeSolveAlmoust'
            }
        }
    },
    state: { puzzle: [], unlocked: false, solved: false, revealedPiecesSource: [] },
    generate() {
        function shuffle(arr) {
            for (let i = arr.length - 1; i > 0; i--) {
                let j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        };
        function isSolvable(numbers) {
            function getInversionsCount(arr) {
                let inversionsCount = 0;
                for (let i = 0; i < arr.length - 1; i++) {
                    for (let j = i + 1; j < arr.length; j++) {
                        if (arr[j] && arr[i] && arr[i] > arr[j]) inversionsCount++;
                    }
                }
                return inversionsCount;
            };
            function findEmptyTileXPosition(flatPuzzle) {
                let emptyTileIndex = flatPuzzle.indexOf(puzzleGame.setting().emptyTileNumber);
                return puzzleGame.setting().size - Math.floor(emptyTileIndex / puzzleGame.setting().size);
            };
            const inversionsCount = getInversionsCount(numbers);

            if (puzzleGame.setting().size % 2 === 1) return inversionsCount % 2 === 0;
            return (findEmptyTileXPosition(numbers) % 2 === 1) === (inversionsCount % 2 === 0);
        };
        let numbers = [...Array(puzzleGame.setting().totalTiles).keys()].map(x => x + 1);
        do {
            numbers = shuffle(numbers);
        } while (!isSolvable(numbers));

        puzzleGame.state.puzzle = Array(puzzleGame.setting().size).fill().map(() => Array(puzzleGame.setting().size).fill(null));

        for (let row = 0, index = 0; row < puzzleGame.setting().size; row++) {
            for (let col = 0; col < puzzleGame.setting().size; col++) {
                isLastTile = index >= puzzleGame.setting().totalTiles;
                let tile = {
                    number: isLastTile ? puzzleGame.setting().emptyTileNumber : numbers[index],
                    initialOrder: ++index,
                    revealed: false,
                };
                puzzleGame.state.puzzle[row][col] = tile;
            }
        }
        puzzleGame.saveState();
    },
    saveState() {
        return localStorage.setItem(elementIds.storageState, JSON.stringify(puzzleGame.state))
    },
    loadState() {
        const savedStateJSON = localStorage.getItem(elementIds.storageState);
        if (!savedStateJSON) {
            puzzleGame.generate();
            return;
        }
        const savedState = JSON.parse(savedStateJSON);
        puzzleGame.state.puzzle = savedState.puzzle || [];
        puzzleGame.state.unlocked = savedState.unlocked || false;
    },
    reset() {
        page.open.game();
        if (confirm(gameMessages.confirmReset)) {
            localStorage.removeItem(elementIds.storageState);
            setCodeInputVisible(puzzleGame.cheatsEnabled());
            puzzleGame.generate();
        }
        puzzleGame.render();
    },
    render() {
        const container = document.getElementById(elementIds.puzzleContainer);
        container.innerHTML = '';
        let firstUnrevealedTileFound = false;
        puzzleGame.loadState();
        // Load split image pieces from localStorage
        const storedPieces = false && imageSlicer.loadPuzzlePieces(); // Returns an array of base64 images
        let showTestEdit = false;
        puzzleGame.state.puzzle.forEach((row, rowIndex) => {
            row.forEach((tile, cellIndex) => {
                const isEmptyTile = tile.number === puzzleGame.setting().emptyTileNumber;
                const isLastPuzzleTile = rowIndex === puzzleGame.state.puzzle.length - 1 && cellIndex === row.length - 1;
                const div = document.createElement('div'), img = document.createElement('img');

                div.className = 'tile';
                img.alt = `Tile ${tile.number}`;

                if (!isEmptyTile) div.addEventListener('click', puzzleGame.moveTile);
                else if (isLastPuzzleTile && tile.revealed) img.classList.add('background');

                // Fallback: Use predefined image paths if not split yet
                img.src = tile.revealed ? storedPieces && storedPieces[tile.number - 1] || `${imagePath.revealed}${tile.number || 16}.png`
                    : firstUnrevealedTileFound ? imagePath.questionMark
                        : `${imagePath.hidden}${tile.initialOrder}.png`;

                if (tile.initialOrder === 7)
                    showTestEdit = !tile.revealed && !firstUnrevealedTileFound;
                setCodeInputVisible(showTestEdit || puzzleGame.cheatsEnabled());
                if (!tile.revealed) firstUnrevealedTileFound = true;
                if (!tile.revealed || !isEmptyTile || isLastPuzzleTile) div.appendChild(img);

                div.dataset.row = rowIndex;
                div.dataset.col = cellIndex;
                container.appendChild(div);
            });
        });

        // Update header text and subtitle based on game state
        const headerText = document.getElementById('headerText');
        const noteMantis = document.getElementById('note2');
        const noteMantisLink = document.getElementById('noteLink2');
        
        if (puzzleGame.state.unlocked) {
            headerText.innerText = "Збери мапу";
            noteMantis.style.display = 'none';
            noteMantisLink.style.display = 'none';
        } else {
            headerText.innerText = "Шукай шлях";
            noteMantis.style.display = 'block';
            noteMantisLink.style.display = 'block';
        }
    },
    enterCode(code) {

        const normalize = (str) => `${str}`.toLowerCase().replace(/\s+/g, '');

        code = normalize(code);
        if (code === normalize(puzzleGame.setting().codesMap.cheatReveal)) return cheat.revealAllTiles();
        if (code === normalize(puzzleGame.setting().codesMap.cheatSolve)) return cheat.solveGame();
        if (code === normalize(puzzleGame.setting().codesMap.cheatSolveAlmoust)) return cheat.solveAndLeaveLastMove()

        const tilesState = Object.values(puzzleGame.setting().codesMap);
        const tile = tilesState.find(t => normalize(t.code || '') === code)
            || puzzleGame.cheatsEnabled() && puzzleGame.setting().codesMap[`tile${code}`];

        if (!tile || !tile.number) {
            alert(gameMessages.invalidCode);
            return;
        }

        if (tile.revealed) return;
        if (tile.number == 1) puzzleGame.revealTile(tile);
        else {
            const previousTile = puzzleGame.state.puzzle.flat().find(t => t.initialOrder == tile.number - 1)
            if (!previousTile) {
                alert(gameMessages.previousTileNotFound);
                return;
            } else if (!previousTile.revealed) {
                alert(gameMessages.previousTileNotRevealed);
                return;
            } else puzzleGame.revealTile(tile);
        }

        if (puzzleGame.state.puzzle.flat().every(tile => tile.revealed)) {
            puzzleGame.state.unlocked = true;
            setCodeInputVisible(false);
            alert(gameMessages.allTilesRevealed);
        }
        puzzleGame.saveState();
    },
    revealTile({ number: tileNumber }) {
        const tile = puzzleGame.state.puzzle.flat().find(tile => tile.initialOrder == tileNumber);
        if (!tile) return;
        tile.revealed = true;
        puzzleGame.saveState();
        puzzleGame.render();
    },
    moveTile(event) {

        const isAdjacent = (r1, c1, r2, c2) =>
            (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;

        const findEmptyTile = () => {
            for (let row = 0; row < puzzleGame.setting().size; row++) {
                for (let col = 0; col < puzzleGame.setting().size; col++) {
                    if (puzzleGame.state.puzzle[row][col].number === puzzleGame.setting().emptyTileNumber) {
                        return { row, col };
                    }
                }
            }
        }

        if (!puzzleGame.state.unlocked) return;

        let target = event.target;
        if (target.tagName === 'IMG') {
            target = target.parentElement; // If the target is an image, get its parent div
        }

        let row = parseInt(target.dataset.row);
        let col = parseInt(target.dataset.col);
        let emptyPos = findEmptyTile();

        if (isAdjacent(row, col, emptyPos.row, emptyPos.col)) {
            [puzzleGame.state.puzzle[row][col], puzzleGame.state.puzzle[emptyPos.row][emptyPos.col]] =
                [puzzleGame.state.puzzle[emptyPos.row][emptyPos.col], puzzleGame.state.puzzle[row][col]];
            puzzleGame.saveState();
            puzzleGame.render();
            puzzleGame.checkWin();
        } else puzzleGame.saveState();
    },
    checkWin() {
        const flatPuzzle = puzzleGame.state.puzzle.flat().map(t => t.number);
        const correct = [...Array(puzzleGame.setting().totalTiles).keys()].map(x => x + 1);
        correct.push(puzzleGame.setting().emptyTileNumber);
        const isCorrect = JSON.stringify(flatPuzzle) === JSON.stringify(correct);

        if (isCorrect) {
            alert(gameMessages.win);
            localStorage.removeItem(elementIds.storageState);
            puzzleGame.state.solved = true;
            puzzleGame.saveState();
            puzzleGame.animateWin();
        }
    },
    animateReveal() {

    },
    animateWin() {
        const container = document.getElementById(elementIds.puzzleContainer);
        const header = document.querySelector('h1');

        // Smoothly remove gap, margin, and adjust images
        container.style.transition = 'gap 0.8s ease-in-out, margin 0.8s ease-in-out, transform 0.8s ease-in-out';
        container.style.gap = '0px';
        container.style.margin = '0px';
        container.style.transform = 'scale(1.05)';

        // Select all tile images and remove their margins smoothly
        const images = container.querySelectorAll('.tile img');
        images.forEach(img => {
            img.style.transition = 'width 0.8s ease-in-out, height 0.8s ease-in-out, margin 0.8s ease-in-out';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.margin = '0px';
        });

        // Hide the header
        if (header) {
            header.style.transition = 'opacity 0.8s ease-in-out';
            header.style.opacity = '0';
        }

        // Remove the background class from the last tile
        const lastTile = container.querySelector('.tile.background');
        if (lastTile) {
            lastTile.style.transition = 'opacity 0.8s ease-in-out';
            lastTile.style.opacity = '1';
            lastTile.classList.remove('background');
        }

        // Restore normal scale after animation
        setTimeout(() => {
            container.style.transform = '';
        }, 800);
    },
    cheatsEnabled: () => typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE,
    started: () => puzzleGame.loadState()
        || puzzleGame.state
        && (puzzleGame.state.unlocked || puzzleGame.state.puzzle.some(tile => tile && tile.revealed))
};

const page = {
    openPage(name) { window.location.assign(name); },
    open: {
        main() { page.openPage('index.html') },
        game() { page.openPage('game.html') }
    }
}

const cheat = {
    revealAllTiles() {
        if (!puzzleGame.cheatsEnabled()) return;
        alert(gameMessages.cheatAllTilesRevealed);
        puzzleGame.state.puzzle.flat().forEach(tile => tile.revealed = true);
        puzzleGame.state.unlocked = true;
        setCodeInputVisible(false);
        puzzleGame.render();
        puzzleGame.saveState();
    },
    solveGame(withLastMove = false) {
        if (!puzzleGame.cheatsEnabled()) return;
        alert(gameMessages.cheatPuzzleSolved);
        const correct = [...Array(puzzleGame.setting().totalTiles).keys()].map(x => x + 1);
        correct.push(puzzleGame.setting().emptyTileNumber);
        if (withLastMove) {
            const lastIndex = correct.length - 1;
            [correct[lastIndex], correct[lastIndex - 1]] = [correct[lastIndex - 1], correct[lastIndex]];
        }
        puzzleGame.state.puzzle = Array(puzzleGame.setting().size).fill().map(() => Array(puzzleGame.setting().size).fill(null));
        let index = 0;

        for (let row = 0; row < puzzleGame.setting().size; row++) {
            for (let col = 0; col < puzzleGame.setting().size; col++) {
                puzzleGame.state.puzzle[row][col] = { number: correct[index], initialOrder: index + 1, revealed: true };
                index++;
            }
        }
        puzzleGame.render();
        puzzleGame.checkWin();
        puzzleGame.saveState();
    },
    solveAndLeaveLastMove: () => cheat.solveGame(true)
};

const imageSlicer = {
    loadPuzzlePieces() {
        return false;
        if (puzzleGame.state.imagePieces) return puzzleGame.state.imagePieces;
        let pieces = localStorage.getItem('puzzlePieces');
        if (pieces) puzzleGame.state.imagePieces = pieces;
        else imageSlicer.slice(`${imagePath.revealed}full.png`).then((pieces) => {
            uzzleGame.state.imagePieces = pieces;
        });
        return pieces ? JSON.parse(pieces) : null;
    },
    // slice(imageSrc, gridSize = puzzleGame.setting().size) {
    //     return new Promise((resolve) => {
    //         const img = new Image();
    //         img.crossOrigin = 'anonymous'; // Required if loading external images
    //         img.src = imageSrc;
    //         img.onload = () => {
    //             const pieceWidth = img.width / gridSize;
    //             const pieceHeight = img.height / gridSize;
    //             const canvas = document.createElement('canvas');
    //             const ctx = canvas.getContext('2d');

    //             let pieces = [];

    //             for (let row = 0; row < gridSize; row++) {
    //                 for (let col = 0; col < gridSize; col++) {
    //                     canvas.width = pieceWidth;
    //                     canvas.height = pieceHeight;
    //                     ctx.clearRect(0, 0, pieceWidth, pieceHeight);
    //                     ctx.drawImage(
    //                         img,
    //                         col * pieceWidth, row * pieceHeight, pieceWidth, pieceHeight, // Source
    //                         0, 0, pieceWidth, pieceHeight // Destination
    //                     );
    //                     const base64 = canvas.toDataURL();
    //                     pieces.push(base64);
    //                 }
    //             }

    //             localStorage.setItem('puzzlePieces', JSON.stringify(pieces)); // Store in localStorage
    //             resolve(pieces);
    //         };
    //     });
    // }
};

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    if (startButton) {
        document.getElementById('startButtonText')
            .innerText
            = startButton.value
            = startButtonText;

        startButton.addEventListener('click', puzzleGame.started() ? puzzleGame.reset : page.open.game);
        return;
    }

    const mainPageButton = document.getElementById('mainPageButton');
    if (mainPageButton) mainPageButton.addEventListener('click', page.open.main);
    puzzleGame.loadState();
    puzzleGame.render();
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const inputBox = document.getElementById(elementIds.codeInput);
    inputBox.addEventListener('keydown', keydown);
    if (code) {
        window.history.replaceState({}, document.title, window.location.pathname);
        puzzleGame.enterCode(code);
    }
});

function keydown(e) {
    if (e.key !== 'Enter') return;
    puzzleGame.enterCode(e.target.value.trim());
    e.target.value = '';
}

function setCodeInputVisible(isVisible = true) {
    document.getElementById(elementIds.codeInput).style.display = isVisible ? 'block' : 'none';
}
