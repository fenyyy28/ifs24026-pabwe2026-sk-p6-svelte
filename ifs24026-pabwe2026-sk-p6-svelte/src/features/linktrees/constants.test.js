import { describe, it, expect } from 'vitest'
import { LINK_TREE_TYPES, typeLabel } from './constants.js'

describe('constants', () => {
  it('memuat tiga tipe', () => expect(LINK_TREE_TYPES.map((t) => t.value)).toEqual(['public', 'unlisted', 'private']))
  it('typeLabel memetakan nilai ke label', () => {
    expect(typeLabel('public')).toBe('Publik')
    expect(typeLabel('unlisted')).toBe('Tidak Terdaftar')
    expect(typeLabel('private')).toBe('Privat')
  })
  it('typeLabel mengembalikan nilai asli jika tidak dikenal', () => {
    expect(typeLabel('lain')).toBe('lain')
  })
})
