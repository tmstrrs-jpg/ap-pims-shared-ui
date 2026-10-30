// Workspace shell (W1, moved from the PM Portal) and the phone pieces (W6a).
// The Shell tests mirror the portal's src/workspace/__tests__/shell.test.jsx so the two copies behave the same.
import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Shell, Paper, Sheet, StatusLine, deskReducer, emptyDesk, wordDelay, BARS, EASE_PANEL, PANEL_MS, BAR, MAX_OPEN_PAPERS } from '../index.js'

afterEach(() => { cleanup(); vi.useRealTimers(); delete window.matchMedia })

describe('Shell (parity with the portal copy)', () => {
  const panels = { index: <p>menu</p>, dashboard: <p>dash</p>, job: <p>job</p>, mine: ({ close }) => <button onClick={close}>done</button> }
  it('has four bars with no text, each opening its own panel; opening one closes the other; Esc closes', () => {
    render(<Shell panels={panels}><p>table</p></Shell>)
    const bars = ['index', 'dashboard', 'job', 'mine'].map((k) => screen.getByTestId(`ws-bar-${k}`))
    for (const b of bars) expect(b.textContent).toBe('')
    fireEvent.click(bars[0])
    expect(screen.getByTestId('ws-panel-index').dataset.open).toBe('true')
    fireEvent.click(bars[1])
    expect(screen.getByTestId('ws-panel-index').dataset.open).toBe('false')
    expect(screen.getByTestId('ws-panel-dashboard').dataset.open).toBe('true')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByTestId('ws-panel-dashboard').dataset.open).toBe('false')
  })
  it('hands focus back to the bar that opened the panel', () => {
    vi.useFakeTimers()
    render(<Shell panels={panels}><p>table</p></Shell>)
    const bar = screen.getByTestId('ws-bar-mine')
    fireEvent.click(bar)
    fireEvent.click(screen.getByText('done'))
    act(() => { vi.runAllTimers() })
    expect(document.activeElement).toBe(bar)
  })
  it('uses the canvas colours and motion from the one tokens file', () => {
    expect([BARS.left.color, BARS.top.color, BARS.right.color, BARS.bottom.color]).toEqual(['#7A3E3B', '#9A8546', '#3F5A75', '#4F6E52'])
    expect([EASE_PANEL, PANEL_MS, BAR.thick, BAR.hover, BAR.hoverMs]).toEqual(['cubic-bezier(.2,.8,.2,1)', 450, 14, 24, 250])
  })
  it('the copied files match the portal source they name, apart from the documented changes', () => {
    const dir = path.resolve(process.cwd(), 'src/workspace')
    for (const f of ['tokens.js', 'shellStyle.js', 'deskState.js', 'unfold.js', 'Shell.jsx', 'workspace.css']) {
      expect(fs.readFileSync(path.join(dir, f), 'utf8'), f).toMatch(/ap-pims-pm-portal src\/workspace\/.* @ ece372b7/)
    }
    expect(fs.readFileSync(path.join(dir, 'Shell.jsx'), 'utf8').replace(/\/\/.*$/gm, '')).not.toMatch(/lucide-react|import ".\/workspace.css"/)
  })
})

describe('desk state', () => {
  it('keeps at most two papers open; the oldest goes back to the cards', () => {
    let s = emptyDesk
    for (const id of ['a', 'b', 'c']) s = deskReducer(s, { type: 'open', id })
    expect(MAX_OPEN_PAPERS).toBe(2)
    expect(s.open).toEqual(['b', 'c'])
    expect(deskReducer(s, { type: 'putBack', id: 'b' }).open).toEqual(['c'])
  })
  it('word delays stay within 85-110 ms', () => {
    for (let i = 0; i < 40; i++) { expect(wordDelay(i)).toBeGreaterThanOrEqual(85); expect(wordDelay(i)).toBeLessThanOrEqual(110) }
  })
})

