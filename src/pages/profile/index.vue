<!-- 用户主页 - 通过 uid 参数区分本人视角（完整态）和他人视角（只读精简态） -->
<template>
  <view class="page-container">
    <UserProfileContent
      v-if="targetUser"
      :userInfo="targetUser"
      :isSelf="isSelf"
    />
    <view v-else class="loading-tip">
      <text class="loading-text">加载中...</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { getUserByUid } from '@/api/user'
import { checkLogin } from '@/utils/auth'
import UserProfileContent from '@/components/UserProfileContent.vue'

const userStore = useUserStore()
const targetUser = ref(null)
const isSelf = ref(false)

onLoad(async (options) => {
  const uid = options?.uid
  if (!uid) return

  if (userStore.isLoggedIn && userStore.uid === uid) {
    // 本人访问自己主页
    isSelf.value = true
    targetUser.value = userStore.userInfo
  } else {
    // 他人主页 - 触发登录检查
    const ok = await checkLogin(userStore)
    if (!ok) {
      uni.navigateBack()
      return
    }
    isSelf.value = false
    targetUser.value = getUserByUid(uid)
  }
})
</script>

<style lang="scss">
.page-container {
  min-height: 100%;
  background-color: $bg-page;
  box-sizing: border-box;
}

.loading-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;

  .loading-text {
    font-size: 28rpx;
    color: $text-tertiary;
  }
}
</style>
