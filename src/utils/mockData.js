// ============================================================
// 测试用户列表（开发者模式：切换用户用）
// ============================================================
export const mockUsers = [
  {
    uid: 'PT10086',
    nickname: '深渊骰主',
    avatar: '',
    gender: 'male',
    isKP: true,
    isPL: true,
    bio: '骰子不负有心人，每周稳定出团',
    qq: '123456789',
    signature: '骰子不负有心人',
    contact: { type: 'qq', value: '123456789' },
  },
  {
    // 切换此用户可测试「我的申请 → 审核中」状态
    uid: 'PT20001',
    nickname: '骰神附体',
    avatar: '',
    gender: 'male',
    isKP: false,
    isPL: true,
    bio: 'PL老手，擅长近战战士',
    qq: '222333444',
    signature: '近战永远的神',
    contact: { type: 'qqgroup', value: '444555666' },
  },
  {
    // 切换此用户可测试「我的申请 → 已通过 → 查看联系方式」状态
    uid: 'PT20002',
    nickname: '月光KP',
    avatar: '',
    gender: 'female',
    isKP: true,
    isPL: false,
    bio: '专职KP，主跑COC7th',
    qq: '555666777',
    signature: '月光下的守秘人',
    contact: { type: 'wx', value: 'moonlightKP' },
  },
]

// 向后兼容（store/user.js 引用）
export const mockCurrentUser = mockUsers[0]

