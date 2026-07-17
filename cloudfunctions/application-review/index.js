// cloudfunctions/application-review/index.js
// 审批申请：校验操作人是发布人 → 更新申请状态 → 通过时 approvedCount +1

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    const { applicationId, action } = event  // action: 'approve' 或 'reject'

    if (!applicationId || !action) {
      return { success: false, message: '缺少参数' }
    }

    if (!['approve', 'reject'].includes(action)) {
      return { success: false, message: '无效的操作' }
    }

    // 获取申请记录
    const appResult = await db.collection('applications').doc(applicationId).get()
    const appDoc = appResult.data

    if (!appDoc) {
      return { success: false, message: '申请记录不存在' }
    }

    // 校验操作人是否是发布人
    if (appDoc.publisherOpenid !== openid) {
      return { success: false, message: '无权限审批此申请' }
    }

    // 校验申请当前状态是否为 pending
    if (appDoc.status !== 'pending') {
      return { success: false, message: '该申请已处理' }
    }

    const now = db.serverDate()
    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    // 更新申请状态
    await db.collection('applications').doc(applicationId).update({
      data: {
        status: newStatus,
        updatedAt: now
      }
    })

    // 通过时，模组 approvedCount +1
    if (action === 'approve') {
      await db.collection('modules').doc(appDoc.moduleId).update({
        data: {
          approvedCount: _.inc(1),
          updatedAt: now
        }
      })
    }

    return {
      success: true,
      message: action === 'approve' ? '已通过' : '已拒绝'
    }

  } catch (error) {
    console.error('application-review error:', error)
    return { success: false, message: error.message || '审批失败' }
  }
}
