import { describe, it, expect } from 'vitest'
import { get } from 'svelte/store'
import {
  routes, normalizePath, matchRoute, resolveRoute, navigate, path,
} from './router.js'

describe('normalizePath', () => {
  it('membuang query, hash, dan slash akhir', () => {
    expect(normalizePath('/users/')).toBe('/users')
    expect(normalizePath('/users?x=1')).toBe('/users')
    expect(normalizePath('/users#a')).toBe('/users')
  })
  it('akar tetap "/" dan string kosong menjadi "/"', () => {
    expect(normalizePath('/')).toBe('/')
    expect(normalizePath('')).toBe('/')
    expect(normalizePath('/?a=1')).toBe('/')
  })
})

describe('matchRoute', () => {
  it('mencocokkan rute statis', () => {
    expect(matchRoute('/').route.name).toBe('home')
    expect(matchRoute('/auth/login').route.name).toBe('login')
    expect(matchRoute('/auth/register').route.name).toBe('register')
    expect(matchRoute('/users').route.name).toBe('users')
    expect(matchRoute('/profile/').route.name).toBe('profile')
  })
  it('mengekstrak parameter rute', () => {
    const m = matchRoute('/link-trees/42')
    expect(m.route.name).toBe('detail')
    expect(m.params).toEqual({ linkTreeId: '42' })
  })
  it('men-decode parameter, dan membiarkan yang rusak', () => {
    expect(matchRoute('/link-trees/a%20b').params.linkTreeId).toBe('a b')
    expect(matchRoute('/link-trees/%E0%A4%A').params.linkTreeId).toBe('%E0%A4%A')
  })
  it('path lain menjadi not-found', () => {
    expect(matchRoute('/ngawur').route.name).toBe('not-found')
    expect(matchRoute('/link-trees').route.name).toBe('not-found')
    expect(matchRoute('/link-trees/1/edit').route.name).toBe('not-found')
    expect(matchRoute('/login').route.name).toBe('not-found')
    expect(matchRoute('/auth/lupa').route.name).toBe('not-found')
  })
  it('daftar rute berisi 6 rute', () => expect(routes).toHaveLength(6))
})

describe('resolveRoute', () => {
  it('guest yang sudah login dialihkan ke /', () => {
    expect(resolveRoute('/auth/login', true)).toEqual({ redirect: '/' })
  })
  it('rute user tanpa login dialihkan ke login', () => {
    expect(resolveRoute('/users', false)).toEqual({ redirect: '/auth/login' })
  })
  it('rute yang diizinkan dikembalikan apa adanya', () => {
    const a = resolveRoute('/auth/login', false)
    expect(a.route.name).toBe('login')
    expect(a.redirect).toBeNull()
    const b = resolveRoute('/link-trees/9', true)
    expect(b.params.linkTreeId).toBe('9')
  })
  it('halaman 404 terbuka untuk siapa saja', () => {
    expect(resolveRoute('/zzz', false).route.name).toBe('not-found')
    expect(resolveRoute('/zzz', true).route.name).toBe('not-found')
  })
})

describe('navigate dan popstate', () => {
  it('push mengubah URL dan store', () => {
    navigate('/users')
    expect(window.location.pathname).toBe('/users')
    expect(get(path)).toBe('/users')
  })
  it('replace tidak menambah riwayat', () => {
    const before = history.length
    navigate('/profile', { replace: true })
    expect(history.length).toBe(before)
    expect(get(path)).toBe('/profile')
  })
  it('popstate menyinkronkan store dengan URL', () => {
    history.replaceState({}, '', '/users/')
    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(get(path)).toBe('/users')
  })
})
