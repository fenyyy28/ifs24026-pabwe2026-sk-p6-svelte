import { describe, it, expect } from 'vitest'
import {
  formatDate, isValidUrl, isValidEmail, resolveAssetUrl, resolveCoverUrl,
} from './toolsHelper.js'

describe('formatDate', () => {
  it('mengembalikan "-" jika kosong', () => {
    expect(formatDate('')).toBe('-')
    expect(formatDate(null)).toBe('-')
  })
  it('memformat tanggal ke bahasa Indonesia', () => {
    expect(formatDate('2026-10-14T05:00:00Z')).toContain('Oktober')
    expect(formatDate('2026-10-14T05:00:00Z')).toContain('2026')
  })
})

describe('isValidUrl', () => {
  it('menerima URL valid', () => expect(isValidUrl('https://delcom.org')).toBe(true))
  it('menolak URL tidak valid', () => expect(isValidUrl('bukan url')).toBe(false))
})

describe('isValidEmail', () => {
  it('memeriksa format email', () => {
    expect(isValidEmail('ifs24026@students.del.ac.id')).toBe(true)
    expect(isValidEmail('salah@')).toBe(false)
    expect(isValidEmail('a b@c.d')).toBe(false)
  })
})

describe('resolveAssetUrl', () => {
  it('string kosong jika tidak ada path', () => {
    expect(resolveAssetUrl('')).toBe('')
    expect(resolveAssetUrl(undefined)).toBe('')
  })
  it('mempertahankan URL absolut', () => {
    expect(resolveAssetUrl('http://x.com/a.png')).toBe('http://x.com/a.png')
    expect(resolveAssetUrl('HTTPS://x.com/a.png')).toBe('HTTPS://x.com/a.png')
  })
  it('melengkapi path relatif dengan origin API', () => {
    expect(resolveAssetUrl('img/a.png')).toBe('https://open-api.delcom.org/img/a.png')
    expect(resolveAssetUrl('/img/a.png')).toBe('https://open-api.delcom.org/img/a.png')
  })
})

describe('resolveCoverUrl', () => {
  it('kosong untuk cover kosong atau URL dasar', () => {
    expect(resolveCoverUrl(null)).toBe('')
    expect(resolveCoverUrl('http://localhost:8000/')).toBe('')
  })
  it('mengembalikan URL untuk cover valid', () => {
    expect(resolveCoverUrl('img/c.png')).toBe('https://open-api.delcom.org/img/c.png')
  })
})
