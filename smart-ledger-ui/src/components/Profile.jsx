import React, { useState, useEffect } from 'react';

function Profile() {
    const [isEditing, setIsEditing] = useState(false);
    const [saved, setSaved] = useState(false);

    const loadProfile = () => {
        const email = sessionStorage.getItem('smart_ledger_current_user') || '';
        const name = sessionStorage.getItem('smart_ledger_current_name') || '';
        const allUsers = JSON.parse(localStorage.getItem('smart_ledger_all_users') || '{}');
        const stored = allUsers[email] || {};
        return {
            name: name || stored.name || '',
            email: email,
            phone: stored.phone || '',
            occupation: stored.occupation || '',
            city: stored.city || '',
            monthlyBudget: stored.monthlyBudget || '',
            joinedDate: stored.createdAt
                ? new Date(stored.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        };
    };

    const [profile, setProfile] = useState(loadProfile);
    const [form, setForm] = useState({ ...profile });

    useEffect(() => {
        const p = loadProfile();
        setProfile(p);
        setForm({ ...p });
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        const email = profile.email;
        const allUsers = JSON.parse(localStorage.getItem('smart_ledger_all_users') || '{}');
        if (allUsers[email]) {
            allUsers[email] = {
                ...allUsers[email],
                name: form.name,
                phone: form.phone,
                occupation: form.occupation,
                city: form.city,
                monthlyBudget: form.monthlyBudget
            };
            localStorage.setItem('smart_ledger_all_users', JSON.stringify(allUsers));
            localStorage.setItem('smart_ledger_current_name', form.name);
        }
        setProfile({ ...form });
        setIsEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const initials = profile.name
        ? profile.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : (profile.email[0] || 'U').toUpperCase();

    const inputBase = {
        width: '100%',
        padding: '11px 14px',
        borderRadius: '10px',
        fontSize: '14px',
        color: '#1e293b',
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s',
        fontFamily: 'inherit'
    };
    const fieldStyle = { ...inputBase, border: '1.5px solid #cbd5e1', background: '#ffffff' };
    const readonlyStyle = { ...inputBase, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' };
    const labelStyle = { fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', display: 'block' };

    return (
        <div style={{ width: '100%', padding: '8px 4px 40px' }}>
            {/* Page title */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: 0 }}>My Profile</h1>
                <p style={{ color: '#64748b', fontSize: '13px', margin: '5px 0 0 0' }}>View and manage your personal details</p>
            </div>


            <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e293b 100%)',
                borderRadius: '16px', padding: '28px 32px', marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '20px'
            }}>
                <div style={{
                    width: '68px', height: '68px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '24px', fontWeight: '700', color: '#fff',
                    flexShrink: 0, border: '2.5px solid rgba(255,255,255,0.25)'
                }}>
                    {initials}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '19px', fontWeight: '700', color: '#ffffff' }}>
                        {profile.name || 'Your Name'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '3px' }}>{profile.email}</div>
                    {profile.occupation && (
                        <div style={{ fontSize: '12px', color: '#60a5fa', marginTop: '3px' }}>{profile.occupation}</div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '8px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#10b981', fontWeight: '600' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                            Active
                        </span>
                        <span style={{ fontSize: '12px', color: '#475569' }}>Joined {profile.joinedDate}</span>
                    </div>
                </div>
            </div>


            {saved && (
                <div style={{
                    background: '#dcfce7', border: '1px solid #bbf7d0', color: '#15803d',
                    borderRadius: '10px', padding: '11px 16px', marginBottom: '16px',
                    fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                    ✓ Profile updated successfully
                </div>
            )}

            {/* Details card */}
            <div style={{
                background: '#ffffff', borderRadius: '16px',
                border: '1px solid #e2e8f0', padding: '28px 28px',
                boxShadow: '0 2px 12px rgba(15,23,42,0.05)'
            }}>
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Personal Information</h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                            {isEditing ? 'Edit your details below and save' : 'Click Edit to update your profile'}
                        </p>
                    </div>
                    {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} style={{
                            background: '#0f172a', color: '#fff', border: 'none',
                            padding: '9px 18px', borderRadius: '9px', fontSize: '13px',
                            fontWeight: '600', cursor: 'pointer', flexShrink: 0
                        }}>
                            ✎  Edit Profile
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => { setForm({ ...profile }); setIsEditing(false); }} style={{
                                background: '#f1f5f9', color: '#475569', border: 'none',
                                padding: '9px 16px', borderRadius: '9px', fontSize: '13px',
                                fontWeight: '600', cursor: 'pointer'
                            }}>Cancel</button>
                            <button onClick={handleSave} style={{
                                background: '#10b981', color: '#fff', border: 'none',
                                padding: '9px 18px', borderRadius: '9px', fontSize: '13px',
                                fontWeight: '600', cursor: 'pointer'
                            }}>Save Changes</button>
                        </div>
                    )}
                </div>


                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>

                    <div>
                        <label style={labelStyle}>Full Name</label>
                        <input name="name" value={form.name} onChange={handleChange}
                               disabled={!isEditing} placeholder="Enter your full name"
                               style={isEditing ? fieldStyle : readonlyStyle} />
                    </div>

                    <div>
                        <label style={labelStyle}>Email Address</label>
                        <input value={profile.email} disabled placeholder="Email"
                               style={readonlyStyle} />
                    </div>

                    <div>
                        <label style={labelStyle}>Phone Number</label>
                        <input name="phone" value={form.phone} onChange={handleChange}
                               disabled={!isEditing} placeholder="+91 xxxxx xxxxx"
                               style={isEditing ? fieldStyle : readonlyStyle} />
                    </div>

                    <div>
                        <label style={labelStyle}>Occupation</label>
                        <input name="occupation" value={form.occupation} onChange={handleChange}
                               disabled={!isEditing} placeholder="e.g. Software Engineer"
                               style={isEditing ? fieldStyle : readonlyStyle} />
                    </div>

                    <div>
                        <label style={labelStyle}>City</label>
                        <input name="city" value={form.city} onChange={handleChange}
                               disabled={!isEditing} placeholder="e.g. Hyderabad"
                               style={isEditing ? fieldStyle : readonlyStyle} />
                    </div>

                    <div>
                        <label style={labelStyle}>Monthly Budget Target (₹)</label>
                        <input name="monthlyBudget" type="number" value={form.monthlyBudget}
                               onChange={handleChange} disabled={!isEditing}
                               placeholder="e.g. 30000"
                               style={isEditing ? fieldStyle : readonlyStyle} />
                    </div>

                </div>
            </div>


            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '14px', marginTop: '18px'
            }}>
                {[
                    { label: 'Account Status', value: '● Active', color: '#10b981' },
                    { label: 'Member Since', value: profile.joinedDate, color: '#1e293b' },
                    { label: 'Account Type', value: 'Personal', color: '#1e293b' }
                ].map(item => (
                    <div key={item.label} style={{
                        background: '#f8fafc', borderRadius: '12px',
                        border: '1px solid #f1f5f9', padding: '16px 18px'
                    }}>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {item.label}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: item.color, marginTop: '6px' }}>
                            {item.value}
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}

export default Profile;