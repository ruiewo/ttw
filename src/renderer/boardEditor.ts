import { log } from './logger.js';
import { api, SaveBoardCallback } from './api.js';
import { AppBoard } from '../common/models';
import { appSettings } from './appSettings.js';
import { twDialog } from './tw/twDialog/twDialog.js';
import { configManager } from './configManager.js';
import { isNullOrWhiteSpace, isNumber } from './tw/twUtility/twUtility.js';

let initialized = false;

const dialog: {
    panel: HTMLElement | null;
    panelTitle: HTMLElement | null;
    boardEditorSearchInput: HTMLInputElement | null;
    boardEditorProjectInput: HTMLInputElement | null;
    boardEditorBoardInput: HTMLInputElement | null;
    boardEditorCommentInput: HTMLInputElement | null;
    saveButton: HTMLElement | null;
    boardSelector: HTMLElement | null;
} = {
    panel: null,
    panelTitle: null,
    boardEditorSearchInput: null,
    boardEditorProjectInput: null,
    boardEditorBoardInput: null,
    boardEditorCommentInput: null,
    saveButton: null,
    boardSelector: null,
};

const boardEditor = {
    async show(board: AppBoard | null, callback: SaveBoardCallback) {
        if (!initialized) {
            await createBoardEditor(callback);
        }

        showDialog(board);
    },
};

const createBoardEditor = async (callback: SaveBoardCallback) => {
    try {
        dialog.panel = document.getElementById('boardEditorDialog');
        const form = document.createElement('form');
        form.setAttribute('method', 'dialog');

        dialog.panel!.appendChild(form);

        const header = document.createElement('h1');
        header.setAttribute('class', 'boardEditorHeader');
        dialog.panelTitle = header;
        form.appendChild(header);

        let ulHtml = `<ul>`;

        const inputs = [
            { id: 'boardEditorSearchInput', label: 'Search', readOnly: false },
            { id: 'boardEditorProjectInput', label: 'Project', readOnly: true },
            { id: 'boardEditorBoardInput', label: 'Board', readOnly: true },
            { id: 'boardEditorCommentInput', label: 'Comment', readOnly: false },
        ];

        for (const { id, label, readOnly } of inputs) {
            ulHtml +=
                `<li>` +
                `<span class="boardEditorLabel">${label}</span>` +
                `<span class="separator">:</span>` +
                `<input type="text" id="${id}" class="boardEditorInput" spellcheck="false" ${readOnly ? 'readonly="readonly"' : ''}>` +
                `</li>`;
        }

        form.insertAdjacentHTML('beforeend', ulHtml);

        dialog.boardEditorSearchInput = form.querySelector('#boardEditorSearchInput')!;
        dialog.boardEditorProjectInput = form.querySelector('#boardEditorProjectInput')!;
        dialog.boardEditorBoardInput = form.querySelector('#boardEditorBoardInput')!;
        dialog.boardEditorCommentInput = form.querySelector('#boardEditorCommentInput')!;

        let checkBoxes = `<div class="boardEditorIconArea">`;

        const buttonLabels = configManager.config.workComments || [];
        buttonLabels.forEach((label, index) => {
            checkBoxes +=
                `<input type="checkbox" id="boardEditorCheckbox_${index}" class="boardEditorCheckbox" data-value="${label}">` +
                `<label class="boardEditorIcon"  for="boardEditorCheckbox_${index}"><span>${label}</span></label>`;
        });
        checkBoxes += `</div>`;
        form.insertAdjacentHTML('beforeend', checkBoxes);

        const button = document.createElement('button');
        button.innerText = 'Save';
        button.setAttribute('class', 'button boardEditorButton');
        dialog.saveButton = button;
        form.appendChild(button);

        const boardSelectorHtml = `<ul id="boardSelector" class="boardSelector hidden"></ul>`;
        form.insertAdjacentHTML('beforeend', boardSelectorHtml);
        dialog.boardSelector = form.querySelector('#boardSelector')!;

        activateCallbacks(callback);
        initialized = true;
    } catch (error) {
        initialized = false;
        log.error('createBoardEditor failed');
        throw error;
    }
};

