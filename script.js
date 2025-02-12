const imagePath = {
    hidden: 'images/hidden/', // Folder for hidden images
    revealed: 'images/revealed/', // Folder for revealed images
    questionMark: 'images/question.png' // Image for hidden tiles
};

const localization = {
    messages: {
        win: '🎉 Вітаю, ти вже ближче до винагороди. Тепер тобі треба прочитати цей пазл.',
        invalidCode: 'Такого кода немає. Спробуйте ще раз.',
        previousTileNotFound: 'Previous tile not found.',
        previousTileNotRevealed: 'Хитрішка! Спочатку тобі треба розблокувати попередній пазл!',
        allTilesRevealed: "Всі пазли розблоковані! Тепер розв'язуйте пазл.",
        cheatAllTilesRevealed: 'ЧітКод Активовано: всі пазли розблоковані!',
        cheatPuzzleSolved: "ЧітКод Активовано: пазл розв'язано!",
        confirmReset: "Почати гру наново, чи продовжити попередню? (Cancel щоб продовжити попередню)",
        unauthorized: 'Вибачте, але ця гра не для вас'
    },
    buttons: {
        srart : "Вперед до пошуків"
    }
}

const pageMapping = {
    openPage(name) { window.location.assign(name); },
    open: {
        main() { pageMapping.openPage('index.html') },
        game() { pageMapping.openPage('game.html') }
    },
    elements: {
        storageState: 'puzzleState',
        puzzleContainer: 'puzzle-container',
        codeInput: 'codeInput',
        resetButton: 'resetButton',
        mainPageButton: 'mainPageButton',
        startButtonText: 'startButtonText',
        startButton: 'startButton',
        headerText: 'headerText',
        note2: 'note2',
        noteLink2: 'noteLink2'
    }
}

const authorizationCode = "authorizekate36";
const authorizationKey = "isAuthorized";

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById(pageMapping.elements.startButton);
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has(authorizationCode)) {
        localStorage.setItem(authorizationKey, true);
        window.history.replaceState({}, document.title, window.location.pathname);
        location.reload(); // Reload the page after authorization
    }
    if (startButton) {
        document.getElementById(pageMapping.elements.startButtonText)
            .innerText = startButton.value = localization.buttons.srart;

        startButton.addEventListener('click', puzzleGame.started() ? puzzleGame.reset : pageMapping.open.game);
        return;
    }

    const mainPageButton = document.getElementById(pageMapping.elements.mainPageButton);
    if (mainPageButton) mainPageButton.addEventListener('click', pageMapping.open.main);
    puzzleGame.loadState();
    puzzleGame.render();
    const code = urlParams.get('code');
    const inputBox = document.getElementById(pageMapping.elements.codeInput);
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
    document.getElementById(pageMapping.elements.codeInput).style.display = isVisible ? 'block' : 'none';
}
