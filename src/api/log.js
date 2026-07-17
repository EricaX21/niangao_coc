/**
 * 演绎记录接口（云函数版）
 */

/**
 * 获取某用户的演绎记录列表
 * @param {string} authorId - 用户的 uid
 * @returns {Promise<Array>}
 */
export async function getLogsByAuthor(authorId) {
  try {
    const result = await wx.cloud.callFunction({
      name: 'log-list',
      data: { authorId }
    })
    const response = result.result
    return response.success ? response.data : []
  } catch (error) {
    console.error('getLogsByAuthor error:', error)
    return []
  }
}

/**
 * 新增演绎记录
 * @param {Object} logData - { title, moduleName, tags, content }
 * @returns {Promise<{success: boolean, data?: {_id: string}, message?: string}>}
 */
export async function createLog(logData) {
  try {
    const result = await wx.cloud.callFunction({
      name: 'log-create',
      data: logData
    })
    return result.result
  } catch (error) {
    console.error('createLog error:', error)
    return { success: false, message: '保存失败，请重试' }
  }
}

/**
 * 编辑演绎记录
 * @param {string} logId - 记录的云数据库 _id
 * @param {Object} updateData - 要更新的字段
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function updateLog(logId, updateData) {
  try {
    const result = await wx.cloud.callFunction({
      name: 'log-update',
      data: { logId, ...updateData }
    })
    return result.result
  } catch (error) {
    console.error('updateLog error:', error)
    return { success: false, message: '更新失败，请重试' }
  }
}

/**
 * 获取单条演绎记录（logs 集合所有人可读，直接前端查库）
 * @param {string} logId - 记录的 _id
 * @returns {Promise<Object|null>}
 */
export async function getLogById(logId) {
  try {
    const db = wx.cloud.database()
    const result = await db.collection('logs').doc(logId).get()
    return result.data || null
  } catch (error) {
    console.error('getLogById error:', error)
    return null
  }
}
