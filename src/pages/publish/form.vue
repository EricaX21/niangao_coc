<!-- 快速发车表单页 - 普通页面，有原生返回箭头，一镜到底长表单，底部双按钮 -->
<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app'
import { useGameStore } from '@/store/game'
import { useUserStore } from '@/store/user'
import { checkLogin } from '@/utils/auth'
import { safeNavigateBack } from '@/utils/navigation'
import { createModule, updateModule, getModuleById } from '@/api/module'

const gameStore = useGameStore()
const userStore = useUserStore()

const ruleOptions = ['COC6th', 'COC7th']
const modeOptions = ['语音', '文字']
const inviteTypes = [
  { label: '微信号', value: 'wx' },
  { label: 'QQ 号', value: 'qq' },
  { label: 'QQ 群号', value: 'qqgroup' },
]

const dayOptions = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 0 },
]

const form = reactive({
  cover: '',
  name: '',
  duration: '',
  gameDays: [],
  startTime: '',
  endTime: '',
  rule: '',
  mode: '',
  plCount: '',
  recruitKP: false,
  intro: '',
  inviteType: 'qq',
  inviteValue: ''
})

// 当前正在编辑的模组 _id（云数据库字符串 id）
const editingId = ref(null)
const submitting = ref(false)
// 进入编辑模式时保存原始数据快照，用于判断是否有修改
const originalSnapshot = ref('')

// 将表单数据转换为云函数期望的字段格式
// playerCount 由系统自动计算：plCount + (recruitKP ? 1 : 0)
const buildCloudData = () => {
  const plNum = Number(form.plCount) || 0
  return {
    title: form.name,
    rule: form.rule,
    mode: form.mode,
    duration: form.duration,
    gameDays: form.gameDays,
    startTime: form.startTime,
    endTime: form.endTime,
    playerCount: plNum + (form.recruitKP ? 1 : 0),
    plCount: plNum,
    recruitKP: form.recruitKP,
    intro: form.intro,
    contact: { type: form.inviteType || 'qq', value: form.inviteValue || '' },
    coverImage: form.cover || ''
  }
}

onLoad(async (options) => {
  // 登录检查：未登录则弹确认框，取消则立即返回
  const ok = await checkLogin(userStore)
  if (!ok) {
    safeNavigateBack()
    return
  }

  // URL 参数带 id → 编辑模式，从云数据库加载数据回填
  if (options?.id) {
    editingId.value = options.id
    const moduleData = await getModuleById(options.id)
    if (moduleData) {
      fillForm(moduleData)
    }
  }
})

onShow(() => {
  // 兼容旧入口：从 store 中获取 editingModuleId（P9 通过 switchTab 传递）
  const storeEditId = gameStore.editingModuleId
  if (storeEditId && !editingId.value) {
    editingId.value = storeEditId
    gameStore.clearEditingModuleId()
    // 从云数据库加载数据回填
    getModuleById(storeEditId).then(moduleData => {
      if (moduleData) fillForm(moduleData)
    })
  }
})

// 将云数据库返回的模组数据回填到表单
const fillForm = (data) => {
  form.cover = data.coverImage || data.cover || ''
  form.name = data.title || data.name || ''
  form.duration = data.duration || ''
  form.gameDays = data.gameDays ? [...data.gameDays] : []
  form.startTime = data.startTime || ''
  form.endTime = data.endTime || ''
  form.rule = data.rule || ''
  form.mode = data.mode || ''
  form.plCount = data.plCount ? String(data.plCount) : ''
  form.recruitKP = data.recruitKP || false
  form.intro = data.intro || ''
  // 联系方式回填
  if (data.contact && typeof data.contact === 'object') {
    form.inviteType = data.contact.type || 'qq'
    form.inviteValue = data.contact.value || ''
  } else {
    form.inviteType = 'qq'
    form.inviteValue = ''
  }
  // 进入编辑模式后保存原始快照，用于判断是否有修改
  originalSnapshot.value = JSON.stringify(form)
}

