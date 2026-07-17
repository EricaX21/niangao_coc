// cloudfunctions/user-login/index.js
// 用户登录云函数：首次登录自动注册，返回用户信息

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const usersCollection = db.collection('users')

exports.main = async (event, context) => {
  // 云函数自动获取调用者的 openid，不需要前端传 code
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 按 openid 查找已有用户
    const queryResult = await usersCollection
      .where({ _openid: openid })
      .get()

    if (queryResult.data.length > 0) {
      // 老用户：直接返回用户信息
      const user = queryResult.data[0]
      return {
        code: 0,
        message: 'login_success',
        data: user
      }
    }

    // 新用户，生成 uid 并创建记录
    const uid = await generateUid()
    const now = db.serverDate()

    const newUser = {
      _openid: openid,
      uid: uid,
      nickname: '跑团新手',
      avatar: '',
      gender: 'secret',
      tags: ['PL'],
      signature: '',
      qq: '',
      contact: { type: '', value: '' },
      followCount: 0,
      fansCount: 0,
      likeCount: 0,
      createdAt: now,
      updatedAt: now
    }

    await usersCollection.add({ data: newUser })

    // 重新查询以获取完整记录（含 _id）
    const createdUser = await usersCollection
      .where({ _openid: openid })
      .get()

    return {
      code: 0,
      message: 'register_success',
      data: createdUser.data[0]
    }

  } catch (error) {
    console.error('user-login error:', error)
    return {
      code: -1,
      message: error.message || '登录失败',
      data: null
    }
  }
}

/**
 * 生成用户可见的短 ID，格式为 "NG" + 5位递增数字
 * 例如：NG10001, NG10002, ...
 * 通过查询当前最大 uid 来递增，避免重复
 */
async function generateUid() {
  const maxResult = await usersCollection
    .orderBy('uid', 'desc')
    .limit(1)
    .field({ uid: true })
    .get()

  if (maxResult.data.length === 0) {
    return 'NG10001'
  }

  const lastUid = maxResult.data[0].uid
  const lastNum = parseInt(lastUid.replace('NG', ''), 10)
  const newNum = lastNum + 1
  return 'NG' + newNum.toString()
}