// ============================================================
// 模组列表（含 creatorId，与 mockUsers uid 对应）
// ============================================================
export const mockModuleList = [
  {
    id: '1',
    cover: '',
    name: '影迷者的阴影',
    tags: ['文字', 'COC', '4人'],
    duration: '18h',
    recruit: 'KP 3PL',
    gameDays: [3],
    startTime: '19:00',
    endTime: '22:00',
    publisherName: '深渊骰主',
    applicantCount: 3,
    status: 'recruiting',
    draft: false,
    rule: 'COC7th',
    mode: '文字',
    totalCount: 4,
    plCount: 3,
    recruitKP: false,
    contact: { type: 'qqgroup', value: '123456789' },
    creatorId: 'PT10086',
    intro: '一座废弃的影业公司，一批从未公映的胶片，一群莫名失踪的演员。\n\n调查员们受人委托，前往洛杉矶郊外的旧影棚展开调查。\n随着线索一点点浮出水面，他们逐渐意识到，那些被永久封存的影像中，藏着不该被人类目睹的东西……\n\n本模组适合对克苏鲁神话有基础了解的玩家，包含心理恐怖、调查推理要素，预计跑团时长18小时，分2-3次完成。建议人数：1KP + 3PL。'
  },
  {
    id: '2',
    cover: '',
    name: '不知名的手术',
    tags: ['语音', 'COC7th', '5人'],
    duration: '8h',
    recruit: '1KP 4PL',
    gameDays: [6],
    startTime: '14:00',
    endTime: '17:00',
    publisherName: '月光KP',
    applicantCount: 7,
    status: 'recruiting',
    draft: false,
    rule: 'COC7th',
    mode: '语音',
    totalCount: 5,
    plCount: 4,
    recruitKP: true,
    contact: { type: 'qq', value: '987654321' },
    creatorId: 'PT20002',
    intro: '一家深夜营业的诊所，没有招牌，没有记录在册的医生执照。\n\n四名调查员因各自不同的理由，都在同一个深夜叩响了那扇门。走进去之后，他们才发现——手术室里正在进行的，并不是任何正常意义上的"治疗"。\n\n本模组为单次团，节奏紧凑，适合初入COC的新手玩家，含少量战斗要素。'
  },
  {
    id: '3',
    cover: '',
    name: '绿皮火车',
    tags: ['文字', 'DND5E', '6人'],
    duration: '30h',
    recruit: '1DM 5PL',
    gameDays: [0],
    startTime: '20:00',
    endTime: '23:00',
    publisherName: 'RPG老手',
    applicantCount: 1,
    status: 'finished',
    draft: false,
    rule: 'DND5E',
    mode: '文字',
    totalCount: 6,
    plCount: 5,
    recruitKP: false,
    contact: { type: 'qqgroup', value: '555666777' },
    creatorId: 'PT30001',
    intro: '一列穿越荒原的绿皮火车，车厢里坐满了形形色色的旅客。当列车在暴风雪中突然停驶，众人才发现，同行的某位乘客已悄然死去……\n\n这是一场移动的密室，一段被困在钢铁车厢里的冒险。玩家将扮演来自不同背景的旅行者，在有限的空间和时间内解开真相。\n\n本模组为长篇 DND 5E 战役，每周进行，预计约 10 次完成全程。'
  },
  {
    id: '4',
    cover: '',
    name: '克苏鲁的低语',
    tags: ['语音', 'COC6th', '4人'],
    duration: '12h',
    recruit: '1KP 3PL',
    gameDays: [5, 6],
    startTime: '20:00',
    endTime: '23:00',
    publisherName: '深渊骰主',
    applicantCount: 0,
    status: 'finished',
    draft: false,
    rule: 'COC6th',
    mode: '语音',
    totalCount: 4,
    plCount: 3,
    recruitKP: true,
    contact: { type: 'qqgroup', value: '111222333' },
    creatorId: 'PT10086',
    intro: '深海之中，有什么在低语……\n\n本模组改编自洛夫克拉夫特经典短篇，调查员将沿着一连串诡异的线索，深入新英格兰的海滨小镇，揭开一个传承数百年的秘密仪式。\n\n已发车，感谢各位参与者！'
  },
  {
    id: '5a',
    cover: '',
    name: '龙与地下城：失落矿坑',
    tags: ['语音', 'DND5E', '5人'],
    duration: '20h',
    recruit: '1DM 4PL',
    gameDays: [5],
    startTime: '20:00',
    endTime: '23:00',
    publisherName: '骰神附体',
    applicantCount: 2,
    status: 'recruiting',
    draft: false,
    rule: 'DND5E',
    mode: '语音',
    totalCount: 5,
    plCount: 4,
    recruitKP: false,
    contact: { type: 'qqgroup', value: '444555666' },
    creatorId: 'PT20001',
    intro: '经典DND入门模组，适合新老玩家。冒险者们将深入一座被遗忘的矿坑，面对哥布林、亡灵和更可怕的东西。'
  },
  {
    id: '5b',
    cover: '',
    name: '命运之轮',
    tags: ['文字', 'FATE', '4人'],
    duration: '6h',
    recruit: '1KP 3PL',
    gameDays: [6, 0],
    startTime: '14:00',
    endTime: '18:00',
    publisherName: '月光KP',
    applicantCount: 0,
    status: 'recruiting',
    draft: false,
    rule: 'FATE',
    mode: '文字',
    totalCount: 4,
    plCount: 3,
    recruitKP: false,
    contact: { type: 'qq', value: '555666777' },
    creatorId: 'PT20002',
    intro: 'FATE规则体系的轻量级短团，注重叙事和角色扮演，适合想尝试新规则的玩家。'
  },
  {
    id: '5c',
    cover: '',
    name: '急招KP：暗夜回响',
    tags: ['语音', 'COC7th', '5人'],
    duration: '15h',
    recruit: '招KP',
    gameDays: [1, 3, 5],
    startTime: '19:00',
    endTime: '21:00',
    publisherName: '骰神附体',
    applicantCount: 1,
    status: 'recruiting',
    draft: false,
    rule: 'COC7th',
    mode: '语音',
    totalCount: 5,
    plCount: 0,
    recruitKP: true,
    contact: { type: 'qqgroup', value: '777888999' },
    creatorId: 'PT20001',
    intro: '四名PL已就位，急招一位有经验的KP来主持这个模组。偏恐怖调查向，需要KP有较好的氛围营造能力。'
  },
  {
    id: '5',
    cover: '',
    name: '深夜图书馆（草稿）',
    tags: ['文字', 'COC7th', '4人'],
    duration: '10h',
    recruit: '1KP 3PL',
    gameDays: [],
    startTime: '',
    endTime: '',
    publisherName: '深渊骰主',
    applicantCount: 0,
    status: 'recruiting',
    draft: true,
    rule: 'COC7th',
    mode: '文字',
    totalCount: 4,
    plCount: 3,
    recruitKP: false,
    contact: { type: '', value: '' },
    creatorId: 'PT10086',
    intro: '草稿中……'
  }
]

// ============================================================
// 申请列表（userId 与 mockUsers 对应，方便切换用户测试）
// PT20001 骰神附体 → module 1 → pending（可测试审核中状态）
// PT20002 月光KP   → module 1 → approved（可测试通过+联系方式）
// ============================================================
export const mockApplicationList = [
  {
    id: '1',
    moduleId: '1',
    userId: 'PT20001',
    nickname: '骰神附体',
    avatar: '',
    applyTime: '03-20 14:30',
    status: 'pending'
  },
  {
    id: '2',
    moduleId: '1',
    userId: 'PT20002',
    nickname: '月光KP',
    avatar: '',
    applyTime: '03-19 22:15',
    status: 'approved'
  },
  {
    id: '3',
    moduleId: '1',
    userId: 'PT20003',
    nickname: '新手调查员',
    avatar: '',
    applyTime: '03-18 10:00',
    status: 'rejected'
  },
  {
    id: '4',
    moduleId: '2',
    userId: 'PT20004',
    nickname: '深渊漫游者',
    avatar: '',
    applyTime: '03-21 09:00',
    status: 'pending'
  }
]

