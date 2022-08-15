// // module形式 browser側で利用
export const sleep = (msec: number) => new Promise(resolve => setTimeout(resolve, msec));

export const range = function* (from: number, to: number) {
    while (from <= to) yield from++;
};

export const triggerEvent = (event: string, element: HTMLElement) => {
    const evt = new Event(event, { bubbles: true, cancelable: true });
    return element.dispatchEvent(evt);
};

export const isNullOrWhiteSpace = (input: string | null | undefined) => {
    if (typeof input === 'undefined' || input == null) {
        return true;
    }
    return input.toString().replace(/\s/g, '').length < 1;
};

export const isNumber = (value: any) => {
    return typeof value === 'number' && isFinite(value);
};

export const removeAllChildNode = (parent: HTMLElement) => {
    while (parent.firstChild) {
        parent.removeChild(parent.lastChild!);
    }
};

export const typewriter = async (dom: HTMLElement, text: string, speed: number, delay: number) => {
    const charArray = text.split('');

    await new Promise(resolve => setTimeout(resolve, delay));
    charArray.forEach((char, index) => {
        setTimeout(() => (dom.textContent += char), speed * index);
    });
};
// export const sanitize = (() => {
//     const div = document.createElement('div');
//     // "はエスケープされないため注意！
//     function sanitize(text) {
//         div.textContent = text;
//         return div.innerHTML;
//     }

//     return sanitize;
// })();

export const htmlToElement = (html: string) => {
    const template = document.createElement('template');
    template.innerHTML = html;
    return template.content.firstElementChild!;
};

// export const flashMessage = (() => {
//     function show(text, level = 'info') {
//         const flashMessage = document.createElement('div');
//         flashMessage.classList.add('flashMessage');
//         flashMessage.classList.add(level);
//         flashMessage.textContent = text;
//         document.body.appendChild(flashMessage);

//         flashMessage.style.opacity = 1;
//         setTimeout(() => fadeOutFlashMessage(flashMessage), 1000);

//         function fadeOutFlashMessage(flashMessage) {
//             const timer_id = setInterval(() => {
//                 const opacity = flashMessage.style.opacity;

//                 if (opacity > 0) {
//                     flashMessage.style.opacity = opacity - 0.02;
//                 } else {
//                     flashMessage.remove();
//                     clearInterval(timer_id);
//                 }
//             }, 25);
//         }
//     }
//     return {
//         info: text => show(text),
//         warn: text => show(text, 'warn'),
//         error: text => show(text, 'error'),
//     };
// })();

export function escapedRegex(string: string, flag: string) {
    const escaped = string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return new RegExp(escaped, flag);
}

// export function delayedExecute(func, waitMs) {
//     let isWorking = false;

//     function delayedFunc() {
//         if (isWorking) {
//             return;
//         }

//         isWorking = true;

//         setTimeout(() => {
//             func();
//             isWorking = false;
//         }, waitMs);
//     }

//     return delayedFunc;
// }

// export function formatCurrencyToNumber(currencyString) {
//     return Number(currencyString.replace(/[,\\]/g, ''));
// }

// export const formatNumberToCurrency = (function () {
//     const jpCurrencyFormatter = new Intl.NumberFormat('ja-JP');

//     function formatNumberToCurrency(value) {
//         return jpCurrencyFormatter.format(value);
//     }

//     return formatNumberToCurrency;
// })();

// export function toLocalISOString(yyyymmdd, hhmm) {
//     // yyyymmdd = "yyyy-mm-dd"
//     // hhmm = "hh:mm"
//     const date = new DateEx(yyyymmdd);
//     const hhmmArr = hhmm.split(':');
//     date.setHours(hhmmArr[0], hhmmArr[1]);
//     return date.toLocalISOString();
// }

export class DateEx extends Date {
    override toDateString() {
        const y = this.getFullYear();
        const m = ('00' + (this.getMonth() + 1)).slice(-2);
        const d = ('00' + this.getDate()).slice(-2);
        const dateString = `${y}-${m}-${d}`;

        return dateString;
    }

    toDatetimeString() {
        // returns 'yyyy-mm-dd hh:mm:ss'
        const offset = this.getTimezoneOffset() * 60 * 1000;
        const localDatetime = new Date(this.getTime() - offset);
        let datetimeString = localDatetime.toISOString();
        datetimeString = datetimeString.slice(0, 19);
        datetimeString = datetimeString.replace('T', ' ');
        return datetimeString;
    }

    toTimeString() {
        // returns 'hh:mm'
        const offset = this.getTimezoneOffset() * 60 * 1000;
        const localDatetime = new Date(this.getTime() - offset);
        let datetimeString = localDatetime.toISOString();
        datetimeString = datetimeString.slice(11, 16);
        datetimeString = datetimeString.replace('T', ' ');
        return datetimeString;
    }

