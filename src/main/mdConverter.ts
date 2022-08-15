import { promises as fs } from 'fs';
import * as path from 'path';
import * as util from 'util';
import { exec } from 'child_process';
import { BrowserWindow } from 'electron';
import { log } from './logger';
import { appFolderPath } from './appManager';

const execAsync = util.promisify(exec);

const templateFolderPath = path.join(appFolderPath, 'pandoc');

fs.stat(templateFolderPath).catch(err => {
    if (err.code === 'ENOENT') {
        fs.mkdir(templateFolderPath);
        return;
    }
});

export type MdConvertInfo = {
    filePath: string;
    docType: string;
    template: string;
    isEmbed: boolean;
};

async function convert({ filePath, docType, template, isEmbed }: MdConvertInfo) {
    const option = createOption({ filePath, docType, template, isEmbed });
    const command = createCommand(option);

    const result = await execute(command);
    if (docType !== 'pdf') {
        return result.success;
    }

    // convert to pdf by chrome, not with pandoc.
    // because pandoc's pdf convert requires latex module.
    return convertToPdf(filePath, result.response!);
}

type Option = {
    command: 'pandoc';
    templateFilePath: string | null;
    useTableOfContent: boolean;
    standAlone: boolean;
    inputFilePath: string;
    outputFilePath: string | null;
    selfContained: boolean;
    slideshow: boolean;
    convertRelativePath: boolean;
};

function createOption({ filePath, docType, template, isEmbed }: MdConvertInfo) {
    const option: Option = {
        command: 'pandoc',
        templateFilePath: null,
        useTableOfContent: true,
        standAlone: true,
        inputFilePath: filePath,
        outputFilePath: null,
        selfContained: false,
        slideshow: false,
        convertRelativePath: true,
    };

    switch (docType) {
        case 'html': {
            const templateFilePath = path.join(templateFolderPath, template);

            option.templateFilePath = templateFilePath;
            option.useTableOfContent = true;
            option.outputFilePath = filePath.replace('.md', `.html`);
            option.selfContained = isEmbed;
            option.slideshow = false;
            break;
        }
        case 'slide':
            option.templateFilePath = null;
            option.useTableOfContent = false;
            option.outputFilePath = filePath.replace('.md', `.html`);
            option.selfContained = isEmbed;
            option.slideshow = true;
            break;
        case 'pdf': {
            const templateFilePath = path.join(templateFolderPath, template);

            option.templateFilePath = templateFilePath;
            option.useTableOfContent = true;
            option.outputFilePath = null;
            option.slideshow = false;
            break;
        }
        default:
            throw new Error(`unknown document type passed. docType = [${docType}]`);
    }

    return option;
}

function createCommand(option: Option) {
    const commandArr: string[] = [];
    commandArr.push(option.command);

    if (option.convertRelativePath) {
        commandArr.push(`-f markdown+rebase_relative_paths`);
    }

    if (option.slideshow) {
        commandArr.push('-t revealjs'); // s5, slidy, slideous, dzslides or revealjs
    }

    if (option.templateFilePath) {
        commandArr.push(`--template=${option.templateFilePath}`);
    }

    if (option.useTableOfContent) {
        commandArr.push(`--toc`);
    }

    if (option.standAlone) {
        commandArr.push(`-s`);
    }

    if (option.selfContained) {
        commandArr.push(`--self-contained`);
    }

    if (option.outputFilePath) {
        commandArr.push(`-o ${option.outputFilePath}`);
    }

    commandArr.push(option.inputFilePath);

    return commandArr.join(' ');
}

async function execute(command: string) {
    try {
        const { stdout, stderr } = await execAsync(command);
        log.debug('stdout:', stdout);
        log.debug('stderr:', stderr);

        return { success: true, response: stdout };
    } catch (error) {
        log.error(error); // should contain code (exit code) and signal (that caused the termination).
        return { success: false };
    }
}

async function convertToPdf(inputFilePath: string, html: string) {
    const pdfPath = inputFilePath.replace('.md', `.pdf`);
    let succeed = false;
    const window = new BrowserWindow({ show: false });

    try {
        const file = 'data:text/html;charset=UTF-8,' + encodeURIComponent(html);
        await window.loadURL(file);

        const data = await window.webContents.printToPDF({});
        await fs.writeFile(pdfPath, data);
        log.debug(`Wrote PDF successfully to ${pdfPath}`);
        succeed = true;
    } catch (error) {
        log.debug(`Failed to write PDF to ${pdfPath}: `, error);
        succeed = false;
    }

    window.close();

    return succeed;
}

export const mdConverter = {
    convert,
};