const activateCallbacks = (callback: (board: AppBoard) => void) => {
    dialog.panel!.addEventListener('click', e => {
        if (e.target === dialog.panel) {
            // @ts-ignore
            dialog.panel.close('cancelled');
        }
    });

    dialog.boardEditorSearchInput!.onfocus = () => {
        dialog.boardSelector!.classList.remove('hidden');
    };

    dialog.panel!.onclick = (e: MouseEvent) => {
        if ((e.target as HTMLElement).closest('.boardSelector, #boardEditorSearchInput')) {
            return;
        }
        dialog.boardSelector!.classList.add('hidden');
    };

    dialog.boardEditorSearchInput!.oninput = () => {
        const projectName = dialog.boardEditorSearchInput!.value;

        setTimeout(async function () {
            const currentProjectName = dialog.boardEditorSearchInput!.value;
            if (projectName !== currentProjectName) {
                return; // is inputting
            }

            try {
                const boards = await api.searchBoardList(projectName);

                if (boards.length === 0) {
                    //⚠
                    dialog.boardSelector!.innerHTML = `<li class="boardSelectorItem" data-board-id="">NOT FOUND...</li>`;
                    return;
                }

                let items = ``;
                for (const board of boards) {
                    items += `<li class="boardSelectorItem" data-board-id="${board.id}">${board.name}</li>`;
                }
                dialog.boardSelector!.innerHTML = items;
            } catch (error) {
                twDialog.error((error as Error).message);
            }
        }, 500);
    };

    dialog.boardSelector!.onclick = (e: MouseEvent) => {
        const item = (e.target as HTMLElement).closest<HTMLElement>('.boardSelectorItem');
        if (item == null) {
            return;
        }

        const boardDetail = item.textContent!;
        const { projectName, boardInfo } = appSettings.separateBoard(boardDetail);

        dialog.boardEditorProjectInput!.value = projectName;
        dialog.boardEditorBoardInput!.value = boardInfo;
        dialog.boardEditorBoardInput!.dataset.boardId = item.dataset.boardId;
        dialog.boardEditorBoardInput!.dataset.boardDetail = boardDetail;
        dialog.boardSelector!.classList.add('hidden');
    };

    dialog.saveButton!.onclick = () => {
        const boardIdStr = dialog.boardEditorBoardInput!.dataset.boardId;
        const boardId = isNullOrWhiteSpace(boardIdStr) ? null : Number(boardIdStr);
        if (!isNumber(boardId)) {
            twDialog.warn('please select board.');
            return;
        }

        const comments = [...dialog.panel!.querySelectorAll<HTMLElement>('.boardEditorCheckbox:checked')].map(x => `[${x.dataset.value}]`).join('');

        const board = {
            id: null,
            boardId,
            project: dialog.boardEditorProjectInput!.value,
            boardDetail: dialog.boardEditorBoardInput!.dataset.boardDetail,
            comment: comments + dialog.boardEditorCommentInput!.value,
        } as AppBoard;

        api.saveBoard(board, callback);
    };
};

const showDialog = (board: AppBoard | null) => {
    if (board == null) {
        dialog.panelTitle!.innerText = 'Create new Quote No.';
        dialog.boardEditorSearchInput!.value = '';
        dialog.boardEditorProjectInput!.value = '';
        dialog.boardEditorBoardInput!.value = '';
        dialog.boardEditorBoardInput!.dataset.boardId = '';
        dialog.boardEditorBoardInput!.dataset.boardDetail = '';
        dialog.boardEditorCommentInput!.value = '';
    } else {
        const { projectName, boardInfo } = appSettings.separateBoard(board.boardDetail);

        dialog.panelTitle!.innerText = 'Edit Quote No.';
        dialog.boardEditorSearchInput!.value = projectName;
        dialog.boardEditorProjectInput!.value = projectName;
        dialog.boardEditorBoardInput!.value = boardInfo;
        dialog.boardEditorBoardInput!.dataset.boardId = board.boardId!.toString();
        dialog.boardEditorBoardInput!.dataset.boardDetail = board.boardDetail;
        dialog.boardEditorCommentInput!.value = board.comment;
    }

    // @ts-ignore
    dialog.panel.showModal();
};

export { boardEditor };
