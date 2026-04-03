/**
 * 用户数据接口
 * 当前返回 mock 数据；接入后端后替换为真实接口调用，调用方无需改动。
 */
import { mockUsers } from '../utils/mockData'

export const getMockUsers = () => mockUsers

// 按 uid 查找单个用户（接入后端后替换为真实接口）
export const getUserByUid = (uid) => mockUsers.find(u => u.uid === uid) || null
