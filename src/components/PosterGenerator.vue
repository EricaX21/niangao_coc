<!-- 海报生成与预览组件 - Canvas 绘制复古邀请函风格海报 -->
<script setup>
import { ref, nextTick } from 'vue'
import { formatGameTime } from '@/utils/formatTime'

const props = defineProps({
  moduleData: { type: Object, default: () => ({}) },
  creatorInfo: { type: Object, default: () => ({}) },
})

// 海报配色（复古邀请函）
const COLORS = {
  bgTop: '#F5F0E1',
  bgBottom: '#EDE5D0',
  border: '#C4B896',
  title: '#3D3422',
  body: '#5C5139',
  label: '#8B7D5E',
  lightest: '#A89B7E',
  tagBg: 'rgba(196,184,150,0.15)',
  qrBg: '#D9D5C8',
}

// 海报尺寸常量
const POSTER_WIDTH = 750
const PADDING = 50
const CONTENT_WIDTH = POSTER_WIDTH - PADDING * 2 // 650
const MIN_HEIGHT = 900

const showPreview = ref(false)
const posterImage = ref('')
const generating = ref(false)

// 文字换行函数：返回行数组
const getWrappedLines = (ctx, text, maxWidth) => {
  const lines = []
  // 先按换行符分段
  const paragraphs = text.split('\n')
  for (const para of paragraphs) {
    if (para === '') {
      lines.push('')
      continue
    }
    const chars = para.split('')
    let line = ''
    for (let i = 0; i < chars.length; i++) {
      const testLine = line + chars[i]
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && line.length > 0) {
        lines.push(line)
        line = chars[i]
      } else {
        line = testLine
      }
    }
    if (line) lines.push(line)
  }
  return lines
}

// 绘制文字行并返回结束 y 坐标
const drawLines = (ctx, lines, x, y, lineHeight) => {
  let currentY = y
  for (const line of lines) {
    if (line !== '') {
      ctx.fillText(line, x, currentY)
    }
    currentY += lineHeight
  }
  return currentY
}

// 居中绘制文字
const drawCenterText = (ctx, text, y, canvasWidth) => {
  const metrics = ctx.measureText(text)
  const x = (canvasWidth - metrics.width) / 2
  ctx.fillText(text, x, y)
}

// 居中绘制分隔线
const drawSeparator = (ctx, y, centerX, halfWidth) => {
  ctx.beginPath()
  ctx.moveTo(centerX - halfWidth, y)
  ctx.lineTo(centerX + halfWidth, y)
  ctx.strokeStyle = COLORS.border
  ctx.lineWidth = 0.5
  ctx.stroke()
}

// 暴露 generate 方法
const generate = async () => {
  generating.value = true
  uni.showLoading({ title: '正在生成海报...' })

  await nextTick()

  try {
    // #ifdef MP-WEIXIN
    await drawPosterWeixin()
    // #endif
    // #ifndef MP-WEIXIN
    await drawPosterH5()
    // #endif
  } catch (err) {
    console.error('海报生成失败:', err)
    uni.showToast({ title: '海报生成失败', icon: 'none' })
  } finally {
    generating.value = false
    uni.hideLoading()
  }
}

defineExpose({ generate })

// 微信小程序 Canvas 2D 绘制
const drawPosterWeixin = () => {
  return new Promise((resolve, reject) => {
    const query = uni.createSelectorQuery().in(getCurrentInstance())
    query.select('#posterCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          reject(new Error('Canvas 节点未找到'))
          return
        }

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = uni.getSystemInfoSync().pixelRatio || 2

        // 先计算简介高度以确定海报总高
        ctx.font = '14px sans-serif'
        const introText = props.moduleData.intro || ''
        const introLines = getWrappedLines(ctx, introText, CONTENT_WIDTH - 40)
        const introHeight = introLines.length * 36 + 20

        // 计算海报总高度
        const fixedHeight = 700
        const totalHeight = Math.max(MIN_HEIGHT, fixedHeight + introHeight)

        // 设置 Canvas 尺寸
        canvas.width = POSTER_WIDTH * dpr
        canvas.height = totalHeight * dpr
        ctx.scale(dpr, dpr)

        // 执行绘制
        drawContent(ctx, totalHeight, introLines)

        // 导出图片
        setTimeout(() => {
          uni.canvasToTempFilePath({
            canvas,
            width: POSTER_WIDTH * dpr,
            height: totalHeight * dpr,
            destWidth: POSTER_WIDTH * dpr,
            destHeight: totalHeight * dpr,
            fileType: 'png',
            success: (res) => {
              posterImage.value = res.tempFilePath
              showPreview.value = true
              resolve()
            },
            fail: reject,
          })
        }, 200)
      })
  })
}

