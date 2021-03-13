const projectFolder = "dist";
const sourceFolder = "src";
const fs = require('fs')

const path = {
  build: {
    html: projectFolder + '/',
    css: projectFolder + '/css/',
    img: projectFolder + '/img/',
    fonts: projectFolder + '/fonts/',
    favicons: projectFolder + '/favicon/'
  },
  src: {
    html: [sourceFolder + '/*.html', '!' + sourceFolder + '/_*.html'],
    css: sourceFolder + '/scss/style.scss',
    img: sourceFolder + '/img/**/*.{jpg,png,svg,gif,icon,webp}',
    fonts: sourceFolder + '/fonts/*.ttf',
    favicons: sourceFolder + '/favicon/*.{png,xml,ico,svg,webmanifest}'
  },
  watch: {
    html: sourceFolder + '/**/*.html',
    css: sourceFolder + '/scss/**/*.scss',
    img: sourceFolder + '/img/**/*.{jpg,png,svg,gif,icon,webp}'
  },
  clean: "./" + projectFolder + "/"
}

const gulp = require('gulp'),
  { src, dest } = gulp,
  browsersync = require('browser-sync').create(),
  fileinclude = require('gulp-file-include'),
  del = require('del'),
  scss = require('gulp-sass'),
  autoprefixer = require('gulp-autoprefixer'),
  groupmedia = require('gulp-group-css-media-queries'),
  cleancss = require('gulp-clean-css'),
  rename = require('gulp-rename'),
  imagemin = require('gulp-imagemin'),
  webp = require('gulp-webp'),
  webphtml = require('gulp-webp-html'),
  webpcss = require('gulp-webpcss'),
  ttf2woff = require('gulp-ttf2woff'),
  ttf2woff2 = require('gulp-ttf2woff2');

const html = () => {
  return src(path.src.html)
    .pipe(fileinclude())
    .pipe(webphtml())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream())
}

const favicons = () => {
  return src(path.src.favicons)
    .pipe(dest(path.build.favicons))
}

const images = () => {
  return src(path.src.img)
    .pipe(
      webp({
        quality: 100
      })
    )
    .pipe(dest(path.build.img))
    .pipe(src(path.src.img))
    .pipe(
      imagemin({
        progressive: true,
        svgoPlugins: [{
          removeViewBox: false
        }],
        interlaced: true,
        optimizationLevel: 3
      })
    )
    .pipe(dest(path.build.img))
    .pipe(browsersync.stream())
}

const css = () => {
  return src(path.src.css)
    .pipe(
      scss({
        outputStyle: 'expanded'
      })
    )
    .pipe(groupmedia())
    .pipe(
      autoprefixer({
        overrideBrowserslist: ['last 5 versions'],
        cascade: true
      })
    )
    .pipe(webpcss())
    .pipe(dest(path.build.css))
    .pipe(cleancss())
    .pipe(
      rename({
        extname: '.min.css'
      })
    )
    .pipe(dest(path.build.css))
    .pipe(browsersync.stream())
}

const fonts = () => {
  src(path.src.fonts)
    .pipe(ttf2woff())
    .pipe(dest(path.build.fonts))
  return src(path.src.fonts)
    .pipe(ttf2woff2())
    .pipe(dest(path.build.fonts))
}

const browserSync = () => {
  browsersync.init({
    server: {
      baseDir: "./" + projectFolder + "/"
    },
    port: 3200,
    notify: false
  })
}

const fontsStyle = () => {
  const fileContent = fs.readFileSync(sourceFolder + '/scss/fonts.scss')
  if (fileContent == '') {
    fs.writeFile(sourceFolder + '/scss/fonts.scss', '')
    return fs.readdir(path.build.fonts, (err, items) => {
      if (items) {
        let cFontname;
        for (var i = 0; i < items.length; i += 1) {
          const fontname = items[i].split('.')
          [ fontname ] = fontname
          if (cFontname != fontname) {
            fs.appendFile(sourceFolder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n')
          }
          cFontname = fontname
        }
      }
    })
  }
}

const watchFiles = () => {
  gulp.watch([path.watch.html], html)
  gulp.watch([path.watch.css], css)
  gulp.watch([path.watch.img], images)
}

const clean = () => del(path.clean)

const build = gulp.series(clean, gulp.parallel(css, html, images, fonts, favicons), fontsStyle)
const watch = gulp.parallel(build, watchFiles, browserSync);

exports.favicons = favicons;
exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;