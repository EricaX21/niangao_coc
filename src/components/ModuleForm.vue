<!-- 招募表单共用组件 - 首页新建 tab 与编辑页共用；导航由调用方页面负责，本组件只管数据与提交 -->
<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { useUserStore } from '@/store/user'
import { checkLogin } from '@/utils/auth'
import { createModule, updateModule, getModuleById } from '@/api/module'
import { parseRecruitText } from '@/utils/parseRecruitText'

const props = defineProps({
  // 有值即编辑模式（云数据库 _id），为空则是新建模式
  editId: { type: String, default: '' }
})

// 提交成功后由页面决定去哪：新建发布 → 结果页，编辑保存 → 返回上一页
const emit = defineEmits(['published', 'draft-saved', 'updated'])

const userStore = useUserStore()

// 规则体系：以 COC 为主，DND5e 与「其他」兜底（真实招募样本中约三分之一非 COC）
const ruleOptions = ['COC7th', 'COC6th', 'DND5e', '其他']
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

// 招募 PL 人数改为点选（原为数字输入），点选比打字快，是 10 秒发布的前提
const plCountOptions = [1, 2, 3, 4, 5, 6]

// 次要字段的默认值：让用户不填也能直接发布
const DEFAULT_RULE = 'COC7th'
const DEFAULT_MODE = '语音'

const form = reactive({
  cover: '',
  name: '',
  duration: '',
  gameDays: [],
  startTime: '',
  endTime: '',
  rule: DEFAULT_RULE,
  mode: DEFAULT_MODE,
  plCount: 0,
  recruitKP: false,
  intro: '',
  inviteType: 'qq',
  inviteValue: ''
})

// 「更多设置」折叠区展开状态：封面 / 时长 / 规则 / 方式 / 招募KP / 简介都收在里面
const showMoreSettings = ref(false)

const submitting = ref(false)
// 进入编辑模式时保存原始数据快照，用于判断是否有修改
const originalSnapshot = ref('')

/**
 * 两层身份：
 * - isEditMode（props.editId 有值）：编辑页场景，普通页面，提交后返回来源页
 * - workingDraftId：工作区从草稿箱载入了某条草稿，提交时更新该草稿而非新建，
 *   避免「载入草稿改一改再发布」产生一条重复记录
 */
const isEditMode = computed(() => !!props.editId)
const workingDraftId = ref('')

// 判断工作区是否有内容（rule/mode 有默认值，不算「用户填过」）
const hasAnyContent = computed(() =>
  !!(form.name || form.duration || form.cover || form.gameDays.length > 0 ||
     form.startTime || form.endTime || form.plCount || form.intro || form.inviteValue)
)

/* ---------------- 工作区持久化（仅新建模式） ----------------
 * 首页编辑器像备忘录：持续自动保存到本地，杀进程重进也不丢。
 * 不写 draft 云记录——云端草稿只在用户点「存草稿」时产生。
 */
const WORKSPACE_KEY = 'publish_workspace_v1'

const persistWorkspace = () => {
  if (isEditMode.value) return
  try {
    uni.setStorageSync(WORKSPACE_KEY, JSON.stringify({
      form: { ...form, gameDays: [...form.gameDays] },
      workingDraftId: workingDraftId.value
    }))
  } catch (e) {
    console.error('workspace persist error:', e)
  }
}

const clearWorkspaceStorage = () => {
  try { uni.removeStorageSync(WORKSPACE_KEY) } catch (e) { /* 忽略 */ }
}

// 启动时恢复上次的工作区内容（仅新建模式）
if (!props.editId) {
  try {
    const saved = uni.getStorageSync(WORKSPACE_KEY)
    if (saved) {
      const data = JSON.parse(saved)
      if (data.form) Object.assign(form, data.form)
      workingDraftId.value = data.workingDraftId || ''
    }
  } catch (e) {
    console.error('workspace restore error:', e)
  }
}

// 表单任何变化都自动保存（防抖 400ms）
let workspaceSaveTimer = null
watch(form, () => {
  if (isEditMode.value) return
  clearTimeout(workspaceSaveTimer)
  workspaceSaveTimer = setTimeout(persistWorkspace, 400)
}, { deep: true })

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

// editId 就绪后从云数据库加载数据回填（编辑模式）
watch(() => props.editId, async (id) => {
  if (!id) return
  const moduleData = await getModuleById(id)
  if (moduleData) fillForm(moduleData)
}, { immediate: true })

