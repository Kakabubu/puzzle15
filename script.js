const N = 4;
const totalTiles = 15;
let puzzle = [];
let codesEntered = 0;
let codes = new Set(); // Stores entered codes
let unlocked = false; // Becomes true after all codes are entered

document.addEventListener("DOMContentLoaded", () => {
    generateSolvablePuzzle();
    renderPuzzle();
    
    document.getElementById("codeInput").addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            enterCode(e.target.value);
            e.target.value = "";
        }
    });
});

function generateSolvablePuzzle() {
    let numbers = [...Array(totalTiles).keys()].map(x => x + 1);
    do {
        numbers = shuffle(numbers);
    } while (!isSolvable(numbers));

    puzzle = Array(N).fill().map(() => Array(N).fill(null));
    let index = 0;
    
    for (let row = 0; row < N; row++) {
        for (let col = 0; col < N; col++) {
            if (index < totalTiles) {
                puzzle[row][col] = { number: numbers[index], revealed: false };
                index++;
            } else {
                puzzle[row][col] = { number: 0, revealed: true }; // Empty space
            }
        }
    }
}

function renderPuzzle() {
    const container = document.getElementById("puzzle-container");
    container.innerHTML = "";
    puzzle.forEach((row, rIdx) => {
        row.forEach((tile, cIdx) => {
            const div = document.createElement("div");
            div.className = "tile";
            if (tile.number === 0) {
                div.classList.add("empty");
            } else if (!tile.revealed) {
                div.innerHTML = "❓"; // Hidden state
            } else {
                div.innerHTML = tile.number;
            }
            div.dataset.row = rIdx;
            div.dataset.col = cIdx;
            div.addEventListener("click", moveTile);
            container.appendChild(div);
        });
    });
}

function enterCode(code) {
    if (!codes.has(code) && codes.size < totalTiles) {
        codes.add(code);
        codesEntered++;
        revealNextTile();
    }
    if (codesEntered === totalTiles) {
        unlocked = true;
        alert("All pieces unlocked! Now solve the puzzle.");
    }
}

function revealNextTile() {
    for (let row of puzzle) {
        for (let tile of row) {
            if (!tile.revealed && tile.number !== 0) {
                tile.revealed = true;
                renderPuzzle();
                return;
            }
        }
    }
}

function moveTile(event) {
    if (!unlocked) return;

    let row = parseInt(event.target.dataset.row);
    let col = parseInt(event.target.dataset.col);
    let emptyPos = findEmptyTile();

    if (isAdjacent(row, col, emptyPos.row, emptyPos.col)) {
        [puzzle[row][col], puzzle[emptyPos.row][emptyPos.col]] = 
        [puzzle[emptyPos.row][emptyPos.col], puzzle[row][col]];
        renderPuzzle();
        checkWin();
    }
}

function findEmptyTile() {
    for (let row = 0; row < N; row++) {
        for (let col = 0; col < N; col++) {
            if (puzzle[row][col].number === 0) {
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
    correct.push(0);

    let flatPuzzle = puzzle.flat().map(t => t.number);
    
    if (JSON.stringify(flatPuzzle) === JSON.stringify(correct)) {
        alert("🎉 You solved it!");
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
