import { classifyDiff, DIFF_TYPES } from './deepDiff'
import { getDisplayName } from './getDisplayName'
import { normalizeOptions } from './normalizeOptions'
import { shouldInclude } from './shouldInclude'

const memoized = (map, key, fn) => {
  if (map.has(key)) {
    return map.get(key)
  }
  let ret = fn()
  map.set(key, ret)
  return ret
}

function createComponentDidUpdate (displayName, opts) {
  return function componentDidUpdate (prevProps, prevState) {
    const propsDiff = classifyDiff(
      prevProps,
      this.props,
      `${displayName}.props`
    )
    if (propsDiff.type === DIFF_TYPES.UNAVOIDABLE) {
      return
    }

    const stateDiff = classifyDiff(
      prevState,
      this.state,
      `${displayName}.state`
    )
    if (stateDiff.type === DIFF_TYPES.UNAVOIDABLE) {
      return
    }
    opts.notifier(
      opts.groupByComponent,
      opts.collapseComponentGroups,
      displayName,
      [propsDiff, stateDiff]
    )
  }
}

// Creates a wrapper for a React class component
const createClassComponent = (ctor, displayName, opts) => {
  let cdu = createComponentDidUpdate(displayName, opts)
  let CustomClassComp = class extends ctor {
    componentDidUpdate (prevProps, prevState, snapshot) {
      cdu.call(this, prevProps, prevState)
      if (typeof ctor.prototype.componentDidUpdate === 'function') {
        ctor.prototype.componentDidUpdate.call(
          this,
          prevProps,
          prevState,
          snapshot
        )
      }
    }
  }
  CustomClassComp.displayName = displayName
  return CustomClassComp
}

const createFunctionalComponent = (ctor, displayName, opts, ReactComponent) => {
  let cdu = createComponentDidUpdate(displayName, opts)
  let CustomFuncComp = class extends ReactComponent {
    render () {
      return ctor(this.props, this.context)
    }
    componentDidUpdate (prevProps, prevState, snapshot) {
      cdu.call(this, prevProps, prevState, snapshot)
    }
  }
  Object.assign(CustomFuncComp, ctor, {
    displayName
  })

  return CustomFuncComp
}

export const updateAnalyzer = (React, opts = {}) => {
  opts = normalizeOptions(opts)
  let customCreateElement = React.createElement
  const memo = new Map()
  React.createElement = function (type, ...rest) {
    let ctor = type
    const displayName = getDisplayName(ctor)
    if (typeof ctor === 'function' && shouldInclude(displayName, opts)) {
      if (ctor.prototype && typeof ctor.prototype.render === 'function') {
        ctor = memoized(memo, ctor, () =>
          createClassComponent(ctor, displayName, opts)
        )
      } else {
        ctor = memoized(memo, ctor, () =>
          createFunctionalComponent(ctor, displayName, opts, React.Component)
        )
      }
    }
    return customCreateElement.apply(React, [ctor, ...rest])
  }

  React.__UPDATE_ANALYZER_RESTORE_FN__ = () => {
    React.createElement = customCreateElement
    delete React.__UPDATE_ANALYZER_RESTORE_FN__
  }

  return React
}

export default updateAnalyzer
