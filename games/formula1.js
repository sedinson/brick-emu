class Formula1 extends BrickGame {
    preview({ screen }) {
        screen.fromString(
            `..........
            .....##...
            ....#.....
            ...#......
            ...#......
            ...#......
            ....#.....
            .....##...
            ..........
            ..........
            ..........
            ..........
            #.....#..#
            #....###.#
            #.....#..#
            .....#.#..
            ...#......
            #.###....#
            #..#.....#
            #.#.#....#`
        );
    }

    render({ screen, events }) {}

    reset({ screen, score }) {
        screen.fill(0);

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