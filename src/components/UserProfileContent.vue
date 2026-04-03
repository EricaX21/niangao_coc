<!-- 用户主页内容组件 - mine/index 和 profile/index 共用，通过 isSelf 区分本人/他人视角 -->
<!-- 四层布局：个人信息 → 快捷入口 → 档案馆 tab 栏（sticky 吸顶） → tab 内容区 -->
<template>
  <view class="profile-content">

    <!-- 第一层：顶部个人信息区（深色背景，跟随滚动） -->
    <view class="user-header">
      <!-- 设置图标（仅本人视角） -->
      <view v-if="isSelf" class="header-tools">
        <view class="setting-btn" @tap="handleLogout">
          <view class="setting-icon-placeholder" />
        </view>
      </view>

      <!-- 头像 + 昵称/uid/性别/身份tag/签名 -->
      <view class="user-info">
        <image v-if="userInfo.avatar" class="avatar" :src="userInfo.avatar" mode="aspectFill" />
        <view v-else class="avatar-block" />
        <view class="user-meta">
          <view class="name-row">
            <text class="nickname">{{ userInfo.nickname || '未登录' }}</text>
            <view class="role-tags">
              <text v-if="userInfo.isKP" class="role-tag kp">KP</text>
              <text v-if="userInfo.isPL" class="role-tag pl">PL</text>
            </view>
          </view>
          <view class="uid-row">
            <text class="uid-text">uid: {{ userInfo.uid || '——' }}</text>
            <text class="gender-text">{{ genderLabel }}</text>
          </view>
          <text class="bio-text">{{ userInfo.bio || '这个人很神秘，什么都没留下' }}</text>
        </view>
      </view>

      <!-- 关注/粉丝/获赞（占位） -->
      <view class="stats-row">
        <view class="stat-item">
          <text class="stat-num">0</text>
          <text class="stat-label">关注</text>
        </view>
        <view class="stat-divider" />
        <view class="stat-item">
          <text class="stat-num">0</text>
          <text class="stat-label">粉丝</text>
        </view>
        <view class="stat-divider" />
        <view class="stat-item">
          <text class="stat-num">0</text>
          <text class="stat-label">获赞</text>
        </view>
      </view>

      <!-- 编辑资料按钮（仅本人视角） -->
      <view v-if="isSelf" class="edit-profile-btn" @tap="goEditProfile">
        <text class="edit-profile-text">编辑资料</text>
      </view>
    </view>

    <!-- 第二层：快捷入口4格（仅本人视角，跟随滚动） -->
    <view v-if="isSelf" class="quick-grid">
      <view
        v-for="entry in quickEntries"
        :key="entry.label"
        class="quick-item"
        @tap="entry.action"
      >
        <text class="quick-icon">{{ entry.icon }}</text>
        <text class="quick-label">{{ entry.label }}</text>
      </view>
    </view>

    <!-- 第三层：档案馆 tab 栏（sticky 吸顶） -->
    <view class="archive-tab-bar">
      <view
        v-for="tab in archiveTabs"
        :key="tab.key"
        class="archive-tab-item"
        :class="{ active: currentArchiveTab === tab.key }"
        @tap="currentArchiveTab = tab.key"
      >
        <text class="archive-tab-text">{{ tab.label }}</text>
        <view v-if="currentArchiveTab === tab.key" class="archive-tab-underline" />
      </view>
    </view>

    <!-- 第四层：当前 tab 的内容区 -->
    <view class="archive-content" :style="{ minHeight: archiveContentMinHeight }">
      <!-- 演绎记录 tab -->
      <view v-if="currentArchiveTab === 'logs'">
        <!-- 有记录 -->
        <view v-if="userLogs.length > 0" class="log-card-list">
          <view
            v-for="log in userLogs"
            :key="log.id"
            class="log-card"
            @tap="goLogDetail(log.id)"
          >
            <text class="log-card-title">{{ log.title }}</text>
            <view class="log-card-tags">
              <view class="log-tag module-tag">
                <text class="log-tag-text">{{ log.moduleName }}</text>
              </view>
              <view v-for="tag in log.tags" :key="tag" class="log-tag">
                <text class="log-tag-text">{{ tag }}</text>
              </view>
            </view>
            <text class="log-card-preview">{{ getPreviewText(log.content) }}</text>
            <text class="log-card-date">{{ log.createdAt }}</text>
          </view>
        </view>
        <!-- 无记录 -->
        <view v-else class="empty-state">
          <text class="empty-text">还没有演绎记录</text>
        </view>
        <!-- 本人视角：底部新增按钮 -->
        <view v-if="isSelf" class="log-add-btn" @tap="goLogDetail()">
          <text class="log-add-text">+ 新增</text>
        </view>
      </view>

      <!-- 其他 tab：占位 -->
      <view v-else class="empty-state">
        <text class="empty-text">即将开放</text>
      </view>
    </view>

  </view>
