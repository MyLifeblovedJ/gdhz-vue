export function buildTyphoonSummaryCards({
  landfallPrediction = null,
  formatTime = () => '--',
} = {}) {
  return [
    {
      id: 'landfall',
      title: '预计登陆',
      accent: 'danger',
      rows: landfallPrediction
        ? [
            { label: '地点', value: landfallPrediction.location || '--' },
            { label: '时间', value: formatTime(landfallPrediction.time), tone: 'danger' },
          ]
        : [
            { label: '地点', value: '暂无预计登陆点信息', tone: 'muted' },
            { label: '时间', value: '--', tone: 'muted' },
          ],
    },
  ]
}
