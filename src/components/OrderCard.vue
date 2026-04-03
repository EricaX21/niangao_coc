<template>
  <view class="order-card" @tap="handleTap">
    <view class="order-header">
      <view class="order-type">
        <text class="type-tag">{{ order.typeName }}</text>
      </view>
      <text class="order-price">¥{{ order.price }}</text>
    </view>

    <view class="order-address">
      <view class="address-item">
        <view class="dot dot-start"></view>
        <text class="address-text">{{ order.startAddress }}</text>
      </view>
      <view class="address-line"></view>
      <view class="address-item">
        <view class="dot dot-end"></view>
        <text class="address-text">{{ order.endAddress }}</text>
      </view>
    </view>

    <view class="order-footer">
      <text class="order-time">{{ order.createTime }}</text>
      <view :class="['status-tag', `status-${order.status}`]">
        {{ statusText }}
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  order: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['tap'])

const statusMap = {
  pending: '待接单',
  accepted: '配送中',
  completed: '已完成',
  cancelled: '已取消',
}

const statusText = computed(() => statusMap[props.order.status] || '未知')

function handleTap() {
  emit('tap', props.order)
}
</script>

<style lang="scss" scoped>
.order-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.type-tag {
  background: #fff3ee;
  color: #ff6b35;
  font-size: 24rpx;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
}

.order-price {
  font-size: 36rpx;
  font-weight: bold;
  color: #ff6b35;
}

.order-address {
  margin-bottom: 24rpx;
}

.address-item {
  display: flex;
  align-items: center;
}

.dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.dot-start {
  background: #4caf50;
}

.dot-end {
  background: #ff6b35;
}

.address-line {
  width: 2rpx;
  height: 24rpx;
  background: #eee;
  margin-left: 7rpx;
  margin: 6rpx 0 6rpx 7rpx;
}

.address-text {
  font-size: 28rpx;
  color: #333;
}

.order-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.order-time {
  font-size: 24rpx;
  color: #999;
}

.status-tag {
  font-size: 24rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;

  &.status-pending {
    background: #fff8e1;
    color: #f9a825;
  }

  &.status-accepted {
    background: #e3f2fd;
    color: #1976d2;
  }

  &.status-completed {
    background: #e8f5e9;
    color: #388e3c;
  }

  &.status-cancelled {
    background: #f5f5f5;
    color: #999;
  }
}
</style>
