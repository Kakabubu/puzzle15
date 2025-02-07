const N = 4;
const totalTiles = 15;

const imagePath = {
    hidden: "images/hidden/", // Folder for hidden images
    revealed: "images/revealed/" // Folder for revealed images
};

const storageStateName = 'puzzleState';

const puzzleGameState = {
    puzzle: [],
    unlocked: false
};

const quizGameState = {
    codes: new Set(),
    codesEntered: 0
}

document.addEventListener("DOMContentLoaded", () => {
    loadGameState();
    renderPuzzle();
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code) {
        enterCode(code);
        window.history.replaceState({}, document.title, window.location.pathname); // Remove code from URL
    }
    
    const inputBox = document.getElementById("codeInput");
    inputBox.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            enterCode(e.target.value.trim());
            e.target.value = "";
        }
    });

    const resetButton = document.getElementById("resetButton");
    resetButton.addEventListener("click", resetGame);
});

function generateSolvablePuzzle() {
    let numbers = [...Array(totalTiles).keys()].map(x => x + 1);
    do {
        numbers = shuffle(numbers);
    } while (!isSolvable(numbers));

    puzzleGameState.puzzle = Array(N).fill().map(() => Array(N).fill(null));
    let index = 0;

    for (let row = 0; row < N; row++) {
        for (let col = 0; col < N; col++) {
            if (index < totalTiles) {
                puzzleGameState.puzzle[row][col] = { number: numbers[index], revealed: false };
                index++;
            } else if (row === N - 1 && col === N - 1) {
                puzzleGameState.puzzle[row][col] = { number: 16, revealed: true, isBackground: true };
            } else {
                puzzleGameState.puzzle[row][col] = { number: 0, revealed: true }; // Empty space
            }
        }
    }
    saveGameState();
}

function renderPuzzle() {
    const container = document.getElementById("puzzle-container");
    container.innerHTML = "";
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
                img.src = tile.revealed
                    ? `${imagePath.revealed}${tile.number}.png`
                    : `${imagePath.hidden}${tile.number}.png`;
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
    if (code === "codeAll") {
        revealAllTiles();
        return;
    }

    if (!quizGameState.codes.has(code) && quizGameState.codes.size < totalTiles) {
        quizGameState.codes.add(code);
        quizGameState.codesEntered++;
        revealNextTile();
    }

    if (quizGameState.codesEntered === totalTiles) {
        puzzleGameState.unlocked = true;
        document.getElementById("codeInput").style.display = "none";
        alert("All pieces unlocked! Now solve the puzzle.");
    }
    saveGameState();
}

function revealNextTile() {
    for (let row of puzzleGameState.puzzle) {
        for (let tile of row) {
            if (!tile.revealed && tile.number !== 0) {
                tile.revealed = true;
                renderPuzzle();
                return;
            }
        }
    }
}

function revealTile(tileNumber) {

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
    for (let row = 0; row < N; row++) {
        for (let col = 0; col < N; col++) {
            if (puzzleGameState.puzzle[row][col].number === 0) {
                return { row, col };
            }
        }
    }
}

function isAdjacent(r1, c1, r2, c2) {
    return (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;
}

function checkWin() {
    let correct = [...Array(totalTiles).keys()].map(x => x + 1);
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
    return N - Math.floor(index / N);
}

function isSolvable(numbers) {
    let invCount = getInvCount(numbers);
    if (N % 2 === 1) return invCount % 2 === 0;
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
    quizGameState.codes = new Set(Array.from(savedState.quizGameState.codes || []));
    quizGameState.codesEntered = savedState.quizGameState.codesEntered || 0;
}

function resetGame() {
    localStorage.removeItem(storageStateName);
    generateSolvablePuzzle();
    renderPuzzle();
}
