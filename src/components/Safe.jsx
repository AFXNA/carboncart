import { Component } from "react";

// Error boundary: if a WebGL/Three component throws (e.g. no GPU), show `fallback` instead of a blank page.
export default class Safe extends Component {
  state = { err: null };
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err) { console.error("[Safe]", err); }
  render() {
    if (!this.state.err) return this.props.children;
    const { fallback } = this.props;
    return fallback ?? (
      <pre style={{ whiteSpace: "pre-wrap", padding: 16, color: "#b91c1c" }}>{String(this.state.err.stack || this.state.err)}</pre>
    );
  }
}
