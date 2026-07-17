// cloudfunctions/module-list/index.js
// 获取招募列表：支持状态筛选、规则/方式/对象多条件筛选、分页

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  try {
    const {
      status = 'recruiting',  // 默认只查招募中
      filters = {},           // 筛选条件 { rules: [], modes: [], targets: [] }
      pageSize = 20,
      lastCreatedAt = null    // 游标分页：上一页最后一条的 createdAt
    } = event

    // 构建查询条件
    const where = { status }

    // 规则体系筛选（同维度 OR）
    if (filters.rules && filters.rules.length > 0) {
      // rules 数组中的值如 ['COC', 'DND']，匹配 rule 字段 startsWith
      const ruleConditions = filters.rules.map(r => ({
        rule: db.RegExp({ regexp: `^${r}`, options: 'i' })
      }))
      where.rule = _.or(ruleConditions.map(c => c.rule))
    }

    // 跑团方式筛选（同维度 OR）
    if (filters.modes && filters.modes.length > 0) {
      where.mode = _.in(filters.modes)
    }

    // 招募对象筛选（同维度 OR）
    if (filters.targets && filters.targets.length > 0) {
      const targetConditions = []
      if (filters.targets.includes('KP') || filters.targets.includes('DM')) {
        targetConditions.push({ recruitKP: true })
      }
      if (filters.targets.includes('PL')) {
        targetConditions.push({ plCount: _.gt(0) })
      }
      if (targetConditions.length > 0) {
        // 用 or 合并招募对象条件
        Object.assign(where, _.or(targetConditions))
      }
    }

    // 分页：游标分页
    if (lastCreatedAt) {
      where.createdAt = _.lt(new Date(lastCreatedAt))
    }

    // 执行查询
    const result = await db.collection('modules')
      .where(where)
      .orderBy('createdAt', 'desc')
      .limit(pageSize)
      .get()

    return {
      success: true,
      data: result.data,
      hasMore: result.data.length === pageSize
    }

  } catch (error) {
    console.error('module-list error:', error)
    return {
      success: false,
      message: error.message || '获取列表失败',
      data: []
    }
  }
}
