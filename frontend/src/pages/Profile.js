import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || { city: '', area: '' },
    profilePicture: user?.profilePicture || '',
    gender: user?.gender || '',
    dob: user?.dob || '',
    address: user?.address || '',
    skills: user?.skills?.join(', ') || '',
    experience: user?.experience || '',
    hourlyRate: user?.hourlyRate || '',
    preferences: user?.preferences?.join(', ') || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('location.')) {
      setForm({
        ...form,
        location: {
          ...form.location,
          [name.split('.')[1]]: value,
        },
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    // Convert skills and preferences to arrays
    const updated = {
      ...form,
      skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      preferences: form.preferences.split(',').map(s => s.trim()).filter(Boolean),
    };
    updateUser(updated);
    setEditMode(false);
  };

  if (!user) return <div className="profile-page"><h2>Not logged in</h2></div>;

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h2>Profile</h2>
        {!editMode ? (
          <div className="profile-details">
            {form.profilePicture && <img src={form.profilePicture} alt="Profile" className="profile-avatar" />}
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Phone:</strong> {user.phone}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>City:</strong> {user.location?.city}</p>
            <p><strong>Area:</strong> {user.location?.area}</p>
            <p><strong>Gender:</strong> {user.gender || '-'}</p>
            <p><strong>Date of Birth:</strong> {user.dob || '-'}</p>
            <p><strong>Address:</strong> {user.address || '-'}</p>
            {user.role === 'provider' && <>
              <p><strong>Skills:</strong> {user.skills?.join(', ') || '-'}</p>
              <p><strong>Experience:</strong> {user.experience || '-'} years</p>
              <p><strong>Hourly Rate:</strong> {user.hourlyRate ? `৳${user.hourlyRate}` : '-'}</p>
            </>}
            {user.role === 'seeker' && <>
              <p><strong>Preferences:</strong> {user.preferences?.join(', ') || '-'}</p>
            </>}
            <button className="btn btn-primary" onClick={() => setEditMode(true)}>Edit Profile</button>
          </div>
        ) : (
          <form className="profile-form" onSubmit={handleSave}>
            <div className="form-group">
              <label>Name</label>
              <input name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input name="email" value={form.email} onChange={handleChange} required disabled />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>City</label>
              <input name="location.city" value={form.location.city} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Area</label>
              <input name="location.area" value={form.location.area} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Profile Picture URL</label>
              <input name="profilePicture" value={form.profilePicture} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input name="dob" type="date" value={form.dob} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input name="address" value={form.address} onChange={handleChange} />
            </div>
            {user.role === 'provider' && <>
              <div className="form-group">
                <label>Skills (comma separated)</label>
                <input name="skills" value={form.skills} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Experience (years)</label>
                <input name="experience" type="number" value={form.experience} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Hourly Rate (৳)</label>
                <input name="hourlyRate" type="number" value={form.hourlyRate} onChange={handleChange} />
              </div>
            </>}
            {user.role === 'seeker' && <>
              <div className="form-group">
                <label>Preferences (comma separated)</label>
                <input name="preferences" value={form.preferences} onChange={handleChange} />
              </div>
            </>}
            <button className="btn btn-primary" type="submit">Save</button>
            <button className="btn btn-outline" type="button" onClick={() => setEditMode(false)}>Cancel</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile; 