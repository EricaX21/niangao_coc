<!-- 演绎记录详情/创建页 - 查看或新增一条跑团演绎记录 -->
<!-- 双态切换：本人浏览态（底部编辑按钮）→ 编辑态（底部保存按钮）；他人纯浏览无按钮 -->
<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { getLogById } from '@/api/log'

const userStore = useUserStore()

const logId = ref(null)
// isNew = true 时为新建模式，false 为查看/编辑现有记录
const isNew = ref(true)
// 是否本人的记录
const isSelf = ref(false)
// 是否处于编辑态（新建模式始终为编辑态）
const isEditing = ref(false)

const title = ref('')
const moduleName = ref('')
const selectedTags = ref([])
const customTagInput = ref('')
const content = ref('')

const presetTags = ['COC6th', 'COC7th', 'DND5E', 'FATE', 'Pathfinder', 'KP', 'PL', 'DM', '语音团', '文字团', '心得', '跑团记录']

onLoad((options) => {
  if (options.id) {
    logId.value = options.id
    isNew.value = false
    uni.setNavigationBarTitle({ title: '演绎记录' })
    const log = getLogById(options.id)
    if (log) {
      title.value = log.title
      moduleName.value = log.moduleName
      selectedTags.value = [...log.tags]
      content.value = log.content
      // 判断是否本人的记录
      isSelf.value = userStore.isLoggedIn && userStore.uid === log.authorId
    }
  } else {
    // 新建模式，始终为编辑态
    isNew.value = true
    isSelf.value = true
    isEditing.value = true
    uni.setNavigationBarTitle({ title: '新增记录' })
  }
})

