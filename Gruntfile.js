module.exports = function(grunt) {
  'use strict'
  require('load-grunt-tasks')(grunt)
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    // we could just concatenate everything, really
    // but we like to have it the complex way.
    // also, in this way we do not have to worry
    // about putting files in the correct order
    // (the dependency tree is walked by r.js)
    sass: {
      options: {
        sourceMap: true,
        outputStyle: 'compressed',
      },
      dist: {
        files: {
          // 'destination': 'source'
          'build/style.css': 'src/style.scss',
        },
      },
    },
    postcss: {
      options: {
        map: true,
        processors: [
          require('autoprefixer')({
            browsers: ['last 2 versions', 'ie >= 11', 'iOS >= 6'],
          }),
        ],
      },
      dist: {
        src: ['build/*.css'],
      },
    },
    watch: {
      styles: {
        files: ['src/*.scss'],
        tasks: ['sass', 'postcss'],
      },
    },
  })

  grunt.registerTask('compile', ['sass', 'postcss'])
  grunt.registerTask('default', ['watch'])
}
