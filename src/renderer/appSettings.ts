import { Category, WorkProcess } from '../common/models';
import { api } from './api.js';
import { isNullOrWhiteSpace } from './tw/twUtility/twUtility.js';

let categories: Category[] = [];
let workProcessList: WorkProcess[] = [];

async function initialize() {
    categories = await api.getCategories();
    workProcessList = await api.getWorkProcessList();
}

await initialize();

export const appSettings = {
    getProjectName(boardDetail: string) {
        if (isNullOrWhiteSpace(boardDetail)) {
            return '';
        }

        return boardDetail.split(',')[0];
    },

    separateBoard(boardDetail: string) {
        if (isNullOrWhiteSpace(boardDetail)) {
            return { projectName: '', boardInfo: '' };
        }

        const boardParts = boardDetail.split(',');
        const projectName = boardParts.shift()!;
        const boardInfo = boardParts.join(', ').trim();

        return { projectName, boardInfo };
    },

    getCategoryName(categoryId: number) {
        const category = categories.find(x => x.id == categoryId);
        if (category == null) {
            throw new Error(`invalid categoryId. id =[${categoryId}]`);
        }
        return category.name;
    },

    getWorkProcessName(workProcessDetailId: number) {
        let workProcessName: string | null = null;
        for (const workProcess of workProcessList) {
            for (const detail of workProcess.details) {
                if (detail.id === workProcessDetailId) {
                    workProcessName = `${workProcess.name}-${detail.name}`;
                    break;
                }
            }

            if (!isNullOrWhiteSpace(workProcessName)) {
                break;
            }
        }

        if (workProcessName == null) {
            throw new Error(`invalid workProcessDetailId. id =[${workProcessDetailId}]`);
        }

        return workProcessName;
    },

    get categories() {
        return categories;
    },

    get workProcessList() {
        return workProcessList;
    },
};
