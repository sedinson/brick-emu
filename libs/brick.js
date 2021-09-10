const PIXEL = '<svg viewBox="0 0 10 10"><rect width="10" height="10" style="stroke:#000;stroke-width:1;fill:transparent;" /><rect width="6" height="6" x="2" y="2" style="fill:#000;top: 2px;left: 2px;" /></svg>'//"&boxtimes;";
const PIXEL_CSS = {
    position: 'absolute',
    pointerEvents: 'none'
};
const LCD_CELLS = [
    {
        style: { left: 5 },
        attributes: { width: 20, height: 6 },
        polygon: (color) => `<polygon points="3,0 0,3 3,6 17,6 20,3 17,0" style="fill:${color};stroke-width:0" />`
    },
    {
        style: { top: 5, left: 24 },
        attributes: { width: 6, height: 20 },
        polygon: (color) => `<polygon points="0,3 3,0 6,3 6,17 3,20 0,17" style="fill:${color};stroke-width:0" />`
    },
    {
        style: { top: 28, left: 24 },
        attributes: { width: 6, height: 20 },
        polygon: (color) => `<polygon points="0,3 3,0 6,3 6,17 3,20 0,17" style="fill:${color};stroke-width:0" />`
    },
    {
        style: { top: 47, left: 5 },
        attributes: { width: 20, height: 6 },
        polygon: (color) => `<polygon points="3,0 0,3 3,6 17,6 20,3 17,0" style="fill:${color};stroke-width:0" />`
    },
    {
        style: { top: 28 },
        attributes: { width: 6, height: 20 },
        polygon: (color) => `<polygon points="0,3 3,0 6,3 6,17 3,20 0,17" style="fill:${color};stroke-width:0" />`
    },
    {
        style: { top: 5 },
        attributes: { width: 6, height: 20 },
        polygon: (color) => `<polygon points="0,3 3,0 6,3 6,17 3,20 0,17" style="fill:${color};stroke-width:0" />`
    },
    {
        style: { top: 24, left: 5 },
        attributes: { width: 20, height: 6 },
        polygon: (color) => `<polygon points="3,0 0,3 3,6 17,6 20,3 17,0" style="fill:${color};stroke-width:0" />`
    }
];
const LCD_NUMBERS = [
    [1,1,1,1,1,1,0],
    [0,1,1,0,0,0,0],
    [1,1,0,1,1,0,1],
    [1,1,1,1,0,0,1],
    [0,1,1,0,0,1,1],
    [1,0,1,1,0,1,1],
    [1,0,1,1,1,1,1],
    [1,1,1,0,0,0,0],
    [1,1,1,1,1,1,1],
    [1,1,1,1,0,1,1],
    [0,0,0,0,0,0,0]
];

const camelToDash = (str) => str.replace(/([A-Z])/g, (_, cap) => `-${cap.toLowerCase()}`);
const padLeft = (str, len, char) => `${Array.apply(null, Array(Math.max(0, len - str.length))).map(() => char).join('')}${str}`;
const setStyle = (element, style = {}) => element.style.cssText = Object.keys(style).map(key => `${camelToDash(key)}:${style[key]}${typeof style[key] === 'number'? 'px' : ''}`).join(';');
const getColor = (intensity) => `rgba(0,0,0,${0.2 + 0.6 * intensity / 100})`;
const getOpacity = (intensity) => `${0.2 + 0.6 * intensity / 100}`;

const createElement = (component, { style = {}, attributes = {} }, html) => {
    const element = document.createElement(component);
    setStyle(element, style);
    Object.keys(attributes).forEach(key => {
        element.setAttribute(key, attributes[key])
    });

    if(html) {
        element.innerHTML = html;
    }

    return element;
};

const createElementNS = (namespace, component, { style = {}, attributes = {} }, html) => {
    const element = document.createElementNS(namespace, component);
    setStyle(element, style);
    Object.keys(attributes).forEach(key => {
        element.setAttribute(key, attributes[key])
    });

    if(html) {
        element.innerHTML = html;
    }

    return element;
};

