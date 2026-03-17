import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const sourcePath = resolve(import.meta.dirname, 'Placeholder.vue')
const source = readFileSync(sourcePath, 'utf8')

describe('Placeholder submenu state', () => {
  it('reads the submenu query and resolves its label from navigation config', () => {
    expect(source).toMatch(/route\.query\.sub/)
    expect(source).toMatch(/findSubmenuItem/)
    expect(source).toMatch(/currentSubLabel/)
  })

  it('renders the active submenu name inside the development notice', () => {
    expect(source).toMatch(/currentSubLabel\.value/)
    expect(source).toMatch(/开发中/)
  })
})
