-- 华润 · 润府重新开放。01 号桩：设备编号 STATION_006，OneNET 编号 SZCR101。
-- 在生产库执行一次。不改蓝湾、圣拿威已有设备。

UPDATE communities
SET name = '华润 · 润府'
WHERE code = 'huarun';

UPDATE admin_tb
SET nickname = '华润管理员'
WHERE username = 'admin_huarun';

INSERT INTO pet_devices (
  id, name, latitude, longitude, radius_m, is_active, onenet_device_name, community_id
)
SELECT
  'STATION_006',
  '01号',
  c.latitude,
  c.longitude,
  COALESCE(c.radius_m, 300),
  TRUE,
  'SZCR101',
  c.id
FROM communities c
WHERE c.code = 'huarun'
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  onenet_device_name = EXCLUDED.onenet_device_name,
  community_id = EXCLUDED.community_id,
  is_active = TRUE;

UPDATE pet_devices
SET is_active = FALSE
WHERE id IN ('STATION_101', 'STATION_102');

SELECT d.id, d.name, d.onenet_device_name, d.is_active, c.code, c.name
FROM pet_devices d
LEFT JOIN communities c ON c.id = d.community_id
ORDER BY c.code NULLS LAST, d.id;
