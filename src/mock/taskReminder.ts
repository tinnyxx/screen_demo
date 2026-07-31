export type TaskStatus = 'pending' | 'done'

export interface TaskReminderItem {
  id: string
  status: TaskStatus
  deviceNo: number
  event: string
  datetime: string
}

export interface TaskReminderData {
  items: TaskReminderItem[]
}

export const taskStatusMeta: Record<
  TaskStatus,
  { label: string; color: string; background: string }
> = {
  pending: { label: '待处理', color: '#FFB4AB', background: 'rgba(255, 180, 171, 0.18)' },
  done: { label: '已处理', color: '#DBFCFF', background: 'rgba(219, 252, 255, 0.18)' },
}

export const taskReminderMock: TaskReminderData = {
  items: [
    {
      id: '1',
      status: 'pending',
      deviceNo: 1,
      event: '粪便盒待清理',
      datetime: '06/24 08:12',
    },
    {
      id: '2',
      status: 'pending',
      deviceNo: 3,
      event: '滤芯即将到期需更换',
      datetime: '06/24 09:45',
    },
    {
      id: '3',
      status: 'done',
      deviceNo: 2,
      event: '已接入运行',
      datetime: '06/24 10:20',
    },
    {
      id: '4',
      status: 'pending',
      deviceNo: 5,
      event: '水箱液位异常',
      datetime: '06/24 11:06',
    },
    {
      id: '5',
      status: 'pending',
      deviceNo: 4,
      event: '粪便盒待清理',
      datetime: '06/24 13:18',
    },
    {
      id: '6',
      status: 'done',
      deviceNo: 6,
      event: '已接入运行',
      datetime: '06/24 14:02',
    },
    {
      id: '7',
      status: 'pending',
      deviceNo: 3,
      event: '滤芯即将到期需更换',
      datetime: '06/24 15:30',
    },
  ],
}

const taskStatusOrder: Record<TaskStatus, number> = {
  pending: 0,
  done: 1,
}

export function parseTaskDatetime(datetime: string, year = new Date().getFullYear()) {
  const [datePart, timePart] = datetime.split(' ')
  const [month, day] = datePart.split('/').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  return new Date(year, month - 1, day, hour, minute).getTime()
}

export function sortTaskReminderItems(items: TaskReminderItem[]) {
  return [...items].sort((a, b) => {
    const statusDiff = taskStatusOrder[a.status] - taskStatusOrder[b.status]
    if (statusDiff !== 0) return statusDiff
    return parseTaskDatetime(b.datetime) - parseTaskDatetime(a.datetime)
  })
}
