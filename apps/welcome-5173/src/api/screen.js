import { getJson } from './http'

// 获取大屏初始化数据。
export async function fetchScreenBootstrap() {
  return getJson('/api/screen/bootstrap')
}
