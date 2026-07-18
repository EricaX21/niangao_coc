Component({
  data: {
    selected: 0
  },
  methods: {
    switchTab(e) {
      const path = e.currentTarget.dataset.path
      const index = parseInt(e.currentTarget.dataset.index)
      this.setData({ selected: index })
      wx.switchTab({ url: path })
    }
  }
})
