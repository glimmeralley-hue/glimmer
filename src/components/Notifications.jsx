import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config/api';
import { STATIC_URL } from '../config/constants';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    useEffect(() => {
        // Mock notifications for now
        const mockNotifications = [
            {
                id: 1,
                type: 'like',
                message: 'John Doe liked your post',
                user_email: 'john@example.com',
                username: 'John Doe',
                profile_pic: 'default.png',
                created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
                read: false
            },
            {
                id: 2,
                type: 'comment',
                message: 'Jane Smith commented on your post',
                user_email: 'jane@example.com',
                username: 'Jane Smith',
                profile_pic: 'default.png',
                created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
                read: false
            },
            {
                id: 3,
                type: 'follow',
                message: 'Mike Johnson started following you',
                user_email: 'mike@example.com',
                username: 'Mike Johnson',
                profile_pic: 'default.png',
                created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
                read: true
            }
        ];
        setNotifications(mockNotifications);
        setLoading(false);
    }, []);

    const markAsRead = (notificationId) => {
        setNotifications(prev => 
            prev.map(notif => 
                notif.id === notificationId ? { ...notif, read: true } : notif
            )
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => 
            prev.map(notif => ({ ...notif, read: true }))
        );
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'like': return 'bi-heart-fill text-danger';
            case 'comment': return 'bi-chat-fill text-primary';
            case 'follow': return 'bi-person-plus-fill text-success';
            case 'message': return 'bi-envelope-fill text-info';
            default: return 'bi-bell-fill text-warning';
        }
    };

    if (!user.email) {
        return (
            <div className="container py-5 text-center text-white">
                <h3>Please login to view notifications</h3>
                <Link to="/signin" className="btn btn-primary mt-3">Login</Link>
            </div>
        );
    }

    return (
        <div className="container py-5">
            <div className="glass-panel p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="text-white fw-black">NOTIFICATIONS</h2>
                    {notifications.length > 0 && (
                        <button 
                            className="btn btn-outline-light btn-sm" 
                            onClick={markAllAsRead}
                        >
                            MARK ALL AS READ
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <p className="text-white opacity-50">Loading notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-5">
                        <i className="bi bi-bell-slash fs-1 text-white opacity-50"></i>
                        <p className="text-white opacity-50 mt-3">No notifications yet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {notifications.map((notification) => (
                            <div 
                                key={notification.id}
                                className={`d-flex align-items-center gap-3 p-3 rounded-3 ${
                                    notification.read ? 'bg-transparent' : 'bg-white bg-opacity-10'
                                }`}
                                onClick={() => markAsRead(notification.id)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="position-relative">
                                    <img 
                                        src={`${STATIC_URL}/${notification.profile_pic || 'default.png'}`} 
                                        className="rounded-circle" 
                                        style={{ width: '40px', height: '40px', objectFit: 'cover' }} 
                                        alt={notification.username} 
                                    />
                                    <i className={`bi ${getNotificationIcon(notification.type)} position-absolute bottom-0 end-0 fs-6`} 
                                       style={{ fontSize: '12px' }}></i>
                                </div>
                                <div className="flex-grow-1">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-white mb-1">{notification.message}</p>
                                            <small className="text-white opacity-50">{formatTime(notification.created_at)}</small>
                                        </div>
                                        {!notification.read && (
                                            <div className="bg-primary rounded-circle" style={{ width: '8px', height: '8px' }}></div>
                                        )}
                                    </div>
                                </div>
                                <Link 
                                    to={`/profile/${notification.user_email}`}
                                    className="btn btn-sm btn-outline-light"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    VIEW
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
