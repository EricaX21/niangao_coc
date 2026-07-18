<!-- 我的创建/申请/足迹列表页 - 浅色主题，Tab切换，卡片样式与招募大厅一致 -->
<script setup>
import { ref, computed, watch } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getMyModules, deleteModule } from '@/api/module'
import { useGameStore } from '@/store/game'
import { fuzzySearch } from '@/utils/search'
import { formatGameTime } from '@/utils/formatTime'

const gameStore = useGameStore()

const activeTab = ref('created')
const searchKeyword = ref('')
const loading = ref(false)
const rawList = ref([])

const tabs = [
  { key: 'created', label: '我的创建' },
  { key: 'applied', label: '我的申请' },
]

onLoad((options) => {
  if (options?.tab && options.tab !== 'history') activeTab.value = options.tab
})

// 从云函数加载当前 tab 数据
const loadList = async () => {
  loading.value = true
  try {
    const data = await getMyModules(activeTab.value)
    rawList.value = data || []
  } catch (error) {
    console.error('loadList error:', error)
    rawList.value = []
  } finally {
    loading.value = false
  }
}

// onShow 时重新加载（从 P9/P3 返回时需要刷新）
onShow(() => {
  loadList()
})

// 将原始云数据规范化为卡片展示结构
// created tab：模组扁平结构；applied tab：申请记录 + moduleInfo 嵌套
const normalizeItem = (item) => {
  if (activeTab.value === 'applied') {
    const m = item.moduleInfo
    if (!m) {
      // 模组已被删除，仍保留卡片占位
      return {
        _id: null,
        _appId: item._id,
        _appStatus: item.status,
        title: '招募已删除',
        publisherNickname: '',
        intro: '',
        status: 'deleted',
        tags: [],
        duration: '-',
        gameDays: [],
        startTime: '',
        endTime: '',
        cover: '',
        recruit: '-',
        applicantCount: 0,
        isDraft: false,
      }
    }
    return {
      _id: m._id,
      _appId: item._id,
      _appStatus: item.status,
      title: m.title,
      publisherNickname: m.creatorNickname || '',
      intro: m.intro || '',
      status: m.status,
      tags: buildTags(m),
      duration: m.duration,
      gameDays: m.gameDays,
      startTime: m.startTime,
      endTime: m.endTime,
      cover: m.coverImage || '',
      recruit: formatRecruit(m),
      applicantCount: m.applyCount || 0,
      isDraft: m.status === 'draft',
    }
  }
  // created tab
  return {
    _id: item._id,
    _appId: null,
    _appStatus: null,
    title: item.title,
    publisherNickname: item.creatorNickname || '',
    intro: item.intro || '',
    status: item.status,
    tags: buildTags(item),
    duration: item.duration,
    gameDays: item.gameDays,
    startTime: item.startTime,
    endTime: item.endTime,
    cover: item.coverImage || '',
    recruit: formatRecruit(item),
    applicantCount: item.applyCount || 0,
    isDraft: item.status === 'draft',
  }
}

// 根据 plCount / recruitKP 拼接招募对象展示文本
const formatRecruit = (item) => {
  const parts = []
  if (item.recruitKP) parts.push('1KP')
  if (item.plCount) parts.push(`${item.plCount}PL`)
  return parts.length > 0 ? parts.join(' ') : '待定'
}

// 从 rule / mode / playerCount 动态生成 tag 数组
const buildTags = (item) => {
  const tags = []
  if (item.mode) tags.push(item.mode)
  if (item.rule) tags.push(item.rule)
  if (item.playerCount) tags.push(`${item.playerCount}人`)
  return tags
}

// 规范化后的列表 + 前端模糊搜索（按标题 + tags）
const listData = computed(() => {
  const base = rawList.value.map(normalizeItem)
  if (!searchKeyword.value) return base
  return fuzzySearch(searchKeyword.value, base, ['title', 'publisherNickname', 'intro'])
})

// 切换 tab 时清空搜索词并重新加载
watch(activeTab, () => {
  searchKeyword.value = ''
  loadList()
})

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
// 草稿卡片载回首页工作区继续编辑，非草稿进详情页
const handleCardTap = (item) => {
  if (activeTab.value === 'created') {
    if (item.isDraft) {
      // switchTab 不能带参数，草稿 id 经 store 传递给首页工作区
      gameStore.setPendingDraftId(item._id)
      uni.switchTab({ url: '/pages/publish/index' })
    } else {
      uni.navigateTo({ url: `/pages/mine/detail?id=${item._id}` })
    }
  } else {
    // 申请人视角 → 模组已删除时 Toast 提示
    if (!item._id) {
      uni.showToast({ title: '该招募已不存在', icon: 'none' })
      return
    }
    uni.navigateTo({ url: `/pages/home/detail?id=${item._id}` })
  }
}

// 删除草稿：破坏性操作，二次确认后调云函数删除并刷新列表
const handleDeleteDraft = (item) => {
  uni.showModal({
    title: '删除这条草稿？',
    content: '删除后不可恢复',
    confirmText: '删除',
    success: async (res) => {
      if (!res.confirm) return
      uni.showLoading({ title: '删除中...', mask: true })
      const result = await deleteModule(item._id)
      uni.hideLoading()
      if (result.success) {
        uni.showToast({ title: '已删除', icon: 'none' })
        loadList()
      } else {
        uni.showToast({ title: result.message || '删除失败', icon: 'none' })
      }
    }
  })
}

const goCreate = () => uni.switchTab({ url: '/pages/publish/index' })
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
          placeholder="搜索模组名称/发布人/简介"
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
        <view v-if="!loading && listData.length === 0" class="empty-state">
          <text class="empty-text">{{ activeTab === 'created' ? '还没有发布招募，去发布一个吧' : '还没有申请过招募' }}</text>
        </view>

        <view
          class="card"
          v-for="item in listData"
          :key="item._appId || item._id"
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
              <text class="module-name">{{ item.isDraft ? '（草稿）' + item.title : item.title }}</text>
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
                v-if="activeTab === 'created' && !item.isDraft && item.status === 'recruiting'"
                class="applicant-count"
              >{{ item.applicantCount }}人申请</text>
              <!-- 草稿：删除入口（tap.stop 避免触发卡片跳转） -->
              <text
                v-if="activeTab === 'created' && item.isDraft"
                class="draft-delete"
                @tap.stop="handleDeleteDraft(item)"
              >删除</text>
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

          .draft-delete {
            font-size: 22rpx;
            color: #b2b2b2;
            flex-shrink: 0;
            padding: 8rpx 12rpx;
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
