import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Button from "@mui/material/Button";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Keeps a failure of the page from leaving it blank: it says what failed, and offers
 * to load the page again
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <Alert
        severity="error"
        sx={{ m: 2 }}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={() => window.location.reload()}>
            Reload
          </Button>
        }>
        <AlertTitle>The showcase stopped</AlertTitle>
        {error.message}
      </Alert>
    );
  }
}

export default ErrorBoundary;
