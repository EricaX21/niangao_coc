<!-- 首页（Tab1）- 编辑器：产品重心是「做东西」，招募大厅退居顶部一行入口 -->
<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import ModuleForm from '@/components/ModuleForm.vue'
import { useGameStore } from '@/store/game'

const gameStore = useGameStore()
const moduleFormRef = ref(null)

onShow(() => {
  // 自定义 TabBar 选中态：首页为第 0 位（getTabBar 是页面实例方法，须经 getCurrentPages 获取）
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  if (typeof page?.getTabBar === 'function') {
    page.getTabBar()?.setData({ selected: 0 })
  }

  // 草稿箱 → 载入草稿到工作区（switchTab 不能带参数，经 store 传递）
  const draftId = gameStore.pendingDraftId
  if (draftId) {
    gameStore.clearPendingDraftId()
    moduleFormRef.value?.loadDraft(draftId)
  }
})

// 去招募大厅：大厅不再是 tab，用普通页面跳转
const goHall = () => {
  uni.navigateTo({ url: '/pages/home/index' })
}

// 粘贴识别：转调表单组件暴露的方法（读剪贴板 → 解析 → 落位）
const pasteRecognize = () => {
  moduleFormRef.value?.pasteRecognize()
}

// 发布成功 → 清空工作区 → 跳结果页直出卡片
const handlePublished = (newId) => {
  moduleFormRef.value?.resetForm()
  if (newId) {
    uni.navigateTo({ url: `/pages/publish/result?id=${newId}` })
  } else {
    uni.showToast({ title: '发出去喽', icon: 'success' })
  }
}

// 存草稿成功 → 清空工作区，可以接着填下一个团
const handleDraftSaved = () => {
  moduleFormRef.value?.resetForm()
  uni.showToast({ title: '已存进草稿箱', icon: 'success' })
}
</script>

<template>
  <view class="page-container">
    <!-- 顶部导航：吸顶按钮工具栏，滚动不消失（粘贴识别 + 逛大厅） -->
    <view class="top-toolbar">
      <view class="toolbar-btn" @tap="pasteRecognize">
        <text class="toolbar-btn-text">粘贴识别</text>
      </view>
      <view class="toolbar-btn" @tap="goHall">
        <text class="toolbar-btn-text">逛大厅</text>
      </view>
    </view>

    <ModuleForm
      ref="moduleFormRef"
      in-tab-page
      @published="handlePublished"
      @draft-saved="handleDraftSaved"
    />
  </view>
</template>

<style lang="scss">
.page-container {
  min-height: 100%;
  background-color: $bg-page;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* 顶部按钮工具栏：sticky 吸顶（同 UserProfileContent 档案馆 tab 栏的成熟模式） */
.top-toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 16rpx 32rpx;
  background-color: $bg-page;
  border-bottom: 1rpx solid $border-color;
  display: flex;
  flex-direction: row;
  gap: 16rpx;
  flex-shrink: 0;
  box-sizing: border-box;
}

.toolbar-btn {
  flex: 1;
  height: 64rpx;
  border-radius: 16rpx;
  background-color: $white;
  border: 1rpx solid $border-color;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.toolbar-btn-text {
  font-size: 26rpx;
  color: $text-secondary;
}
</style>
