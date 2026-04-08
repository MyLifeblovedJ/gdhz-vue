import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAppStore } from './app'

describe('app geology state', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('surfaces all fetched geology records for map rendering without left-legend filters', async () => {
    const store = useAppStore()

    await store.fetchGeologySampling()

    const expectedCount = store.geology.records.raw.length + store.geology.records.processed.length
    expect(store.visibleGeologyRecords).toHaveLength(expectedCount)
    expect(store.visibleGeologyRecords.some(record => record.datasetType === 'raw')).toBe(true)
    expect(store.visibleGeologyRecords.some(record => record.datasetType === 'processed')).toBe(true)
  })

  it('tracks active geology point and active mggid for linked highlighting', async () => {
    const store = useAppStore()

    await store.fetchGeologySampling()
    const record = store.visibleGeologyRecords[0]
    store.setActiveGeologyPoint(record.pointId)

    expect(store.geology.activePointId).toBe(record.pointId)
    expect(store.geology.activeMggid).toBe(record.mggid)
    expect(store.activeGeologyRecord?.pointId).toBe(record.pointId)
    expect(store.activeGeologyGroupRecords.every(item => item.mggid === record.mggid)).toBe(true)
  })

  it('does not expose left-legend geology filter and color helpers from the store api', async () => {
    const store = useAppStore()

    await store.fetchGeologySampling()

    expect('geologyFilterTreeItems' in store).toBe(false)
    expect('geologyColorLegendItems' in store).toBe(false)
    expect('setGeologyLayerVisibility' in store).toBe(false)
    expect('setGeologyColorBy' in store).toBe(false)
    expect('setGeologyFilterField' in store).toBe(false)
    expect('setGeologyFilterMode' in store).toBe(false)
    expect('toggleGeologySelectedValue' in store).toBe(false)
  })
})
