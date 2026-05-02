import React from 'react'

interface State { error: Error | null }

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
          <p className="text-red-400 text-lg font-semibold">Что-то пошло не так</p>
          <pre className="text-xs text-slate-400 bg-slate-900 p-4 rounded-lg max-w-lg overflow-auto text-left whitespace-pre-wrap">
            {this.state.error.message}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm"
          >
            Попробовать снова
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
