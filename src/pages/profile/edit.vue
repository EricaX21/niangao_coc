<!-- 编辑个人资料 - 昵称/性别/身份tag/签名/QQ号/联系方式 -->
<template>
  <view class="page-container">

    <!-- 头像区域 -->
    <view class="form-section avatar-section" @tap="handleAvatarTap">
      <text class="form-label">头像</text>
      <view class="avatar-area">
        <view class="avatar-block" />
        <text class="avatar-hint">点击更换</text>
      </view>
    </view>

    <!-- 昵称 -->
    <view class="form-section">
      <text class="form-label">昵称 <text class="required">*</text></text>
      <input
        v-model="form.nickname"
        class="form-input"
        placeholder="请输入昵称"
        placeholder-class="input-placeholder"
        maxlength="12"
      />
    </view>

    <!-- UID（只读） -->
    <view class="form-section">
      <text class="form-label">UID</text>
      <text class="form-readonly">{{ form.uid }}</text>
    </view>

    <!-- 性别 -->
    <view class="form-section">
      <text class="form-label">性别</text>
      <view class="gender-row">
        <view
          v-for="g in genderOptions"
          :key="g.value"
          class="gender-tag"
          :class="{ active: form.gender === g.value }"
          @tap="form.gender = g.value"
        >
          <text class="gender-tag-text">{{ g.label }}</text>
        </view>
      </view>
    </view>

    <!-- 身份（多选） -->
    <view class="form-section">
      <text class="form-label">身份 <text class="required">*</text></text>
      <view class="identity-row">
        <view
          v-for="role in identityOptions"
          :key="role"
          class="identity-tag"
          :class="{ active: isRoleSelected(role) }"
          @tap="toggleRole(role)"
        >
          <text class="identity-tag-text">{{ role }}</text>
        </view>
      </view>
    </view>

    <!-- 个性签名 -->
    <view class="form-section">
      <text class="form-label">个性签名</text>
      <input
        v-model="form.signature"
        class="form-input"
        placeholder="一句话介绍自己"
        placeholder-class="input-placeholder"
        maxlength="30"
      />
    </view>

    <!-- 联系方式 -->
    <view class="form-section">
      <text class="form-label">联系方式</text>
      <view class="contact-row">
        <view
          v-for="c in contactOptions"
          :key="c.value"
          class="contact-type-tag"
          :class="{ active: form.contactType === c.value }"
          @tap="form.contactType = c.value"
        >
          <text class="contact-type-text">{{ c.label }}</text>
        </view>
      </view>
      <input
        v-model="form.contactValue"
        class="form-input contact-input"
        :placeholder="contactPlaceholder"
        placeholder-class="input-placeholder"
      />
    </view>

    <!-- 底部留白 -->
    <view class="bottom-placeholder" />

    <!-- 吸底保存按钮 -->
    <view class="bottom-bar">
      <view class="save-btn" @tap="handleSave">
        <text class="save-btn-text">保存</text>
      </view>
    </view>

  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const genderOptions = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
  { label: '保密', value: 'secret' },
]

const identityOptions = ['KP', 'PL']

const contactOptions = [
  { label: '微信号', value: 'wx' },
  { label: 'QQ 号', value: 'qq' },
  { label: 'QQ 群号', value: 'qqgroup' },
]

const form = ref({
  uid: '',
  nickname: '',
  gender: 'secret',
  isKP: false,
  isPL: false,
  signature: '',
  contactType: 'qq',
  contactValue: '',
})

const contactPlaceholder = computed(() => {
  const map = { wx: '请输入微信号', qq: '请输入 QQ 号', qqgroup: '请输入 QQ 群号' }
  return map[form.value.contactType] || '请输入联系方式'
})

const isRoleSelected = (role) => {
  if (role === 'KP') return form.value.isKP
  if (role === 'PL') return form.value.isPL
  return false
}

const toggleRole = (role) => {
  if (role === 'KP') form.value.isKP = !form.value.isKP
  if (role === 'PL') form.value.isPL = !form.value.isPL
}

// 进入页面时从 store 回填当前用户数据
onLoad(() => {
  const info = userStore.userInfo || {}
  form.value = {
    uid: info.uid || '',
    nickname: info.nickname || '',
    gender: info.gender || 'secret',
    isKP: !!info.isKP,
    isPL: !!info.isPL,
    signature: info.signature || info.bio || '',
    contactType: info.contact?.type || 'qq',
    contactValue: info.contact?.value || '',
  }
})

