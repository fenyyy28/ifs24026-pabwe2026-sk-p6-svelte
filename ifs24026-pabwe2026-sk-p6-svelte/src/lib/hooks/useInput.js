import { writable } from 'svelte/store'

export function useInput(initialValue = '') {
  const value = writable(initialValue)
  const reset = () => value.set(initialValue)
  return { value, reset }
}