// 判断编辑模式下表单是否被修改（与进入时的原始快照对比）
const isEditMode = computed(() => !!editingId.value)
const hasChanged = computed(() => {
  if (!isEditMode.value) return false
  return JSON.stringify(form) !== originalSnapshot.value
})

// 判断表单是否有内容（用于返回键弹窗逻辑）
const hasAnyContent = computed(() =>
  form.name || form.duration || form.gameDays.length > 0 || form.startTime ||
  form.rule || form.mode || form.plCount || form.intro || form.inviteValue
)

/**
 * 微信小程序原生导航栏下 onBackPress 不触发，改用以下方案：
 * - hasAnyContent 为 true 时启用系统级离开提示（wx.enableAlertBeforeUnload），防止误触返回丢失内容
 * - hasAnyContent 为 false（空表单）时禁用提示，直接返回
 * - onUnload 中若表单有名称且未主动保存/发布，自动存为草稿
 */
const hasExplicitlySaved = ref(false)

// 编辑模式：仅在有改动时弹窗；新建模式：有内容即弹窗
const shouldAlertBeforeUnload = computed(() => {
  if (isEditMode.value) return hasChanged.value
  return hasAnyContent.value
})

watch(shouldAlertBeforeUnload, (val) => {
  if (val) {
    wx.enableAlertBeforeUnload({ message: '填写的内容将丢失，确认离开？' })
  } else {
    wx.disableAlertBeforeUnload()
  }
}, { immediate: true })

onUnload(() => {
  // 编辑模式：仅看不改直接返回时不能把原记录写成草稿，原状态必须保持
  if (isEditMode.value) return
  // 新建模式：未主动保存/发布且已填写模组名称 → 自动存草稿到云数据库
  if (!hasExplicitlySaved.value && form.name) {
    const cloudData = buildCloudData()
    cloudData.status = 'draft'
    createModule(cloudData)
  }
})

const chooseCover = () => {
  uni.chooseImage({
    count: 1,
    success(res) {
      form.cover = res.tempFilePaths[0]
    }
  })
}

// 跑团日多选切换
const toggleDay = (dayValue) => {
  const idx = form.gameDays.indexOf(dayValue)
  if (idx >= 0) {
    form.gameDays.splice(idx, 1)
  } else {
    form.gameDays.push(dayValue)
  }
}

const invitePlaceholder = computed(() => {
  const map = { wx: '请输入微信号', qq: '请输入 QQ 号', qqgroup: '请输入 QQ 群号' }
  return map[form.inviteType] || '请输入联系方式'
})

// 保存草稿：仅要求填写模组名称
const handleSaveDraft = async () => {
  if (!form.name) return uni.showToast({ title: '请填写模组名称', icon: 'none' })
  if (submitting.value) return
  submitting.value = true
  hasExplicitlySaved.value = true
  uni.showLoading({ title: '保存中...', mask: true })

  const cloudData = buildCloudData()
  cloudData.status = 'draft'

  const result = editingId.value
    ? await updateModule(editingId.value, cloudData)
    : await createModule(cloudData)

  submitting.value = false
  uni.hideLoading()

  if (result.success) {
    uni.showToast({ title: '草稿已保存', icon: 'success' })
    // 编辑模式：返回上一页（P9），P9 onShow 会刷新数据
    // 新建模式：redirectTo 到 P8，替换空表单页
    if (isEditMode.value) {
      setTimeout(() => uni.navigateBack(), 1500)
    } else {
      setTimeout(() => uni.redirectTo({ url: '/pages/mine/created?tab=created' }), 1500)
    }
  } else {
    uni.showToast({ title: result.message || '保存失败', icon: 'none' })
  }
}

