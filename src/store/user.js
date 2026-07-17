import { defineStore } from 'pinia'
import { logout } from '../utils/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: uni.getStorageSync('userInfo') || null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.userInfo?.uid,
    uid: (state) => state.userInfo?.uid || '',
    nickname: (state) => state.userInfo?.nickname || '未登录',
    avatar: (state) => state.userInfo?.avatar || '',
    gender: (state) => state.userInfo?.gender || 'secret',
    tags: (state) => state.userInfo?.tags || ['PL'],
    signature: (state) => state.userInfo?.signature || '',
    qq: (state) => state.userInfo?.qq || '',
    contact: (state) => state.userInfo?.contact || { type: '', value: '' },
    openid: (state) => state.userInfo?._openid || '',
  },

  actions: {
    /**
     * 设置用户数据（云函数登录成功后调用）
     * @param {object} userData  云函数返回的用户对象
     */
    setUser(userData) {
      this.userInfo = { ...userData }
      uni.setStorageSync('userInfo', this.userInfo)
    },

    logout() {
      this.userInfo = null
      logout()
    },

    updateUserInfo(info) {
      this.userInfo = { ...this.userInfo, ...info }
      uni.setStorageSync('userInfo', this.userInfo)
    },
  },
})
