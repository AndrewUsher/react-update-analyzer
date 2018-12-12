import React from 'react';
import { hot } from 'react-hot-loader';

const InnerComponent = () => <div>React Update Analyzer, please open your console :P</div>;

class ClassDemo extends React.Component {
  render() {
    return (
      <div>
        <InnerComponent />
      </div>
    );
  }
}

export default hot(module)(ClassDemo);