const createScreen = (canvas, {width, height, size}) => {
    setStyle(canvas, {
        position: 'relative',
        width: width * size,
        height: height * size
    });

    return Array.apply(null, Array(height)).map((_, i) =>
        Array.apply(null, Array(width)).map((_, j) => {
            const cell = createElement('div', {
                style: {
                    ...PIXEL_CSS,
                    width: size,
                    height: size,
                    top: i * size,
                    left: j * size,
                    opacity: getOpacity(0)
                }
            }, PIXEL);
            canvas.appendChild(cell);

            return cell;
        })
    );
};

const createLCD = (canvas, { size, color = "#000", scale = 50 }) => {
    canvas.style.cssText = `display:flex;justify-content:flex-start;transform: scale(${scale}%);`;
    return Array.apply(null, Array(size)).map(() => {
        const lcd = createElement('div', {
            style: {
                position: 'relative',
                margin: '0 3px',
                minWidth: 30,
                width: 30,
                height: 53
            }
        });

        canvas.appendChild(lcd);
        return LCD_CELLS.map(({ style, attributes, polygon }) => {
            const cell = createElementNS('http://www.w3.org/2000/svg', 'svg', {
                attributes,
                style: {
                    position: 'absolute',
                    opacity: '0.5',
                    ...style
                }
            }, polygon(color));

            lcd.appendChild(cell);
            return cell;
        });
    })
};

class BrickScreen {
    constructor({ element, width = 10, height = 20, size = 15, minRefresh = 250, maxRefresh = 50 }) {
        this.width = width;
        this.height = height;
        this.size = size;
        this.minRefresh = minRefresh;
        this.maxRefresh = maxRefresh;
        this.element = element;
        this.display = createScreen(element, { width, height, size });
    }

    draw([ i, j ], intensity) {
        const style = (((this.display[i] || [])[j] || {}).style || {})
        const opacity = getOpacity(intensity);
        style.opacity = opacity;
    }

    fill(intensity) {
        this.display.forEach((row, i) => row.forEach((cell, j) => this.draw([i, j], intensity)));
    }

    matrix(str) {
        const intensities = { "#": 100, "*": 75, "+": 50, "%": 25 };
        str.split('\n').forEach((row, i) =>
            row.replace(/\s+/g, '').split('').forEach((cell, j) =>
                this.draw([ i, j ], intensities[cell] || 0)
            )
        )
    }
}

class BrickLCD {
    constructor({ element, size, color, scale }) {
        this.size = size;

        this.lcd = createLCD(element, { size, color, scale });
    }

    draw(number) {
        const chunks = padLeft(number.toString(), this.size, '-').split('');
        const len = chunks.length;

        chunks.forEach((chunk, index) => {
            const pos = this.size - (len - index);
            chunk = chunk === '-'? 10 : parseInt(chunk);
            LCD_NUMBERS[chunk].forEach((slot, index) => {
                this.lcd[pos][index].style.opacity = 0.1 + 0.8 * slot;
            });
        });
    }
}

class BrickText {
    constructor({ element }) {
        this.element = createElement('span', {
            style: {
                fontSize: 14,
                fontWeight: 'bold',
                fontFamily: 'sans-serif',
                textAlign: 'right',
                display: 'block',
                width: '100%',
                padding: '4px 0 12px'
            }
        });
        element.appendChild(this.element);
    }

    draw(html) {
        this.element.innerHTML = html;
    }
}

class BrickEvent {
    keys = { direction: undefined, action: false };

    static EVENTS = {
        UP: 'up',
        LEFT: 'left',
        RIGHT: 'right',
        DOWN: 'down',
        ACTION: 'action',
        PLAY: 'play',
        RESET: 'reset'
    };

    constructor() {
        this.subscribers = [];
    }

    push(key) {
        if([ BrickEvent.EVENTS.UP, BrickEvent.EVENTS.DOWN, BrickEvent.EVENTS.LEFT, BrickEvent.EVENTS.RIGHT ].includes(key)) {
            this.keys.direction = key;
        }

        if(BrickEvent.EVENTS.ACTION === key) {
            this.keys.action = true;
        }

        this.subscribers.forEach(fn => fn(this.keys));
    }

