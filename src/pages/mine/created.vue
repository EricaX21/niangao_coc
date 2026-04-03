<!-- 我的创建/申请/足迹列表页 - 浅色主题，Tab切换，卡片样式与招募大厅一致 -->
<script setup>
import { ref, computed, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useGameStore } from '@/store/game'
import { useUserStore } from '@/store/user'
import { fuzzySearch } from '@/utils/search'
import { formatGameTime } from '@/utils/formatTime'

const gameStore = useGameStore()
const userStore = useUserStore()

const activeTab = ref('created')
const searchKeyword = ref('')

const tabs = [
  { key: 'created', label: '我的创建' },
  { key: 'applied', label: '我的申请' },
]

onLoad((options) => {
  if (options?.tab && options.tab !== 'history') activeTab.value = options.tab
})

// 从 store 响应式读取，发布/申请/审批后自动刷新，支持模糊搜索
const listData = computed(() => {
  let base = []
  if (activeTab.value === 'created') {
    base = gameStore.modulesByCreator(userStore.uid)
  } else if (activeTab.value === 'applied') {
    // 返回带有 _appStatus/_appId 的模组数据
    base = gameStore.applicationsByUser(userStore.uid)
  }
  if (!searchKeyword.value) return base
  return fuzzySearch(searchKeyword.value, base, ['name', 'tags'])
})

// 切换 tab 时清空搜索词
watch(activeTab, () => { searchKeyword.value = '' })

/**
 * 申请状态标签文字
 * 发车后：approved→「✓ 已通过 · 已发车」；rejected→「未通过 · 已发车」
 * @param {string} appStatus   申请状态 pending/approved/rejected
 * @param {string} moduleStatus 模组状态 recruiting/finished
 */
const appStatusText = (appStatus, moduleStatus) => {
  const departed = moduleStatus === 'finished'
  if (appStatus === 'pending') return '审核中'
  if (appStatus === 'approved') return departed ? '✓ 已通过 · 已发车' : '✓ 已通过'
  if (appStatus === 'rejected') return departed ? '未通过 · 已发车' : '未通过'
  return ''
}

/**
 * 申请状态标签 CSS 类
 * 发车后用独立类名覆盖颜色（approved-finished / rejected-finished）
 */
const appStatusClass = (appStatus, moduleStatus) => {
  const departed = moduleStatus === 'finished'
  if (appStatus === 'approved') return departed ? 'app-status-approved-finished' : 'app-status-approved'
  if (appStatus === 'rejected') return departed ? 'app-status-rejected-finished' : 'app-status-rejected'
  return 'app-status-pending'
}

// 卡片点击跳转严格区分角色
// 草稿卡片直接进编辑表单，非草稿进详情页
const handleCardTap = (item) => {
  if (activeTab.value === 'created') {
    if (item.draft) {
      uni.navigateTo({ url: `/pages/publish/form?id=${item.id}` })
    } else {
      uni.navigateTo({ url: `/pages/mine/detail?id=${item.id}` })
    }
  } else {
    // 申请人视角 → 申请人详情页
    uni.navigateTo({ url: `/pages/home/detail?id=${item.id}` })
  }
}

const goCreate = () => uni.navigateTo({ url: '/pages/publish/form' })
</script>