    addMonths(months: number) {
        this.setMonth(this.getMonth() + months);
        return this;
    }

    addDays(days: number) {
        this.setDate(this.getDate() + days);
        return this;
    }

    addHours(hours: number, mins: number, seconds: number) {
        if (seconds) {
            this.setHours(this.getHours() + hours, this.getMinutes() + mins, this.getSeconds() + seconds);
        } else if (mins) {
            this.setHours(this.getHours() + hours, this.getMinutes() + mins);
        } else {
            this.setHours(this.getHours() + hours);
        }
        return this;
    }

    toLocalISOString() {
        const offset = this.getTimezoneOffset() * 60 * 1000;
        const localDatetime = new Date(this.getTime() - offset);
        let datetimeString = localDatetime.toISOString();
        datetimeString = datetimeString.replace('Z', '');
        const sign = this.getTimezoneOffset() < 0 ? '-' : '+';
        const absOffset = Math.abs(this.getTimezoneOffset());
        const offsetHH = (absOffset / 60).toString().padStart(2, '0');
        const offsetMM = (absOffset % 60).toString().padStart(2, '0');
        datetimeString += sign + offsetHH + ':' + offsetMM;
        return datetimeString;
    }
}

// export class Validate {
//     static isValidDate(dateString) {
//         if (typeof dateString !== 'string') return false;

//         const re = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/;
//         const regs = dateString.match(re);

//         if (regs === null) return false;

//         const year = regs[1];
//         const month = regs[2];
//         const day = regs[3];

//         if (year < 1000 || year > 3000 || month == 0 || month > 12) return false;

//         const monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

//         if (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0)) monthLength[1] = 29;

//         return day > 0 && day <= monthLength[month - 1];
//     }
// }

export class InputUtil {
    static tryConvertToFullDate(input: HTMLInputElement, useTheLastYear = false) {
        const dateString = this.formatToFullDateString(input.value, useTheLastYear);
        if (dateString === null) {
            return false;
        }
        input.value = dateString;
        return true;
    }

    static formatToFullDateString(text: string, useTheLastYear = false) {
        const today = new Date();
        let yyyy = today.getFullYear();
        let mm = today.getMonth() + 1;
        let dd = today.getDate();

        if (!/^[\d/-]{1,10}$/.test(text)) {
            return null;
        }

        const ymd = text.split(/[/-]/, 3);
        let isShortHand = true;

        switch (ymd.length) {
            case 1: {
                const inputText = ymd[0];
                if (inputText.length <= 2) {
                    dd = Number(inputText);
                } else if (inputText.length <= 4) {
                    mm = Number(inputText.slice(0, -2));
                    dd = Number(inputText.slice(-2));
                } else if (inputText.length === 8) {
                    yyyy = Number(inputText.slice(0, 4));
                    mm = Number(inputText.slice(4, 6));
                    dd = Number(inputText.slice(6, 8));
                    isShortHand = false;
                } else {
                    return null; //5-7文字はエラー
                }
                break;
            }
            case 2: {
                mm = Number(ymd[0]);
                dd = Number(ymd[1]);
                break;
            }
            case 3: {
                yyyy = Number(ymd[0]);
                mm = Number(ymd[1]);
                dd = Number(ymd[2]);
                isShortHand = false;
                break;
            }
        }

        const date = new DateEx(yyyy, mm - 1, dd);
        if (date.getFullYear() != yyyy || date.getMonth() != mm - 1 || date.getDate() != dd) {
            return null;
        }

        // 省略入力で未来日となる場合、1年繰り下げるか否か。
        if (useTheLastYear && isShortHand && date.getTime() > Date.now()) {
            date.setFullYear(date.getFullYear() - 1);
        }

        return date.toDateString();
    }

    static tryConvertToTime(input: HTMLInputElement) {
        const timeString = this.formatToTimeString(input.value);
        if (timeString === null) {
            return false;
        }
        input.value = timeString;
        return true;
    }

    static formatToTimeString(text: string) {
        if (!/^[\d:]{1,5}$/.test(text)) {
            return null;
        }

        const hhmm = text.split(/[:]/, 2);
        let hh = 0;
        let mm = 0;

        switch (hhmm.length) {
            case 1: {
                const inputText = hhmm[0];
                if (inputText.length <= 2) {
                    hh = Number(inputText);
                } else if (inputText.length <= 4) {
                    hh = Number(inputText.slice(0, -2));
                    mm = Number(inputText.slice(-2));
                } else {
                    return null; //5文字はエラー
                }
                break;
            }
            case 2: {
                hh = Number(hhmm[0]);
                mm = Number(hhmm[1]);
                break;
            }
        }

        return `${('00' + hh).slice(-2)}:${('00' + mm).slice(-2)}`;
    }
}
