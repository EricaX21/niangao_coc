// cloudfunctions/module-delete/index.js
// 删除草稿：校验操作人身份 → 仅允许删除本人的 draft 状态记录
// 已发布的招募不允许删（有申请数据挂在上面，删除会破坏申请人视角）

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    const { moduleId } = event

    if (!moduleId) {
      return { success: false, message: '缺少 moduleId 参数' }
    }

    // 校验操作人是否是发布人
    const moduleResult = await db.collection('modules').doc(moduleId).get()
    const moduleDoc = moduleResult.data

    if (!moduleDoc) {
      return { success: false, message: '草稿不存在' }
    }

    if (moduleDoc._openid !== openid) {
      return { success: false, message: '无权限删除此记录' }
    }

    if (moduleDoc.status !== 'draft') {
      return { success: false, message: '仅草稿可以删除' }
    }

    await db.collection('modules').doc(moduleId).remove()

    return { success: true, message: 'delete_success' }

  } catch (error) {
    console.error('module-delete error:', error)
    return { success: false, message: error.message || '删除失败' }
  }
}
