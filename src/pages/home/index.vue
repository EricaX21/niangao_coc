<!-- 招募大厅 - 从首页编辑器的「看看别人怎么做」入口进入，纯浏览参考区 -->
<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getModuleList } from '@/api/module'
import { formatGameTime } from '@/utils/formatTime'

// 根据 plCount / recruitKP 拼接招募对象展示文本
const formatRecruit = (item) => {
  const parts = []
  if (item.recruitKP) parts.push('1KP')
  if (item.plCount) parts.push(`${item.plCount}PL`)
  return parts.length > 0 ? parts.join(' ') : '待定'
}

// 从 rule / mode / playerCount 动态生成 tag 数组（云数据库无 tags 字段）
const buildTags = (item) => {
  const tags = []
  if (item.mode) tags.push(item.mode)
  if (item.rule) tags.push(item.rule)
  if (item.playerCount) tags.push(`${item.playerCount}人`)
  return tags
}

// 大厅已不是 tab 页（从首页编辑器的入口跳入），只需每次显示时重新拉取列表
onShow(() => {
  loadModules()
})

const loading = ref(false)
const list = ref([])

/**
 * 大厅定位是「看看别人怎么做」的参考区，不是搜索型信息流。
 * 原搜索栏 + 8 个筛选 tag 已移除（那套是电商骨架），只保留一种排序。
 */
const loadModules = async () => {
  loading.value = true
  try {
    const result = await getModuleList({})
    list.value = result.data || []
  } catch (error) {
    console.error('loadModules error:', error)
    list.value = []
  } finally {
    loading.value = false
  }
}

const goDetail = (item) => {
  uni.navigateTo({ url: `/pages/home/detail?id=${item._id}` })
}
</script>

<template>
  <view class="page">

    <!-- 招募卡片列表 -->
    <scroll-view scroll-y class="list-scroll">
      <view class="list-inner">
        <!-- 加载中 -->
        <view v-if="loading" class="empty-state">
          <text class="empty-text">加载中...</text>
        </view>
        <!-- 空状态 -->
        <view v-else-if="list.length === 0" class="empty-state">
          <text class="empty-text">暂无招募，快去发布第一个吧</text>
        </view>
        <view
          class="card"
          v-for="item in list"
          :key="item._id"
          @tap="goDetail(item)"
        >
          <!-- 已发车蒙层 -->
          <view v-if="item.status === 'departed'" class="departed-overlay">
            <text class="departed-stamp">已发车</text>
          </view>

          <!-- 上方：封面图 + 标题/tag 横排 -->
          <view class="card-top">
            <!-- 封面图 -->
            <view class="card-cover">
              <image
                v-if="item.cover"
                :src="item.cover"
                mode="aspectFill"
                lazy-load
                class="cover-img"
              />
              <view v-else class="cover-placeholder" />
            </view>

            <!-- 右侧：标题 + tag -->
            <view class="card-title">
              <text class="module-name">{{ item.title }}</text>
              <view class="tags-row">
                <view class="tag" v-for="tag in buildTags(item)" :key="tag">
                  <text class="tag-text">{{ tag }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 下方：信息行，与封面图左边齐平 -->
          <view class="card-info">
            <!-- 第一行：时长 + 招募对象 -->
            <view class="info-row">
              <view class="info-item">
                <!-- TODO: 替换为正式icon -->
                <text class="icon-placeholder">⏱</text>
                <text class="info-label">预计时长</text>
                <text class="info-value">{{ item.duration }}</text>
              </view>
              <view class="info-item">
                <!-- TODO: 替换为正式icon -->
                <text class="icon-placeholder">👥</text>
                <text class="info-label">招募对象</text>
                <text class="info-value">{{ formatRecruit(item) }}</text>
              </view>
            </view>

            <!-- 第二行：跑团时间 + 发布人 -->
            <view class="info-row">
              <view class="info-item flex-1">
                <!-- TODO: 替换为正式icon -->
                <text class="icon-placeholder">📅</text>
                <text class="info-label">跑团时间</text>
                <text class="info-value time-text">{{ formatGameTime(item.gameDays, item.startTime, item.endTime) }}</text>
              </view>
              <text class="publisher-name">{{ item.creatorNickname }}</text>
            </view>
          </view>
        </view>

        <view class="list-bottom" />
      </view>
    </scroll-view>

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

/* 卡片列表滚动区 */
.list-scroll {
  flex: 1;

  .list-inner {
    padding: 0 32rpx;
    box-sizing: border-box;

    /* 空状态 */
    .empty-state {
      padding: 100rpx 0;
      display: flex;
      align-items: center;
      justify-content: center;

      .empty-text {
        font-size: 28rpx;
        color: #b2b2b2;
      }
    }

    /* 招募卡片 */
    .card {
      position: relative;
      width: 100%;
      box-sizing: border-box;
      background-color: #e8e8e8;
      border-radius: 12rpx;
      margin-bottom: 8rpx;
      overflow: hidden;

      /* 已发车蒙层 */
      .departed-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        border-radius: 12rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;

        .departed-stamp {
          font-size: 44rpx;
          font-weight: 700;
          color: #ffffff;
          background-color: rgba(0, 0, 0, 0.4);
          border: 3rpx solid #ffffff;
          border-radius: 10rpx;
          padding: 6rpx 28rpx;
          letter-spacing: 8rpx;
        }
      }

      /* 上方：封面图 + 标题/tag 横排 */
      .card-top {
        display: flex;
        flex-direction: row;
        padding: 16rpx 32rpx 12rpx;
        gap: 20rpx;
        align-items: flex-start;
      }

      /* 封面图 */
      .card-cover {
        flex-shrink: 0;
        width: 100rpx;
        height: 100rpx;
        border-radius: 10rpx;
        overflow: hidden;

        .cover-img {
          width: 100%;
          height: 100%;
        }

        .cover-placeholder {
          width: 100%;
          height: 100%;
          background-color: #d9d9d9;
        }
      }

      /* 右侧：标题 + tag */
      .card-title {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 8rpx;

        .module-name {
          font-size: 36rpx;
          font-weight: 700;
          color: #363636;
          display: block;
        }

        .tags-row {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          gap: 8rpx;

          .tag {
            display: inline-flex;
            align-items: center;
            background-color: #434343;
            border-radius: 999rpx;
            padding: 0 16rpx;
            height: 32rpx;

            .tag-text {
              font-size: 22rpx;
              color: #ffffff;
            }
          }
        }
      }

      /* 下方：信息行，与卡片左边齐平 */
      .card-info {
        padding: 0 32rpx 16rpx;
        display: flex;
        flex-direction: column;
        gap: 8rpx;

        .info-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;

          .info-item {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 4rpx;

            &.flex-1 {
              flex: 1;
              min-width: 0;
            }

            .icon-placeholder {
              font-size: 22rpx;
              flex-shrink: 0;
            }

            .info-label {
              font-size: 22rpx;
              color: #888888;
            }

            .info-value {
              font-size: 22rpx;
              color: #363636;

              &.time-text {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            }
          }

          .publisher-name {
            font-size: 22rpx;
            color: #b2b2b2;
            flex-shrink: 0;
          }
        }
      }
    }
  }

  .list-bottom {
    height: 40rpx;
  }
}
</style>
