import os from 'os';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as util from 'util';
import { exec } from 'child_process';
import { BrowserWindow } from 'electron';
import { log } from './logger';
import { appFolderPath } from './appManager';
import { isNullOrWhiteSpace } from './tw/twUtility/twUtility';

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
    tempDir?: string;
};

async function convert({ filePath, docType, template, isEmbed }: MdConvertInfo) {
    if (docType === 'pdf') {
        // convert to pdf with chrome, not with pandoc.
        // because pandoc's pdf convert requires latex module.
        return convertToPdf({ filePath, docType, template, isEmbed });
    }

    const option = await createOption({ filePath, docType, template, isEmbed });
    const command = createCommand(option);
    const result = await execute(command);

    return result.success;
}

async function convertToPdf({ filePath, docType, template, isEmbed }: MdConvertInfo) {
    let tempDir = '';
    try {
        tempDir = await createTempDirectory();

        // create html file.
        const option = await createOption({ filePath, docType, template, isEmbed, tempDir });
        const command = createCommand(option);
        const result = await execute(command);

        if (!result.success) {
            return false;
        }

        // create pdf file.
        const succeed = convertHtmlToPdf(option.inputFilePath, option.outputFilePath!);
        return succeed;
    } catch (error) {
        log.error(`convertToPdf failed.`);
        return false;
    } finally {
        if (!isNullOrWhiteSpace(tempDir)) {
            deleteTempDirectory(tempDir);
        }
    }
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

async function createOption({ filePath, docType, template, isEmbed, tempDir }: MdConvertInfo) {
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
            option.outputFilePath = path.join(tempDir!, `${new Date().toISOString().replace(/[TZ.:-]/g, '')}.html`);
            option.selfContained = isEmbed;
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

async function convertHtmlToPdf(inputFilePath: string, tempHtmlFilePath: string) {
    const pdfPath = inputFilePath.replace('.md', `.pdf`);
    let succeed = false;
    const window = new BrowserWindow({ show: false });

    try {
        await window.loadURL(tempHtmlFilePath);

        const data = await window.webContents.printToPDF({});

        await fs.writeFile(pdfPath, data);

        log.debug(`Wrote PDF successfully to ${pdfPath}`);
        succeed = true;
    } catch (error) {
        log.error(`Failed to write PDF to ${pdfPath}: `, error);
        succeed = false;
    }

    window.close();

    return succeed;
}

async function createTempDirectory() {
    let tempDir = '';
    try {
        const appPrefix = 'ttw-temp';
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), appPrefix));
        return tempDir;
    } catch (error) {
        log.error(`create temp dir failed. dir = [${tempDir}]`);
        throw error;
    }
}

async function deleteTempDirectory(tempDir: string) {
    try {
        if (!isNullOrWhiteSpace(tempDir)) {
            fs.rm(tempDir, { recursive: true });
        }
    } catch (error) {
        log.error(`An error has occurred while removing the temp dir = [${tempDir}]. Please remove it manually.`);
        log.error(error);
    }
}

export const mdConverter = {
    convert,
};
