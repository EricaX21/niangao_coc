// cloudfunctions/module-publish/index.js
// 发布新招募：校验必填字段 → 从 users 表获取发布人信息 → 写入 modules 集合

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    // 从 users 表获取发布人信息（用于冗余字段 creatorId / creatorNickname）
    const userResult = await db.collection('users')
      .where({ _openid: openid })
      .limit(1)
      .get()

    if (userResult.data.length === 0) {
      return { success: false, message: '用户未注册，请先登录' }
    }

    const user = userResult.data[0]

    const {
      title,
      status = 'recruiting',
      rule,
      mode,
      duration,
      gameDays,
      startTime,
      endTime,
      playerCount,
      plCount = 0,
      recruitKP = false,
      intro = '',
      contact,
      coverImage = ''
    } = event

    // 校验必填字段
    if (!title || !title.trim()) {
      return { success: false, message: '模组名称不能为空' }
    }

    const now = db.serverDate()

    const newModule = {
      _openid: openid,
      title: title.trim(),
      status,
      rule: rule || '',
      mode: mode || '',
      duration: duration || '',
      gameDays: gameDays || [],
      startTime: startTime || '',
      endTime: endTime || '',
      playerCount: playerCount || 0,
      plCount,
      recruitKP,
      intro: intro || '',
      contact: contact || { type: '', value: '' },
      coverImage,
      creatorId: user.uid,
      creatorNickname: user.nickname || '跑团新手',
      applyCount: 0,
      approvedCount: 0,
      createdAt: now,
      updatedAt: now
    }

    const addResult = await db.collection('modules').add({ data: newModule })

    return {
      success: true,
      message: status === 'draft' ? 'draft_saved' : 'publish_success',
      data: { _id: addResult._id }
    }

  } catch (error) {
    console.error('module-publish error:', error)
    return { success: false, message: error.message || '发布失败' }
  }
}
