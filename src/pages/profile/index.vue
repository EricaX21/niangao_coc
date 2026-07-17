<!-- 用户主页 - 通过 uid 参数区分本人视角（完整态）和他人视角（只读精简态） -->
<template>
  <view class="page-container">
    <UserProfileContent
      v-if="targetUser"
      ref="profileContentRef"
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
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { getUserByUid } from '@/api/user'
import { checkLogin } from '@/utils/auth'
import { safeNavigateBack } from '@/utils/navigation'
import UserProfileContent from '@/components/UserProfileContent.vue'

const userStore = useUserStore()
const targetUser = ref(null)
const isSelf = ref(false)
const profileContentRef = ref(null)

// 云数据库返回的用户结构（tags 数组 / signature）补齐 UI 依赖的旧字段（isKP/isPL/bio）
const normalizeUser = (user) => {
  if (!user) return null
  const tags = Array.isArray(user.tags) ? user.tags : []
  return {
    ...user,
    isKP: user.isKP ?? tags.includes('KP'),
    isPL: user.isPL ?? tags.includes('PL'),
    bio: user.bio || user.signature || '',
  }
}

// 从 P6 返回时刷新演绎记录列表
onShow(() => {
  profileContentRef.value?.refreshLogs()
})

onLoad(async (options) => {
  const uid = options?.uid
  if (!uid) return

  if (userStore.isLoggedIn && userStore.uid === uid) {
    // 本人访问自己主页
    isSelf.value = true
    targetUser.value = normalizeUser(userStore.userInfo)
  } else {
    // 他人主页 - 触发登录检查
    const ok = await checkLogin(userStore)
    if (!ok) {
      safeNavigateBack()
      return
    }
    isSelf.value = false
    const data = await getUserByUid(uid)
    targetUser.value = normalizeUser(data)
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
