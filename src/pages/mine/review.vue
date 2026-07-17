<!-- 审核页 - 发布人查看申请人列表并审批 -->
<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getApplicationsByModule, reviewApplication } from '@/api/module'

const moduleId = ref('')
const moduleName = ref('')
const applications = ref([])
const loading = ref(false)

onLoad((options) => {
  if (options.id) moduleId.value = options.id
  if (options.name) moduleName.value = options.name
})

// 每次 onShow 时重新加载，审批后返回时数据立即更新
onShow(() => {
  if (moduleId.value) {
    loadApplications()
  }
})

// 从云函数加载申请列表
const loadApplications = async () => {
  loading.value = true
  try {
    applications.value = await getApplicationsByModule(moduleId.value)
  } catch (error) {
    console.error('loadApplications error:', error)
    applications.value = []
  } finally {
    loading.value = false
  }
}

const approvedCount = computed(() =>
  applications.value.filter(a => a.status === 'approved').length
)

const handleApprove = (item) => {
  uni.showModal({
    title: '确认同意',
    content: `同意 ${item.applicantNickname} 加入本次招募？`,
    success: async (res) => {
      if (res.confirm) {
        const result = await reviewApplication(item._id, 'approve')
        if (result.success) {
          // 更新本地列表状态，不需要重新请求整个列表
          item.status = 'approved'
          uni.showToast({ title: '已同意', icon: 'success' })
        } else {
          uni.showToast({ title: result.message || '操作失败', icon: 'none' })
        }
      }
    }
  })
}

const handleReject = (item) => {
  uni.showModal({
    title: '确认拒绝',
    content: `拒绝 ${item.applicantNickname} 的申请？`,
    success: async (res) => {
      if (res.confirm) {
        const result = await reviewApplication(item._id, 'reject')
        if (result.success) {
          item.status = 'rejected'
          uni.showToast({ title: '已拒绝', icon: 'none' })
        } else {
          uni.showToast({ title: result.message || '操作失败', icon: 'none' })
        }
      }
    }
  })
}

// 点击申请人头像 → 跳转用户主页
const goUserProfile = (item) => {
  if (!item?.applicantId) return
  uni.navigateTo({ url: `/pages/profile/index?uid=${item.applicantId}` })
}
</script>

<template>
  <view class="page">
    <!-- 模组名称 + 统计 -->
    <view class="page-meta">
      <text class="meta-module-name" v-if="moduleName">{{ moduleName }}</text>
      <text class="meta-count">共 {{ applications.length }} 人申请，已通过 {{ approvedCount }} 人</text>
    </view>

    <!-- 申请人列表 -->
    <scroll-view scroll-y class="list-scroll">
      <view class="list-inner">

        <!-- 加载中 -->
        <view v-if="loading && applications.length === 0" class="empty-state">
          <text class="empty-text">加载中...</text>
        </view>

        <!-- 空状态 -->
        <view v-else-if="applications.length === 0" class="empty-state">
          <text class="empty-text">暂无申请，分享招募让更多人看到吧</text>
        </view>

        <!-- 申请人条目 -->
        <view
          v-for="item in applications"
          :key="item._id"
          class="applicant-item"
        >
          <!-- 左侧：头像 + 昵称 + 申请时间 -->
          <view class="applicant-left" @tap="goUserProfile(item)">
            <image
              v-if="item.applicantAvatar"
              :src="item.applicantAvatar"
              mode="aspectFill"
              class="applicant-avatar-img"
            />
            <view v-else class="applicant-avatar" />
            <view class="applicant-info">
              <text class="applicant-name">{{ item.applicantNickname }}</text>
            </view>
          </view>

          <!-- 右侧：操作按钮（pending）/ 状态标签（已处理） -->
          <view class="applicant-right">
            <!-- 待审核 -->
            <view v-if="item.status === 'pending'" class="action-btns">
              <view class="btn btn-reject" @tap="handleReject(item)">
                <text class="btn-text">拒绝</text>
              </view>
              <view class="btn btn-approve" @tap="handleApprove(item)">
                <text class="btn-text">同意</text>
              </view>
            </view>
            <!-- 已通过 -->
            <view v-else-if="item.status === 'approved'" class="status-tag tag-approved">
              <text class="status-text">已通过</text>
            </view>
            <!-- 已拒绝 -->
            <view v-else-if="item.status === 'rejected'" class="status-tag tag-rejected">
              <text class="status-text">已拒绝</text>
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

/* 模组名称 + 统计行 */
.page-meta {
  padding: 0 32rpx 24rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  box-sizing: border-box;

  .meta-module-name {
    font-size: 30rpx;
    font-weight: 600;
    color: #363636;
  }

  .meta-count {
    font-size: 22rpx;
    color: #b2b2b2;
  }
}

/* 申请人列表 */
.list-scroll {
  flex: 1;

  .list-inner {
    padding: 0 32rpx;
    box-sizing: border-box;
  }

  .list-bottom {
    height: 40rpx;
  }
}

.empty-state {
  padding: 80rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;

  .empty-text {
    font-size: 28rpx;
    color: #b2b2b2;
  }
}

/* 申请人条目 */
.applicant-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: #e8e8e8;
  border-radius: 16rpx;
  padding: 24rpx 32rpx;
  margin-bottom: 8rpx;
  box-sizing: border-box;
}

.applicant-left {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20rpx;
  flex: 1;
  min-width: 0;

  .applicant-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background-color: #d9d9d9;
    flex-shrink: 0;
  }

  .applicant-avatar-img {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .applicant-info {
    display: flex;
    flex-direction: column;
    gap: 6rpx;
    min-width: 0;

    .applicant-name {
      font-size: 30rpx;
      font-weight: 600;
      color: #000000;
    }
  }
}

.applicant-right {
  flex-shrink: 0;
  margin-left: 24rpx;

  .action-btns {
    display: flex;
    flex-direction: row;
    gap: 16rpx;

    .btn {
      height: 60rpx;
      border-radius: 30rpx;
      padding: 0 28rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;

      .btn-text {
        font-size: 26rpx;
        font-weight: 600;
      }
    }

    .btn-reject {
      background-color: #ffffff;
      border: 1rpx solid #d9d9d9;

      .btn-text {
        color: #666666;
      }
    }

    .btn-approve {
      background-color: #2c2c2c;

      .btn-text {
        color: #ffffff;
      }
    }
  }

  .status-tag {
    height: 48rpx;
    border-radius: 999rpx;
    padding: 0 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;

    .status-text {
      font-size: 24rpx;
    }
  }

  .tag-approved {
    background-color: #e8f5ee;

    .status-text {
      color: #2a7a4a;
    }
  }

  .tag-rejected {
    background-color: #e8e8e8;
    border: 1rpx solid #d9d9d9;

    .status-text {
      color: #666666;
    }
  }
}
</style>