</template>

<script setup>
import { ref, computed, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@/store/user'
import { getLogsByUid } from '@/api/log'

const userStore = useUserStore()

// 动态计算内容区最小高度：屏幕高度 - tab 栏高度，确保吸顶后切换 tab 不回弹
const archiveContentMinHeight = ref('1200rpx')

onMounted(() => {
  const windowHeight = uni.getWindowInfo().windowHeight
  const instance = getCurrentInstance()
  uni.createSelectorQuery().in(instance.proxy)
    .select('.archive-tab-bar')
    .boundingClientRect((rect) => {
      if (rect) {
        archiveContentMinHeight.value = (windowHeight - rect.height) + 'px'
      }
    })
    .exec()
})

const props = defineProps({
  userInfo: {
    type: Object,
    default: () => ({}),
  },
  isSelf: {
    type: Boolean,
    default: false,
  },
})

const genderLabel = computed(() => {
  if (props.userInfo.gender === 'male') return '♂'
  if (props.userInfo.gender === 'female') return '♀'
  return ''
})

function goEditProfile() {
  uni.navigateTo({ url: '/pages/profile/edit' })
}

// 退出登录：弹确认窗 → 清空 store → 回到招募大厅游客态
function handleLogout() {
  uni.showModal({
    title: '提示',
    content: '确定退出登录？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
        uni.switchTab({ url: '/pages/home/index' })
      }
    },
  })
}

const quickEntries = [
  {
    icon: '🎲',
    label: '我的创建',
    action: () => uni.navigateTo({ url: '/pages/mine/created?tab=created' }),
  },
  {
    icon: '📋',
    label: '我的申请',
    action: () => uni.navigateTo({ url: '/pages/mine/created?tab=applied' }),
  },
  {
    icon: '👣',
    label: '我的足迹',
    action: () => uni.showToast({ title: '即将开放', icon: 'none' }),
  },
  {
    icon: '💫',
    label: '我的心愿',
    action: () => uni.showToast({ title: '即将开放', icon: 'none' }),
  },
]

// 档案馆 tab 定义
const archiveTabs = [
  { key: 'logs', label: '演绎记录' },
  { key: 'attributes', label: '属性面板' },
  { key: 'characters', label: '人物卡' },
  { key: 'food', label: '跑团饭' },
]

const currentArchiveTab = ref('logs')

// 当前用户的演绎记录
const userLogs = computed(() => {
  const uid = props.userInfo?.uid
  if (!uid) return []
  return getLogsByUid(uid)
})

// 取正文前两行作为预览
function getPreviewText(content) {
  if (!content) return ''
  const lines = content.split('\n').filter(l => l.trim())
  return lines.slice(0, 2).join(' ')
}

// 跳转演绎记录详情（有 id 为查看/编辑，无 id 为新建）
function goLogDetail(id) {
  if (id) {
    uni.navigateTo({ url: `/pages/profile/log_detail?id=${id}` })
  } else {
    uni.navigateTo({ url: '/pages/profile/log_detail' })
  }
}
</script>

<style lang="scss">
.profile-content {
  min-height: 100%;
  background-color: $bg-page;
  box-sizing: border-box;
}

/* 顶部个人信息区 */
.user-header {
  background-color: $bg-navbar;
  padding: 16rpx 32rpx 32rpx;
  box-sizing: border-box;
}

.header-tools {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  margin-bottom: 16rpx;

  .setting-btn {
    width: 56rpx;
    height: 56rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    .setting-icon-placeholder {
      width: 32rpx;
      height: 32rpx;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.4);
    }
  }
}

