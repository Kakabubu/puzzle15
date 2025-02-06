document.addEventListener("DOMContentLoaded", () => {
    const puzzleContainer = document.getElementById("puzzle-container");
    const codeInput = document.getElementById("codeInput");

    const N = 4;
    let puzzle = [];
    let enteredCodes = new Set();
    const codes = ["code1", "code2", "code3", "code4", "code5", "code6", "code7", "code8", 
                   "code9", "code10", "code11", "code12", "code13", "code14", "code15"];
    
    function createSolvablePuzzle() {
        let tiles = [...Array(15).keys()].map(n => n + 1);
        tiles.push(null); // Empty space

        do {
            tiles = tiles.sort(() => Math.random() - 0.5);
        } while (!isSolvable(tiles));

        puzzle = [];
        for (let i = 0; i < N; i++) {
            puzzle.push(tiles.slice(i * N, (i + 1) * N));
        }
    }

    function isSolvable(arr) {
        let invCount = 0;
        let flatArr = arr.filter(n => n !== null);

        for (let i = 0; i < flatArr.length - 1; i++) {
            for (let j = i + 1; j < flatArr.length; j++) {
                if (flatArr[i] > flatArr[j]) invCount++;
            }
        }

        let blankRow = arr.indexOf(null) % N;
        return (invCount % 2 === 0) ^ (N % 2 === 0 && blankRow % 2 === 0);
    }

    function renderPuzzle() {
        puzzleContainer.innerHTML = "";
        puzzle.flat().forEach((num, index) => {
            const tile = document.createElement("div");
            tile.classList.add("tile");
            if (num === null) {
                tile.textContent = "";
                tile.classList.add("hidden");
            } else if (!enteredCodes.has(codes[num - 1])) {
                tile.textContent = "❓";
                tile.classList.add("hidden");
            } else {
                tile.textContent = num;
            }
            puzzleContainer.appendChild(tile);
        });
    }

    function checkWin() {
        const flatPuzzle = puzzle.flat();
        for (let i = 0; i < 15; i++) {
            if (flatPuzzle[i] !== i + 1) return false;
        }
        alert("You won!");
    }

    codeInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const code = codeInput.value.trim();
            if (codes.includes(code) && !enteredCodes.has(code)) {
                enteredCodes.add(code);
                renderPuzzle();
            }
            codeInput.value = "";
        }
    });

    createSolvablePuzzle();
    renderPuzzle();
});
