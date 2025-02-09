const puzzleSetting = {
    size: 4,
    totalTiles: 15,
    emptyTileNumber: 0,
    lastTileNumber: 16
}

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

const puzzleGameState = {
    puzzle: [],
    unlocked: false
};

const quizGameState = {
    codesMap: {
        tile1: { code: '1', number: 1 },//contidion478
        tile2: { code: '2', number: 2 },//sock729
        tile3: { code: '3', number: 3 },//tv557
        tile4: { code: '4', number: 4 },//bed951
        tile5: { code: '5', number: 5 },
        tile6: { code: '6', number: 6 },
        tile7: { code: '7', number: 7 },//ДанилоАнтонович709
        tile8: { code: '8', number: 8 },
        tile9: { code: '9', number: 9 },
        tile10: { code: '10', number: 10 },
        tile11: { code: '11', number: 11 },
        tile12: { code: '12', number: 12 },
        tile13: { code: '13', number: 13 },
        tile14: { code: '14', number: 14 },
        tile15: { code: '15', number: 15 },
        tile16: { code: '16', number: 16 },//freezer850
        cheatReveal: 'codeAll',
        cheatSolve: 'codeSolve',
    },
    messages: {
        win: '🎉 Вітаю, ти вже ближче до винагороди. Тепер тобі треба прочитати цей пазл.',
        invalidCode: 'Такого кода немає. Спробуйте ще раз.',
        previousTileNotFound: 'Previous tile not found.',
        previousTileNotRevealed: 'Хитрішка! Спочатку тобі треба розблокувати попередній пазл!',
        allTilesRevealed: "Всі пазли розблоковані! Тепер розв'язуйте пазл.",
        cheatAllTilesRevealed: 'ЧітКод Активовано: всі пазли розблоковані!',
        cheatPuzzleSolved: "ЧітКод Активовано: пазл розв'язано!",
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadGameState();
    renderPuzzle();
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const inputBox = document.getElementById(elementIds.codeInput);
    inputBox.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            enterCode(e.target.value.trim());
            e.target.value = '';
        }
    });

    const resetButton = document.getElementById(elementIds.resetButton);
    resetButton.addEventListener('click', resetGame);
    if (code) {
        window.history.replaceState({}, document.title, window.location.pathname);
        enterCode(code);
    }
});

function generateSolvablePuzzle() {
    let numbers = [...Array(puzzleSetting.totalTiles).keys()].map(x => x + 1);
    do {
        numbers = shuffle(numbers);
    } while (!isSolvable(numbers));

    puzzleGameState.puzzle = Array(puzzleSetting.size).fill().map(() => Array(puzzleSetting.size).fill(null));

    for (let row = 0, index = 0; row < puzzleSetting.size; row++) {
        for (let col = 0; col < puzzleSetting.size; col++) {
            isLastTile = index >= puzzleSetting.totalTiles;
            let tile = {
                number: isLastTile ? puzzleSetting.emptyTileNumber : numbers[index],
                initialOrder: ++index,
                revealed: false,
            };
            puzzleGameState.puzzle[row][col] = tile;
        }
    }
    saveGameState();
}

function renderPuzzle() {
    const container = document.getElementById(elementIds.puzzleContainer);
    container.innerHTML = '';
    let firstUnrevealedTileFound = false;
    puzzleGameState.puzzle.forEach((row, rowIndex) => {
        row.forEach((tile, cellIndex) => {
            const isEmptyTile = tile.number === puzzleSetting.emptyTileNumber;
            const isLastPuzzleTile = rowIndex === puzzleGameState.puzzle.length - 1 && cellIndex === row.length - 1;
            const div = document.createElement('div'), img = document.createElement('img');
            div.className = 'tile';
            img.alt = `Tile ${tile.number}`;
            if (isEmptyTile) {
                div.classList.add('empty');
                if (isLastPuzzleTile && tile.revealed) div.classList.add('background');
            } else div.addEventListener('click', moveTile);

            img.src = tile.revealed ? `${imagePath.revealed}${tile.number || 16}.png`
                : firstUnrevealedTileFound ? imagePath.questionMark
                    : `${imagePath.hidden}${tile.initialOrder}.png`;
            if (!tile.revealed) firstUnrevealedTileFound = true;
            if (!tile.revealed || !isEmptyTile || isLastPuzzleTile) div.appendChild(img);

            div.dataset.row = rowIndex;
            div.dataset.col = cellIndex;
            container.appendChild(div);
        });
    });
    saveGameState();
}

function enterCode(code) {
    const normalize = (str) => str.toLowerCase().replace(/\s+/g, '');
    code = normalize(code);
    if (code === normalize(quizGameState.codesMap.cheatReveal)) return cheat.revealAllTiles();
    if (code === normalize(quizGameState.codesMap.cheatSolve)) return cheat.solveGame();

    const tilesState = Object.values(quizGameState.codesMap);
    const tile = tilesState.find(t => normalize(t.code || '') === code);

    if (!tile || !tile.number) {
        alert(quizGameState.messages.invalidCode);
        return;
    }

    if (tile.revealed) return;
    if (tile.number == 1) revealTile(tile);
    else {
        const previousTile = puzzleGameState.puzzle.flat().find(t => t.initialOrder == tile.number - 1)
        if (!previousTile) {
            alert(quizGameState.messages.previousTileNotFound);
            return;
        } else if (!previousTile.revealed) {
            alert(quizGameState.messages.previousTileNotRevealed);
            return;
        } else revealTile(tile);
    }

    if (puzzleGameState.puzzle.flat().every(tile => tile.revealed)) {
        puzzleGameState.unlocked = true;
        document.getElementById(elementIds.codeInput).style.display = 'none';
        alert(quizGameState.messages.allTilesRevealed);
    }
    saveGameState();
}

