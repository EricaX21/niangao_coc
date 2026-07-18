/**
 * 粘贴识别回归测试：node scripts/test-parse.mjs（或 npm run test:parse）
 * 样本与预期落位的解释见《粘贴识别规则手册.md》——手册管「为什么」，本脚本管「是否还对」。
 * 添加新样本：贴原文 → 写预期字段 → 跑测试 → 不符则补规则（而不是改预期迁就实现）。
 */
import { parseRecruitText } from '../src/utils/parseRecruitText.js'
import { formatGameTime } from '../src/utils/formatTime.js'

const cases = [
  {
    label: 'S1 深水城：小猫救援（5r 语音单次团）',
    text: `5r语音短团《深水城：小猫救援》
DM：大蝠 439510286
人数：4-5
时间：7月19日（周日），北京时间20:00，一天跑不完下周日中继续
开卡：3级，4d6kh3，禁邪恶，禁男卡，初始装备，其她资源可以和dm商量是否能用～仅可使用dm提供的word卡
平台：discord + fvtt，需要有电脑，稳定梯子，谷歌/火狐浏览器（请各位玩家提前确认设备符合要求并可以正常运行）
模组概要：在喧闹的深水城成为流浪猫救助志愿者吧！`,
    expect: {
      name: '深水城：小猫救援',
      rule: 'DND5e',
      mode: '语音',
      gameDays: [0],
      startTime: '20:00',
      plCount: 5,
      inviteType: 'qq',
      inviteValue: '439510286'
    }
  },
  {
    label: 'S2 寂静之声（coc7 留言板团，时间双维待商量、无联系方式）',
    text: `模组:寂静之声
规则:coc7➕心判，rp可以代替大多数技能
模组地点时代：1970 年，美国
推荐游戏人数：1-2 人
平均游玩时长：看效率4-10h，交卡就开，固定时间14-5任选➕留言板，高强度业绩结团
模组内时长：1~2 天
推荐技能：侦查，聆听，图书馆（御三家），适当的战斗技能，汽车驾驶。

简介:这个模组发生的地点是 1970 年美国佛蒙特州一个叫莫斯（Moss）的虚构小村。调查一个六岁女孩的失踪。

其他:模组有需要从各种npc处取得信息的必要，适合喜欢rp交流脑袋灵光的pl。`,
    expect: {
      name: '寂静之声',
      rule: 'COC7th',
      mode: '文字',
      gameDays: [],        // 留言板团：哪几天没定 ≠ 每天，留空即可协商
      startTime: '',
      plCount: 2,
      duration: '4-10h',
      inviteValue: ''      // 原文没留号码，不许编造
    }
  },
  {
    label: 'S3 闇暗山（coc7，时段确定 19-22、日期待商量）',
    text: `模组:《闇暗山》
pl人数:1人
规则: coc7，天命五选一，购点480不含运，运两次，坠机可以转购
技能:80/60，御三家，推荐较高灵感，体质和教育
kp:苏百里（1736653936）
开团时间: 留言板，每天不低于三条，也可以晚7-10集中时段，预计总时长12小时左右
前情提要：
眼睛逐渐习惯黑暗。
陌生的山。闇暗山。你要做的就是下山。`,
    expect: {
      name: '闇暗山',
      rule: 'COC7th',
      mode: '文字',
      gameDays: [],        // 「每天不低于三条」是发言频率不是跑团日；日期待商量
      startTime: '19:00',  // 晚7-10 → 19:00-22:00
      endTime: '22:00',
      plCount: 1,
      duration: '12小时',
      inviteType: 'qq',
      inviteValue: '1736653936'
    }
  },
  {
    label: 'S4 一句话短招募',
    text: 'COC7《迷雾中的呼唤》周六晚8点 语音 3PL 有意私聊 QQ 123456789',
    expect: {
      name: '迷雾中的呼唤',
      rule: 'COC7th',
      mode: '语音',
      gameDays: [6],
      startTime: '20:00',
      plCount: 3,
      inviteType: 'qq',
      inviteValue: '123456789'
    }
  },
  {
    label: 'S5 双休 + 微信号',
    text: '《海底疑云》双休晚8点半开团 4PL 微信: kp_hello2024',
    expect: {
      name: '海底疑云',
      gameDays: [6, 0],
      startTime: '20:30',
      plCount: 4,
      inviteType: 'wx',
      inviteValue: 'kp_hello2024'
    }
  },
  {
    label: 'S6 真·每天团（每天+时间才全选）',
    text: '《样本镇》每天晚9点 文字团 2PL 群：987654321',
    expect: {
      gameDays: [0, 1, 2, 3, 4, 5, 6],
      startTime: '21:00',
      mode: '文字',
      inviteType: 'qqgroup',
      inviteValue: '987654321'
    }
  },
  {
    label: 'N1 反例：车卡村规数字不得误读为时间/人数/时长',
    text: '开卡规则：购点480不含运，4d6kh3，技能80/60，1970 年背景',
    expect: {
      startTime: '',
      endTime: '',
      plCount: 0,
      duration: ''
    }
  }
]

// 展示层弹性时间四态断言（与解析器同守一个模型）
const formatCases = [
  { args: [[6, 0], '20:00', '23:00'], expect: '周六、周日 20:00-23:00' },
  { args: [[6, 0], '', ''], expect: '周六、周日' },
  { args: [[], '19:00', '22:00'], expect: '19:00-22:00' },
  { args: [[], '', ''], expect: '时间待商量' },
  { args: [[0, 1, 2, 3, 4, 5, 6], '20:00', ''], expect: '每天 20:00' },
  { args: [[0], '20:00', ''], expect: '周日 20:00' }
]

let failed = 0

const assertEqual = (label, key, actual, expected) => {
  const a = JSON.stringify(Array.isArray(actual) ? [...actual].sort() : actual)
  const e = JSON.stringify(Array.isArray(expected) ? [...expected].sort() : expected)
  if (a !== e) {
    failed++
    console.error(`  ✗ ${label} · ${key}: 期望 ${e}，实际 ${a}`)
  }
}

for (const c of cases) {
  const { fields } = parseRecruitText(c.text)
  const before = failed
  for (const [key, expected] of Object.entries(c.expect)) {
    assertEqual(c.label, key, fields[key], expected)
  }
  console.log(`${failed === before ? '✓' : '✗'} ${c.label}`)
}

for (const fc of formatCases) {
  const actual = formatGameTime(...fc.args)
  const before = failed
  assertEqual('formatGameTime', JSON.stringify(fc.args), actual, fc.expect)
  console.log(`${failed === before ? '✓' : '✗'} formatGameTime(${JSON.stringify(fc.args)}) → ${actual}`)
}

if (failed > 0) {
  console.error(`\n${failed} 项断言失败`)
  process.exit(1)
}
console.log('\n全部通过')