// 将云数据库返回的模组数据回填到表单
const fillForm = (data) => {
  form.cover = data.coverImage || data.cover || ''
  form.name = data.title || data.name || ''
  form.duration = data.duration || ''
  form.gameDays = data.gameDays ? [...data.gameDays] : []
  form.startTime = data.startTime || ''
  form.endTime = data.endTime || ''
  form.rule = data.rule || DEFAULT_RULE
  form.mode = data.mode || DEFAULT_MODE
  form.plCount = Number(data.plCount) || 0
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
  // 记录原始状态：编辑「招募中」的模组时要隐藏存草稿按钮（否则保存会把它下架）
  originalStatus.value = data.status || ''
  // 进入编辑模式后保存原始快照，用于判断是否有修改
  originalSnapshot.value = JSON.stringify(form)
}

// 被编辑记录的原始状态（draft / recruiting / finished）
const originalStatus = ref('')

// 编辑已发布的招募时不显示存草稿（会把招募中的记录写回 draft，等于下架）
const showDraftButton = computed(() => !isEditMode.value || originalStatus.value === 'draft')

// 主按钮文案：编辑已发布的招募是「保存」，工作区新建和草稿发布才是「发车」
const primaryButtonLabel = computed(() =>
  isEditMode.value && originalStatus.value !== 'draft' ? '保存' : '发车'
)

// 判断编辑模式下表单是否被修改（与进入时的原始快照对比）
const hasChanged = computed(() => {
  if (!isEditMode.value) return false
  return JSON.stringify(form) !== originalSnapshot.value
})

/**
 * 离开提示只在编辑模式生效：
 * - 编辑模式在普通页面里，误触返回会丢失改动，需要拦截
 * - 新建模式在首页 tab 里，拦截会让每次切 tab 都弹窗，故不启用；
 *   新建内容的保全由工作区自动保存负责（见上方 WORKSPACE_KEY）
 */