// H5/其他平台降级（简化处理）
const drawPosterH5 = async () => {
  // H5 平台暂用简化方案
  uni.showToast({ title: '请在小程序中使用此功能', icon: 'none' })
}

// 核心绘制逻辑
const drawContent = (ctx, totalHeight, introLines) => {
  const centerX = POSTER_WIDTH / 2
  const mod = props.moduleData
  const creator = props.creatorInfo

  // 1. 背景渐变（羊皮纸）
  const gradient = ctx.createLinearGradient(0, 0, 0, totalHeight)
  gradient.addColorStop(0, COLORS.bgTop)
  gradient.addColorStop(1, COLORS.bgBottom)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, POSTER_WIDTH, totalHeight)

  // 2. 内边框装饰
  ctx.strokeStyle = COLORS.border
  ctx.lineWidth = 0.5
  ctx.strokeRect(8, 8, POSTER_WIDTH - 16, totalHeight - 16)

  let y = 50

  // 3. 顶部标识
  ctx.font = '10px sans-serif'
  ctx.fillStyle = COLORS.lightest
  ctx.textAlign = 'center'
  drawCenterText(ctx, 'T R P G   S E S S I O N', y, POSTER_WIDTH)
  y += 30

  // 短分隔线
  drawSeparator(ctx, y, centerX, 40)
  y += 35

  // 4. 小字标签
  ctx.font = '11px sans-serif'
  ctx.fillStyle = COLORS.label
  drawCenterText(ctx, '- MODULE -', y, POSTER_WIDTH)
  y += 30

  // 5. 模组名称（大字居中）
  ctx.font = 'bold 28px sans-serif'
  ctx.fillStyle = COLORS.title
  // 名称可能较长，需换行
  ctx.textAlign = 'left'
  const titleLines = getWrappedLines(ctx, mod.name || '未命名模组', CONTENT_WIDTH)
  for (const line of titleLines) {
    const tw = ctx.measureText(line).width
    ctx.fillText(line, (POSTER_WIDTH - tw) / 2, y)
    y += 42
  }
  y += 15

  // 分隔线
  drawSeparator(ctx, y, centerX, CONTENT_WIDTH / 2)
  y += 30

  // 6. 标签（规则 + 跑团方式）
  const tags = [mod.rule, mod.mode].filter(Boolean)
  if (tags.length > 0) {
    ctx.font = '12px sans-serif'
    const tagWidths = tags.map(t => ctx.measureText(t).width + 24)
    const totalTagWidth = tagWidths.reduce((a, b) => a + b, 0) + (tags.length - 1) * 12
    let tagX = (POSTER_WIDTH - totalTagWidth) / 2

    for (let i = 0; i < tags.length; i++) {
      const tw = tagWidths[i]
      // 标签背景
      ctx.fillStyle = COLORS.tagBg
      ctx.strokeStyle = COLORS.border
      ctx.lineWidth = 0.5
      const tagH = 28
      const tagR = 14
      // 圆角矩形
      ctx.beginPath()
      ctx.moveTo(tagX + tagR, y - tagH / 2)
      ctx.lineTo(tagX + tw - tagR, y - tagH / 2)
      ctx.arcTo(tagX + tw, y - tagH / 2, tagX + tw, y, tagR)
      ctx.arcTo(tagX + tw, y + tagH / 2, tagX + tw - tagR, y + tagH / 2, tagR)
      ctx.lineTo(tagX + tagR, y + tagH / 2)
      ctx.arcTo(tagX, y + tagH / 2, tagX, y, tagR)
      ctx.arcTo(tagX, y - tagH / 2, tagX + tagR, y - tagH / 2, tagR)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      // 标签文字
      ctx.fillStyle = COLORS.body
      ctx.textAlign = 'center'
      ctx.fillText(tags[i], tagX + tw / 2, y + 4)
      tagX += tw + 12
    }
    y += 35
  }

  y += 10

  // 7. 信息区（左对齐）
  ctx.textAlign = 'left'
  ctx.font = '14px sans-serif'

  const infoItems = [
    { dot: '●', label: '主持人', value: creator.nickname || mod.publisherName || '未知' },
    { dot: '●', label: '时间', value: formatGameTime(mod.gameDays, mod.startTime, mod.endTime) },
    { dot: '●', label: '招募', value: `${mod.totalCount || '?'}人 · 招${mod.recruitKP ? 'KP+' : ''}PL` },
  ]

  for (const item of infoItems) {
    ctx.fillStyle = COLORS.border
    ctx.fillText(item.dot, PADDING + 20, y)
    ctx.fillStyle = COLORS.label
    ctx.fillText(item.label, PADDING + 40, y)
    ctx.fillStyle = COLORS.body
    ctx.fillText(item.value, PADDING + 110, y)
    y += 36
  }

  y += 15

  // 分隔线
  drawSeparator(ctx, y, centerX, CONTENT_WIDTH / 2)
  y += 30

  // 8. 模组简介
  ctx.font = '11px sans-serif'
  ctx.fillStyle = COLORS.label
  ctx.textAlign = 'center'
  drawCenterText(ctx, '- 模组简介 -', y, POSTER_WIDTH)
  y += 25

  ctx.font = '14px sans-serif'
  ctx.fillStyle = COLORS.body
  ctx.textAlign = 'left'
  y = drawLines(ctx, introLines, PADDING + 20, y, 36)
  y += 15

  // 分隔线
  drawSeparator(ctx, y, centerX, CONTENT_WIDTH / 2)
  y += 35

  // 9. 小程序码占位 + 品牌
  ctx.textAlign = 'center'
  // 圆形占位
  const qrR = 60
  const qrCenterX = centerX - 80
  const qrCenterY = y + qrR / 2
  ctx.beginPath()
  ctx.arc(qrCenterX, qrCenterY, qrR / 2, 0, Math.PI * 2)
  ctx.fillStyle = COLORS.qrBg
  ctx.fill()
  // 占位文字
  ctx.font = '9px sans-serif'
  ctx.fillStyle = COLORS.label
  ctx.fillText('小程序码', qrCenterX, qrCenterY + 3)

  // 右侧引导文字
  ctx.textAlign = 'left'
  ctx.font = '11px sans-serif'
  ctx.fillStyle = COLORS.body
  ctx.fillText('扫码查看详情', centerX - 10, qrCenterY - 8)
  ctx.font = '10px sans-serif'
  ctx.fillStyle = COLORS.lightest
  ctx.fillText('年糕跑团 · 组局小程序', centerX - 10, qrCenterY + 12)

  y = qrCenterY + qrR / 2 + 30

  // 10. 底部装饰
  ctx.textAlign = 'center'
  ctx.font = '10px sans-serif'
  ctx.fillStyle = COLORS.lightest
  drawCenterText(ctx, 'I N V I T A T I O N', y, POSTER_WIDTH)
}