<template>
  <view class="page">
    <!-- Tab 切换栏 -->
    <view class="tab-row">
      <view class="tab-inner">
        <view
          class="tab-item"
          v-for="tab in tabs"
          :key="tab.key"
          :class="{ active: activeTab === tab.key }"
          @tap="activeTab = tab.key"
        >
          <text class="tab-text">{{ tab.label }}</text>
          <view v-if="activeTab === tab.key" class="tab-underline" />
        </view>
      </view>
    </view>

    <!-- 内容区顶部：搜索框 + 发布按钮 -->
    <view class="content-toolbar">
      <view class="search-wrap">
        <input
          v-model="searchKeyword"
          placeholder="搜索模组名称"
          placeholder-class="search-placeholder"
          class="search-input"
          maxlength="30"
        />
      </view>
      <view v-if="activeTab === 'created'" class="publish-btn" @tap="goCreate">
        <text class="publish-btn-text">+ 发布</text>
      </view>
    </view>

    <!-- 卡片列表 -->
    <scroll-view scroll-y class="list-scroll">
      <view class="list-inner">

        <!-- 空状态 -->
        <view v-if="listData.length === 0" class="empty-state">
          <text class="empty-text">{{ activeTab === 'created' ? '还没有发布过招募' : '还没有申请过招募' }}</text>
        </view>

        <view
          class="card"
          v-for="item in listData"
          :key="item._appId || item.id"
          @tap="handleCardTap(item)"
        >
          <!-- 已发车蒙层 -->
          <view v-if="item.status === 'finished'" class="departed-overlay">
            <text class="departed-stamp">已发车</text>
          </view>

          <!-- 上方：封面图 + 标题/tag 横排 -->
          <view class="card-top">
            <view class="card-cover">
              <image v-if="item.cover" :src="item.cover" mode="aspectFill" lazy-load class="cover-img" />
              <view v-else class="cover-placeholder" />
            </view>
            <view class="card-title">
              <text class="module-name">{{ item.draft ? '（草稿）' + item.name : item.name }}</text>
              <view class="tags-row">
                <view class="tag" v-for="tag in item.tags" :key="tag">
                  <text class="tag-text">{{ tag }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 下方：信息行 -->
          <view class="card-info">
            <view class="info-row">
              <view class="info-item">
                <text class="icon-placeholder">⏱</text>
                <text class="info-label">预计时长</text>
                <text class="info-value">{{ item.duration }}</text>
              </view>
              <view class="info-item">
                <text class="icon-placeholder">👥</text>
                <text class="info-label">招募对象</text>
                <text class="info-value">{{ item.recruit }}</text>
              </view>
            </view>
            <view class="info-row">
              <view class="info-item flex-1">
                <text class="icon-placeholder">📅</text>
                <text class="info-label">跑团时间</text>
                <text class="info-value time-text">{{ formatGameTime(item.gameDays, item.startTime, item.endTime) }}</text>
              </view>
              <!-- 我的创建：招募中显示申请人数 -->
              <text
                v-if="activeTab === 'created' && !item.draft && item.status === 'recruiting'"
                class="applicant-count"
              >{{ item.applicantCount }}人申请</text>
              <!-- 我的申请：显示申请状态标签，发车后追加「· 已发车」 -->
              <view
                v-if="activeTab === 'applied' && item._appStatus"
                class="app-status-tag"
                :class="appStatusClass(item._appStatus, item.status)"
              >
                <text class="app-status-text">{{ appStatusText(item._appStatus, item.status) }}</text>
              </view>
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

/* Tab 切换栏 */
.tab-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 32rpx;
  border-bottom: 1rpx solid #eeeeee;
  box-sizing: border-box;
  flex-shrink: 0;

  .tab-inner {
    flex: 1;
    display: flex;
    flex-direction: row;

    .tab-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16rpx 24rpx 12rpx;
      position: relative;

      .tab-text {
        font-size: 28rpx;
        color: #999999;
      }

      &.active .tab-text {
        color: #333333;
        font-weight: 600;
      }

      .tab-underline {
        position: absolute;
        bottom: 0;
        left: 24rpx;
        right: 24rpx;
        height: 4rpx;
        background-color: #2c2c2c;
        border-radius: 2rpx;
      }
    }
  }
}

/* 内容区顶部：搜索框 + 发布按钮 */
.content-toolbar {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 32rpx;
  box-sizing: border-box;
  flex-shrink: 0;

  .search-wrap {
    flex: 1;
    height: 64rpx;
    background-color: #ffffff;
    border: 1rpx solid #d9d9d9;
    border-radius: 999rpx;
    padding: 0 24rpx;
    box-sizing: border-box;
    display: flex;
    align-items: center;

    .search-input {
      flex: 1;
      font-size: 26rpx;
      color: #363636;
      height: 64rpx;
    }
  }

  .publish-btn {
    flex-shrink: 0;
    height: 64rpx;
    border-radius: 999rpx;
    background-color: #2c2c2c;
    padding: 0 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;

    .publish-btn-text {
      font-size: 26rpx;
      color: #ffffff;
    }
  }
}

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

/* 卡片列表滚动区 */
.list-scroll {
  flex: 1;

  .list-inner {
    padding: 0 32rpx;
    box-sizing: border-box;

    /* 招募卡片（与招募大厅一致） */
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

          .applicant-count {
            font-size: 22rpx;
            color: #b2b2b2;
            flex-shrink: 0;
          }

          /* 我的申请 tab 状态标签（颜色规范来自 PRD 补充说明） */
          .app-status-tag {
            height: 36rpx;
            border-radius: 999rpx;
            padding: 0 14rpx;
            display: inline-flex;
            align-items: center;
            flex-shrink: 0;
            box-sizing: border-box;

            .app-status-text {
              font-size: 22rpx;
            }

            &.app-status-pending {
              background-color: #f0f0f0;
              .app-status-text { color: #888888; }
            }

            &.app-status-approved {
              background-color: #e8f5ee;
              .app-status-text { color: #2a7a4a; }
            }

            &.app-status-rejected {
              background-color: #e8e8e8;
              .app-status-text { color: #666666; }
            }

            /* 发车后：已通过 + 已发车 */
            &.app-status-approved-finished {
              background-color: #e8f5ee;
              .app-status-text { color: #2a7a4a; }
            }

            /* 发车后：未通过 + 已发车 */
            &.app-status-rejected-finished {
              background-color: #e8e8e8;
              .app-status-text { color: #666666; }
            }
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
