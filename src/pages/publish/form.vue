<!-- 编辑招募页 - 普通页面（非 tab），从 P8/P9 带 ?id= 进入，编辑已发布或草稿中的招募 -->
<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import ModuleForm from '@/components/ModuleForm.vue'
import { useGameStore } from '@/store/game'
import { useUserStore } from '@/store/user'
import { checkLogin } from '@/utils/auth'
import { safeNavigateBack } from '@/utils/navigation'

const gameStore = useGameStore()
const userStore = useUserStore()
const editId = ref('')

onLoad(async (options) => {
  // 编辑他人看不到的内容，必须先登录；拒绝授权则直接退回
  const ok = await checkLogin(userStore)
  if (!ok) {
    safeNavigateBack()
    return
  }

  // 优先取 URL 参数；兼容 store 传递的旧入口
  editId.value = options?.id || gameStore.editingModuleId || ''
  if (gameStore.editingModuleId) gameStore.clearEditingModuleId()

  // 本页只承担编辑场景；不带 id 误入时回首页编辑器（新建走首页 tab）
  if (!editId.value) {
    uni.switchTab({ url: '/pages/publish/index' })
  }
})

// 保存成功后返回来源页（P8/P9），其 onShow 会刷新数据
const backToSource = () => {
  uni.showToast({ title: '已保存', icon: 'success' })
  setTimeout(() => safeNavigateBack(), 1200)
}
</script>

<template>
  <view class="page-container">
    <!-- editId 就绪后再挂载，避免组件先按工作区模式初始化、把本地工作区内容闪现进编辑页 -->
    <ModuleForm
      v-if="editId"
      :edit-id="editId"
      @updated="backToSource"
      @draft-saved="backToSource"
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
</style>
