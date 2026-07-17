// cloudfunctions/application-submit/index.js
// 申请加入招募：校验模组状态 → 防重复申请 → 写入申请记录 → 模组 applyCount +1

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

    // 获取申请人信息
    const userResult = await db.collection('users')
      .where({ _openid: openid })
      .limit(1)
      .get()

    if (userResult.data.length === 0) {
      return { success: false, message: '请先登录' }
    }

    const user = userResult.data[0]

    // 获取模组信息并校验状态
    const moduleResult = await db.collection('modules').doc(moduleId).get()
    const moduleDoc = moduleResult.data

    if (!moduleDoc) {
      return { success: false, message: '招募不存在' }
    }

    if (moduleDoc.status !== 'recruiting') {
      return { success: false, message: '该招募已结束，无法申请' }
    }

    // 校验不能申请自己发布的招募
    if (moduleDoc._openid === openid) {
      return { success: false, message: '不能申请自己发布的招募' }
    }

    // 防止重复申请
    const existingApp = await db.collection('applications')
      .where({
        moduleId: moduleId,
        _openid: openid
      })
      .limit(1)
      .get()

    if (existingApp.data.length > 0) {
      return { success: false, message: '你已经申请过了' }
    }

    const now = db.serverDate()

    // 写入申请记录（含冗余字段）
    await db.collection('applications').add({
      data: {
        _openid: openid,
        moduleId: moduleId,
        moduleTitle: moduleDoc.title || '',
        applicantId: user.uid,
        applicantNickname: user.nickname || '',
        applicantAvatar: user.avatar || '',
        publisherId: moduleDoc.creatorId,
        publisherOpenid: moduleDoc._openid,
        status: 'pending',
        createdAt: now,
        updatedAt: now
      }
    })

    // 模组 applyCount 原子 +1
    await db.collection('modules').doc(moduleId).update({
      data: {
        applyCount: _.inc(1),
        updatedAt: now
      }
    })

    return { success: true, message: '申请已提交' }

  } catch (error) {
    console.error('application-submit error:', error)
    return { success: false, message: error.message || '申请失败' }
  }
}
