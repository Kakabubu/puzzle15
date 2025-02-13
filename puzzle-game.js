const puzzleGame = {
  codeInputMethods: { manual: 0, byrUrl: 1 },
  setting() {
    const size = 4, emptyTileNumber = 0;
    const lastTileNumber = size * size;
    const totalTiles = lastTileNumber - 1;

    return {
      size, emptyTileNumber, lastTileNumber, totalTiles,
      codesToBeEnteredManually: [7],
      codesMap: [
        { code: 'contidion478', number: 1 },
        { code: 'sofa729', number: 2 },
        { code: 'tv557', number: 3 },
        { code: 'bed951', number: 4 },
        { code: 'owl741', number: 5 },
        { code: 'electr444', number: 6 },
        { code: 'ДанилоАнтонович709', number: 7, codeInputMethod: puzzleGame.codeInputMethods.manual },
        { code: 'elevator123', number: 8 },
        { code: 'door512', number: 9 },
        { code: 'mazda777', number: 10 },
        { code: 'slide749', number: 11 },
        { code: 'shelf000', number: 12 },
        { code: 'bath105', number: 13 },
        { code: 'pipe771', number: 14 },
        { code: 'oven442', number: 15 },
        { code: 'freezer850', number: 16 }
      ]
    }
  },
  state: { puzzle: [], unlocked: false, solved: false, version: '1.0.0.0' },
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
    const codesToBeInputManually = puzzleGame.setting().codesMap
      .filter(c => c.codeInputMethod === this.codeInputMethods.manual)
      .map(c => c.number);

    for (let row = 0, initialOrder = 1; row < puzzleGame.setting().size; row++) {
      for (let col = 0; col < puzzleGame.setting().size; col++) {
        const isLastTile = initialOrder > puzzleGame.setting().totalTiles;
        let tile = {
          number: isLastTile ? puzzleGame.setting().emptyTileNumber : numbers[initialOrder - 1],
          initialOrder, revealed: false, covered: initialOrder != 1, empty: isLastTile,
          codeManualInput: codesToBeInputManually.includes(initialOrder)
        };
        tile.imagePath = {
          revealed: `${imagePath.revealed}${tile.number || 16}${imagePath.imageFormat}`,
          hidden: `${imagePath.hidden}${tile.initialOrder}${imagePath.imageFormat}`,
          inPreviousState: ''
        }
        initialOrder++;
        puzzleGame.state.puzzle[row][col] = tile;
      }
    }
    puzzleGame.saveState();
  },
  saveState() {
    return localStorage.setItem(pageMapping.elements.storageState, JSON.stringify(puzzleGame.state))
  },
  loadState() {
    const savedStateJSON = localStorage.getItem(pageMapping.elements.storageState);
    if (!savedStateJSON) {
      puzzleGame.generate();
      return;
    }
    const savedState = JSON.parse(savedStateJSON);
    if (savedState.version != puzzleGame.state.version) return puzzleGame.reset(true)
    puzzleGame.state.puzzle = savedState.puzzle || [];
    puzzleGame.state.unlocked = savedState.unlocked || false;
  },
  reset(force = false) {
    pageMapping.open.game();
    if (force || confirm(localization.messages.confirmReset)) {
      if (force) alert(localization.messages.forceReset);
      localStorage.removeItem(pageMapping.elements.storageState);
      setCodeInputVisible(puzzleGame.cheatsEnabled());
      puzzleGame.generate();
    }
    puzzleGame.render();
  },
  enterCode(code) {

    const normalize = (str) => `${str}`.toLowerCase().replace(/\s+/g, '');

    code = normalize(code);
    if (!puzzleGame.isAuthorized()) {
      alert(localization.messages.unauthorized);
      return;
    }
    if (code === normalize(cheat.codes.reveal)) return cheat.revealAllTiles();
    if (code === normalize(cheat.codes.solve)) return cheat.solveGame();
    if (code === normalize(cheat.codes.solveAlmoust)) return cheat.solveAndLeaveLastMove()

    const tile = Object.values(puzzleGame.setting().codesMap)
      .find(t => normalize(t.code || '') === code)
      || puzzleGame.cheatsEnabled() && puzzleGame.setting().codesMap[`tile${code}`];

    if (!tile || !tile.number) {
      alert(localization.messages.invalidCode);
      return;
    }
    puzzleGame.revealTile(tile);
  },
  isAuthorized() {
    return localStorage.getItem(authorizationKey) === "true";
  },
  revealTile({ number: tileNumber }) {
    const tile = puzzleGame.state.puzzle.flat().find(tile => tile.initialOrder == tileNumber);
    const nextTile = puzzleGame.state.puzzle.flat().find(tile => tile.initialOrder == tileNumber + 1);
    if (!tile || tile.revealed) return;
    if (tile.covered) {
      alert(localization.messages.previousTileNotRevealed);
      return;
    }
    tile.revealed = true;
    tile.imagePath.inPreviousState = tile.imagePath.hidden;
    if (nextTile) {
      nextTile.covered = false;
      nextTile.imagePath.inPreviousState = imagePath.questionMark;
    }
    puzzleGame.saveState();
    puzzleGame.checkAllRevealed();
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
    if (target.tagName === 'IMG') target = target.parentElement; // If the target is an image, get its parent div

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
      alert(localization.messages.win);
      //localStorage.removeItem(pageMapping.elements.storageState);
      puzzleGame.state.solved = true;
      puzzleGame.saveState();
      puzzleGame.animateWin();
    }
  },
  checkAllRevealed() {
    if (!puzzleGame.state.puzzle.flat().every(tile => tile.revealed)) return;
    puzzleGame.state.unlocked = true;
    setCodeInputVisible(false);
    alert(localization.messages.allTilesRevealed);
    puzzleGame.saveState();
  },
  render() {
    if (!puzzleGame.isAuthorized()) {
      alert(localization.messages.unauthorized);
      return;
    }
    const container = document.getElementById(pageMapping.elements.puzzleContainer);
    container.innerHTML = '';
    puzzleGame.loadState();

    let showTextEdit = false;
    puzzleGame.state.puzzle.flat().forEach((tile, tileIndex, currentArray) => {
      const isLastPuzzleTile = tileIndex === currentArray.length - 1;
      if (tile.codeManualInput && !(tile.revealed || tile.covered))
        showTextEdit = true;
      setCodeInputVisible(showTextEdit || puzzleGame.cheatsEnabled());
      const div = document.createElement('div');
      div.className = 'tile';
      const img = document.createElement('img');
      if (!tile.empty) div.addEventListener('click', puzzleGame.moveTile);
      else if (isLastPuzzleTile && tile.revealed) img.classList.add('background');
      const pathRevealed = tile && tile.imagePath && tile.imagePath.revealed || '';
      const pathHidden = tile && tile.imagePath && tile.imagePath.hidden || ''
      const newImage = tile.covered ? imagePath.questionMark
        : tile.revealed ? pathRevealed : pathHidden;
      img.alt = `Tile ${tile.number}`;
      img.src = newImage;
      if (!tile.revealed || !tile.empty || isLastPuzzleTile) div.appendChild(img);
      if (tile.imagePath.inPreviousState != '') puzzleGame.animateReveal(tile, div);

      div.dataset.row = Math.trunc(tileIndex / puzzleGame.setting().size);
      div.dataset.col = tileIndex % puzzleGame.setting().size;
      container.appendChild(div);
    });
    // Update header text and subtitle based on game state
    const headerText = document.getElementById(pageMapping.elements.headerText);
    const noteMantis = document.getElementById(pageMapping.elements.note2);
    const noteMantisLink = document.getElementById(pageMapping.elements.noteLink2);

    if (puzzleGame.state.unlocked) {
      headerText.innerText = localization.headers.gamePuzzle15;
      noteMantis.style.display = 'none';
      noteMantisLink.style.display = 'none';
    } else {
      headerText.innerText = localization.headers.gameRevealTiles;
      noteMantis.style.display = 'block';
      noteMantisLink.style.display = 'block';
    }
  },
  animateReveal(tile, div) {
    // Queue animation for changing tile image
    const timeout = 1000;
    const delay = tile.imagePath.inPreviousState === imagePath.questionMark ? timeout : 0; // Delay before animation starts
    const transition = `opacity ${parseFloat(timeout / 1000)}s ease-in-out`;

    const previousImage = document.createElement('img'), newImage = div.querySelector('img');
    const defaultOpacity = { new: newImage.style.opacity, prev: previousImage.style.opacity }
    previousImage.src = tile.imagePath.inPreviousState;
    previousImage.style.position = 'absolute';
    previousImage.style.transition = transition;
    //previousImage.style.opacity = '1';

    newImage.style.transition = transition;
    newImage.style.opacity = '0';

    div.appendChild(previousImage);

    setTimeout(() => {
      previousImage.style.opacity = '0';
      newImage.style.opacity = defaultOpacity.new;
      setTimeout(() => {
        div.removeChild(previousImage);
      }, timeout);
    }, delay);

    tile.imagePath.inPreviousState = '';
    puzzleGame.saveState();
    return tile;
  },
  animateWin() {
    const container = document.getElementById(pageMapping.elements.puzzleContainer);
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
    const lastTile = container.querySelector('img.background');
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


const cheat = {
  revealAllTiles() {
    if (!puzzleGame.cheatsEnabled()) return;
    alert(localization.messages.cheatAllTilesRevealed);
    puzzleGame.state.puzzle.flat().forEach(tile => (tile.revealed = true, tile.covered = false));
    puzzleGame.state.unlocked = true;
    setCodeInputVisible(false);
    puzzleGame.saveState();
    puzzleGame.render();
  },
  solveGame(withLastMove = false) {
    if (!puzzleGame.cheatsEnabled()) return;
    alert(localization.messages.cheatPuzzleSolved);

    const flatPuzzle = puzzleGame.state.puzzle.flat();
    flatPuzzle.sort((a, b) => a.number - b.number);
    flatPuzzle.push(flatPuzzle.shift());
    if (withLastMove) flatPuzzle.push(flatPuzzle.splice(flatPuzzle.length - 2, 1)[0])

    for (let row = 0, index = 0; row < puzzleGame.setting().size; row++) {
      for (let col = 0; col < puzzleGame.setting().size; col++) {
        const tile = flatPuzzle[index++];
        tile.revealed = true;
        tile.covered = false;
        puzzleGame.state.puzzle[row][col] = tile;
      }
    }

    puzzleGame.saveState();
    puzzleGame.checkWin();
    puzzleGame.render();
  },
  solveAndLeaveLastMove: () => cheat.solveGame(true),
  codes: {
    reveal: 'codeAll',
    solve: 'codeSolve',
    solveAlmoust: 'codeSolveAlmoust'
  }
};
