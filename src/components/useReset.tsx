import { useState } from 'react'
import { Modal } from './common'
import { useForecast } from '../store/forecast'

/** Guards a path/level change that would wipe edited assumptions. */
export function useResetGuard() {
  const [pending, setPending] = useState<null | (() => void)>(null)
  const edited = useForecast((s) =>
    s.assumptions.some((a) => a.value || a.source || a.comment || a.id.startsWith('custom-')),
  )
  const request = (apply: () => void) => (edited ? setPending(() => apply) : apply())
  const dialog = (
    <Modal
      open={!!pending}
      onClose={() => setPending(null)}
      title="Reset assumptions?"
      footer={
        <>
          <button className="btn" onClick={() => setPending(null)}>Keep current choice</button>
          <button className="btn btn-primary" onClick={() => { pending?.(); setPending(null) }}>
            Change and reset
          </button>
        </>
      }
    >
      <p className="text-muted">
        Changing the start point or level rebuilds the assumptions table for the new combination.
        The values you entered will be cleared.
      </p>
    </Modal>
  )
  return { request, dialog }
}
