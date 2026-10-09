import React, { useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FiCamera, FiTrash2, FiEdit3 } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { updateUser } from '../../store/authSlice';
import ProfileUploadModal from '../../components/ProfileUploadModal/ProfileUploadModal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import './Profile.scss';

const Profile = () => {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const [selectedImage, setSelectedImage] = useState(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || !user?.role;
  const roleNameString = isSuperAdmin ? 'Super Admin (Full Access)' : (user?.role || 'Store Admin');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result);
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = null;
  };

  const handleUploadCroppedImage = async (base64Image) => {
    try {
      const response = await axios.put(`http://localhost:61026/api/users/${user.id}`, 
        { profile_pic: base64Image },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      dispatch(updateUser({ profile_pic: response.data.data.profile_pic }));
      toast.success("Profile picture updated!");
      setIsCropModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile picture");
    }
  };

  const executeRemoveProfilePic = async () => {
    setIsDeleting(true);
    try {
      await axios.put(`http://localhost:61026/api/users/${user.id}`, 
        { profile_pic: null },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      dispatch(updateUser({ profile_pic: null }));
      toast.success("Profile picture removed");
    } catch(err) {
      console.error(err);
      toast.error("Failed to remove profile picture");
    } finally {
      setIsDeleting(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  return (
    <div className="profile-page-modern">
      
      {/* Top Bar matching Minimalist Header */}
      <div className="profile-top-bar">
        <div className="title-section">
          <h1 className="main-title">Account Settings</h1>
          <p className="subtitle">Manage your personal profile, credentials, and business details</p>
        </div>
      </div>

      <div className="profile-content-grid">
        
        {/* Profile Banner */}
        <div className="profile-banner-card">
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileChange} 
          />
          
          <div className="avatar-wrap" onClick={() => setIsAvatarMenuOpen(true)} title="Profile Picture Options">
            {user?.profile_pic ? (
              <img src={user.profile_pic} alt="DP" />
            ) : (
              <div className="avatar-placeholder">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
              </div>
            )}
            <div className="avatar-overlay">
              <FiCamera />
              <span>Update</span>
            </div>
          </div>
          
          <div className="banner-details">
            <h2>{user?.name || 'Administrator'}</h2>
            <div className="role-badge">{roleNameString}</div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="profile-details-grid">
          
          {/* Personal Info Card */}
          <div className="details-card">
            <div className="card-heading">
              <h3>Personal Information</h3>
              <button className="edit-btn"><FiEdit3 /> Edit Details</button>
            </div>
            <div className="data-grid">
              <div className="data-item">
                <label>Full Name</label>
                <span>{user?.name || 'Not Provided'}</span>
              </div>
              <div className="data-item">
                <label>Account Status</label>
                <span className="status-pill">ACTIVE</span>
              </div>
              <div className="data-item">
                <label>Mobile Number</label>
                <span>{user?.mobile || 'Not Provided'}</span>
              </div>
              <div className="data-item">
                <label>Email Address</label>
                <span>{user?.email || 'Not Provided'}</span>
              </div>
            </div>
          </div>

          {/* Business Info Card */}
          <div className="details-card">
            <div className="card-heading">
              <h3>Business & Location</h3>
              {!isSuperAdmin && <button className="edit-btn"><FiEdit3 /> Edit Details</button>}
            </div>
            <div className="data-grid">
              <div className="data-item">
                <label>Business / Store Name</label>
                <span>{user?.store?.name || (isSuperAdmin ? 'Rentopus HQ' : 'Not Provided')}</span>
              </div>
              <div className="data-item">
                <label>GST Number</label>
                <span>{user?.gst_number || (isSuperAdmin ? 'System Admin (N/A)' : 'Not Provided')}</span>
              </div>
              <div className="data-item full-width">
                <label>Registered Address</label>
                <span>{user?.address || 'Address not updated in the system.'}</span>
              </div>
              <div className="data-item">
                <label>City</label>
                <span>{user?.city || 'Not Provided'}</span>
              </div>
              <div className="data-item">
                <label>PIN Code</label>
                <span>{user?.pincode || 'Not Provided'}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <ProfileUploadModal 
        isOpen={isCropModalOpen} 
        onClose={() => setIsCropModalOpen(false)} 
        imageSrc={selectedImage} 
        onUpload={handleUploadCroppedImage} 
      />

      <ConfirmModal 
        isOpen={isDeleteConfirmOpen}
        title="Remove Profile Picture"
        message="Are you sure you want to remove your profile picture? This action cannot be undone."
        confirmText="Remove Picture"
        onConfirm={executeRemoveProfilePic}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        isLoading={isDeleting}
        isDestructive={true}
      />

      {isAvatarMenuOpen && (
        <div className="avatar-options-overlay" onClick={() => setIsAvatarMenuOpen(false)}>
          <div className="avatar-options-card" onClick={e => e.stopPropagation()}>
            <h3>Profile Picture</h3>
            <div className="action-buttons">
              <button 
                className="btn-upload" 
                onClick={() => { setIsAvatarMenuOpen(false); fileInputRef.current.click(); }}
              >
                <FiCamera /> Upload New Photo
              </button>
              {user?.profile_pic && (
                <button 
                  className="btn-remove" 
                  onClick={() => { setIsAvatarMenuOpen(false); setIsDeleteConfirmOpen(true); }}
                >
                  <FiTrash2 /> Remove Photo
                </button>
              )}
              <button className="btn-cancel" onClick={() => setIsAvatarMenuOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
