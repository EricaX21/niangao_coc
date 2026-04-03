/**
 * 模组 & 申请数据接口
 * 当前返回 mock 数据；接入后端后替换为真实接口调用，调用方无需改动。
 */
import { mockModuleList, mockApplicationList } from '../utils/mockData'

export const getModuleList = () => mockModuleList

export const getApplicationList = () => mockApplicationList
