import React, { useState } from "react";
import "./ContactsPage.css";

const ContactsPage = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [query, setQuery] = useState("");

  return (
    <div className="contacts-page">
      <header className="header">
        <div className="title">Christie’s</div>
        <button className="add-btn" onClick={() => setShowAddModal(true)}>＋</button>
      </header>

      <div className="empty">
        <div className="msg">暂无对话</div>
        <div className="hint">点击右上角添加联系人或创建群组</div>
      </div>

      {showAddModal && (
        <div className="modal-mask" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>添加联系人</h3>
            <input
              type="text"
              placeholder="搜索联系人"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="modal-actions">
              <button className="close" onClick={() => setShowAddModal(false)}>
                关闭
              </button>
              <button className="confirm">确认添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsPage;