const toggleTag = (tag) => {
  const idx = selectedTags.value.indexOf(tag)
  if (idx >= 0) {
    selectedTags.value.splice(idx, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

const addCustomTag = () => {
  const tag = customTagInput.value.trim()
  if (!tag) return
  if (!selectedTags.value.includes(tag)) {
    selectedTags.value.push(tag)
  }
  customTagInput.value = ''
}

const handleEdit = () => {
  isEditing.value = true
}

const handleSave = () => {
  if (!title.value.trim()) {
    uni.showToast({ title: '请输入标题', icon: 'none' })
    return
  }
  if (!content.value.trim()) {
    uni.showToast({ title: '请输入正文', icon: 'none' })
    return
  }
  // TODO: 接口接入后替换为真实保存逻辑
  uni.showToast({ title: '保存成功', icon: 'success' })
  if (isNew.value) {
    setTimeout(() => uni.navigateBack(), 1500)
  } else {
    // 编辑已有记录，保存后恢复浏览态
    isEditing.value = false
  }
}
</script>

<template>
  <view class="page">
    <scroll-view scroll-y class="scroll-content">
      <!-- 编辑态：显示表单 -->
      <view v-if="isNew || isEditing" class="form-body">

        <!-- 标题 -->
        <view class="form-field">
          <text class="field-label">标题</text>
          <input
            v-model="title"
            class="field-input"
            placeholder="给这次冒险起个名字"
            placeholder-class="field-placeholder"
            maxlength="50"
          />
        </view>

        <!-- 分割线 -->
        <view class="divider" />

        <!-- 模组名称 -->
        <view class="form-field">
          <text class="field-label">模组名称</text>
          <input
            v-model="moduleName"
            class="field-input"
            placeholder="跑的是哪个模组？"
            placeholder-class="field-placeholder"
            maxlength="50"
          />
        </view>

        <!-- 分割线 -->
        <view class="divider" />

        <!-- 标签 -->
        <view class="form-section">
          <text class="field-label">标签</text>
          <!-- 已选标签展示 -->
          <view v-if="selectedTags.length > 0" class="selected-tags">
            <view
              v-for="tag in selectedTags"
              :key="tag"
              class="selected-tag"
              @tap="toggleTag(tag)"
            >
              <text class="selected-tag-text">{{ tag }}</text>
              <text class="selected-tag-remove">×</text>
            </view>
          </view>
          <!-- 预设标签选择 -->
          <view class="preset-tags">
            <view
              v-for="tag in presetTags"
              :key="tag"
              class="preset-tag"
              :class="{ active: selectedTags.includes(tag) }"
              @tap="toggleTag(tag)"
            >
              <text class="preset-tag-text">{{ tag }}</text>
            </view>
          </view>
          <!-- 自定义标签输入 -->
          <view class="custom-tag-row">
            <input
              v-model="customTagInput"
              class="custom-tag-input"
              placeholder="自定义标签"
              placeholder-class="field-placeholder"
              maxlength="10"
              @confirm="addCustomTag"
            />
            <view class="custom-tag-add" @tap="addCustomTag">
              <text class="custom-tag-add-text">添加</text>
            </view>
          </view>
        </view>

        <!-- 分割线 -->
        <view class="divider" />

        <!-- 正文 -->
        <view class="form-section">
          <text class="field-label">正文</text>
          <textarea
            v-model="content"
            class="content-textarea"
            placeholder="记录这次冒险的点点滴滴，可直接粘贴长文…"
            placeholder-class="field-placeholder"
            auto-height
          />
        </view>

        <view class="bottom-padding" />
      </view>

      <!-- 浏览态：只读展示 -->
      <view v-else class="detail-body">
        <text class="detail-title">{{ title }}</text>

        <view v-if="moduleName" class="detail-module-row">
          <text class="detail-module-label">模组：</text>
          <text class="detail-module-name">{{ moduleName }}</text>
        </view>

        <view v-if="selectedTags.length > 0" class="detail-tags">
          <view v-for="tag in selectedTags" :key="tag" class="detail-tag">
            <text class="detail-tag-text">{{ tag }}</text>
          </view>
        </view>

        <view class="detail-divider" />

        <text class="detail-content">{{ content }}</text>

        <view class="bottom-padding" />
      </view>
    </scroll-view>

    <!-- 底部吸底按钮 -->
    <!-- 新建/编辑态：保存按钮 -->
    <view v-if="isNew || isEditing" class="bottom-bar">
      <view class="bottom-btn" @tap="handleSave">
        <text class="bottom-btn-text">保存</text>
      </view>
    </view>
    <!-- 本人浏览态：编辑按钮 -->
    <view v-else-if="isSelf" class="bottom-bar">
      <view class="bottom-btn" @tap="handleEdit">
        <text class="bottom-btn-text">编辑</text>
      </view>
    </view>
    <!-- 他人浏览态：无按钮 -->
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

/* 底部吸底按钮 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background-color: #f5f5f5;
  border-top: 1rpx solid #eeeeee;
  box-sizing: border-box;

  .bottom-btn {
    height: 88rpx;
    border-radius: 16rpx;
    background-color: #2c2c2c;
    display: flex;
    align-items: center;
    justify-content: center;

    .bottom-btn-text {
      font-size: 32rpx;
      font-weight: 600;
      color: #ffffff;
    }
  }
}

.scroll-content {
  flex: 1;

  .form-body {
    background-color: #ffffff;
    margin: 0 32rpx;
    border-radius: 16rpx;
    overflow: hidden;
    box-sizing: border-box;
  }

  .bottom-padding {
    height: 160rpx;
  }
}

/* 表单字段（单行输入） */
.form-field {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 32rpx;
  box-sizing: border-box;

  .field-label {
    font-size: 28rpx;
    color: #363636;
    width: 140rpx;
    flex-shrink: 0;
  }

  .field-input {
    flex: 1;
    font-size: 28rpx;
    color: #000000;
    min-width: 0;
  }
}

/* 表单分区（多行内容） */
.form-section {
  padding: 32rpx;
  box-sizing: border-box;

  .field-label {
    font-size: 28rpx;
    color: #363636;
    display: block;
    margin-bottom: 20rpx;
  }
}

.field-placeholder {
  color: #999999;
}

/* 分割线 */
.divider {
  height: 1rpx;
  background-color: #f0f0f0;
  margin: 0 32rpx;
  box-sizing: border-box;
}

/* 已选标签 */
.selected-tags {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-bottom: 16rpx;

  .selected-tag {
    display: inline-flex;
    align-items: center;
    background-color: #2c2c2c;
    border-radius: 999rpx;
    padding: 0 16rpx;
    height: 48rpx;
    gap: 6rpx;
    box-sizing: border-box;

    .selected-tag-text {
      font-size: 24rpx;
      color: #ffffff;
    }

    .selected-tag-remove {
      font-size: 26rpx;
      color: rgba(255, 255, 255, 0.6);
    }
  }
}

/* 预设标签 */
.preset-tags {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-bottom: 20rpx;

  .preset-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 48rpx;
    border-radius: 999rpx;
    padding: 0 20rpx;
    background-color: #f0f0f0;
    box-sizing: border-box;

    &.active {
      background-color: #434343;

      .preset-tag-text {
        color: #ffffff;
      }
    }

    .preset-tag-text {
      font-size: 24rpx;
      color: #666666;
    }
  }
}

/* 自定义标签输入行 */
.custom-tag-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
  box-sizing: border-box;

  .custom-tag-input {
    flex: 1;
    height: 64rpx;
    border-radius: 999rpx;
    background-color: #f5f5f5;
    border: 1rpx solid #d9d9d9;
    padding: 0 24rpx;
    font-size: 26rpx;
    color: #363636;
    box-sizing: border-box;
  }

  .custom-tag-add {
    height: 64rpx;
    border-radius: 999rpx;
    background-color: #434343;
    padding: 0 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-sizing: border-box;

    .custom-tag-add-text {
      font-size: 26rpx;
      color: #ffffff;
    }
  }
}

/* 正文 textarea */
.content-textarea {
  width: 100%;
  min-height: 320rpx;
  font-size: 28rpx;
  color: #363636;
  line-height: 1.8;
  box-sizing: border-box;
}

/* ===== 浏览态样式 ===== */
.detail-body {
  margin: 0 32rpx;
  padding: 32rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  box-sizing: border-box;
}

.detail-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #000000;
  display: block;
  margin-bottom: 20rpx;
}

.detail-module-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 16rpx;

  .detail-module-label {
    font-size: 26rpx;
    color: #b2b2b2;
  }

  .detail-module-name {
    font-size: 26rpx;
    color: #363636;
  }
}

.detail-tags {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-bottom: 20rpx;
}

.detail-tag {
  background-color: #434343;
  border-radius: 999rpx;
  padding: 0 16rpx;
  height: 32rpx;
  display: flex;
  align-items: center;
  box-sizing: border-box;

  .detail-tag-text {
    font-size: 22rpx;
    color: #ffffff;
  }
}

.detail-divider {
  height: 1rpx;
  background-color: #f0f0f0;
  margin-bottom: 24rpx;
  box-sizing: border-box;
}

.detail-content {
  font-size: 28rpx;
  color: #363636;
  line-height: 1.8;
  display: block;
  white-space: pre-wrap;
}
</style>
