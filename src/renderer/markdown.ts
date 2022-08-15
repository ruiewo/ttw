import { Page } from './page.js';
import { ElectronWindow } from './ElectronWindow';
import { sleep } from './tw/twUtility/twUtility.js';

declare let window: ElectronWindow;

class MarkdownPage {
    private initialized = false;
    private mdFileDropArea: HTMLElement;
    private mdConvertSettingArea: HTMLElement;

    constructor() {
        const markdownPage = document.getElementById('markdownPage')!;

        // create settingArea
        this.mdConvertSettingArea = document.createElement('div');
        this.mdConvertSettingArea.classList.add('pageTopArea');
        this.mdConvertSettingArea.id = 'markdownSetting';

        const options =
            `<ul>` +
            `<li>` +
            `<span class="pageTopHeader">DocType</span>` +
            `<span class="separator">:</span>` +
            `<select type="text" id="markdownSettingDocType" class="pageTopTextBox">` +
            `<option value="html">html</option>` +
            `<option value="slide">slide</option>` +
            `<option value="pdf">pdf</option>` +
            `</select>` +
            `</li>` +
            `<li>` +
            `<span class="pageTopHeader">Template</span>` +
            `<span class="separator">:</span>` +
            `<input type="text" id="markdownSettingTemplate" class="pageTopTextBox" spellcheck="false">` +
            `</li>` +
            `<li>` +
            `<span class="pageTopHeader">Embed</span>` +
            `<span class="separator">:</span>` +
            `<span class="">separate</span>` +
            `<div class="pageTopSwitchButton"><input type="checkbox" id="pageTopSwitchButton"><label for="pageTopSwitchButton"><span></span></label></div>` +
            `<span class="">embed</span>` +
            `</li>` +
            `<li class="bottomMessage"><a href="https://pandoc.org">*install Pandoc</a></li>` +
            `</ul>`;
        this.mdConvertSettingArea.insertAdjacentHTML('beforeend', options);

        markdownPage.appendChild(this.mdConvertSettingArea);

        (<HTMLSelectElement>document.getElementById('markdownSettingDocType')).value = 'html';
        (<HTMLInputElement>document.getElementById('markdownSettingTemplate')).value = 'template.html';

        // create container
        this.mdFileDropArea = document.createElement('div');
        this.mdFileDropArea.classList.add('pageMainArea');
        this.mdFileDropArea.classList.add('dropArea');
        this.mdFileDropArea.id = 'mdFileDropArea';

        markdownPage.appendChild(this.mdFileDropArea);
        this.activateCallback();
        this.initialized = true;
    }

    activateCallback() {
        this.mdFileDropArea.addEventListener('drop', e => {
            e.preventDefault();
            e.stopPropagation();

            const docType = (<HTMLSelectElement>document.getElementById('markdownSettingDocType')).value;
            const template = (<HTMLInputElement>document.getElementById('markdownSettingTemplate')).value;
            const isEmbed = (<HTMLInputElement>document.getElementById('pageTopSwitchButton')).checked;

            for (const file of e.dataTransfer!.files) {
                const filePath = (file as any).path as string; // this is absolute path only in Electron.

                console.log('File Path of dragged files: ', filePath);
                window.api.invoke('convertMdFile', { filePath, docType, template, isEmbed }, succeed => {
                    if (!succeed) {
                        return;
                    }

                    const toast = new Notification(`converted.`, {
                        body: `md file converted to ${docType}.`,
                        icon: '../../style/img/ttw.png',
                    });

                    toast.onclick = () => {
                        window.api.send('showItemInFolder', { filePath });
                    };
                });
            }

            this.mdFileDropArea.classList.remove('droppable');
        });

        this.mdFileDropArea.addEventListener('dragover', e => {
            e.preventDefault();
            e.stopPropagation();
        });

        this.mdFileDropArea.addEventListener('dragenter', () => {
            this.mdFileDropArea.classList.add('droppable');
        });

        this.mdFileDropArea.addEventListener('dragleave', () => {
            this.mdFileDropArea.classList.remove('droppable');
        });
    }

    isActive() {
        return this.mdConvertSettingArea.classList.contains('--active') || this.mdFileDropArea.classList.contains('--active');
    }

    toggle() {
        this.mdConvertSettingArea.classList.toggle('--active');
        this.mdFileDropArea.classList.toggle('--active');
    }

    hide() {
        this.mdConvertSettingArea.classList.remove('--active');
        this.mdFileDropArea.classList.remove('--active');
    }
}

let markdownPage: MarkdownPage | null = null;

export const markdown: Page = {
    isActive() {
        if (markdownPage === null) {
            return false;
        }

        return markdownPage.isActive();
    },

    async toggle() {
        if (markdownPage === null) {
            markdownPage = new MarkdownPage();
            await sleep(10);
        }

        markdownPage.toggle();
    },

    hide() {
        if (markdownPage === null) {
            return;
        }

        markdownPage.hide();
    },
};
