import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Modal from './Modal'

describe('Modal', () => {
  it('renders its children when open', () => {
    render(
      <Modal open onClose={() => {}}>
        <p>Dialog content</p>
      </Modal>
    )
    expect(screen.getByText('Dialog content')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    render(
      <Modal open={false} onClose={() => {}}>
        <p>Dialog content</p>
      </Modal>
    )
    expect(screen.queryByText('Dialog content')).not.toBeInTheDocument()
  })

  it('calls onClose when clicking outside the dialog card', () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose}>
        <p>Dialog content</p>
      </Modal>
    )
    // The dialog's parent is the full-screen wrapper that centers it — clicking
    // it directly (not through the card) simulates a click in the empty space
    // around the card, which previously did nothing (the bug fixed this session).
    const dialog = screen.getByRole('dialog')
    fireEvent.click(dialog.parentElement)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when clicking inside the dialog card', () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose}>
        <p>Dialog content</p>
      </Modal>
    )
    fireEvent.click(screen.getByText('Dialog content'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose on Escape', () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose}>
        <p>Dialog content</p>
      </Modal>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
