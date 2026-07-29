-- 对齐真实库：communities.id 整数 FK + 蓝湾设备补挂小区
-- communities: 1=huarun, 2=lanwan

CREATE INDEX IF NOT EXISTS idx_pet_devices_community
  ON pet_devices(community_id);

CREATE INDEX IF NOT EXISTS idx_checkin_date_status
  ON checkin_records(checkin_date, status);

-- 蓝湾设备补 community_id（华润 101/102 已是 1）
UPDATE pet_devices
SET community_id = 2
WHERE id IN ('STATION_001', 'STATION_002')
  AND community_id IS NULL;
