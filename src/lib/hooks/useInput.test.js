import { describe, it, expect } from 'vitest'
import { get } from 'svelte/store'
import { useInput } from './useInput.js'

describe('useInput', () => {
  it('nilai awal default kosong', () => {
    const { value } = useInput()
    expect(get(value)).toBe('')
  })

  it('bisa diubah dan di-reset ke nilai awal', () => {
    const { value, reset } = useInput('awal')
    value.set('baru')
    expect(get(value)).toBe('baru')
    reset()
    expect(get(value)).toBe('awal')
  })
})
