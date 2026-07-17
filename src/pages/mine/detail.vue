<!-- 模组详情页（发布人视角）- 底部按钮随招募状态变化，发车时自动清算 pending 申请 -->
<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow, onShareAppMessage } from '@dcloudio/uni-app'
import ModuleDetail from '@/components/ModuleDetail.vue'
import ShareMenu from '@/components/ShareMenu.vue'
import { getModuleById, updateModule, departModule } from '@/api/module'
import { safeNavigateBack } from '@/utils/navigation'

const moduleId = ref(null)
const currentModule = ref(null)
const loading = ref(false)
const showShareMenu = ref(false)

onLoad((options) => {
  moduleId.value = options?.id || null
})

// 每次 onShow 时重新加载，从审核页返回后数据立即更新
onShow(() => {
  if (moduleId.value) {
    loadDetail()
  }
})

// 从云函数加载模组详情
const loadDetail = async () => {
  loading.value = true
  try {
    const data = await getModuleById(moduleId.value)
    currentModule.value = data
  } catch (error) {
    console.error('loadDetail error:', error)
    currentModule.value = null
  } finally {
    loading.value = false
  }
}

// 当前招募状态：draft / recruiting / finished
const moduleStatus = computed(() => {
  if (!currentModule.value) return 'recruiting'
  if (currentModule.value.status === 'draft') return 'draft'
  return currentModule.value.status
})

// 编辑：带 _id 参数直接跳转表单页
const handleEdit = () => {
  uni.navigateTo({ url: `/pages/publish/form?id=${moduleId.value}` })
}

// 审核：跳转审核页
const handleReview = () => {
  uni.navigateTo({ url: `/pages/mine/review?id=${moduleId.value}` })
}

// 发布（草稿 → 招募中）
const handlePublish = () => {
  uni.showModal({
    title: '发出去喽',
    content: '发布后招募将在大厅对外展示，确认发布？',
    success: async (res) => {
      if (res.confirm) {
        const result = await updateModule(moduleId.value, { status: 'recruiting' })
        if (result.success) {
          uni.showToast({ title: '发出去喽', icon: 'success' })
          setTimeout(() => safeNavigateBack(), 1500)
        } else {
          uni.showToast({ title: result.message || '发布失败', icon: 'none' })
        }
      }
    },
  })
}

// 发车（招募中 → 已发车）：云函数自动清算所有 pending 申请
const handleDepart = () => {
  const approvedNum = currentModule.value?.approvedCount || 0

  uni.showModal({
    title: '确认发车',
    content: `当前已通过 ${approvedNum} 人，发车后招募将关闭，确认发车？`,
    success: async (res) => {
      if (res.confirm) {
        const result = await departModule(moduleId.value)
        if (result.success) {
          uni.showToast({ title: '已发车！', icon: 'success' })
          setTimeout(() => uni.redirectTo({ url: '/pages/mine/created?tab=created' }), 1500)
        } else {
          uni.showToast({ title: result.message || '发车失败', icon: 'none' })
        }
      }
    },
  })
}

// 发布人信息（用于海报生成）
const creatorInfo = computed(() => {
  if (!currentModule.value) return {}
  return {
    nickname: currentModule.value.creatorNickname || '',
    avatar: currentModule.value.creatorAvatar || ''
  }
})

onShareAppMessage(() => ({
  title: currentModule.value?.title || '来看看这个跑团招募',
  path: `/pages/home/detail?id=${moduleId.value}`,
}))
</script>

<template>
  <view class="page-container">

    <!-- 加载中 -->
    <view v-if="loading && !currentModule" class="loading-state">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 页面内容（可滚动） -->
    <scroll-view v-else scroll-y class="scroll-area">
      <view class="module-title-wrap" v-if="currentModule">
        <text class="module-title">{{ currentModule.title }}</text>
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

      <!-- 空状态 -->
      <view v-if="!currentModule && !loading" class="empty-state">
        <text class="empty-text">模组不存在或已被删除</text>
      </view>

      <view class="bottom-placeholder" />
    </scroll-view>

    <!-- 底部按钮区（随状态变化） -->
    <view class="bottom-bar" v-if="currentModule">

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

.loading-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
}

.loading-text {
  font-size: 28rpx;
  color: #b2b2b2;
}

.empty-state {
  padding: 200rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-text {
  font-size: 28rpx;
  color: #b2b2b2;
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
