/**
 * 页面栈首页时安全返回：栈深 > 1 则 navigateBack，否则回首页（编辑器 tab）
 * 避免 navigateBack:fail cannot navigate back at first page 报错
 */
export function safeNavigateBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.switchTab({ url: '/pages/publish/index' })
  }
}
