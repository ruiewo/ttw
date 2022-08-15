import { isNullOrWhiteSpace } from '../twUtility/twUtility.js';

const template = `<style>@charset "UTF-8";
:host {

}

* {
  padding: 0;
  margin: 0;
  -webkit-box-sizing: border-box;
          box-sizing: border-box;
}

::-webkit-scrollbar {
  display: none;
}

dialog {
  height: 450px;
  min-width: 340px;
  color: var(--color-UI-main);
  background-color: var(--color-UI-background);
  text-align: left;
  border-radius: 15px;
  padding: 0;
  margin: auto;
  overflow: hidden;
  -webkit-user-select: none;
     -moz-user-select: none;
      -ms-user-select: none;
          user-select: none;
}

dialog::-webkit-backdrop {
  background-color: rgba(15, 10, 25, 0.4);
}

dialog::backdrop {
  background-color: rgba(15, 10, 25, 0.4);
}

form {
  padding: 8px 16px 16px 16px;
  background-color: transparent;
  height: calc(450px - 24px);
  overflow: scroll;
  scroll-margin: 50px;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  margin-top: 3px;
  height: 24px;
}

li.doubleHeight {
  margin-top: 5px;
  height: 48px;
}

.groupHeader {
  display: block;
  font-weight: bold;
  color: var(--color-UI-main);
  background-color: var(--color-UI-background-active);
  text-align: left;
  margin-top: 10px;
  padding-left: 25px;
}

.itemHeader {
  display: inline-block;
  width: 90px;
  white-space: nowrap;
}

.textBox,
.numberBox,
.select {
  width: 200px;
  height: 24px;
  color: var(--color-UI-main);
  background-color: var(--color-UI-background-active);
  padding: 0 7px;
  outline: none;
  border: none;
  font-size: 14px;
  -webkit-appearance: none;
     -moz-appearance: none;
          appearance: none;
}
.numberBox::-webkit-outer-spin-button,
.numberBox::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.numberBox {
  -moz-appearance: textfield;
}

.select option {
  /* Todo 暫定処理 select/optionのBorderとHoverの色を制御できないためli等へ変更予定 */
  color: var(--color-UI-main);
  background-color: var(--color-UI-background);
}

.checkboxLabel {
  height: 24px;
  line-height: 24px;
  display: inline-block;
  display: block;
  position: relative;
  padding-left: 35px;
  cursor: pointer;
}

.checkbox {
  display: none;
}

.checkbox + ul {
  overflow: hidden;
  display: none;
}

.checkbox:checked + ul {
  display: block;
}

.checkbox + .checkboxLabel:before {
  content: '';
  display: block;
  width: 20px;
  height: 20px;
  border: 1px solid var(--color-UI-main);
  position: absolute;
  left: 0;
  top: 0;
  opacity: 0.6;
  -webkit-transition: all 0.12s;
  transition: all 0.12s;
}

.checkbox:checked + .checkboxLabel:before {
  width: 10px;
  top: -5px;
  left: 5px;
  border-radius: 0;
  opacity: 1;
  border-top-color: transparent;
  border-left-color: transparent;
  -webkit-transform: rotate(45deg);
          transform: rotate(45deg);
}

.slider {
  -webkit-appearance: none;
     -moz-appearance: none;
          appearance: none;
  cursor: pointer;
  outline: none;
  background-color: transparent;
  height: 24px;
  width: 100%;
  padding-left: 35px;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  background: rgba(0, 208, 250, 0.9);
  width: 14px;
  height: 24px;
  margin-top: -12px;
}

.slider::-webkit-slider-runnable-track {
  width: 100%;
  height: 1px;
  cursor: pointer;
  -webkit-box-shadow: none;
          box-shadow: none;
  background: var(--color-UI-main);
}

.colorSlider {
  -webkit-appearance: none;
     -moz-appearance: none;
          appearance: none;
  cursor: pointer;
  outline: none;
  background-color: transparent;
  height: 24px;
  width: 100%;
  padding-left: 35px;
}

.colorSlider::-webkit-slider-thumb {
  -webkit-appearance: none;
  background: #fff;
  width: 2px;
  height: 18px;
}

.colorSlider::-webkit-slider-runnable-track {
  width: 100%;
  height: 18px;
  cursor: pointer;
  -webkit-box-shadow: none;
          box-shadow: none;
  background: -webkit-linear-gradient(left, #f00 0%, #ff0 16.66%, #0f0 33.33%, #0ff 50%, #00f 66.66%, #f0f 83.33%, #f00 100%);
}

.button {
  display: block;
  margin: 0 auto;
  margin-top: 20px;
}

.button {
  display: block;
  margin: 0 auto;
  margin-top: 20px;
  height: 30px;
  width: 100px;
  font-size: 18px;
  font-weight: bold;
  color: var(--color-UI-main);
  background-color: var(--color-UI-background-active);
  border-radius: 3px;
  border: 1px solid var(--color-UI-main);
  text-align: center;
  outline: none;
  -webkit-transition: all 0.2s;
  transition: all 0.2s;
}

.button:hover {
  color: var(--color-UI-background);
  background-color: var(--color-UI-main);
}

.bouncy {
  -webkit-animation: bouncy 5s infinite linear;
          animation: bouncy 5s infinite linear;
  position: relative;
}

@-webkit-keyframes bouncy {
  0% {
    top: 0em;
  }
  40% {
    top: 0em;
  }
  43% {
    top: -0.9em;
  }
  46% {
    top: 0em;
  }
  48% {
    top: -0.4em;
  }
  50% {
    top: 0em;
  }
  100% {
    top: 0em;
  }
}

@keyframes bouncy {
  0% {
    top: 0em;
  }
  40% {
    top: 0em;
  }
  43% {
    top: -0.9em;
  }
  46% {
    top: 0em;
  }
  48% {
    top: -0.4em;
  }
  50% {
    top: 0em;
  }
  100% {
    top: 0em;
  }
}
/*# sourceMappingURL=twConfigDialog.wc.css.map */</style><dialog><form method="dialog" novalidate></form></dialog>`;

