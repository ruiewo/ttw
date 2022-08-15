import { AppBoard, WorkRecord } from '../common/models';
import { api } from './api.js';
import { configManager } from './configManager.js';
import { log } from './logger.js';
import { boardEditor } from './boardEditor.js';
import { appSettings } from './appSettings.js';
import { htmlToElement } from './tw/twUtility/twUtility.js';

export class WorkInfoPanel {
    private panel = document.getElementById('workInfo')!;
    private category = document.getElementById('currentCategory')!;
    private workProcess = document.getElementById('currentWorkProcess')!;
    private project = document.getElementById('currentProject')!;
    private comment = document.getElementById('currentComment')!;
    private board = document.getElementById('currentBoard')!;

    private categoryList: HTMLUListElement;
    private workProcessListParent: HTMLUListElement;
    private workProcessListChild: HTMLUListElement;
    private boardList: HTMLUListElement;

    private boards: AppBoard[] | null = null;

    private initialized = false;

    constructor() {
        const listHtml =
            `<ul class="workInfoList workInfoCategoryList hidden"></ul>` +
            `<ul class="workInfoList workInfoWorkProcessListParent hidden"></ul>` +
            `<ul class="workInfoList workInfoWorkProcessListChild hidden"></ul>` +
            `<ul class="workInfoList workInfoBoardList hidden"></ul>`;

        this.panel.insertAdjacentHTML('beforeend', listHtml);

        this.categoryList = this.panel.querySelector('.workInfoCategoryList')!;
        this.workProcessListParent = this.panel.querySelector('.workInfoWorkProcessListParent')!;
        this.workProcessListChild = this.panel.querySelector('.workInfoWorkProcessListChild')!;
        this.boardList = this.panel.querySelector('.workInfoBoardList')!;
    }

    private async createListItems() {
        log.debug('createWorkInfoListItems started.');

        // Add Category List Item

        let categoryItems = ``;
        for (const category of appSettings.categories) {
            categoryItems += `<li class="workInfoListItem" data-category-id="${category.id}">${category.name}</li>`;
        }
        this.categoryList.innerHTML = categoryItems;

        this.categoryList.onclick = e => {
            const target = (e.target as HTMLElement).closest('li');
            if (target) {
                this.category.dataset.categoryId = target.dataset.categoryId!;
                this.category.innerText = target.textContent!;
            }
            this.categoryList.classList.add('hidden');
        };
        this.categoryList.onmouseleave = () => {
            this.categoryList.classList.add('hidden');
        };

        // Add WorkProcess List Item

        for (const workProcess of appSettings.workProcessList) {
            const li = htmlToElement(`<li class="workInfoListItem" data-work-process-id="${workProcess.id}">${workProcess.name}</li>`) as HTMLElement;

            this.workProcessListParent.appendChild(li);

            li.onmouseenter = () => {
                this.workProcessListParent.childNodes.forEach(li => {
                    (li as HTMLElement).classList.remove('--active');
                });
                li.classList.add('--active');

                this.workProcessListChild.classList.remove('hidden');

                let subItems = ``;
                for (const detail of workProcess.details) {
                    subItems += `<li class="workInfoListItem" data-work-process-detail-id="${detail.id}" data-label="${workProcess.name}-${detail.name}">${detail.name}</li>`;
                }
                this.workProcessListChild.innerHTML = subItems;
            };
        }

        this.workProcessListChild.onclick = e => {
            const target = (e.target as HTMLElement).closest('li');
            if (target) {
                this.workProcess.dataset.workProcessDetailId = target.dataset.workProcessDetailId!;
                this.workProcess.innerText = target.dataset.label!;
            }

            this.workProcessListParent.classList.add('hidden');
            this.workProcessListChild.classList.add('hidden');
        };

        // todo wrapper等でまとめる必要あり
        // workInfo.typeListParent.onmouseleave = () => {
        //     workInfo.typeListParent.style.display = 'none';
        //     workInfo.typeListChild.style.display = 'none';
        // };

        // Add Quote Number List Item
        await this.createBoardListItems();

        this.boardList.onclick = e => {
            const target = (e.target as HTMLElement).closest('li');
            if (!target) {
                // do nothing
            } else if (target.dataset.boardId === 'CreateNew') {
                boardEditor.show(null, board => this.boardEditorCallback(board));
            } else {
                const boardDetail = target.dataset.boardDetail!;
                const { projectName, boardInfo } = appSettings.separateBoard(boardDetail);
                this.project.innerText = projectName;
                this.board.innerText = boardInfo;
                this.board.dataset.boardId = target.dataset.boardId!;
                this.board.dataset.boardDetail = target.dataset.boardDetail!;
                this.comment.innerText = target.dataset.comment!;
            }

            this.boardList.classList.add('hidden');
        };

        this.boardList.onmouseleave = () => {
            this.boardList.classList.add('hidden');
        };

        this.initialized = true;
        log.debug('createWorkInfoListItems finished.');
    }

