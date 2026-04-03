import { get, post, put } from '../utils/request'

// 获取附近订单列表
export const getNearbyOrders = (params) => get('/orders/nearby', params)

// 发布跑腿订单
export const createOrder = (data) => post('/orders', data)

// 获取我的订单列表
export const getMyOrders = (params) => get('/orders/mine', params)

// 获取订单详情
export const getOrderDetail = (id) => get(`/orders/${id}`)

// 接单
export const acceptOrder = (id) => post(`/orders/${id}/accept`)

// 完成订单
export const completeOrder = (id) => post(`/orders/${id}/complete`)

// 取消订单
export const cancelOrder = (id, reason) => put(`/orders/${id}/cancel`, { reason })

// 评价订单
export const reviewOrder = (id, data) => post(`/orders/${id}/review`, data)
