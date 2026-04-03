<!-- 我的（Tab2 壳页面）- onShow 检查登录，渲染与 profile/index 本人视角完全相同的内容 -->
<template>
  <view class="page-container">
    <UserProfileContent v-if="userStore.isLoggedIn" :userInfo="userInfo" :isSelf="true" />
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { checkLogin } from '@/utils/auth'
import UserProfileContent from '@/components/UserProfileContent.vue'

const userStore = useUserStore()

// 从 store 读取当前登录用户信息
const userInfo = computed(() => userStore.userInfo || {})

// 每次 onShow 检查登录态：取消授权则退回招募大厅，登录成功则更新 TabBar 选中态
onShow(async () => {
  const ok = await checkLogin(userStore)
  if (!ok) {
    uni.switchTab({ url: '/pages/home/index' })
    return
  }
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  if (typeof page?.getTabBar === 'function') {
    page.getTabBar()?.setData({ selected: 1 })
  }
})
</script>

<style lang="scss">
.page-container {
  min-height: 100%;
  background-color: $bg-page;
  box-sizing: border-box;
}
</style>
