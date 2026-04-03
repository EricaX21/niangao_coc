<template>
  <view class="detail" v-if="order">
    <!-- 状态头部 -->
    <view class="status-header">
      <text class="status-title">{{ statusMap[order.status] }}</text>
      <text class="status-desc">{{ statusDesc }}</text>
    </view>

    <!-- 地址信息 -->
    <view class="address-card">
      <view class="address-row">
        <view class="dot dot-start"></view>
        <view class="address-info">
          <text class="address-label">取件地址</text>
          <text class="address-text">{{ order.startAddress }}</text>
        </view>
      </view>
      <view class="address-divider"></view>
      <view class="address-row">
        <view class="dot dot-end"></view>
        <view class="address-info">
          <text class="address-label">送达地址</text>
          <text class="address-text">{{ order.endAddress }}</text>
        </view>
      </view>
    </view>

    <!-- 订单信息 -->
    <view class="info-card">
      <view class="info-item">
        <text class="info-label">服务类型</text>
        <text class="info-value">{{ order.typeName }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">物品描述</text>
        <text class="info-value">{{ order.description }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">联系电话</text>
        <text class="info-value primary" @tap="callPhone">{{ order.phone }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">报酬金额</text>
        <text class="info-value price">¥{{ order.price }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">订单编号</text>
        <text class="info-value">{{ order.id }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">发布时间</text>
        <text class="info-value">{{ order.createTime }}</text>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="bottom-bar">
      <button
        v-if="order.status === 'pending'"
        class="btn btn-cancel"
        @tap="handleCancel"
      >
        取消订单
      </button>
      <button
        v-if="order.status === 'pending'"
        class="btn btn-primary"
        @tap="handleAccept"
      >
        立即接单
      </button>
      <button
        v-if="order.status === 'accepted'"
        class="btn btn-primary"
        @tap="handleComplete"
      >
        确认完成
      </button>
    </view>
  </view>

  <view v-else class="loading-wrap">
    <text>加载中...</text>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getOrderDetail, acceptOrder, completeOrder, cancelOrder } from '../../api/order'

const order = ref(null)

const statusMap = {
  pending: '待接单',
  accepted: '配送中',
  completed: '已完成',
  cancelled: '已取消',
}

const statusDescMap = {
  pending: '等待跑腿员接单中，请保持手机畅通',
  accepted: '跑腿员正在配送，请耐心等候',
  completed: '订单已完成，感谢使用',
  cancelled: '订单已取消',
}

const statusDesc = computed(() => statusDescMap[order.value?.status] || '')

async function loadDetail() {
  const pages = getCurrentPages()
  const id = pages[pages.length - 1]?.options?.id
  if (!id) return
  try {
    order.value = await getOrderDetail(id)
  } catch {
    order.value = null
  }
}

function callPhone() {
  uni.makePhoneCall({ phoneNumber: order.value.phone })
}

async function handleAccept() {
  await acceptOrder(order.value.id)
  uni.showToast({ title: '接单成功', icon: 'success' })
  await loadDetail()
}

async function handleComplete() {
  await completeOrder(order.value.id)
  uni.showToast({ title: '已完成', icon: 'success' })
  await loadDetail()
}

function handleCancel() {
  uni.showModal({
    title: '取消订单',
    content: '确定要取消此订单吗？',
    async success(res) {
      if (res.confirm) {
        await cancelOrder(order.value.id, '用户主动取消')
        uni.showToast({ title: '已取消', icon: 'success' })
        await loadDetail()
      }
    },
  })
}

onMounted(loadDetail)
</script>

<style lang="scss" scoped>
.detail {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 160rpx;
}

.status-header {
  background: #ff6b35;
  padding: 40rpx 30rpx 50rpx;
}

.status-title {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 12rpx;
}

.status-desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

.address-card {
  background: #fff;
  margin: -20rpx 20rpx 20rpx;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.address-row {
  display: flex;
  align-items: flex-start;
}

.dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  margin-top: 8rpx;
  flex-shrink: 0;

  &.dot-start { background: #4caf50; }
  &.dot-end { background: #ff6b35; }
}

.address-divider {
  width: 2rpx;
  height: 30rpx;
  background: #eee;
  margin: 8rpx 0 8rpx 9rpx;
}

.address-label {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-bottom: 6rpx;
}

.address-text {
  font-size: 28rpx;
  color: #333;
}

.info-card {
  background: #fff;
  margin: 0 20rpx 20rpx;
  border-radius: 16rpx;
  overflow: hidden;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 28rpx 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.info-label {
  font-size: 28rpx;
  color: #999;
}

.info-value {
  font-size: 28rpx;
  color: #333;
  max-width: 400rpx;
  text-align: right;

  &.primary { color: #ff6b35; }
  &.price { color: #ff6b35; font-weight: bold; }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 20rpx;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.btn {
  flex: 1;
  height: 90rpx;
  line-height: 90rpx;
  border-radius: 80rpx;
  font-size: 30rpx;
  border: none;

  &.btn-primary {
    background: #ff6b35;
    color: #fff;
  }

  &.btn-cancel {
    background: #f5f5f5;
    color: #666;
  }
}

.loading-wrap {
  display: flex;
  justify-content: center;
  padding: 120rpx 0;
  color: #999;
}
</style>
