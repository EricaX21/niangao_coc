<!-- 演绎记录列表页 - 展示本人的所有跑团记录 -->
<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getLogList } from '@/api/log'

const logs = ref([])

onLoad(() => {
  logs.value = [...getLogList()]
})

// 新增记录
const goCreate = () => {
  uni.navigateTo({ url: '/pages/profile/log_detail' })
}

// 查看记录详情
const goDetail = (log) => {
  uni.navigateTo({ url: `/pages/profile/log_detail?id=${log.id}` })
}
</script>

<template>
  <view class="page">
    <!-- 记录列表 -->
    <scroll-view scroll-y class="list-scroll">
      <view class="list-inner">

        <!-- 空状态 -->
        <view v-if="logs.length === 0" class="empty-state">
          <text class="empty-text">还没有演绎记录</text>
          <text class="empty-sub">记录你的每一次冒险吧</text>
          <view class="empty-create-btn" @tap="goCreate">
            <text class="empty-create-text">+ 写下第一篇</text>
          </view>
        </view>

        <!-- 记录卡片 -->
        <view
          v-for="item in logs"
          :key="item.id"
          class="log-card"
          @tap="goDetail(item)"
        >
          <view class="log-card-top">
            <text class="log-title">{{ item.title }}</text>
            <text class="log-date">{{ item.createdAt }}</text>
          </view>
          <text class="log-module">模组：{{ item.moduleName }}</text>
          <view class="tags-row">
            <view v-for="tag in item.tags" :key="tag" class="tag">
              <text class="tag-text">{{ tag }}</text>
            </view>
          </view>
          <text class="log-preview">{{ item.content }}</text>
        </view>

        <view class="list-bottom" />
      </view>
    </scroll-view>

    <!-- 底部吸底按钮 -->
    <view class="bottom-bar">
      <view class="bottom-btn" @tap="goCreate">
        <text class="bottom-btn-text">+ 新增记录</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100%;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* 底部吸底按钮 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background-color: #f5f5f5;
  border-top: 1rpx solid #eeeeee;
  box-sizing: border-box;

  .bottom-btn {
    height: 88rpx;
    border-radius: 16rpx;
    background-color: #2c2c2c;
    display: flex;
    align-items: center;
    justify-content: center;

    .bottom-btn-text {
      font-size: 32rpx;
      font-weight: 600;
      color: #ffffff;
    }
  }
}

/* 列表区 */
.list-scroll {
  flex: 1;

  .list-inner {
    padding: 8rpx 32rpx 0;
    box-sizing: border-box;
  }

  .list-bottom {
    height: 160rpx;
  }
}

/* 空状态 */
.empty-state {
  padding: 120rpx 0 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;

  .empty-text {
    font-size: 30rpx;
    color: #363636;
    font-weight: 600;
  }

  .empty-sub {
    font-size: 24rpx;
    color: #b2b2b2;
  }

  .empty-create-btn {
    margin-top: 16rpx;
    height: 72rpx;
    border-radius: 36rpx;
    background-color: #2c2c2c;
    padding: 0 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;

    .empty-create-text {
      font-size: 28rpx;
      color: #ffffff;
    }
  }
}

/* 记录卡片 */
.log-card {
  background-color: #e8e8e8;
  border-radius: 16rpx;
  padding: 24rpx 32rpx;
  margin-bottom: 8rpx;
  box-sizing: border-box;

  .log-card-top {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16rpx;
    margin-bottom: 10rpx;

    .log-title {
      flex: 1;
      font-size: 30rpx;
      font-weight: 700;
      color: #000000;
      line-height: 1.4;
    }

    .log-date {
      font-size: 22rpx;
      color: #b2b2b2;
      flex-shrink: 0;
    }
  }

  .log-module {
    font-size: 22rpx;
    color: #888888;
    margin-bottom: 12rpx;
    display: block;
  }

  .tags-row {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8rpx;
    margin-bottom: 16rpx;

    .tag {
      display: inline-flex;
      align-items: center;
      background-color: #434343;
      border-radius: 999rpx;
      padding: 0 16rpx;
      height: 32rpx;
      box-sizing: border-box;

      .tag-text {
        font-size: 22rpx;
        color: #ffffff;
      }
    }
  }

  .log-preview {
    font-size: 26rpx;
    color: #363636;
    line-height: 1.6;
    display: block;
    overflow: hidden;
    /* 最多展示3行 */
  }
}
</style>
