/**
 * 招募文本解析器（规则版）
 * 把 KP 在 QQ 群里发的招募文本解析成表单字段，识别不出的字段返回空，由用户手填。
 * 纯前端正则实现：零延迟、零成本；后续如需提升覆盖率可在云函数侧加 LLM 兜底。
 *
 * 原则：空着可以，乱填不行——不确定的信息宁可留空（留空在弹性时间模型下即「可协商」）。
 * 每条规则的依据样本与已知边界见《粘贴识别规则手册.md》；改规则前先跑 npm run test:parse。
 */

// 中文星期 → gameDays 数值（0=周日 1=周一 ... 6=周六）
const DAY_MAP = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0, '天': 0 }

// 提取模组名称：优先书名号《》，其次「模组:xxx」行
const parseName = (text) => {
  const bookTitle = text.match(/《([^》\n]{1,30})》/)
  if (bookTitle) return bookTitle[1].slice(0, 20)
  const labeled = text.match(/模组(?:名称?)?[:：]\s*([^\n《（(]{1,30})/)
  if (labeled) return labeled[1].trim().slice(0, 20)
  return ''
}

// 提取规则体系：仅映射已知 token（COC6/7、DND 系），未知体系不乱落
const parseRule = (text) => {
  if (/coc\s*7|七版/i.test(text)) return 'COC7th'
  if (/coc\s*6|六版/i.test(text)) return 'COC6th'
  // 5r = 国内跑团圈对 DND 五版的常用简称
  if (/\b5r\b|dnd|d&d/i.test(text)) return 'DND5e'
  return ''
}

// 提取跑团方式：语音优先；留言板/文字团/pbp 都算文字
const parseMode = (text) => {
  if (/语音/.test(text)) return '语音'
  if (/文字|留言板|pbp/i.test(text)) return '文字'
  return ''
}

/**
 * 提取跑团日：全文匹配「周X」「星期X」，去重；「双休/周末」= 周六+周日。
 * 「每天」只在后面紧跟时间内容时才视为跑团日全选——
 * 「每天晚8点」是每天开团，「留言板，每天不低于三条」说的是发言频率，不是跑团日。
 * 「留言板/交卡就开/任选」这类灵活团不动日期：留空即「可协商」（弹性时间模型），乱填才是错。
 */
const parseGameDays = (text) => {
  const days = new Set()
  const re = /[周星期]([一二三四五六日天])/g
  let m
  while ((m = re.exec(text)) !== null) {
    if (DAY_MAP[m[1]] !== undefined) days.add(DAY_MAP[m[1]])
  }
  // 双休 / 周末 → 周六 + 周日
  if (/双休|周末/.test(text)) {
    days.add(6)
    days.add(0)
  }
  // 「每天」+ 紧跟时间才是跑团日全选
  if (/每[天日]\s*(?:晚|上午|下午|\d)/.test(text)) {
    for (let d = 0; d <= 6; d++) days.add(d)
  }
  return [...days]
}

/**
 * 提取时间段。识别优先级：
 * 1. 明确的 HH:mm（第一个当开始、第二个当结束）
 * 2. 带「晚/晚上/下午/上午」前缀的口语区间：「晚7-10」→ 19:00-22:00、「下午2-5」→ 14:00-17:00
 * 3. 带前缀的口语单点：「晚8点」→ 20:00、「晚8点半」→ 20:30
 * 12 小时转换必须带前缀——「购点480」「4d6kh3」「技能80/60」是车卡村规（KP 自设规则），
 * 其中的裸数字绝不能被误读成时间。
 */
const parseTimes = (text) => {
  const result = { startTime: '', endTime: '' }

  // 小时数按前缀转 24 小时制：晚/下午 +12，上午原样
  const toHour24 = (prefix, hour) => {
    if (/晚|下午/.test(prefix) && hour < 12) return hour + 12
    return hour
  }
  const fmt = (hour, minute) => `${String(hour).padStart(2, '0')}:${minute}`

  // 1. 明确的 HH:mm
  const clockRe = /(\d{1,2})[:：](\d{2})/g
  const found = []
  let m
  while ((m = clockRe.exec(text)) !== null) {
    const hour = Number(m[1])
    const minute = Number(m[2])
    // 过滤掉日期（7月19）和 QQ 号里巧合的数字：小时必须 0-23、分钟 0-59
    if (hour <= 23 && minute <= 59) {
      found.push(fmt(hour, m[2]))
    }
    if (found.length >= 2) break
  }
  if (found.length > 0) result.startTime = found[0]
  if (found.length > 1) result.endTime = found[1]
  if (result.startTime) return result

  // 2. 口语区间：「晚7-10」「晚上7点到10点」「下午2~5」
  const range = text.match(/(晚上?|下午|上午)\s*(\d{1,2})点?(半)?\s*[-~～到至]\s*(\d{1,2})点?(半)?/)
  if (range) {
    const startHour = toHour24(range[1], Number(range[2]))
    const endHour = toHour24(range[1], Number(range[4]))
    if (startHour <= 23 && endHour <= 23 && startHour < endHour) {
      result.startTime = fmt(startHour, range[3] ? '30' : '00')
      result.endTime = fmt(endHour, range[5] ? '30' : '00')
      return result
    }
  }

  // 3. 口语单点：「晚8点」「下午3点半」
  const single = text.match(/(晚上?|下午|上午)\s*(\d{1,2})点(半)?/)
  if (single) {
    const hour = toHour24(single[1], Number(single[2]))
    if (hour <= 23) result.startTime = fmt(hour, single[3] ? '30' : '00')
  }
  return result
}

// 提取招募 PL 人数：「人数：4-5」「pl人数:1人」「3PL」等；范围取上限，夹紧到 1-6
const parsePlCount = (text) => {
  const labeled = text.match(/(?:pl\s*)?人数[:：]?\s*(\d{1,2})(?:\s*[-~～至]\s*(\d{1,2}))?/i)
  if (labeled) {
    const upper = Number(labeled[2] || labeled[1])
    return Math.min(Math.max(upper, 1), 6)
  }
  const suffix = text.match(/(\d{1,2})\s*(?:名|个|位)?\s*pl/i)
  if (suffix) {
    return Math.min(Math.max(Number(suffix[1]), 1), 6)
  }
  return 0
}

// 提取预计时长：「4-10h」「12小时」「一天」等短语
const parseDuration = (text) => {
  const m = text.match(/(\d+(?:\s*[-~～]\s*\d+)?\s*(?:小时|h))/i)
  if (m) return m[1].replace(/\s+/g, '').slice(0, 20)
  return ''
}

// 提取简介：「简介:」「模组概要：」「前情提要：」后的段落，截到下一个「标签:」行或结尾
const parseIntro = (text) => {
  const m = text.match(/(?:简介|模组概要|概要|前情提要)[:：]\s*([\s\S]+?)(?=\n[^\n:：]{1,10}[:：]|$)/)
  if (m) return m[1].trim().slice(0, 300)
  return ''
}

// 提取联系方式：群号优先判 qqgroup；其次微信号；再次 QQ/DM/KP 附近的 5-12 位数字；兜底括号里的纯数字
const parseContact = (text) => {
  const group = text.match(/(?:群号?|Q群|qq群)[:：]?\s*(\d{5,12})/i)
  if (group) return { type: 'qqgroup', value: group[1] }
  // 微信号：字母开头的 6-20 位字母数字下划线连字符（微信号规范），标签 vx/wx/微信
  const wechat = text.match(/(?:vx|wx|微信号?)[:：]?\s*([A-Za-z][A-Za-z0-9_-]{5,19})/i)
  if (wechat) return { type: 'wx', value: wechat[1] }
  const qq = text.match(/(?:qq|ＱＱ)[:：]?\s*(\d{5,12})/i)
  if (qq) return { type: 'qq', value: qq[1] }
  // DM/KP/主持 后面 12 个字符内出现的数字（如「DM：大蝠 439510286」）
  const host = text.match(/(?:dm|kp|主持人?)[^\d\n]{0,12}(\d{5,12})/i)
  if (host) return { type: 'qq', value: host[1] }
  // 中文/英文括号里的纯数字（如「苏百里（1736653936）」）
  const paren = text.match(/[（(](\d{5,12})[)）]/)
  if (paren) return { type: 'qq', value: paren[1] }
  return { type: '', value: '' }
}

// 是否在招 KP：文本明确出现「招KP / 缺KP」才置真
const parseRecruitKP = (text) => /(?:招|缺|求)\s*kp/i.test(text)

/**
 * 解析招募文本 → 表单字段对象
 * @param {string} text - KP 发在群里的招募原文
 * @returns {{fields: Object, recognizedCount: number}} fields 中为空的字段表示未识别
 */
export const parseRecruitText = (text) => {
  if (!text || !text.trim()) {
    return { fields: {}, recognizedCount: 0 }
  }

  const times = parseTimes(text)
  const contact = parseContact(text)

  const fields = {
    name: parseName(text),
    rule: parseRule(text),
    mode: parseMode(text),
    gameDays: parseGameDays(text),
    startTime: times.startTime,
    endTime: times.endTime,
    plCount: parsePlCount(text),
    duration: parseDuration(text),
    intro: parseIntro(text),
    inviteType: contact.type,
    inviteValue: contact.value,
    recruitKP: parseRecruitKP(text)
  }

  // 统计识别出的字段数（联系方式的 type+value 算一项，recruitKP 只有为真才算）
  let count = 0
  if (fields.name) count++
  if (fields.rule) count++
  if (fields.mode) count++
  if (fields.gameDays.length > 0) count++
  if (fields.startTime) count++
  if (fields.plCount) count++
  if (fields.duration) count++
  if (fields.intro) count++
  if (fields.inviteValue) count++
  if (fields.recruitKP) count++

  return { fields, recognizedCount: count }
}
