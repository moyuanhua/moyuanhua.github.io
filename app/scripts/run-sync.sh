#!/bin/bash

# 设置正确的环境变量（覆盖系统中可能错误的值）
export FEISHU_WIKI_ID=7560180515966484484
export FEISHU_DOCS_NODE_ID=L0qTw3NQFimJGIkWfGNckkEQnwJ
export FEISHU_ABOUT_DOC_ID=DKvmwNWVOiYA6KklWcsc1gHInKg

# 清除可能冲突的旧环境变量
unset FEISHU_ZH_NODE_ID
unset FEISHU_EN_NODE_ID

# 运行同步脚本
node "$(dirname "$0")/sync-feishu-v2.js"
