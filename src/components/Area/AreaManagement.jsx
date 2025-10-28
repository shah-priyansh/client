import { Building2, Edit, MapPin, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { deleteAreaFetch, fetchAreas, selectAreas, selectAreasError, selectAreasLoading, selectAreasPagination, toggleAreaStatusFetch } from '../../store/slices/areaSlice';
import { formatDate } from '../../utils/authUtils';
import { Badge, Button, Card, CardContent, EmptyTable, ErrorTable, LoadingTable, Pagination, SearchInput, Switch, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui';
import AddAreaModal from './AddAreaModal';

const AreaManagement = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [areaToDelete, setAreaToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const dispatch = useDispatch();
  const areas = useSelector(selectAreas);
  const areasLoading = useSelector(selectAreasLoading);
  const areasError = useSelector(selectAreasError);
  const pagination = useSelector(selectAreasPagination);

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
    dispatch(fetchAreas({
      page: currentPage,
      search: debouncedSearchTerm,
      limit: 20
    }));
  }, [dispatch, currentPage, debouncedSearchTerm]);

  const handleAddAreaSuccess = () => {
    setIsAddModalOpen(false);
  };

  const handleEditArea = (area) => {
    setSelectedArea(area);
    setIsEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedArea(null);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setCurrentPage(1);
  };

  const handleDeleteArea = (area) => {
    setAreaToDelete(area);
  };

  const confirmDeleteArea = async () => {
    if (areaToDelete) {
      setIsDeleting(true);
      try {
        const result = await dispatch(deleteAreaFetch(areaToDelete._id));
        if (deleteAreaFetch.fulfilled.match(result)) {
          // Success - area deleted
          toast.success(`Area "${areaToDelete.name}" deleted successfully`);
          setAreaToDelete(null);
          
          // Refetch areas to update the total count and pagination
          dispatch(fetchAreas({
            page: currentPage,
            search: debouncedSearchTerm,
            limit: 20
          }));
        } else {
          // Error - show error message
          const errorMessage = result.error || 'Failed to delete area';
          toast.error(errorMessage);
        }
      } catch (error) {
        console.error('Error deleting area:', error);
        toast.error('An unexpected error occurred while deleting the area');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const cancelDeleteArea = () => {
    setAreaToDelete(null);
    setIsDeleting(false);
  };

  const handleToggleStatus = async (areaId) => {
    try {
      const result = await dispatch(toggleAreaStatusFetch(areaId)).unwrap();
      toast.success(result.message);
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Failed to update area status');
    }
  };

  const getStatusBadge = (isActive, areaId) => {
    return (
      <div className="flex items-center gap-2">
        <Switch
          checked={isActive}
          onCheckedChange={() => handleToggleStatus(areaId)}
          className="data-[state=checked]:bg-green-600"
        />
        <Badge variant={isActive ? "success" : "destructive"}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>
    );
  };

  return (
    <div className="max-w-full">

      {areasError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="text-red-800">
            <strong>Error:</strong> {typeof areasError === 'string' ? areasError : 'An error occurred'}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Areas</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Areas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {areas.filter(a => a.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cities Covered</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(areas.map(a => a.city)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              onClear={handleClearSearch}
              placeholder="Search areas..."
              loading={areasLoading}
              searching={isSearching}
            />
            <Button
              onClick={() => setIsAddModalOpen(true)}
              variant="gradient"
              size="lg"
              className="flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Area
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
                  <TableHead className="w-[25%] bg-white border-b-0 px-4 py-3 text-left font-semibold text-gray-900">Area</TableHead>
                  <TableHead className="w-[15%] bg-white border-b-0 px-4 py-3 text-left font-semibold text-gray-900">City</TableHead>
                  <TableHead className="w-[15%] bg-white border-b-0 px-4 py-3 text-left font-semibold text-gray-900">State</TableHead>
                  <TableHead className="w-[10%] bg-white border-b-0 px-4 py-3 text-left font-semibold text-gray-900">Status</TableHead>
                  <TableHead className="w-[20%] bg-white border-b-0 px-4 py-3 text-left font-semibold text-gray-900">Created</TableHead>
                  <TableHead className="w-[15%] bg-white border-b-0 px-4 py-3 text-right font-semibold text-gray-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areasLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <LoadingTable columns={6} rows={7} className="border-0" />
                    </TableCell>
                  </TableRow>
                ) : areasError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <ErrorTable
                        columns={6}
                        message="Failed to load areas"
                        description="There was an error loading the areas. Please try again."
                        onRetry={() => dispatch(fetchAreas({ page: currentPage, search: debouncedSearchTerm, limit: 20 }))}
                        className="border-0"
                      />
                    </TableCell>
                  </TableRow>
                ) : areas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <EmptyTable
                        columns={6}
                        message={debouncedSearchTerm ? 'No areas found' : 'No areas yet'}
                        description={debouncedSearchTerm ? 'No areas match your search criteria.' : 'Create your first area to get started.'}
                        className="border-0"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  areas.map((area) => (
                    <TableRow key={area._id}>
                      <TableCell className="font-medium px-4 py-3">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {area.name}
                        </div>
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        <span className="text-sm text-gray-900 truncate">{area.city}</span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className="text-sm text-gray-900 truncate">{area.state}</span>
                      </TableCell>


                      <TableCell className="px-4 py-3">
                        {getStatusBadge(area.isActive, area._id)}
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        <span className="text-sm text-gray-900 truncate">{formatDate(area.createdAt)}</span>
                      </TableCell>

                      <TableCell className="text-right px-4 py-3">
                        <div className="flex items-center justify-end space-x-0.5">
                          {areaToDelete && areaToDelete._id === area._id ? (
                            // Show confirmation buttons
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={cancelDeleteArea}
                                disabled={isDeleting}
                                className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900"
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={confirmDeleteArea}
                                disabled={isDeleting}
                                className="h-7 px-2 text-xs bg-red-600 hover:bg-red-700 disabled:opacity-50"
                              >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                              </Button>
                            </>
                          ) : (
                            // Show normal action buttons
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditArea(area)}
                                className="h-7 w-7 p-0 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
                                title="Edit area"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteArea(area)}
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-900 hover:bg-red-50"
                                title="Delete area"
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
        <Card className="mt-2">
          <CardContent className="p-0">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={setCurrentPage}
              loading={areasLoading}
            />
          </CardContent>
        </Card>
      )}

      <AddAreaModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddAreaSuccess}
      />

      <AddAreaModal
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        onSuccess={handleAddAreaSuccess}
        area={selectedArea}
      />


    </div>
  );
};

export default AreaManagement;
