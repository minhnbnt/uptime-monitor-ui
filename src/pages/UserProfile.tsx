import { useState } from 'react';
import { useAuth } from '../lib/auth';
import LoadingSpinner from '../components/LoadingSpinner';

export default function UserProfile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? '');
  const [editUsername, setEditUsername] = useState(user?.username ?? '');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleSaveProfile = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      // TODO: Implement update profile API call
      // await apiUpdateProfile({ name: editName, username: editUsername });
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement change password API call
      // await apiChangePassword({ current_password: currentPassword, new_password: newPassword });
      setSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePassword(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setError('');
    setLoading(true);
    try {
      // TODO: Implement delete account API call
      // await apiDeleteAccount();
      // Redirect to login after deletion
      window.location.href = '/login';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      setShowDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Account Settings</h1>
        <p className="mt-1 text-sm text-slate-400">Manage your profile and account preferences</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
          {success}
        </div>
      )}

      {/* Profile Section */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Profile Information</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors duration-200 hover:bg-slate-800 hover:text-slate-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Profile Avatar */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-xl font-medium text-success">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-slate-500">Profile Avatar</p>
              <p className="text-sm text-slate-400">{user.name.charAt(0).toUpperCase()}</p>
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-slate-400">Full Name</label>
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-slate-900 px-3 py-2 text-text-primary placeholder-slate-600 transition-colors duration-200 hover:border-slate-700 focus:border-success focus:outline-none"
              />
            ) : (
              <p className="mt-1 text-text-primary">{user.name}</p>
            )}
          </div>

          {/* Email Field (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-slate-400">Email</label>
            <p className="mt-1 text-text-primary">{user.email}</p>
            <p className="mt-1 text-xs text-slate-500">Email cannot be changed</p>
          </div>

          {/* Username Field */}
          <div>
            <label className="block text-sm font-medium text-slate-400">Username</label>
            {isEditing ? (
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-slate-900 px-3 py-2 text-text-primary placeholder-slate-600 transition-colors duration-200 hover:border-slate-700 focus:border-success focus:outline-none"
              />
            ) : (
              <p className="mt-1 text-text-primary">@{user.username}</p>
            )}
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 border-t border-border pt-4">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditName(user.name);
                  setEditUsername(user.username);
                }}
                className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium text-slate-400 transition-colors duration-200 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <LoadingSpinner size="sm" /> : null}
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Password Section */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Password & Security</h2>
          {!showChangePassword && (
            <button
              onClick={() => setShowChangePassword(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors duration-200 hover:bg-slate-800 hover:text-slate-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Change Password
            </button>
          )}
        </div>

        {!showChangePassword ? (
          <p className="text-sm text-slate-400">
            Keep your account safe by using a strong password
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-slate-900 px-3 py-2 text-text-primary placeholder-slate-600 transition-colors duration-200 hover:border-slate-700 focus:border-success focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-slate-900 px-3 py-2 text-text-primary placeholder-slate-600 transition-colors duration-200 hover:border-slate-700 focus:border-success focus:outline-none"
              />
              <p className="mt-1 text-xs text-slate-500">At least 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-slate-900 px-3 py-2 text-text-primary placeholder-slate-600 transition-colors duration-200 hover:border-slate-700 focus:border-success focus:outline-none"
              />
            </div>

            <div className="flex gap-3 border-t border-border pt-4">
              <button
                onClick={() => {
                  setShowChangePassword(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium text-slate-400 transition-colors duration-200 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={loading}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <LoadingSpinner size="sm" /> : null}
                Change Password
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-danger/30 bg-danger/5 p-6">
        <h2 className="mb-4 text-lg font-semibold text-danger">Danger Zone</h2>
        <p className="mb-4 text-sm text-slate-400">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="rounded-lg border border-danger/50 px-4 py-2.5 text-sm font-medium text-danger transition-colors duration-200 hover:bg-danger/10"
        >
          Delete Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg border border-border bg-surface p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-text-primary">Delete Account?</h3>
            <p className="mt-2 text-sm text-slate-400">
              This action cannot be undone. All your servers and data will be permanently deleted.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition-colors duration-200 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <LoadingSpinner size="sm" /> : null}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