const handleAvatarTap = () => {
  uni.showToast({ title: '头像上传即将开放', icon: 'none' })
}

const handleSave = () => {
  // 校验必填项
  if (!form.value.nickname.trim()) {
    uni.showToast({ title: '请输入昵称', icon: 'none' })
    return
  }
  if (!form.value.isKP && !form.value.isPL) {
    uni.showToast({ title: '请至少选择一个身份', icon: 'none' })
    return
  }

  // 更新 store
  userStore.updateUserInfo({
    nickname: form.value.nickname.trim(),
    gender: form.value.gender,
    isKP: form.value.isKP,
    isPL: form.value.isPL,
    signature: form.value.signature.trim(),
    bio: form.value.signature.trim(),
    contact: {
      type: form.value.contactType,
      value: form.value.contactValue.trim(),
    },
  })

  uni.showToast({ title: '保存成功', icon: 'success' })
  setTimeout(() => {
    uni.navigateBack()
  }, 800)
}
</script>

<style lang="scss">
.page-container {
  min-height: 100%;
  background-color: $bg-page;
  box-sizing: border-box;
  padding: 0 32rpx;
}

.form-section {
  padding: 28rpx 0;
  border-bottom: 1rpx solid $border-color;
  box-sizing: border-box;
}

.form-label {
  font-size: 28rpx;
  color: $text-primary;
  font-weight: 600;
  margin-bottom: 16rpx;
  display: block;
}

.required {
  color: #c0392b;
  font-size: 28rpx;
}

/* 头像区域 */
.avatar-section {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  .form-label {
    margin-bottom: 0;
  }
}

.avatar-area {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
}

.avatar-block {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background-color: $bg-image-placeholder;
}

.avatar-hint {
  font-size: 24rpx;
  color: $text-tertiary;
}

/* 输入框 */
.form-input {
  height: 72rpx;
  border: 1rpx solid $border-color;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: $text-secondary;
  background-color: $white;
  box-sizing: border-box;
}

.input-placeholder {
  color: $text-placeholder;
  font-size: 28rpx;
}

/* 只读字段 */
.form-readonly {
  font-size: 28rpx;
  color: $text-tertiary;
  padding: 0 4rpx;
}

/* 性别选择 */
.gender-row {
  display: flex;
  flex-direction: row;
  gap: 16rpx;
}

.gender-tag {
  height: 64rpx;
  padding: 0 36rpx;
  border-radius: 32rpx;
  border: 1rpx solid $border-color;
  background-color: $white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;

  &.active {
    background-color: $bg-tag;
    border-color: $bg-tag;
  }
}

.gender-tag-text {
  font-size: 26rpx;
  color: $text-secondary;

  .active & {
    color: $white;
  }
}

/* 身份多选 */
.identity-row {
  display: flex;
  flex-direction: row;
  gap: 16rpx;
}

.identity-tag {
  height: 64rpx;
  padding: 0 48rpx;
  border-radius: 32rpx;
  border: 1rpx solid $border-color;
  background-color: $white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;

  &.active {
    background-color: $bg-tag;
    border-color: $bg-tag;
  }
}

.identity-tag-text {
  font-size: 26rpx;
  font-weight: 600;
  color: $text-secondary;

  .active & {
    color: $white;
  }
}

/* 联系方式 */
.contact-row {
  display: flex;
  flex-direction: row;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.contact-type-tag {
  height: 56rpx;
  padding: 0 28rpx;
  border-radius: 28rpx;
  border: 1rpx solid $border-color;
  background-color: $white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;

  &.active {
    background-color: $bg-tag;
    border-color: $bg-tag;
  }
}

.contact-type-text {
  font-size: 24rpx;
  color: $text-secondary;

  .active & {
    color: $white;
  }
}

.contact-input {
  margin-top: 0;
}

/* 底部 */
.bottom-placeholder {
  height: 160rpx;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background-color: $bg-page;
  box-sizing: border-box;
}

.save-btn {
  height: 88rpx;
  border-radius: 16rpx;
  background-color: $bg-navbar;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.save-btn-text {
  font-size: 32rpx;
  font-weight: 600;
  color: $white;
  letter-spacing: 4rpx;
}
</style>