// 保存到相册
const saveToAlbum = async () => {
  if (!posterImage.value) return

  try {
    await uni.saveImageToPhotosAlbum({ filePath: posterImage.value })
    uni.showToast({ title: '已保存到相册', icon: 'success' })
  } catch (err) {
    if (err.errMsg && (err.errMsg.includes('deny') || err.errMsg.includes('auth'))) {
      uni.showModal({
        title: '提示',
        content: '需要相册权限才能保存图片，请在设置中开启',
        confirmText: '去设置',
        success: (res) => {
          if (res.confirm) uni.openSetting()
        },
      })
    }
  }
}

const closePreview = () => {
  showPreview.value = false
}
</script>

<template>
  <!-- 隐藏的 Canvas（用于绘制） -->
  <canvas
    type="2d"
    id="posterCanvas"
    class="poster-canvas-hidden"
  />

  <!-- 海报预览弹窗 -->
  <view v-if="showPreview" class="poster-overlay" @tap="closePreview">
    <view class="poster-preview-box" @tap.stop>
      <scroll-view scroll-y class="poster-scroll">
        <image
          :src="posterImage"
          mode="widthFix"
          class="poster-image"
        />
      </scroll-view>

      <view class="poster-actions">
        <view class="poster-btn poster-btn--save" @tap="saveToAlbum">
          <text class="poster-btn-text">保存到相册</text>
        </view>
        <view class="poster-btn poster-btn--close" @tap="closePreview">
          <text class="poster-btn-text">关闭</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
/* Canvas 隐藏在屏幕外 */
.poster-canvas-hidden {
  position: fixed;
  left: -9999rpx;
  top: 0;
  width: 750px;
  height: 1200px;
}

/* 预览遮罩 */
.poster-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

/* 预览容器 */
.poster-preview-box {
  width: 600rpx;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
}

.poster-scroll {
  max-height: 70vh;
  width: 600rpx;
  box-sizing: border-box;
}

.poster-image {
  width: 600rpx;
  border-radius: 16rpx;
}

/* 按钮区 */
.poster-actions {
  display: flex;
  flex-direction: row;
  gap: 24rpx;
  margin-top: 32rpx;
  box-sizing: border-box;
}

.poster-btn {
  padding: 20rpx 48rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;

  .poster-btn-text {
    font-size: 28rpx;
    font-weight: 600;
  }
}

.poster-btn--save {
  background-color: $white;

  .poster-btn-text {
    color: #3D3422;
  }
}

.poster-btn--close {
  background-color: rgba(255, 255, 255, 0.2);

  .poster-btn-text {
    color: $white;
  }
}
</style>
