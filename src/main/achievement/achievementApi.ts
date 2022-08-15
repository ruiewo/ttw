import { Board, Category, WorkProcess, WorkRecord } from '../../common/models';
import { api } from './api';

type SetupItems = ApiResponse & { categories: Category[]; workProcessList: WorkProcess[] };
type BoardSearchResponse = ApiResponse & { boards: Board[] };

export type TtwWorkRecord = WorkRecord & {
    ttwId: number;
    startDateTime: string; // iso string
    endDateTime: string; // iso string
};
type AddWorkRecordsResponse = ApiResponse & { updatedIds: number[] };

export type WorkSearchCondition = {
    departmentId?: number | null;
    workProcessList?: number | null;
    categoryId?: number | null;
    startDate?: string;
    endDate?: string;
    userIds?: string[];
};
type WorkSearchResponse = ApiResponse & { records: WorkRecord[] };

export const achievementApi = (() => {
    return {
        async getSetupItems() {
            const { categories, workProcessList } = (await api.get('achievements/setupItems')) as SetupItems;
            return { categories, workProcessList };
        },

        async searchBoardList(projectName: string) {
            const { boards } = (await api.post('boards/search', { projectName, count: 10 })) as BoardSearchResponse;
            return boards;
        },

        async searchWorkRecords(condition: WorkSearchCondition) {
            const result = await api.post(`ttw/search`, condition);

            return (result as WorkSearchResponse).records;
        },

        async addWorkRecords(workRecords: TtwWorkRecord[]) {
            const { updatedIds } = (await api.post('ttw/addWorkRecords', { records: workRecords })) as AddWorkRecordsResponse;
            return updatedIds;
        },
    };
})();
