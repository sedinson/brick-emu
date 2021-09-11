const PIECES = [
    [
        [1],
        [1],
        [1],
        [1]
    ], [
        [1,1],
        [1,1]
    ], [
        [1,1],
        [1,0],
        [1,0]
    ], [
        [1,1],
        [0,1],
        [0,1]
    ], [
        [1,1,0],
        [0,1,1]
    ], [
        [0,1,1],
        [1,1,0]
    ], [
        [1,1,1],
        [0,1,0]
    ]
];

class Piece {
    constructor({ piece, pos = [0, 0] }) {
        this.piece = [...PIECES[piece]];
        this.index = piece;
        this.direction = [1, 0];
        this.counter = 0;
        this.pos = pos;
    }

    draw(screen, scenario) {
        const [y, x] = this.pos;
        let piece = this.piece.map((row, i) => row.map((cell, j) => Math.max(cell, y+i >= 0? scenario[y+i][x+j] || 0 : 0)));
        screen.fromMatrix(piece, this.pos);
    }

    displace(direction) {
        this.direction[1] = direction;
    }

    move({ width, refresh }) {
        const [y, x] = this.pos;
        const [i, j] = this.direction;
        this.pos = [y + i, Math.max(Math.min(width - this.piece[0].length, x + j), 0)];
        this.counter = (this.counter + 1) % refresh;
        this.direction = [this.counter === 0? 1 : 0, 0];
    }

    collide({ height, scenario }) {
        const [i, j] = this.pos;
        if(i + this.piece.length >= height) {
            return true;
        }

        return this.piece.some((row, y) => row.some((cell, x) => i+y+1 >= 0 && scenario[i+y+1][j+x] === 1 && cell === 1));
    }

    rotate() {
        let piece = [...this.piece];
        this.piece = Array.apply(0, Array(piece[0].length)).map((_, j) => {
            return Array.apply(0, Array(piece.length)).map((_, i) => {
                return Math.max(piece[i][piece[0].length - j - 1], 0);
            });
        });
    }

    static random(pos = [-3, 4]) {
        return new Piece({
            piece: parseInt(PIECES.length * Math.random()),
            pos
        });
    }
}

class Tetris extends BrickGame {
    preview({ screen }) {
        screen.fromString(
            `..........
            ...###....
            ...#..#...
            ...#..#...
            ...###....
            ...#..#...
            ...#..#...
            ...###....
            ..........
            ..........
            ..........
            ..........
            ..........
            .....#....
            .....##...
            ......#...
            ..#.......
            ..###.....
            ..#.###..#
            ###.#####.`
        );
    }

    render({ screen, events }) {
        screen.fill(0);
        screen.fromMatrix(this.scenario);

        this.current.draw(screen, this.scenario);
        this.current.move({
            width: screen.width,
            refresh: this.refresh
        });
        
        if(this.current.collide({ height: screen.height, scenario: this.scenario })) {
            const [i, j] = this.current.pos;
            this.current.piece.forEach((row, y) => {
                row.forEach((cell, x) => {
                    if(i + y >= 0) {
                        this.scenario[i + y][j + x] = Math.max(cell, this.scenario[i + y][j + x] || 0);
                    }
                })
            });
            this.current = new Piece({
                piece: this.next.index,
                pos: [-3, 4]
            });
            this.next = Piece.random();

            this.score++;
            this.points.draw(this.score * 3);
            this.level.draw(1 + parseInt(this.score / 10));
        }

        //-- Next piece
        this.scNext.fill(0);
        this.scNext.fromMatrix(this.next.piece, [
            parseInt((this.scNext.height - this.next.piece.length) / 2),
            parseInt((this.scNext.width - this.next.piece[0].length) / 2)
        ]);
    }

    listen({ direction, action }) {
        switch(direction) {
            case BrickEvent.EVENTS.LEFT:
                this.current.displace(-1);
                break;
            case BrickEvent.EVENTS.RIGHT:
                this.current.displace(1);
                break;
        }

        if(action) {
            this.current.rotate();
        }

        return {
            refresh: Brick.REFRESH.MAX
        };
    }

    reset({ screen, score }) {
        screen.fill(0);

        this.scenario = Array.apply(0, Array(screen.height)).map(() => Array.apply(0, Array(screen.width)));
        this.score = 0;
        this.refresh = 8;

        this.current = Piece.random();
        this.next = Piece.random();

        this.scNext = score.register('Next', 'screen', {
            width: 5,
            height: 4,
            size: 10
        });
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

        return { refresh: Brick.REFRESH.MAX };
    }
}