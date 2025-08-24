import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import Loading from '../../components/common/Loading';
import ConfirmationModal from '../../components/common/ConfirmationModal';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { token } = useAuth();

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setModalIsOpen(true);
  };

  const closeDeleteModal = () => {
    setSelectedUser(null);
    setModalIsOpen(false);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.role}/${selectedUser._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('User deleted successfully');
        setUsers(users.filter(u => u._id !== selectedUser._id));
      } else {
        toast.error(data.message || 'Failed to delete user.');
      }
    } catch (error) {
      toast.error('An error occurred while deleting the user.');
    } finally {
      closeDeleteModal();
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Users</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Name</th>
              <th className="py-2 px-4 border-b">Email</th>
              <th className="py-2 px-4 border-b">Role</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td className="py-2 px-4 border-b">{user.name}</td>
                <td className="py-2 px-4 border-b">{user.email}</td>
                <td className="py-2 px-4 border-b capitalize">{user.role}</td>
                <td className="py-2 px-4 border-b">
                  <button 
                    onClick={() => openDeleteModal(user)} 
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedUser && (
        <ConfirmationModal
          isOpen={modalIsOpen}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteUser}
          title="Confirm Deletion"
          message={`Are you sure you want to delete ${selectedUser.name}? This action cannot be undone.`}
        />
      )}
    </div>
  );
};

export default ManageUsers;
