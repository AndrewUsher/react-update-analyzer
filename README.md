# React Update Analyzer

`React Update Analyzer` is a HOF that monkey patches React and notifies you in the console when **potentially** unnecessary re-renders occur.

### Setup

This library is available on npm, install it with: `npm install --save @drewster/react-update-analyzer` or `yarn add @drewster/react-update-analyzer`.

### Usage

```js
import React from 'react'

if (process.env.NODE_ENV !== 'production') {
  const { updateAnalyzer } = require('@drewster/react-update-analyzer')
  updateAnalyzer(React)
}
```

#### Options

Optionally you can pass in options as a second parameter. The following options are available:

- `include: [RegExp]`
- `exclude: [RegExp]`
- `groupByComponent: boolean`
- `collapseComponentGroups: boolean`
- `notifier: (groupByComponent: boolean, collapseComponentGroups: boolean, displayName: string, diffs: [Object]) => void`

##### include / exclude

You can include or exclude components by their displayName with the `include` and `exclude` options

```js
updateAnalyzer(React, { include: [/^pure/], exclude: [/^Connect/] })
```

##### groupByComponent / collapseComponentGroups

By default, the changes for each component are grouped by component and these groups collapsed. This can be changed with the `groupByComponent` and `collapseComponentGroups` options:

```js
updateAnalyzer(React, {
  groupByComponent: true,
  collapseComponentGroups: false
})
```

##### notifier

A notifier can be provided if the official one does not suit your needs.

```js
const notifier = (
  groupByComponent,
  collapseComponentGroups,
  displayName,
  diffs
) => {
  diffs.forEach(({ name, prev, next, type }) => {})
}
updateAnalyzer(React, { notifier })
```

### Common Update Problems

#### Value Did Not Change

If you receive the below message:

```
Comp.[props || state]: Value did not change. Avoidable re-render!`
```

`Comp`, it means was rerendered even though the object is the same:

```js
prevProps === props && prevState === state
```

Usually renders are caused because of the rendering of their father, or state change.
In both cases, at least one of the two would change, at least by reference.

If both the state and the props are the same object, it means the render was
caused by `this.forceUpdate()` or `ReactDom.render()`:

#### Not Equal by Reference

If you receive the message:

```
"X" property is not equal by reference.
```

This means it received a new object with the same value. For example:

```js
const a = { c: 'd' }
const b = { c: 'd' }
a !== b
```

To avoid this warning, make sure to not recreate objects:

```js
const a = { c: 'd' }
const b = a
a === b
```

#### Changes Are in Functions Only

If you receive the message:

```
Changes are in functions only. Possibly avoidable re-render?
```

It's probably because you are creating a function inside render:

```js
render(){
  return <div fn={function something(){...}}/>
}
```

And this triggers a re-render because:

```js
function something(){...} !== function something(){...}
```

You can avoid it by binding this function in advance and then reusing it on all renders

```js
constructor(props){
  super(props)
  this.something = this.something.bind(this)
}
something(){
  ...
}
render(){
  return <div fn={this.something}/>
}
```
