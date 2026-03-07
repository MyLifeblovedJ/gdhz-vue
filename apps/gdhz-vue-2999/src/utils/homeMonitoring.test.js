import { describe, expect, test } from 'vitest'
import {
  buildHomeMonitoringViewModel,
  formatDeviceAlertDetail,
  formatDeviceMetricLine,
  formatSeawallBreakpointStatus,
  formatStationThresholdText,
  getDefaultHomeDetailStationId,
} from './homeMonitoring'

describe('homeMonitoring', () => {
  test('sorts stations by severity and picks the strongest alarm station by default', () => {
    const result = buildHomeMonitoringViewModel({
      stations: [
        {
          id: 'wave-1',
          name: '\u6c55\u5934\u8fd1\u5cb8\u6d6a\u9ad8\u7ad9',
          stationType: 'wave',
          status: 'warn',
          currentValue: 4.4,
          thresholdValue: 4.0,
          thresholdUnit: 'm',
          segmentIds: ['seg-2'],
        },
        {
          id: 'surge-2',
          name: '\u6df1\u5733\u98ce\u66b4\u6f6e\u6838\u5b9a\u7ad9',
          stationType: 'surge',
          status: 'alarm',
          currentValue: 175,
          thresholdValue: 170,
          thresholdUnit: 'cm',
          segmentIds: ['seg-1'],
        },
        {
          id: 'surge-1',
          name: '\u73e0\u6d77\u98ce\u66b4\u6f6e\u6838\u5b9a\u7ad9',
          stationType: 'surge',
          status: 'alarm',
          currentValue: 188,
          thresholdValue: 170,
          thresholdUnit: 'cm',
          segmentIds: ['seg-1'],
        },
      ],
      segments: [],
      seawalls: [],
    })

    expect(result.defaultStationId).toBe('surge-1')
    expect(result.stations.map(item => item.id)).toEqual(['surge-1', 'surge-2', 'wave-1'])
  })

  test('picks a warn station first for the default bottom detail station', () => {
    expect(
      getDefaultHomeDetailStationId([
        { id: 'alarm-1', status: 'alarm', currentValue: 188 },
        { id: 'warn-2', status: 'warn', currentValue: 4.4 },
        { id: 'warn-1', status: 'warn', currentValue: 4.8 },
      ])
    ).toBe('warn-1')
  })

  test('formats station threshold detail for alarm, warn and normal states', () => {
    expect(
      formatStationThresholdText({
        stationType: 'surge',
        status: 'alarm',
        currentValue: 188,
        thresholdValue: 170,
        thresholdUnit: 'cm',
      })
    ).toBe('\u8d85\u8b66 18cm')

    expect(
      formatStationThresholdText({
        stationType: 'wave',
        status: 'warn',
        currentValue: 4.4,
        thresholdValue: 4.0,
        thresholdUnit: 'm',
      })
    ).toBe('\u8d85\u9884\u8b66 0.4m')

    expect(
      formatStationThresholdText({
        stationType: 'tide',
        status: 'online',
        currentValue: 2.3,
        thresholdValue: 2.5,
        thresholdUnit: 'm',
      })
    ).toBe('\u8ddd\u8b66\u6212 0.2m')
  })

  test('aggregates linked segments and seawalls for the selected station', () => {
    const result = buildHomeMonitoringViewModel({
      stations: [
        {
          id: 'surge-1',
          name: '\u73e0\u6d77\u98ce\u66b4\u6f6e\u6838\u5b9a\u7ad9',
          stationType: 'surge',
          status: 'alarm',
          currentValue: 188,
          thresholdValue: 170,
          thresholdUnit: 'cm',
          segmentIds: ['seg-1'],
        },
      ],
      segments: [
        {
          id: 'seg-1',
          city: '\u73e0\u6d77\u5e02',
          name: '\u9999\u6d32\u4e1c\u5cb8\u6bb5',
          seawallIds: ['sw-1'],
        },
      ],
      seawalls: [
        {
          id: 'sw-1',
          name: '\u9999\u6d32\u6d77\u5824',
          segmentId: 'seg-1',
          riskLevel: 'high',
          breakpoints: [
            {
              id: 'bp-1',
              name: '1#\u65ad\u70b9',
              crestElevation: 3.4,
              forecastTideLevel: 3.55,
              currentTideLevel: 3.18,
            },
          ],
        },
      ],
    })

    expect(result.selectedStation.segmentSummaries).toHaveLength(1)
    expect(result.selectedStation.segmentSummaries[0].name).toBe('\u9999\u6d32\u4e1c\u5cb8\u6bb5')
    expect(result.selectedStation.segmentSummaries[0].seawalls[0].breakpoints[0].statusText).toBe('\u6f2b\u5824 +0.15m')
  })

  test('formats breakpoint status text using crest elevation and forecast tide level', () => {
    expect(
      formatSeawallBreakpointStatus({
        crestElevation: 3.4,
        forecastTideLevel: 3.55,
      })
    ).toBe('\u6f2b\u5824 +0.15m')

    expect(
      formatSeawallBreakpointStatus({
        crestElevation: 3.4,
        forecastTideLevel: 3.22,
      })
    ).toBe('\u8ddd\u5824\u9876 -0.18m')
  })

  test('formats device alert detail with explicit threshold delta', () => {
    expect(
      formatDeviceAlertDetail({
        type: 'surge_station',
        status: 'alarm',
        currentReading: 188,
        thresholdValue: 170,
        thresholdUnit: 'cm',
      })
    ).toBe('\u8d85\u8b66 18cm')

    expect(
      formatDeviceAlertDetail({
        type: 'tide_station',
        status: 'warn',
        currentReading: 2.72,
        thresholdValue: 2.5,
        thresholdUnit: 'm',
      })
    ).toBe('\u8d85\u8b66 0.22m')
  })

  test('formats device row metrics on a single compact line', () => {
    expect(
      formatDeviceMetricLine({
        type: 'surge_station',
        status: 'alarm',
        currentReading: 188,
        thresholdValue: 170,
        thresholdUnit: 'cm',
      })
    ).toBe('\u89c2\u6d4b 188cm | \u9608\u503c 170cm | \u8d85\u8b66 18cm')

    expect(
      formatDeviceMetricLine({
        type: 'wave_buoy',
        status: 'warn',
        currentReading: 4.4,
        thresholdValue: 4.0,
        thresholdUnit: 'm',
      })
    ).toBe('\u89c2\u6d4b 4.4m | \u9608\u503c 4m | \u8d85\u9884\u8b66 0.4m')
  })
})
