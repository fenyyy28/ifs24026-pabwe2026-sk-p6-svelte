import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import LinkLogo from './LinkLogo.svelte'

describe('LinkLogo', () => {
  it('memakai ukuran dan warna default', () => {
    render(LinkLogo)
    const svg = screen.getByLabelText('Delcom Link Tree')
    expect(svg).toHaveAttribute('width', '28')
    expect(svg).toHaveAttribute('stroke', 'currentColor')
    expect(svg.querySelectorAll('path')).toHaveLength(2)
  })

  it('menerima ukuran dan warna kustom', () => {
    render(LinkLogo, { size: 64, color: '#ff0000' })
    const svg = screen.getByLabelText('Delcom Link Tree')
    expect(svg).toHaveAttribute('height', '64')
    expect(svg).toHaveAttribute('stroke', '#ff0000')
  })
})
