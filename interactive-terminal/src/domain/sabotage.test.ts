import { describe, expect, it } from 'vitest'
import { sabotage } from './sabotage'

describe('sabotage', () => {
  it('leaves one-letter input alone', () => {
    expect(sabotage('C')).toBe('C')
  })

  it('always changes longer input', () => {
    for (let i = 0; i < 500; i += 1) {
      expect(sabotage('CANCELAR')).not.toBe('CANCELAR')
      expect(sabotage('AA')).not.toBe('AA')
    }
  })

  it('stays close to the original length', () => {
    for (let i = 0; i < 200; i += 1) {
      expect(Math.abs(sabotage('CANCELAR').length - 8)).toBeLessThanOrEqual(1)
    }
  })
})
