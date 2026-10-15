import { describe, it, expect, vi, afterEach } from 'vitest'
import { getToken, setToken, removeToken, apiRequest } from './apiHelper.js'

const BASE = 'https://open-api.delcom.org/api/v1'

function mockFetch({ ok = true, status = 200, json } = {}) {
  const fn = vi.fn().mockResolvedValue({
    ok,
    status,
    json: json ?? (() => Promise.resolve({ status: 'success', data: { x: 1 } })),
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => vi.unstubAllGlobals())

describe('token', () => {
  it('set, get, dan remove token', () => {
    expect(getToken()).toBeNull()
    setToken('abc')
    expect(getToken()).toBe('abc')
    removeToken()
    expect(getToken()).toBeNull()
  })
})

describe('apiRequest', () => {
  it('GET tanpa token dan tanpa body', async () => {
    const f = mockFetch()
    const res = await apiRequest('/link-trees')
    const [url, opts] = f.mock.calls[0]
    expect(url).toBe(`${BASE}/link-trees`)
    expect(opts.method).toBe('GET')
    expect(opts.body).toBeUndefined()
    expect(opts.headers.Authorization).toBeUndefined()
    expect(opts.headers['Content-Type']).toBe('application/json')
    expect(res.data.x).toBe(1)
  })

  it('menyertakan token dan body JSON', async () => {
    setToken('abc')
    const f = mockFetch()
    await apiRequest('/x', { method: 'POST', body: { a: 1 } })
    const opts = f.mock.calls[0][1]
    expect(opts.headers.Authorization).toBe('Bearer abc')
    expect(opts.body).toBe(JSON.stringify({ a: 1 }))
  })

  it('tidak mengirim token jika auth false', async () => {
    setToken('abc')
    const f = mockFetch()
    await apiRequest('/x', { auth: false })
    expect(f.mock.calls[0][1].headers.Authorization).toBeUndefined()
  })

  it('tidak mengirim token jika belum login', async () => {
    const f = mockFetch()
    await apiRequest('/x')
    expect(f.mock.calls[0][1].headers.Authorization).toBeUndefined()
  })

  it('mengirim FormData tanpa Content-Type dan tanpa stringify', async () => {
    const f = mockFetch()
    const form = new FormData()
    form.append('photo', 'x')
    await apiRequest('/x', { method: 'POST', body: form })
    const opts = f.mock.calls[0][1]
    expect(opts.body).toBe(form)
    expect(opts.headers['Content-Type']).toBeUndefined()
  })

  it('melempar pesan dari server', async () => {
    mockFetch({ ok: false, status: 400, json: () => Promise.resolve({ message: 'Gagal' }) })
    await expect(apiRequest('/x')).rejects.toThrow('Gagal')
  })

  it('menggabungkan pesan dengan detail validasi', async () => {
    mockFetch({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        status: 'fail',
        message: 'Data tidak valid',
        data: { field: { title: ['Judul wajib'], type: ['Tipe salah'] } },
      }),
    })
    await expect(apiRequest('/x')).rejects.toThrow('Data tidak valid: Judul wajib Tipe salah')
  })

  it('pesan cadangan jika respons bukan JSON', async () => {
    mockFetch({ ok: false, status: 500, json: () => Promise.reject(new Error('bad')) })
    await expect(apiRequest('/x')).rejects.toThrow('Request gagal (500)')
  })

  it('gagal jika status "fail" walau HTTP ok', async () => {
    mockFetch({ json: () => Promise.resolve({ status: 'fail', message: 'Ditolak' }) })
    await expect(apiRequest('/x')).rejects.toThrow('Ditolak')
  })
})
