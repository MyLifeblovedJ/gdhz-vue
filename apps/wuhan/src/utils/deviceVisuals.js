export function getDeviceVisualStyle(device) {
  if (device?.status === 'alarm') {
    return { color: '#ef4444', size2D: 14, size3D: 16 }
  }
  if (device?.status === 'warn') {
    return { color: '#f59e0b', size2D: 14, size3D: 15 }
  }
  if (device?.status === 'offline') {
    return { color: '#64748b', size2D: 12, size3D: 11 }
  }
  return {
    color: device?.color || '#4A8FC4',
    size2D: 14,
    size3D: 13,
  }
}

export function buildDeviceVisualModel(devices) {
  return (Array.isArray(devices) ? devices : [])
    .filter(device => Number.isFinite(device?.lat) && Number.isFinite(device?.lng))
    .map((device) => {
      const style = getDeviceVisualStyle(device)
      return {
        id: device.id,
        name: device.name,
        type: device.type,
        typeName: device.typeName,
        status: device.status,
        lat: device.lat,
        lng: device.lng,
        value: device.val,
        color: style.color,
        size2D: style.size2D,
        size3D: style.size3D,
      }
    })
}
