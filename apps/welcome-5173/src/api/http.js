// 统一的 GET 请求封装，后续可扩展为鉴权与错误码处理。
export async function getJson(url) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`接口请求失败: ${response.status}`)
  }

  const payload = await response.json()
  if (payload.code !== 0) {
    throw new Error(payload.message || '业务返回异常')
  }

  return payload.data
}
