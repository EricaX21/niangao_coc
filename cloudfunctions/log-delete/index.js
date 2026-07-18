// cloudfunctions/log-delete/index.js
// 删除演绎记录：校验作者身份 → 从 logs 集合删除

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    const { logId } = event

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
      return { success: false, message: '无权限删除此记录' }
    }

    await db.collection('logs').doc(logId).remove()

    return { success: true, message: 'delete_success' }

  } catch (error) {
    console.error('log-delete error:', error)
    return { success: false, message: error.message || '删除失败' }
  }
}
