<!-- 招募详情页（申请人视角）- 所有人均为申请人视角，含发布人「管理招募」入口和完整按钮状态机 -->
<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow, onShareAppMessage } from '@dcloudio/uni-app'
import ModuleDetail from '@/components/ModuleDetail.vue'
import ShareMenu from '@/components/ShareMenu.vue'
import { useGameStore } from '@/store/game'
import { useUserStore } from '@/store/user'
import { checkLogin } from '@/utils/auth'
import { getUserByUid } from '@/api/user'

const gameStore = useGameStore()
const userStore = useUserStore()

const moduleId = ref('')
const showContactModal = ref(false)
const showShareMenu = ref(false)

onLoad((options) => {
  moduleId.value = options?.id || '1'
})

// 每次 onShow 时重新读取数据，确保状态同步（发车/审批后返回时及时更新）
onShow(() => {
  // store 已是响应式数据源，computed 自动更新，此处保留 hook 供后端接口替换
})

// 从 store 响应式读取模组
const currentModule = computed(() =>
  gameStore.modules.find(m => m.id == moduleId.value) || null
)

// 当前用户是否是发布人
const isCreator = computed(() =>
  userStore.isLoggedIn && !!moduleId.value && currentModule.value?.creatorId === userStore.uid
)

// 当前用户对该模组的申请记录
const myApplication = computed(() =>
  gameStore.myApplicationForModule(moduleId.value, userStore.uid)
)

// 联系方式：审批通过后显示
const contactInfo = computed(() => {
  const c = currentModule.value?.contact
  if (!c) return '暂无联系方式'
  if (typeof c === 'string') return c || '暂无联系方式'
  if (!c.value) return '暂无联系方式'
  const labelMap = { wx: '微信号', qq: 'QQ 号', qqgroup: 'QQ 群号' }
  return `${labelMap[c.type] || '联系方式'}：${c.value}`
})

// 发布人信息（用于海报生成）
const creatorInfo = computed(() => {
  if (!currentModule.value?.creatorId) return {}
  return getUserByUid(currentModule.value.creatorId) || {}
})

/**
 * 按钮状态枚举：
 *   finished  → 已发车（任何人）
 *   creator   → 发布人本人（灰色「申请加入」）
 *   none      → 未申请（深色「申请加入」）
 *   pending   → 待审核
 *   approved  → 已通过
 *   rejected  → 未通过
 */
const btnState = computed(() => {
  if (!currentModule.value) return 'none'
  // 已发车但已通过审核的申请人仍可查看联系方式
  if (currentModule.value.status === 'finished') {
    if (myApplication.value?.status === 'approved') return 'finished_approved'
    return 'finished'
  }
  if (isCreator.value) return 'creator'
  return myApplication.value?.status || 'none'
})

// 点击申请加入
const handleApply = async () => {
  const ok = await checkLogin(userStore)
  if (!ok) return

  // 乐观锁：申请前再次确认模组状态
  const mod = gameStore.modules.find(m => m.id == moduleId.value)
  if (!mod || mod.status === 'finished') {
    uni.showToast({ title: '该招募已发车，无法申请', icon: 'none' })
    return
  }

  // 提交申请
  gameStore.applyToModule(moduleId.value, {
    uid: userStore.uid,
    nickname: userStore.nickname,
  })
  uni.showToast({ title: '申请已提交', icon: 'success' })
}

// 发布人点击灰色「申请加入」按钮的提示
const handleCreatorTap = () => {
  uni.showToast({ title: '你是本次招募的发布人，无法申请', icon: 'none' })
}

// 点击发布人头像/昵称 → 跳转发布人用户主页
const goCreatorProfile = async (creatorId) => {
  if (!creatorId) return
  const ok = await checkLogin(userStore)
  if (!ok) return
  uni.navigateTo({ url: `/pages/profile/index?uid=${creatorId}` })
}

// 跳转发布人详情页（管理招募）
const goManage = () => {
  uni.navigateTo({ url: `/pages/mine/detail?id=${moduleId.value}` })
}

onShareAppMessage(() => ({
  title: currentModule.value?.name || '来看看这个跑团招募',
  path: `/pages/home/detail?id=${moduleId.value}`,
}))
</script>

