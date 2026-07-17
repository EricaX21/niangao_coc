// cloudfunctions/module-detail/index.js
// 获取招募详情：根据当前用户身份决定是否返回联系方式

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  try {
    const { moduleId } = event
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    if (!moduleId) {
      return { success: false, message: '缺少 moduleId 参数' }
    }

    // 查询模组详情
    const moduleResult = await db.collection('modules').doc(moduleId).get()
    const moduleData = moduleResult.data

    if (!moduleData) {
      return { success: false, message: '模组不存在' }
    }

    // 判断联系方式是否可见
    let showContact = false

    // 情况1：请求者是发布人本人
    if (moduleData._openid === openid) {
      showContact = true
    }

    // 情况2：请求者有已通过的申请（仅在未登录或非发布人时查询）
    if (!showContact && openid) {
      const appResult = await db.collection('applications')
        .where({
          moduleId: moduleId,
          _openid: openid,
          status: 'approved'
        })
        .limit(1)
        .get()

      if (appResult.data.length > 0) {
        showContact = true
      }
    }

    // 不可见时将 contact 设为 null
    if (!showContact) {
      moduleData.contact = null
    }

    // 查询当前用户对该模组的申请状态（如果已登录）
    let myApplicationStatus = null
    if (openid) {
      const myAppResult = await db.collection('applications')
        .where({
          moduleId: moduleId,
          _openid: openid
        })
        .limit(1)
        .get()

      if (myAppResult.data.length > 0) {
        myApplicationStatus = myAppResult.data[0].status
      }
    }

    return {
      success: true,
      data: {
        ...moduleData,
        myApplicationStatus  // 前端用于控制按钮状态（已申请/已通过等）
      }
    }

  } catch (error) {
    console.error('module-detail error:', error)
    return {
      success: false,
      message: error.message || '获取详情失败',
      data: null
    }
  }
}
