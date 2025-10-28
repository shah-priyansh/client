import React, { useEffect } from 'react';
import { Users, UserCheck, MapPin, Clock, MessageCircle, Music } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchDashboardData,
  selectDashboardStats,
  selectRecentSalesmen,
  selectRecentClients,
  selectRecentInquiries,
  selectDashboardLoading,
  selectDashboardError
} from '../store/slices/dashboardSlice';
import { Button, Card, CardContent } from './ui';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const stats = useSelector(selectDashboardStats);
  const recentSalesmen = useSelector(selectRecentSalesmen);
  const recentClients = useSelector(selectRecentClients);
  const recentInquiries = useSelector(selectRecentInquiries);
  const loading = useSelector(selectDashboardLoading);
  const error = useSelector(selectDashboardError);

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color = 'primary' }) => {
    const colorClasses = {
      primary: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600'
    };

    return (
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className={`flex-shrink-0 p-3 rounded-lg ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const RecentItem = ({ title, subtitle, time, status }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">
              {title.charAt(0)}
            </span>
          </div>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center text-sm text-gray-500">
        <Clock className="h-4 w-4 mr-1" />
        {time}
      </div>
    </div>
  );

  const InquiryItem = ({ inquiry }) => {

    const getStatusBorderColor = (lead) => {
      switch (lead) {
        case 'Green':
          return 'border-l-green-500';
        case 'Red':
          return 'border-l-red-500';
        case 'Orange':
          return 'border-l-orange-500';
        default:
          return 'border-l-gray-100';
      }
    };

    return (
      <Card className={`border-l-2 ${getStatusBorderColor(inquiry.lead)}`}>
        <CardContent className="p-5 ">
          <div className={`flex items-center justify-between mb-2 pb-2`}>
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0 ">
                <div className="h-8 w-8 rounded-full flex items-center justify-center bg-blue-100">
                  <span className="text-xs font-medium text-blue-600">
                    {inquiry.client?.name?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-gray-900 text-sm truncate">{inquiry.client?.name || 'Unknown Client'}</h4>
                <p className="text-xs text-gray-500 truncate">{inquiry.client?.company || 'No company'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {inquiry.audio?.key && (
                <Music className="h-6 w-6 text-blue-600" />
              )}
            </div>
          </div>

          <div className={`mb-2 border-b border-gray-100 pb-2 ${getStatusBorderColor(inquiry.lead)}`}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Products</span>
            </div>
            <div className="space-y-1">
              {inquiry.products && Array.isArray(inquiry.products) && inquiry.products.length > 0 ? (
                inquiry.products.slice(0, 1).map((productItem, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                    <span className="font-medium text-gray-800 text-xs truncate">
                      {productItem.product?.productName || 'Unknown Product'}
                    </span>
                    <span className="bg-gray-600 text-white px-2 py-1 rounded-full font-medium text-xs">
                      {productItem.quantity}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic bg-gray-50 px-3 py-2 rounded-lg">No products</p>
              )}
              {inquiry.products && inquiry.products.length > 1 && (
                <p className="text-xs text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded-full text-center">+{inquiry.products.length - 1} more</p>
              )}
            </div>
          </div>

          <div className={`flex items-center justify-between text-xs text-gray-500 pt-2 border-b border-gray-100 pb-2 ${getStatusBorderColor(inquiry.lead)}`}>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                <span className="font-medium">
                  {inquiry.products && Array.isArray(inquiry.products)
                    ? inquiry.products.reduce((total, product) => total + (product.quantity || 0), 0)
                    : 0
                  }
                </span>
              </span>
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                <span className="font-medium truncate">
                  {inquiry.createdBy ? inquiry.createdBy.firstName : 'Unknown'}
                </span>
              </span>
            </div>
            <span className="text-gray-400 font-medium">
              {new Date(inquiry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>

          {inquiry.notes && inquiry.notes.length <= 30 && (
            <div className="mt-2 pt-1">
              <p className="text-xs text-gray-700 font-medium px-3 py-2 rounded-lg">
                {inquiry.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'salesman':
        navigate('/employees');
        break;
      case 'client':
        navigate('/clients');
        break;
      case 'area':
        navigate('/areas');
        break;
      case 'inquiries':
        navigate('/inquiries');
        break;
      default:
        break;
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load dashboard data</p>
          <button
            onClick={() => dispatch(fetchDashboardData())}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Inquiries"
          value={stats?.totalInquiries || 0}
          icon={MessageCircle}
          color="purple"
        />
        <StatCard
          title="Total Clients"
          value={stats?.totalClients || 0}
          icon={UserCheck}
          color="green"
        />
        <StatCard
          title="Total Salesmen"
          value={stats?.totalSalesmen || 0}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Total Areas"
          value={stats?.totalAreas || 0}
          icon={MapPin}
          color="blue"
        />

      </div>

      {/* Recent Inquiries - Prominent Section */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Inquiries</h3>
                <p className="text-sm text-gray-500">Latest customer inquiries and leads</p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/inquiries')}
              variant="gradient"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
            >
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentInquiries.length > 0 ? (
              recentInquiries.map((inquiry) => (
                <InquiryItem
                  key={inquiry._id}
                  inquiry={inquiry}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <div className="p-3 bg-gray-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium text-sm">No recent inquiries</p>
                <p className="text-xs text-gray-400 mt-1">Customer inquiries will appear here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-5">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Salesmen</h3>
            <div className="space-y-2">
              {recentSalesmen.length > 0 ? (
                recentSalesmen.map((salesman) => (
                  <RecentItem
                    key={salesman._id}
                    title={`${salesman.firstName} ${salesman.lastName}`}
                    subtitle={salesman.area?.name || 'No area assigned'}
                    time={new Date(salesman.createdAt).toLocaleDateString()}
                  />
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No recent salesmen activity</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Clients</h3>
            <div className="space-y-2">
              {recentClients.length > 0 ? (
                recentClients.map((client) => (
                  <RecentItem
                    key={client._id}
                    title={client.name}
                    subtitle={`${client.company || 'No company'} • ${client.area?.name}`}
                    time={new Date(client.createdAt).toLocaleDateString()}
                  />
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No recent client activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-row gap-4 max-w-full">
            <button
              onClick={() => handleQuickAction('salesman')}
              className="group relative overflow-hidden bg-white border-2 border-blue-200 rounded-xl p-3 hover:border-blue-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 w-full"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-800 text-sm">Add Salesman</h4>
                  <p className="text-xs text-gray-500">Create new team member</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            <button
              onClick={() => handleQuickAction('client')}
              className="group relative overflow-hidden bg-white border-2 border-purple-200 rounded-xl p-3 hover:border-purple-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 w-full"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-800 text-sm">Add Client</h4>
                  <p className="text-xs text-gray-500">Register new customer</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            <button
              onClick={() => handleQuickAction('area')}
              className="group relative overflow-hidden bg-white border-2 border-green-200 rounded-xl p-3 hover:border-green-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 w-full"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-800 text-sm">Add Area</h4>
                  <p className="text-xs text-gray-500">Define new territory</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            <button
              onClick={() => handleQuickAction('inquiries')}
              className="group relative overflow-hidden bg-white border-2 border-orange-200 rounded-xl p-3 hover:border-orange-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 w-full"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-800 text-sm">View Inquiries</h4>
                  <p className="text-xs text-gray-500">Check customer inquiries</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
