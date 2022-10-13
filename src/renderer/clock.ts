import { htmlToElement } from './tw/twUtility/twUtility.js';

const interval = 15000; // msec

let hourDom: HTMLElement;
let minuteDom: HTMLElement;

function create() {
    const clock = htmlToElement(`<div class="clock">
    <div class="wrap">
    <span class="hour"></span>
    <span class="minute"></span>
    <span class="dot"></span>
    </div>
    </div>`);

    hourDom = clock.querySelector('.hour')!;
    minuteDom = clock.querySelector('.minute')!;

    document.getElementById('menuButton')!.append(clock);

    update();
    setInterval(update, interval);
}

function update() {
    const date = new Date();

    const hours = date.getHours() % 12;
    const minutes = date.getMinutes();

    hourDom.style.transform = `rotate(${hours * 30 + (30 * minutes) / 60}deg)`;
    minuteDom.style.transform = `rotate(${minutes * 6}deg)`;
}

export const clock = {
    start: () => {
        create();
    },
};
