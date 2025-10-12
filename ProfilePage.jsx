import React from "react";
import { useNavigate } from "react-router-dom";
import "./ProfilePage.css";

const ProfilePage = () => {
  const navigate = useNavigate();

  const menu = [
    "我的收藏",
    "交易记录",
    "服务/偏好",
    "隐私设置",
    "通知设置",
    "关于佳士得",
    "联系客服",
  ];

  return (
    <div className="profile-page">
      <header className="header">
        <button className="back-btn" onClick={() => navigate("/messages")}>←</button>
        <div className="title">Christie’s</div>
      </header>

      <div className="user-card">
        <div className="avatar">US</div>
        <div className="info">
          <div className="username">111111</div>
          <div className="tags">艺术爱好者 · 活跃用户</div>
        </div>
      </div>

      <div className="menu">
        {menu.map((title, i) => (
          <div className="menu-item" key={i}>
            <span>{title}</span>
          </div>
        ))}
      </div>

      <button className="logout" onClick={() => navigate("/login")}>
        退出登录
      </button>
    </div>
  );
};

export default ProfilePage;
