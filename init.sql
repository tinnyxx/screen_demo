-- ============================================
-- petdemo 数据库初始化脚本
-- 创建数据库及所有表结构
-- ============================================

-- 创建数据库（手动执行，postgres 客户端不支持 CREATE DATABASE 在事务中）
-- CREATE DATABASE petdemo;

-- ============================================
-- 1. 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    openid          VARCHAR(128) UNIQUE NOT NULL,       -- 微信 openid
    nickname        VARCHAR(100),                        -- 微信昵称
    avatar_url      VARCHAR(512),                        -- 微信头像URL
    phone           VARCHAR(20),                         -- 手机号
    points          INTEGER NOT NULL DEFAULT 0,          -- 当前积分余额
    lawn_area       NUMERIC(10,2) NOT NULL DEFAULT 0,    -- 累计保护草坪面积(m²)
    total_checkins  INTEGER NOT NULL DEFAULT 0,          -- 总打卡次数
    combo_checkin_3day INTEGER NOT NULL DEFAULT 0,       -- 调试：连续打卡天数覆盖(0=走真实记录,1-3=测试)
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. 用户宠物表
-- ============================================
CREATE TABLE IF NOT EXISTS user_pets (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pet_name        VARCHAR(100) NOT NULL,               -- 宠物名称
    breed_name      VARCHAR(100),                        -- 品种
    breed_id        INTEGER,                             -- 犬种列表 id（精确还原毛色）
    breed_color     VARCHAR(100),                        -- 毛色
    birthday        DATE,                                -- 生日
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. 打卡桩设备表
-- ============================================
CREATE TABLE IF NOT EXISTS pet_devices (
    id                  VARCHAR(64) PRIMARY KEY,
    name                VARCHAR(128),
    latitude            NUMERIC(12,8) NOT NULL,
    longitude           NUMERIC(12,8) NOT NULL,
    radius_m            INTEGER NOT NULL DEFAULT 300,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    onenet_device_name  VARCHAR(64),                   -- OneNET 设备名，扫码/NFC 体温校验用
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

GRANT SELECT, INSERT, UPDATE, DELETE ON pet_devices TO myapp;

-- ============================================
-- 4. 打卡记录表
-- ============================================
CREATE TABLE IF NOT EXISTS checkin_records (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id       VARCHAR(128),                        -- 设备ID
    latitude        NUMERIC(12,8),                       -- 纬度
    longitude       NUMERIC(12,8),                       -- 经度
    points_awarded  INTEGER NOT NULL DEFAULT 0,          -- 本次获得积分 (2~5随机)
    area_awarded    NUMERIC(6,2) NOT NULL DEFAULT 1.16,  -- 本次获得草坪面积
    checkin_count   INTEGER NOT NULL DEFAULT 1,          -- 当天第几次打卡
    checkin_date    DATE NOT NULL,                       -- 打卡日期 YYYY-MM-DD
    checkin_time    TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 打卡时间戳
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 按用户+日期查当日打卡次数，最频繁的查询
CREATE INDEX IF NOT EXISTS idx_checkin_user_date ON checkin_records(user_id, checkin_date);

-- ============================================
-- 5. 积分流水表
-- ============================================
CREATE TABLE IF NOT EXISTS point_transactions (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(20) NOT NULL,                -- checkin | redeem | adjust
    amount          INTEGER NOT NULL,                    -- 正数=获得, 负数=消耗
    balance_after   INTEGER NOT NULL,                    -- 变动后余额
    ref_id          INTEGER,                             -- 关联记录ID
    description     VARCHAR(256),                        -- 说明
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_point_txn_user ON point_transactions(user_id);

-- ============================================
-- 6. 奖品兑换记录表
-- ============================================
CREATE TABLE IF NOT EXISTS redeem_records (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id      VARCHAR(64) NOT NULL,                -- 商品ID
    product_name    VARCHAR(128) NOT NULL,               -- 商品名称
    cost            INTEGER NOT NULL,                    -- 消耗积分
    img             VARCHAR(512),                        -- 商品图片URL
    redeem_code     CHAR(18) NOT NULL,                   -- 18位兑换码
    valid_from      DATE NOT NULL,                       -- 有效期开始
    valid_to        DATE NOT NULL,                       -- 有效期结束
    valid_range     VARCHAR(256),                        -- 使用范围说明
    redeemed_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_redeem_user ON redeem_records(user_id);

-- ============================================
-- 7. 奖品兑换码表
-- ============================================
CREATE TABLE redeem_codes (
    id               SERIAL PRIMARY KEY,
    code             CHAR(18) UNIQUE NOT NULL,          -- 唯一兑换码
    product_id       VARCHAR(64),              -- 如 '1'（积分商城）或 'combo_checkin_3day'
    status           VARCHAR(20) NOT NULL DEFAULT 'available',
                     -- available | assigned | used | void
    batch_id         VARCHAR(64),                       -- 导入批次，便于追溯
    assigned_user_id INTEGER REFERENCES users(id),
    assigned_at      TIMESTAMP,
    redeem_record_id INTEGER REFERENCES redeem_records(id),
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_redeem_codes_pool
    ON redeem_codes (product_id, status)
    WHERE status = 'available';

GRANT SELECT, INSERT, UPDATE, DELETE ON redeem_codes TO myapp;



-- ============================================
-- 8. 管理员账号表
-- ============================================
CREATE TABLE admin_tb (
    id         SERIAL PRIMARY KEY,
    username   VARCHAR(50)  NOT NULL UNIQUE,
    nickname   VARCHAR(100) NOT NULL,
    password   VARCHAR(255) NOT NULL
);

INSERT INTO admin_tb (username, nickname, password)
VALUES ('admin', '物业管理员01', '123456')
ON CONFLICT (username) DO NOTHING;

INSERT INTO admin_tb (username, nickname, password)
VALUES ('root', '超级管理员', '123456')
ON CONFLICT (username) DO NOTHING;

INSERT INTO admin_tb (username, nickname, password)
VALUES ('checkout01', '核销员01', '123456')
ON CONFLICT (username) DO NOTHING;