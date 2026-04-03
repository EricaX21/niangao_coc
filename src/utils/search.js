/**
 * 模糊搜索工具
 * 支持多关键词拆分（空格分隔，AND 逻辑）+ 子序列匹配
 */

/**
 * 清洗搜索输入：只保留中英文、数字、空格
 */
function sanitize(input) {
  return input.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '')
}

/**
 * 子序列匹配：检查 pattern 的每个字符是否按顺序出现在 text 中
 * 例如 "影者" 能匹配 "影迷者的阴影"（影...者 按顺序出现）
 */
function isSubsequence(pattern, text) {
  let pi = 0
  for (let ti = 0; ti < text.length && pi < pattern.length; ti++) {
    if (text[ti] === pattern[pi]) pi++
  }
  return pi === pattern.length
}

/**
 * 单个关键词是否命中目标文本（先精确匹配，再子序列匹配）
 */
function matchKeyword(keyword, text) {
  const lowerText = text.toLowerCase()
  const lowerKey = keyword.toLowerCase()
  if (lowerText.includes(lowerKey)) return true
  return isSubsequence(lowerKey, lowerText)
}

/**
 * 模糊搜索
 * @param {string} input 用户输入的搜索词
 * @param {Array} items 待搜索的数据列表
 * @param {Array<string>} fields 要搜索的字段名（支持数组字段如 tags，自动 join）
 * @returns {Array} 匹配的结果列表
 */
export function fuzzySearch(input, items, fields) {
  const cleaned = sanitize(input).trim()
  if (!cleaned) return items

  // 按空格拆分为多个关键词，过滤空串
  const keywords = cleaned.split(/\s+/).filter(Boolean)
  if (keywords.length === 0) return items

  return items.filter(item => {
    // 将所有搜索字段拼成一个文本
    const searchText = fields
      .map(field => {
        const val = item[field]
        if (Array.isArray(val)) return val.join(' ')
        return val || ''
      })
      .join(' ')

    // 每个关键词都必须命中（AND 逻辑）
    return keywords.every(kw => matchKeyword(kw, searchText))
  })
}
