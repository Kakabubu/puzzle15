const puzzleSetting = {
    size: 4,
    totalTiles: 15,
}

const imagePath = {
    hidden: "images/hidden/", // Folder for hidden images
    revealed: "images/revealed/", // Folder for revealed images
    questionMark: "images/question.png" // Image for hidden tiles
};

const storageStateName = 'puzzleState';

const puzzleGameState = {
    puzzle: [],
    unlocked: false
};

const quizGameState = {
    codesMap: {
        tile1: { code: "value1", number: 1 },
        tile2: { code: "value2", number: 2 },
        tile3: { code: "value3", number: 3 },
        tile4: { code: "value4", number: 4 },
        tile5: { code: "value5", number: 5 },
        tile6: { code: "value6", number: 6 },
        tile7: { code: "value7", number: 7 },
        tile8: { code: "value8", number: 8 },
        tile9: { code: "value9", number: 9 },
        tile10: { code: "value10", number: 10 },
        tile11: { code: "value11", number: 11 },
        tile12: { code: "value12", number: 12 },
        tile13: { code: "value13", number: 13 },
        tile14: { code: "value14", number: 14 },
        tile15: { code: "value15", number: 15 },
        tile16: { code: "value16", number: 16 },
        cheatCode: "codeAll"
    },
}

document.addEventListener("DOMContentLoaded", () => {
    loadGameState();
    renderPuzzle();
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const inputBox = document.getElementById("codeInput");
    inputBox.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            enterCode(e.target.value.trim());
            e.target.value = "";
        }
    });

    const resetButton = document.getElementById("resetButton");
    resetButton.addEventListener("click", resetGame);
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
    let index = 0;

    for (let row = 0; row < puzzleSetting.size; row++) {
        for (let col = 0; col < puzzleSetting.size; col++) {
            if (index < puzzleSetting.totalTiles) {
                puzzleGameState.puzzle[row][col] = { number: numbers[index], initialOrder: index + 1, revealed: false };
                index++;
            } else if (row === puzzleSetting.size - 1 && col === puzzleSetting.size - 1) {
                puzzleGameState.puzzle[row][col] = { number: 16, initialOrder: index + 1, revealed: true, isBackground: true };
            } else {
                puzzleGameState.puzzle[row][col] = { number: 0, initialOrder: index + 1, revealed: true }; // Empty space
            }
        }
    }
    saveGameState();
}

function renderPuzzle() {
    const container = document.getElementById("puzzle-container");
    container.innerHTML = "";
    let firstUnrevealedTileFound = false;
    puzzleGameState.puzzle.forEach((row, rIdx) => {
        row.forEach((tile, cIdx) => {
            const div = document.createElement("div");
            div.className = "tile";

            if (tile.isBackground) {
                const img = document.createElement("img");
                img.src = `${imagePath.revealed}16.png`;
                img.alt = "Background";
                div.appendChild(img);
            } else if (tile.number === 0) {
                div.classList.add("empty");
            } else {
                const img = document.createElement("img");
                if (tile.revealed) {
                    img.src = `${imagePath.revealed}${tile.number}.png`;
                } else if (!firstUnrevealedTileFound) {
                    img.src = `${imagePath.hidden}${tile.initialOrder}.png`;
                    firstUnrevealedTileFound = true;
                } else {
                    img.src = imagePath.questionMark;
                }
                img.alt = `Tile ${tile.number}`;
                div.appendChild(img);
            }

            div.dataset.row = rIdx;
            div.dataset.col = cIdx;
            div.addEventListener("click", moveTile);
            container.appendChild(div);
        });
    });
    saveGameState();
}

function enterCode(code) {
    const normalize = (str) => str.toLowerCase().replace(/\s+/g, '');
    code = normalize(code); 
    if (code === quizGameState.codesMap.cheatCode) return revealAllTiles();

    const tilesState = Object.values(quizGameState.codesMap);
    const tile = tilesState.find(t => normalize(t.code) == code);

    if (!tile || !tile.number) {
        alert("Invalid code. Try again.");
        return;
    }

    if (tile.revealed) return;
    if (tile.number == 1) revealTile(tile);
    else {
        const previousTile = puzzleGameState.puzzle.flat().find(t => t.initialOrder == tile.number - 1)
        if (!previousTile) {
            alert("Previous tile not found.");
            return;
        } else if (!previousTile.revealed) {
            alert("You need to unlock the previous tile first.");
            return;
        } else revealTile(tile);
    }

    if (tile.number === puzzleSetting.totalTiles) {
        puzzleGameState.unlocked = true;
        document.getElementById("codeInput").style.display = "none";
        alert("All pieces unlocked! Now solve the puzzle.");
    }
    saveGameState();
}

function revealNextTile() {
    const tile = puzzleGameState.puzzle.flat()
        .find(tile => !tile.revealed && tile.number !== 0) || { number: 0 };

    revealTile(tile);
}

function revealTile({ number: tileNumber }) {
    const tile = puzzleGameState.puzzle.flat().find(tile => tile.initialOrder == tileNumber);
    if (!tile) return;
    quizGameState.codesMap[`tile${tile.number}`]
        .revealed = tile.revealed = true;
    renderPuzzle();
}

function revealAllTiles() {
    puzzleGameState.puzzle.flat().forEach(tile => tile.revealed = true);
    puzzleGameState.unlocked = true;
    document.getElementById("codeInput").style.display = "none";
    renderPuzzle();
    alert("Cheat activated: All tiles revealed!");
    saveGameState();
}

function moveTile(event) {
    if (!puzzleGameState.unlocked) return;

    let row = parseInt(event.target.parentElement.dataset.row);
    let col = parseInt(event.target.dataset.col);
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
    return puzzleGameState.puzzle.flat().find(tile => tile.number === 0);
}

function isAdjacent(r1, c1, r2, c2) {
    return (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;
}

function checkWin() {
    let correct = [...Array(puzzleSetting.totalTiles).keys()].map(x => x + 1);
    correct.push(16);

    let flatPuzzle = puzzleGameState.puzzle.flat().map(t => t.number);

    if (JSON.stringify(flatPuzzle) === JSON.stringify(correct)) {
        alert("🎉 You solved it!");
        localStorage.removeItem(storageStateName);
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
    let index = flatPuzzle.indexOf(0);
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
    localStorage.setItem(storageStateName, JSON.stringify(state));
}

function loadGameState() {
    const savedStateJSON = localStorage.getItem(storageStateName);
    if (!savedStateJSON) {
        generateSolvablePuzzle();
        return;
    }
    const savedState = JSON.parse(savedStateJSON);
    puzzleGameState.puzzle = savedState.puzzleGameState.puzzle || [];
    puzzleGameState.unlocked = savedState.puzzleGameState.unlocked || false;
}

function resetGame() {
    localStorage.removeItem(storageStateName);
    generateSolvablePuzzle();
    renderPuzzle();
}
