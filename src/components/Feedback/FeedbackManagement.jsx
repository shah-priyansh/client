import { MessageSquare, Edit, Trash2, Eye, Calendar, User, Plus, Volume2, AlertCircle, CheckCircle } from 'lucide-react';
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
import { formatDate } from '../../utils/authUtils';
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
  AudioPlayButton
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
  const dispatch = useDispatch();
  const feedbacks = useSelector(selectFeedbacks);
  const [showMoreNotes, setShowMoreNotes] = useState(false);
  console.log('feedbacks', feedbacks);
  const feedbacksLoading = useSelector(selectFeedbacksLoading);
  const feedbacksError = useSelector(selectFeedbacksError);
  const pagination = useSelector(selectFeedbacksPagination);

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

  useEffect(() => {
    dispatch(fetchFeedbacks({
      page: currentPage,
      search: debouncedSearchTerm,
      limit: 20
    }));
  }, [dispatch, currentPage, debouncedSearchTerm]);

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
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              onClear={handleClearSearch}
              placeholder="Search feedbacks..."
              loading={feedbacksLoading}
              searching={isSearching}
            />
            <Button
              onClick={() => setIsAddModalOpen(true)}
              variant="gradient"
              size="lg"
              className="flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Inquiry
            </Button>
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