// 发布：需完整填写必填项，发布后弹「发出去喽」提示
const handlePublish = async () => {
  if (!userStore.isLoggedIn) return uni.showToast({ title: '请先登录再发布', icon: 'none' })
  if (!form.name) return uni.showToast({ title: '请填写模组名称', icon: 'none' })
  if (!form.rule) return uni.showToast({ title: '请选择跑团规则', icon: 'none' })
  if (!form.mode) return uni.showToast({ title: '请选择跑团方式', icon: 'none' })
  if (submitting.value) return
  submitting.value = true
  hasExplicitlySaved.value = true
  uni.showLoading({ title: '发布中...', mask: true })

  const cloudData = buildCloudData()
  cloudData.status = 'recruiting'

  const result = editingId.value
    ? await updateModule(editingId.value, cloudData)
    : await createModule(cloudData)

  submitting.value = false
  uni.hideLoading()

  if (result.success) {
    uni.showToast({ title: '发出去喽', icon: 'success' })
    // 编辑模式：返回上一页（P9），P9 onShow 会刷新数据
    // 新建模式：redirectTo 到 P8，替换空表单页
    if (isEditMode.value) {
      setTimeout(() => uni.navigateBack(), 1500)
    } else {
      setTimeout(() => uni.redirectTo({ url: '/pages/mine/created?tab=created' }), 1500)
    }
  } else {
    uni.showToast({ title: result.message || '发布失败', icon: 'none' })
  }
}
</script>

<template>
  <view class="page">
    <scroll-view scroll-y class="scroll-area">

      <!-- 模组封面 -->
      <view class="form-item cover-item" @tap="chooseCover">
        <text class="item-label">模组封面</text>
        <view class="cover-right">
          <view class="cover-upload-box">
            <image
              v-if="form.cover"
              :src="form.cover"
              mode="aspectFill"
              class="cover-img"
            />
            <view v-else class="cover-placeholder">
              <text class="cover-plus">＋</text>
            </view>
          </view>
          <!-- TODO: 替换为正式漏斗icon -->
          <view class="cover-funnel-dot" />
        </view>
      </view>
      <view class="divider" />

      <!-- 模组名称 -->
      <view class="form-item">
        <text class="item-label">模组名称</text>
        <input
          v-model="form.name"
          placeholder="不超过20个字"
          placeholder-class="input-placeholder"
          class="item-input"
          maxlength="20"
        />
      </view>
      <view class="divider" />

      <!-- 预计时长 -->
      <view class="form-item">
        <text class="item-label">预计时长</text>
        <input
          v-model="form.duration"
          placeholder="不超过20个字"
          placeholder-class="input-placeholder"
          class="item-input"
          maxlength="20"
        />
      </view>
      <view class="divider" />

      <!-- 跑团日（多选 tag） -->
      <view class="form-item form-item-col">
        <text class="item-label">跑团日</text>
        <view class="day-tags">
          <view
            v-for="day in dayOptions"
            :key="day.value"
            class="day-tag"
            :class="{ active: form.gameDays.includes(day.value) }"
            @tap="toggleDay(day.value)"
          >
            <text class="day-tag-text">{{ day.label }}</text>
          </view>
        </view>
      </view>
      <view class="divider" />

      <!-- 时间段（开始 ~ 结束） -->
      <view class="form-item">
        <text class="item-label">时间段</text>
        <view class="time-picker-wrap">
          <picker mode="time" :value="form.startTime" @change="form.startTime = $event.detail.value">
            <text :class="['time-pick-text', form.startTime ? 'has-value' : 'no-value']">
              {{ form.startTime || '开始时间' }}
            </text>
          </picker>
          <text class="time-sep">~</text>
          <picker mode="time" :value="form.endTime" @change="form.endTime = $event.detail.value">
            <text :class="['time-pick-text', form.endTime ? 'has-value' : 'no-value']">
              {{ form.endTime || '结束时间' }}
            </text>
          </picker>
        </view>
      </view>
      <view class="divider" />

      <!-- 跑团规则（单选圆点） -->
      <view class="form-item form-item-col">
        <text class="item-label">跑团规则</text>
        <view class="radio-group">
          <view
            class="radio-item"
            v-for="rule in ruleOptions"
            :key="rule"
            @tap="form.rule = rule"
          >
            <view class="radio-dot" :class="{ checked: form.rule === rule }">
              <view v-if="form.rule === rule" class="radio-inner" />
            </view>
            <text class="radio-label">{{ rule }}</text>
          </view>
        </view>
      </view>
      <view class="divider" />

      <!-- 跑团方式（单选圆点） -->
      <view class="form-item form-item-col">
        <text class="item-label">跑团方式</text>
        <view class="radio-group">
          <view
            class="radio-item"
            v-for="mode in modeOptions"
            :key="mode"
            @tap="form.mode = mode"
          >
            <view class="radio-dot" :class="{ checked: form.mode === mode }">
              <view v-if="form.mode === mode" class="radio-inner" />
            </view>
            <text class="radio-label">{{ mode }}</text>
          </view>
        </view>
      </view>
      <view class="divider" />

      <!-- 招募PL -->
      <view class="form-item">
        <text class="item-label">招募PL</text>
        <view class="number-input-wrap">
          <input
            v-model="form.plCount"
            type="number"
            placeholder="0"
            placeholder-class="input-placeholder"
            class="number-input"
          />
          <text class="unit-text">人</text>
        </view>
      </view>
      <view class="divider" />

      <!-- 招募KP（Toggle） -->
      <view class="form-item">
        <text class="item-label">招募KP</text>
        <switch
          :checked="form.recruitKP"
          @change="form.recruitKP = $event.detail.value"
          color="#2c2c2c"
        />
      </view>
      <view class="divider" />

      <!-- 模组简介 -->
      <view class="form-item form-item-col intro-item">
        <text class="item-label">模组简介</text>
        <textarea
          v-model="form.intro"
          placeholder="不超过300个字......"
          placeholder-class="input-placeholder"
          class="intro-textarea"
          maxlength="300"
        />
        <text class="intro-counter">{{ form.intro.length }}/300</text>
      </view>
      <view class="divider" />

      <!-- 联系方式（三选一 + 输入） -->
      <view class="form-item form-item-col invite-item">
        <text class="item-label">联系方式</text>
        <view class="invite-type-row">
          <view
            v-for="t in inviteTypes"
            :key="t.value"
            class="invite-type-tag"
            :class="{ active: form.inviteType === t.value }"
            @tap="form.inviteType = t.value"
          >
            <text class="invite-type-text">{{ t.label }}</text>
          </view>
        </view>
        <view class="invite-input-row">
          <input
            v-model="form.inviteValue"
            :placeholder="invitePlaceholder"
            placeholder-class="input-placeholder"
            class="invite-input"
          />
        </view>
      </view>

      <view class="bottom-placeholder" />
    </scroll-view>

    <!-- 底部吸底按钮：双按钮并排 -->
    <view class="bottom-bar">
      <view class="btn-row">
        <view class="action-btn btn-secondary" @tap="handleSaveDraft">
          <text class="action-btn-text">保存草稿</text>
        </view>
        <view class="action-btn btn-primary" @tap="handlePublish">
          <text class="action-btn-text">发布</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