.user-info {
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
}

.avatar {
  width: 128rpx;
  height: 128rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
  box-sizing: border-box;
}

.avatar-block {
  width: 128rpx;
  height: 128rpx;
  border-radius: 50%;
  background-color: $bg-image-placeholder;
  flex-shrink: 0;
}

.user-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.nickname {
  font-size: 36rpx;
  font-weight: bold;
  color: $white;
}

.role-tags {
  display: flex;
  gap: 8rpx;
}

.role-tag {
  font-size: 20rpx;
  padding: 4rpx 14rpx;
  border-radius: 20rpx;
  font-weight: bold;

  &.kp {
    background-color: rgba(255, 200, 80, 0.25);
    color: #ffe08a;
    border: 1rpx solid rgba(255, 200, 80, 0.5);
  }

  &.pl {
    background-color: rgba(150, 220, 255, 0.25);
    color: #a8d8f0;
    border: 1rpx solid rgba(150, 220, 255, 0.5);
  }
}

.uid-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.uid-text {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.55);
}

.gender-text {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.55);
}

.bio-text {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.5;
}

/* 关注/粉丝/获赞 */
.stats-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-top: 32rpx;
  padding: 0 16rpx;
  box-sizing: border-box;

  .stat-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4rpx;

    .stat-num {
      font-size: 36rpx;
      font-weight: bold;
      color: $white;
    }

    .stat-label {
      font-size: 22rpx;
      color: rgba(255, 255, 255, 0.55);
    }
  }

  .stat-divider {
    width: 1rpx;
    height: 48rpx;
    background-color: rgba(255, 255, 255, 0.2);
  }
}

/* 编辑资料按钮 */
.edit-profile-btn {
  margin-top: 28rpx;
  height: 72rpx;
  border-radius: 36rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;

  .edit-profile-text {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.85);
  }
}

/* 快捷入口4格 */
.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background-color: $white;
  margin-bottom: 20rpx;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 0;
  gap: 12rpx;
}

.quick-icon {
  font-size: 48rpx;
}

.quick-label {
  font-size: 24rpx;
  color: $text-secondary;
}

/* 档案馆 tab 栏（第三层，sticky 吸顶） */
.archive-tab-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  flex-direction: row;
  background-color: $white;
  border-bottom: 1rpx solid $border-color;
  box-sizing: border-box;
}

.archive-tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 0 16rpx;
  position: relative;
  box-sizing: border-box;

  &.active .archive-tab-text {
    color: $text-primary;
    font-weight: bold;
  }
}

.archive-tab-text {
  font-size: 26rpx;
  color: $text-tertiary;
}

.archive-tab-underline {
  width: 40rpx;
  height: 4rpx;
  border-radius: 2rpx;
  background-color: $text-primary;
  margin-top: 8rpx;
}

/* 档案馆内容区（第四层）- min-height 通过 JS 动态计算，保证切换 tab 时 tab 栏维持吸顶 */
.archive-content {
  padding: 20rpx 32rpx;
  box-sizing: border-box;
}

/* 演绎记录缩略卡片列表 */
.log-card-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.log-card {
  background-color: $bg-card;
  border-radius: 16rpx;
  padding: 24rpx 28rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  box-sizing: border-box;
}

.log-card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: $text-primary;
}

.log-card-tags {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8rpx;
}

.log-tag {
  background-color: $bg-tag;
  border-radius: 999rpx;
  padding: 4rpx 16rpx;
  height: 32rpx;
  display: flex;
  align-items: center;
  box-sizing: border-box;

  .log-tag-text {
    font-size: 22rpx;
    color: $text-tag;
  }
}

.log-card-preview {
  font-size: 24rpx;
  color: $text-secondary;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.log-card-date {
  font-size: 22rpx;
  color: $text-tertiary;
}

/* 本人视角新增按钮 */
.log-add-btn {
  margin-top: 24rpx;
  height: 80rpx;
  border-radius: 16rpx;
  border: 2rpx dashed $border-color;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.log-add-text {
  font-size: 28rpx;
  color: $text-tertiary;
}

/* 空状态 */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: $text-tertiary;
}
</style>
