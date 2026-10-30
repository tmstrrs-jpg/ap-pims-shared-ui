// W8b · the shared Team Chat room list (Decision 2) and the Mine bar's count.
import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Shell, TeamChatRooms, useTeamChatRooms, mineRooms, summarize, unreadTotal, isAgentInbox, MINE_ROOMS_SHOWN } from '../index.js'

afterEach(() => cleanup())

const ME = 'u-me', ALEX = 'u-alex'
const ROOMS = [
  { room_id: 'r-dm', kind: 'dm', dm_key: `${ALEX}:${ME}`, name: null },
  { room_id: 'r-inbox', kind: 'dm', dm_key: `${ME}:${ME}`, name: 'Your agents' },
  { room_id: 'r-proj-b', kind: 'project', name: 'Lakeview Sidewalk Program' },
  { room_id: 'r-company', kind: 'company', name: 'Company' },
  { room_id: 'r-proj-a', kind: 'project', name: 'Harbor Blvd Streetscape' },
  { room_id: 'r-help', kind: 'help', name: null },
]
const DIRECTORY = { [ALEX]: { name: 'Alex Rivera' } }
// fn_chat_unread_summary rows (room_id, unread, mentions, last_message_at)
const SUMMARY_ROWS = [
  { room_id: 'r-proj-b', unread: 3, mentions: 1, last_message_at: '2026-10-30T15:00:00Z' },
  { room_id: 'r-inbox', unread: 2, mentions: 0, last_message_at: '2026-10-30T14:00:00Z' },
  { room_id: 'r-company', unread: 0, mentions: 0, last_message_at: null },
]

describe('rooms model', () => {
  it('the unread total is the sum of fn_chat_unread_summary rows, every room included', () => {
    const s = summarize(SUMMARY_ROWS)
    expect(unreadTotal(s)).toBe(5)
    expect(s.byRoom['r-proj-b']).toEqual({ unread: 3, mentions: 1, last_message_at: '2026-10-30T15:00:00Z' })
    expect(unreadTotal(null)).toBe(0)
  })
  it('lists every room except agent inboxes, unread first, then company, help, projects, DMs', () => {
    const rows = mineRooms({ rooms: ROOMS, directory: DIRECTORY, myId: ME, summary: summarize(SUMMARY_ROWS) })
    expect(rows.map((r) => r.room_id)).toEqual(['r-proj-b', 'r-company', 'r-help', 'r-proj-a', 'r-dm'])
    expect(rows.map((r) => r.label)).toEqual(['Lakeview Sidewalk Program', 'Company', 'Help', 'Harbor Blvd Streetscape', 'Alex Rivera'])
    expect(rows[0].unread).toBe(3)
    expect(isAgentInbox(ROOMS[1])).toBe(true)
  })
  it('is the same answer whatever order the rooms arrive in (two apps, one list)', () => {
    const a = mineRooms({ rooms: ROOMS, directory: DIRECTORY, myId: ME })
    const b = mineRooms({ rooms: [...ROOMS].reverse(), directory: DIRECTORY, myId: ME })
    expect(b).toEqual(a)
  })
})

describe('TeamChatRooms', () => {
  it('shows each room with its unread count and hands a tap to the host', () => {
    const onOpen = vi.fn()
    const rows = mineRooms({ rooms: ROOMS, directory: DIRECTORY, myId: ME, summary: summarize(SUMMARY_ROWS) })
    render(<TeamChatRooms rows={rows} onOpen={onOpen} />)
    const first = screen.getByRole('button', { name: 'Lakeview Sidewalk Program, 3 unread' })
    expect(first.textContent).toBe('Lakeview Sidewalk Program3')
    fireEvent.click(first)
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ room_id: 'r-proj-b' }))
    expect(screen.getByRole('button', { name: 'Company' })).toBeTruthy()
  })
  it('says loading, error and empty in words', () => {
    const { rerender } = render(<TeamChatRooms status="loading" />)
    expect(screen.getByText('Reading your rooms…')).toBeTruthy()
    rerender(<TeamChatRooms status="error" />)
    expect(screen.getByText('Your rooms could not be read just now.')).toBeTruthy()
    rerender(<TeamChatRooms status="ready" rows={[]} />)
    expect(screen.getByText('No rooms yet.')).toBeTruthy()
  })
  it('shows at most eight and points to the rest', () => {
    const many = Array.from({ length: 11 }, (_, i) => ({ room_id: `r${i}`, kind: 'project', label: `Room ${i}`, unread: 0 }))
    const onOpenAll = vi.fn()
    render(<TeamChatRooms rows={many} onOpen={() => {}} onOpenAll={onOpenAll} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(MINE_ROOMS_SHOWN)
    fireEvent.click(screen.getByRole('button', { name: 'All 11 rooms in Team Chat' }))
    expect(onOpenAll).toHaveBeenCalled()
  })
})

