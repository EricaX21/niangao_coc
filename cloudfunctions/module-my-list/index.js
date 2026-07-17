// cloudfunctions/module-my-list/index.js
// 我的创建 / 我的申请：根据 tab 参数返回不同数据

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    const { tab = 'created' } = event

    if (tab === 'created') {
      // 我的创建：查自己发布的所有模组（含草稿、招募中、已发车）
      const result = await db.collection('modules')
        .where({ _openid: openid })
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get()

      return { success: true, data: result.data }

    } else if (tab === 'applied') {
      // 我的申请：查自己提交的所有申请记录
      const appResult = await db.collection('applications')
        .where({ _openid: openid })
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get()

      const applications = appResult.data

      if (applications.length === 0) {
        return { success: true, data: [] }
      }

      // 获取关联的模组信息（用于展示卡片）
      const moduleIds = [...new Set(applications.map(a => a.moduleId))]

      // 逐个查询模组信息（云数据库不支持 IN 查询超过一定数量）
      const moduleMap = {}
      for (const mid of moduleIds) {
        try {
          const mResult = await db.collection('modules').doc(mid).get()
          moduleMap[mid] = mResult.data
        } catch (e) {
          // 模组可能被删除，跳过
          moduleMap[mid] = null
        }
      }

      // 将申请记录和模组信息合并
      const mergedData = applications.map(app => {
        const moduleInfo = moduleMap[app.moduleId]
        return {
          ...app,
          // 附带模组信息供卡片展示
          moduleInfo: moduleInfo ? {
            _id: moduleInfo._id,
            title: moduleInfo.title,
            status: moduleInfo.status,
            rule: moduleInfo.rule,
            mode: moduleInfo.mode,
            duration: moduleInfo.duration,
            gameDays: moduleInfo.gameDays,
            startTime: moduleInfo.startTime,
            endTime: moduleInfo.endTime,
            playerCount: moduleInfo.playerCount,
            plCount: moduleInfo.plCount,
            recruitKP: moduleInfo.recruitKP,
            coverImage: moduleInfo.coverImage,
            creatorNickname: moduleInfo.creatorNickname,
            creatorId: moduleInfo.creatorId,
            applyCount: moduleInfo.applyCount,
            intro: moduleInfo.intro
          } : null
        }
      })

      return { success: true, data: mergedData }

    } else if (tab === 'history') {
      // 我的足迹：MVP 阶段返回空数组
      return { success: true, data: [] }
    }

    return { success: false, message: '无效的 tab 参数' }

  } catch (error) {
    console.error('module-my-list error:', error)
    return { success: false, message: error.message || '获取列表失败', data: [] }
  }
}