    async createBoardListItems() {
        this.boards = await api.getBoardList(configManager.config.workInfoPanel.maxBoardListCount);

        if (!this.boardList) {
            return;
        }

        let items = ``;
        for (const board of this.boards) {
            items += `<li class="workInfoListItem" data-board-id="${board.boardId}" data-comment="${board.comment}" data-board-detail="${board.boardDetail}">${board.boardDetail}, ${board.comment}</li>`;
        }

        items += `<li class="workInfoListItem" data-board-id="CreateNew"> + Create New</li>`;

        this.boardList.innerHTML = items;
    }

    async onClick(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if (target.closest('.workInfoList')) {
            return;
        }

        if (!this.initialized) {
            await this.createListItems();
        }

        this.categoryList.classList.add('hidden');
        this.workProcessListParent.classList.add('hidden');
        this.workProcessListChild.classList.add('hidden');
        this.boardList.classList.add('hidden');

        const input = target.closest<HTMLElement>('.workInfoInput');

        if (input == null) {
            return;
        }

        switch (input.dataset.target!) {
            case 'category':
                this.categoryList.classList.remove('hidden');
                break;
            case 'workProcess':
                this.workProcessListParent.classList.remove('hidden');
                break;
            case 'project':
            case 'comment':
            case 'board':
                if (this.boardList.childNodes.length === 1) {
                    boardEditor.show(null, board => this.boardEditorCallback(board));
                    return;
                }
                this.boardList.classList.remove('hidden');
                break;
        }
    }

    async onContextMenu(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if (target.closest('.workInfoList')) {
            return;
        }

        if (!this.initialized) {
            await this.createListItems();
        }

        const board = this.boards!.find(x => x.id!.toString() === this.board.dataset.boardId) || null;
        boardEditor.show(board, board => this.boardEditorCallback(board));
    }

    boardEditorCallback(savedBoard: AppBoard) {
        const { projectName, boardInfo } = appSettings.separateBoard(savedBoard.boardDetail);
        this.project.innerText = projectName;
        this.board.innerText = boardInfo;
        this.board.dataset.boardId = savedBoard.boardId!.toString();
        this.board.dataset.boardDetail = savedBoard.boardDetail;
        this.comment.innerText = savedBoard.comment;

        this.createBoardListItems();
        log.debug('boardEditor::saveButton::onclick finished.');
    }

    setCurrentWork(work: WorkRecord) {
        const categoryId = work.categoryId == null ? 1 : work.categoryId;
        this.category.dataset.categoryId = categoryId.toString();
        this.category.innerText = appSettings.getCategoryName(categoryId);

        const workProcessDetailId = work.workProcessDetailId == null ? 1 : work.workProcessDetailId;
        this.workProcess.dataset.workProcessDetailId = workProcessDetailId.toString();
        this.workProcess.innerText = appSettings.getWorkProcessName(workProcessDetailId);

        const { projectName, boardInfo } = appSettings.separateBoard(work.boardDetail);
        this.project.innerText = projectName;
        this.board.innerText = boardInfo;
        this.board.dataset.boardId = work.boardId?.toString() ?? '';
        this.board.dataset.boardDetail = work.boardDetail ?? '';

        this.comment.innerText = work.comment ?? '';
    }

    getCurrentInfo() {
        const categoryId = parseInt(this.category.dataset.categoryId!);
        const workProcessDetailId = parseInt(this.workProcess.dataset.workProcessDetailId!);
        const boardId = parseInt(this.board.dataset.boardId!);
        const boardDetail = this.board.dataset.boardDetail!;
        const comment = this.comment.innerText;

        return { categoryId, workProcessDetailId, boardDetail, boardId, comment };
    }
}
