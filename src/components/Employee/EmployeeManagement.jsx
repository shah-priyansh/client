import { Edit, Mail, Phone, Plus, Trash2, User, Filter, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import {
  deleteUserFetch,
  fetchUsers,
  selectUsers,
  selectUsersError,
  selectUsersLoading,
  selectUsersPagination,
  toggleUserStatusFetch,
  updateUserFetch
} from '../../store/slices/userSlice';
import { fetchAreas, selectAreas, selectAreasLoading } from '../../store/slices/areaSlice';
import { formatDate } from '../../utils/authUtils';
import { Badge, Button, Card, CardContent, EmptyTable, ErrorTable, LoadingTable, Pagination, SearchInput, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui';
import AddUserModal from './AddEmployeeModal';

const UserManagement = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState('all');
  const [areaSearchTerm, setAreaSearchTerm] = useState('');
  const [debouncedAreaSearch, setDebouncedAreaSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const dispatch = useDispatch();
  const users = useSelector(selectUsers);
  const pagination = useSelector(selectUsersPagination);
  const usersLoading = useSelector(selectUsersLoading);
  const usersError = useSelector(selectUsersError);
  const areas = useSelector(selectAreas);
  const areasLoading = useSelector(selectAreasLoading);

  // Debounced search effect
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

  // Fetch areas on component mount
  useEffect(() => {
    if (areas.length === 0) {
      dispatch(fetchAreas({ page: 1, limit: 100 }));
    }
  }, [dispatch, areas.length]);

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

  // Fetch users on component mount and when search/area filter changes
  useEffect(() => {
    dispatch(fetchUsers({
      page: currentPage,
      search: debouncedSearchTerm,
      area: selectedAreaFilter === 'all' ? '' : selectedAreaFilter,
      limit: 20
    }));
  }, [dispatch, currentPage, debouncedSearchTerm, selectedAreaFilter]);

  const handleAddUser = (userData) => {
    // User is already added to Redux store via createUserFetch.fulfilled
    // Just close the modal - no need to fetch again
    setIsAddModalOpen(false);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (userToDelete) {
      setIsDeleting(true);
      try {
        const result = await dispatch(deleteUserFetch(userToDelete._id));
        if (deleteUserFetch.fulfilled.match(result)) {
          // Success - user deleted
          toast.success(`User "${userToDelete.firstName} ${userToDelete.lastName}" deleted successfully`);
          setUserToDelete(null);

          // Refetch users to update the total count
          dispatch(fetchUsers({
            page: currentPage,
            search: debouncedSearchTerm,
            area: selectedAreaFilter === 'all' ? '' : selectedAreaFilter,
            limit: 20
          }));
        } else {
          // Error - show error message
          const errorMessage = result.error || 'Failed to delete user';
          toast.error(errorMessage);
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('An unexpected error occurred while deleting the user');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const cancelDeleteUser = () => {
    setUserToDelete(null);
    setIsDeleting(false);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setCurrentPage(1);
  };

  const handleAreaFilterChange = (areaId) => {
    setSelectedAreaFilter(areaId);
    setCurrentPage(1);
  };

  const handleClearAreaFilter = () => {
    setSelectedAreaFilter('all');
    setAreaSearchTerm('');
    setDebouncedAreaSearch('');
    setCurrentPage(1);
  };

  const handleToggleStatus = async (userId) => {
    try {
      const result = await dispatch(toggleUserStatusFetch(userId)).unwrap();
      toast.success(result.message);
      // No need to refetch - Redux store is already updated
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Failed to update user status');
    }
  };


  const getStatusSwitch = (isActive, userId) => {
    return (
      <div className="flex items-center gap-2">
        <Switch
          checked={isActive}
          onCheckedChange={() => handleToggleStatus(userId)}
          disabled={usersLoading}
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
      {usersError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="text-red-800">
            <strong>Error:</strong> {typeof usersError === 'string' ? usersError : 'An error occurred'}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{pagination?.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users?.filter(u => u.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactive Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users?.filter(u => !u.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                onClear={handleClearSearch}
                placeholder="Search users..."
                loading={usersLoading}
                searching={isSearching}
              />
              <div className="flex items-center gap-2">
                <Select
                  value={selectedAreaFilter}
                  onValueChange={handleAreaFilterChange}
                  disabled={areasLoading}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by area..." />
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
                        />
                        {areaSearchTerm && (
                          <button
                            type="button"
                            onClick={() => setAreaSearchTerm('')}
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
                          {areasLoading ? 'Loading areas...' : 'No areas found'}
                        </div>
                      )}
                    </div>
                  </SelectContent>
                </Select>
                {selectedAreaFilter && selectedAreaFilter !== 'all' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAreaFilter}
                    className="h-9 px-2"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              variant="gradient"
              size="lg"
              className="flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add User
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
                  <TableHead className="w-[20%] bg-white border-b-0 px-4 py-3 text-left font-semibold text-gray-900">User</TableHead>
                  <TableHead className="w-[12%] bg-white border-b-0 px-4 py-3 text-left font-semibold text-gray-900">Area</TableHead>
                  <TableHead className="w-[15%] bg-white border-b-0 px-4 py-3 text-left font-semibold text-gray-900">Password</TableHead>
                  <TableHead className="w-[15%] bg-white border-b-0 px-4 py-3 text-left font-semibold text-gray-900">Contact</TableHead>
                  <TableHead className="w-[15%] bg-white border-b-0 px-4 py-3 text-left font-semibold text-gray-900">Status</TableHead>
                  <TableHead className="w-[12%] bg-white border-b-0 px-4 py-3 text-left font-semibold text-gray-900">Created</TableHead>
                  <TableHead className="w-[18%] bg-white border-b-0 px-4 py-3 text-right font-semibold text-gray-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <LoadingTable columns={7} rows={7} className="border-0" />
                    </TableCell>
                  </TableRow>
                ) : usersError ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <ErrorTable
                        columns={7}
                        message="Failed to load users"
                        description="There was an error loading the users. Please try again."
                        onRetry={() => dispatch(fetchUsers({
                          page: currentPage,
                          search: debouncedSearchTerm,
                          area: selectedAreaFilter === 'all' ? '' : selectedAreaFilter,
                          limit: 20
                        }))}
                        className="border-0"
                      />
                    </TableCell>
                  </TableRow>
                ) : users?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <EmptyTable
                        columns={7}
                        message={debouncedSearchTerm ? 'No users found' : 'No users yet'}
                        description={debouncedSearchTerm ? 'No users match your search criteria.' : 'Create your first user to get started.'}
                        className="border-0"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  users?.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium px-4 py-3">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {user.firstName} {user.lastName}
                        </div>
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        <div className="flex flex-col items-left gap-2">
                          <div className=" text-gray-900 font-medium truncate">
                            {user.area?.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {user.area?.city}, {user.area?.state}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        <div className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                          {user.password || user.tempPassword || 'Not Set'}
                        </div>
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-900 truncate">+91 {user.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-900 truncate">{user.email}</span>
                        </div>
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        {getStatusSwitch(user.isActive, user._id)}
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        <span className="text-sm text-gray-900 truncate">{formatDate(user.createdAt)}</span>
                      </TableCell>

                      <TableCell className="text-right px-4 py-3">
                        <div className="flex items-center justify-end space-x-0.5">
                          {userToDelete && userToDelete._id === user._id ? (
                            // Show confirmation buttons
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={cancelDeleteUser}
                                disabled={isDeleting}
                                className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900"
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={confirmDeleteUser}
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
                                onClick={() => handleEditUser(user)}
                                className="h-7 w-7 p-0 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
                                title="Edit user"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user)}
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-900 hover:bg-red-50"
                                title="Delete user"
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

      {/* Pagination - Add when we have pagination data */}
      {
        pagination.totalPages > 1 && (
          <Card className="mt-2">
            <CardContent className="p-0">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={pagination.limit}
                onPageChange={setCurrentPage}
                loading={usersLoading}
              />
            </CardContent>
          </Card>
        )
      }

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddUser}
      />

      {/* Edit User Modal */}
      <AddUserModal
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        onSuccess={handleAddUser}
        user={selectedUser}
      />
    </div >
  );
};

export default UserManagement;
