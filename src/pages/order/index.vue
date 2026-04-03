<template>
  <view class="order-list">
    <!-- Tab 切换 -->
    <view class="tabs">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        :class="['tab-item', activeTab === tab.value ? 'active' : '']"
        @tap="switchTab(tab.value)"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- 订单列表 -->
    <scroll-view
      scroll-y
      class="list-wrap"
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view v-if="loading && orders.length === 0" class="loading-wrap">
        <text>加载中...</text>
      </view>

      <block v-else-if="orders.length > 0">
        <OrderCard
          v-for="order in orders"
          :key="order.id"
          :order="order"
          @tap="goDetail"
        />
        <view v-if="noMore" class="no-more">没有更多了</view>
      </block>

      <view v-else class="empty-wrap">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无订单</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'
import OrderCard from '../../components/OrderCard.vue'
import { getMyOrders } from '../../api/order'

const tabs = [
  { label: '全部', value: '' },
  { label: '待接单', value: 'pending' },
  { label: '配送中', value: 'accepted' },
  { label: '已完成', value: 'completed' },
]

const activeTab = ref('')
const orders = ref([])
const page = ref(1)
const loading = ref(false)
const refreshing = ref(false)
const noMore = ref(false)

async function loadOrders(reset = false) {
  if (loading.value) return
  if (reset) {
    page.value = 1
    noMore.value = false
    orders.value = []
  }
  loading.value = true
  try {
    const res = await getMyOrders({ status: activeTab.value, page: page.value, size: 10 })
    const list = res.list || []
    orders.value = reset ? list : [...orders.value, ...list]
    noMore.value = list.length < 10
    if (!reset) page.value++
  } catch {
    orders.value = reset ? [] : orders.value
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

function switchTab(val) {
  activeTab.value = val
}

function loadMore() {
  if (!noMore.value) loadOrders()
}

async function onRefresh() {
  refreshing.value = true
  await loadOrders(true)
}

function goDetail(order) {
  uni.navigateTo({ url: `/pages/order/detail?id=${order.id}` })
}

watch(activeTab, () => loadOrders(true), { immediate: true })
</script>

<style lang="scss" scoped>
.order-list {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.tabs {
  display: flex;
  background: #fff;
  border-bottom: 1rpx solid #eee;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 28rpx 0;
  font-size: 28rpx;
  color: #666;
  position: relative;

  &.active {
    color: #ff6b35;
    font-weight: bold;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 40rpx;
      height: 4rpx;
      background: #ff6b35;
      border-radius: 2rpx;
    }
  }
}

.list-wrap {
  flex: 1;
  padding: 20rpx 30rpx;
}

.loading-wrap,
.empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
  color: #999;
  font-size: 28rpx;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.no-more {
  text-align: center;
  font-size: 24rpx;
  color: #ccc;
  padding: 30rpx 0;
}
</style>
