import { Component, type ErrorInfo, type ReactNode } from 'react'

interface RecoverOnErrorProps {
  onError: () => void
  children: ReactNode
}

/** If a screen crashes, log it and start a new visit instead of leaving the terminal black. */
export class RecoverOnError extends Component<RecoverOnErrorProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[terminal] screen crashed, restarting the visit', error, info.componentStack)
    this.props.onError()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
