<!-- 分享菜单组件 - 底部弹出 ActionSheet，含「转发给好友」和「生成海报」 -->
<script setup>
import { ref } from 'vue'
import PosterGenerator from './PosterGenerator.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  moduleData: { type: Object, default: () => ({}) },
  creatorInfo: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:show'])

const posterRef = ref(null)

const close = () => {
  emit('update:show', false)
}

// 点击「生成海报」：关闭菜单 → 触发海报生成
const handlePoster = () => {
  close()
  // 等菜单关闭动画结束后再生成海报
  setTimeout(() => {
    posterRef.value?.generate()
  }, 300)
}
</script>

<template>
  <!-- 分享菜单遮罩 -->
  <view v-if="show" class="share-overlay" @tap="close">
    <view class="share-panel" @tap.stop>
      <view class="share-options">
        <!-- 转发给好友：必须用 button open-type="share" -->
        <button open-type="share" class="share-menu-item" @tap="close">
          <view class="share-icon-wrap">
            <text class="share-icon-text">💬</text>
          </view>
          <text class="share-label">转发给好友</text>
        </button>

        <!-- 生成海报 -->
        <view class="share-menu-item" @tap="handlePoster">
          <view class="share-icon-wrap">
            <text class="share-icon-text">🖼</text>
          </view>
          <text class="share-label">生成海报</text>
        </view>
      </view>

      <!-- 取消按钮 -->
      <view class="share-cancel" @tap="close">
        <text class="share-cancel-text">取消</text>
      </view>
    </view>
  </view>

  <!-- 海报生成组件（始终挂载，隐藏 Canvas） -->
  <PosterGenerator
    ref="posterRef"
    :module-data="moduleData"
    :creator-info="creatorInfo"
  />
</template>

<style lang="scss">
/* 遮罩层 */
.share-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 200;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

/* 底部弹出面板 */
.share-panel {
  background-color: $bg-page;
  border-radius: 24rpx 24rpx 0 0;
  padding: 32rpx 32rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

/* 选项横排 */
.share-options {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 80rpx;
  padding: 24rpx 0 32rpx;
  box-sizing: border-box;
}

/* 菜单项（图标在上，文字在下） */
.share-menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  /* 清除 button 默认样式 */
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  line-height: normal;
  font-size: inherit;
  box-sizing: border-box;
}

.share-menu-item::after {
  border: none;
}

.share-icon-wrap {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background-color: $bg-card;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.share-icon-text {
  font-size: 40rpx;
}

.share-label {
  font-size: 24rpx;
  color: $text-secondary;
}

/* 取消按钮 */
.share-cancel {
  margin-top: 16rpx;
  border-top: 1rpx solid $border-color;
  padding-top: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.share-cancel-text {
  font-size: 28rpx;
  color: $text-muted;
}
</style>
