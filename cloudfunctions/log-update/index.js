// cloudfunctions/log-update/index.js
// 编辑演绎记录：校验作者身份 → 更新 logs 集合

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    const { logId, ...updateData } = event

    if (!logId) {
      return { success: false, message: '缺少 logId 参数' }
    }

    // 校验操作人是否是作者
    const logResult = await db.collection('logs').doc(logId).get()
    const logDoc = logResult.data

    if (!logDoc) {
      return { success: false, message: '记录不存在' }
    }

    if (logDoc._openid !== openid) {
      return { success: false, message: '无权限修改此记录' }
    }

    // 只允许更新的字段
    const allowedFields = ['title', 'moduleName', 'tags', 'content']

    const safeUpdate = {}
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        safeUpdate[key] = updateData[key]
      }
    }

    safeUpdate.updatedAt = db.serverDate()

    await db.collection('logs').doc(logId).update({
      data: safeUpdate
    })

    return { success: true, message: '更新成功' }

  } catch (error) {
    console.error('log-update error:', error)
    return { success: false, message: error.message || '更新失败' }
  }
}
