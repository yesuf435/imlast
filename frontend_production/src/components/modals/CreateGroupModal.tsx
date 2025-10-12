import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import Modal from './Modal';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose }) => {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!groupName.trim()) {
      toast.error('请输入群组名称');
      return;
    }

    try {
      setIsCreating(true);
      await api.createGroup(groupName, groupDescription);
      toast.success('群组创建成功');
      setGroupName('');
      setGroupDescription('');
      onClose();
    } catch (error: any) {
      toast.error('创建失败: ' + (error.message || '未知错误'));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="创建群组">
      <div className="space-y-4">
        <div>
          <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-1">
            群组名称 *
          </label>
          <input
            id="groupName"
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="请输入群组名称"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="groupDescription" className="block text-sm font-medium text-gray-700 mb-1">
            群组描述
          </label>
          <textarea
            id="groupDescription"
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            placeholder="请输入群组描述（可选）"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isCreating ? '创建中...' : '创建群组'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateGroupModal;
