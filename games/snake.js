class Serpent {
    constructor() {
        this.reset();
        this.canChangeDir = true;
    }

    reset() {
        this.body = [ [10, 4], [10, 5], [10, 6] ];
        this.direction = [0, -1];
    }

    move({ width, height }) {
        this.lastChunk = [ ...this.body[this.body.length - 1] ];

        const [ [i, j] ] = this.body;
        let i_ = i + this.direction[0];
        let j_ = j + this.direction[1];
        let _i = null;
        let _j = null;

        if((i_ < 0 || i_>= height) || (j_ < 0 || j_ >= width) || this.collide(i_, j_)) {
            //Collide
            this.canChangeDir = false;
        } else {
            for (const chunk of this.body) {
                [_i, _j] = chunk;
                chunk[0] = i_;
                chunk[1] = j_;
                i_ = _i;
                j_ = _j;
            }

            this.canChangeDir = true;
        }
    }

    collide(i, j) {
        return this.body.some(([_i, _j]) => _i === i && _j === j);
    }

    draw(screen) {
        if(this.lastChunk) {
            screen.draw(this.lastChunk, 0);
        }

        for(const chunk of this.body) {
            screen.draw(chunk, 100);
        }
    }

    setDirection (direction) {
        if(this.canChangeDir) {
            ({
                [BrickEvent.EVENTS.LEFT]: () => this.direction[1] === 0 && this.direction.splice(0, 2, ...[0, -1]),
                [BrickEvent.EVENTS.UP]: () => this.direction[0] === 0 && this.direction.splice(0, 2, ...[-1, 0]),
                [BrickEvent.EVENTS.RIGHT]: () => this.direction[1] === 0 && this.direction.splice(0, 2, ...[0, 1]),
                [BrickEvent.EVENTS.DOWN]: () => this.direction[0] === 0 && this.direction.splice(0, 2, ...[1, 0])
            }[direction] || (() => null))();
            this.canChangeDir = false;
        }
    }

    eat(apple) {
        const [i, j] = apple.position();
        const [_i, _j] = this.body[0];
        if(_i === i && _j === j) {
            this.body.push([i, j]);
            return true;
        }

        return false;
    }
}

class Apple {
    constructor({ snake }) {
        this.snake = snake;
    }

    position() {
        return this.pos;
    }

    random({ width, height }) {
        let validPosition = false;
        let i, j;
        while (!validPosition) {
            i = parseInt(Math.random() * height);
            j = parseInt(Math.random() * width);
            validPosition = !this.snake.collide(i, j);
        }

        this.pos = [ i, j ];
    }

    draw(screen) {
        screen.draw(this.pos, 100);
    }
};

class Snake extends BrickGame {
    preview({ screen }) {
        screen.fromString(
            `..........
            ....##....
            ...#..#...
            ...#..#...
            ...####...
            ...#..#...
            ...#..#...
            ...#..#...
            ..........
            ..........
            ..........
            ..........
            ..........
            ..........
            ...###.#..
            ...#......
            ..##......
            ..........
            ..........
            ..........`
        );
    }

    constructor({ name }) {
        super({ name });
        this.snake = new Serpent();
        this.apple = new Apple({
            snake: this.snake
        });
    }

    render({ screen }) {
        this.snake.draw(screen);
        this.apple.draw(screen);

        this.snake.move({
            width: screen.width,
            height: screen.height
        });

        if(this.snake.eat(this.apple)) {
            this.score++;
            this.points.draw(this.score * 3);
            this.level.draw(1 + parseInt(this.score / 10));
            this.apple.random({
                width: screen.width,
                height: screen.height
            });
        }
    }

    listen({ direction, action }) {
        if(direction) {
            this.snake.setDirection(direction);
        }

        if(action) {
            return {
                refresh: Brick.REFRESH.MAX
            };
        }

        return {
            refresh: Math.max(
                Brick.REFRESH.MAX, Brick.REFRESH.MIN - (parseInt(this.score / 10) * 50)
            )
        };
    }

    reset({ screen, score }) {
        screen.fill(0);
        this.snake.reset();
        this.apple.random({
            width: screen.width,
            height: screen.height
        });
        this.score = 0;
        this.points = score.register('Points', 'lcd', {
            size: 5,
            color: "#000",
            scale: 40
        });
        this.level = score.register('Level', 'lcd', {
            size: 5,
            color: "#000",
            scale: 40
        });
        this.points.draw(0);
        this.level.draw(1);
    }
}