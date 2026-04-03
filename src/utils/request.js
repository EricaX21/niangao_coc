const BASE_URL = 'https://api.example.com' // 替换为实际接口地址

/**
 * 统一请求封装
 * @param {string} url - 接口路径
 * @param {string} method - 请求方法
 * @param {object} data - 请求数据
 */
function request(url, method = 'GET', data = {}) {
  const token = uni.getStorageSync('token')

  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      success(res) {
        const { statusCode, data: resData } = res
        if (statusCode === 200) {
          if (resData.code === 0) {
            resolve(resData.data)
          } else if (resData.code === 401) {
            // token 过期，清除并跳转登录
            uni.removeStorageSync('token')
            uni.navigateTo({ url: '/pages/login/index' })
            reject(new Error(resData.msg || '请重新登录'))
          } else {
            uni.showToast({ title: resData.msg || '请求失败', icon: 'none' })
            reject(new Error(resData.msg))
          }
        } else {
          uni.showToast({ title: '网络错误', icon: 'none' })
          reject(new Error('网络错误'))
        }
      },
      fail(err) {
        uni.showToast({ title: '网络连接失败', icon: 'none' })
        reject(err)
      },
    })
  })
}

export const get = (url, data) => request(url, 'GET', data)
export const post = (url, data) => request(url, 'POST', data)
export const put = (url, data) => request(url, 'PUT', data)
export const del = (url, data) => request(url, 'DELETE', data)

export default request
