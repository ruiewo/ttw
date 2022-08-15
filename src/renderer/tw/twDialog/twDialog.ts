import { removeAllChildNode } from '../twUtility/twUtility.js';

export { twDialog };

let initialized = false;
type TwDialog = {
    panel: HTMLDialogElement | null;
    header: HTMLElement | null;
    message: HTMLElement | null;
    progress: HTMLProgressElement | null;
    buttons: HTMLElement | null;
};
type ButtonOption = { label: string; value?: string; onclick?: (e: MouseEvent) => void };
type TwProgress = { min: number; max: number; value: number };
type TwMessage = { header?: string; message: string };
const dialog: TwDialog = {
    panel: null,
    header: null,
    message: null,
    progress: null,
    buttons: null,
};

const twDialog = {
    show(message: TwMessage | string, buttonOptions?: ButtonOption[], progress?: TwProgress) {
        return show('show', message, buttonOptions, progress);
    },

    warn(message: TwMessage | string, buttonOptions?: ButtonOption[], progress?: TwProgress) {
        return show('warn', message, buttonOptions, progress);
    },

    error(message: TwMessage | string, buttonOptions?: ButtonOption[], progress?: TwProgress) {
        return show('error', message, buttonOptions, progress);
    },

    updateProgressBar(state: TwProgress) {
        if (state.min) {
            dialog.progress!.setAttribute('min', state.min.toString());
        }
        if (state.max) {
            dialog.progress!.setAttribute('max', state.max.toString());
        }
        if (state.value) {
            dialog.progress!.setAttribute('value', state.value.toString());
        }
    },
};

const initialize = () => {
    if (document.getElementById('twDialog') !== null) {
        initialized = true;
        return;
    }

    dialog.panel = document.createElement('dialog');
    dialog.panel.classList.add('twDialog');
    const form = document.createElement('form');
    form.setAttribute('method', 'dialog');

    const appIcon = document.createElement('div');
    appIcon.classList.add('appIcon');
    dialog.header = document.createElement('h1');
    dialog.message = document.createElement('p');
    dialog.progress = document.createElement('progress');

    dialog.buttons = document.createElement('div');
    dialog.buttons.setAttribute('class', 'twDialogButtons');
    appendButton({ label: 'ok' });

    form.appendChild(appIcon);
    form.appendChild(dialog.header);
    form.appendChild(dialog.message);
    form.appendChild(dialog.progress);
    form.appendChild(dialog.buttons);
    dialog.panel.appendChild(form);

    dialog.panel.addEventListener('mouseup', e => {
        if (e.button !== 0) return;
        const target = e.target as HTMLElement;

        if (target !== dialog.panel) return;

        if (target!.classList.contains('warn') || target.classList.contains('error')) return;

        // @ts-ignore
        dialog.panel.close('cancelled');
    });

    document.getElementById('container')!.appendChild(dialog.panel);
    // document.body.appendChild(dialog.panel);
    initialized = true;
};

const show = (type: string, message: TwMessage | string, buttonOptions?: ButtonOption[], progress?: TwProgress) => {
    if (!initialized) {
        initialize();
    }

    dialog.panel!.classList.remove('warn');
    dialog.panel!.classList.remove('error');
    switch (type) {
        case 'show':
            break;
        case 'warn':
            dialog.panel!.classList.add('warn');
            break;
        case 'error':
            dialog.panel!.classList.add('error');
            break;
    }

    const defaultText = { header: '', message: '' };
    if (typeof message === 'string') {
        message = { message: message };
    }
    message = { ...defaultText, ...message };
    dialog.header!.textContent = message.header ?? '';
    dialog.message!.textContent = message.message;

    removeAllChildNode(dialog.buttons!);
    if (buttonOptions && buttonOptions.length > 0) {
        buttonOptions.forEach(appendButton);
    } else {
        appendButton({ label: 'ok' });
    }

    if (progress != null) {
        dialog.progress!.classList.remove('hidden');
        dialog.progress!.setAttribute('min', progress.min.toString());
        dialog.progress!.setAttribute('max', progress.max.toString());
        dialog.progress!.setAttribute('value', progress.value.toString());
    } else {
        dialog.progress!.classList.add('hidden');
    }

    // @ts-ignore
    dialog.panel!.showModal();
    return dialog.panel;
};

function appendButton(option: ButtonOption) {
    // let option = { label: '', value: '', onclick: '' };
    const button = document.createElement('button');
    button.setAttribute('class', 'button twDialogButton shrinkButton gray');
    // button.setAttribute('class', 'button twDialogButton');
    button.setAttribute('value', option.value || '');
    button.innerText = option.label;

    if (typeof option.onclick === 'function') {
        button.onclick = option.onclick;
    }

    dialog.buttons!.appendChild(button);
}
