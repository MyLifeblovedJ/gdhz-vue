import { describe, expect, it } from 'vitest'
import { buildDeviceVisualModel, getDeviceVisualStyle } from './deviceVisuals'

describe('deviceVisuals', () => {
  it('maps device status to stable visual styles', () => {
    expect(getDeviceVisualStyle({ status: 'online', color: '#4A8FC4' })).toMatchObject({
      color: '#4A8FC4',
      size2D: 14,
      size3D: 13,
    })

    expect(getDeviceVisualStyle({ status: 'warn', color: '#4A8FC4' })).toMatchObject({
      color: '#f59e0b',
    })

    expect(getDeviceVisualStyle({ status: 'alarm', color: '#4A8FC4' })).toMatchObject({
      color: '#ef4444',
    })
  })

  it('builds stable visual models for full device rendering', () => {
    const model = buildDeviceVisualModel([
      {
        id: 'surge_001',
        name: '风暴潮站1',
        type: 'surge_station',
        typeName: '风暴潮核定站',
        status: 'alarm',
        color: '#5F9FB9',
        lat: 22.278,
        lng: 113.571,
        val: '188cm',
      },
      {
        id: 'base_001',
        name: '岸基站1',
        type: 'coastal_base',
        typeName: '岸基观测站',
        status: 'online',
        color: '#4A8FC4',
        lat: 22.54,
        lng: 114.05,
        val: '12m/s',
      },
    ])

    expect(model).toHaveLength(2)
    expect(model[0]).toMatchObject({
      id: 'surge_001',
      color: '#ef4444',
      lat: 22.278,
      lng: 113.571,
    })
    expect(model[1]).toMatchObject({
      id: 'base_001',
      color: '#4A8FC4',
      size3D: 13,
    })
  })
})
