<!-- 我的（Tab2 壳页面）- onShow 检查登录，渲染与 profile/index 本人视角完全相同的内容 -->
<template>
  <view class="page-container">
    <UserProfileContent v-if="userStore.isLoggedIn" ref="profileContentRef" :userInfo="userInfo" :isSelf="true" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { checkLogin } from '@/utils/auth'
import UserProfileContent from '@/components/UserProfileContent.vue'

const userStore = useUserStore()
const profileContentRef = ref(null)

// 从 store 读取当前登录用户信息
const userInfo = computed(() => userStore.userInfo || {})

// 每次 onShow 检查登录态：取消授权则退回首页，登录成功则更新 TabBar 选中态
onShow(async () => {
  const ok = await checkLogin(userStore)
  if (!ok) {
    uni.switchTab({ url: '/pages/publish/index' })
    return
  }
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  if (typeof page?.getTabBar === 'function') {
    page.getTabBar()?.setData({ selected: 1 })
  }
  // 从 P6 返回时刷新演绎记录列表
  profileContentRef.value?.refreshLogs()
})
</script>

<style lang="scss">
.page-container {
  min-height: 100%;
  background-color: $bg-page;
  box-sizing: border-box;
}
</style>