<template>
  <view class="page-container">

    <!-- 页面内容区 -->
    <scroll-view scroll-y class="scroll-area">

      <!-- 标题行：模组名称 + 分享/管理 -->
      <view class="title-row" v-if="currentModule">
        <text class="module-title">{{ currentModule.name }}</text>
        <view class="title-actions">
          <view class="share-btn" @tap="showShareMenu = true">
            <text class="share-btn-text">📤</text>
          </view>
          <text v-if="isCreator" class="manage-link" @tap="goManage">管理招募</text>
        </view>
      </view>

      <!-- 模组信息（共用组件） -->
      <ModuleDetail v-if="currentModule" :module="currentModule" @tapPublisher="goCreatorProfile" />

      <!-- 底部留白，防止吸底按钮遮挡内容 -->
      <view class="bottom-placeholder" />
    </scroll-view>

    <!-- 底部吸底按钮 -->
    <view class="bottom-bar">
      <!-- 已发车 + 已通过：仍可查看联系方式 -->
      <view v-if="btnState === 'finished_approved'" class="apply-btn apply-btn--approved" @tap="showContactModal = true">
        <text class="apply-btn-text">✓ 已通过 · 已发车</text>
      </view>
      <!-- 已发车（其他所有人） -->
      <view v-else-if="btnState === 'finished'" class="apply-btn apply-btn--disabled">
        <text class="apply-btn-text">已发车</text>
      </view>
      <!-- 发布人本人（灰色，点击提示） -->
      <view v-else-if="btnState === 'creator'" class="apply-btn apply-btn--disabled" @tap="handleCreatorTap">
        <text class="apply-btn-text">申请加入</text>
      </view>
      <!-- 未申请 -->
      <view v-else-if="btnState === 'none'" class="apply-btn apply-btn--default" @tap="handleApply">
        <text class="apply-btn-text">申请加入</text>
      </view>
      <!-- 待审核 -->
      <view v-else-if="btnState === 'pending'" class="apply-btn apply-btn--disabled">
        <text class="apply-btn-text">等候审核中</text>
      </view>
      <!-- 已通过 -->
      <view v-else-if="btnState === 'approved'" class="apply-btn apply-btn--approved" @tap="showContactModal = true">
        <text class="apply-btn-text">✓ 已通过</text>
      </view>
      <!-- 未通过 -->
      <view v-else-if="btnState === 'rejected'" class="apply-btn apply-btn--disabled">
        <text class="apply-btn-text">未通过</text>
      </view>
    </view>

    <!-- 联系方式弹窗 -->
    <view v-if="showContactModal" class="modal-overlay" @tap="showContactModal = false">
      <view class="modal-box" @tap.stop>
        <text class="modal-title">你已通过审核 🎉</text>
        <text class="modal-desc">发布人联系方式：</text>
        <text class="modal-contact">{{ contactInfo }}</text>
        <view class="modal-btn" @tap="showContactModal = false">
          <text class="modal-btn-text">我知道了</text>
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

/* 标题行 */
.title-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16rpx 32rpx 8rpx;
  box-sizing: border-box;
}

.module-title {
  flex: 1;
  font-size: 44rpx;
  font-weight: bold;
  color: $text-primary;
  line-height: 1.3;
}

.title-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
  flex-shrink: 0;
  padding-top: 8rpx;
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

.manage-link {
  font-size: 26rpx;
  color: $text-secondary;
  text-decoration: underline;
}

.bottom-placeholder {
  height: 160rpx;
}

/* 底部吸底按钮 */
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
}

.apply-btn {
  border-radius: 16rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;

  .apply-btn-text {
    font-size: 32rpx;
    font-weight: 600;
    letter-spacing: 4rpx;
  }

  &--default {
    background-color: $bg-navbar;

    .apply-btn-text {
      color: $white;
    }
  }

  &--disabled {
    background-color: $bg-card;

    .apply-btn-text {
      color: $text-muted;
    }
  }

  &--approved {
    background-color: #2a7a4a;

    .apply-btn-text {
      color: $white;
    }
  }
}

/* 联系方式弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: $bg-card-overlay;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-box {
  background-color: $white;
  border-radius: 20rpx;
  padding: 48rpx 40rpx;
  margin: 0 64rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  box-sizing: border-box;

  .modal-title {
    font-size: 34rpx;
    font-weight: bold;
    color: $text-secondary;
  }

  .modal-desc {
    font-size: 26rpx;
    color: $text-muted;
  }

  .modal-contact {
    font-size: 32rpx;
    font-weight: bold;
    color: $text-primary;
  }

  .modal-btn {
    margin-top: 16rpx;
    background-color: $bg-navbar;
    border-radius: 10rpx;
    padding: 16rpx 64rpx;
    box-sizing: border-box;

    .modal-btn-text {
      font-size: 28rpx;
      color: $white;
    }
  }
}
</style>
