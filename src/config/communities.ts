import lanwanBackground from '@/assets/lanwan_background.png'
import huarunBackground from '@/assets/huarun_background.png'

export type CommunityId = 'lanwan' | 'huarun'

export interface CommunityConfig {
  id: CommunityId
  name: string
  projectName: string
  background: string
  /** 相对 object-fit: contain 的额外缩放 */
  backgroundScale: number
  adminUsername: string
}

export const SUPER_ADMIN_USERNAME = 'root'
export const CHECKOUT_USERNAME = 'checkout01'

const DEFAULT_BACKGROUND_SCALE = 1.2

export const communities: CommunityConfig[] = [
  {
    id: 'lanwan',
    name: '蓝湾小区',
    projectName: '蓝湾商务大厦',
    background: lanwanBackground,
    backgroundScale: DEFAULT_BACKGROUND_SCALE,
    adminUsername: 'admin_lanwan',
  },
  {
    id: 'huarun',
    name: '华润小区',
    projectName: '华润小区',
    background: huarunBackground,
    // 相对默认缩放再缩小 1.3 倍
    backgroundScale: DEFAULT_BACKGROUND_SCALE / 1.3,
    adminUsername: 'admin_huarun',
  },
]

const communityById = Object.fromEntries(
  communities.map((community) => [community.id, community]),
) as Record<CommunityId, CommunityConfig>

const communityByAdminUsername = Object.fromEntries(
  communities.map((community) => [community.adminUsername, community.id]),
) as Record<string, CommunityId>

export function getCommunityConfig(id: CommunityId): CommunityConfig {
  return communityById[id]
}

export function getBoundCommunityId(username: string): CommunityId | null {
  return communityByAdminUsername[username] ?? null
}

export function isSuperAdmin(username: string) {
  return username === SUPER_ADMIN_USERNAME
}
