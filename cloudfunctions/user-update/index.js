// cloudfunctions/user-update/index.js
// 编辑个人资料：校验身份 → 更新 users 表 → 同步冗余字段到 modules 和 applications

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    // 获取当前用户记录
    const userResult = await db.collection('users')
      .where({ _openid: openid })
      .limit(1)
      .get()

    if (userResult.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }

    const currentUser = userResult.data[0]
    const userId = currentUser._id

    // 只允许更新的字段白名单
    const allowedFields = [
      'nickname', 'avatar', 'gender', 'tags',
      'signature', 'qq', 'contact'
    ]

    const safeUpdate = {}
    for (const key of allowedFields) {
      if (event[key] !== undefined) {
        safeUpdate[key] = event[key]
      }
    }

    safeUpdate.updatedAt = db.serverDate()

    // 更新用户表
    await db.collection('users').doc(userId).update({
      data: safeUpdate
    })

    // 如果改了昵称，同步更新冗余字段
    if (safeUpdate.nickname && safeUpdate.nickname !== currentUser.nickname) {
      const newNickname = safeUpdate.nickname

      // 同步 modules 表的 creatorNickname
      // 云数据库 where.update 一次最多 20 条，需循环
      let hasMoreModules = true
      while (hasMoreModules) {
        const modules = await db.collection('modules')
          .where({
            _openid: openid,
            creatorNickname: currentUser.nickname
          })
          .limit(20)
          .get()

        if (modules.data.length === 0) {
          hasMoreModules = false
          break
        }

        const updatePromises = modules.data.map(m =>
          db.collection('modules').doc(m._id).update({
            data: { creatorNickname: newNickname }
          })
        )
        await Promise.all(updatePromises)

        if (modules.data.length < 20) {
          hasMoreModules = false
        }
      }

      // 同步 applications 表的 applicantNickname
      let hasMoreApps = true
      while (hasMoreApps) {
        const apps = await db.collection('applications')
          .where({
            _openid: openid,
            applicantNickname: currentUser.nickname
          })
          .limit(20)
          .get()

        if (apps.data.length === 0) {
          hasMoreApps = false
          break
        }

        const updatePromises = apps.data.map(a =>
          db.collection('applications').doc(a._id).update({
            data: { applicantNickname: newNickname }
          })
        )
        await Promise.all(updatePromises)

        if (apps.data.length < 20) {
          hasMoreApps = false
        }
      }
    }

    // 返回更新后的完整用户信息
    const updatedUser = await db.collection('users').doc(userId).get()

    return {
      success: true,
      message: '资料已更新',
      data: updatedUser.data
    }

  } catch (error) {
    console.error('user-update error:', error)
    return { success: false, message: error.message || '更新失败' }
  }
}
