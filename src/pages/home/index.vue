<!-- 招募大厅首页 - 浅灰背景，展示招募卡片列表，支持搜索和标签筛选 -->
<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useGameStore } from '@/store/game'
import { fuzzySearch } from '@/utils/search'
import { formatGameTime } from '@/utils/formatTime'
const gameStore = useGameStore()

// 每次 onShow 时重新读取数据，确保发布人在别处发车后，切回大厅时已发车卡片及时消失
// store 已是响应式数据源，computed 自动更新，此处保留 hook 供后端接口替换
// 同时更新自定义 TabBar 选中态
onShow(() => {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  if (typeof page?.getTabBar === 'function') {
    page.getTabBar()?.setData({ selected: 0 })
  }
})
const searchKeyword = ref('')

// 筛选 tag 平铺排列，支持多选
const filterTags = ['COC', 'DND', '其他', 'KP', 'PL', 'DM', '语音', '文字']

// 维度映射（代码内部用，UI 上不体现分组）
const FILTER_DIMS = {
  rule: ['COC', 'DND', '其他'],
  target: ['KP', 'PL', 'DM'],
  mode: ['语音', '文字'],
}

// 选中状态：存所有被选中的 tag
const selectedFilters = ref([])

const toggleFilter = (tag) => {
  const idx = selectedFilters.value.indexOf(tag)
  if (idx >= 0) {
    selectedFilters.value.splice(idx, 1)
  } else {
    selectedFilters.value.push(tag)
  }
}

const hasActiveFilter = computed(() => selectedFilters.value.length > 0)

// 单个 tag 的匹配函数
const matchTag = (item, tag) => {
  if (tag === 'COC') return item.rule && item.rule.startsWith('COC')
  if (tag === 'DND') return item.rule && item.rule.startsWith('DND')
  if (tag === '其他') return item.rule && !item.rule.startsWith('COC') && !item.rule.startsWith('DND')
  if (tag === 'KP' || tag === 'DM') return item.recruitKP === true
  if (tag === 'PL') return item.plCount > 0
  if (tag === '语音') return item.mode === '语音'
  if (tag === '文字') return item.mode === '文字'
  return true
}

// 同维度 OR，跨维度 AND
const list = computed(() => {
  let result = gameStore.recruitingModules

  if (searchKeyword.value) {
    result = fuzzySearch(searchKeyword.value, result, ['name', 'publisherName', 'tags', 'intro'])
  }

  if (selectedFilters.value.length > 0) {
    result = result.filter(item => {
      return Object.values(FILTER_DIMS).every(dimTags => {
        const active = dimTags.filter(t => selectedFilters.value.includes(t))
        // 该维度没有选中任何 tag → 不筛选（通过）
        if (active.length === 0) return true
        // 该维度内任一 tag 匹配即通过（OR）
        return active.some(t => matchTag(item, t))
      })
    })
  }

  return result
})

const goDetail = (item) => {
  uni.navigateTo({ url: `/pages/home/detail?id=${item.id}` })
}
</script>

<template>
  <view class="page">

    <!-- 顶部区域：搜索 + 筛选，统一横向 padding -->
    <view class="top-area">
      <!-- 搜索栏 -->
      <view class="search-bar">
        <view class="search-wrap">
          <input
            v-model="searchKeyword"
            placeholder="模组名称"
            placeholder-class="search-placeholder"
            class="search-input"
            maxlength="30"
          />
          <view class="search-funnel-dot" />
        </view>
      </view>

      <!-- 筛选标签行（平铺多选） -->
      <view class="filter-row">
        <!-- 漏斗色块占位 -->
        <view class="filter-funnel-dot" />
        <scroll-view scroll-x="true" class="filter-scroll">
          <view class="filter-inner">
            <view
              class="filter-tag"
              v-for="tag in filterTags"
              :key="tag"
              :class="{ active: selectedFilters.includes(tag) }"
              @tap="toggleFilter(tag)"
            >
              <text class="filter-tag-text">{{ tag }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 招募卡片列表 -->
    <scroll-view scroll-y class="list-scroll">
      <view class="list-inner">
        <!-- 空状态 -->
        <view v-if="list.length === 0" class="empty-state">
          <text class="empty-text">{{ hasActiveFilter || searchKeyword ? '没有找到符合条件的招募' : '暂无招募，快去发布第一个吧' }}</text>
        </view>
        <view
          class="card"
          v-for="item in list"
          :key="item.id"
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
              <text class="module-name">{{ item.name }}</text>
              <view class="tags-row">
                <view class="tag" v-for="tag in item.tags" :key="tag">
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
                <text class="info-value">{{ item.recruit }}</text>
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
              <text class="publisher-name">{{ item.publisherName }}</text>
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

/* 顶部区域统一横向 padding */
.top-area {
  padding: 0 32rpx;
  box-sizing: border-box;
}

/* 搜索栏 */
.search-bar {
  padding: 16rpx 0 8rpx;

  .search-wrap {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    height: 64rpx;
    background-color: #f5f5f5;
    border: 1rpx solid #d9d9d9;
    border-radius: 999rpx;
    padding: 0 16rpx 0 24rpx;

    .search-input {
      flex: 1;
      font-size: 26rpx;
      color: #363636;
      height: 64rpx;
      min-width: 0;
    }

    .search-funnel-dot {
      flex-shrink: 0;
      width: 32rpx;
      height: 32rpx;
      background-color: #666666;
      border-radius: 50%;
    }
  }
}

/* 筛选标签行 */
.filter-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 0 8rpx;
  gap: 8rpx;

  /* 漏斗色块占位 */
  .filter-funnel-dot {
    flex-shrink: 0;
    width: 32rpx;
    height: 32rpx;
    background-color: #666666;
    border-radius: 50%;
  }

  .filter-scroll {
    flex: 1;
    white-space: nowrap;

    .filter-inner {
      display: inline-flex;
      flex-direction: row;
      align-items: center;
      gap: 8rpx;

      .filter-tag {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 32rpx;
        background-color: #434343;
        border-radius: 999rpx;
        padding: 0 16rpx;
        flex-shrink: 0;

        &.active {
          background-color: #2c2c2c;
        }

        .filter-tag-text {
          font-size: 22rpx;
          color: #ffffff;
          line-height: 32rpx;
        }
      }
    }
  }
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
