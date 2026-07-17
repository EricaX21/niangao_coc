// cloudfunctions/user-profile/index.js
// 查看用户主页：按 uid 查用户公开信息

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  try {
    const { uid } = event

    if (!uid) {
      return { success: false, message: '缺少 uid 参数' }
    }

    // 按 uid 查用户
    const result = await db.collection('users')
      .where({ uid: uid })
      .limit(1)
      .get()

    if (result.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }

    const user = result.data[0]

    // 返回公开信息（不返回 _openid，保护隐私）
    return {
      success: true,
      data: {
        _id: user._id,
        uid: user.uid,
        nickname: user.nickname,
        avatar: user.avatar,
        gender: user.gender,
        tags: user.tags,
        signature: user.signature,
        qq: user.qq,
        contact: user.contact,
        followCount: user.followCount,
        fansCount: user.fansCount,
        likeCount: user.likeCount,
        createdAt: user.createdAt
      }
    }

  } catch (error) {
    console.error('user-profile error:', error)
    return { success: false, message: error.message || '获取用户信息失败' }
  }
}
