import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export type ArenaSize = 'normal' | 'wide' | 'full'

// Panel widths. The page shifts by exactly this amount when the panel opens.
// eslint-disable-next-line react-refresh/only-export-components
export const ARENA_WIDTHS: Record<ArenaSize, string> = {
  normal: 'min(440px, 100vw)',
  wide: 'min(900px, 60vw)',
  full: '100vw',
}

type ArenaCtx = {
  open: boolean
  size: ArenaSize
  setSize: (s: ArenaSize) => void
  openArena: () => void
  closeArena: () => void
  toggleArena: () => void
}

const ArenaContext = createContext<ArenaCtx | null>(null)

export function ArenaProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [size, setSize] = useState<ArenaSize>('normal')

  const openArena = useCallback(() => setOpen(true), [])
  const closeArena = useCallback(() => setOpen(false), [])
  const toggleArena = useCallback(() => setOpen((v) => !v), [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <ArenaContext.Provider
      value={{ open, size, setSize, openArena, closeArena, toggleArena }}
    >
      {children}
    </ArenaContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useArena() {
  const ctx = useContext(ArenaContext)
  if (!ctx) throw new Error('useArena must be used inside ArenaProvider')
  return ctx
}