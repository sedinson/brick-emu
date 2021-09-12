const MIN_REFRESH = 8;

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

    move({ width, height, refresh, scenario }) {
        const [y, x] = this.pos;
        const [i, j] = this.direction;
        const collide = this.collide({ height, scenario, direction: j });

        this.pos = [y + i, Math.max(Math.min(width - this.piece[0].length, x + (collide? 0 : j)), 0)];
        this.counter = (this.counter + 1) % refresh;
        this.direction = [this.counter === 0? 1 : 0, 0];
    }

    collide({ height, scenario, direction = 0 }) {
        const [i, j] = this.pos;
        if(i + this.piece.length >= height) {
            return true;
        }

        return this.piece.some((row, y) => row.some((cell, x) => i+y+1 >= 0 && scenario[i+y+1][j+x+direction] === 1 && cell === 1));
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
        if(this.gameOver) {
            return;
        }

        this.current.draw(screen, this.scenario);
        this.current.move({
            width: screen.width,
            height: screen.height,
            scenario: this.scenario,
            refresh: this.refresh
        });
        
        //-- Validar si la pieza toca el escenario o llega al final
        if(this.current.collide({ height: screen.height, scenario: this.scenario })) {
            //-- Copiar la pieza al escenario
            const [i, j] = this.current.pos;
            this.current.piece.forEach((row, y) => {
                row.forEach((cell, x) => {
                    if(i + y >= 0) {
                        this.scenario[i + y][j + x] = Math.max(cell, this.scenario[i + y][j + x] || 0);
                    }
                });
            });

            //-- Establecer la pieza anterior como la siguiente
            this.current = new Piece({
                piece: this.next.index,
                pos: [-3, 4]
            });

            //-- Obtener una pieza siguiente (Aleatoria)
            this.next = Piece.random();

            //-- Verificar el escenario si hay puntuacion
            this.scenario.forEach((row, i) => {
                if(!row.some(cell => (cell || 0) === 0)) {
                    this.scenario.splice(i, 1);
                    this.scenario.unshift(Array.apply(0, Array(screen.width)));

                    //-- Agregar un punto por linea borrada
                    this.score++;
                    this.points.draw(this.score * 3);
                    this.level.draw(1 + parseInt(this.score / 10));
                }
            });

            //-- Validar si es el fin del juego
            this.gameOver = this.scenario[0].some(cell => cell === 1);
        }

        //-- Next piece
        this.scNext.fill(0);
        this.scNext.fromMatrix(this.next.piece, [
            parseInt((this.scNext.height - this.next.piece.length) / 2),
            parseInt((this.scNext.width - this.next.piece[0].length) / 2)
        ]);
    }

    listen({ direction, action }) {
        this.refresh = Math.max(MIN_REFRESH - parseInt(this.score / 10), 1);

        switch(direction) {
            case BrickEvent.EVENTS.LEFT:
                this.current.displace(-1);
                break;
            case BrickEvent.EVENTS.RIGHT:
                this.current.displace(1);
                break;
            case BrickEvent.EVENTS.DOWN:
                this.refresh = 1;
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
        this.refresh = MIN_REFRESH;
        this.gameOver = false;

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