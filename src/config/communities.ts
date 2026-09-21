import lanwanBackground from '@/assets/lanwan_background.png'
import huarunBackground from '@/assets/huarun_background.png'

export const COMMUNITY_IDS = ['lanwan', 'huarun', 'shengnawei'] as const
export type CommunityId = (typeof COMMUNITY_IDS)[number]

export interface CommunityConfig {
  id: CommunityId
  name: string
  projectName: string
  background: string
  /** 相对 object-fit: contain 的额外缩放 */
  backgroundScale: number
  adminUsername: string
  /** 隐藏后不出现在小区选择 / 核销下拉，账号和历史数据仍可用 */
  hidden?: boolean
}

export const SUPER_ADMIN_USERNAME = 'root'
export const CHECKOUT_USERNAME = 'checkout01'

const DEFAULT_BACKGROUND_SCALE = 1.2

export const communities: CommunityConfig[] = [
  {
    id: 'lanwan',
    name: '广兴源 · 蓝湾',
    projectName: '广兴源 · 蓝湾',
    background: lanwanBackground,
    backgroundScale: DEFAULT_BACKGROUND_SCALE,
    adminUsername: 'admin_lanwan',
  },
  {
    id: 'huarun',
    name: '华润小区',
    projectName: '华润小区',
    background: huarunBackground,
    backgroundScale: DEFAULT_BACKGROUND_SCALE / 1.3,
    adminUsername: 'admin_huarun',
    hidden: true,
  },
  {
    id: 'shengnawei',
    name: '圣拿威 · 湾美花园',
    projectName: '圣拿威 · 湾美花园',
    background: huarunBackground,
    backgroundScale: DEFAULT_BACKGROUND_SCALE / 1.3,
    adminUsername: 'admin_shengnawei',
  },
]

export const visibleCommunities = communities.filter((community) => !community.hidden)

const communityById = Object.fromEntries(
  communities.map((community) => [community.id, community]),
) as Record<CommunityId, CommunityConfig>

const communityByAdminUsername = Object.fromEntries(
  communities.map((community) => [community.adminUsername, community.id]),
) as Record<string, CommunityId>

export function isCommunityId(value: string | null | undefined): value is CommunityId {
  return COMMUNITY_IDS.includes(value as CommunityId)
}

export function getCommunityConfig(id: CommunityId): CommunityConfig {
  return communityById[id]
}

export function getBoundCommunityId(username: string): CommunityId | null {
  return communityByAdminUsername[username] ?? null
}

export function isSuperAdmin(username: string) {
  return username === SUPER_ADMIN_USERNAME
}
