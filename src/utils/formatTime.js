/**
 * 跑团时间格式化工具
 * 将 gameDays + startTime + endTime 格式化为人类可读字符串。
 *
 * 弹性时间模型（详见 粘贴识别规则手册.md）：
 * 日期与时段是两个独立维度，留空即「可协商」——填了什么就只展示什么，
 * 只有两维全空才兜底显示「时间待商量」，避免文案过于刻意。
 * 例：周六、周日 20:00-23:00 ／ 周六、周日 ／ 19:00-22:00 ／ 时间待商量 ／ 每天 20:00
 */

const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/**
 * @param {number[]} gameDays - 跑团日数组，0=周日 1=周一 ... 6=周六；空数组=日期可协商
 * @param {string} startTime - 开始时间 HH:mm；空=时段可协商
 * @param {string} endTime - 结束时间 HH:mm，可选
 * @returns {string} 格式化后的字符串
 */
export const formatGameTime = (gameDays, startTime, endTime) => {
  const hasDays = gameDays && gameDays.length > 0

  // 时段：结束时间可选，只填开始时间时单独展示
  let timeStr = ''
  if (startTime && endTime) {
    timeStr = `${startTime}-${endTime}`
  } else if (startTime) {
    timeStr = startTime
  }

  // 两维全空才提示待商量
  if (!hasDays && !timeStr) return '时间待商量'

  let dayStr = ''
  if (hasDays) {
    // 7 天全选 = 每天；排序时周日排最后（周六、周日 比 周日、周六 更符合表达习惯）
    if (gameDays.length === 7) {
      dayStr = '每天'
    } else {
      const sorted = [...gameDays].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
      dayStr = sorted.map(d => DAY_NAMES[d]).join('、')
    }
  }

  if (dayStr && timeStr) return `${dayStr} ${timeStr}`
  return dayStr || timeStr
}
