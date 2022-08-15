import { twDialog } from './tw/twDialog/twDialog.js';
import { sleep } from './tw/twUtility/twUtility.js';

export interface Page {
    isActive: () => boolean;
    toggle: () => Promise<void>;
    hide: () => void;
}

export class PageManager {
    private pageMap = new Map();

    constructor() {
        //
    }

    hideAll() {
        for (const [pageName, page] of this.pageMap) {
            page.hide();
        }
    }

    async toggle(targetPageName: string) {
        try {
            let currentPage = null;

            // hide other pages
            for (const [pageName, page] of this.pageMap) {
                if (pageName === targetPageName) {
                    currentPage = page;
                    continue;
                }

                if (page.isActive()) {
                    page.hide();
                    await sleep(500);
                }
            }

            // show or hide currentPage
            await currentPage.toggle();
        } catch (error) {
            console.error(`toggle page failed. page = ${targetPageName}`);
            console.error(`error: ${error}`);
            twDialog.error((error as any).toString());
        }
    }

    addPage(pageName: string, page: Page) {
        this.pageMap.set(pageName, page);
    }
}
