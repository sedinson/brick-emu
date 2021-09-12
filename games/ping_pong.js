class Player {
    constructor({ pos }) {
        this.pos = pos;
    }

    position() {
        return this.pos;
    }

    move({ direction, width }) {
        const [, j] = this.pos;

        if(direction < 0 && j > 0) {
            this.pos[1] = j - 1;
        }

        if(direction > 0 && j + 3 < width) {
            this.pos[1] = j + 1;
        }
    }

    draw(screen) {
        const [ i, j ] = this.pos;
        for(let k=0; k<3; k++) {
            screen.draw([i, j+k], 100);
        }
    }

    collide([i, j], height) {
        const [y, x] = this.pos;
        //-- COMPUTER
        if(y === 1) {
            if(i === 2 && (j >= x && j < x+3)) {
                return true;
            }
        }

        //-- PLAYER
        else {
            if(i === height - 3 && (j >= x && j < x+3)) {
                return true;
            }
        }

        return false;
    }
}

class Pong {
    constructor({ pos, direction }) {
        this.restart({ pos, direction });
    }

    restart({ pos, direction }) {
        this.pos = pos;
        this.direction = direction;
    }

    draw(screen) {
        screen.draw(this.pos, 100);
    }

    position([i, j]) {
        this.pos = [i, j];
    }

    start([i, j]) {
        this.direction = [ i, j ];
    }

    move({ width, height, player1, player2 }) {
        const [y, x] = this.pos;
        let [i, j] = this.direction;

        //-- horizontal vector:
        if(j < 0 && x <= 0) {
            j = 1;
        }
        if(j > 0 && x >= width -1) {
            j = -1;
        }

        if(player1.collide(this.pos, height)) {
            i = 1;
        } else if(player2.collide(this.pos, height)) {
            i = -1;
        }

        this.pos = [y + i, x + j];
        this.direction = [i, j];

        //-- Decidir quien pierde en el movimiento:
        return y <= 0? 0 : (y >= height -1? 1 : -1);
    }
}

class PingPong extends BrickGame {
    set = false;
    direction = 0;
    turn = 1;

    preview({ screen }) {
        screen.fromString(
            `..........
            ....###...
            ...#......
            ...#......
            ....###...
            ...#......
            ...#......
            ....###...
            ..........
            ..........
            ++++++++++
            ..........
            ..........
            ..........
            ..........
            ..#.......
            ..........
            ..........
            .....###..
            ..........`
        );
    }

    render({ screen, events }) {
        if(this.gameOver) {
            return;
        }

        screen.fromString(
            `..........
            ..........
            ..........
            ..........
            ..........
            ..........
            ..........
            ..........
            ..........
            ++++++++++
            ..........
            ..........
            ..........
            ..........
            ..........
            ..........
            ..........
            ..........
            ..........
            ..........`
        );

        if(!this.set) {
            if(this.turn === 0) {
                const [i, j] = this.com.pos;
                this.pong.position([i+1, j+1]);
            } else {
                const [i, j] = this.player.pos;
                this.pong.position([i-1, j+1]);
            }
        }

        this.com.draw(screen);
        this.player.draw(screen);
        this.pong.draw(screen);

        //-- Player
        this.player.move({
            direction: this.direction,
            width: screen.width
        });
        this.direction = 0;

        //-- Pong
        const lost = this.pong.move({
            width: screen.width,
            height: screen.height,
            player1: this.com,
            player2: this.player
        });

        if(lost >= 0) {
            this.set = false;
            this.turn = lost;

            if(lost === 0) {
                this.score++;
                this.points.draw(this.score);
                this.level.draw(parseInt(this.score / 10) + 1);
                this.pong.position([ this.com.pos[0] + 1, this.com.pos[1] +1 ]);
                this.pong.start([1, Math.round(Math.random()) === 1? 1 : -1]);
                this.set = true;
            } else {
                this.lives--;
                this.live.draw(this.lives);
                if(this.lives <= 0) {
                    this.gameOver = true;
                }
            }
        }
        
        //-- Si se está en el lado de la pantalla de COMPUTER, hacer que se mueva solo hacia el pong
        else if(this.pong.direction[0] === -1 && this.pong.pos[0] < parseInt(screen.height / 3)) {
            const [ , jPlayer ] = this.com.pos;
            const [ , jPong ] = this.pong.pos;
            this.com.move({
                direction: jPong - (jPlayer + 1),
                width: screen.width
            });
        }
    }

    listen({ action, direction }) {
        /**
         * Cuando no se esta en set, guardar la ultima direction a la que se movio
         * para luego usarlo en la direccion a la que se lanzara el pong
         */
        if([BrickEvent.EVENTS.LEFT, BrickEvent.EVENTS.RIGHT].includes(direction)) {
            this.lastDirection = direction === BrickEvent.EVENTS.LEFT? -1 : 1;
            switch(direction) {
                case BrickEvent.EVENTS.LEFT:
                    this.direction = -1;
                    break;
                case BrickEvent.EVENTS.RIGHT:
                    this.direction = 1;
                    break;
            }
        }

        /**
         * Si se presiona el boton de accion estando en set, aumentar velocidad, sino iniciar set
         */
        if(action) {
            if(this.set) {
                return {
                    refresh: Brick.REFRESH.MAX
                };
            }

            if(!this.set && this.turn === 1) {
                this.pong.position([this.player.pos[0]-1, this.player.pos[1]+1]);
                this.pong.start([-1, this.lastDirection]);
                this.set = true;
            }
        }

        return {
            refresh: Math.max(
                Brick.REFRESH.MAX, Brick.REFRESH.MIN - (parseInt(this.score / 10) * 50)
            )
        };
    }

    reset({ screen, score }) {
        screen.fill(0);
        this.pong = new Pong({ pos: [0, 0], direction: [0, 0] });
        this.com = new Player({ pos: [1, 3] });
        this.player = new Player({ pos: [18, 3] });

        this.score = 0;
        this.lives = 3;
        this.lastDirection = -1;
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
        this.live = score.register('Lives', 'lcd', {
            size: 5,
            color: "#000",
            scale: 40
        });
        this.points.draw(0);
        this.level.draw(1);
        this.live.draw(this.lives);
    }
}