class TwConfigDialog extends HTMLElement {
    private dialog: HTMLDialogElement;
    private onCancel = () => {};

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot!.innerHTML = template;

        this.dialog = this.shadowRoot!.querySelector('dialog')!;

        this.dialog.addEventListener('click', e => {
            if (e.target !== this.dialog) {
                return;
            }

            // when backdrop clicked.
            this.onCancel();
            // @ts-ignore
            this.dialog.close('cancelled');
        });
    }

    validate(groupId: string | null, idList: string[]) {
        if (groupId && !this.shadowRoot!.getElementById(groupId)?.classList.contains('group')) {
            throw new Error('invalid group id received.');
        }
        if (idList && idList.length > 0) {
            const id = idList.find(id => this.shadowRoot!.getElementById(id));
            if (id != null) throw new Error(`id [ ${id} ] was already used in this dialog.`);
        }
    }

    createGroup(id: string, labelTitle: string) {
        this.validate(null, [id]);

        const html = `<div id="${id}" class="group"><label class="groupHeader" for="${id}_twc">♦ ${labelTitle}</label><input class="checkbox" id="${id}_twc" type="checkbox"><ul></ul></div>`;
        this.dialog.firstElementChild!.insertAdjacentHTML('beforeend', html);
    }

    appendTextInput(groupId: string, id: string, text: string, placeholder = '') {
        const mergedId = `${groupId}_${id}`;
        this.validate(groupId, [mergedId]);

        const html = `<li><span class="itemHeader">${text}</span><span class="separator">:</span><input type="text" id="${mergedId}" class="textBox" spellcheck="false" placeholder="${placeholder}"></li>`;
        this.dialog.querySelector(`#${groupId}`)!.lastElementChild!.insertAdjacentHTML('beforeend', html);
    }

    appendNumberInput(groupId: string, id: string, text: string, defaultValue: number) {
        const mergedId = `${groupId}_${id}`;
        this.validate(groupId, [mergedId]);

        const html = `<li><span class="itemHeader">${text}</span><span class="separator">:</span><input type="number" id="${mergedId}" class="numberBox" spellcheck="false" data-default-value="${defaultValue}" placeholder="${defaultValue}"></li>`;
        this.dialog.querySelector(`#${groupId}`)!.lastElementChild!.insertAdjacentHTML('beforeend', html);
    }

    appendSelect(groupId: string, id: string, text: string, items: string[]) {
        const mergedId = `${groupId}_${id}`;
        this.validate(groupId, [mergedId]);

        let optionHtml = '';
        for (const item of items) {
            optionHtml += `<option value="${item}">${item}</option>`;
        }

        const html = `<li><span class="itemHeader">${text}</span><span class="separator">:</span><select id="${mergedId}" class="select">${optionHtml}</select></li>`;
        this.dialog.querySelector(`#${groupId}`)!.lastElementChild!.insertAdjacentHTML('beforeend', html);
    }

    appendCheckbox(groupId: string, id: string, text: string) {
        const mergedId = `${groupId}_${id}`;
        this.validate(groupId, [mergedId]);

        const html = `<li><input type="checkbox" id="${mergedId}" class="checkbox"><label class="checkboxLabel" for="${mergedId}">${text}</label></li>`;
        this.dialog.querySelector(`#${groupId}`)!.lastElementChild!.insertAdjacentHTML('beforeend', html);
    }

    appendSlider(groupId: string, checkboxId: string, sliderId: string, text: string, userOption: SliderOption) {
        const mergedCheckboxId = `${groupId}_${checkboxId}`;
        const mergedSliderId = `${groupId}_${sliderId}`;
        this.validate(groupId, [mergedCheckboxId, mergedSliderId]);

        const defaultOption: SliderOption = { min: 0, max: 100, step: 1, useColorSlider: false };
        const sliderOption = { ...defaultOption, ...userOption };

        const sliderClassName = sliderOption.useColorSlider ? 'colorSlider' : 'slider';

        const html = `<li class="doubleHeight">
<input type="checkbox" id="${mergedCheckboxId}" class="checkbox"><label class="checkboxLabel" for="${mergedCheckboxId}">${text}</label>
<input type="range" id="${mergedSliderId}" class="${sliderClassName}" min="${sliderOption.min}" max="${sliderOption.max}" step="${sliderOption.step}">
</li>`;
        this.dialog.querySelector(`#${groupId}`)!.lastElementChild!.insertAdjacentHTML('beforeend', html);
    }

    appendButton(groupId: string, id: string, text: string, optionClass: string) {
        if (groupId == null || isNullOrWhiteSpace(groupId)) {
            this.validate(null, [id]);

            const html = `<button class="button ${optionClass}" id="${id}">${text}</button>`;
            this.dialog.firstElementChild!.insertAdjacentHTML('beforeend', html);
        } else {
            const mergedId = `${groupId}_${id}`;
            this.validate(null, [mergedId]);

            const html = `<button class="button ${optionClass}" id="${mergedId}">${text}</button>`;
            this.dialog.querySelector<HTMLElement>(`${groupId}`)!.lastElementChild!.insertAdjacentHTML('beforeend', html);
        }
    }

    show() {
        // @ts-ignore
        this.dialog.showModal();
    }

    get(groupId: string | null, itemId: string) {
        const id = isNullOrWhiteSpace(groupId) ? itemId : `${groupId}_${itemId}`;
        return this.dialog.querySelector<HTMLInputElement>(`#${id}`);
    }

    set(groupId: string | null, itemId: string, value: string | number | boolean) {
        const id = isNullOrWhiteSpace(groupId) ? itemId : `${groupId}_${itemId}`;
        const target = this.get(groupId, itemId);
        if (target == null) {
            console.error(`config item not found. groupId = [${groupId}] itemId = [${itemId}]`);
            return;
        }

        switch (target.className) {
            case 'select':
            case 'textBox':
                target.value = value.toString();
                break;
            case 'numberBox':
                if (typeof value !== 'number' || Number.isNaN(value)) {
                    console.error(`invalid value passed. required value is Number. typeof value = [${typeof value}]`);
                    return;
                }
                target.valueAsNumber = value;
                break;
            case 'slider':
            case 'colorSlider':
                if (typeof value !== 'number' || Number.isNaN(value)) {
                    console.error(`invalid value passed. required value is Number. typeof value = [${typeof value}]`);
                    return;
                }
                target.valueAsNumber = value;
                break;
            case 'checkbox':
                target.checked = value === true;
                break;
        }
    }

    getData() {
        const data: { [key: string]: TwConfigGroupData } = {};
        for (const group of this.shadowRoot!.querySelectorAll('.group')) {
            const groupData: TwConfigGroupData = {};
            for (const target of group.lastElementChild!.querySelectorAll('[id]')) {
                const id = target.id.slice(group.id.length + 1);
                groupData[id] = this.convertValue(target as HTMLInputElement);
            }
            data[group.id] = groupData;
        }
        return data;
    }

    getGroupData(groupId: string) {
        const group = this.shadowRoot!.getElementById(groupId) as HTMLElement;
        const data: TwConfigGroupData = {};
        for (const target of group.lastElementChild!.querySelectorAll('[id]')) {
            const id = target.id.slice(group.id.length + 1);
            data[id] = this.convertValue(target as HTMLInputElement);
        }

        return data;
    }

    convertValue(target: HTMLInputElement) {
        switch (target.className) {
            case 'select':
            case 'textBox':
                return (target as HTMLInputElement).value;
            case 'numberBox': {
                const value = (target as HTMLInputElement).valueAsNumber;
                return Number.isNaN(value) ? Number((target as HTMLInputElement).dataset!.defaultValue!) : value;
            }
            case 'slider':
            case 'colorSlider': {
                const value = (target as HTMLInputElement).valueAsNumber;
                return Number.isNaN(value) ? (Number((target as HTMLInputElement).min) + Number((target as HTMLInputElement).max)) / 2 : value;
            }
            case 'checkbox':
                return (target as HTMLInputElement).checked;
            default:
                throw new Error('invalid data operation. twConfigDialog.covertValue');
        }
    }

    setData(data: { [key: string]: TwConfigGroupData }) {
        for (const groupId of Object.keys(data)) {
            const group = this.shadowRoot!.getElementById(groupId);
            if (group == null) continue;

            const obj = data[groupId];
            if (obj == null) {
                continue;
            }

            for (const itemId of Object.keys(obj)) {
                const input = this.shadowRoot!.getElementById(`${groupId}_${itemId}`);
                if (input == null) continue;

                const value = obj[itemId];
                if (input.classList.contains('checkbox')) {
                    (input as HTMLInputElement).checked = value as boolean;
                } else {
                    (input as HTMLInputElement).value = value.toString();
                }
            }
        }
    }

    setOnCancel(callback: () => void) {
        if (typeof callback === 'function') {
            this.onCancel = callback;
        }
    }
}

customElements.define('config-dialog', TwConfigDialog);

export { TwConfigDialog };

export type TwConfigGroupData = { [key: string]: string | number | boolean };
type SliderOption = { min: number; max: number; step: number; useColorSlider?: boolean };
