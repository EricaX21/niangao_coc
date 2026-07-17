// cloudfunctions/module-depart/index.js
// 发车：校验操作人是发布人 → 模组状态改 finished → pending 申请批量改 rejected

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    const { moduleId } = event

    if (!moduleId) {
      return { success: false, message: '缺少 moduleId 参数' }
    }

    // 获取模组信息
    const moduleResult = await db.collection('modules').doc(moduleId).get()
    const moduleDoc = moduleResult.data

    if (!moduleDoc) {
      return { success: false, message: '招募不存在' }
    }

    // 校验操作人是否是发布人
    if (moduleDoc._openid !== openid) {
      return { success: false, message: '无权限操作' }
    }

    // 校验模组状态是否为 recruiting
    if (moduleDoc.status !== 'recruiting') {
      return { success: false, message: '只有招募中的模组才能发车' }
    }

    const now = db.serverDate()

    // 模组状态改为 finished
    await db.collection('modules').doc(moduleId).update({
      data: {
        status: 'finished',
        updatedAt: now
      }
    })

    // 批量将该模组所有 pending 申请改为 rejected
    // 云数据库单次 where.update 最多更新 20 条，需循环处理
    let hasMore = true
    while (hasMore) {
      const pendingApps = await db.collection('applications')
        .where({
          moduleId: moduleId,
          status: 'pending'
        })
        .limit(20)
        .get()

      if (pendingApps.data.length === 0) {
        hasMore = false
        break
      }

      // 逐条更新（云数据库不支持批量 where.update 在客户端SDK）
      const updatePromises = pendingApps.data.map(app =>
        db.collection('applications').doc(app._id).update({
          data: {
            status: 'rejected',
            updatedAt: now
          }
        })
      )
      await Promise.all(updatePromises)

      if (pendingApps.data.length < 20) {
        hasMore = false
      }
    }

    return {
      success: true,
      message: '发车成功',
      data: { approvedCount: moduleDoc.approvedCount || 0 }
    }

  } catch (error) {
    console.error('module-depart error:', error)
    return { success: false, message: error.message || '发车失败' }
  }
}
