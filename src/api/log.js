/**
 * 演绎记录接口
 * 当前返回 mock 数据；接入后端后替换为真实接口调用，调用方无需改动。
 */
import { mockLogList } from '../utils/mockData'

export const getLogList = () => mockLogList

export const getLogById = (id) => mockLogList.find(l => l.id == id) || null

export const getLogsByUid = (uid) => mockLogList.filter(l => l.authorId === uid)
