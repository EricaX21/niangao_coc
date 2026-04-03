<!-- 模组详情信息展示组件 - 供申请人视角和发布人视角详情页共用 -->
<script setup>
import { computed } from 'vue'
import { formatGameTime } from '@/utils/formatTime'

const props = defineProps({
  module: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['tapPublisher'])

const gameTimeStr = computed(() =>
  formatGameTime(props.module.gameDays, props.module.startTime, props.module.endTime)
)
</script>

<template>
  <!-- uni-app 不支持组件多根节点，用单一根节点包裹 -->
  <view class="module-detail-wrap">
    <!-- 信息区块卡片 -->
    <view class="info-card">
      <!-- 模组封面 -->
      <view class="cover-wrap">
        <image
          v-if="module.cover"
          :src="module.cover"
          mode="aspectFill"
          class="cover-img"
        />
        <view v-else class="cover-placeholder">
          <text class="cover-label">封面</text>
        </view>
      </view>

      <!-- 右侧信息 -->
      <view class="info-content">
        <view class="publisher-row" @tap="emit('tapPublisher', module.creatorId)">
          <view class="publisher-avatar-dot" />
          <text class="label-text">发起人：</text>
          <text class="publisher-name clickable">{{ module.publisherName }}</text>
        </view>

        <view class="tags-row">
          <view class="tag" v-for="tag in module.tags" :key="tag">
            <text class="tag-text">#{{ tag }}</text>
          </view>
        </view>

        <view class="meta-row">
          <text class="meta-icon">⏱</text>
          <text class="meta-text">预计时长 {{ module.duration }}</text>
        </view>

        <view class="meta-row">
          <text class="meta-icon">⚔</text>
          <text class="meta-text">招募对象 {{ module.recruit }}</text>
        </view>

        <view class="meta-row">
          <text class="meta-icon">📅</text>
          <text class="meta-text">{{ gameTimeStr }}</text>
        </view>
      </view>
    </view>

    <!-- 分割线 + 模组简介标题 -->
    <view class="section-header">
      <view class="divider-line" />
      <text class="section-title">模组简介</text>
      <view class="divider-line" />
    </view>

    <!-- 简介正文 -->
    <view class="intro-wrap">
      <text class="intro-text" user-select="true">{{ module.intro }}</text>
    </view>
  </view>
</template>

<style lang="scss">
.module-detail-wrap {
  display: flex;
  flex-direction: column;
}

.info-card {
  display: flex;
  flex-direction: row;
  background-color: #FFFFFF;
  border-radius: 16rpx;
  padding: 24rpx;
  margin: 24rpx 24rpx 0;
  gap: 20rpx;

  .cover-wrap {
    flex-shrink: 0;
    width: 180rpx;
    height: 180rpx;
    border-radius: 12rpx;
    overflow: hidden;

    .cover-img {
      width: 100%;
      height: 100%;
    }

    .cover-placeholder {
      width: 100%;
      height: 100%;
      background-color: #d9d9d9;
      display: flex;
      align-items: center;
      justify-content: center;

      .cover-label {
        font-size: 24rpx;
        color: #888888;
      }
    }
  }

  .info-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10rpx;

    .publisher-row {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 8rpx;

      .publisher-avatar-dot {
        width: 36rpx;
        height: 36rpx;
        border-radius: 50%;
        background-color: #d9d9d9;
        flex-shrink: 0;
      }

      .label-text {
        font-size: 24rpx;
        color: #666666;
      }

      .publisher-name {
        font-size: 24rpx;
        color: #333333;
        font-weight: 500;

        &.clickable {
          text-decoration: underline;
        }
      }
    }

    .tags-row {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 8rpx;

      .tag {
        background-color: #434343;
        border-radius: 20rpx;
        padding: 4rpx 14rpx;

        .tag-text {
          font-size: 22rpx;
          color: #ffffff;
        }
      }
    }

    .meta-row {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 8rpx;

      .meta-icon {
        font-size: 24rpx;
        width: 28rpx;
      }

      .meta-text {
        font-size: 24rpx;
        color: #444444;
        flex: 1;
      }
    }
  }
}

.section-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 32rpx 24rpx 16rpx;
  gap: 16rpx;

  .divider-line {
    flex: 1;
    height: 1rpx;
    background-color: #DDDDDD;
  }

  .section-title {
    font-size: 26rpx;
    color: #666666;
    white-space: nowrap;
  }
}

.intro-wrap {
  padding: 0 24rpx 40rpx;

  .intro-text {
    font-size: 28rpx;
    color: #444444;
    line-height: 1.8;
  }
}
</style>
