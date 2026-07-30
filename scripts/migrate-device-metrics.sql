-- 设备指标扩展：waterout 快照 + 设备报警（请手动执行一次）

-- 1. waterout 累计值快照
--    OneNET 的 waterout 是设备累计出水量，「今日节水」「上月节水」都靠区间差值计算。
--    服务端读取到 waterout 后自动写入（每设备 ≥10 分钟一条），无需手动维护。
CREATE TABLE IF NOT EXISTS device_waterout_readings (
    id          SERIAL PRIMARY KEY,
    device_id   VARCHAR(64) NOT NULL,             -- 对应 pet_devices.id，如 STATION_001
    waterout    NUMERIC(14,2) NOT NULL,           -- 设备累计出水量（L）
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_waterout_device_time
    ON device_waterout_readings(device_id, recorded_at);

GRANT SELECT, INSERT ON device_waterout_readings TO myapp;
GRANT USAGE ON SEQUENCE device_waterout_readings_id_seq TO myapp;

-- 2. 滤芯更换时间
--    滤芯寿命只统计此时间之后的成功打卡；手动更换滤芯时更新此字段即可重置为 100%。
ALTER TABLE pet_devices
    ADD COLUMN IF NOT EXISTS filter_replaced_at TIMESTAMP;

-- 3. 设备报警
--    状态仅有：待处理（resolved_at IS NULL）、已处理（resolved_at IS NOT NULL）。
--    detection 来源会在指标恢复正常后自动处理；onenet_warn 来源一直保持待处理。
CREATE TABLE IF NOT EXISTS device_alerts (
    id          SERIAL PRIMARY KEY,
    device_id   VARCHAR(64) NOT NULL,             -- 对应 pet_devices.id
    alert_type  VARCHAR(32) NOT NULL,             -- filter_life | feces_box | onenet_warn
    source      VARCHAR(32) NOT NULL DEFAULT 'detection', -- detection | onenet_warn
    source_event_key VARCHAR(64),                  -- OneNET 事件去重键
    message     VARCHAR(256) NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai'),
    resolved_at TIMESTAMP
);

-- 兼容已经建过 device_alerts 的数据库
ALTER TABLE device_alerts
    ADD COLUMN IF NOT EXISTS source VARCHAR(32) NOT NULL DEFAULT 'detection';
ALTER TABLE device_alerts
    ADD COLUMN IF NOT EXISTS source_event_key VARCHAR(64);

-- 同一设备同一检测类型只允许一条未解决报警；OneNET warn 可保留多条
DROP INDEX IF EXISTS idx_device_alerts_active;
CREATE UNIQUE INDEX IF NOT EXISTS idx_device_alerts_active
    ON device_alerts(device_id, alert_type)
    WHERE resolved_at IS NULL AND source = 'detection';

-- 同一条 OneNET warn 事件只入库一次
CREATE UNIQUE INDEX IF NOT EXISTS idx_device_alerts_source_event
    ON device_alerts(source_event_key)
    WHERE source_event_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_device_alerts_device_time
    ON device_alerts(device_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON device_alerts TO myapp;
GRANT USAGE ON SEQUENCE device_alerts_id_seq TO myapp;

-- 更换某号桩滤芯后，执行以下语句即可将其寿命重置为 100%：
-- UPDATE pet_devices
-- SET filter_replaced_at = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai'
-- WHERE id = 'STATION_001';
