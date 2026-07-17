// cloudfunctions/application-list/index.js
// 获取某模组的申请列表：校验操作人是发布人 → 返回所有申请记录

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    const { moduleId } = event

    if (!moduleId) {
      return { success: false, message: '缺少 moduleId 参数', data: [] }
    }

    // 校验操作人是否是该模组的发布人
    const moduleResult = await db.collection('modules').doc(moduleId).get()
    const moduleDoc = moduleResult.data

    if (!moduleDoc || moduleDoc._openid !== openid) {
      return { success: false, message: '无权限查看', data: [] }
    }

    // 查询该模组的所有申请记录
    const appResult = await db.collection('applications')
      .where({ moduleId: moduleId })
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get()

    return {
      success: true,
      data: appResult.data
    }

  } catch (error) {
    console.error('application-list error:', error)
    return { success: false, message: error.message, data: [] }
  }
}