.page {
  min-height: 100%;
  background-color: $bg-page;
  display: flex;
  flex-direction: column;
}

.scroll-area {
  flex: 1;
  background-color: $bg-page;
}

/* 表单项通用 */
.form-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 28rpx 32rpx;
  background-color: #FFFFFF;
  min-height: 96rpx;

  &.form-item-col {
    flex-direction: column;
    align-items: flex-start;
    gap: 16rpx;
  }

  &.form-item-indent {
    padding-left: 64rpx;
  }

  .item-label {
    font-size: 28rpx;
    color: #333333;
    font-weight: 500;
    flex-shrink: 0;
    min-width: 140rpx;

    &.item-label-sub {
      color: #555555;
      font-weight: 400;
    }
  }

  .item-input {
    flex: 1;
    font-size: 28rpx;
    color: #333333;
    text-align: right;
    height: 48rpx;
  }
}

/* 分割线 */
.divider {
  height: 1rpx;
  background-color: #F0F0F0;
  margin: 0 32rpx;
}

/* 封面上传 */
.cover-item {
  align-items: flex-start;
  padding-top: 28rpx;
  padding-bottom: 28rpx;

  .cover-right {
    margin-left: auto;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 16rpx;

    .cover-upload-box {
      width: 120rpx;
      height: 120rpx;
      border-radius: 12rpx;
      overflow: hidden;
      border: 2rpx dashed #CCCCCC;
      display: flex;
      align-items: center;
      justify-content: center;

      .cover-img {
        width: 100%;
        height: 100%;
      }

      .cover-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #F8F8F8;

        .cover-plus {
          font-size: 48rpx;
          color: #BBBBBB;
        }
      }
    }

    .cover-funnel-dot {
      width: 32rpx;
      height: 32rpx;
      background-color: #666666;
      border-radius: 50%;
      flex-shrink: 0;
    }
  }
}

