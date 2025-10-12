#!/bin/bash

echo "=========================================="
echo "     IM系统聊天记录导入工具"
echo "=========================================="

# 配置
API_BASE="http://localhost:3001"
UPLOAD_DIR="/www/wwwroot/im-last/uploads"

show_help() {
    echo "用法: $0 [选项] [文件路径]"
    echo ""
    echo "选项:"
    echo "  -t, --token TOKEN    管理员认证token"
    echo "  -f, --format FORMAT  导入格式 (json|csv|wechat)"
    echo "  -u, --upload-files   同时上传文件"
    echo "  -b, --batch-size N   批量大小 (默认100)"
    echo "  -h, --help          显示帮助"
    echo ""
    echo "示例:"
    echo "  $0 -t 'your_token' -f json chat_records.json"
    echo "  $0 -t 'your_token' -f csv -u chat_records.csv"
    echo "  $0 -t 'your_token' -f wechat wechat_export.txt"
    echo ""
}

# 默认参数
TOKEN=""
FORMAT="json"
UPLOAD_FILES=false
BATCH_SIZE=100
INPUT_FILE=""

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--token)
            TOKEN="$2"
            shift 2
            ;;
        -f|--format)
            FORMAT="$2"
            shift 2
            ;;
        -u|--upload-files)
            UPLOAD_FILES=true
            shift
            ;;
        -b|--batch-size)
            BATCH_SIZE="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            INPUT_FILE="$1"
            shift
            ;;
    esac
done

# 检查必要参数
if [[ -z "$TOKEN" ]]; then
    echo "❌ 错误: 请提供管理员token"
    echo "使用 -h 查看帮助"
    exit 1
fi

if [[ -z "$INPUT_FILE" ]]; then
    echo "❌ 错误: 请提供输入文件"
    echo "使用 -h 查看帮助"
    exit 1
fi

if [[ ! -f "$INPUT_FILE" ]]; then
    echo "❌ 错误: 文件不存在: $INPUT_FILE"
    exit 1
fi

echo "📋 导入配置:"
echo "  文件: $INPUT_FILE"
echo "  格式: $FORMAT"
echo "  批量大小: $BATCH_SIZE"
echo "  上传文件: $UPLOAD_FILES"
echo ""

# 创建临时目录
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# 转换函数
convert_to_json() {
    local input_file="$1"
    local output_file="$2"
    
    case $FORMAT in
        "json")
            cp "$input_file" "$output_file"
            ;;
        "csv")
            echo "🔄 转换CSV格式..."
            python3 -c "
import csv
import json
from datetime import datetime

messages = []
with open('$input_file', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        message = {
            'sender': row['sender'],
            'content': row['content'],
            'type': row.get('type', 'text'),
            'timestamp': row.get('timestamp', datetime.now().isoformat())
        }
        if row.get('receiver'):
            message['receiver'] = row['receiver']
        if row.get('group'):
            message['group'] = row['group']
        if row.get('fileUrl'):
            message['fileInfo'] = {
                'fileUrl': row['fileUrl'],
                'originalName': row.get('fileName', ''),
                'fileSize': int(row.get('fileSize', 0))
            }
        messages.append(message)

with open('$output_file', 'w', encoding='utf-8') as f:
    json.dump({'messages': messages}, f, ensure_ascii=False, indent=2)
"
            ;;
        "wechat")
            echo "🔄 转换微信格式..."
            python3 -c "
import re
import json
from datetime import datetime

messages = []
current_sender = None
current_time = None

with open('$input_file', 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
            
        # 匹配时间和发送者: 2025-10-11 10:30:00 张三
        time_match = re.match(r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) (.+)', line)
        if time_match:
            current_time = time_match.group(1)
            current_sender = time_match.group(2)
            continue
            
        # 消息内容
        if current_sender and current_time:
            message_type = 'text'
            content = line
            file_info = None
            
            # 检测特殊消息类型
            if line.startswith('[图片]'):
                message_type = 'image'
                content = '图片'
            elif line.startswith('[文件:'):
                message_type = 'file'
                file_match = re.match(r'\[文件: (.+)\]', line)
                if file_match:
                    content = file_match.group(1)
            
            messages.append({
                'sender': current_sender,
                'content': content,
                'type': message_type,
                'timestamp': current_time + 'Z',
                'fileInfo': file_info
            })

with open('$output_file', 'w', encoding='utf-8') as f:
    json.dump({'messages': messages}, f, ensure_ascii=False, indent=2)
"
            ;;
    esac
}

# 上传文件函数
upload_files() {
    local json_file="$1"
    
    if [[ "$UPLOAD_FILES" != "true" ]]; then
        return 0
    fi
    
    echo "📁 上传相关文件..."
    
    # 创建上传目录
    mkdir -p "$UPLOAD_DIR"
    
    # 从JSON中提取文件路径并上传
    python3 -c "
import json
import os
import shutil

with open('$json_file', 'r', encoding='utf-8') as f:
    data = json.load(f)

for message in data.get('messages', []):
    file_info = message.get('fileInfo', {})
    if file_info and 'originalName' in file_info:
        original_path = file_info.get('originalName')
        if os.path.exists(original_path):
            filename = os.path.basename(original_path)
            dest_path = os.path.join('$UPLOAD_DIR', filename)
            shutil.copy2(original_path, dest_path)
            # 更新JSON中的文件路径
            file_info['fileUrl'] = f'/uploads/{filename}'
            print(f'✅ 上传文件: {filename}')

# 保存更新后的JSON
with open('$json_file', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
"
}

# 批量导入函数
batch_import() {
    local json_file="$1"
    
    echo "📤 开始批量导入..."
    
    python3 -c "
import json
import requests
import sys

def import_batch(messages):
    headers = {
        'Authorization': 'Bearer $TOKEN',
        'Content-Type': 'application/json'
    }
    
    data = {'messages': messages}
    response = requests.post('$API_BASE/api/admin/messages/batch', 
                           headers=headers, json=data)
    
    if response.status_code == 200:
        result = response.json()
        print(f'✅ 成功导入 {result.get(\"count\", 0)} 条消息')
        return True
    else:
        print(f'❌ 导入失败: {response.text}')
        return False

# 读取JSON文件
with open('$json_file', 'r', encoding='utf-8') as f:
    data = json.load(f)

messages = data.get('messages', [])
total = len(messages)
batch_size = $BATCH_SIZE

print(f'📊 总消息数: {total}')
print(f'📦 批量大小: {batch_size}')

success_count = 0
for i in range(0, total, batch_size):
    batch = messages[i:i+batch_size]
    print(f'🔄 导入批次 {i//batch_size + 1}/{(total + batch_size - 1)//batch_size}...')
    
    if import_batch(batch):
        success_count += len(batch)
    else:
        print(f'❌ 批次 {i//batch_size + 1} 导入失败')
        sys.exit(1)

print(f'🎉 导入完成! 成功导入 {success_count}/{total} 条消息')
"
}

# 主流程
echo "🚀 开始导入流程..."

# 1. 转换格式
JSON_FILE="$TEMP_DIR/messages.json"
echo "🔄 转换文件格式..."
convert_to_json "$INPUT_FILE" "$JSON_FILE"

if [[ ! -f "$JSON_FILE" ]]; then
    echo "❌ 格式转换失败"
    exit 1
fi

echo "✅ 格式转换完成"

# 2. 上传文件
upload_files "$JSON_FILE"

# 3. 批量导入
batch_import "$JSON_FILE"

echo ""
echo "=========================================="
echo "              导入完成"
echo "=========================================="
