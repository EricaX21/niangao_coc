/**
 * game store —— 所有模组和申请数据的单一数据源
 *
 * 页面只调用 action，不直接操作 mock 数据。
 * 接入后端时只需替换各 action 的实现，页面代码不需要改动。
 */
import { defineStore } from 'pinia'
import { getModuleList, getApplicationList } from '../api/module'

export const useGameStore = defineStore('game', {
  state: () => ({
    // 深拷贝，确保 store 状态与 mock 数据引用隔离
    modules: JSON.parse(JSON.stringify(getModuleList())),
    applications: JSON.parse(JSON.stringify(getApplicationList())),
    // 编辑模式：从发布人详情页 switchTab 到发布页时，通过此字段传递要编辑的模组 id
    editingModuleId: null,
  }),

  getters: {
    // 招募大厅：只展示招募中
    recruitingModules: (state) =>
      state.modules.filter(m => !m.draft && m.status === 'recruiting'),

    // 我的创建：某用户发布的全部模组
    modulesByCreator: (state) => (uid) =>
      state.modules.filter(m => m.creatorId === uid),

    // 我的申请：某用户提交的全部申请（含模组信息）
    applicationsByUser: (state) => (uid) =>
      state.applications
        .filter(a => a.userId === uid)
        .map(a => {
          const mod = state.modules.find(m => m.id === a.moduleId)
          return mod ? { ...mod, _appId: a.id, _appStatus: a.status } : null
        })
        .filter(Boolean),

    // 审核页：某模组的全部申请
    applicationsByModule: (state) => (moduleId) =>
      state.applications.filter(a => a.moduleId == moduleId),

    // 详情页按钮状态：当前用户对某模组的申请
    myApplicationForModule: (state) => (moduleId, uid) =>
      state.applications.find(
        a => a.moduleId == moduleId && a.userId === uid
      ) || null,
  },

  actions: {
    /**
     * 发布/更新招募
     * @param {object} formData 表单数据
     * @param {object} creator  { uid, nickname }
     * @param {boolean} isDraft 是否保存为草稿
     * @param {string|null} moduleId 编辑时传入原模组 id，新建时为 null
     * @returns module 对象
     */
    publishModule(formData, creator, isDraft = false, moduleId = null) {
      const tags = [formData.mode, formData.rule].filter(Boolean)
      if (formData.totalCount) tags.push(`${formData.totalCount}人`)

      const recruitParts = []
      if (formData.recruitKP) recruitParts.push('1KP')
      if (formData.plCount) recruitParts.push(`${formData.plCount}PL`)

      const updatedFields = {
        cover: formData.cover || '',
        name: formData.name,
        tags,
        duration: formData.duration || '',
        recruit: recruitParts.join(' ') || '待定',
        gameDays: formData.gameDays || [],
        startTime: formData.startTime || '',
        endTime: formData.endTime || '',
        draft: isDraft,
        rule: formData.rule || '',
        mode: formData.mode || '',
        totalCount: Number(formData.totalCount) || 0,
        plCount: Number(formData.plCount) || 0,
        recruitKP: formData.recruitKP || false,
        contact: {
          type: formData.inviteType || 'qq',
          value: formData.inviteValue || '',
        },
        intro: formData.intro || '',
      }

      // 编辑模式：更新现有模组，保留 id / creatorId / applicantCount / status
      if (moduleId) {
        const mod = this.modules.find(m => m.id == moduleId)
        if (mod) {
          Object.assign(mod, updatedFields)
          return mod
        }
      }

      // 新建模式
      const newModule = {
        id: String(Date.now()),
        ...updatedFields,
        publisherName: creator.nickname,
        applicantCount: 0,
        status: 'recruiting',
        creatorId: creator.uid,
      }
      this.modules.unshift(newModule)
      return newModule
    },

    /**
     * 申请加入（mock：新增 application 记录）
     * @param {string} moduleId
     * @param {object} user  { uid, nickname }
     * @returns 新建或已有的 application 对象
     */
    applyToModule(moduleId, user) {
      const existing = this.applications.find(
        a => a.moduleId == moduleId && a.userId === user.uid
      )
      if (existing) return existing

      const now = new Date()
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const dd = String(now.getDate()).padStart(2, '0')
      const hh = String(now.getHours()).padStart(2, '0')
      const mi = String(now.getMinutes()).padStart(2, '0')

      const newApp = {
        id: String(Date.now()),
        moduleId: String(moduleId),
        userId: user.uid,
        nickname: user.nickname,
        avatar: '',
        applyTime: `${mm}-${dd} ${hh}:${mi}`,
        status: 'pending',
      }
      this.applications.push(newApp)

      // 同步更新模组申请人数
      const mod = this.modules.find(m => m.id == moduleId)
      if (mod) mod.applicantCount = (mod.applicantCount || 0) + 1

      return newApp
    },

    /**
     * 审批申请（mock：直接修改状态）
     * @param {string} applicationId
     * @param {'approved'|'rejected'} status
     */
    reviewApplication(applicationId, status) {
      const app = this.applications.find(a => a.id == applicationId)
      if (app) app.status = status
    },

    /**
     * 更新模组状态（发布草稿、发车等）
     * @param {string} moduleId
     * @param {object} updates  例如 { draft: false, status: 'recruiting' }
     */
    updateModuleStatus(moduleId, updates) {
      const mod = this.modules.find(m => m.id == moduleId)
      if (mod) Object.assign(mod, updates)
    },

    /**
     * 设置待编辑模组 id（发布人详情页 → switchTab 到发布页时使用）
     * @param {string} id
     */
    setEditingModuleId(id) {
      this.editingModuleId = id
    },

    /** 发布页读取完编辑 id 后清除，避免再次进入 tab 时重复回填 */
    clearEditingModuleId() {
      this.editingModuleId = null
    },

    /**
     * 确认发车：将招募状态改为 finished，同时将所有 pending 申请自动标记为 rejected
     * @param {string} moduleId
     */
    departModule(moduleId) {
      // 更新模组状态
      const mod = this.modules.find(m => m.id == moduleId)
      if (mod) Object.assign(mod, { status: 'finished', draft: false })

      // 自动清算：将该招募下所有 pending 申请改为 rejected
      this.applications
        .filter(a => a.moduleId == moduleId && a.status === 'pending')
        .forEach(a => { a.status = 'rejected' })
    },
  },
})