    release(key) {
        if(
            [ BrickEvent.EVENTS.UP, BrickEvent.EVENTS.DOWN, BrickEvent.EVENTS.LEFT, BrickEvent.EVENTS.RIGHT ].includes(key) &&
            this.keys.direction === key
        ) {
            this.keys.direction = undefined;
        }

        if(BrickEvent.EVENTS.ACTION === key) {
            this.keys.action = false;
        }

        this.subscribers.forEach(fn => fn(this.keys));
    }

    read(event) {
        return this.keys[event];
    }

    subscribe(fn, clear) {
        if(clear) { this.subscribers = []; }
        const hasSubscribed = this.subscribers.find(_fn => _fn === fn);
        if(!hasSubscribed) { this.subscribers.push(fn); }
    }

    unsubscribe(fn) {
        const index = this.subscribers.findIndex(_fn => _fn === fn);
        if(index >= 0) {
            this.subscribers.splice(index, 1);
        }
    }

    clear() {
        this.keys.direction = undefined;
        this.keys.action = false;
    }
}

class BrickGame {
    constructor({ name }) {
        this.name = name;
    }

    preview({ screen }) {}
    reset({ screen, score, events }) {}
    render ({ screen, events }) {}
    listen(keys) {}
    score({ type }) {}
};

class BrickScore {
    constructor({ element }) {
        this.element = element;
    }

    clear() {
        this.element.innerHTML = "";
    }

    register(label, type, options) {
        const content = createElement('div', {
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'inherit'
            }
        });
        content.appendChild(
            createElement('span', {
                style: {
                    fontFamily: 'sans-serif',
                    textAlign: 'right',
                    display: 'block',
                    width: '100%',
                    fontSize: 12
                }
            }, label)
        );
        this.element.appendChild(content);
        const element = createElement('div', {});
        content.appendChild(element);

        switch(type) {
            case 'screen':
                return new BrickScreen({ ...options, element });
            case 'lcd':
                return new BrickLCD({ ...options, element });
            case 'text':
                return new BrickText({ ...options, element });
        }
    }
}

class Brick {
    static REFRESH = {
        MIN: 250,
        MAX: 50
    };

    play = true;
    games = [];
    game = null;
    index = 0;

    constructor({ element, score }) {
        this.score = new BrickScore({ element: score });
        this.screen = new BrickScreen({ element });
        this.events = new BrickEvent();
        this.refresh = Brick.REFRESH.MIN;


        const refresh = () => {
            if(this.play || !this.game) {
                this.render();
            }

            setTimeout(refresh, !this.game? Brick.REFRESH.MIN / 2 : this.refresh);
        };

        refresh();
    }

    registerGame(name, Game) {
        this.games.push(new Game({ name }));
    }

    reset() {
        this.events.subscribe(() => null, true);
        this.game = null;
        this.index = 0;
    }

    togglePlay() {
        this.play = !this.play;
    }

    mount(game) {
        this.game = game;

        this.events.subscribe((keys) => {
            const data = this.game.listen(keys);
            if(data) {
                const { refresh } = data;

                if(refresh) {
                    this.refresh = refresh;
                }
            }
        }, true);
        this.score.clear();
        this.score.register('Game', 'text', {}).draw(game.name);
        this.game.reset({
            screen: this.screen,
            score: this.score
        });
    }

    render() {
        if(this.game) {
            this.game.render({
                screen: this.screen,
                events: this.events
            });
        }
        
        //-- Menu
        else if (this.games.length > 0) {
            this.games[this.index].preview({
                screen: this.screen
            });

            switch(this.events.read('direction')) {
                case BrickEvent.EVENTS.DOWN:
                    this.index = (this.index + 1) % this.games.length;
                    break;
                case BrickEvent.EVENTS.UP:
                    this.index = (this.index === 0? this.games.length : this.index) - 1;
            }

            if(this.events.read('action')) {
                this.mount(this.games[this.index]);
            }
        }
    }
}