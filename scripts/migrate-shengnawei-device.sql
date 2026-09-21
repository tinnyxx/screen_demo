-- 隐藏华润不在这张 SQL 里做（由前端 hidden 控制）。
-- 本脚本：恢复华润原名、新建圣拿威小区、管理员；01 号桩用库里的 STATION_004。
-- 在生产库执行一次。不要改蓝湾 STATION_001 / STATION_002，也不要改华润现有设备。

-- 1. 若之前误把华润改名为圣拿威，这里改回来
UPDATE communities
SET name = '华润小区'
WHERE code = 'huarun';

UPDATE admin_tb
SET nickname = '华润管理员'
WHERE username = 'admin_huarun';

-- 2. 新建圣拿威小区（坐标先与华润相同，可按现场再改）
INSERT INTO communities (code, name, latitude, longitude, radius_m)
SELECT 'shengnawei', '圣拿威 · 湾美花园', c.latitude, c.longitude, c.radius_m
FROM communities c
WHERE c.code = 'huarun'
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    radius_m = EXCLUDED.radius_m;

-- 3. 圣拿威管理员（默认密码 123456，上线后请修改）
INSERT INTO admin_tb (username, nickname, password)
VALUES ('admin_shengnawei', '圣拿威管理员', '123456')
ON CONFLICT (username) DO UPDATE
SET nickname = EXCLUDED.nickname;

-- 4. 圣拿威 01 号桩用现有 STATION_004（SZGXY202），删掉误插入的 STATION_SNW_001
DELETE FROM pet_devices
WHERE id = 'STATION_SNW_001';

-- 5. 显示名
UPDATE communities SET name = '广兴源 · 蓝湾' WHERE code = 'lanwan';
UPDATE communities SET name = '圣拿威 · 湾美花园' WHERE code = 'shengnawei';

-- 6. 核对
SELECT id, code, name, latitude, longitude
FROM communities
ORDER BY id;

SELECT username, nickname
FROM admin_tb
WHERE username IN ('admin_huarun', 'admin_shengnawei', 'admin_lanwan')
ORDER BY username;

SELECT d.id, d.name, d.onenet_device_name, d.is_active, c.code AS community_code
FROM pet_devices d
JOIN communities c ON c.id = d.community_id
WHERE c.code IN ('huarun', 'shengnawei', 'lanwan')
ORDER BY c.code, d.id;
