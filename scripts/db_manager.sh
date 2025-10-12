#!/bin/bash

echo "=========================================="
echo "     IM系统 - 数据库管理工具"
echo "=========================================="

show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  init     - 初始化数据库并创建示例数据"
    echo "  reset    - 重置数据库（清除所有数据）"
    echo "  status   - 查看数据库状态"
    echo "  backup   - 备份数据库"
    echo "  users    - 显示所有用户"
    echo "  help     - 显示此帮助信息"
    echo ""
}

init_database() {
    echo "正在初始化数据库..."
    docker exec im-mongodb mongosh im-system --eval "
    // 创建示例用户
    db.users.insertMany([
        {
            username: 'admin',
            password: '\$2b\$10\$Zp4b9jS8A9T0zq2PwRAtYutA0mPoXxYHqt74lBJ3G5G7DAuP1QWZa',
            email: 'admin@example.com',
            avatar: 'https://ui-avatars.com/api/?background=FF6B6B&color=fff&name=Admin',
            online: false,
            friends: [],
            createdAt: new Date()
        },
        {
            username: 'user1',
            password: '\$2b\$10\$Zp4b9jS8A9T0zq2PwRAtYutA0mPoXxYHqt74lBJ3G5G7DAuP1QWZa',
            email: 'user1@example.com',
            avatar: 'https://ui-avatars.com/api/?background=4ECDC4&color=fff&name=User1',
            online: false,
            friends: [],
            createdAt: new Date()
        }
    ]);
    
    // 创建索引
    db.users.createIndex({ username: 1 }, { unique: true });
    db.users.createIndex({ email: 1 }, { unique: true });
    db.messages.createIndex({ sender: 1, receiver: 1 });
    db.messages.createIndex({ timestamp: -1 });
    
    print('✅ 数据库初始化完成');
    print('用户数量: ' + db.users.countDocuments());
    "
}

reset_database() {
    echo "⚠️  警告：这将删除所有数据！"
    read -p "确认重置数据库？(y/N): " confirm
    if [[ $confirm == [yY] ]]; then
        echo "正在重置数据库..."
        docker exec im-mongodb mongosh im-system --eval "
        db.users.deleteMany({});
        db.messages.deleteMany({});
        db.groups.deleteMany({});
        print('✅ 数据库已重置');
        "
    else
        echo "操作已取消"
    fi
}

show_status() {
    echo "数据库状态:"
    docker exec im-mongodb mongosh im-system --quiet --eval "
    print('数据库名称: im-system');
    print('MongoDB版本: ' + db.version());
    print('用户数量: ' + db.users.countDocuments());
    print('消息数量: ' + db.messages.countDocuments());
    print('群组数量: ' + db.groups.countDocuments());
    print('数据库大小: ' + JSON.stringify(db.stats().dataSize) + ' bytes');
    "
}

backup_database() {
    backup_dir="/www/wwwroot/im-last/backups"
    mkdir -p "$backup_dir"
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_file="$backup_dir/im_backup_$timestamp"
    
    echo "正在备份数据库到 $backup_file..."
    docker exec im-mongodb mongodump --db im-system --out /tmp/backup
    docker cp im-mongodb:/tmp/backup "$backup_file"
    echo "✅ 备份完成: $backup_file"
}

show_users() {
    echo "系统用户列表:"
    docker exec im-mongodb mongosh im-system --quiet --eval "
    db.users.find({}, {password: 0}).forEach(function(user) {
        print('用户ID: ' + user._id);
        print('用户名: ' + user.username);
        print('邮箱: ' + user.email);
        print('在线状态: ' + (user.online ? '在线' : '离线'));
        print('创建时间: ' + user.createdAt);
        print('---');
    });
    "
}

case "$1" in
    init)
        init_database
        ;;
    reset)
        reset_database
        ;;
    status)
        show_status
        ;;
    backup)
        backup_database
        ;;
    users)
        show_users
        ;;
    help|*)
        show_help
        ;;
esac
