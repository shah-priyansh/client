import { MessageSquare, Edit, Trash2, Eye, Calendar, User, Plus, Volume2, AlertCircle, CheckCircle, Download, Filter, X, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { 
  deleteFeedback, 
  fetchFeedbacks, 
  selectFeedbacks, 
  selectFeedbacksError, 
  selectFeedbacksLoading, 
  selectFeedbacksPagination,
  setCurrentPage
} from '../../store/slices/feedbackSlice';
import { fetchAreas, selectAreas } from '../../store/slices/areaSlice';
import { fetchUsers, selectUsers } from '../../store/slices/userSlice';
import { formatDate } from '../../utils/authUtils';
import apiClient from '../../utils/axiosConfig';
import { 
  Badge, 
  Button, 
  Card, 
  CardContent, 
  EmptyTable, 
  ErrorTable, 
  LoadingTable, 
  Pagination, 
  SearchInput, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  AudioPlayButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui';
import AddFeedbackModal from './AddFeedbackModal';

const FeedbackManagement = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [feedbackToDelete, setFeedbackToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  
  // Filter states
  const [selectedSalesman, setSelectedSalesman] = useState('all');
  const [selectedArea, setSelectedArea] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [areaSearchTerm, setAreaSearchTerm] = useState('');
  const [debouncedAreaSearch, setDebouncedAreaSearch] = useState('');
  
  const dispatch = useDispatch();
  const feedbacks = useSelector(selectFeedbacks);
  const [showMoreNotes, setShowMoreNotes] = useState(false);
  console.log('feedbacks', feedbacks);
  const feedbacksLoading = useSelector(selectFeedbacksLoading);
  const feedbacksError = useSelector(selectFeedbacksError);
  const pagination = useSelector(selectFeedbacksPagination);
  const areas = useSelector(selectAreas);
  const users = useSelector(selectUsers);

  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true);
    }

    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(timer);
      setIsSearching(false);
    };
  }, [searchTerm, debouncedSearchTerm]);

  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, searchTerm]);

  // Fetch areas and salesmen on mount
  useEffect(() => {
    dispatch(fetchAreas({ limit: 1000, isActive: 'true' }));
    dispatch(fetchUsers({ limit: 1000, role: 'salesman' }));
  }, [dispatch]);

  // Debounced search for areas
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAreaSearch(areaSearchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [areaSearchTerm]);

  // Filter areas based on search term and active status
  const filteredAreas = areas.filter(area => {
    // First filter by active status
    if (!area.isActive) return false;
    
    if (!debouncedAreaSearch) return true;
    const searchLower = debouncedAreaSearch.toLowerCase();
    return (
      area.name.toLowerCase().includes(searchLower) ||
      area.city.toLowerCase().includes(searchLower) ||
      area.state.toLowerCase().includes(searchLower)
    );
  });

  useEffect(() => {
    dispatch(fetchFeedbacks({
      page: currentPage,
      search: debouncedSearchTerm,
      salesmanId: selectedSalesman !== 'all' ? selectedSalesman : '',
      areaId: selectedArea !== 'all' ? selectedArea : '',
      dateRange: dateRange !== 'all' ? dateRange : '',
      limit: 20
    }));
  }, [dispatch, currentPage, debouncedSearchTerm, selectedSalesman, selectedArea, dateRange]);

  const handleAddFeedbackSuccess = () => {
    setIsAddModalOpen(false);
  };

  const handleEditFeedback = (feedback) => {
    setSelectedFeedback(feedback);
    setIsEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedFeedback(null);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSelectedSalesman('all');
    setSelectedArea('all');
    setDateRange('all');
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setCurrentPage(1);
  };

  const handleExportToExcel = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (selectedSalesman && selectedSalesman !== 'all') params.append('salesmanId', selectedSalesman);
      if (selectedArea && selectedArea !== 'all') params.append('areaId', selectedArea);
      if (dateRange && dateRange !== 'all') params.append('dateRange', dateRange);

      const response = await apiClient.get(`/feedback/export?${params.toString()}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inquiries_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Inquiries exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export inquiries');
    } finally {
      setIsExporting(false);
    }
  };

  const hasActiveFilters = (selectedSalesman && selectedSalesman !== 'all') || (selectedArea && selectedArea !== 'all') || (dateRange && dateRange !== 'all') || debouncedSearchTerm;

  const handleDeleteFeedback = (feedback) => {
    setFeedbackToDelete(feedback);
  };

  const confirmDeleteFeedback = async () => {
    if (feedbackToDelete) {
      setIsDeleting(true);
      try {
        const result = await dispatch(deleteFeedback(feedbackToDelete._id));
        if (deleteFeedback.fulfilled.match(result)) {
          // Success - feedback deleted
          toast.success(`Feedback for "${feedbackToDelete.client?.name || 'Client'}" deleted successfully`);
          setFeedbackToDelete(null);
          
          // Refetch feedbacks to update the total count and pagination
          dispatch(fetchFeedbacks({
            page: currentPage,
            search: debouncedSearchTerm,
            limit: 20
          }));
        } else {
          // Error - show error message
          const errorMessage = result.error || 'Failed to delete feedback';
          toast.error(errorMessage);
        }
      } catch (error) {
        console.error('Error deleting feedback:', error);
        toast.error('An unexpected error occurred while deleting the feedback');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const cancelDeleteFeedback = () => {
    setFeedbackToDelete(null);
    setIsDeleting(false);
  };

  const getLeadBadge = (lead) => {
    const variants = {
      'Red': { variant: 'destructive', icon: AlertCircle, text: 'High Priority' },
      'Orange': { variant: 'warning', icon: AlertCircle, text: 'Medium Priority' },
      'Green': { variant: 'success', icon: CheckCircle, text: 'Low Priority' }
    };
    
    const config = variants[lead] || variants['Green'];
    const Icon = config.icon;
    
    return (
      <div className="flex justify-center">
        <Badge variant={config.variant} className="flex items-center gap-1">
          <Icon className="h-3 w-3" />
          {lead}
        </Badge>
      </div>
    );
  };

  const getStatsCards = () => {
    const totalFeedbacks = pagination.total || feedbacks.length;
    const redFeedbacks = feedbacks.filter(f => f.lead === 'Red').length;
    const greenFeedbacks = feedbacks.filter(f => f.lead === 'Green').length;
    const orangeFeedbacks = feedbacks.filter(f => f.lead === 'Orange').length;
    const withAudio = feedbacks.filter(f => f.audio?.key).length;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Inquiries</p>
                <p className="text-2xl font-bold text-gray-900">{totalFeedbacks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-gray-900">{redFeedbacks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Priority</p>
                <p className="text-2xl font-bold text-gray-900">{greenFeedbacks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Volume2 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">With Audio</p>
                <p className="text-2xl font-bold text-gray-900">{withAudio}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="max-w-full">
      {feedbacksError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="text-red-800">
            <strong>Error:</strong> {typeof feedbacksError === 'string' ? feedbacksError : 'An error occurred'}
          </div>
        </div>
      )}

      {getStatsCards()}

      <Card className="mb-6">
        <CardContent className="p-4 md:p-6">
          {/* Single Row Layout - Search, Filters, and Actions */}
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            {/* Search Input */}
            <div className="flex-1 min-w-0">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                onClear={handleClearSearch}
                placeholder="Search feedbacks..."
                loading={feedbacksLoading}
                searching={isSearching}
              />
            </div>

            {/* Filters - Compact */}
            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
              {/* Salesman Filter */}
              <Select value={selectedSalesman} onValueChange={setSelectedSalesman}>
                <SelectTrigger className="w-full sm:w-[160px] h-10">
                  <SelectValue placeholder="Salesman" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Salesmen</SelectItem>
                  {users.filter(u => u.role === 'salesman' && u.isActive).map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Area Filter */}
              <Select 
                value={selectedArea} 
                onValueChange={(value) => {
                  setSelectedArea(value);
                  setAreaSearchTerm(''); // Clear search when area is selected
                }}
              >
                <SelectTrigger className="w-full sm:w-[140px] h-10">
                  <SelectValue placeholder="Area" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]" position="popper" side="bottom" align="start">
                  {/* Search Input */}
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search areas..."
                        value={areaSearchTerm}
                        onChange={(e) => setAreaSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-10 h-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {areaSearchTerm && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAreaSearchTerm('');
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Area Options */}
                  <div className="max-h-[200px] overflow-y-auto">
                    <SelectItem value="all">All Areas</SelectItem>
                    {filteredAreas.length > 0 ? (
                      filteredAreas.map((area) => (
                        <SelectItem key={area._id} value={area._id}>
                          {area.name} - {area.city}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-3 text-center text-sm text-gray-500">
                        No areas found
                      </div>
                    )}
                  </div>
                </SelectContent>
              </Select>

              {/* Date Range Filter */}
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-full sm:w-[140px] h-10">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="weekly">Last 7 Days</SelectItem>
                  <SelectItem value="monthly">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <Button
                  onClick={handleClearFilters}
                  variant="outline"
                  size="sm"
                  className="h-10 px-3 flex items-center gap-1.5"
                  title="Clear all filters"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-shrink-0">
              <Button
                onClick={handleExportToExcel}
                variant="outline"
                size="sm"
                className="h-10 px-4 flex items-center gap-1.5 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700 hover:text-blue-700 font-semibold shadow-sm hover:shadow-md transition-all"
                disabled={isExporting}
                title="Export to Excel"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export Excel'}</span>
                <span className="sm:hidden">{isExporting ? '...' : 'Export'}</span>
              </Button>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                variant="gradient"
                size="sm"
                className="h-10 px-3 flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Inquiry</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto h-[410px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <Table className="w-full table-fixed border-collapse">
              <TableHeader className="sticky top-0 bg-white z-30 shadow-lg border-b-2 border-gray-200">
                <TableRow className="bg-white hover:bg-white">
                  <TableHead className="w-[20%] bg-white border-b-0 px-4 py-3 text-left font-semibold text-gray-900">Client</TableHead>
                  <TableHead className="w-[10%] bg-white border-b-0 px-4 py-3 text-left font-semibold text-gray-900">Lead Status</TableHead>
                  <TableHead className="w-[30%] bg-white border-b-0 px-4 py-3 text-left font-semibold text-gray-900">Products</TableHead>
                  <TableHead className="w-[20%] bg-white border-b-0 px-4 py-3 text-left font-semibold text-gray-900">Notes</TableHead>
                  <TableHead className="w-[10%] bg-white border-b-0 px-4 py-3 text-left font-semibold text-gray-900">Created By</TableHead>
                  <TableHead className="w-[10%] bg-white border-b-0 px-4 py-3 text-left font-semibold text-gray-900">Audio</TableHead>
                  <TableHead className="w-[15%] bg-white border-b-0 px-4 py-3 text-left font-semibold text-gray-900">Date</TableHead>
                  <TableHead className="w-[10%] bg-white border-b-0 px-4 py-3 text-right font-semibold text-gray-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbacksLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <LoadingTable columns={6} rows={7} className="border-0" />
                    </TableCell>
                  </TableRow>
                ) : feedbacksError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <ErrorTable
                        columns={6}
                        message="Failed to load feedbacks"
                        description="There was an error loading the feedbacks. Please try again."
                        onRetry={() => dispatch(fetchFeedbacks({ page: currentPage, search: debouncedSearchTerm, limit: 20 }))}
                        className="border-0"
                      />
                    </TableCell>
                  </TableRow>
                ) : feedbacks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <EmptyTable
                        columns={6}
                        message={debouncedSearchTerm ? 'No feedbacks found' : 'No feedbacks yet'}
                        description={debouncedSearchTerm ? 'No feedbacks match your search criteria.' : 'Create your first feedback to get started.'}
                        className="border-0"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  feedbacks.map((feedback) => (
                    <TableRow key={feedback._id}>
                      <TableCell className="font-medium px-4 py-3">
                        <div className="flex flex-col items-left space-x-2">
                          <div>
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {feedback.client?.name || 'Unknown Client'} - {feedback.client?.company || ''}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {feedback.client?.phone || ''}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        {getLeadBadge(feedback.lead)}
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        <div className="space-y-1">
                          {feedback.products && Array.isArray(feedback.products) ? (
                            feedback.products.map((productItem, index) => (
                              <div key={index} className="flex items-center justify-between text-xs bg-gray-50 px-2 py-1 rounded">
                                <span className="font-medium text-gray-900">
                                  {productItem.product?.productName || 'Unknown Product'}
                                </span>
                                <span className="text-gray-600 ml-2">
                                  Qty: {productItem.quantity}
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">No products</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        {feedback.notes && feedback.notes.length > 30 && !showMoreNotes ? (
                          <span className="text-gray-400 text-sm cursor-pointer" onClick={() => setShowMoreNotes(true)}>
                            {feedback.notes.substring(0, 30)}... Read More
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm cursor-pointer" onClick={() => setShowMoreNotes(false)}>{feedback.notes} Read Less</span>
                        )}

                      </TableCell>

                      <TableCell className="px-4 py-3">
                        {feedback.createdBy?.firstName || 'Unknown'} {feedback.createdBy?.lastName || ''}
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        {feedback.audio?.key ? (
                          <AudioPlayButton 
                            feedbackId={feedback._id}
                            className="hover:bg-gray-100 rounded"
                          />
                        ) : (
                          <span className="text-gray-400 text-sm">No audio</span>
                        )}
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-900 truncate">{formatDate(feedback.date)}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right px-4 py-3">
                        <div className="flex items-center justify-end space-x-0.5">
                          {feedbackToDelete && feedbackToDelete._id === feedback._id ? (
                           
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={cancelDeleteFeedback}
                                disabled={isDeleting}
                                className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900"
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={confirmDeleteFeedback}
                                disabled={isDeleting}
                                className="h-7 px-2 text-xs"
                              >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                              </Button>
                            </>
                          ) : (
                            <>
                             <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditFeedback(feedback)}
                                className="h-7 w-7 p-0 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
                                title="Edit feedback"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteFeedback(feedback)}
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-900 hover:bg-red-50"
                                title="Delete feedback"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {pagination.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              dispatch(setCurrentPage(page));
            }}
          />
        </div>
      )}

      {/* Add Modal */}
      <AddFeedbackModal
        isOpen={isAddModalOpen}
        onClose={handleAddFeedbackSuccess}
        feedback={null}
      />

      {/* Edit Modal */}
      <AddFeedbackModal
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        feedback={selectedFeedback}
      />
    </div>
  );
};

export default FeedbackManagement;