function revealNextTile() {
    const tile = puzzleGameState.puzzle.flat()
        .find(tile => !tile.revealed && tile.number !== puzzleSetting.emptyTileNumber) || { number: puzzleSetting.emptyTileNumber };

    revealTile(tile);
}

function revealTile({ number: tileNumber }) {
    const tile = puzzleGameState.puzzle.flat().find(tile => tile.initialOrder == tileNumber);
    if (!tile) return;
    tile.revealed = true;
    renderPuzzle();
}

const cheat = {
    revealAllTiles() {
        alert(quizGameState.messages.cheatAllTilesRevealed);
        puzzleGameState.puzzle.flat().forEach(tile => tile.revealed = true);
        puzzleGameState.unlocked = true;
        document.getElementById(elementIds.codeInput).style.display = 'none';
        renderPuzzle();
        saveGameState();
    },
    solveGame() {
        alert(quizGameState.messages.cheatPuzzleSolved);
        const correct = [...Array(puzzleSetting.totalTiles).keys()].map(x => x + 1);
        correct.push(puzzleSetting.emptyTileNumber);
        puzzleGameState.puzzle = Array(puzzleSetting.size).fill().map(() => Array(puzzleSetting.size).fill(null));
        let index = 0;

        for (let row = 0; row < puzzleSetting.size; row++) {
            for (let col = 0; col < puzzleSetting.size; col++) {
                puzzleGameState.puzzle[row][col] = { number: correct[index], initialOrder: index + 1, revealed: true };
                index++;
            }
        }
        renderPuzzle();
        checkWin();
        saveGameState();
    }
}

function moveTile(event) {
    if (!puzzleGameState.unlocked) return;

    let target = event.target;
    if (target.tagName === 'IMG') {
        target = target.parentElement; // If the target is an image, get its parent div
    }

    let row = parseInt(target.dataset.row);
    let col = parseInt(target.dataset.col);
    let emptyPos = findEmptyTile();

    if (isAdjacent(row, col, emptyPos.row, emptyPos.col)) {
        [puzzleGameState.puzzle[row][col], puzzleGameState.puzzle[emptyPos.row][emptyPos.col]] =
            [puzzleGameState.puzzle[emptyPos.row][emptyPos.col], puzzleGameState.puzzle[row][col]];
        renderPuzzle();
        checkWin();
    }
    saveGameState();
}

function findEmptyTile() {
    for (let row = 0; row < puzzleSetting.size; row++) {
        for (let col = 0; col < puzzleSetting.size; col++) {
            if (puzzleGameState.puzzle[row][col].number === puzzleSetting.emptyTileNumber) {
                return { row, col };
            }
        }
    }
}

function isAdjacent(r1, c1, r2, c2) {
    return (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;
}

function checkWin() {
    let correct = [...Array(puzzleSetting.totalTiles).keys()].map(x => x + 1);
    correct.push(puzzleSetting.lastTileNumber);

    let flatPuzzle = puzzleGameState.puzzle.flat().map(t => t.number);

    if (JSON.stringify(flatPuzzle) === JSON.stringify(correct)) {
        alert(quizGameState.messages.win);
        localStorage.removeItem(elementIds.storageState);
    }
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function getInvCount(arr) {
    let inv_count = 0;
    for (let i = 0; i < arr.length - 1; i++) {
        for (let j = i + 1; j < arr.length; j++) {
            if (arr[j] && arr[i] && arr[i] > arr[j]) inv_count++;
        }
    }
    return inv_count;
}

function findXPosition(flatPuzzle) {
    let index = flatPuzzle.indexOf(puzzleSetting.emptyTileNumber);
    return puzzleSetting.size - Math.floor(index / puzzleSetting.size);
}

function isSolvable(numbers) {
    let invCount = getInvCount(numbers);
    if (puzzleSetting.size % 2 === 1) return invCount % 2 === 0;
    let pos = findXPosition(numbers);
    return (pos % 2 === 1) === (invCount % 2 === 0);
}

function saveGameState() {
    const state = { puzzleGameState, quizGameState };
    localStorage.setItem(elementIds.storageState, JSON.stringify(state));
}

function loadGameState() {
    const savedStateJSON = localStorage.getItem(elementIds.storageState);
    if (!savedStateJSON) {
        generateSolvablePuzzle();
        return;
    }
    const savedState = JSON.parse(savedStateJSON);
    puzzleGameState.puzzle = savedState.puzzleGameState.puzzle || [];
    puzzleGameState.unlocked = savedState.puzzleGameState.unlocked || false;
}

function resetGame() {
    localStorage.removeItem(elementIds.storageState);
    generateSolvablePuzzle();
    renderPuzzle();
}
