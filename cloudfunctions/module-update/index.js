// cloudfunctions/module-update/index.js
// 编辑招募：校验操作人身份 → 只更新白名单字段 → 写入 modules 集合

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    const { moduleId, ...updateData } = event

    if (!moduleId) {
      return { success: false, message: '缺少 moduleId 参数' }
    }

    // 校验操作人是否是发布人
    const moduleResult = await db.collection('modules').doc(moduleId).get()
    const moduleDoc = moduleResult.data

    if (!moduleDoc) {
      return { success: false, message: '模组不存在' }
    }

    if (moduleDoc._openid !== openid) {
      return { success: false, message: '无权限修改此招募' }
    }

    // 只允许更新以下字段，防止前端篡改敏感字段
    const allowedFields = [
      'title', 'status', 'rule', 'mode', 'duration',
      'gameDays', 'startTime', 'endTime',
      'playerCount', 'plCount', 'recruitKP',
      'intro', 'contact', 'coverImage'
    ]

    const safeUpdate = {}
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        safeUpdate[key] = updateData[key]
      }
    }

    safeUpdate.updatedAt = db.serverDate()

    await db.collection('modules').doc(moduleId).update({
      data: safeUpdate
    })

    return { success: true, message: 'update_success' }

  } catch (error) {
    console.error('module-update error:', error)
    return { success: false, message: error.message || '更新失败' }
  }
}
