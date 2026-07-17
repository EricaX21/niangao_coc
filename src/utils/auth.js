// 统一登录检查方法：未登录时弹窗确认 → 调用云函数获取用户信息

/**
 * 退出登录，清除本地缓存
 */
export function logout() {
  uni.removeStorageSync('userInfo')
}

/**
 * 检查登录状态，未登录时弹窗引导用户授权
 * @param {Object} userStore - Pinia 的 userStore 实例
 * @param {Function} [callback] - 登录成功后的回调函数（可选）
 * @returns {Promise<boolean>} 是否登录成功
 */
export async function checkLogin(userStore, callback) {
  // 已登录：直接放行
  if (userStore.isLoggedIn) {
    if (typeof callback === 'function') callback()
    return true
  }

  return new Promise((resolve) => {
    uni.showModal({
      title: '提示',
      content: '是否立即登录？',
      confirmText: '登录',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          try {
            // 调用微信登录（云函数会自动获取 openid）
            await new Promise((wxResolve, wxReject) => {
              wx.login({
                success: () => wxResolve(),
                fail: (err) => wxReject(err)
              })
            })

            // 调用 user-login 云函数
            const result = await wx.cloud.callFunction({
              name: 'user-login'
            })

            const response = result.result
            if (response.code === 0 || response.success === true) {
              // 登录成功：将用户信息存入 store
              const userData = response.data || response.user
              userStore.setUser(userData)
              if (typeof callback === 'function') callback()
              resolve(true)
            } else {
              uni.showToast({ title: response.message || '登录失败', icon: 'none' })
              resolve(false)
            }
          } catch (error) {
            console.error('登录失败:', error)
            uni.showToast({ title: '登录失败，请重试', icon: 'none' })
            resolve(false)
          }
        } else {
          resolve(false)
        }
      }
    })
  })
}
