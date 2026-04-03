import { getMockUsers } from '../api/user'

/**
 * 微信授权登录（底层）
 * @returns {Promise<string>} code
 */
export function wxLogin() {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success(res) { resolve(res.code) },
      fail(err) { reject(err) },
    })
  })
}

/**
 * 退出登录
 */
export function logout() {
  uni.removeStorageSync('token')
  uni.removeStorageSync('userInfo')
}

/**
 * 检查登录状态，未登录时弹确认框后注入 mock 用户数据。
 * MVP 阶段：用户点确认后直接注入 mockUsers[0]，模拟授权成功。
 * 生产阶段：替换为真实 wx.login + 后端换取 token 流程。
 *
 * @param {object} userStore  useUserStore() 实例（由调用方传入）
 * @returns {Promise<boolean>} true = 已登录或授权成功，false = 用户取消
 */
export function checkLogin(userStore) {
  if (userStore.isLoggedIn) return Promise.resolve(true)

  return new Promise((resolve) => {
    uni.showModal({
      title: '需要登录',
      content: '该操作需要登录，是否立即登录？',
      confirmText: '登录',
      cancelText: '取消',
      success(res) {
        if (res.confirm) {
          userStore.mockLogin(getMockUsers()[0])
          resolve(true)
        } else {
          resolve(false)
        }
      },
      fail() {
        resolve(false)
      },
    })
  })
}
