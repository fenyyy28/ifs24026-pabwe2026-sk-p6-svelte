export const LINK_TREE_TYPES = [
  { value: 'public', label: 'Publik' },
  { value: 'unlisted', label: 'Tidak Terdaftar' },
  { value: 'private', label: 'Privat' },
]

export function typeLabel(value) {
  return LINK_TREE_TYPES.find((t) => t.value === value)?.label ?? value
}