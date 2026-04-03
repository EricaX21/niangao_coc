/**
 * 跑团时间格式化工具
 * 将 gameDays + startTime + endTime 格式化为人类可读字符串
 * 例：每周六 20:00-23:00、每周一、三、五 19:00-21:00
 */

const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/**
 * @param {number[]} gameDays - 跑团日数组，0=周日 1=周一 ... 6=周六
 * @param {string} startTime - 开始时间 HH:mm
 * @param {string} endTime - 结束时间 HH:mm
 * @returns {string} 格式化后的字符串
 */
export const formatGameTime = (gameDays, startTime, endTime) => {
  if (!gameDays || gameDays.length === 0) return '待定'

  // 排序后映射为中文简称
  const sorted = [...gameDays].sort((a, b) => a - b)
  const dayStr = sorted.map(d => DAY_NAMES[d]).join('、')

  const timeStr = startTime && endTime ? ` ${startTime}-${endTime}` : ''

  return `每${dayStr}${timeStr}`
}