// ============================================================
// 演绎记录 mock 数据
// ============================================================
export const mockLogList = [
  {
    id: '1',
    authorId: 'PT10086',
    title: '第一次KP心得 —— 从菜鸟到入门',
    moduleName: '影迷者的阴影',
    tags: ['COC7th', 'KP', '心得'],
    content: '第一次作为KP独立主持完整场团，从准备NPC到现场即兴，整整准备了两周。团员反应超出预期，记录下这段经历以备将来回顾。\n\n最大的收获是学会了如何引导玩家而不是强迫他们走剧情线。好的KP是导演，不是上帝。',
    createdAt: '2026-03-10'
  },
  {
    id: '2',
    authorId: 'PT10086',
    title: '《不知名的手术》跑团记录',
    moduleName: '不知名的手术',
    tags: ['COC7th', 'PL', '语音团'],
    content: '第三个COC团，单次本。KP节奏把控很好，结尾反转完全没猜到。\n\n这次用了一个擅长医学的调查员，和剧本主题非常契合，角色扮演体验感拉满。',
    createdAt: '2026-02-28'
  },
  {
    id: '3',
    authorId: 'PT10086',
    title: '绿皮火车上的七天七夜',
    moduleName: '绿皮火车',
    tags: ['DND5E', 'PL', '文字团', '长篇'],
    content: '终于跑完了这个史诗级长篇。从第一节车厢到最后的车头，每一节都藏着不同的秘密。\n\nDM设计的线索链非常精妙，我们花了整整三周才把所有伏笔串起来。最后的BOSS战全员濒死，靠牧师的一发暴击翻盘。',
    createdAt: '2026-02-15'
  },
  {
    id: '4',
    authorId: 'PT10086',
    title: '关于线上语音团的几点建议',
    moduleName: '影迷者的阴影',
    tags: ['COC7th', 'KP', '经验分享'],
    content: '带了几次线上语音团之后，总结了一些实用技巧：\n\n1. 提前测试所有人的麦克风和网络\n2. 准备好BGM和音效，氛围感提升巨大\n3. 每30分钟安排一次短休，线上注意力有限\n4. 用共享文档实时同步地图和线索',
    createdAt: '2026-02-01'
  },
  {
    id: '5',
    authorId: 'PT10086',
    title: '我的第一个调查员：永眠于阿卡姆',
    moduleName: '阿卡姆之夜',
    tags: ['COC7th', 'PL', '角色纪念'],
    content: '陈探长，职业侦探，信用评级72。在阿卡姆的旧宅里永远地闭上了眼睛。\n\n他是我建的第一个COC调查员，陪我跑了三个模组。最后为了掩护队友撤退，独自面对那个不可名状之物。骰子没有眷顾他，但他死得像个英雄。',
    createdAt: '2026-01-20'
  },
  {
    id: '6',
    authorId: 'PT10086',
    title: 'DND5E转COC的适应手记',
    moduleName: '克苏鲁的低语',
    tags: ['COC6th', 'PL', '心得'],
    content: '从DND转COC最大的不适应是心态转变。DND里遇到怪可以冲，COC里遇到怪只能跑。\n\n战斗系统完全不同，COC更强调调查和角色扮演。花了两个模组才适应"你的角色很可能会死"这个设定。',
    createdAt: '2026-01-10'
  },
  {
    id: '7',
    authorId: 'PT10086',
    title: '新年第一团：差点全灭的欢乐回忆',
    moduleName: '午夜钟声',
    tags: ['COC7th', 'PL', '语音团', '欢乐'],
    content: '跨年夜的团，四个调查员在一座钟楼里迎接新年。结果零点钟声敲响的时候，三个人同时SAN check失败集体发疯。\n\n唯一清醒的那个人被迫一边躲避疯狂的队友一边解谜。最后居然真的被他一个人通关了，堪称奇迹。',
    createdAt: '2026-01-01'
  },
  {
    id: '8',
    authorId: 'PT10086',
    title: '如何写一篇好的模组简介',
    moduleName: '',
    tags: ['KP', '经验分享', '写作'],
    content: '发招募的时候，简介写得好不好直接决定有没有人报名。总结几个要点：\n\n1. 开头用悬念勾住读者\n2. 说明模组基调（恐怖/推理/战斗）\n3. 标清人数、时长、规则版本\n4. 不要剧透关键转折',
    createdAt: '2025-12-25'
  }
]
