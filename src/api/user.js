/**
 * 用户数据接口
 */
import { mockUsers } from '../utils/mockData'

// 调用 user-login 云函数，返回 { success, message, data }
export async function loginByCloud() {
  const result = await wx.cloud.callFunction({ name: 'user-login' })
  return result.result
}

/**
 * 获取用户公开资料（云函数版）
 * @param {string} uid - 用户的 uid（如 NG10001）
 * @returns {Promise<Object|null>}
 */
export async function getUserByUid(uid) {
  try {
    const result = await wx.cloud.callFunction({
      name: 'user-profile',
      data: { uid }
    })
    const response = result.result
    return response.success ? response.data : null
  } catch (error) {
    console.error('getUserByUid error:', error)
    return null
  }
}

/**
 * 更新个人资料（云函数版）
 * @param {Object} userData - 要更新的字段
 * @returns {Promise<{success: boolean, data?: Object, message?: string}>}
 */
export async function updateUser(userData) {
  try {
    const result = await wx.cloud.callFunction({
      name: 'user-update',
      data: userData
    })
    return result.result
  } catch (error) {
    console.error('updateUser error:', error)
    return { success: false, message: '更新失败，请重试' }
  }
}

// 保留 mock 列表接口（部分旧代码可能还在用，后续统一清理）
export const getMockUsers = () => mockUsers
