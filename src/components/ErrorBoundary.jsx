import { Component } from 'react';

// Catches an error thrown while drawing its children (a figure config the
// renderer cannot draw, a KaTeX string it chokes on) and shows `fallback`
// in their place, so the rest of the page carries on. Without one, React
// unmounts the whole tree and the board goes blank in front of the class.
//
// `resetKey`: when it changes (a new question in the box) the boundary
// tries its children again. `fallback` may be a function of the error.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, resetKey: props.resetKey };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  // A new resetKey clears the error before the next render.
  static getDerivedStateFromProps(props, state) {
    return props.resetKey === state.resetKey ? null : { error: null, resetKey: props.resetKey };
  }

  componentDidCatch(error, info) {
    console.error(`Render failed${this.props.name ? `: ${this.props.name}` : ''}`, error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const { fallback } = this.props;
    return typeof fallback === 'function' ? fallback(error) : (fallback ?? null);
  }
}
