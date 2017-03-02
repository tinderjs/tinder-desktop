/**
 * This file exists to pull in all the vendor code from node_modules.
 * Eventually this should disappear as the rest of the codebase is moved to
 * commonjs rather than implicity relying on libraries to be loaded in the
 * global scope.
 */

require('angular');
require('angular-sanitize');
require('angular-translate');
require('ng-autocomplete');
require('ng-range-slider');
require('angular-route');
require('angular-translate-loader-static-files');
/**
 * Neither jQuery or moment expose themselves to the window when imported via
 * commonjs. Explicitly set them here.
 */
window.jQuery = window.$ = require('jquery');
window.moment = require('moment');
require('mousetrap');
