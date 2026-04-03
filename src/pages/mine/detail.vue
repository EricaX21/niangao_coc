<!-- 模组详情页（发布人视角）- 底部按钮随招募状态变化，发车时自动清算 pending 申请 -->
<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow, onShareAppMessage } from '@dcloudio/uni-app'
import ModuleDetail from '@/components/ModuleDetail.vue'
import ShareMenu from '@/components/ShareMenu.vue'
import { useGameStore } from '@/store/game'
import { getUserByUid } from '@/api/user'

const gameStore = useGameStore()
const moduleId = ref(null)
const showShareMenu = ref(false)

onLoad((options) => {
  moduleId.value = options.id || gameStore.modules[0]?.id || null
})

// 每次 onShow 时重新读取，从审核页返回后已通过/待审核人数立即更新
onShow(() => {
  // store 已是响应式数据源，computed 自动更新，此处保留 hook 供后端接口替换
})

// 从 store 响应式读取
const currentModule = computed(() =>
  moduleId.value ? gameStore.modules.find(m => m.id == moduleId.value) : null
)

// 当前招募状态：draft / recruiting / finished
const moduleStatus = computed(() => {
  if (!currentModule.value) return 'recruiting'
  if (currentModule.value.draft) return 'draft'
  return currentModule.value.status
})

// 已通过人数（用于发车确认弹窗）
const approvedCount = computed(() =>
  gameStore.applicationsByModule(moduleId.value).filter(a => a.status === 'approved').length
)

// 待审核人数（用于发车确认弹窗显示未处理数量）
const pendingCount = computed(() =>
  gameStore.applicationsByModule(moduleId.value).filter(a => a.status === 'pending').length
)

// 编辑：带 id 参数直接跳转表单页
const handleEdit = () => {
  uni.navigateTo({ url: `/pages/publish/form?id=${moduleId.value}` })
}

// 审核：跳转审核页
const handleReview = () => {
  uni.navigateTo({ url: `/pages/mine/review?id=${moduleId.value}` })
}

// 发布（草稿 → 招募中）：弹「发出去喽」确认，与 P3 表单行为一致
const handlePublish = () => {
  uni.showModal({
    title: '发出去喽',
    content: '发布后招募将在大厅对外展示，确认发布？',
    success: (res) => {
      if (res.confirm) {
        gameStore.updateModuleStatus(moduleId.value, { draft: false, status: 'recruiting' })
        uni.showToast({ title: '发出去喽 🎉', icon: 'success' })
        setTimeout(() => uni.navigateBack(), 1500)
      }
    },
  })
}

// 发车（招募中 → 已发车）：自动清算所有 pending 申请
const handleDepart = () => {
  const content = pendingCount.value > 0
    ? `当前已通过 ${approvedCount.value} 人，发车后招募将关闭，未处理的申请将自动标记为未通过，确认发车？`
    : `当前已通过 ${approvedCount.value} 人，发车后招募将关闭，确认发车？`

  uni.showModal({
    title: '确认发车',
    content,
    success: (res) => {
      if (res.confirm) {
        // 发车 + 自动清算 pending（一次操作完成）
        gameStore.departModule(moduleId.value)
        uni.showToast({ title: '已发车！', icon: 'success' })
        setTimeout(() => uni.redirectTo({ url: '/pages/mine/created?tab=created' }), 1500)
      }
    },
  })
}

// 发布人信息（用于海报生成）
const creatorInfo = computed(() => {
  if (!currentModule.value?.creatorId) return {}
  return getUserByUid(currentModule.value.creatorId) || {}
})

onShareAppMessage(() => ({
  title: currentModule.value?.name || '来看看这个跑团招募',
  path: `/pages/home/detail?id=${moduleId.value}`,
}))
</script>

<template>
  <view class="page-container">

    <!-- 页面内容（可滚动） -->
    <scroll-view scroll-y class="scroll-area">
      <view class="module-title-wrap" v-if="currentModule">
        <text class="module-title">{{ currentModule.name }}</text>
        <view class="title-right">
          <view v-if="moduleStatus === 'draft'" class="draft-tag">
            <text class="draft-tag-text">草稿</text>
          </view>
          <view class="share-btn" @tap="showShareMenu = true">
            <text class="share-btn-text">📤</text>
          </view>
        </view>
      </view>

      <ModuleDetail v-if="currentModule" :module="currentModule" />
      <view class="bottom-placeholder" />
    </scroll-view>

    <!-- 底部按钮区（随状态变化） -->
    <view class="bottom-bar">

      <!-- 草稿状态：编辑 + 发布 -->
      <view v-if="moduleStatus === 'draft'" class="btn-row">
        <view class="action-btn btn-secondary" @tap="handleEdit">
          <text class="action-btn-text">编辑</text>
        </view>
        <view class="action-btn btn-primary" @tap="handlePublish">
          <text class="action-btn-text">发布</text>
        </view>
      </view>

      <!-- 招募中：编辑 + 审核 + 发车 -->
      <view v-else-if="moduleStatus === 'recruiting'" class="btn-row">
        <view class="action-btn btn-secondary" @tap="handleEdit">
          <text class="action-btn-text">编辑</text>
        </view>
        <view class="action-btn btn-secondary" @tap="handleReview">
          <text class="action-btn-text">审核</text>
        </view>
        <view class="action-btn btn-primary" @tap="handleDepart">
          <text class="action-btn-text">发车</text>
        </view>
      </view>

      <!-- 已发车：只读，按钮置灰 -->
      <view v-else class="btn-row">
        <view class="action-btn btn-disabled">
          <text class="action-btn-text">已发车</text>
        </view>
      </view>

    </view>

    <!-- 分享菜单 -->
    <ShareMenu
      v-model:show="showShareMenu"
      :module-data="currentModule"
      :creator-info="creatorInfo"
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

.scroll-area {
  flex: 1;
}

.module-title-wrap {
  padding: 16rpx 32rpx 8rpx;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
  box-sizing: border-box;

  .module-title {
    flex: 1;
    font-size: 44rpx;
    font-weight: bold;
    color: $text-primary;
    line-height: 1.3;
  }

  .title-right {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12rpx;
    flex-shrink: 0;
    padding-top: 8rpx;
  }

  .draft-tag {
    background-color: $bg-tag;
    border-radius: 999rpx;
    padding: 4rpx 16rpx;
    height: 36rpx;
    display: flex;
    align-items: center;

    .draft-tag-text {
      font-size: 22rpx;
      color: $text-tag;
    }
  }

  .share-btn {
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }

  .share-btn-text {
    font-size: 36rpx;
  }
}

.bottom-placeholder {
  height: 180rpx;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background-color: $bg-page;
  border-top: 1rpx solid $border-color;
  box-sizing: border-box;

  .btn-row {
    display: flex;
    flex-direction: row;
    gap: 16rpx;
  }

  .action-btn {
    flex: 1;
    height: 88rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;

    .action-btn-text {
      font-size: 30rpx;
      font-weight: 600;
    }
  }

  .btn-secondary {
    background-color: $bg-card;

    .action-btn-text {
      color: $text-secondary;
    }
  }

  .btn-primary {
    background-color: $bg-navbar;

    .action-btn-text {
      color: $white;
    }
  }

  .btn-disabled {
    background-color: $border-color;

    .action-btn-text {
      color: $text-placeholder;
    }
  }
}
</style>
