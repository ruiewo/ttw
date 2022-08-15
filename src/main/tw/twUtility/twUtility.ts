// // module形式 browser側で利用
export const sleep = (msec: number) => new Promise(resolve => setTimeout(resolve, msec));

export const range = function* (from: number, to: number) {
    while (from <= to) yield from++;
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
