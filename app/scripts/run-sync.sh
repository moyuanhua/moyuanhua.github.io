#!/bin/bash

# 运行同步脚本 V3 - 真正的增量更新版
# 所有配置都从 .env 文件中读取
node "$(dirname "$0")/sync-feishu-v3.js"
