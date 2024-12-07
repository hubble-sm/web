const gulp = require("gulp");
const sass = require("gulp-sass")(require("sass"));

// Task to clean the public/css directory
gulp.task("clean-css", async function () {
  const del = (await import("del")).deleteAsync; // Dynamically import `del` ESM
  return del(["public/css/**/*"]);
});

// Task to compile all Sass files
gulp.task("sass", function () {
  return gulp.src("src/sass/**/*.scss") // Match all .scss files in src/sass and subdirectories
    .pipe(sass().on("error", sass.logError)) // Compile Sass and log errors if any
    .pipe(gulp.dest("public/css")); // Output compiled CSS to public/css
});

// Default task: Clean CSS folder, compile Sass, and exit
gulp.task("default", gulp.series("clean-css", "sass", function (done) {
  console.log("✅ All old CSS files deleted and new Sass files compiled successfully.");
  done(); // Mark the task as complete
}));