/* 跑团日多选 tag */
.day-tags {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12rpx;
  padding-left: 140rpx;

  .day-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 56rpx;
    padding: 0 24rpx;
    border-radius: 999rpx;
    background-color: #e8e8e8;
    box-sizing: border-box;

    &.active {
      background-color: #2c2c2c;

      .day-tag-text {
        color: #ffffff;
      }
    }

    .day-tag-text {
      font-size: 26rpx;
      color: #333333;
    }
  }
}

/* 时间段选择器 */
.time-picker-wrap {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  gap: 16rpx;

  .time-pick-text {
    font-size: 28rpx;
    padding: 8rpx 16rpx;
    border-bottom: 1rpx solid #CCCCCC;

    &.has-value {
      color: #333333;
    }

    &.no-value {
      color: #BBBBBB;
    }
  }

  .time-sep {
    font-size: 28rpx;
    color: #888888;
  }
}

/* 单选圆点组 */
.radio-group {
  display: flex;
  flex-direction: row;
  gap: 40rpx;
  padding-left: 140rpx;

  .radio-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12rpx;

    .radio-dot {
      width: 36rpx;
      height: 36rpx;
      border-radius: 50%;
      border: 2rpx solid #CCCCCC;
      display: flex;
      align-items: center;
      justify-content: center;

      &.checked {
        border-color: #2c2c2c;
      }

      .radio-inner {
        width: 20rpx;
        height: 20rpx;
        border-radius: 50%;
        background-color: #2c2c2c;
      }
    }

    .radio-label {
      font-size: 28rpx;
      color: #333333;
    }
  }
}

/* 数字输入 */
.number-input-wrap {
  margin-left: auto;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8rpx;

  .number-input {
    width: 80rpx;
    font-size: 28rpx;
    color: #333333;
    text-align: center;
    border-bottom: 1rpx solid #CCCCCC;
    height: 48rpx;
  }

  .unit-text {
    font-size: 28rpx;
    color: #333333;
  }
}

/* 简介 */
.intro-item {
  .intro-textarea {
    width: 100%;
    min-height: 160rpx;
    font-size: 28rpx;
    color: #333333;
    line-height: 1.7;
  }

  .intro-counter {
    align-self: flex-end;
    font-size: 22rpx;
    color: #AAAAAA;
  }
}

/* 联系方式 */
.invite-item {
  .invite-type-row {
    display: flex;
    flex-direction: row;
    gap: 12rpx;
    padding-left: 140rpx;
  }

  .invite-type-tag {
    padding: 8rpx 28rpx;
    border-radius: 28rpx;
    background-color: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;

    &.active {
      background-color: #434343;
    }
  }

  .invite-type-text {
    font-size: 26rpx;
    color: #363636;

    .active & {
      color: #ffffff;
    }
  }

  .invite-input-row {
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;

    .invite-input {
      flex: 1;
      height: 72rpx;
      font-size: 28rpx;
      color: #333333;
      background-color: #F5F5F5;
      border-radius: 8rpx;
      padding: 0 20rpx;
    }
  }
}

.input-placeholder {
  color: #BBBBBB;
}

.bottom-placeholder {
  height: 400rpx;
}

/* 底部吸底双按钮 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background-color: #FFFFFF;
  border-top: 1rpx solid #EEEEEE;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
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

    .action-btn-text {
      font-size: 30rpx;
      font-weight: 600;
    }
  }

  .btn-secondary {
    background-color: #eeeeee;

    .action-btn-text {
      color: $text-body;
    }
  }

  .btn-primary {
    background-color: $bg-navbar;

    .action-btn-text {
      color: $white;
    }
  }
}
</style>