describe('useTeamChatRooms', () => {
  function Probe({ adapter, enabled }) {
    const s = useTeamChatRooms({ adapter, enabled })
    return <p data-testid="probe">{s.status}:{s.rooms.length}:{Object.keys(s.directory).length}</p>
  }
  it('reads rooms and names through the adapter only when enabled; it never asks for messages or marks read', async () => {
    const adapter = { listRooms: vi.fn(async () => ROOMS), loadDirectory: vi.fn(async () => DIRECTORY), markRead: vi.fn(), loadLatest: vi.fn() }
    const { rerender } = render(<Probe adapter={adapter} enabled={false} />)
    expect(screen.getByTestId('probe').textContent).toBe('idle:0:0')
    expect(adapter.listRooms).not.toHaveBeenCalled()
    rerender(<Probe adapter={adapter} enabled />)
    await waitFor(() => expect(screen.getByTestId('probe').textContent).toBe('ready:6:1'))
    expect(adapter.markRead).not.toHaveBeenCalled()
    expect(adapter.loadLatest).not.toHaveBeenCalled()
  })
  it('a directory failure only loses names; a room failure is an error', async () => {
    render(<Probe adapter={{ listRooms: async () => ROOMS, loadDirectory: async () => { throw new Error('x') } }} enabled />)
    await waitFor(() => expect(screen.getByTestId('probe').textContent).toBe('ready:6:0'))
    cleanup()
    render(<Probe adapter={{ listRooms: async () => { throw new Error('rls') } }} enabled />)
    await waitFor(() => expect(screen.getByTestId('probe').textContent).toBe('error:0:0'))
  })
})

describe('Shell counts', () => {
  it('shows a count beside the Mine bar and reads it out with the bar; the bar keeps no text; 0 shows nothing', () => {
    const { rerender } = render(<Shell panels={{}} counts={{ mine: { value: 4, label: '4 unread in Team Chat' } }}><p>t</p></Shell>)
    const bar = screen.getByTestId('ws-bar-mine')
    expect(bar.textContent).toBe('')
    expect(bar.getAttribute('aria-label')).toBe('Mine, 4 unread in Team Chat')
    expect(screen.getByTestId('ws-bar-count-mine').textContent).toBe('4')
    rerender(<Shell panels={{}} counts={{ mine: { value: 0 } }}><p>t</p></Shell>)
    expect(screen.queryByTestId('ws-bar-count-mine')).toBeNull()
    expect(screen.getByTestId('ws-bar-mine').getAttribute('aria-label')).toBe('Mine')
    rerender(<Shell panels={{}}><p>t</p></Shell>)
    expect(screen.queryByTestId('ws-bar-count-mine')).toBeNull()
  })
})

describe('no pop-ups', () => {
  it('the chat files use no alert, confirm or prompt', () => {
    const dir = path.resolve(process.cwd(), 'src/chat')
    for (const f of fs.readdirSync(dir)) {
      expect(fs.readFileSync(path.join(dir, f), 'utf8').replace(/\/\/.*$/gm, ''), f).not.toMatch(/\b(alert|confirm|prompt)\s*\(/)
    }
  })
})
