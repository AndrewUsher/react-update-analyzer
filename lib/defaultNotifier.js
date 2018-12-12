'use strict';

exports.__esModule = true;
exports.defaultNotifier = undefined;

var _deepDiff = require('./deepDiff');

var defaultNotifier = exports.defaultNotifier = function defaultNotifier(groupByComponent, collapseComponentGroups, displayName, diffs) {
  if (groupByComponent && collapseComponentGroups) {
    console.groupCollapsed(displayName);
  } else if (groupByComponent) {
    console.group(displayName);
  }

  diffs.forEach(notifyDiff);

  if (groupByComponent) {
    console.groupEnd();
  }
};

var notifyDiff = function notifyDiff(_ref) {
  var name = _ref.name,
      prev = _ref.prev,
      next = _ref.next,
      type = _ref.type;

  switch (type) {
    case _deepDiff.DIFF_TYPES.SAME:
      console.warn(name + ': Value is the same (equal by reference). Avoidable re-render!');
      console.log('Value:', prev);
      break;
    case _deepDiff.DIFF_TYPES.EQUAL:
      console.warn(name + ': Value did not change. Avoidable re-render!');
      console.log('Before:', prev);
      console.log('After:', next);

      if (prev && next) {
        Object.keys(prev).forEach(function (key) {
          if (prev[key] !== next[key]) {
            console.log('"' + key + '" property is not equal by reference');
          }
        });
      }
      break;
    case _deepDiff.DIFF_TYPES.FUNCTIONS:
      console.warn(name + ': Changes are in functions only. Possibly avoidable re-render?');
      console.log('Functions before:', prev);
      console.log('Functions after:', next);
      break;
  }
};