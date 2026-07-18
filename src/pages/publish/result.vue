<!-- 发车成功页 - 发布后直出卡片，把成品交到用户手上而不是丢进列表 -->
<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import PosterGenerator from '@/components/PosterGenerator.vue'
import { getModuleById } from '@/api/module'
import { formatGameTime } from '@/utils/formatTime'

const moduleId = ref('')
const currentModule = ref(null)
const loading = ref(true)
const posterRef = ref(null)

// 发布人信息（供海报绘制用）
const creatorInfo = computed(() => {
  if (!currentModule.value) return {}
  return {
    nickname: currentModule.value.creatorNickname || '',
    avatar: currentModule.value.creatorAvatar || ''
  }
})

// 卡片上的跑团时间展示
const gameTimeText = computed(() => {
  const mod = currentModule.value
  if (!mod) return ''
  return formatGameTime(mod.gameDays, mod.startTime, mod.endTime)
})

// 招募对象：PL 人数 +（可选）KP
const recruitText = computed(() => {
  const mod = currentModule.value
  if (!mod) return ''
  const parts = []
  if (mod.plCount) parts.push(`${mod.plCount} PL`)
  if (mod.recruitKP) parts.push('1 KP')
  return parts.join(' · ') || '待定'
})

onLoad(async (options) => {
  moduleId.value = options?.id || ''
  if (!moduleId.value) {
    loading.value = false
    return
  }
  currentModule.value = await getModuleById(moduleId.value)
  loading.value = false

  // 发布即出图：直接把成品交给用户，不需要他再点一次
  if (currentModule.value) {
    setTimeout(() => posterRef.value?.generate(), 300)
  }
})

// 重新生成海报（首次自动生成失败或用户关闭预览后可再来一次）
const regeneratePoster = () => {
  posterRef.value?.generate()
}

// 去招募大厅：大厅不是 tab，走普通页面跳转
const goHall = () => {
  uni.navigateTo({ url: '/pages/home/index' })
}

// 再发一个：回首页编辑器（工作区在发布时已清空）
const publishAnother = () => {
  uni.switchTab({ url: '/pages/publish/index' })
}

onShareAppMessage(() => ({
  title: currentModule.value?.title || '来看看这个跑团招募',
  path: `/pages/home/detail?id=${moduleId.value}`,
}))
</script>

<template>
  <view class="page-container">
    <view class="success-header">
      <text class="success-title">发出去喽</text>
      <text class="success-hint">把它甩进群里，等人来</text>
    </view>

    <view v-if="loading" class="state-text">
      <text class="state-label">加载中...</text>
    </view>

    <!-- 招募卡片预览 -->
    <view v-else-if="currentModule" class="result-card">
      <view class="card-top">
        <image
          v-if="currentModule.coverImage"
          :src="currentModule.coverImage"
          mode="aspectFill"
          class="cover-img"
        />
        <view v-else class="cover-placeholder" />
        <view class="card-main">
          <text class="card-title">{{ currentModule.title }}</text>
          <view class="tag-row">
            <view class="tag"><text class="tag-text">{{ currentModule.rule }}</text></view>
            <view class="tag"><text class="tag-text">{{ currentModule.mode }}</text></view>
          </view>
        </view>
      </view>
      <view class="card-info">
        <text class="info-line">跑团时间：{{ gameTimeText }}</text>
        <text class="info-line">招募对象：{{ recruitText }}</text>
      </view>
    </view>

    <view v-else class="state-text">
      <text class="state-label">没找到这条招募</text>
    </view>

    <!-- 操作区：转发与存图是主路径 -->
    <view class="action-list">
      <button open-type="share" class="action-btn btn-primary">
        <text class="action-btn-text">转发给好友</text>
      </button>
      <view class="action-btn btn-secondary" @tap="regeneratePoster">
        <text class="action-btn-text">生成图片保存</text>
      </view>
      <view class="action-btn btn-plain" @tap="publishAnother">
        <text class="action-btn-text-plain">再发一个</text>
      </view>
      <view class="action-btn btn-plain" @tap="goHall">
        <text class="action-btn-text-plain">去招募大厅看看</text>
      </view>
    </view>

    <PosterGenerator
      ref="posterRef"
      :module-data="currentModule || {}"
      :creator-info="creatorInfo"
    />
  </view>
</template>

<style lang="scss">
.page-container {
  min-height: 100%;
  background-color: $bg-page;
  box-sizing: border-box;
  padding: 0 32rpx;
}

.success-header {
  padding: 48rpx 0 32rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  box-sizing: border-box;
}

.success-title {
  font-size: 36rpx;
  font-weight: bold;
  color: $text-primary;
}

.success-hint {
  font-size: 22rpx;
  color: $text-tertiary;
}

.state-text {
  padding: 64rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.state-label {
  font-size: 22rpx;
  color: $text-tertiary;
}

/* 招募卡片 */
.result-card {
  width: 100%;
  background-color: $bg-card;
  border-radius: 16rpx;
  padding: 16rpx 32rpx;
  box-sizing: border-box;
}

.card-top {
  display: flex;
  flex-direction: row;
  gap: 24rpx;
  padding: 8rpx 0;
  box-sizing: border-box;
}

.cover-img {
  width: 100rpx;
  height: 100rpx;
  border-radius: 10rpx;
  flex-shrink: 0;
}

.cover-placeholder {
  width: 100rpx;
  height: 100rpx;
  border-radius: 10rpx;
  background-color: $bg-image-placeholder;
  flex-shrink: 0;
}

.card-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  box-sizing: border-box;
}

.card-title {
  font-size: 36rpx;
  font-weight: bold;
  color: $text-primary;
}

.tag-row {
  display: flex;
  flex-direction: row;
  gap: 12rpx;
  box-sizing: border-box;
}

.tag {
  height: 32rpx;
  padding: 0 16rpx;
  border-radius: 999rpx;
  background-color: $bg-tag;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.tag-text {
  font-size: 22rpx;
  color: $text-tag;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 16rpx 0 8rpx;
  box-sizing: border-box;
}

.info-line {
  font-size: 22rpx;
  color: $text-tertiary;
}

/* 操作区 */
.action-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 48rpx 0;
  box-sizing: border-box;
}

.action-btn {
  height: 88rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  /* 清除 button 默认样式 */
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  line-height: normal;
  font-size: inherit;
}

.action-btn::after {
  border: none;
}

.btn-primary {
  background-color: $bg-navbar;
}

.btn-primary .action-btn-text {
  color: $text-navbar;
}

.btn-secondary {
  background-color: $bg-card;
}

.btn-secondary .action-btn-text {
  color: $text-secondary;
}

.action-btn-text {
  font-size: 28rpx;
}

.btn-plain {
  height: 64rpx;
}

.action-btn-text-plain {
  font-size: 24rpx;
  color: $text-tertiary;
}
</style>
