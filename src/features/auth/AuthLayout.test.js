import { describe, it, expect } from 'vitest'
import { createRawSnippet } from 'svelte'
import { render, screen } from '@testing-library/svelte'
import AuthLayout from './AuthLayout.svelte'

describe('AuthLayout', () => {
  it('menampilkan teks pengenal, judul, dan isi', () => {
    const children = createRawSnippet(() => ({ render: () => '<p>form di sini</p>' }))
    render(AuthLayout, { title: 'Masuk', children })
    expect(screen.getByRole('heading', { level: 1, name: 'Delcom Link Tree' })).toBeInTheDocument()
    expect(screen.getByText(/Kumpulkan semua tautan/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Masuk' })).toBeInTheDocument()
    expect(screen.getByText('form di sini')).toBeInTheDocument()
    expect(screen.getAllByLabelText('Delcom Link Tree')).toHaveLength(2)
  })
})
