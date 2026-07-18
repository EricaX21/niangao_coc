/**
 * 模组 & 申请数据接口
 * getModuleList / getModuleById 已接入云函数；其余方法暂用 mock 数据。
 */
import { mockApplicationList } from '../utils/mockData'

/**
 * 获取招募列表（云函数版）
 * @param {Object} filters - 筛选条件 { rules: [], modes: [], targets: [] }
 * @param {string|null} lastCreatedAt - 分页游标
 * @returns {Promise<{data: Array, hasMore: boolean}>}
 */
export async function getModuleList(filters = {}, lastCreatedAt = null) {
  try {
    const result = await wx.cloud.callFunction({
      name: 'module-list',
      data: {
        status: 'recruiting',
        filters,
        pageSize: 20,
        lastCreatedAt
      }
    })
    const response = result.result
    if (response.success) {
      return { data: response.data, hasMore: response.hasMore }
    }
    console.error('getModuleList failed:', response.message)
    return { data: [], hasMore: false }
  } catch (error) {
    console.error('getModuleList error:', error)
    return { data: [], hasMore: false }
  }
}

/**
 * 获取招募详情（云函数版）
 * @param {string} moduleId - 模组的云数据库 _id
 * @returns {Promise<Object|null>}
 */
export async function getModuleById(moduleId) {
  try {
    const result = await wx.cloud.callFunction({
      name: 'module-detail',
      data: { moduleId }
    })
    const response = result.result
    if (response.success) {
      return response.data
    }
    console.error('getModuleById failed:', response.message)
    return null
  } catch (error) {
    console.error('getModuleById error:', error)
    return null
  }
}

/**
 * 发布新招募（云函数版）
 * @param {Object} moduleData - 表单数据
 * @returns {Promise<{success: boolean, data?: {_id: string}}>}
 */
export async function createModule(moduleData) {
  try {
    const result = await wx.cloud.callFunction({
      name: 'module-publish',
      data: moduleData
    })
    return result.result
  } catch (error) {
    console.error('createModule error:', error)
    return { success: false, message: '发布失败，请重试' }
  }
}

/**
 * 编辑招募（云函数版）
 * @param {string} moduleId - 模组的云数据库 _id
 * @param {Object} updateData - 要更新的字段
 * @returns {Promise<{success: boolean}>}
 */
export async function updateModule(moduleId, updateData) {
  try {
    const result = await wx.cloud.callFunction({
      name: 'module-update',
      data: { moduleId, ...updateData }
    })
    return result.result
  } catch (error) {
    console.error('updateModule error:', error)
    return { success: false, message: '更新失败，请重试' }
  }
}

/**
 * 删除草稿（云函数版，仅限本人的 draft 状态记录）
 * @param {string} moduleId - 模组的云数据库 _id
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function deleteModule(moduleId) {
  try {
    const result = await wx.cloud.callFunction({
      name: 'module-delete',
      data: { moduleId }
    })
    return result.result
  } catch (error) {
    console.error('deleteModule error:', error)
    return { success: false, message: '删除失败，请重试' }
  }
}

/**
 * 申请加入招募（云函数版）
 * @param {string} moduleId - 模组的云数据库 _id
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function applyModule(moduleId) {
  try {
    const result = await wx.cloud.callFunction({
      name: 'application-submit',
      data: { moduleId }
    })
    return result.result
  } catch (error) {
    console.error('applyModule error:', error)
    return { success: false, message: '申请失败，请重试' }
  }
}

/**
 * 审批申请（云函数版）
 * @param {string} applicationId - 申请记录的云数据库 _id
 * @param {string} action - 'approve' 或 'reject'
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function reviewApplication(applicationId, action) {
  try {
    const result = await wx.cloud.callFunction({
      name: 'application-review',
      data: { applicationId, action }
    })
    return result.result
  } catch (error) {
    console.error('reviewApplication error:', error)
    return { success: false, message: '审批失败，请重试' }
  }
}

/**
 * 发车（云函数版）
 * @param {string} moduleId - 模组的云数据库 _id
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function departModule(moduleId) {
  try {
    const result = await wx.cloud.callFunction({
      name: 'module-depart',
      data: { moduleId }
    })
    return result.result
  } catch (error) {
    console.error('departModule error:', error)
    return { success: false, message: '发车失败，请重试' }
  }
}

/**
 * 获取某模组的申请列表（云函数版）
 * @param {string} moduleId - 模组的云数据库 _id
 * @returns {Promise<Array>}
 */
export async function getApplicationsByModule(moduleId) {
  try {
    const result = await wx.cloud.callFunction({
      name: 'application-list',
      data: { moduleId }
    })
    const response = result.result
    return response.success ? response.data : []
  } catch (error) {
    console.error('getApplicationsByModule error:', error)
    return []
  }
}

/**
 * 获取我的创建/申请/足迹列表（云函数版）
 * @param {string} tab - 'created' | 'applied' | 'history'
 * @returns {Promise<Array>}
 */
export async function getMyModules(tab) {
  try {
    const result = await wx.cloud.callFunction({
      name: 'module-my-list',
      data: { tab }
    })
    const response = result.result
    return response.success ? response.data : []
  } catch (error) {
    console.error('getMyModules error:', error)
    return []
  }
}

// 保留兼容：旧的申请列表 mock 接口（暂未用到则可忽略）
export const getApplicationList = () => mockApplicationList
