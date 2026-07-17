// cloudfunctions/log-create/index.js
// 新增演绎记录：校验身份 → 写入 logs 集合

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    // 获取用户信息
    const userResult = await db.collection('users')
      .where({ _openid: openid })
      .limit(1)
      .get()

    if (userResult.data.length === 0) {
      return { success: false, message: '请先登录' }
    }

    const user = userResult.data[0]

    const { title, moduleName, tags = [], content } = event

    // 校验必填字段
    if (!title || !title.trim()) {
      return { success: false, message: '标题不能为空' }
    }
    if (!content || !content.trim()) {
      return { success: false, message: '正文不能为空' }
    }

    const now = db.serverDate()

    const newLog = {
      _openid: openid,
      authorId: user.uid,
      title: title.trim(),
      moduleName: (moduleName || '').trim(),
      tags: tags || [],
      content: content.trim(),
      createdAt: now,
      updatedAt: now
    }

    const addResult = await db.collection('logs').add({ data: newLog })

    return {
      success: true,
      message: '记录已保存',
      data: { _id: addResult._id }
    }

  } catch (error) {
    console.error('log-create error:', error)
    return { success: false, message: error.message || '保存失败' }
  }
}
