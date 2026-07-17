<script>
import { CLOUD_ENV_ID } from './config.js'

export default {
  onLaunch() {
    // #ifdef MP-WEIXIN
    wx.cloud.init({
      env: CLOUD_ENV_ID,
      traceUser: true
    })
    // #endif
  },
}
</script>

<style lang="scss">
@import './uni.scss';
</style>
