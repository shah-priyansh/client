import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, Check, CheckCheck, Clock, Phone, User } from 'lucide-react';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllAsRead,
  selectNotifications,
  selectUnreadCount,
  selectNotificationsLoading,
} from '../../store/slices/notificationSlice';
import { Card, CardContent } from '../ui';

const NotificationManagement = () => {
  const dispatch = useDispatch();
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const loading = useSelector(selectNotificationsLoading);

  useEffect(() => {
    dispatch(fetchNotifications({ page: 1, limit: 50 }));
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  const handleMarkAsRead = async (id) => {
    await dispatch(markNotificationAsRead(id));
    dispatch(fetchUnreadCount());
  };

  const handleMarkAllAsRead = async () => {
    await dispatch(markAllAsRead());
    dispatch(fetchUnreadCount());
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'otp_sent':
      case 'otp_resent':
        return <Bell className="h-5 w-5" />;
      case 'otp_verified':
        return <Check className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'otp_sent':
      case 'otp_resent':
        return 'bg-blue-100 text-blue-600';
      case 'otp_verified':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusBadge = (status) => {
    return status === 'success' ? (
      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Success</span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Failed</span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">OTP Audit Log</h2>
          <p className="text-sm text-gray-500 mt-1">Track all OTP activities sent by salesmen</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            Mark All as Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No notifications found</p>
            <p className="text-sm text-gray-400 mt-1">OTP activities will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification._id}
              className={`border-l-4 ${
                notification.isRead ? 'border-l-gray-200' : 'border-l-blue-500'
              } ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}`}>
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {notification.salesmanName || `${notification.salesman?.firstName || ''} ${notification.salesman?.lastName || ''}`.trim()}
                        </h4>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-600">
                          {notification.type === 'otp_sent' && 'Sent OTP'}
                          {notification.type === 'otp_resent' && 'Resent OTP'}
                          {notification.type === 'otp_verified' && 'Verified OTP'}
                        </span>
                        {getStatusBadge(notification.status)}
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{notification.clientName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{notification.clientPhone}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(notification.createdAt).toLocaleString()}</span>
                        </div>
                        {notification.deliveryMethod && (
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            {notification.deliveryMethod}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification._id)}
                      className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                      title="Mark as read"
                    >
                      <Check className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationManagement;
