// cloudfunctions/log-list/index.js
// 获取某用户的演绎记录列表（用于用户主页档案馆）

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  try {
    const { authorId } = event

    if (!authorId) {
      return { success: false, message: '缺少 authorId 参数', data: [] }
    }

    const result = await db.collection('logs')
      .where({ authorId: authorId })
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get()

    return { success: true, data: result.data }

  } catch (error) {
    console.error('log-list error:', error)
    return { success: false, message: error.message, data: [] }
  }
}
