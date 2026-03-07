import { describe, expect, it } from 'vitest'
import { HOME_DEFAULT_MAP_MODE } from './homeMapMode'

describe('homeMapMode', () => {
  it('keeps 3D as the homepage default mode', () => {
    expect(HOME_DEFAULT_MAP_MODE).toBe('3D')
  })
})
