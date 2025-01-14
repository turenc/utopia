/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* @flow */
import * as React from 'react'
import { Component } from 'react'
import CodeBlock from './StackFrameCodeBlock'
import { getPrettyURL } from '../utils/getPrettyURL'
import { darkGray } from '../styles'

import { StackFrame as StackFrameType } from '../utils/stack-frame'
import { ErrorLocation } from '../utils/parseCompileError'
import { CursorPosition } from '../../../components/code-editor/code-editor-utils'

const linkStyle = {
  fontSize: '0.9em',
  marginBottom: '0.9em',
}

const anchorStyle = {
  textDecoration: 'none',
  color: darkGray,
  cursor: 'pointer',
}

const codeAnchorStyle = {
  cursor: 'pointer',
}

const toggleStyle = {
  marginBottom: '1.5em',
  color: darkGray,
  cursor: 'pointer',
  border: 'none',
  display: 'block',
  width: '100%',
  textAlign: 'left',
  background: '#fff',
  fontFamily: 'Consolas, Menlo, monospace',
  fontSize: '1em',
  padding: '0px',
  lineHeight: '1.5',
} as const

type Props = {
  frame: StackFrameType
  contextSize: number
  critical: boolean
  showCode: boolean
  editorHandler: (errorLoc: ErrorLocation) => void
  onOpenFile: (path: string, cursorPosition: CursorPosition | null) => void
}

type State = {
  compiled: boolean
}

class StackFrame extends Component<Props, State> {
  state = {
    compiled: false,
  }

  toggleCompiled = () => {
    this.setState((state) => ({
      compiled: !state.compiled,
    }))
  }

  getErrorLocation(): ErrorLocation | null {
    const { _originalFileName: fileName, _originalLineNumber: lineNumber } = this.props.frame
    // Unknown file
    if (!fileName) {
      return null
    }
    // e.g. "/path-to-my-app/webpack/bootstrap eaddeb46b67d75e4dfc1"
    const isInternalWebpackBootstrapCode = fileName.trim().indexOf(' ') !== -1
    if (isInternalWebpackBootstrapCode) {
      return null
    }
    // Code is in a real file
    return { fileName, lineNumber: lineNumber || 1 }
  }

  editorHandler = () => {
    const errorLoc = this.getErrorLocation()
    if (!errorLoc) {
      return
    }
    this.props.editorHandler(errorLoc)
  }

  onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      this.editorHandler()
    }
  }

  onErrorClick = (event: React.MouseEvent<HTMLSpanElement>) => {
    const filename = this.props.frame._originalFileName
    const line = this.props.frame._originalLineNumber
    const column = this.props.frame._originalColumnNumber
    if (filename != null && line != null && column != null) {
      const cursorPositon = {
        line: line,
        column: column,
      }
      this.props.onOpenFile(filename, cursorPositon)
    }
  }

  render() {
    const { frame, contextSize, critical, showCode } = this.props
    const {
      fileName,
      lineNumber,
      columnNumber,
      _scriptCode: scriptLines,
      _originalFileName: sourceFileName,
      _originalLineNumber: sourceLineNumber,
      _originalColumnNumber: sourceColumnNumber,
      _originalScriptCode: sourceLines,
    } = frame
    const functionName = frame.getFunctionName()

    const compiled = this.state.compiled
    const url = getPrettyURL(
      sourceFileName,
      sourceLineNumber,
      sourceColumnNumber,
      fileName,
      lineNumber,
      columnNumber,
      compiled,
    )

    let codeBlockProps = null
    if (showCode) {
      if (compiled && scriptLines && scriptLines.length !== 0 && lineNumber != null) {
        codeBlockProps = {
          lines: scriptLines,
          lineNum: lineNumber,
          columnNum: columnNumber!,
          contextSize,
          main: critical,
        }
      } else if (!compiled && sourceLines && sourceLines.length !== 0 && sourceLineNumber != null) {
        codeBlockProps = {
          lines: sourceLines,
          lineNum: sourceLineNumber,
          columnNum: sourceColumnNumber!,
          contextSize,
          main: critical,
        }
      }
    }

    const canOpenInEditor = this.getErrorLocation() !== null && this.props.editorHandler !== null
    return (
      <div>
        <div>{functionName}</div>
        <div style={linkStyle}>
          <span
            style={canOpenInEditor ? anchorStyle : undefined}
            onClick={this.onErrorClick}
            onKeyDown={canOpenInEditor ? this.onKeyDown : undefined}
            tabIndex={canOpenInEditor ? 0 : undefined}
          >
            {url}
          </span>
        </div>
        {codeBlockProps && (
          <span>
            <span
              onClick={canOpenInEditor ? this.editorHandler : undefined}
              style={canOpenInEditor ? codeAnchorStyle : undefined}
            >
              <CodeBlock {...codeBlockProps} />
            </span>
            <button style={toggleStyle} onClick={this.toggleCompiled}>
              {'View ' + (compiled ? 'source' : 'compiled')}
            </button>
          </span>
        )}
      </div>
    )
  }
}

export default StackFrame
