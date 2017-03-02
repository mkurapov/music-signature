const gulp = require('gulp');
const rename = require('gulp-rename');
const babel = require('gulp-babel');
const bs = require('browser-sync').create();
const livereload = require('gulp-livereload');


gulp.task('default', () => {

    // bs.init({
    //     port: 8080,
    //     proxy: {
    //         target: "192.168.1.68:8081",
    //         ws: true
    //     }
    // });

    gulp.watch(['app.js','public/**/*.*'], ['babel'],() => {
        livereload.listen();
    });
});

gulp.task('babel', () => {

    gulp.src('public/js/music-signature-es6.js')
        .pipe(babel({
            presets: ['es2015', 'babili']
        }))
        .pipe(rename('music-signature.js'))
        .pipe(gulp.dest('public/js'))
        .pipe(livereload());

    console.log('babeled');
});

