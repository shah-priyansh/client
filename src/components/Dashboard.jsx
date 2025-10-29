import React, { useEffect, useState } from 'react';
import { Users, UserCheck, MapPin, MessageCircle, Music } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  fetchDashboardData,
  selectDashboardStats,
  selectRecentInquiries,
  selectDashboardLoading,
  selectDashboardError,
  selectChartData
} from '../store/slices/dashboardSlice';
import { Button, Card, CardContent } from './ui';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const stats = useSelector(selectDashboardStats);
  const recentInquiries = useSelector(selectRecentInquiries);
  const chartData = useSelector(selectChartData);
  const loading = useSelector(selectDashboardLoading);
  const error = useSelector(selectDashboardError);

  const [inquiryPeriod, setInquiryPeriod] = useState('month');

  useEffect(() => {
    dispatch(fetchDashboardData(inquiryPeriod));
  }, [dispatch, inquiryPeriod]);

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

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6">
        {/* Inquiries Chart */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Inquiries Trend</h3>
                  <p className="text-sm text-gray-500">Inquiries over time</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setInquiryPeriod('day')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    inquiryPeriod === 'day'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Day
                </button>
                <button
                  onClick={() => setInquiryPeriod('week')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    inquiryPeriod === 'week'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setInquiryPeriod('month')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    inquiryPeriod === 'month'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Month
                </button>
              </div>
            </div>
            {chartData.inquiries && chartData.inquiries.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.inquiries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis 
                    allowDecimals={false}
                    domain={[0, 'dataMax']}
                    tickFormatter={(value) => value}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#3b82f6" name="Inquiries" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-gray-500">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
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

    </div>
  );
};

export default Dashboard;
