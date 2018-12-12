function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import { classifyDiff, DIFF_TYPES } from './deepDiff';
import { getDisplayName } from './getDisplayName';
import { normalizeOptions } from './normalizeOptions';
import { shouldInclude } from './shouldInclude';

var memoized = function memoized(map, key, fn) {
  if (map.has(key)) {
    return map.get(key);
  }
  var ret = fn();
  map.set(key, ret);
  return ret;
};

function createComponentDidUpdate(displayName, opts) {
  return function componentDidUpdate(prevProps, prevState) {
    var propsDiff = classifyDiff(prevProps, this.props, displayName + '.props');
    if (propsDiff.type === DIFF_TYPES.UNAVOIDABLE) {
      return;
    }

    var stateDiff = classifyDiff(prevState, this.state, displayName + '.state');
    if (stateDiff.type === DIFF_TYPES.UNAVOIDABLE) {
      return;
    }
    opts.notifier(opts.groupByComponent, opts.collapseComponentGroups, displayName, [propsDiff, stateDiff]);
  };
}

// Creates a wrapper for a React class component
var createClassComponent = function createClassComponent(ctor, displayName, opts) {
  var cdu = createComponentDidUpdate(displayName, opts);
  var CustomClassComp = function (_ctor) {
    _inherits(CustomClassComp, _ctor);

    function CustomClassComp() {
      _classCallCheck(this, CustomClassComp);

      return _possibleConstructorReturn(this, _ctor.apply(this, arguments));
    }

    CustomClassComp.prototype.componentDidUpdate = function componentDidUpdate(prevProps, prevState, snapshot) {
      cdu.call(this, prevProps, prevState);
      if (typeof ctor.prototype.componentDidUpdate === 'function') {
        ctor.prototype.componentDidUpdate.call(this, prevProps, prevState, snapshot);
      }
    };

    return CustomClassComp;
  }(ctor);
  CustomClassComp.displayName = displayName;
  return CustomClassComp;
};

var createFunctionalComponent = function createFunctionalComponent(ctor, displayName, opts, ReactComponent) {
  var cdu = createComponentDidUpdate(displayName, opts);
  var CustomFuncComp = function (_ReactComponent) {
    _inherits(CustomFuncComp, _ReactComponent);

    function CustomFuncComp() {
      _classCallCheck(this, CustomFuncComp);

      return _possibleConstructorReturn(this, _ReactComponent.apply(this, arguments));
    }

    CustomFuncComp.prototype.render = function render() {
      return ctor(this.props, this.context);
    };

    CustomFuncComp.prototype.componentDidUpdate = function componentDidUpdate(prevProps, prevState, snapshot) {
      cdu.call(this, prevProps, prevState, snapshot);
    };

    return CustomFuncComp;
  }(ReactComponent);
  Object.assign(CustomFuncComp, ctor, {
    displayName: displayName
  });

  return CustomFuncComp;
};

export var updateAnalyzer = function updateAnalyzer(React) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  opts = normalizeOptions(opts);
  var customCreateElement = React.createElement;
  var memo = new Map();
  React.createElement = function (type) {
    var ctor = type;
    var displayName = getDisplayName(ctor);
    if (typeof ctor === 'function' && shouldInclude(displayName, opts)) {
      if (ctor.prototype && typeof ctor.prototype.render === 'function') {
        ctor = memoized(memo, ctor, function () {
          return createClassComponent(ctor, displayName, opts);
        });
      } else {
        ctor = memoized(memo, ctor, function () {
          return createFunctionalComponent(ctor, displayName, opts, React.Component);
        });
      }
    }

    for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      rest[_key - 1] = arguments[_key];
    }

    return customCreateElement.apply(React, [ctor].concat(rest));
  };

  React.__UPDATE_ANALYZER_RESTORE_FN__ = function () {
    React.createElement = customCreateElement;
    delete React.__UPDATE_ANALYZER_RESTORE_FN__;
  };

  return React;
};

export default updateAnalyzer;