describe('Paper', () => {
  it('is an article named by its heading, with no label above the heading', () => {
    render(<Paper title="My Day" testId="p"><p>body</p></Paper>)
    const art = screen.getByRole('article', { name: 'My Day' })
    expect(art.firstElementChild.tagName).toBe('H1')
  })
})

describe('StatusLine', () => {
  it('says one sentence in a live region and renders real buttons for its actions', () => {
    const retry = vi.fn()
    render(<StatusLine text="2 changes waiting for signal." tone="waiting" actions={[{ id: 'retry', label: 'Retry', onClick: retry }]} />)
    expect(screen.getByRole('status').textContent).toBe('2 changes waiting for signal.')
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(retry).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('ws-status').dataset.tone).toBe('waiting')
  })
  it('renders nothing without text, and disables its actions while busy', () => {
    const { container, rerender } = render(<StatusLine text="" />)
    expect(container.innerHTML).toBe('')
    rerender(<StatusLine text="Sending" busy actions={[{ id: 'retry', label: 'Retry', onClick: () => {} }]} />)
    expect(screen.getByRole('button', { name: 'Retry' }).disabled).toBe(true)
  })
})

describe('Sheet', () => {
  function Harness({ onClose }) {
    return <Sheet open title="Switch project" onClose={onClose}><button>Alpha</button><button>Beta</button></Sheet>
  }
  it('is a labelled modal dialog that focuses its first control', () => {
    render(<Harness onClose={() => {}} />)
    const dialog = screen.getByRole('dialog', { name: 'Switch project' })
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(document.activeElement.textContent).toBe('')            // the Close button comes first
    expect(document.activeElement.getAttribute('aria-label')).toBe('Close')
  })
  it('closes on Esc, on the scrim and on Close', () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    fireEvent.click(document.querySelector('.ws-bsheet-scrim'))
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(3)
  })
  it('keeps Tab inside the sheet', () => {
    render(<Harness onClose={() => {}} />)
    const beta = screen.getByRole('button', { name: 'Beta' })
    beta.focus()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab' })
    expect(document.activeElement.getAttribute('aria-label')).toBe('Close')
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(beta)
  })
  it('hands focus back to the opener after it closes', () => {
    vi.useFakeTimers()
    window.matchMedia = () => ({ matches: false })
    function Opener() {
      const [open, setOpen] = React.useState(false)
      return <><button onClick={() => setOpen(true)}>Open</button><Sheet open={open} title="T" onClose={() => setOpen(false)}><button>x</button></Sheet></>
    }
    render(<Opener />)
    const opener = screen.getByRole('button', { name: 'Open' })
    opener.focus()
    fireEvent.click(opener)
    expect(screen.getByRole('dialog')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    act(() => { vi.runAllTimers() })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(opener)
  })
})

describe('no pop-ups and 44 px targets', () => {
  const dir = path.resolve(process.cwd(), 'src/workspace')
  it('has no alert(), confirm() or prompt() under src/workspace', () => {
    for (const f of fs.readdirSync(dir).filter((f) => /\.(jsx?|mjs)$/.test(f))) {
      const src = fs.readFileSync(path.join(dir, f), 'utf8').replace(/\/\/.*$/gm, '')
      expect(src, f).not.toMatch(/(^|[^\w.])(window\.)?(alert|confirm|prompt)\s*\(/)
    }
  })
  it('the phone controls are at least 44 px tall', () => {
    const css = fs.readFileSync(path.join(dir, 'workspace.css'), 'utf8')
    for (const sel of ['.ws-status-btn', '.ws-bsheet-close', '.ws-phone-project']) {
      const rule = css.slice(css.indexOf(`${sel} {`)).split('}')[0]
      expect(rule, sel).toMatch(/(min-height|height): 44px/)
    }
    expect(css.slice(css.indexOf('.ws-pick {')).split('}')[0]).toMatch(/min-height: 56px/)
  })
})

import React from 'react'
