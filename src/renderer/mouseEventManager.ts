import { ElectronWindow } from './ElectronWindow';
declare let window: ElectronWindow;

let animationId: number = 0;
let mouseX: number = 0;
let mouseY: number = 0;
let target: HTMLElement;

export function enableWindowDrag(_target: HTMLElement) {
    target = _target;
    target.onmousedown = onMouseDown;

    // drag領域のマウスイベントを受け取るために必要。
    const body = document.getElementById('body')!;
    body.onmouseenter = () => {
        window.api.send('setClickThrough', { isClickThrough: true });
    };
    body.onmouseleave = () => {
        window.api.send('setClickThrough', { isClickThrough: false });
    };

    const container = document.getElementById('container')!;
    container.onmouseenter = () => {
        window.api.send('setClickThrough', { isClickThrough: false });
    };
    container.onmouseleave = () => {
        window.api.send('setClickThrough', { isClickThrough: true });
    };
}

function onMouseDown(e: MouseEvent) {
    if (e.target !== target) {
        return;
    }

    mouseX = e.clientX;
    mouseY = e.clientY;

    document.addEventListener('mouseup', onMouseUp);
    animationId = requestAnimationFrame(moveWindow);
}

function onMouseUp() {
    document.removeEventListener('mouseup', onMouseUp);
    cancelAnimationFrame(animationId);
}

function moveWindow() {
    window.api.send('windowMoving', { mouseX: mouseX, mouseY: mouseY });
    animationId = requestAnimationFrame(moveWindow);
}
