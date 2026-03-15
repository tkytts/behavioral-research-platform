import React from "react";

import i18n from "../i18n";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="container mt-4">
          <div className="alert alert-danger" role="alert">
            <h4>{i18n.t("error_boundary_title")}</h4>
            <p>{i18n.t("error_boundary_message")}</p>
            <button className="btn btn-outline-danger" onClick={() => window.location.reload()}>
              {i18n.t("error_boundary_reload")}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;