-- 大屏打卡统计所需字段（已有库执行一次）
-- 时区统计统一按 Asia/Shanghai

ALTER TABLE pet_devices
  ADD COLUMN IF NOT EXISTS community_id VARCHAR(32);

CREATE INDEX IF NOT EXISTS idx_pet_devices_community
  ON pet_devices(community_id);

ALTER TABLE checkin_records
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'success';

CREATE INDEX IF NOT EXISTS idx_checkin_date_status
  ON checkin_records(checkin_date, status);

-- 示例：把设备挂到小区（按实际 device id / OneNET 名改）
-- UPDATE pet_devices SET community_id = 'lanwan' WHERE id IN ('dev-lanwan-1', 'dev-lanwan-2');
-- UPDATE pet_devices SET community_id = 'huarun' WHERE id IN ('dev-huarun-1');
