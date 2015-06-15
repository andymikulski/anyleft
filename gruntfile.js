// grunt dev
// grunt build (build-js, build-css)


module.exports = function(grunt) {

  var scriptSource = 'source/ts',
    scriptBuild = 'public/assets/js',
    scriptMin = 'public/assets/js/min',
    stylesSource = 'source/sass',
    stylesBuild = 'public/assets/css',
    viewsSource = 'source/views/',
    mainScript = 'app',

    // needed later
    requireMinScript = scriptMin + '/require.js';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    ts: {
      dev: {
        src: [scriptSource + '/' + mainScript + '.ts'],
        outDir: scriptBuild,
        options: {
          target: 'es5',
          module: 'amd',
          sourceMap: false,
          declaration: false,
          removeComments: false,
          noImplicitAny: false
        },
        reference: 'source/reference.ts'
      },

      prod: {
        src: [scriptSource + '/' + mainScript + '.ts'],
        outDir: scriptBuild,
        options: {
          target: 'es3',
          module: 'amd',
          sourceMap: false,
          declaration: false,
          removeComments: false,
          noImplicitAny: false,
          fast: 'never' // disable fast compile
        },
        reference: 'source/reference.ts'
      }
    },

    requirejs: {
      compile: {
        options: {
          'logLevel': 0,
          'findNestedDependencies': true,
          'baseUrl': scriptBuild,
          'name': 'main',
          'optimize': 'uglify2',
          'uglify2': {
            output: {
              beautify: false
            },
            compress: {
              sequences: true, // join consecutive statemets with the “comma operator”
              properties: true, // optimize property access: a['foo'] → a.foo
              dead_code: true, // discard unreachable code
              drop_debugger: true, // discard “debugger” statements
              unsafe: false, // some unsafe optimizations (see below)
              conditionals: true, // optimize if-s and conditional expressions
              comparisons: true, // optimize comparisons
              evaluate: true, // evaluate constant expressions
              booleans: true, // optimize boolean expressions
              loops: true, // optimize loops
              unused: true, // drop unused variables/functions
              hoist_funs: true, // hoist function declarations
              hoist_vars: true, // hoist variable declarations
              if_return: true, // optimize if-s followed by return/continue
              join_vars: true, // join var declarations
              cascade: true, // try to cascade `right` into `left` in sequences
              side_effects: true, // drop side-effect-free statements
              warnings: true, // warn about potentially dangerous optimizations/code
              global_defs: {} // global definitions
            },
            warnings: true,
            mangle: true
          },
          'out': scriptMin + '/' + mainScript + '.js'
        }
      }
    },

    tslint: {
      options: {
        configuration: {
          'rules': {
            'class-name': false, // disables strict PascalCase class names etc (disabled cause google.maps.d.ts was being a pain)
            'curly': true,
            'eofline': true,
            'forin': true,
            'indent': [true, 4],
            'label-position': true,
            'label-undefined': true,
            'max-line-length': [false, 140],
            'no-arg': true,
            'no-bitwise': true,
            'no-console': [true,
              'debug',
              'info',
              'trace'
            ],
            'no-construct': true,
            'no-debugger': true,
            'no-duplicate-key': true,
            'no-duplicate-variable': true,
            'no-empty': true,
            'no-eval': false,
            'use-strict': true, // dont think this actually works
            'no-string-literal': false, // lets us do window['whateva'] (since we cant do window.whateva)
            'no-trailing-whitespace': true,
            'no-unreachable': true,
            'one-line': [false],
            'quotemark': [true, 'single'],
            'radix': true,
            'semicolon': true,
            'triple-equals': [true, 'allow-null-check'],
            'variable-name': false,
            'whitespace': [false]
          }
        }
      },
      files: {
        src: [scriptSource + '/**/*.ts']
      }
    },

    concat: {
      options: {
        separator: ';',
      },
      dist: {
        files: {
          'public/js/min/require.js': [scriptSource + '/lib/require.js']
        }
      },
    },

    compass: {
      dev: {
        options: {
          config: 'config.rb',
        }
      },
      build: {
        options: {
          config: 'config.rb',
        }
      },
      clean: {
        options: {
          clean: true
        }
      }
    },

    watch: {
      js: {
        files: [scriptSource + '/**/*.ts'],
        tasks: ['tslint', 'ts:dev'],
        options: {
          livereload: true
        }
      },
      css: {
        files: [stylesSource + '/**/*.scss'],
        tasks: ['compass:dev'],
        options: {
          livereload: true
        }
      },
      hbs: {
        files: [viewsSource + '/**/*.hbs'],
        tasks: [],
        options: {
          livereload: true
        }
      }
    },

    bower_concat: {
      all: {
        dest: scriptBuild + '/lib/bower.js',
        cssDest: stylesBuild + '/bower.css',
        exclude: [],
        dependencies: {
          // 'underscore': 'jquery'
        },
        bowerOptions: {
          relative: false
        }
      }
    },

    // should only need to be run once, unless you start playing with breakpoints
    pure_grids: {
      'source/sass/_pure-grid.scss': 'this does nothing? okay then',
      options: {
        units: 24, // 12-column grid

        mediaQueries: {
          sm: 'screen and (min-width: 35.5em)', // 568px
          md: 'screen and (min-width: 48em)', // 768px
          lg: 'screen and (min-width: 64em)', // 1024px
          xl: 'screen and (min-width: 80em)' // 1280px
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-bower-concat');

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-ts');
  grunt.loadNpmTasks('grunt-contrib-compass');
  grunt.loadNpmTasks('grunt-tslint');
  grunt.loadNpmTasks('grunt-pure-grids');

  grunt.registerTask('bower', ['bower_concat']);

  grunt.registerTask('dev', ['tslint', 'ts:dev', 'compass:dev', 'watch']);
  grunt.registerTask('build', ['compass:clean', 'compass:build', 'tslint', 'ts:prod', 'requirejs:compile', 'concat']);
  grunt.registerTask('build-js', ['tslint', 'ts:prod', 'requirejs:compile', 'concat']);
  grunt.registerTask('build-css', ['compass:clean', 'compass:build']);
};