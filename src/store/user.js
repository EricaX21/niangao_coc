import { defineStore } from 'pinia'
import { post } from '../utils/request'
import { wxLogin, logout } from '../utils/auth'
import { getMockUsers } from '../api/user'

// 开发模式开关：true = 跳过微信授权，直接注入 mock 用户
const DEV_MOCK = true

export const useUserStore = defineStore('user', {
  state: () => ({
    token: DEV_MOCK ? 'mock-token-dev' : (uni.getStorageSync('token') || ''),
    userInfo: DEV_MOCK ? { ...getMockUsers()[0] } : (uni.getStorageSync('userInfo') || null),
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    uid: (state) => state.userInfo?.uid || '',
    nickname: (state) => state.userInfo?.nickname || '未登录',
    avatar: (state) => state.userInfo?.avatar || '',
  },

  actions: {
    /**
     * Mock 登录（开发用）
     * 在登录页点击按钮或切换用户时调用
     */
    mockLogin(user) {
      this.token = 'mock-token-dev'
      this.userInfo = { ...user }
    },

    /**
     * 切换测试用户（开发者模式专用）
     * @param {string} uid  目标用户 uid
     */
    switchUser(uid) {
      const user = getMockUsers().find(u => u.uid === uid)
      if (user) this.mockLogin(user)
    },

    async login() {
      try {
        const code = await wxLogin()
        const res = await post('/auth/wx-login', { code })
        this.token = res.token
        this.userInfo = res.userInfo
        uni.setStorageSync('token', res.token)
        uni.setStorageSync('userInfo', res.userInfo)
        return res
      } catch (err) {
        console.error('登录失败', err)
        throw err
      }
    },

    logout() {
      this.token = ''
      this.userInfo = null
      logout()
    },

    updateUserInfo(info) {
      this.userInfo = { ...this.userInfo, ...info }
      uni.setStorageSync('userInfo', this.userInfo)
    },
  },
})