let alertEnabled = false
watch(() => isEditMode.value && hasChanged.value, (val) => {
  if (val) {
    wx.enableAlertBeforeUnload({ message: '修改尚未保存，确认离开？' })
    alertEnabled = true
  } else if (alertEnabled) {
    wx.disableAlertBeforeUnload()
    alertEnabled = false
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
  const loggedIn = await checkLogin(userStore)
  if (!loggedIn) return
  if (submitting.value) return
  submitting.value = true
  uni.showLoading({ title: '保存中...', mask: true })

  const cloudData = buildCloudData()
  cloudData.status = 'draft'

  // 提交目标：编辑页用 props.editId；工作区若载入过草稿则更新那条草稿，避免产生重复记录
  const targetId = props.editId || workingDraftId.value
  const result = targetId
    ? await updateModule(targetId, cloudData)
    : await createModule(cloudData)

  submitting.value = false
  uni.hideLoading()

  if (result.success) {
    // 保存成功后由页面决定去向；编辑模式下同步刷新快照，避免离开时误判为「有未保存改动」
    if (isEditMode.value) {
      originalSnapshot.value = JSON.stringify(form)
    } else {
      // 工作区归档为云端草稿后腾空，可以接着填下一个团
      workingDraftId.value = ''
      clearWorkspaceStorage()
    }
    emit('draft-saved', result.data?._id || targetId)
  } else {
    uni.showToast({ title: result.message || '保存失败', icon: 'none' })
  }
}

// 发布：需完整填写必填项，发布后弹「发出去喽」提示
const handlePublish = async () => {
  // 游客可以随便填，点发车才触发登录（编辑器是首页 tab，不能把未登录用户挡在门外）
  const loggedIn = await checkLogin(userStore)
  if (!loggedIn) return
  // 必填三项：名称 / PL 人数 / 联系方式
  // 时间两维度（跑团日、时段）均可选——留空即「可协商」，卡片按弹性时间模型渲染（见 formatGameTime）
  if (!form.name) return uni.showToast({ title: '请填写模组名称', icon: 'none' })
  if (!form.plCount) return uni.showToast({ title: '请选择招募 PL 人数', icon: 'none' })
  if (!form.inviteValue) return uni.showToast({ title: '请填写联系方式', icon: 'none' })
  if (submitting.value) return
  submitting.value = true
  uni.showLoading({ title: '发布中...', mask: true })

  const cloudData = buildCloudData()
  // 编辑已发布/已发车的记录时保持原状态（「保存」不是重新发车）；新建与草稿发布才写 recruiting
  cloudData.status = (isEditMode.value && originalStatus.value && originalStatus.value !== 'draft')
    ? originalStatus.value
    : 'recruiting'

  // 工作区若载入过草稿，发布即把那条草稿转为招募中，而非新建一条
  const targetId = props.editId || workingDraftId.value
  const result = targetId
    ? await updateModule(targetId, cloudData)
    : await createModule(cloudData)

  submitting.value = false
  uni.hideLoading()

  if (result.success) {
    // 编辑模式：更新已有招募，由页面负责返回上一页
    if (isEditMode.value) {
      originalSnapshot.value = JSON.stringify(form)
      emit('updated', props.editId)
      return
    }
    // 新建模式：把新招募的 id 交给页面，页面跳结果页直出卡片
    emit('published', result.data?._id || targetId || '')
  } else {
    uni.showToast({ title: result.message || '发布失败', icon: 'none' })
  }
}

// 清空工作区（发布成功后由页面调用，或用户点「清空重来」）
const resetForm = () => {
  form.cover = ''
  form.name = ''
  form.duration = ''
  form.gameDays = []
  form.startTime = ''
  form.endTime = ''
  form.rule = DEFAULT_RULE
  form.mode = DEFAULT_MODE
  form.plCount = 0
  form.recruitKP = false
  form.intro = ''
  form.inviteType = 'qq'
  form.inviteValue = ''
  showMoreSettings.value = false
  workingDraftId.value = ''
  clearWorkspaceStorage()
}

/**
 * 粘贴识别：读剪贴板 → 规则解析 → 只覆盖识别出的字段，识别不出的保留现状。
 * KP 本来就要在群里发这段文本，这里把它接过来省掉重复打字；识别失败无任何副作用。
 */
const handlePasteRecognize = () => {
  uni.getClipboardData({
    success: (res) => {
      const text = res.data
      if (!text || !text.trim()) {
        uni.showToast({ title: '剪贴板是空的，先复制招募文本', icon: 'none' })
        return
      }
      const { fields, recognizedCount } = parseRecruitText(text)
      if (recognizedCount === 0) {
        uni.showToast({ title: '没认出内容，手动填吧', icon: 'none' })
        return
      }
      if (fields.name) form.name = fields.name
      if (fields.rule) form.rule = fields.rule
      if (fields.mode) form.mode = fields.mode
      if (fields.gameDays.length > 0) form.gameDays = fields.gameDays
      if (fields.startTime) form.startTime = fields.startTime
      if (fields.endTime) form.endTime = fields.endTime
      if (fields.plCount) form.plCount = fields.plCount
      if (fields.duration) form.duration = fields.duration
      if (fields.intro) form.intro = fields.intro
      if (fields.inviteValue) {
        form.inviteType = fields.inviteType || 'qq'
        form.inviteValue = fields.inviteValue
      }
      if (fields.recruitKP) form.recruitKP = true
      // 识别结果落进了折叠区的（时长/简介）要展开给用户核对
      if (fields.duration || fields.intro) showMoreSettings.value = true
      uni.showToast({ title: `已识别 ${recognizedCount} 项，请核对`, icon: 'none' })
    },
    fail: () => uni.showToast({ title: '读取剪贴板失败', icon: 'none' })
  })
}

// 清空重来：唯一的破坏性操作，必须二次确认
const handleClearWorkspace = () => {
  if (!hasAnyContent.value) return
  uni.showModal({
    title: '清空当前内容？',
    content: '已填写的内容将被丢弃，此操作不可恢复',
    confirmText: '清空',
    success: (res) => {
      if (res.confirm) {
        resetForm()
        uni.showToast({ title: '已清空', icon: 'none' })
      }
    }
  })
}

/**
 * 从草稿箱载入一条草稿到工作区（由首页在 onShow 中调用）。
 * 「永不丢失」原则：工作区已有内容时先自动归档成草稿，再载入目标草稿——不弹窗、不询问。
 */
const loadDraft = async (draftId) => {
  if (!draftId || draftId === workingDraftId.value) return
  if (hasAnyContent.value) {
    const archive = buildCloudData()
    archive.status = 'draft'
    // 云函数要求 title 非空；没起名的内容也不能丢
    if (!archive.title) archive.title = '未命名草稿'
    if (workingDraftId.value) {
      await updateModule(workingDraftId.value, archive)
    } else {
      await createModule(archive)
    }
  }
  const moduleData = await getModuleById(draftId)
  if (moduleData) {
    fillForm(moduleData)
    workingDraftId.value = draftId
    persistWorkspace()
  } else {
    uni.showToast({ title: '草稿加载失败', icon: 'none' })
  }
}

// pasteRecognize 供页面顶部导航的「粘贴识别」按钮调用
defineExpose({ resetForm, loadDraft, pasteRecognize: handlePasteRecognize })
</script>

<template>
  <view class="page">
    <scroll-view scroll-y class="scroll-area">

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

      <!-- 开始时间（结束时间为可选项，收在「更多设置」里） -->
      <view class="form-item">
        <text class="item-label">开始时间</text>
        <picker mode="time" :value="form.startTime" @change="form.startTime = $event.detail.value">
          <text :class="['time-pick-text', form.startTime ? 'has-value' : 'no-value']">
            {{ form.startTime || '选择开始时间' }}
          </text>
        </picker>
      </view>
      <view class="divider" />

      <!-- 招募PL（点选，不用键盘） -->
      <view class="form-item form-item-col">
        <text class="item-label">招募PL</text>
        <view class="day-tags">
          <view
            v-for="count in plCountOptions"
            :key="count"
            class="day-tag"
            :class="{ active: form.plCount === count }"
            @tap="form.plCount = count"
          >
            <text class="day-tag-text">{{ count }}</text>
          </view>
        </view>
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
      <view class="divider" />

      <!-- 更多设置：次要字段折叠区，不展开也能直接发布 -->
      <view class="form-item more-toggle" @tap="showMoreSettings = !showMoreSettings">
        <text class="more-toggle-text">更多设置（封面 · 规则 · 方式 · 时长 · 简介）</text>
        <text class="more-toggle-arrow">{{ showMoreSettings ? '⌃' : '⌄' }}</text>
      </view>

      <view v-if="showMoreSettings" class="more-settings">
        <view class="divider" />

        <!-- 模组封面 -->
        <view class="form-item cover-item" @tap="chooseCover">
          <text class="item-label">模组封面</text>
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

        <!-- 结束时间 -->
        <view class="form-item">
          <text class="item-label">结束时间</text>
          <picker mode="time" :value="form.endTime" @change="form.endTime = $event.detail.value">
            <text :class="['time-pick-text', form.endTime ? 'has-value' : 'no-value']">
              {{ form.endTime || '选择结束时间' }}
            </text>
          </picker>
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
      </view>

      <!-- 清空重来：仅工作区模式，破坏性操作有二次确认 -->
      <view v-if="!isEditMode && hasAnyContent" class="clear-row" @tap="handleClearWorkspace">
        <text class="clear-row-text">清空重来</text>
      </view>

      <view class="bottom-placeholder" />
    </scroll-view>

    <!-- 底部吸底按钮：工作区/编辑草稿双按钮，编辑已发布招募时只剩「保存」 -->
    <view class="bottom-bar">
      <view class="btn-row">
        <view v-if="showDraftButton" class="action-btn btn-secondary" @tap="handleSaveDraft">
          <text class="action-btn-text">存草稿</text>
        </view>
        <view class="action-btn btn-primary" @tap="handlePublish">
          <text class="action-btn-text">{{ primaryButtonLabel }}</text>
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

  .cover-upload-box {
    margin-left: auto;
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

/* 时间选择器文字（开始时间在主路径，结束时间在「更多设置」内） */
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

/* 单选圆点组 */
.radio-group {
  display: flex;
  flex-direction: row;
  /* 规则体系扩到 4 项后一行放不下，允许换行 */
  flex-wrap: wrap;
  gap: 24rpx 40rpx;
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

/* 清空重来 */
.clear-row {
  padding: 24rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.clear-row-text {
  font-size: 24rpx;
  color: $text-tertiary;
}

/* 「更多设置」折叠入口 */
.more-toggle {
  justify-content: space-between;

  .more-toggle-text {
    font-size: 28rpx;
    color: $text-tertiary;
  }

  .more-toggle-arrow {
    font-size: 28rpx;
    color: $text-tertiary;
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

    /* 选中态文字必须嵌在 &.active 里——「.active &」在外层嵌套下会编译出永不匹配的选择器（P3 陈年 bug 根因） */
    &.active {
      background-color: #434343;

      .invite-type-text {
        color: #ffffff;
      }
    }
  }

  .invite-type-text {
    font-size: 26rpx;
    color: #363636;
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
